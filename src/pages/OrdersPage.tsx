import React, { useState, useEffect } from 'react';
import { hardwareService, jobService, userService } from '../services/api';
import { Search, Filter, RefreshCw, FileText, Clock, CheckCircle, AlertCircle, Loader2, IndianRupee, MapPin, User, ChevronDown, X, ArrowRightCircle } from 'lucide-react';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'QUEUED', 'PRINTING', 'COMPLETED', 'PRINTED_PENDING_STACK', 'COLLECTED', 'CANCELLED'];

// What extra data each target status needs before it can be applied.
// Used by the one-click status-badge chain to decide whether to advance
// instantly or first pop up a small form asking for that data.
const STATUS_REQUIRES: Record<string, 'printer' | 'stack' | 'reason' | null> = {
    QUEUED: null,
    PRINTING: 'printer',
    COMPLETED: 'stack',
    PRINTED_PENDING_STACK: null,
    COLLECTED: null,
    CANCELLED: 'reason',
    FAILED: 'reason',
};

// The single "next" status for the one-click chain on the status badge —
// same idea as the Available/Occupied toggle on Hardware & Locations, but
// following a fixed progression instead of a binary flip. Terminal states
// (null) do nothing when clicked.
const ORDER_STATUS_CHAIN: Record<string, string | null> = {
    PENDING: 'QUEUED',
    QUEUED: 'PRINTING',
    PRINTING: 'COMPLETED',
    PRINTED_PENDING_STACK: 'COMPLETED',
    COMPLETED: 'COLLECTED',
    COLLECTED: null,
    CANCELLED: null,
    FAILED: null,
};

const STATUS_STYLES: Record<string, string> = {
    PENDING:   'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
    QUEUED:    'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/10 dark:text-neutral-400',
    PRINTING:  'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    COMPLETED: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
    PRINTED_PENDING_STACK: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    COLLECTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    CANCELLED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    FAILED:    'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING:   <Clock className="w-3 h-3" />,
    QUEUED:    <Clock className="w-3 h-3" />,
    PRINTING:  <Loader2 className="w-3 h-3 animate-spin" />,
    COMPLETED: <CheckCircle className="w-3 h-3" />,
    PRINTED_PENDING_STACK: <AlertCircle className="w-3 h-3" />,
    COLLECTED: <CheckCircle className="w-3 h-3" />,
    CANCELLED: <AlertCircle className="w-3 h-3" />,
    FAILED:    <AlertCircle className="w-3 h-3" />,
};

