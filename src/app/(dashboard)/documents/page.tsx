"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams }       from "next/navigation";
import Link                                  from "next/link";
import { motion, AnimatePresence }           from "framer-motion";
import {
  FilePlus, Search, Filter, ChevronRight,
  FileText, Clock, CheckCircle, XCircle, Send,
  AlertTriangle, Archive,
} from "lucide-react";
import { useSession }    from "next-auth/react";
import { formatDate, formatRelative } from "@/lib/utils";
import { STATUS_COLORS, PRIORITY_COLORS } from "@/lib/dtms";
import { cn }            from "@/lib/utils";
import { Pagination, TableSkeleton } from "@/components/ui";

interface Doc {
  id:              string;
  trackingNumber:  string;
  status:          string;
  priority:        string;
  confidentiality: string;
  createdAt:       string;
  updatedAt:       string;
  originDepartment: { name: string; code: string };
  createdBy:       { firstName: string | null; lastName: string | null };
  currentHolder:   { firstName: string | null; lastName: string | null } | null;
  versions:        { subject: string; versionNumber: number }[];
}

const STATUS_OPTIONS = [
  { value: "",            label: "All Status"   },
  { value: "DRAFT",       label: "Draft"        },
  { value: "IN_PROGRESS", label: "In Progress"  },
  { value: "FOR_APPROVAL",label: "For Approval" },
  { value: "APPROVED",    label: "Approved"     },
  { value: "REJECTED",    label: "Rejected"     },
  { value: "COMPLETED",   label: "Completed"    },
];

const PRIORITY_OPTIONS = [
  { value: "",       label: "All Priority" },
  { value: "LOW",    label: "Low"          },
  { value: "NORMAL", label: "Normal"       },
  { value: "HIGH",   label: "High"         },
  { value: "URGENT", label: "Urgent"       },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  DRAFT:        <FileText    size={13} />,
  IN_PROGRESS:  <Clock       size={13} />,
  FOR_APPROVAL: <AlertTriangle size={13} />,
  APPROVED:     <CheckCircle size={13} />,
  REJECTED:     <XCircle     size={13} />,
  COMPLETED:    <Send        size={13} />,
  ARCHIVED:     <Archive     size={13} />,
};

export default function DocumentsPage() {
  const { data: session } = useSession();
  const router            = useRouter();
  const searchParams      = useSearchParams();
  const level             = (session?.user as any)?.accessLevel ?? 1;

  const [docs, setDocs]         = useState<Doc[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("");
  const [priority, setPriority] = useState("");

  const pageSize = 20;

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(pageSize),
      ...(search   && { search   }),
      ...(status   && { status   }),
      ...(priority && { priority }),
    });
    const res  = await fetch(`/api/documents?${params}`);
    const data = await res.json();
    setDocs(data.data  ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search, status, priority]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, status, priority]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-700 text-xl text-[var(--text-primary)]">All Documents</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{total.toLocaleString()} total documents</p>
        </div>
        {level >= 2 && (
          <Link href="/documents/create" className="btn-primary">
            <FilePlus size={14} /> New Document
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-500 transition-all",
                status === opt.value
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Priority */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="input-field w-36 text-sm"
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by subject or tracking no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : docs.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={36} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
            <p className="font-500 text-[var(--text-secondary)]">No documents found</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking No.</th>
                  <th>Subject</th>
                  <th>Origin Dept</th>
                  <th>Current Holder</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {docs.map((doc, i) => {
                    const subject = doc.versions[0]?.subject ?? "—";
                    const holder  = doc.currentHolder
                      ? [doc.currentHolder.firstName, doc.currentHolder.lastName].filter(Boolean).join(" ")
                      : "—";
                    return (
                      <motion.tr
                        key={doc.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="cursor-pointer"
                        onClick={() => router.push(`/documents/${doc.id}`)}
                      >
                        <td>
                          <span className="font-mono text-xs text-[var(--accent)] font-600">
                            {doc.trackingNumber}
                          </span>
                        </td>
                        <td>
                          <p className="font-500 text-sm max-w-[280px] truncate">{subject}</p>
                        </td>
                        <td>
                          <span className="badge bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs">
                            {doc.originDepartment.code}
                          </span>
                        </td>
                        <td className="text-sm text-[var(--text-secondary)]">{holder}</td>
                        <td>
                          <span className={cn("badge text-xs gap-1", STATUS_COLORS[doc.status])}>
                            {STATUS_ICONS[doc.status]}
                            {doc.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>
                          <span className={cn("badge text-xs", PRIORITY_COLORS[doc.priority])}>
                            {doc.priority}
                          </span>
                        </td>
                        <td className="text-xs text-[var(--text-muted)]">
                          {formatRelative(doc.updatedAt)}
                        </td>
                        <td>
                          <ChevronRight size={14} className="text-[var(--text-muted)]" />
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            <Pagination page={page} total={total} pageSize={pageSize} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
