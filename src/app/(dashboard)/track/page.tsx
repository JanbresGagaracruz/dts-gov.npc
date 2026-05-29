"use client";

// src/app/(dashboard)/track/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, ArrowRight } from "lucide-react";
import { MotionPage } from "@/components/motion/MotionPage";
import { motion }     from "framer-motion";
import { cn }         from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/dtms";

interface TrackResult {
  id:             string;
  trackingNumber: string;
  status:         string;
  priority:       string;
  originDepartment: { name: string; code: string };
  currentHolder:  { firstName: string | null; lastName: string | null } | null;
  versions:       { subject: string; versionNumber: number; isCurrentVersion: boolean }[];
}

export default function TrackPage() {
  const router  = useRouter();
  const [query, setQuery]   = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    // Search by tracking number — fetch docs filtered by search
    const res  = await fetch(`/api/documents?search=${encodeURIComponent(query.trim())}&pageSize=5`);
    const data = await res.json();

    // Try to find exact tracking number match first
    const exact = (data.data ?? []).find((d: any) =>
      d.trackingNumber.toLowerCase() === query.trim().toLowerCase(),
    );

    if (exact) {
      setResult(exact);
    } else if (data.data?.length > 0) {
      setResult(data.data[0]);
    } else {
      setError(`No document found for "${query}"`);
    }
    setLoading(false);
  };

  const cv = result?.versions?.find((v) => v.isCurrentVersion) ?? result?.versions?.[0];

  return (
    <MotionPage>
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-[var(--accent)]" />
          </div>
          <h1 className="font-display font-700 text-2xl text-[var(--text-primary)]">Track Document</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Enter a tracking number or subject to locate a document
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. DTS-2025-000001"
            className="input-field flex-1 font-mono text-sm"
            autoFocus
          />
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 px-5">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={15} />}
          </button>
        </form>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 text-center mt-4"
          >
            {error}
          </motion.p>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y:  0  }}
            className="mt-6 card p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="font-mono text-sm text-[var(--accent)] font-700">{result.trackingNumber}</p>
                  <p className="font-600 text-[var(--text-primary)] mt-0.5">{cv?.subject ?? "—"}</p>
                </div>
              </div>
              <span className={cn("badge text-xs flex-shrink-0", STATUS_COLORS[result.status])}>
                {result.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] font-600 uppercase tracking-wide text-[var(--text-muted)]">Origin</p>
                <p className="text-[var(--text-primary)]">{result.originDepartment.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-600 uppercase tracking-wide text-[var(--text-muted)]">Current Holder</p>
                <p className="text-[var(--text-primary)]">
                  {result.currentHolder
                    ? [result.currentHolder.firstName, result.currentHolder.lastName].filter(Boolean).join(" ")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-600 uppercase tracking-wide text-[var(--text-muted)]">Priority</p>
                <p className="text-[var(--text-primary)]">{result.priority}</p>
              </div>
              <div>
                <p className="text-[10px] font-600 uppercase tracking-wide text-[var(--text-muted)]">Version</p>
                <p className="text-[var(--text-primary)]">v{cv?.versionNumber ?? 1}</p>
              </div>
            </div>

            <button
              onClick={() => router.push(`/documents/${result.id}`)}
              className="btn-primary w-full justify-center"
            >
              View Full Document <ArrowRight size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </MotionPage>
  );
}
