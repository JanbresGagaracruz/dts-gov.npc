// src/app/api/documents/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { canAccessDocument, logAudit } from "@/lib/dtms";
import { getClientIp }               from "@/lib/rateLimit";

type Ctx = { params: Promise<{ id: string }> };

// ─── GET /api/documents/[id] ──────────────────────────────────────────────────
export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id }  = await ctx.params;
  const user    = session.user as any;
  const level   = user.accessLevel as number;

  const canAccess = await canAccessDocument(user.id, level, id);
  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const doc = await prisma.document.findUnique({
    where:   { id, isDeleted: false },
    include: {
      originDepartment: true,
      createdBy:  { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      currentHolder: { select: { id: true, firstName: true, lastName: true, email: true } },
      addressees: {
        include: {
          department: { select: { id: true, name: true, code: true } },
          user:       { select: { id: true, firstName: true, lastName: true } },
        },
      },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          createdBy:  { select: { id: true, firstName: true, lastName: true } },
          signatories: {
            orderBy: { order: "asc" },
            include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
          },
          routes: {
            orderBy: { timestamp: "asc" },
            include: {
              fromDepartment: { select: { id: true, name: true, code: true } },
              toDepartment:   { select: { id: true, name: true, code: true } },
              fromUser:       { select: { id: true, firstName: true, lastName: true } },
              toUser:         { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Log view (fire-and-forget)
  logAudit({
    userId:    user.id,
    action:    "DOCUMENT_VIEWED",
    entity:    "Document",
    entityId:  id,
    ipAddress: getClientIp(req),
  }).catch(() => {});

  return NextResponse.json(doc);
}

// ─── PATCH /api/documents/[id] ── update status / metadata ───────────────────
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const user   = session.user as any;
  const level  = user.accessLevel as number;

  const canAccess = await canAccessDocument(user.id, level, id);
  if (!canAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const update: any = {};

  if ("status"          in body) update.status          = body.status;
  if ("priority"        in body) update.priority        = body.priority;
  if ("confidentiality" in body) update.confidentiality = body.confidentiality;
  if ("currentHolderId" in body) {
    update.currentHolderId = body.currentHolderId;
    // Also update holder dept
    if (body.currentHolderDeptId) update.currentHolderDeptId = body.currentHolderDeptId;
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const updated = await prisma.document.update({
    where: { id },
    data:  update,
  });

  await logAudit({
    userId:    user.id,
    action:    "DOCUMENT_UPDATED",
    entity:    "Document",
    entityId:  id,
    metadata:  update,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true, status: updated.status });
}

// ─── DELETE /api/documents/[id] ── soft delete (admin only) ──────────────────
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user  = session.user as any;
  const level = user.accessLevel as number;
  if (level < 3) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;

  await prisma.document.update({
    where: { id },
    data:  { isDeleted: true, deletedAt: new Date() },
  });

  await logAudit({
    userId:   user.id,
    action:   "DOCUMENT_DELETED",
    entity:   "Document",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
