// src/lib/notify.ts
import { prisma } from "@/lib/prisma";

interface NotifyParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
}

export async function notify({
  userId,
  type,
  title,
  body,
  link,
}: NotifyParams) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link: link ?? null },
  });

  const io = (global as any)._io;
  if (io) {
    io.to(`user:${userId}`).emit("notification", {
      id: notification.id,
      type,
      title,
      body,
      link: link ?? null,
      isRead: false,
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
  await Promise.allSettled(
    admins.map((a) => notify({ ...params, userId: a.id })),
  );
}

export async function notifyDepartment(
  departmentId: string,
  params: Omit<NotifyParams, "userId">,
  excludeUserId?: string,
) {
  const members = await prisma.user.findMany({
    where: { departmentId, isActive: true },
    select: { id: true },
  });
  await Promise.allSettled(
    members
      .filter((m) => m.id !== excludeUserId)
      .map((m) => notify({ ...params, userId: m.id })),
  );
}
