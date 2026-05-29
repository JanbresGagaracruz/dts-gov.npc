// src/app/api/audit-trail/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user  = session.user as any;
  const level = user.accessLevel as number;
  if (level < 3) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page")     || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "30");
  const action   = searchParams.get("action") || "";
  const entity   = searchParams.get("entity") || "";

  const where: any = {};
  if (action) where.action = action;
  if (entity) where.entity = entity;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: { user: { select: { id: true, firstName: true, lastName: true, username: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ data: logs, total, page, pageSize });
}
