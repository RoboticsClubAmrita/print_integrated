import React, { useState, useEffect } from 'react';
import { penaltyService, userService } from '../services/api';
import { AlertCircle, CheckCircle, Clock, Loader2, RefreshCw, IndianRupee, X, ShieldOff } from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'ACCRUING', 'UNPAID', 'PAID', 'WAIVED', 'CANCELLED'];

const STATUS_STYLES: Record<string, string> = {
    ACCRUING: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    UNPAID:   'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    PAID:     'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    WAIVED:   'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/10 dark:text-neutral-400',
    CANCELLED:'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/10 dark:text-neutral-400',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    ACCRUING: <Clock className="w-3 h-3" />,
    UNPAID:   <AlertCircle className="w-3 h-3" />,
    PAID:     <CheckCircle className="w-3 h-3" />,
    WAIVED:   <ShieldOff className="w-3 h-3" />,
    CANCELLED:<X className="w-3 h-3" />,
};

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

    const inputClass = "w-full bg-bg-secondary border border-border rounded-lg py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors duration-200";
    const selectClass = `${inputClass} appearance-none cursor-pointer px-4`;

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <header className="mb-8 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text">Penalties</h1>
                        <p className="text-sm text-text-muted mt-1">Auditable ledger of uncollected-materials storage fees.</p>
                    </div>
                    <button onClick={load} disabled={loading} className="flex items-center gap-2 text-sm text-text-muted hover:text-text border border-border px-4 py-2 rounded-lg transition-colors duration-200">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="card p-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Records</p>
                        <p className="text-2xl font-bold text-primary">{penalties.length}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Outstanding</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5"><IndianRupee className="w-4 h-4" />{totalOutstanding.toFixed(2)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Waived</p>
                        <p className="text-2xl font-bold text-text-secondary">{penalties.filter(p => p.status === 'WAIVED').length}</p>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="relative w-full md:w-64">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                            <Loader2 className="w-8 h-8 animate-spin mb-3" />
                            <p>Loading penalties...</p>
                        </div>
                    ) : penalties.length === 0 ? (
                        <div className="text-center py-16 text-text-muted">
                            <ShieldOff className="w-14 h-14 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">No penalty records found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                                        <th className="text-left p-4">Job</th>
                                        <th className="text-left p-4">User</th>
                                        <th className="text-left p-4">Reason</th>
                                        <th className="text-left p-4">Rate</th>
                                        <th className="text-right p-4">Intervals</th>
                                        <th className="text-right p-4">Amount</th>
                                        <th className="text-right p-4">Outstanding</th>
                                        <th className="text-center p-4">Status</th>
                                        <th className="text-left p-4">Started</th>
                                        <th className="text-center p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {penalties.map((p) => (
                                        <tr key={p._id} className="border-b border-border hover:bg-bg-secondary transition-colors duration-200">
                                            <td className="p-4 font-mono text-xs text-primary">{p.referenceId || p.jobId?.slice(-8)}</td>
                                            <td className="p-4 text-text-secondary">{getUserName(p.userId)}</td>
                                            <td className="p-4 text-text-muted text-xs">{p.reason}</td>
                                            <td className="p-4 text-text-muted text-xs">
                                                ₹{p.ruleSnapshot?.ratePerInterval}/{p.ruleSnapshot?.intervalMinutes}min
                                                <span className="block opacity-70">({p.ruleSnapshot?.freeMinutes}min free)</span>
                                            </td>
                                            <td className="p-4 text-right text-text-secondary">{p.intervalsCharged}</td>
                                            <td className="p-4 text-right font-bold text-text flex items-center justify-end gap-0.5">
                                                <IndianRupee className="w-3 h-3" />{(p.amount || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right font-bold text-red-600 dark:text-red-400">
                                                {(p.status === 'PAID' || p.status === 'WAIVED') ? '—' : `₹${outstanding(p).toFixed(2)}`}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md ${STATUS_STYLES[p.status] || ''}`}>
                                                    {STATUS_ICONS[p.status]}{p.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-text-muted text-xs">
                                                {p.accrualStartAt ? new Date(p.accrualStartAt).toLocaleString('en-IN') : '—'}
                                            </td>
                                            <td className="p-4 text-center">
                                                {(p.status === 'ACCRUING' || p.status === 'UNPAID') && (
                                                    <button
                                                        onClick={() => openWaive(p)}
                                                        className="text-xs text-accent hover:text-accent/80 border border-border px-2.5 py-1.5 rounded-md transition-colors duration-200"
                                                    >
                                                        Waive
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {waivingId && (
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !waiveSaving && setWaivingId(null)}>
                        <div className="card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                                    <ShieldOff className="w-5 h-5 text-primary" /> Waive Penalty
                                </h3>
                                <button onClick={() => setWaivingId(null)} disabled={waiveSaving} className="p-2 hover:bg-bg-secondary rounded-full transition-colors duration-200"><X className="w-5 h-5 text-text-muted" /></button>
                            </div>
                            <label className="block text-xs text-text-muted mb-1.5">Reason (optional)</label>
                            <input
                                value={waiveReason}
                                onChange={e => setWaiveReason(e.target.value)}
                                autoFocus
                                placeholder="e.g. goodwill exception"
                                className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary mb-4"
                            />
                            <button
                                onClick={confirmWaive}
                                disabled={waiveSaving}
                                className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/40 text-white font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors duration-200"
                            >
                                {waiveSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                                Confirm Waive
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PenaltiesPage;
