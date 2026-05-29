'use client'

import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem, scaleIn, backdrop, popIn } from "@/lib/motion/variants";
import { spring, springBouncy, fast } from "@/lib/motion/transitions";
import { cn } from '@/lib/utils'
import { ReactNode, useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

// ─── Badge ───────────────────────────────────────────────
export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'original' | 'amendment' | 'renewal' | 'addendum'
  className?: string
}) {
  const variantStyles = {
    default:   'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    success:   'status-active',
    warning:   'status-warning',
    danger:    'status-expired',
    info:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    original:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    amendment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    renewal:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    addendum:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return (
    <motion.span
      variants={popIn}
      initial="hidden"
      animate="visible"
      transition={springBouncy}
      className={cn('badge', variantStyles[variant], className)}
    >
      {children}
    </motion.span>
  )
}

// ─── Stat Card ───────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  accent,
  index = 0,
}: {
  label: string
  value: string | number
  icon: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  accent?: boolean
  index?: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ ...spring, delay: index * 0.07 }}
      whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(30,32,60,0.1)" }}
      className={cn('card p-5 cursor-default', accent && 'border-brand-500/30 bg-brand-500/5')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-500 text-[var(--text-muted)] uppercase tracking-wide mb-2">{label}</p>
          <p className="text-2xl font-display font-700 text-[var(--text-primary)]">{value}</p>
          {trendLabel && (
            <p className={cn(
              'text-xs mt-1',
              trend === 'up'      && 'text-green-500',
              trend === 'down'    && 'text-red-500',
              trend === 'neutral' && 'text-[var(--text-muted)]',
            )}>
              {trendLabel}
            </p>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={springBouncy}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            accent ? 'bg-brand-500/20 text-brand-500' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
          )}
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Empty State ─────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
        <span className="text-2xl">📄</span>
      </div>
      <h3 className="font-600 text-[var(--text-primary)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded', className)} />
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border)]">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn('h-4', j === 0 ? 'w-24' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TablePageSkeleton({ cols = 5, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-16 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-8 flex-1 max-w-xs rounded-lg" />
      </div>
      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className={cn('h-3', i === 0 ? 'w-20' : 'flex-1')} />
          ))}
        </div>
        <TableSkeleton rows={rows} cols={cols} />
      </div>
    </div>
  )
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-5 pb-10">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <Skeleton className="h-4 w-36" />
            </div>
            <TableSkeleton rows={4} cols={4} />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-display font-700 text-[var(--text-primary)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-wrap"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden" animate="visible" exit="exit"
        >
          <motion.div
            variants={backdrop} transition={fast}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={scaleIn} transition={spring}
            className={cn('relative card w-full', sizeClass)}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="font-display font-600 text-[var(--text-primary)]">{title}</h2>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded hover:bg-[var(--bg-tertiary)]"
              >✕</button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-wrap"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden" animate="visible" exit="exit"
        >
          <motion.div
            variants={backdrop} transition={fast}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={scaleIn} transition={spring}
            className="relative card w-full max-w-sm p-6"
          >
            <h3 className="font-display font-600 text-[var(--text-primary)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6 whitespace-pre-line">{description}</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className={danger ? 'btn-danger' : 'btn-primary'}
                onClick={() => { onConfirm(); onClose(); }}
              >{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Pagination ───────────────────────────────────────────
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
      <p className="text-xs text-[var(--text-muted)]">
        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="px-2 py-1 text-xs rounded btn-secondary disabled:opacity-40"
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = i + 1
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'px-2.5 py-1 text-xs rounded transition-colors',
                p === page ? 'bg-brand-500 text-white' : 'btn-secondary'
              )}
            >
              {p}
            </button>
          )
        })}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="px-2 py-1 text-xs rounded btn-secondary disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Custom Select ────────────────────────────────────────
