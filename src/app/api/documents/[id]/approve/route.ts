// src/app/api/documents/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { logAudit, notifyStakeholders } from "@/lib/dtms";
import { notify }                    from "@/lib/notify";
import { getClientIp }               from "@/lib/rateLimit";

type Ctx = { params: Promise<{ id: string }> };

// ─── POST /api/documents/[id]/approve ────────────────────────────────────────
// Body: { action: "APPROVED"|"REJECTED", remarks }
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const user   = session.user as any;

  const body   = await req.json();
  const { action, remarks } = body;

  if (!["APPROVED", "REJECTED"].includes(action))
    return NextResponse.json({ error: "action must be APPROVED or REJECTED" }, { status: 400 });

  // Find the current version
  const doc = await prisma.document.findUnique({
    where:   { id, isDeleted: false },
    include: {
      versions: {
        where:  { isCurrentVersion: true },
        take:   1,
        include: {
          signatories: {
            orderBy: { order: "asc" },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
      },
    },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const currentVersion = doc.versions[0];
  if (!currentVersion) return NextResponse.json({ error: "No current version" }, { status: 400 });

  // Find this user's signatory entry
  const myEntry = currentVersion.signatories.find((s) => s.userId === user.id);
  if (!myEntry) return NextResponse.json({ error: "You are not a signatory on this document" }, { status: 403 });
  if (myEntry.status !== "PENDING") return NextResponse.json({ error: "You have already acted on this document" }, { status: 409 });

  // Check sequential order — can't approve out of turn
  const pendingBefore = currentVersion.signatories.filter(
    (s) => s.order < myEntry.order && s.status === "PENDING",
  );
  if (pendingBefore.length > 0)
    return NextResponse.json({ error: "Earlier signatories have not yet approved" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    // Update signatory record
    await tx.signatory.update({
      where: { id: myEntry.id },
      data:  {
        status:   action,
        signedAt: new Date(),
        remarks:  remarks ?? null,
      },
    });

    // Log route action
    const userRecord = await tx.user.findUnique({ where: { id: user.id }, select: { departmentId: true } });
    await tx.documentRoute.create({
      data: {
        documentVersionId: currentVersion.id,
        fromDepartmentId:  userRecord?.departmentId ?? null,
        toDepartmentId:    doc.originDepartmentId,
        fromUserId:        user.id,
        toUserId:          doc.createdById,
        action,
        remarks:           remarks ?? null,
      },
    });

    if (action === "REJECTED") {
      // Rejection immediately updates doc status
      await tx.document.update({
        where: { id },
        data:  { status: "REJECTED", updatedAt: new Date() },
      });
    } else {
      // Check if ALL signatories have approved
      const remainingPending = currentVersion.signatories.filter(
        (s) => s.id !== myEntry.id && s.status === "PENDING",
      );
      if (remainingPending.length === 0) {
        await tx.document.update({
          where: { id },
          data:  { status: "APPROVED", updatedAt: new Date() },
        });
      } else {
        // Update status to FOR_APPROVAL if not already
        await tx.document.update({
          where: { id },
          data:  { status: "FOR_APPROVAL", updatedAt: new Date() },
        });
        // Notify next signatory
        const nextSignatory = currentVersion.signatories
          .filter((s) => s.id !== myEntry.id && s.status === "PENDING")
          .sort((a, b) => a.order - b.order)[0];
        if (nextSignatory) {
          await notify({
            userId: nextSignatory.userId,
            type:   "APPROVAL_REQUIRED",
            title:  `Approval Required: ${doc.trackingNumber}`,
            body:   `Document "${currentVersion.subject}" requires your approval.`,
            link:   `/documents/${id}`,
          });
        }
      }
    }
  });

  await logAudit({
    userId:    user.id,
    action:    action === "APPROVED" ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED",
    entity:    "Signatory",
    entityId:  myEntry.id,
    metadata:  { documentId: id, remarks },
    ipAddress: getClientIp(req),
  });

  // Notify creator & stakeholders
  await notifyStakeholders({
    documentId:     id,
    trackingNumber: doc.trackingNumber,
    subject:        currentVersion.subject,
    type:           action === "APPROVED" ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED",
    title:          `Document ${action}: ${doc.trackingNumber}`,
    body:           `${currentVersion.subject} has been ${action.toLowerCase()} by ${user.name ?? user.username}${remarks ? `. Remarks: ${remarks}` : "."}`,
    link:           `/documents/${id}`,
    excludeUserId:  user.id,
  });

  return NextResponse.json({ ok: true });
}
