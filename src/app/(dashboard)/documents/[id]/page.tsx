"use client";

import { useEffect, useState, use }         from "react";
import { useRouter }                         from "next/navigation";
import { useSession }                        from "next-auth/react";
import { motion, AnimatePresence }           from "framer-motion";
import {
  ArrowLeft, FileText, Clock, CheckCircle, XCircle,
  Send, AlertTriangle, GitBranch, ChevronDown,
  User, Building2, Tag, Shield, History, Plus,
  CheckSquare, RotateCcw,
} from "lucide-react";
import { formatDate, formatRelative }        from "@/lib/utils";
import { STATUS_COLORS, PRIORITY_COLORS }    from "@/lib/dtms";
import { cn }                                from "@/lib/utils";
import { useToast }                          from "@/components/ui/Toast";
import { ApprovalFlow }                      from "@/components/motion/ApprovalFlow";
import { TransferTimeline }                  from "@/components/motion/TransferTimeline";
import { MotionModal }                       from "@/components/motion/MotionModal";
import { Skeleton }                          from "@/components/ui";

interface DocDetail {
  id:              string;
  trackingNumber:  string;
  status:          string;
  priority:        string;
  confidentiality: string;
  createdAt:       string;
  updatedAt:       string;
  originDepartment: { id: string; name: string; code: string };
  createdBy:       { id: string; firstName: string | null; lastName: string | null; email: string; role: string };
  currentHolder:   { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  addressees:      { id: string; department?: { name: string; code: string }; user?: { firstName: string | null; lastName: string | null } }[];
  versions: {
    id:              string;
    versionNumber:   number;
    subject:         string;
    body:            string | null;
    remarks:         string | null;
    isCurrentVersion: boolean;
    createdAt:       string;
    createdBy:       { firstName: string | null; lastName: string | null };
    signatories: {
      id:     string;
      order:  number;
      status: string;
      signedAt: string | null;
      remarks: string | null;
      user:   { id: string; firstName: string | null; lastName: string | null; role: string };
    }[];
    routes: {
      id:              string;
      action:          string;
      remarks:         string | null;
      timestamp:       string;
      fromDepartment?: { name: string; code: string };
      toDepartment?:   { name: string; code: string };
      fromUser?:       { firstName: string | null; lastName: string | null };
      toUser?:         { firstName: string | null; lastName: string | null };
    }[];
  }[];
}

interface Dept  { id: string; name: string; code: string }
interface UserR { id: string; firstName: string | null; lastName: string | null; departmentId: string | null }

const STATUS_ICON: Record<string, React.ReactNode> = {
  DRAFT:        <FileText    size={14} />,
  IN_PROGRESS:  <Clock       size={14} />,
  FOR_APPROVAL: <AlertTriangle size={14} />,
  APPROVED:     <CheckCircle size={14} />,
  REJECTED:     <XCircle     size={14} />,
  COMPLETED:    <Send        size={14} />,
};

const ROUTE_ACTION_COLOR: Record<string, string> = {
  FORWARDED: "info",
  RECEIVED:  "neutral",
  APPROVED:  "success",
  REJECTED:  "danger",
  RETURNED:  "warning",
  COMPLETED: "success",
};

function fullName(u: { firstName: string | null; lastName: string | null } | null | undefined) {
  if (!u) return "—";
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }          = use(params);
  const { data: session } = useSession();
  const router          = useRouter();
  const toast           = useToast();

  const user  = session?.user as any;
  const level = user?.accessLevel ?? 1;

  const [doc, setDoc]                 = useState<DocDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [activeVersion, setActiveVersion] = useState(0);

