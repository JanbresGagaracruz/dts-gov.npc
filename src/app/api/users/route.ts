import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page")     || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "15");
  const search   = searchParams.get("search") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { username:  { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName:  { contains: search, mode: "insensitive" } },
      { email:     { contains: search, mode: "insensitive" } },
    ];
  }

  const [userList, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  const warehouseIds = [
    ...new Set(userList.map((u) => u.assignedWarehouseId).filter(Boolean) as string[]),
  ];
  const warehouses = warehouseIds.length > 0
    ? await prisma.warehouse.findMany({
        where: { id: { in: warehouseIds } },
        include: { department: { select: { id: true, name: true, deptInit: true } } },
      })
    : [];
  const whMap = Object.fromEntries(warehouses.map((w) => [w.id, w]));

  const u = userList as any[];
  const data = u.map((user) => {
    const wh = user.assignedWarehouseId ? (whMap[user.assignedWarehouseId] ?? null) : null;
    return {
      UserID:             user.id,
      UsrNam:             user.username,
      DisplayName:        [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username,
      Firstname:          user.firstName || "",
      Lastname:           user.lastName  || "",
      Email:              user.email     || "",
      role:               user.role      || "VIEWER",
      accessLevel:        user.accessLevel ?? 1,
      scopeDepartmentId:  user.scopeDepartmentId || null,
      scopeDivisionId:    user.scopeDivisionId   || null,
      enable:             user.isActive,
      dtEntered:          user.createdAt,
      assignedWarehouseId: user.assignedWarehouseId || null,
      warehouse: wh ? { id: wh.id, code: wh.code, name: wh.name, department: wh.department } : null,
    };
  });

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerLevel = (session.user as any).accessLevel ?? 1;
  if (callerLevel < 3)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Rate limit: 20 account creations per hour per IP
  const limited = await rateLimit(`users:create:${getClientIp(req)}`, 20, 3600);
  if (limited) return limited;

  const body = await req.json();
  const { UsrNam, password, Firstname, Lastname, Email, accessLevel, role, assignedWarehouseId } = body;

  if (!UsrNam || !password)
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });

  // Callers cannot create accounts with higher privilege than their own
  const requestedLevel = parseInt(accessLevel || "1");
  if (isNaN(requestedLevel) || requestedLevel < 1 || requestedLevel > 4)
    return NextResponse.json({ error: "Invalid accessLevel" }, { status: 400 });
  if (requestedLevel > callerLevel)
    return NextResponse.json({ error: "Cannot create a user with higher access level than your own" }, { status: 403 });

  const emailVal = Email?.trim() || `${UsrNam}@spmp-gov.npc`;

  const conflict = await prisma.user.findFirst({
    where: { OR: [{ username: UsrNam }, { email: emailVal }] },
  });
  if (conflict)
    return NextResponse.json(
      { error: conflict.username === UsrNam ? "Username already taken" : "Email already in use" },
      { status: 409 },
    );

  const hashed = await bcrypt.hash(password, 10);
  const user = await (prisma.user as any).create({
    data: {
      username:            UsrNam,
      email:               emailVal,
      password:            hashed,
      firstName:           Firstname?.trim() || null,
      lastName:            Lastname?.trim()  || null,
      role:                role || "VIEWER",
      accessLevel:         requestedLevel,
      isActive:            true,
      assignedWarehouseId: assignedWarehouseId || null,
    },
  });

  return NextResponse.json({ UserID: user.id, UsrNam: user.username }, { status: 201 });
}
