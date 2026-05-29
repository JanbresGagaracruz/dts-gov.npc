// src/lib/dtms.ts
// Core DTMS business logic helpers

import { prisma } from "./prisma";
import { notify } from "./notify";

// ─── Tracking Number Generator ────────────────────────────────────────────────
export async function generateTrackingNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.document.count();
  const seq = String(count + 1).padStart(6, "0");
  return `DTS-${year}-${seq}`;
}

// ─── Audit Logger ─────────────────────────────────────────────────────────────
export async function logAudit(params: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      ipAddress: params.ipAddress ?? null,
    },
  });
}

// ─── Document Access Check ────────────────────────────────────────────────────
export async function canAccessDocument(
  userId: string,
  accessLevel: number,
  documentId: string,
): Promise<boolean> {
  // Super Admin and Dept Admin see everything
  if (accessLevel >= 3) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  });

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      createdById: true,
      originDepartmentId: true,
      currentHolderId: true,
      currentHolderDeptId: true,
      addressees: { select: { userId: true, departmentId: true } },
    },
  });

  if (!doc) return false;

  // Creator always has access
  if (doc.createdById === userId) return true;

  // Current holder
  if (doc.currentHolderId === userId) return true;

  // Same origin department
  if (user?.departmentId && doc.originDepartmentId === user.departmentId)
    return true;

  // Current holder dept
  if (user?.departmentId && doc.currentHolderDeptId === user.departmentId)
    return true;

  // Addressee (user or department)
  const isAddressee = doc.addressees.some(
    (a) =>
      a.userId === userId ||
      (user?.departmentId && a.departmentId === user.departmentId),
  );
  if (isAddressee) return true;

  return false;
}

// ─── Create new document version (invalidates old approval) ──────────────────
export async function createNewVersion(params: {
  documentId: string;
  subject: string;
  body: string;
  remarks: string;
  createdById: string;
  attachments?: string[];
}) {
  const {
    documentId,
    subject,
    body,
    remarks,
    createdById,
    attachments = [],
  } = params;

  return prisma.$transaction(async (tx) => {
    // Mark all existing versions as non-current
    await tx.documentVersion.updateMany({
      where: { documentId },
      data: { isCurrentVersion: false },
    });

    // Get next version number
    const lastVersion = await tx.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
    const nextVersion = (lastVersion?.versionNumber ?? 0) + 1;

    // Create new version
    const version = await tx.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersion,
        subject,
        body,
        remarks,
        attachments,
        isCurrentVersion: true,
        createdById,
      },
    });

    // Reset document status to IN_PROGRESS when revised
    await tx.document.update({
      where: { id: documentId },
      data: { status: "IN_PROGRESS", updatedAt: new Date() },
    });

    return version;
  });
}

// ─── Notify document stakeholders ─────────────────────────────────────────────
export async function notifyStakeholders(params: {
  documentId: string;
  trackingNumber: string;
  subject: string;
  type: string;
  title: string;
  body: string;
  link: string;
  excludeUserId?: string;
}) {
  const { documentId, trackingNumber, type, title, body, link, excludeUserId } =
    params;

  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: {
      createdById: true,
      currentHolderId: true,
      addressees: { select: { userId: true } },
    },
  });

  if (!doc) return;

  const userIds = new Set<string>();
  userIds.add(doc.createdById);
  if (doc.currentHolderId) userIds.add(doc.currentHolderId);
  doc.addressees.forEach((a) => {
    if (a.userId) userIds.add(a.userId);
  });
  if (excludeUserId) userIds.delete(excludeUserId);

  await Promise.allSettled(
    [...userIds].map((uid) => notify({ userId: uid, type, title, body, link })),
  );
}

// ─── Status badge color helper (shared) ───────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/15 text-gray-400",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400",
  FOR_APPROVAL: "bg-amber-500/15 text-amber-400",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
  COMPLETED: "bg-purple-500/15 text-purple-400",
  ARCHIVED: "bg-gray-500/10 text-gray-500",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-500/15 text-gray-400",
  NORMAL: "bg-blue-500/15 text-blue-400",
  HIGH: "bg-amber-500/15 text-amber-400",
  URGENT: "bg-red-500/15 text-red-400",
};
