"use client";

import { useState, useEffect } from "react";
import { useRouter }           from "next/navigation";
import { useSession }          from "next-auth/react";
import { motion }              from "framer-motion";
import { ArrowLeft, Plus, X, UserPlus, Building2 } from "lucide-react";
import { useToast }            from "@/components/ui/Toast";
import { cn }                  from "@/lib/utils";

interface Dept { id: string; name: string; code: string }
interface UserItem { id: string; firstName: string | null; lastName: string | null; email: string; departmentId: string | null; role: string }

type Addressee = { type: "dept"; id: string; name: string } | { type: "user"; id: string; name: string };

export default function CreateDocumentPage() {
  const router      = useRouter();
  const toast       = useToast();
  const { data: session } = useSession();
  const level       = (session?.user as any)?.accessLevel ?? 1;

  if (level < 2) {
    router.replace("/documents");
    return null;
  }

  const [subject,         setSubject]         = useState("");
  const [content,         setContent]         = useState("");
  const [priority,        setPriority]        = useState("NORMAL");
  const [confidentiality, setConfidentiality] = useState("INTERNAL");
  const [addressees,      setAddressees]      = useState<Addressee[]>([]);
  const [signatories,     setSignatories]     = useState<{ id: string; name: string; order: number }[]>([]);
  const [submitting,      setSubmitting]      = useState(false);

  const [depts, setDepts]       = useState<Dept[]>([]);
  const [users, setUsers]       = useState<UserItem[]>([]);
  const [addType, setAddType]   = useState<"dept" | "user">("dept");
  const [addDeptId, setAddDeptId] = useState("");
  const [addUserId, setAddUserId] = useState("");
  const [sigUserId, setSigUserId] = useState("");

  useEffect(() => {
    fetch("/api/departments").then((r) => r.json()).then((d) => setDepts(d.data ?? []));
    fetch("/api/users?pageSize=200").then((r) => r.json()).then((d) => setUsers(d.data ?? []));
  }, []);

  const addAddressee = () => {
    if (addType === "dept") {
      const dept = depts.find((d) => d.id === addDeptId);
      if (!dept || addressees.some((a) => a.type === "dept" && a.id === dept.id)) return;
      setAddressees((prev) => [...prev, { type: "dept", id: dept.id, name: `${dept.name} (${dept.code})` }]);
      setAddDeptId("");
    } else {
      const u = users.find((u) => u.id === addUserId);
      if (!u || addressees.some((a) => a.type === "user" && a.id === u.id)) return;
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
      setAddressees((prev) => [...prev, { type: "user", id: u.id, name }]);
      setAddUserId("");
    }
  };

  const addSignatory = () => {
    const u = users.find((x) => x.id === sigUserId);
    if (!u || signatories.some((s) => s.id === u.id)) return;
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
    setSignatories((prev) => [...prev, { id: u.id, name, order: prev.length + 1 }]);
    setSigUserId("");
  };

  const handleSubmit = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    setSubmitting(true);

    const res = await fetch("/api/documents", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        subject,
        content,
        priority,
        confidentiality,
        addressees: addressees.map((a) => ({
          departmentId: a.type === "dept" ? a.id : undefined,
          userId:       a.type === "user" ? a.id : undefined,
        })),
        signatories: signatories.map((s) => ({ userId: s.id, order: s.order })),
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      const data = await res.json();
      toast.success(`Document created: ${data.trackingNumber}`);
      router.push(`/documents/${data.id}`);
    } else {
      const e = await res.json();
      toast.error(e.error ?? "Failed to create document");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-secondary px-2.5 py-1.5">
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="font-display font-700 text-xl text-[var(--text-primary)]">Create New Document</h1>
          <p className="text-sm text-[var(--text-muted)]">A tracking number will be auto-generated</p>
        </div>
      </div>

      {/* Form */}
      <div className="card p-6 space-y-5">
        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-xs font-600 uppercase tracking-wide text-[var(--text-secondary)]">Subject *</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-field text-base"
            placeholder="Document subject / title…"
          />
        </div>

        {/* Priority + Confidentiality */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-600 uppercase tracking-wide text-[var(--text-secondary)]">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-600 uppercase tracking-wide text-[var(--text-secondary)]">Confidentiality</label>
            <select value={confidentiality} onChange={(e) => setConfidentiality(e.target.value)} className="input-field">
              <option value="PUBLIC">Public</option>
              <option value="INTERNAL">Internal</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="SECRET">Secret</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <label className="text-xs font-600 uppercase tracking-wide text-[var(--text-secondary)]">Content / Body</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field h-40 resize-none"
            placeholder="Document body text (optional)…"
          />
        </div>
      </div>

      {/* Addressees */}
      <div className="card p-5 space-y-4">
        <h3 className="font-600 text-sm text-[var(--text-primary)]">Addressees</h3>
        <div className="flex gap-2 flex-wrap">
          {addressees.map((a, i) => (
            <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)] text-xs font-500 text-[var(--text-secondary)]">
              {a.type === "dept" ? <Building2 size={10} /> : <UserPlus size={10} />}
              {a.name}
              <button onClick={() => setAddressees((prev) => prev.filter((_, j) => j !== i))}>
                <X size={10} className="text-[var(--text-muted)] hover:text-red-400" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={addType} onChange={(e) => setAddType(e.target.value as any)} className="input-field w-28">
            <option value="dept">Dept</option>
            <option value="user">User</option>
          </select>
          {addType === "dept" ? (
            <select value={addDeptId} onChange={(e) => setAddDeptId(e.target.value)} className="input-field flex-1">
              <option value="">Select department…</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
            </select>
          ) : (
            <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)} className="input-field flex-1">
              <option value="">Select user…</option>
              {users.map((u) => <option key={u.id} value={u.id}>{[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}</option>)}
            </select>
          )}
          <button onClick={addAddressee} className="btn-secondary px-3">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Signatories */}
      <div className="card p-5 space-y-4">
        <h3 className="font-600 text-sm text-[var(--text-primary)]">Signatories (Approval Chain)</h3>
        {signatories.length > 0 && (
          <div className="space-y-2">
            {signatories.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)]">
                <span className="w-5 h-5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[10px] font-700 flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm flex-1 text-[var(--text-primary)]">{s.name}</span>
                <button onClick={() => setSignatories((prev) => prev.filter((_, j) => j !== i).map((x, j) => ({ ...x, order: j + 1 })))}>
                  <X size={13} className="text-[var(--text-muted)] hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <select value={sigUserId} onChange={(e) => setSigUserId(e.target.value)} className="input-field flex-1">
            <option value="">Select signatory…</option>
            {users.filter((u) => u.role === "SIGNATORY" || (u as any).accessLevel >= 2).map((u) => (
              <option key={u.id} value={u.id}>{[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}</option>
            ))}
          </select>
          <button onClick={addSignatory} className="btn-secondary px-3">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary disabled:opacity-50">
          {submitting ? "Creating…" : "Create Document"}
        </button>
      </div>
    </div>
  );
}
