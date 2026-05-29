// src/lib/wms.service.ts
// Core WMS business logic - inventory updates, ledger creation, scan processing

import { prisma } from "./prisma";
import {
  queueInventoryUpdate,
  checkDuplicateScan,
  cacheInvalidate,
} from "./redis";
import { notifyAdmins, notifyWarehouseManagers } from "./notify";
import { getSettings } from "./settings";

// ─── Reference number generator ──────────────────────────────────────────────
export function generateRefNo(prefix: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

// ─── Resolve warehouse from user/device ──────────────────────────────────────
export async function resolveWarehouse(
  userId: string,
  deviceId?: string,
  overrideWarehouseId?: string,
): Promise<string | null> {
  // Priority 1: Scanner device
  if (deviceId) {
    const device = await prisma.scannerDevice.findUnique({
      where: { id: deviceId, isActive: true },
    });
    if (device) return device.warehouseId;
  }

  // Priority 2: User assigned warehouse
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.assignedWarehouseId) return user.assignedWarehouseId;

  // Priority 3: Manual override (ADMIN only)
  if (overrideWarehouseId) return overrideWarehouseId;

  return null;
}

// ─── Process a scan ──────────────────────────────────────────────────────────
export async function processScan(params: {
  warehouseId: string;
  productId: string;
  qty: number;
  scanType: "IN" | "OUT" | "TRANSFER_IN" | "TRANSFER_OUT" | "ADJUSTMENT";
  scannedBy: string;
  deviceId?: string;
  referenceId?: string;
  remarks?: string;
  binLocationId?: string;
}) {
  const { warehouseId, productId, qty, scanType, scannedBy, deviceId, referenceId, remarks, binLocationId } = params;

  // 1. Check duplicate
  const isDup = await checkDuplicateScan(warehouseId, productId, scanType);
  if (isDup) throw new Error("DUPLICATE_SCAN");

  // 2. Validate product
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "ACTIVE") throw new Error("PRODUCT_NOT_FOUND");
  if ((product as any).hasPendingChange) throw new Error("PRODUCT_PENDING_CHANGE");

  // 2b. Block OUT scans for items committed to an active transfer from this warehouse
  if ((scanType === "OUT" || scanType === "TRANSFER_OUT") && !referenceId) {
    const frozen = await (prisma as any).transferItem.findFirst({
      where: {
        productId,
        transfer: {
          fromWarehouseId: warehouseId,
          status: { in: ["PENDING", "APPROVED", "IN_TRANSIT"] },
        },
      },
      include: { transfer: { select: { referenceNo: true, status: true } } },
    });
    if (frozen) throw new Error(`PRODUCT_IN_TRANSFER:${frozen.transfer.referenceNo}:${frozen.transfer.status}`);
  }

  // 3. Validate warehouse
  const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!warehouse || warehouse.status !== "ACTIVE") throw new Error("WAREHOUSE_NOT_FOUND");

  // 4. Determine direction
  const isIn  = ["IN", "TRANSFER_IN", "ADJUSTMENT"].includes(scanType) && qty > 0;
  const isOut = ["OUT", "TRANSFER_OUT"].includes(scanType) || (scanType === "ADJUSTMENT" && qty < 0);
  const absQty = Math.abs(qty);

  // 5. Stock check BEFORE writing anything — prevents phantom scan log entries
  let beforeQty: number | null = null;
  if (isOut) {
    const current = await prisma.inventory.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
      select: { quantity: true },
    });
    if (!current || current.quantity < absQty) throw new Error("INSUFFICIENT_STOCK");
    beforeQty = current.quantity;
  }

  // 6. All writes in a single transaction — scan log + inventory + ledger are atomic
  const refNo    = referenceId || generateRefNo(scanType.slice(0, 3));
  const txTypeMap: Record<string, string> = {
    IN: "STOCK_IN", OUT: "STOCK_OUT",
    TRANSFER_IN: "TRANSFER_IN", TRANSFER_OUT: "TRANSFER_OUT",
    ADJUSTMENT: "ADJUSTMENT",
  };

  const { scanLog, inventory } = await prisma.$transaction(async (tx) => {
    const scanLog = await (tx as any).scanLog.create({
      data: { warehouseId, productId, qty, scanType, scannedBy, deviceId: deviceId || null, referenceId: referenceId || null },
    });

    const inventory = await (tx as any).inventory.upsert({
      where:  { productId_warehouseId: { productId, warehouseId } },
      create: { productId, warehouseId, quantity: isIn ? absQty : -absQty },
      update: { quantity: { increment: isIn ? absQty : -absQty } },
    });

    await (tx as any).stockLedger.create({
      data: {
        warehouseId, productId,
        referenceNo:     refNo,
        transactionType: txTypeMap[scanType],
        qtyIn:      isIn  ? absQty : 0,
        qtyOut:     isOut ? absQty : 0,
        balanceQty: inventory.quantity,
        remarks:    remarks || null,
        scannedBy,
      },
    });

    // Update bin-level qty when a bin is locked for this scan
    if (binLocationId) {
      const binProduct = await (tx as any).binProduct.findFirst({
        where: { binId: binLocationId, productId },
        select: { id: true },
      });
      if (binProduct) {
        await (tx as any).binProduct.update({
          where: { id: binProduct.id },
          data:  { qty: { increment: isIn ? absQty : -absQty } },
        });
      }
    }

    return { scanLog, inventory };
  });

  // 7. Invalidate caches
  await cacheInvalidate(`inventory:${warehouseId}:*`);
  await cacheInvalidate("dashboard:*");

  // 8. Stock threshold notifications (fire-and-forget, non-blocking)
  if (isOut && beforeQty !== null) {
    const afterQty = inventory.quantity;
    void getSettings().then(({ lowStockThreshold }) => {
      if (afterQty === 0) {
        return Promise.allSettled([
          notifyAdmins({
            type:  "STOCK_OUT_ALERT",
            title: `Out of Stock: ${product.name}`,
            body:  `${product.name} (${product.sku}) is now out of stock at ${warehouse.name}.`,
            link:  `/products/${productId}/stock`,
          }),
          notifyWarehouseManagers(warehouseId, {
            type:  "STOCK_OUT_ALERT",
            title: `Out of Stock: ${product.name}`,
            body:  `${product.name} (${product.sku}) is now out of stock at ${warehouse.name}.`,
            link:  `/products/${productId}/stock`,
          }),
        ]);
      } else if (afterQty <= lowStockThreshold && beforeQty! > lowStockThreshold) {
        return Promise.allSettled([
          notifyAdmins({
            type:  "STOCK_LOW_ALERT",
            title: `Low Stock: ${product.name}`,
            body:  `${product.name} (${product.sku}) has ${afterQty} unit${afterQty !== 1 ? "s" : ""} remaining at ${warehouse.name}.`,
            link:  `/products/${productId}/stock`,
          }),
          notifyWarehouseManagers(warehouseId, {
            type:  "STOCK_LOW_ALERT",
            title: `Low Stock: ${product.name}`,
            body:  `${product.name} (${product.sku}) has ${afterQty} unit${afterQty !== 1 ? "s" : ""} remaining at ${warehouse.name}.`,
            link:  `/products/${productId}/stock`,
          }),
        ]);
      }
    });
  }

  return { scanLog, inventory };
}

