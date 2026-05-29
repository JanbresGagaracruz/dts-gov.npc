// src/app/api/documents/[id]/route-action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { canAccessDocument, logAudit, notifyStakeholders } from "@/lib/dtms";
import { notify }                    from "@/lib/notify";
import { getClientIp }               from "@/lib/rateLimit";

type Ctx = { params: Promise<{ id: string }> };

// ─── POST /api/documents/[id]/route-action ────────────────────────────────────
// Body: { action, toDepartmentId, toUserId, remarks }
// action: FORWARDED | RECEIVED | RETURNED | COMPLETED
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const user   = session.user as any;
  const level  = user.accessLevel as number;

  if (level < 2) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const canAccess = await canAccessDocument(user.id, level, id);
  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body                                     = await req.json();
  const { action, toDepartmentId, toUserId, remarks } = body;

  const VALID_ACTIONS = ["FORWARDED", "RECEIVED", "RETURNED", "COMPLETED"];
  if (!action || !VALID_ACTIONS.includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  // Get doc + current version
  const doc = await prisma.document.findUnique({
    where:   { id, isDeleted: false },
    include: {
      versions: {
        where:  { isCurrentVersion: true },
        take:   1,
        select: { id: true, subject: true },
      },
    },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const currentVersion = doc.versions[0];
  if (!currentVersion) return NextResponse.json({ error: "No current version" }, { status: 400 });

  const userRecord = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { departmentId: true },
  });

  // Determine new status
  const newStatus: Record<string, string> = {
    FORWARDED: "IN_PROGRESS",
    RECEIVED:  "IN_PROGRESS",
    RETURNED:  "IN_PROGRESS",
    COMPLETED: "COMPLETED",
  };

  await prisma.$transaction(async (tx) => {
    // Log the route
    await tx.documentRoute.create({
      data: {
        documentVersionId: currentVersion.id,
        fromDepartmentId:  userRecord?.departmentId ?? null,
        toDepartmentId:    toDepartmentId           ?? null,
        fromUserId:        user.id,
        toUserId:          toUserId                 ?? null,
        action,
        remarks:           remarks ?? null,
      },
    });

    // Update document current holder + status
    await tx.document.update({
      where: { id },
      data:  {
        status:              newStatus[action],
        currentHolderId:     toUserId          ?? user.id,
        currentHolderDeptId: toDepartmentId    ?? userRecord?.departmentId ?? null,
        updatedAt:           new Date(),
      },
    });
  });

  await logAudit({
    userId:    user.id,
    action:    `DOCUMENT_${action}`,
    entity:    "Document",
    entityId:  id,
    metadata:  { action, toDepartmentId, toUserId, remarks },
    ipAddress: getClientIp(req),
  });

  // Notify the recipient
  if (toUserId && toUserId !== user.id) {
    await notify({
      userId: toUserId,
      type:   "DOCUMENT_ROUTED",
      title:  `Document ${action === "FORWARDED" ? "Forwarded to You" : action}: ${doc.trackingNumber}`,
      body:   `${currentVersion.subject} has been ${action.toLowerCase()} to you${remarks ? `. Note: ${remarks}` : "."}`,
      link:   `/documents/${id}`,
    });
  }

  return NextResponse.json({ ok: true });
}
