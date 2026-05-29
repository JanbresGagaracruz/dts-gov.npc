// src/app/api/departments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const depts = await prisma.department.findMany({
    where:   { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json({ data: depts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if ((user.accessLevel as number) < 4)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, code, description } = body;

  if (!name || !code) return NextResponse.json({ error: "name and code are required" }, { status: 400 });

  const dept = await prisma.department.create({
    data: { name, code: code.toUpperCase(), description: description ?? null },
  });

  return NextResponse.json(dept, { status: 201 });
}
