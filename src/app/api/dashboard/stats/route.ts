// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user    = session.user as any;
  const userId  = user.id as string;
  const level   = user.accessLevel as number;

  const userRecord = await prisma.user.findUnique({
    where:  { id: userId },
    select: { departmentId: true },
  });
  const myDeptId = userRecord?.departmentId ?? null;

  // Scope filter for non-admins
  const scopeFilter: any = level >= 3 ? {} : {
    OR: [
      { createdById:         userId },
      { currentHolderId:     userId },
      { addressees: { some: { userId } } },
      ...(myDeptId ? [
        { originDepartmentId:  myDeptId },
        { currentHolderDeptId: myDeptId },
        { addressees: { some: { departmentId: myDeptId } } },
      ] : []),
    ],
  };

  const baseWhere = { isDeleted: false, ...scopeFilter };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    total,
    draft,
    inProgress,
    forApproval,
    approved,
    rejected,
    completed,
    createdToday,
    pendingApprovals,
    totalDepts,
    totalUsers,
  ] = await Promise.all([
    prisma.document.count({ where: baseWhere }),
    prisma.document.count({ where: { ...baseWhere, status: "DRAFT" } }),
    prisma.document.count({ where: { ...baseWhere, status: "IN_PROGRESS" } }),
    prisma.document.count({ where: { ...baseWhere, status: "FOR_APPROVAL" } }),
    prisma.document.count({ where: { ...baseWhere, status: "APPROVED" } }),
    prisma.document.count({ where: { ...baseWhere, status: "REJECTED" } }),
    prisma.document.count({ where: { ...baseWhere, status: "COMPLETED" } }),
    prisma.document.count({ where: { ...baseWhere, createdAt: { gte: today } } }),
    // Pending approvals for the current user
    prisma.signatory.count({
      where: {
        userId,
        status: "PENDING",
        documentVersion: { isCurrentVersion: true },
      },
    }),
    level >= 3 ? prisma.department.count({ where: { isActive: true } }) : Promise.resolve(null),
    level >= 3 ? prisma.user.count({ where: { isActive: true } })       : Promise.resolve(null),
  ]);

  // Recent activity (last 10 audit logs for admins; last 5 for others)
  const recentActivity = await prisma.auditLog.findMany({
    where:   level >= 3 ? {} : { userId },
    orderBy: { timestamp: "desc" },
    take:    level >= 3 ? 10 : 5,
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json({
    documents: { total, draft, inProgress, forApproval, approved, rejected, completed, createdToday },
    pendingApprovals,
    system: level >= 3 ? { totalDepts, totalUsers } : null,
    recentActivity,
  });
}
