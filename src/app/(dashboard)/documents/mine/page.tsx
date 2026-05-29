"use client";

// src/app/(dashboard)/documents/mine/page.tsx
import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { ChevronRight, FileText, FilePlus } from "lucide-react";
import Link                    from "next/link";
import { formatRelative }      from "@/lib/utils";
import { STATUS_COLORS, PRIORITY_COLORS } from "@/lib/dtms";
import { cn }                  from "@/lib/utils";
import { TableSkeleton }       from "@/components/ui";
import { MotionPage }          from "@/components/motion/MotionPage";
import { motion }              from "framer-motion";

interface Doc {
  id:             string;
  trackingNumber: string;
  status:         string;
  priority:       string;
  updatedAt:      string;
  createdAt:      string;
  originDepartment: { name: string; code: string };
  versions:       { subject: string; versionNumber: number }[];
}

export default function MyDocumentsPage() {
  const router = useRouter();
  const [docs, setDocs]       = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Filter docs created by the current user (API handles this via createdById scope)
    fetch("/api/documents?pageSize=100")
      .then((r) => r.json())
      .then((d) => { setDocs(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <MotionPage>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-700 text-xl text-[var(--text-primary)]">My Documents</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Documents you created or are involved in</p>
        </div>
        <Link href="/documents/create" className="btn-primary">
          <FilePlus size={14} /> New
        </Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : docs.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={36} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
            <p className="font-500 text-[var(--text-secondary)]">No documents yet</p>
            <Link href="/documents/create" className="btn-primary mt-4 inline-flex"><FilePlus size={14} /> Create Document</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking No.</th>
                <th>Subject</th>
                <th>Origin</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, i) => (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="cursor-pointer"
                  onClick={() => router.push(`/documents/${doc.id}`)}
                >
                  <td><span className="font-mono text-xs text-[var(--accent)] font-600">{doc.trackingNumber}</span></td>
                  <td><p className="font-500 text-sm max-w-[240px] truncate">{doc.versions[0]?.subject ?? "—"}</p></td>
                  <td><span className="badge bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs">{doc.originDepartment.code}</span></td>
                  <td><span className={cn("badge text-xs", STATUS_COLORS[doc.status])}>{doc.status.replace(/_/g, " ")}</span></td>
                  <td><span className={cn("badge text-xs", PRIORITY_COLORS[doc.priority])}>{doc.priority}</span></td>
                  <td className="text-xs text-[var(--text-muted)]">{formatRelative(doc.updatedAt)}</td>
                  <td><ChevronRight size={14} className="text-[var(--text-muted)]" /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MotionPage>
  );
}