// ─── Stock Ledger running balance ─────────────────────────────────────────────
export async function getLedgerWithBalance(
  warehouseId: string,
  productId: string,
  page = 1,
  pageSize = 20,
) {
  const [entries, total] = await Promise.all([
    prisma.stockLedger.findMany({
      where: { warehouseId, productId },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stockLedger.count({ where: { warehouseId, productId } }),
  ]);
  return { entries, total };
}

// ─── Create Transfer ──────────────────────────────────────────────────────────
export async function createTransfer(params: {
  fromWarehouseId: string;
  toWarehouseId: string;
  requestedBy: string;
  items: { productId: string; qty: number }[];
  remarks?: string;
}) {
  const refNo = generateRefNo("TRF");
  const transfer = await prisma.transfer.create({
    data: {
      referenceNo: refNo,
      fromWarehouseId: params.fromWarehouseId,
      toWarehouseId: params.toWarehouseId,
      status: "PENDING",
      requestedBy: params.requestedBy,
      remarks: params.remarks || null,
      items: {
        create: params.items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
        })),
      },
    },
    include: { items: true },
  });
  return transfer;
}

// ─── Dashboard analytics ──────────────────────────────────────────────────────
export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { lowStockThreshold } = await getSettings();

  const [
    totalProducts,
    totalWarehouses,
    totalDepartments,
    totalDivisions,
    inventoryAgg,
    lowStockCount,
    pendingTransfers,
    completedTransfers,
    todayScans,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.warehouse.count({ where: { status: "ACTIVE" } }),
    prisma.department.count(),
    prisma.division.count(),
    prisma.inventory.aggregate({ _sum: { quantity: true } }),
    prisma.inventory.count({ where: { quantity: { lte: lowStockThreshold, gt: 0 } } }),
    prisma.transfer.count({ where: { status: "PENDING" } }),
    prisma.transfer.count({ where: { status: "COMPLETED" } }),
    prisma.scanLog.count({ where: { createdAt: { gte: today } } }),
  ]);

  return {
    totalProducts,
    totalWarehouses,
    totalDepartments,
    totalDivisions,
    totalInventoryQty: inventoryAgg._sum.quantity ?? 0,
    lowStockItems:    lowStockCount,
    pendingTransfers,
    completedTransfers,
    todayScans,
  };
}
