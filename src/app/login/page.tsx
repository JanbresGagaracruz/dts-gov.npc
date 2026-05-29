"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Image from "next/image";

const ERROR_DISMISS_MS = 5000;
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function landingPage(_level: number) {
  return "/dashboard";
}

// ─── motion variants ──────────────────────────────────────────────────────────

const leftPanel = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE } },
};

const rightPanel = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: EASE, delay: 0.1 },
  },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const errorAnim = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

// ─── page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#080a0f]">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

// ─── field wrapper with animated focus ring ───────────────────────────────────

function Field({
  label,
  focused,
  children,
}: {
  label: string;
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-600 text-[var(--text-secondary)] uppercase tracking-[0.1em]">
        {label}
      </label>
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 0 3px rgba(91,138,240,0.15), 0 1px 3px rgba(0,0,0,0.08)"
            : "0 0 0 0px transparent, 0 1px 2px rgba(0,0,0,0.04)",
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="rounded-lg"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── login content ────────────────────────────────────────────────────────────

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), ERROR_DISMISS_MS);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email: username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      const session = await getSession();
      const level = (session?.user?.accessLevel as number) ?? 1;
      const dest =
        rawCallback && !rawCallback.startsWith("/dashboard")
          ? rawCallback
          : landingPage(level);
      router.push(dest);
    } else {
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Left — image panel ─────────────────────────────────────────── */}
      <motion.div
        variants={leftPanel}
        initial="hidden"
        animate="visible"
        className="hidden lg:block lg:w-1/2 relative"
      >
        <img
          src="/undraw_budgeting_klon.svg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay — darker on edges, lets the image breathe in the center */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080e]/80 via-[#06080e]/40 to-[#06080e]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080e]/70 via-transparent to-[#06080e]/50" />

        {/* Top-left org mark */}
        <div className="absolute top-10 left-10 flex items-center gap-3">
          <Image
            src="/npc-big-logo.png"
            alt="NPC"
            width={38}
            height={38}
            className="opacity-90"
          />
          <div>
            <p className="text-white/85 font-600 text-[13px] leading-tight">
              National Power Corporation
            </p>
            <p className="text-white/35 text-[11px]">{"DTS"}</p>
          </div>
        </div>

        {/* Centre headline */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="absolute inset-0 flex flex-col justify-center px-14"
        >
          <motion.h1
            variants={item}
            className="font-display font-800 text-4xl xl:text-5xl leading-tight text-white"
          >
            Document Tracking
            <br />
            <span className="text-green-400">Management</span>
            <br />
            System
          </motion.h1>
          <motion.p
            variants={item}
            className="text-white/55 mt-5 text-sm leading-relaxed max-w-xs"
          >
            Centralize your document tracking and management in one place.
          </motion.p>
        </motion.div>

        {/* Bottom-left copyright */}
        <div className="absolute bottom-10 left-10">
          <p className="text-white/25 text-[11px]">
            © {new Date().getFullYear()} NPC · Document Tracking System
          </p>
        </div>
      </motion.div>

      {/* ── Right — form panel ─────────────────────────────────────────── */}
      <motion.div
        variants={rightPanel}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col bg-[var(--bg-primary)] min-h-screen"
      >
        {/* Centred form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[22rem]"
          >
            {/* Heading */}
            <motion.div variants={item} className="mb-9">
              <h1 className="text-[1.75rem] font-display font-700 text-[var(--text-primary)] leading-tight tracking-tight">
                Sign in
              </h1>
              <p className="text-[13px] text-[var(--text-muted)] mt-2 leading-relaxed">
                Enter your credentials to access the system.
              </p>
            </motion.div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="err"
                  variants={errorAnim}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="mb-6 rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3.5 overflow-hidden"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle
                      size={14}
                      className="text-red-400 shrink-0 mt-0.5"
                    />
                    <p className="text-[13px] text-red-400 leading-snug">
                      {error}
                    </p>
                  </div>
                  {/* Countdown bar */}
                  <motion.div
                    className="h-px bg-red-500/30 mt-3 origin-left"
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{
                      duration: ERROR_DISMISS_MS / 1000,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <motion.div variants={stagger} className="space-y-5">
                <motion.div variants={item}>
                  <Field label="Username" focused={focusedField === "username"}>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="your.username"
                      required
                      autoFocus
                      className="input-field"
                    />
                  </Field>
                </motion.div>

                <motion.div variants={item}>
                  <Field label="Password" focused={focusedField === "password"}>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="••••••••"
                        required
                        className="input-field pr-10"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={showPw ? "off" : "on"}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.12 }}
                          >
                            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                          </motion.span>
                        </AnimatePresence>
                      </button>
                    </div>
                  </Field>
                </motion.div>

                <motion.div variants={item} className="pt-1">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: loading ? 1 : 0.985 }}
                    className="w-full btn-primary justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        Continue
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </motion.button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