export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  className,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const pick = (v: string) => { onChange(v); setOpen(false) }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
          {label}{required && ' *'}
        </label>
      )}
      <div className="relative" ref={ref}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(
            'input-field flex items-center justify-between gap-2 text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pr-8',
            open && 'border-[var(--accent)] shadow-[0_0_0_3px_rgba(91,138,240,0.12)]',
          )}
        >
          <span className={cn('truncate', selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
            {selected ? selected.label : (placeholder ?? 'Select…')}
          </span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          </motion.div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -6, scaleY: 0.94 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -4, scaleY: 0.94 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformOrigin: 'top' }}
              className="absolute z-50 top-full mt-1.5 left-0 right-0 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
            >
              {placeholder && (
                <li>
                  <button
                    type="button"
                    onMouseDown={() => pick('')}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors border-b border-[var(--border)]"
                  >
                    {placeholder}
                  </button>
                </li>
              )}
              {options.map((o) => {
                const isSelected = value === o.value
                return (
                  <li key={o.value}>
                    <button
                      type="button"
                      onMouseDown={() => pick(o.value)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm transition-colors text-left border-b border-[var(--border)] last:border-0',
                        isSelected
                          ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-500'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
                      )}
                    >
                      <span className="truncate">{o.label}</span>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={springBouncy}
                          >
                            <Check size={13} className="text-[var(--accent)] shrink-0" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Select Field ─────────────────────────────────────────
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <CustomSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  )
}

// ─── Avatar ───────────────────────────────────────────────
const AVATAR_PALETTE = [
  { bg: "bg-brand-500/20",   text: "text-brand-400"   },
  { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  { bg: "bg-amber-500/20",   text: "text-amber-400"   },
  { bg: "bg-violet-500/20",  text: "text-violet-400"  },
  { bg: "bg-rose-500/20",    text: "text-rose-400"    },
  { bg: "bg-cyan-500/20",    text: "text-cyan-400"    },
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h;
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_SIZE: Record<string, string> = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
};

export function Avatar({ name, label, size = "md", info }: {
  name: string;
  label?: string;
  size?: "xs" | "sm" | "md" | "lg";
  info?: { username?: string; role?: string };
}) {
  const palette  = AVATAR_PALETTE[hashName(name) % AVATAR_PALETTE.length];
  const initials = getInitials(name);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div
        onClick={info ? () => setOpen(o => !o) : undefined}
        title={!info ? (label ? `${name} · ${label}` : name) : undefined}
        className={cn(
          AVATAR_SIZE[size],
          "rounded-full flex items-center justify-center font-700 shrink-0 ring-2 ring-[var(--bg-primary)] select-none",
          palette.bg,
          palette.text,
          info && "cursor-pointer hover:opacity-85 transition-opacity",
        )}
      >
        {initials}
      </div>
      <AnimatePresence>
        {open && info && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformOrigin: "top center" }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-48 card p-3 shadow-xl"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-700 text-xs shrink-0",
                palette.bg, palette.text,
              )}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-600 text-[var(--text-primary)] truncate">{name}</p>
                {label && <p className="text-[10px] text-[var(--text-muted)]">{label}</p>}
              </div>
            </div>
            {(info.username || info.role) && (
              <div className="border-t border-[var(--border)] pt-2 space-y-1.5">
                {info.username && (
                  <p className="text-[11px] text-[var(--text-muted)] font-mono">@{info.username}</p>
                )}
                {info.role && (
                  <span className="inline-block text-[9px] font-700 uppercase tracking-widest px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                    {info.role}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AvatarGroup({ users, max = 4, size = "sm" }: {
  users: { name: string; label?: string; info?: { username?: string; role?: string } }[];
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const visible  = users.slice(0, max);
  const overflow = users.length - max;
  return (
    <div className="flex items-center -space-x-2">
      {visible.map((u, i) => (
        <Avatar key={i} name={u.name} label={u.label} size={size} info={u.info} />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            AVATAR_SIZE[size],
            "rounded-full flex items-center justify-center font-700 shrink-0 ring-2 ring-[var(--bg-primary)] bg-[var(--bg-tertiary)] text-[var(--text-muted)]",
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────
export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}
