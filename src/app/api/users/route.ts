// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "15");
  const search = searchParams.get("search") || "";
  const deptFilter = searchParams.get("dept") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (deptFilter) where.departmentId = deptFilter;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { department: { select: { id: true, name: true, code: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  const data = users.map((u) => ({
    UserID: u.id,
    UsrNam: u.username,
    DisplayName:
      [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username,
    Firstname: u.firstName || "",
    Lastname: u.lastName || "",
    Email: u.email || "",
    role: u.role || "VIEWER",
    accessLevel: u.accessLevel ?? 1,
    enable: u.isActive,
    dtEntered: u.createdAt,
    department: u.department ?? null,
    departmentId: u.departmentId ?? null,
  }));

  return NextResponse.json({ data, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerLevel = (session.user as any).accessLevel ?? 1;
  if (callerLevel < 3)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limited = await rateLimit(`users:create:${getClientIp(req)}`, 20, 3600);
  if (limited) return limited;

  const body = await req.json();
  const {
    UsrNam,
    password,
    Firstname,
    Lastname,
    Email,
    accessLevel,
    role,
    departmentId,
  } = body;

  if (!UsrNam || !password)
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 },
    );

  const requestedLevel = parseInt(accessLevel || "1");
  if (isNaN(requestedLevel) || requestedLevel < 1 || requestedLevel > 4)
    return NextResponse.json({ error: "Invalid accessLevel" }, { status: 400 });
  if (requestedLevel > callerLevel)
    return NextResponse.json(
      { error: "Cannot create user with higher access level than your own" },
      { status: 403 },
    );

  const emailVal = Email?.trim() || `${UsrNam}@npc.gov.ph`;

  const conflict = await prisma.user.findFirst({
    where: { OR: [{ username: UsrNam }, { email: emailVal }] },
  });
  if (conflict)
    return NextResponse.json(
      {
        error:
          conflict.username === UsrNam
            ? "Username already taken"
            : "Email already in use",
      },
      { status: 409 },
    );

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username: UsrNam,
      email: emailVal,
      password: hashed,
      firstName: Firstname?.trim() || null,
      lastName: Lastname?.trim() || null,
      role: role || "VIEWER",
      accessLevel: requestedLevel,
      isActive: true,
      departmentId: departmentId || null,
    },
  });

  return NextResponse.json(
    { UserID: user.id, UsrNam: user.username },
    { status: 201 },
  );
}