const OrdersPage: React.FC = () => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [locations, setLocations] = useState<any[]>([]);

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [userFilter, setUserFilter] = useState('ALL');
    const [locationFilter, setLocationFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [selectedJob, setSelectedJob] = useState<any>(null);

    // Small dedicated popup that only appears when advancing a status needs
    // extra data (a printer, a stack, or a reason). Never opens the details card.
    const [statusJob, setStatusJob] = useState<any>(null);   // the job being advanced
    const [statusTarget, setStatusTarget] = useState('');    // the next status
    const [statusReason, setStatusReason] = useState('');
    const [statusPrinterId, setStatusPrinterId] = useState('');
    const [statusStackId, setStatusStackId] = useState('');
    const [jobPrinters, setJobPrinters] = useState<any[]>([]);
    const [jobStacks, setJobStacks] = useState<any[]>([]);
    const [statusSaving, setStatusSaving] = useState(false);

    useEffect(() => { loadInitialData(); }, []);

    const statusRequirement = statusTarget ? STATUS_REQUIRES[statusTarget] : null;
    const canConfirmStatus = !!statusTarget && (
        statusRequirement === 'printer' ? !!statusPrinterId :
        statusRequirement === 'stack' ? !!statusStackId :
        statusRequirement === 'reason' ? statusReason.trim().length > 0 :
        true
    );

    const applyStatus = async (job: any, next: string, extra: Record<string, any> = {}) => {
        if (next === 'CANCELLED') {
            await jobService.cancel({ jobId: job._id, reason: extra.failureReason || '' });
        } else {
            await jobService.edit({ jobId: job._id, status: next, ...extra });
        }
        await loadInitialData();
    };

    // Click the status badge → escalate one step in the chain (like the
    // Available/Occupied toggle on Hardware & Locations). No extra data →
    // apply instantly, inline. Needs data → open the small data popup only.
    const handleStatusBadgeClick = async (e: React.MouseEvent, job: any) => {
        e.stopPropagation();
        const next = ORDER_STATUS_CHAIN[job.status];
        if (!next) return;
        if (!STATUS_REQUIRES[next]) {
            try {
                await applyStatus(job, next);
            } catch (err) { console.error('Failed to advance status', err); }
            return;
        }
        // Open the data popup and preload printer/stack choices. Prefer the
        // job's own location, but fall back to every location's hardware so
        // orders placed without a location can still be assigned one.
        setStatusJob(job);
        setStatusTarget(next);
        setStatusReason(''); setStatusPrinterId(''); setStatusStackId('');
        setJobPrinters([]); setJobStacks([]);
        loadHardwareChoices(job?.locationId?._id || job?.locationId);
    };

    const loadHardwareChoices = async (jobLocId?: string) => {
        // Which locations to pull hardware from: the job's own, or all of them.
        const locIds: string[] = jobLocId
            ? [jobLocId]
            : locations.map(l => l._id).filter(Boolean);

        const label = (item: any, locId: string) => {
            const loc = locations.find(l => l._id === locId);
            return loc && !jobLocId ? { ...item, _label: `${item.name} · ${loc.name}` } : { ...item, _label: item.name };
        };

        try {
            const printerResults = await Promise.all(
                locIds.map(id => hardwareService.getPrinters(id).then(d => (d?.DATA || d || []).map((p: any) => label(p, id))).catch(() => []))
            );
            const stackResults = await Promise.all(
                locIds.map(id => hardwareService.getStacks(id).then(d => (d?.DATA || d || []).map((s: any) => label(s, id))).catch(() => []))
            );
            setJobPrinters(printerResults.flat());
            setJobStacks(stackResults.flat());
        } catch (err) {
            console.error('Failed to load hardware choices', err);
        }
    };

    const handleConfirmStatus = async () => {
        if (!statusJob || !statusTarget || !canConfirmStatus) return;
        setStatusSaving(true);
        try {
            // If the job had no location, inherit it from the chosen hardware
            // so the record stays consistent.
            const jobHasLoc = !!(statusJob?.locationId?._id || statusJob?.locationId);
            const chosenPrinter = jobPrinters.find(p => p._id === statusPrinterId);
            const chosenStack = jobStacks.find(s => s._id === statusStackId);
            const inheritedLoc = !jobHasLoc
                ? (statusRequirement === 'printer' ? chosenPrinter?.locationId : statusRequirement === 'stack' ? chosenStack?.locationId : undefined)
                : undefined;

            const extra: Record<string, any> =
                statusRequirement === 'printer' ? { printerId: statusPrinterId } :
                statusRequirement === 'stack' ? { stackId: statusStackId } :
                statusRequirement === 'reason' ? { failureReason: statusReason.trim() } :
                {};
            if (inheritedLoc) extra.locationId = inheritedLoc?._id || inheritedLoc;

            await applyStatus(statusJob, statusTarget, extra);
            setStatusJob(null); setStatusTarget('');
        } catch (e) {
            console.error('Failed to change status', e);
        } finally {
            setStatusSaving(false);
        }
    };

    useEffect(() => { applyFilters(); }, [jobs, statusFilter, userFilter, locationFilter, searchQuery, dateFrom, dateTo]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [jobData, userData, locData] = await Promise.all([
                jobService.getAll(),
                userService.getAll(),
                hardwareService.getLocations(),
            ]);
            setJobs(jobData?.DATA?.jobs || jobData?.DATA || jobData?.jobs || (Array.isArray(jobData) ? jobData : []));
            setUsers(userData?.DATA || userData || []);
            setLocations(locData?.DATA || locData || []);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...jobs];
        if (statusFilter !== 'ALL') result = result.filter(j => j.status === statusFilter);
        if (userFilter !== 'ALL') result = result.filter(j => (j.userId?._id || j.userId) === userFilter);
        if (locationFilter !== 'ALL') result = result.filter(j => (j.locationId?._id || j.locationId) === locationFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(j =>
                (j.referenceId || '').toLowerCase().includes(q) ||
                (j.originalName || '').toLowerCase().includes(q)
            );
        }
        if (dateFrom) result = result.filter(j => new Date(j.createdAt) >= new Date(dateFrom));
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(j => new Date(j.createdAt) <= to);
        }
        setFilteredJobs(result);
    };

    const clearFilters = () => {
        setStatusFilter('ALL'); setUserFilter('ALL'); setLocationFilter('ALL');
        setSearchQuery(''); setDateFrom(''); setDateTo('');
    };

    const getUserName = (userId: any) => {
        const id = userId?._id || userId;
        const u = users.find(u => u._id === id);
        return u?.name || u?.email || id?.toString()?.slice(-6) || '—';
    };

    const getLocationName = (locId: any) => {
        const id = locId?._id || locId;
        const l = locations.find(l => l._id === id);
        return l?.name || '—';
    };

    const hasActiveFilters = statusFilter !== 'ALL' || userFilter !== 'ALL' || locationFilter !== 'ALL' || searchQuery || dateFrom || dateTo;

    const totalRevenue = filteredJobs.reduce((s, j) => s + (j.totalCost || 0), 0);
    const statusCounts = filteredJobs.reduce((acc: any, j) => { acc[j.status] = (acc[j.status] || 0) + 1; return acc; }, {});

    const inputClass = "w-full bg-bg-secondary border border-border rounded-lg py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors duration-200";
    const selectClass = `${inputClass} appearance-none cursor-pointer px-4`;

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <header className="mb-8 max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-text">Orders</h1>
                        <p className="text-sm text-text-muted mt-1">View and filter print jobs across the system.</p>
                    </div>
                    <button onClick={loadInitialData} disabled={loading} className="flex items-center gap-2 text-sm text-text-muted hover:text-text border border-border px-4 py-2 rounded-lg transition-colors duration-200">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card p-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-primary">{filteredJobs.length}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Revenue</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-0.5"><IndianRupee className="w-4 h-4" />{totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Active</p>
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{(statusCounts['PENDING'] || 0) + (statusCounts['QUEUED'] || 0) + (statusCounts['PRINTING'] || 0)}</p>
                    </div>
                    <div className="card p-4">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Collected</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statusCounts['COLLECTED'] || 0}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2 text-text"><Filter className="w-4 h-4 text-primary" /> Filters</h3>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 transition-colors duration-200">
                                <X className="w-3 h-3" /> Clear All
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="relative col-span-1 lg:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by reference ID or file name..." className={`${inputClass} pl-10 pr-4`} />
                        </div>
                        <div className="relative">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass} style={{ colorScheme: 'light' }}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className={selectClass} style={{ colorScheme: 'light' }}>
                                <option value="ALL">All Users</option>
                                {users.map(u => <option key={u._id} value={u._id}>{u.name || u.email}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={`${inputClass} px-4`} />
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={`${inputClass} px-4`} />
                    </div>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                            <Loader2 className="w-8 h-8 animate-spin mb-3" />
                            <p>Loading orders...</p>
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div className="text-center py-16 text-text-muted">
                            <FileText className="w-14 h-14 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">No orders found</p>
                            <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                                        <th className="text-left p-4">Reference</th>
                                        <th className="text-left p-4">File</th>
                                        <th className="text-left p-4">User</th>
                                        <th className="text-left p-4">Location</th>
                                        <th className="text-left p-4">Config</th>
                                        <th className="text-right p-4">Cost</th>
                                        <th className="text-center p-4">Status</th>
                                        <th className="text-right p-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJobs.map((job) => {
                                        const status = job.status || 'PENDING';
                                        const styleClass = STATUS_STYLES[status] || STATUS_STYLES['PENDING'];
                                        const icon = STATUS_ICONS[status] || STATUS_ICONS['PENDING'];
                                        return (
                                            <tr
                                                key={job._id}
                                                className="border-b border-border hover:bg-bg-secondary cursor-pointer transition-colors duration-200"
                                                onClick={() => setSelectedJob(job)}
                                            >
                                                <td className="p-4 font-mono text-xs text-primary">{job.referenceId || job._id?.slice(-8)}</td>
                                                <td className="p-4 max-w-[180px] truncate text-text">{job.originalName || '—'}</td>
                                                <td className="p-4">
                                                    <span className="flex items-center gap-1.5 text-text-secondary">
                                                        <User className="w-3 h-3 text-text-muted" />
                                                        {getUserName(job.userId)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="flex items-center gap-1.5 text-text-secondary">
                                                        <MapPin className="w-3 h-3 text-text-muted" />
                                                        {getLocationName(job.locationId)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-text-muted text-xs">
                                                    {job.pageType || 'A4'} &middot; {job.colorMode === 'COLOR' ? 'Color' : 'B&W'} &middot; {job.printSide === 'DOUBLE' ? 'Double' : 'Single'} &middot; {job.copies || 1}x
                                                </td>
                                                <td className="p-4 text-right font-bold text-primary flex items-center justify-end gap-0.5">
                                                    <IndianRupee className="w-3 h-3" />{job.totalCost?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleStatusBadgeClick(e, job)}
                                                        title={ORDER_STATUS_CHAIN[status] ? `Advance to ${ORDER_STATUS_CHAIN[status]}` : 'Final status'}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md ${styleClass} ${ORDER_STATUS_CHAIN[status] ? 'cursor-pointer hover:opacity-75' : 'cursor-default'} transition-opacity duration-150`}
                                                    >
                                                        {icon}{status}
                                                    </button>
                                                </td>
                                                <td className="p-4 text-right text-text-muted text-xs">
                                                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedJob && (
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
                        <div
                            className="card p-8 w-full max-w-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-text">Order Details</h3>
                                <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-bg-secondary rounded-full transition-colors duration-200"><X className="w-5 h-5 text-text-muted" /></button>
                            </div>
                            <div className="space-y-4 text-sm">
                                <DetailRow label="Reference ID" value={selectedJob.referenceId || selectedJob._id} />
                                <DetailRow label="File" value={selectedJob.originalName || '—'} />
                                <DetailRow label="User" value={getUserName(selectedJob.userId)} />
                                <DetailRow label="Location" value={getLocationName(selectedJob.locationId)} />
                                <DetailRow label="Pages" value={selectedJob.totalPagesToPrint || 0} />
                                <DetailRow label="Copies" value={selectedJob.copies || 1} />
                                <DetailRow label="Color" value={selectedJob.colorMode === 'COLOR' ? 'Colour' : 'B&W'} />
                                <DetailRow label="Side" value={selectedJob.printSide === 'DOUBLE' ? 'Double' : 'Single'} />
                                <DetailRow label="Page Size" value={selectedJob.pageType || 'A4'} />
                                <DetailRow label="Total Cost" value={`₹${selectedJob.totalCost?.toFixed(2) || '0.00'}`} highlight />
                                <DetailRow label="Status" value={selectedJob.status} />
                                <DetailRow label="Created" value={new Date(selectedJob.createdAt).toLocaleString('en-IN')} />
                                {selectedJob.printedAt && <DetailRow label="Printed At" value={new Date(selectedJob.printedAt).toLocaleString('en-IN')} />}
                                {selectedJob.completedAt && <DetailRow label="Completed At" value={new Date(selectedJob.completedAt).toLocaleString('en-IN')} />}
                                {selectedJob.collectedAt && <DetailRow label="Collected At" value={new Date(selectedJob.collectedAt).toLocaleString('en-IN')} />}
                            </div>
                        </div>
                    </div>
                )}

                {/* Status-advance data popup — only shown when the next status
                    in the chain needs a printer, stack, or reason. */}
                {statusJob && (
                    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !statusSaving && setStatusJob(null)}>
                        <div className="card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-lg font-bold text-text flex items-center gap-2">
                                    <ArrowRightCircle className="w-5 h-5 text-primary" /> Move to {statusTarget}
                                </h3>
                                <button onClick={() => setStatusJob(null)} disabled={statusSaving} className="p-2 hover:bg-bg-secondary rounded-full transition-colors duration-200"><X className="w-5 h-5 text-text-muted" /></button>
                            </div>
                            <p className="text-xs text-text-muted mb-5">
                                {statusJob.referenceId || statusJob._id?.slice(-8)} · {statusJob.status} → {statusTarget}
                            </p>

                            <div className="space-y-3">
                                {statusRequirement === 'printer' && (
                                    <div>
                                        <label className="block text-xs text-text-muted mb-1.5">Assign printer</label>
                                        {jobPrinters.length === 0 ? (
                                            <p className="text-xs text-accent bg-accent/10 rounded-lg px-3 py-2">No printers configured. Add one on the Hardware &amp; Locations page first.</p>
                                        ) : (
                                            <select value={statusPrinterId} onChange={e => setStatusPrinterId(e.target.value)} className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" style={{ colorScheme: 'light' }}>
                                                <option value="">Choose a printer…</option>
                                                {jobPrinters.map(p => <option key={p._id} value={p._id}>{p._label || p.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}
                                {statusRequirement === 'stack' && (
                                    <div>
                                        <label className="block text-xs text-text-muted mb-1.5">Assign stack / tray</label>
                                        {jobStacks.length === 0 ? (
                                            <p className="text-xs text-accent bg-accent/10 rounded-lg px-3 py-2">No stacks configured. Add one on the Hardware &amp; Locations page first.</p>
                                        ) : (
                                            <select value={statusStackId} onChange={e => setStatusStackId(e.target.value)} className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" style={{ colorScheme: 'light' }}>
                                                <option value="">Choose a stack…</option>
                                                {jobStacks.map(s => <option key={s._id} value={s._id}>{s._label || s.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}
                                {statusRequirement === 'reason' && (
                                    <div>
                                        <label className="block text-xs text-text-muted mb-1.5">{statusTarget === 'CANCELLED' ? 'Reason for cancellation' : 'Reason for failure'}</label>
                                        <input
                                            value={statusReason}
                                            onChange={e => setStatusReason(e.target.value)}
                                            autoFocus
                                            placeholder="Enter a reason…"
                                            className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                )}

                                <button
                                    onClick={handleConfirmStatus}
                                    disabled={!canConfirmStatus || statusSaving}
                                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 flex items-center justify-center gap-2 transition-colors duration-200 shadow-sm mt-2"
                                >
                                    {statusSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightCircle className="w-4 h-4" />}
                                    Confirm → {statusTarget}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const DetailRow: React.FC<{ label: string; value: any; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center py-2 border-b border-border">
        <span className="text-text-muted">{label}</span>
        <span className={highlight ? 'text-primary font-bold text-lg' : 'font-medium text-text'}>{value}</span>
    </div>
);

export default OrdersPage;
