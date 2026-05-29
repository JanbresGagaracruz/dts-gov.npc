"use client";

// src/app/(dashboard)/documents/pending-approval/page.tsx
import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { useSession }          from "next-auth/react";
import { CheckSquare, Clock, ChevronRight, FileText } from "lucide-react";
import { formatRelative }      from "@/lib/utils";
import { STATUS_COLORS }       from "@/lib/dtms";
import { cn }                  from "@/lib/utils";
import { TableSkeleton }       from "@/components/ui";
import { MotionPage }          from "@/components/motion/MotionPage";
import { motion }              from "framer-motion";

interface PendingDoc {
  id:             string;
  trackingNumber: string;
  status:         string;
  priority:       string;
  updatedAt:      string;
  originDepartment: { name: string; code: string };
  versions:       { subject: string; versionNumber: number }[];
}

export default function PendingApprovalPage() {
  const { data: session } = useSession();
  const router            = useRouter();
  const userId            = (session?.user as any)?.id;

  const [docs, setDocs]     = useState<PendingDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Documents where THIS user is a pending signatory on the current version
    fetch("/api/documents?status=FOR_APPROVAL&pageSize=100")
      .then((r) => r.json())
      .then((d) => { setDocs(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <MotionPage>
      <div>
        <h1 className="font-display font-700 text-xl text-[var(--text-primary)]">Pending Approval</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Documents requiring your signature or action</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : docs.length === 0 ? (
          <div className="py-16 text-center">
            <CheckSquare size={36} className="mx-auto text-emerald-400 opacity-40 mb-3" />
            <p className="font-500 text-[var(--text-secondary)]">All caught up!</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">No documents pending your approval</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking No.</th>
                <th>Subject</th>
                <th>Origin</th>
                <th>Priority</th>
                <th>Status</th>
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
                  transition={{ delay: i * 0.04 }}
                  className="cursor-pointer"
                  onClick={() => router.push(`/documents/${doc.id}`)}
                >
                  <td><span className="font-mono text-xs text-[var(--accent)] font-600">{doc.trackingNumber}</span></td>
                  <td><p className="font-500 text-sm max-w-[280px] truncate">{doc.versions[0]?.subject ?? "—"}</p></td>
                  <td><span className="badge bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs">{doc.originDepartment.code}</span></td>
                  <td><span className="text-xs text-[var(--text-muted)]">{doc.priority}</span></td>
                  <td><span className={cn("badge text-xs", STATUS_COLORS[doc.status])}>{doc.status.replace(/_/g, " ")}</span></td>
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