  // Modal state
  const [routeModal,  setRouteModal]  = useState(false);
  const [reviseModal, setReviseModal] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);

  // Route form
  const [depts,     setDepts]     = useState<Dept[]>([]);
  const [routeToUser, setRouteToUser] = useState("");
  const [routeToDept, setRouteToDept] = useState("");
  const [routeAction, setRouteAction] = useState("FORWARDED");
  const [routeRemarks, setRouteRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Revise form
  const [revSubject,  setRevSubject]  = useState("");
  const [revContent,  setRevContent]  = useState("");
  const [revRemarks,  setRevRemarks]  = useState("");

  // Approve form
  const [appAction,  setAppAction]  = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [appRemarks, setAppRemarks] = useState("");

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setDoc(d);
        setLoading(false);
        // Default to current version
        const cv = d.versions?.findIndex((v: any) => v.isCurrentVersion);
        if (cv >= 0) setActiveVersion(cv);
      })
      .catch(() => setLoading(false));

    fetch("/api/departments")
      .then((r) => r.json())
      .then((d) => setDepts(d.data ?? []));
  }, [id]);

  const currentVersion = doc?.versions[activeVersion];

  // Check if current user is a pending signatory
  const mySignatory = currentVersion?.signatories.find(
    (s) => s.user.id === user?.id && s.status === "PENDING",
  );

  const handleRoute = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/documents/${id}/route-action`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        action:          routeAction,
        toDepartmentId:  routeToDept || undefined,
        toUserId:        routeToUser || undefined,
        remarks:         routeRemarks || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("Document routed successfully");
      setRouteModal(false);
      router.refresh();
      fetch(`/api/documents/${id}`).then((r) => r.json()).then(setDoc);
    } else {
      const e = await res.json();
      toast.error(e.error ?? "Failed to route document");
    }
  };

  const handleRevise = async () => {
    if (!revSubject || !revRemarks) {
      toast.error("Subject and revision reason are required");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/documents/${id}/versions`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ subject: revSubject, content: revContent, remarks: revRemarks }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success("New revision created");
      setReviseModal(false);
      fetch(`/api/documents/${id}`).then((r) => r.json()).then(setDoc);
    } else {
      const e = await res.json();
      toast.error(e.error ?? "Failed to create revision");
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    const res = await fetch(`/api/documents/${id}/approve`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: appAction, remarks: appRemarks }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(`Document ${appAction.toLowerCase()} successfully`);
      setApproveOpen(false);
      fetch(`/api/documents/${id}`).then((r) => r.json()).then(setDoc);
    } else {
      const e = await res.json();
      toast.error(e.error ?? "Action failed");
    }
  };

  if (loading) return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-48" />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );

  if (!doc) return (
    <div className="py-20 text-center">
      <p className="text-[var(--text-muted)]">Document not found or access denied.</p>
      <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => router.back()} className="btn-secondary px-2.5 py-1.5">
          <ArrowLeft size={15} />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-[var(--accent)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-700 text-lg truncate">{currentVersion?.subject ?? "—"}</h1>
              <span className={cn("badge text-xs gap-1", STATUS_COLORS[doc.status])}>
                {STATUS_ICON[doc.status]}
                {doc.status.replace(/_/g, " ")}
              </span>
              <span className={cn("badge text-xs", PRIORITY_COLORS[doc.priority])}>
                {doc.priority}
              </span>
            </div>
            <p className="font-mono text-xs text-[var(--accent)] font-600">{doc.trackingNumber}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {level >= 2 && (
            <>
              <button onClick={() => setRouteModal(true)} className="btn-secondary text-sm">
                <GitBranch size={14} /> Route
              </button>
              <button onClick={() => { setRevSubject(currentVersion?.subject ?? ""); setRevContent(currentVersion?.body ?? ""); setReviseModal(true); }} className="btn-secondary text-sm">
                <RotateCcw size={14} /> Revise
              </button>
            </>
          )}
          {mySignatory && (
            <button onClick={() => setApproveOpen(true)} className="btn-primary text-sm">
              <CheckSquare size={14} /> Act on Document
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Version selector */}
          {doc.versions.length > 1 && (
            <div className="card p-4">
              <p className="text-xs font-600 uppercase tracking-wide text-[var(--text-muted)] mb-3">
                Document Versions
              </p>
              <div className="flex gap-2 flex-wrap">
                {doc.versions.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVersion(i)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-600 transition-all",
                      activeVersion === i
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                    )}
                  >
                    v{v.versionNumber}
                    {v.isCurrentVersion && " (current)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Version content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVersion?.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="card p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-600 mb-1">Subject</p>
                  <h2 className="font-600 text-[var(--text-primary)] text-lg">{currentVersion?.subject}</h2>
                </div>
                <span className="badge bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-xs flex-shrink-0">
                  Version {currentVersion?.versionNumber}
                </span>
              </div>

              {currentVersion?.remarks && (
                <div className="px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <p className="text-xs text-amber-400 font-600 mb-0.5">Revision Note</p>
                  <p className="text-sm text-[var(--text-secondary)]">{currentVersion.remarks}</p>
                </div>
              )}

              {currentVersion?.body ? (
                <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-600 mb-2">Content</p>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap bg-[var(--bg-tertiary)] rounded-lg p-4">
                    {currentVersion.body}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--text-muted)] italic">No body content.</p>
              )}

              <p className="text-xs text-[var(--text-muted)]">
                Created by {fullName(currentVersion?.createdBy)} · {formatDate(currentVersion?.createdAt)}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Routing history */}
          <div className="card p-5">
            <p className="text-xs font-600 uppercase tracking-wide text-[var(--text-muted)] mb-4">
              Routing History — v{currentVersion?.versionNumber}
            </p>
            {currentVersion?.routes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic">No routing history yet.</p>
            ) : (
              <TransferTimeline
                events={(currentVersion?.routes ?? []).map((r) => ({
                  label:   `${r.action} — ${fullName(r.fromUser)} → ${fullName(r.toUser) || r.toDepartment?.name || "—"}`,
                  detail:  r.remarks ?? undefined,
                  date:    formatDate(r.timestamp, "MMM dd, yyyy HH:mm"),
                  type:    ROUTE_ACTION_COLOR[r.action] as any,
                }))}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Metadata */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-600 uppercase tracking-wide text-[var(--text-muted)]">Document Info</p>
            <MetaRow icon={<Tag size={13} />}       label="Tracking No."  value={<span className="font-mono text-xs text-[var(--accent)] font-600">{doc.trackingNumber}</span>} />
            <MetaRow icon={<Building2 size={13} />} label="Origin Dept."  value={doc.originDepartment.name} />
            <MetaRow icon={<User size={13} />}      label="Created By"    value={fullName(doc.createdBy)} />
            <MetaRow icon={<User size={13} />}      label="Current Holder" value={fullName(doc.currentHolder)} />
            <MetaRow icon={<Shield size={13} />}    label="Confidentiality" value={doc.confidentiality} />
            <MetaRow icon={<Clock size={13} />}     label="Created"       value={formatDate(doc.createdAt)} />
            <MetaRow icon={<Clock size={13} />}     label="Last Updated"  value={formatRelative(doc.updatedAt)} />
          </div>

          {/* Addressees */}
          {doc.addressees.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-600 uppercase tracking-wide text-[var(--text-muted)] mb-3">Addressees</p>
              <div className="space-y-2">
                {doc.addressees.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                      {a.department ? <Building2 size={10} className="text-[var(--accent)]" /> : <User size={10} className="text-[var(--accent)]" />}
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {a.department ? `${a.department.name} (${a.department.code})` : fullName(a.user)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatories */}
          {currentVersion && currentVersion.signatories.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-600 uppercase tracking-wide text-[var(--text-muted)] mb-4">Signatories</p>
              <ApprovalFlow
                steps={currentVersion.signatories.map((s) => ({
                  label:  fullName(s.user),
                  status: s.status === "APPROVED" ? "done" : s.status === "REJECTED" ? "rejected" : "pending",
                  date:   s.signedAt ? formatDate(s.signedAt) : undefined,
                  note:   s.remarks ?? undefined,
                }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Route Modal */}
      <MotionModal open={routeModal} onClose={() => setRouteModal(false)} title="Route Document" size="md">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-500 uppercase tracking-wide text-[var(--text-secondary)]">Action *</label>
            <select value={routeAction} onChange={(e) => setRouteAction(e.target.value)} className="input-field">
              <option value="FORWARDED">Forward</option>
              <option value="RECEIVED">Mark as Received</option>
              <option value="RETURNED">Return</option>
              <option value="COMPLETED">Mark Complete</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-500 uppercase tracking-wide text-[var(--text-secondary)]">To Department</label>
            <select value={routeToDept} onChange={(e) => setRouteToDept(e.target.value)} className="input-field">
              <option value="">Select department…</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-500 uppercase tracking-wide text-[var(--text-secondary)]">Remarks</label>
            <textarea value={routeRemarks} onChange={(e) => setRouteRemarks(e.target.value)} className="input-field h-20 resize-none" placeholder="Optional routing note…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setRouteModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleRoute} disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? "Routing…" : "Route Document"}
            </button>
          </div>
        </div>
      </MotionModal>

      {/* Revise Modal */}
      <MotionModal open={reviseModal} onClose={() => setReviseModal(false)} title="Create New Revision" size="lg">
        <div className="space-y-4">
          <div className="px-3 py-2.5 rounded-lg bg-amber-500/8 border border-amber-500/20 text-xs text-amber-400">
            ⚠ Creating a revision will reset all pending approvals for this document.
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-500 uppercase tracking-wide text-[var(--text-secondary)]">Subject *</label>
            <input type="text" value={revSubject} onChange={(e) => setRevSubject(e.target.value)} className="input-field" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-500 uppercase tracking-wide text-[var(--text-secondary)]">Content</label>
            <textarea value={revContent} onChange={(e) => setRevContent(e.target.value)} className="input-field h-32 resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-500 uppercase tracking-wide text-[var(--text-secondary)]">Reason for Revision *</label>
            <textarea value={revRemarks} onChange={(e) => setRevRemarks(e.target.value)} className="input-field h-20 resize-none" placeholder="Describe what changed and why…" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setReviseModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleRevise} disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? "Creating…" : "Create Revision"}
            </button>
          </div>
        </div>
      </MotionModal>

      {/* Approve/Reject Modal */}
      <MotionModal open={approveOpen} onClose={() => setApproveOpen(false)} title="Act on Document" size="sm">
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["APPROVED", "REJECTED"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAppAction(a)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-600 transition-all border",
                  appAction === a
                    ? a === "APPROVED"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-red-500 text-white border-red-500"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border)]",
                )}
              >
                {a === "APPROVED" ? <><CheckCircle size={13} className="inline mr-1" /> Approve</> : <><XCircle size={13} className="inline mr-1" /> Reject</>}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-500 uppercase tracking-wide text-[var(--text-secondary)]">Remarks</label>
            <textarea value={appRemarks} onChange={(e) => setAppRemarks(e.target.value)} className="input-field h-24 resize-none" placeholder="Optional remarks…" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setApproveOpen(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className={cn("btn-primary disabled:opacity-50", appAction === "REJECTED" && "!bg-red-500 hover:!bg-red-600")}
            >
              {submitting ? "Submitting…" : `Submit ${appAction === "APPROVED" ? "Approval" : "Rejection"}`}
            </button>
          </div>
        </div>
      </MotionModal>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[var(--text-muted)] mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-600 uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        <p className="text-sm text-[var(--text-primary)] truncate">{value}</p>
      </div>
    </div>
  );
}
