// src/app/api/documents/[id]/versions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { canAccessDocument, createNewVersion, logAudit, notifyStakeholders } from "@/lib/dtms";
import { getClientIp }               from "@/lib/rateLimit";

type Ctx = { params: Promise<{ id: string }> };

// ─── POST /api/documents/[id]/versions ── create revision ────────────────────
export async function POST(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const user   = session.user as any;
  const level  = user.accessLevel as number;

  if (level < 2) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const canAccess = await canAccessDocument(user.id, level, id);
  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { subject, content, remarks, attachments = [], signatories = [] } = body;

  if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  if (!remarks) return NextResponse.json({ error: "Revision remarks are required" }, { status: 400 });

  const version = await createNewVersion({
    documentId:  id,
    subject,
    body:        content || "",
    remarks,
    createdById: user.id,
    attachments,
  });

  // Add signatories for new version
  if (signatories.length > 0) {
    await prisma.signatory.createMany({
      data: (signatories as any[]).map((s: any, idx: number) => ({
        documentVersionId: version.id,
        userId:            s.userId,
        order:             s.order ?? idx + 1,
        status:            "PENDING",
      })),
    });
  }

  const doc = await prisma.document.findUnique({
    where:  { id },
    select: { trackingNumber: true },
  });

  await logAudit({
    userId:    user.id,
    action:    "VERSION_CREATED",
    entity:    "DocumentVersion",
    entityId:  version.id,
    metadata:  { documentId: id, versionNumber: version.versionNumber, remarks },
    ipAddress: getClientIp(req),
  });

  // Notify all stakeholders that document was revised
  await notifyStakeholders({
    documentId:     id,
    trackingNumber: doc?.trackingNumber ?? "",
    subject,
    type:           "DOCUMENT_REVISED",
    title:          `Document Revised: ${doc?.trackingNumber}`,
    body:           `A new version (v${version.versionNumber}) has been created. Reason: ${remarks}`,
    link:           `/documents/${id}`,
    excludeUserId:  user.id,
  });

  return NextResponse.json({ id: version.id, versionNumber: version.versionNumber }, { status: 201 });
}
