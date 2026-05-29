"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Syne, DM_Sans } from "next/font/google";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm" });

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
    <div className={`${syne.variable} ${dmSans.variable}`}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
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
      <label
        className="block text-[11px] font-semibold uppercase tracking-[0.1em]"
        style={{ fontFamily: "var(--font-dm)", color: "var(--text-muted)" }}
      >
        {label}
      </label>
      <motion.div
        animate={{
          boxShadow: focused
            ? "0 0 0 3px rgba(91,138,240,0.15), 0 1px 3px rgba(0,0,0,0.06)"
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
    <div className="min-h-screen flex overflow-hidden bg-white">
      {/* ── Left — illustration panel ──────────────────────────────────── */}
      <motion.div
        variants={leftPanel}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex lg:w-1/2 flex-col border-r"
        style={{
          background: "var(--bg-tertiary)",
          borderColor: "var(--border)",
        }}
      >
        {/* Top-left org mark */}
        <div className="flex items-center gap-3 px-10 pt-10">
          <Image src="/npc-big-logo.png" alt="NPC" width={36} height={36} />
          <div>
            <p
              className="text-[13px] font-semibold leading-tight"
              style={{
                fontFamily: "var(--font-dm)",
                color: "var(--text-primary)",
              }}
            >
              National Power Corporation
            </p>
            <p
              className="text-[11px] font-medium"
              style={{ fontFamily: "var(--font-dm)", color: "var(--accent)" }}
            >
              DTS
            </p>
          </div>
        </div>

        {/* Centre content */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex-1 flex flex-col items-center justify-center px-12 pb-10"
        >
          {/* Headline */}
          <motion.div variants={item} className="text-center mb-10">
            <h1
              className="text-3xl xl:text-4xl font-bold leading-tight"
              style={{
                fontFamily: "var(--font-syne)",
                color: "var(--text-primary)",
              }}
            >
              Document Tracking
              <br />
              <span style={{ color: "var(--accent)" }}>Management</span>
              <br />
              System
            </h1>
            <p
              className="mt-4 text-sm leading-relaxed max-w-[240px] mx-auto"
              style={{
                fontFamily: "var(--font-dm)",
                color: "var(--text-muted)",
              }}
            >
              Centralize your document tracking and management in one place.
            </p>
          </motion.div>

          {/* Illustration */}
          <motion.div
            variants={item}
            className="w-full max-w-[320px] xl:max-w-[380px]"
          >
            <img
              src="/undraw_budgeting_klon.svg"
              alt="Budgeting illustration"
              className="w-full h-auto object-contain"
              style={{ maxHeight: "300px" }}
            />
          </motion.div>
        </motion.div>

        {/* Bottom copyright */}
        <div className="px-10 pb-8">
          <p
            className="text-[11px]"
            style={{
              fontFamily: "var(--font-dm)",
              color: "var(--text-muted)",
              opacity: 0.5,
            }}
          >
            © {new Date().getFullYear()} NPC · Document Tracking System
          </p>
        </div>
      </motion.div>

      {/* ── Right — form panel ─────────────────────────────────────────── */}
      <motion.div
        variants={rightPanel}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col min-h-screen bg-white"
      >
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-3 px-8 pt-8">
          <Image src="/npc-big-logo.png" alt="NPC" width={30} height={30} />
          <p
            className="text-sm font-semibold"
            style={{
              fontFamily: "var(--font-dm)",
              color: "var(--text-primary)",
            }}
          >
            National Power Corporation
          </p>
        </div>

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
              <h1
                className="text-[1.75rem] font-bold leading-tight tracking-tight"
                style={{
                  fontFamily: "var(--font-syne)",
                  color: "var(--text-primary)",
                }}
              >
                Sign in
              </h1>
              <p
                className="text-[13px] mt-2 leading-relaxed"
                style={{
                  fontFamily: "var(--font-dm)",
                  color: "var(--text-muted)",
                }}
              >
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
                  className="mb-6 rounded-lg p-3.5 overflow-hidden"
                  style={{
                    border: "1px solid rgba(224,59,59,0.2)",
                    background: "rgba(224,59,59,0.05)",
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle
                      size={14}
                      className="shrink-0 mt-0.5"
                      style={{ color: "var(--danger)" }}
                    />
                    <p
                      className="text-[13px] leading-snug"
                      style={{
                        fontFamily: "var(--font-dm)",
                        color: "var(--danger)",
                      }}
                    >
                      {error}
                    </p>
                  </div>
                  <motion.div
                    className="h-px mt-3 origin-left"
                    style={{ background: "var(--danger)", opacity: 0.25 }}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "var(--text-muted)" }}
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
                    className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: "var(--font-dm)" }}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
