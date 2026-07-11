import React, { useState, useEffect } from 'react';
import { penaltyService, userService } from '../services/api';
import { Loader2, RefreshCw, ShieldOff, Timer } from 'lucide-react';
import {
    Dialog,
    EmptyState,
    Field,
    PageHeader,
    SkeletonRows,
    StatusChip,
    fmtDateTime,
    inr,
} from '../components/admin/ui';
import { clsx } from 'clsx';

const STATUS_OPTIONS = ['ALL', 'ACCRUING', 'UNPAID', 'PAID', 'WAIVED', 'CANCELLED'];

/**
 * Penalties — the auditable ledger of uncollected-materials fees.
 * ACCRUING rows literally tick (pulsing amber) until someone collects,
 * pays, or an operator waives.
 */
const PenaltiesPage: React.FC = () => {
    const [penalties, setPenalties] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [waivingId, setWaivingId] = useState<string | null>(null);
    const [waiveReason, setWaiveReason] = useState('');
    const [waiveSaving, setWaiveSaving] = useState(false);

    useEffect(() => { load(); }, [statusFilter]);

    const load = async () => {
        setLoading(true);
        try {
            const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
            const [data, userData] = await Promise.all([
                penaltyService.getAll(params),
                users.length ? Promise.resolve(null) : userService.getAll(),
            ]);
            setPenalties(data?.DATA?.penalties || data?.penalties || []);
            if (userData) setUsers(userData?.DATA || userData || []);
        } catch (e) { console.error('Failed to load penalties', e); }
        finally { setLoading(false); }
    };

    const getUserName = (userId: any) => {
        const id = userId?._id || userId;
        const u = users.find(u => u._id === id);
        return u?.name || u?.email || id?.toString()?.slice(-6) || '—';
    };

    const outstanding = (p: any) => Math.max(0, (p.amount || 0) - (p.settledAmount || 0));

    const openWaive = (p: any) => { setWaivingId(p._id); setWaiveReason(''); };

    const confirmWaive = async () => {
        if (!waivingId) return;
        setWaiveSaving(true);
        try {
            await penaltyService.waive(waivingId, waiveReason.trim() || 'Waived by admin');
            setWaivingId(null);
            await load();
        } catch (e) { console.error('Failed to waive penalty', e); }
        finally { setWaiveSaving(false); }
    };

    const totalOutstanding = penalties
        .filter(p => p.status === 'ACCRUING' || p.status === 'UNPAID')
        .reduce((sum, p) => sum + outstanding(p), 0);

    return (
        <>
            <PageHeader
                title="Penalties"
                sub="Auditable ledger of uncollected-materials storage fees."
                meta={`${penalties.length} ${penalties.length === 1 ? 'RECORD' : 'RECORDS'} · ${inr(totalOutstanding)} OUTSTANDING`}
                actions={
                    <button onClick={load} disabled={loading} className="btn-ghost">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                }
            />

            <div className="space-y-5">
                {/* Status rail */}
                <div className="seg max-w-full overflow-x-auto">
                    {STATUS_OPTIONS.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStatusFilter(s)}
                            className={clsx(statusFilter === s && 'on')}
                        >
                            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {/* Ledger */}
                <div className="panel overflow-hidden">
                    {loading ? (
                        <SkeletonRows rows={6} />
                    ) : penalties.length === 0 ? (
                        <EmptyState
                            icon={Timer}
                            title={statusFilter === 'ALL' ? 'No penalty records' : `No ${statusFilter.toLowerCase()} penalties`}
                            hint="Fees appear here when printed jobs sit uncollected past the free window."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>Job</th>
                                        <th>User</th>
                                        <th>Reason</th>
                                        <th>Rate</th>
                                        <th className="!text-right">Intervals</th>
                                        <th className="!text-right">Amount</th>
                                        <th className="!text-right">Outstanding</th>
                                        <th className="!text-center">Status</th>
                                        <th>Started</th>
                                        <th className="!text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {penalties.map((p) => {
                                        const due = p.status === 'ACCRUING' || p.status === 'UNPAID';
                                        return (
                                            <tr key={p._id} className="group">
                                                <td className="mono whitespace-nowrap text-[12px] text-text-secondary">
                                                    {p.referenceId || p.jobId?.slice(-8)}
                                                </td>
                                                <td className="whitespace-nowrap text-text-secondary">{getUserName(p.userId)}</td>
                                                <td className="max-w-[180px] truncate text-[12.5px] text-text-muted" title={p.reason}>
                                                    {p.reason}
                                                </td>
                                                <td className="mono whitespace-nowrap text-[11px] leading-snug text-text-muted">
                                                    ₹{p.ruleSnapshot?.ratePerInterval}/{p.ruleSnapshot?.intervalMinutes}MIN
                                                    <span className="block opacity-70">{p.ruleSnapshot?.freeMinutes}MIN FREE</span>
                                                </td>
                                                <td className="mono !text-right whitespace-nowrap text-text-secondary">{p.intervalsCharged}</td>
                                                <td className="mono !text-right whitespace-nowrap text-text">{inr(p.amount)}</td>
                                                <td className={clsx('mono !text-right whitespace-nowrap', due ? 'text-[#ff8d85]' : 'text-text-muted')}>
                                                    {due ? inr(outstanding(p)) : '—'}
                                                </td>
                                                <td className="!text-center whitespace-nowrap"><StatusChip status={p.status} /></td>
                                                <td className="mono whitespace-nowrap text-[11px] text-text-muted">
                                                    {p.accrualStartAt ? fmtDateTime(p.accrualStartAt) : '—'}
                                                </td>
                                                <td className="!text-right whitespace-nowrap">
                                                    {due && (
                                                        <button
                                                            onClick={() => openWaive(p)}
                                                            className="btn-ghost !h-7 !rounded-[8px] !px-2.5 text-[11.5px] opacity-0 transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100"
                                                        >
                                                            <ShieldOff size={12} /> Waive
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Waive */}
            {waivingId && (
                <Dialog
                    title="Waive penalty"
                    icon={ShieldOff}
                    meta="THE FEE STOPS HERE · LOGGED FOR AUDIT"
                    onClose={() => setWaivingId(null)}
                    closeDisabled={waiveSaving}
                    width="max-w-sm"
                >
                    <div className="space-y-4">
                        <Field label="Reason (optional)">
                            <input
                                value={waiveReason}
                                onChange={e => setWaiveReason(e.target.value)}
                                autoFocus
                                placeholder="e.g. goodwill exception"
                                className="ctl"
                            />
                        </Field>
                        <button onClick={confirmWaive} disabled={waiveSaving} className="press-btn w-full">
                            {waiveSaving ? <Loader2 size={15} className="animate-spin" /> : <ShieldOff size={15} />}
                            Confirm waive
                        </button>
                    </div>
                </Dialog>
            )}
        </>
    );
};

export default PenaltiesPage;
