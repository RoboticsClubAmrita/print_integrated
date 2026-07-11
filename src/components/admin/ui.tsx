import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Press Room UI vocabulary — the one set of parts every admin screen is
 * built from, so the same thing always looks the same thing. Visual
 * definitions live in index.css (.panel/.well/.chip/.tbl/…); these
 * components only guarantee the vocabulary is used consistently.
 */

/* ————— status → tone (single source of truth) ————— */

type Tone = 'ok' | 'run' | 'wait' | 'hot' | 'bad' | 'idle' | 'dim' | 'paper';

const TONE_CLASS: Record<Tone, string> = {
    ok: 'chip--ok',
    run: 'chip--ok',
    wait: 'chip--wait',
    hot: 'chip--wait',
    bad: 'chip--bad',
    idle: 'chip--idle',
    dim: 'chip--dim',
    paper: 'chip--paper',
};

/** Tones that breathe: live machine states only. */
const PULSING: ReadonlySet<Tone> = new Set(['run', 'hot'] as Tone[]);

export const STATUS_TONE: Record<string, Tone> = {
    // job chain
    PENDING: 'wait',
    SCHEDULED: 'idle',
    QUEUED: 'idle',
    PRINTING: 'run',
    PRINTED_PENDING_STACK: 'wait',
    COMPLETED: 'ok',
    COLLECTED: 'dim',
    CANCELLED: 'bad',
    FAILED: 'bad',
    // penalty ledger
    ACCRUING: 'hot',
    UNPAID: 'bad',
    PAID: 'ok',
    WAIVED: 'dim',
    // hardware
    AVAILABLE: 'ok',
    NOT_AVAILABLE: 'bad',
    OCCUPIED: 'wait',
};

const ROLE_TONE: Record<string, Tone> = {
    SUPER_ADMIN: 'wait', // amber — the operator's operator
    ADMIN: 'paper',
    FACULTY: 'ok',
    STUDENT: 'idle',
    MEMBER: 'idle',
};

const prettify = (s: string) => s.replace(/_/g, ' ');

/** Status pill. Pass `onAdvance` to make it the one-click chain control. */
export function StatusChip({
    status,
    label,
    onAdvance,
    advanceTitle,
    disabled,
}: {
    status: string;
    label?: string;
    onAdvance?: (e: React.MouseEvent) => void;
    advanceTitle?: string;
    disabled?: boolean;
}) {
    const tone = STATUS_TONE[status] ?? 'idle';
    const pulse = PULSING.has(tone);
    const body = (
        <>
            <span className={clsx('dot', pulse && 'dot--pulse')} />
            {label ?? prettify(status)}
            {onAdvance && !disabled && <span className="opacity-60 -mr-0.5">›</span>}
        </>
    );
    if (onAdvance) {
        return (
            <button
                type="button"
                onClick={onAdvance}
                disabled={disabled}
                title={advanceTitle}
                className={clsx('chip', TONE_CLASS[tone])}
            >
                {body}
            </button>
        );
    }
    return <span className={clsx('chip', TONE_CLASS[tone])}>{body}</span>;
}

export function RoleChip({ role }: { role: string }) {
    return (
        <span className={clsx('chip', TONE_CLASS[ROLE_TONE[role] ?? 'idle'])}>
            {prettify(role || '—')}
        </span>
    );
}

export function LedDot({
    tone,
    pulse,
    title,
}: {
    tone: 'ok' | 'amber' | 'bad' | 'off';
    pulse?: boolean;
    title?: string;
}) {
    return <span title={title} className={clsx('led', `led--${tone}`, pulse && 'led--pulse')} />;
}

/* ————— money / dates — the receipt voice ————— */

export const inr = (n: number | undefined | null) => `₹${(n || 0).toFixed(2)}`;

export const fmtDate = (d: string | Date) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const fmtDateTime = (d: string | Date) =>
    new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

/* ————— page scaffold ————— */

export function PageHeader({
    title,
    sub,
    meta,
    actions,
}: {
    title: string;
    sub?: string;
    meta?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
                <h1 className="text-[22px] font-extrabold tracking-[-0.5px] text-text leading-tight">
                    {title}
                </h1>
                {sub && <p className="mt-1 text-[13px] text-text-muted">{sub}</p>}
                {meta && <p className="receipt-line mt-2.5 truncate">{meta}</p>}
            </div>
            {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
        </header>
    );
}

export function Panel({
    title,
    icon: Icon,
    actions,
    children,
    className,
    bodyClassName,
}: {
    title?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
}) {
    return (
        <section className={clsx('panel', className)}>
            {title && (
                <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3.5 border-b border-white/6">
                    <h2 className="flex items-center gap-2 text-[14px] font-bold text-text">
                        {Icon && <Icon size={15} strokeWidth={2} className="text-text-muted" />}
                        {title}
                    </h2>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            )}
            <div className={clsx(bodyClassName ?? 'p-5')}>{children}</div>
        </section>
    );
}

export function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="f-label">{label}</span>
            {children}
            {hint && <span className="mt-1.5 block text-[11.5px] text-text-muted">{hint}</span>}
        </label>
    );
}

/* ————— overlays ————— */

export function Dialog({
    title,
    icon: Icon,
    meta,
    onClose,
    closeDisabled,
    width = 'max-w-md',
    children,
}: {
    title: string;
    icon?: LucideIcon;
    meta?: React.ReactNode;
    onClose: () => void;
    closeDisabled?: boolean;
    width?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className="overlay-backdrop grid place-items-center overflow-y-auto p-4"
            onClick={() => !closeDisabled && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={clsx('dialog w-full p-6', width)}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="flex items-center gap-2 text-[16px] font-bold text-text">
                            {Icon && <Icon size={17} strokeWidth={2} className="text-text-muted" />}
                            {title}
                        </h3>
                        {meta && <p className="receipt-line mt-1.5">{meta}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={closeDisabled}
                        aria-label="Close"
                        className="icon-btn -mr-1 -mt-1 shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function SlideOver({
    title,
    meta,
    onClose,
    children,
}: {
    title: string;
    meta?: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <>
            <div className="overlay-backdrop" onClick={onClose} />
            <aside role="dialog" aria-modal="true" aria-label={title} className="slideover">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/8 bg-[#131318]/85 px-6 pb-4 pt-5 backdrop-blur-xl">
                    <div className="min-w-0">
                        <h3 className="truncate text-[16px] font-bold text-text">{title}</h3>
                        {meta && <p className="receipt-line mt-1.5 truncate">{meta}</p>}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="icon-btn shrink-0">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </aside>
        </>
    );
}

/* ————— states ————— */

export function EmptyState({
    icon: Icon,
    title,
    hint,
    action,
}: {
    icon: LucideIcon;
    title: string;
    hint?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="well grid size-12 place-items-center rounded-[14px]">
                <Icon size={20} strokeWidth={1.8} className="text-text-muted/70" />
            </div>
            <p className="mt-4 text-[14px] font-semibold text-text-secondary">{title}</p>
            {hint && <p className="mt-1 max-w-[360px] text-[12.5px] leading-relaxed text-text-muted">{hint}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function SkeletonRows({ rows = 6 }: { rows?: number }) {
    return (
        <div className="space-y-3 p-5" aria-hidden>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="skel h-10" style={{ opacity: Math.max(0.25, 1 - i * 0.14) }} />
            ))}
        </div>
    );
}
