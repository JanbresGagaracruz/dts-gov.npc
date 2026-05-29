import { prisma } from "@/lib/prisma";

interface NotifyParams {
  userId: string;
  type:   string;
  title:  string;
  body:   string;
  link?:  string;
}

export async function notify({ userId, type, title, body, link }: NotifyParams) {
  const notification = await (prisma as any).notification.create({
    data: { userId, type, title, body, link: link ?? null },
  });

  const io = (global as any)._io;
  if (io) {
    io.to(`user:${userId}`).emit("notification", {
      id:        notification.id,
      type,
      title,
      body,
      link:      link ?? null,
      isRead:    false,
      createdAt: notification.createdAt,
    });
  }

  return notification;
}

export async function notifyAdmins(params: Omit<NotifyParams, "userId">) {
  const admins = await prisma.user.findMany({
    where: { accessLevel: { gte: 3 }, isActive: true },
    select: { id: true },
  });
  await Promise.allSettled(admins.map((a) => notify({ ...params, userId: a.id })));
}

export async function notifyWarehouseManagers(warehouseId: string, params: Omit<NotifyParams, "userId">) {
  // Exclude admins (accessLevel >= 3) — they already receive these via notifyAdmins
  const managers = await prisma.user.findMany({
    where: { assignedWarehouseId: warehouseId, isActive: true, accessLevel: { lt: 3 } },
    select: { id: true },
  });
  await Promise.allSettled(managers.map((m) => notify({ ...params, userId: m.id })));
}
