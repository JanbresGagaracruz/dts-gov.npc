import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerLevel = (session.user as any).accessLevel ?? 1;
  if (callerLevel < 3)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;

  // Fetch the target user to check their current access level
  const target = await (prisma.user as any).findUnique({ where: { id }, select: { accessLevel: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Cannot modify a user with equal or higher access level (unless you are Super Admin modifying yourself)
  if (target.accessLevel > callerLevel)
    return NextResponse.json({ error: "Cannot modify a user with higher access level" }, { status: 403 });
  // Super Admins (level 4) can edit peers; levels below cannot modify peers
  if (target.accessLevel === callerLevel && callerLevel < 4 && id !== session.user.id)
    return NextResponse.json({ error: "Cannot modify a user with equal access level" }, { status: 403 });

  const body = await req.json();
  const update: any = {};

  if ("newPassword" in body) {
    if (!body.newPassword || body.newPassword.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    update.password = await bcrypt.hash(body.newPassword, 10);
  }

  if ("enable" in body)               update.isActive            = body.enable;
  if ("assignedWarehouseId" in body)  update.assignedWarehouseId = body.assignedWarehouseId || null;
  if ("scopeDepartmentId" in body)    update.scopeDepartmentId   = body.scopeDepartmentId || null;
  if ("scopeDivisionId" in body)      update.scopeDivisionId     = body.scopeDivisionId   || null;

  // Role and accessLevel changes require admin; cap at caller's own level
  if ("role" in body)        update.role        = body.role;
  if ("accessLevel" in body) {
    const newLevel = parseInt(body.accessLevel);
    if (isNaN(newLevel) || newLevel < 1 || newLevel > 4)
      return NextResponse.json({ error: "Invalid accessLevel" }, { status: 400 });
    if (newLevel > callerLevel)
      return NextResponse.json({ error: "Cannot elevate a user beyond your own access level" }, { status: 403 });
    update.accessLevel = newLevel;
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  await (prisma.user as any).update({ where: { id }, data: update });

  // Force the affected user to re-login so their new scope/role is reflected in their session
  const scopeChanged =
    "assignedWarehouseId" in body ||
    "scopeDepartmentId"   in body ||
    "scopeDivisionId"     in body ||
    "role"                in body ||
    "accessLevel"         in body;
  if (scopeChanged) {
    try { await redis.setex(`force_logout:${id}`, 86400, "1"); } catch {}
  }

  return NextResponse.json({ ok: true });
}
