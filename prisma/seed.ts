import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DTMS database…");

  // ── Departments ──────────────────────────────────────────────────────────
  const depts = await Promise.all([
    prisma.department.upsert({
      where:  { code: "EXEC" },
      update: {},
      create: { name: "Office of the President", code: "EXEC", description: "Executive Office" },
    }),
    prisma.department.upsert({
      where:  { code: "LEGAL" },
      update: {},
      create: { name: "Legal Department", code: "LEGAL", description: "Legal Affairs & Compliance" },
    }),
    prisma.department.upsert({
      where:  { code: "FINANCE" },
      update: {},
      create: { name: "Finance Department", code: "FINANCE", description: "Financial Management" },
    }),
    prisma.department.upsert({
      where:  { code: "HR" },
      update: {},
      create: { name: "Human Resources", code: "HR", description: "HR & Administration" },
    }),
    prisma.department.upsert({
      where:  { code: "IT" },
      update: {},
      create: { name: "Information Technology", code: "IT", description: "IT & Systems" },
    }),
    prisma.department.upsert({
      where:  { code: "OPS" },
      update: {},
      create: { name: "Operations", code: "OPS", description: "Operations & Facilities" },
    }),
  ]);

  const [exec, legal, finance, hr, it, ops] = depts;

  console.log(`  ✓ ${depts.length} departments`);

  // ── Users ────────────────────────────────────────────────────────────────
  const hash = (p: string) => bcrypt.hash(p, 10);

  const superAdmin = await prisma.user.upsert({
    where:  { username: "superadmin" },
    update: {},
    create: {
      username:     "superadmin",
      email:        "superadmin@npc.gov.ph",
      password:     await hash("Admin@1234"),
      firstName:    "System",
      lastName:     "Administrator",
      role:         "SUPER_ADMIN",
      accessLevel:  4,
      departmentId: exec.id,
    },
  });

  const deptAdmin = await prisma.user.upsert({
    where:  { username: "legal.admin" },
    update: {},
    create: {
      username:     "legal.admin",
      email:        "legal.admin@npc.gov.ph",
      password:     await hash("Admin@1234"),
      firstName:    "Maria",
      lastName:     "Santos",
      role:         "DEPT_ADMIN",
      accessLevel:  3,
      departmentId: legal.id,
    },
  });

  const signatory1 = await prisma.user.upsert({
    where:  { username: "j.reyes" },
    update: {},
    create: {
      username:     "j.reyes",
      email:        "j.reyes@npc.gov.ph",
      password:     await hash("Staff@1234"),
      firstName:    "Jose",
      lastName:     "Reyes",
      role:         "SIGNATORY",
      accessLevel:  2,
      departmentId: finance.id,
    },
  });

  const signatory2 = await prisma.user.upsert({
    where:  { username: "a.cruz" },
    update: {},
    create: {
      username:     "a.cruz",
      email:        "a.cruz@npc.gov.ph",
      password:     await hash("Staff@1234"),
      firstName:    "Ana",
      lastName:     "Cruz",
      role:         "SIGNATORY",
      accessLevel:  2,
      departmentId: exec.id,
    },
  });

  const staff1 = await prisma.user.upsert({
    where:  { username: "b.garcia" },
    update: {},
    create: {
      username:     "b.garcia",
      email:        "b.garcia@npc.gov.ph",
      password:     await hash("Staff@1234"),
      firstName:    "Ben",
      lastName:     "Garcia",
      role:         "STAFF",
      accessLevel:  2,
      departmentId: hr.id,
    },
  });

  const viewer1 = await prisma.user.upsert({
    where:  { username: "c.lim" },
    update: {},
    create: {
      username:     "c.lim",
      email:        "c.lim@npc.gov.ph",
      password:     await hash("Staff@1234"),
      firstName:    "Carla",
      lastName:     "Lim",
      role:         "VIEWER",
      accessLevel:  1,
      departmentId: ops.id,
    },
  });

  console.log("  ✓ 6 users");

  // ── Sample Document with full workflow ───────────────────────────────────
  const now = new Date();

  // Generate tracking number
  const year    = now.getFullYear();
  const counter = String(1).padStart(6, "0");
  const trackingNumber = `DTS-${year}-${counter}`;

  const existingDoc = await prisma.document.findUnique({ where: { trackingNumber } });

  if (!existingDoc) {
    const doc = await prisma.document.create({
      data: {
        trackingNumber,
        originDepartmentId:  legal.id,
        createdById:         deptAdmin.id,
        currentHolderId:     signatory1.id,
        currentHolderDeptId: finance.id,
        status:              "FOR_APPROVAL",
        priority:            "HIGH",
        confidentiality:     "INTERNAL",
        addressees: {
          create: [
            { departmentId: finance.id },
            { userId: signatory1.id },
          ],
        },
      },
    });

    // Version 1
    const v1 = await prisma.documentVersion.create({
      data: {
        documentId:       doc.id,
        versionNumber:    1,
        subject:          "Request for Legal Opinion on Procurement Contract No. 2025-001",
        body:             "This memorandum seeks a formal legal opinion regarding the terms and conditions of Procurement Contract No. 2025-001 entered into between NPC and XYZ Contractors Inc. The Legal Department is requested to review the indemnification clause and force majeure provisions.",
        remarks:          "Initial submission",
        isCurrentVersion: true,
        createdById:      deptAdmin.id,
      },
    });

    // Routing history
    await prisma.documentRoute.createMany({
      data: [
        {
          documentVersionId: v1.id,
          fromDepartmentId:  legal.id,
          toDepartmentId:    finance.id,
          fromUserId:        deptAdmin.id,
          toUserId:          signatory1.id,
          action:            "FORWARDED",
          remarks:           "For review and endorsement",
          timestamp:         new Date(now.getTime() - 3600_000),
        },
        {
          documentVersionId: v1.id,
          fromDepartmentId:  finance.id,
          toDepartmentId:    finance.id,
          fromUserId:        signatory1.id,
          toUserId:          signatory1.id,
          action:            "RECEIVED",
          remarks:           "Document received",
          timestamp:         new Date(now.getTime() - 1800_000),
        },
      ],
    });

    // Signatories
    await prisma.signatory.createMany({
      data: [
        {
          documentVersionId: v1.id,
          userId:            signatory1.id,
          order:             1,
          status:            "PENDING",
        },
        {
          documentVersionId: v1.id,
          userId:            signatory2.id,
          order:             2,
          status:            "PENDING",
        },
      ],
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId:   deptAdmin.id,
        action:   "DOCUMENT_CREATED",
        entity:   "Document",
        entityId: doc.id,
        metadata: { trackingNumber, status: "DRAFT" },
      },
    });

    console.log(`  ✓ Sample document: ${trackingNumber}`);
  }

  // ── System settings ──────────────────────────────────────────────────────
  const settingsCount = await prisma.systemSettings.count();
  if (settingsCount === 0) {
    await prisma.systemSettings.create({
      data: { orgName: "National Power Corporation", orgAddress: "Quezon Avenue, Diliman, Quezon City" },
    });
  }

  console.log("✅ Seed complete!");
  console.log("\n📋 Default credentials:");
  console.log("  Super Admin : superadmin / Admin@1234");
  console.log("  Dept Admin  : legal.admin / Admin@1234");
  console.log("  Signatory   : j.reyes / Staff@1234");
  console.log("  Staff       : b.garcia / Staff@1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
