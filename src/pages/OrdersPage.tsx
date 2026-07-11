import React, { useState, useEffect } from 'react';
import { hardwareService, jobService, userService } from '../services/api';
import {
    ArrowRightCircle,
    ClipboardList,
    FileText,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    User,
    X,
} from 'lucide-react';
import {
    Dialog,
    EmptyState,
    Field,
    PageHeader,
    SkeletonRows,
    SlideOver,
    StatusChip,
    fmtDate,
    fmtDateTime,
    inr,
} from '../components/admin/ui';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'SCHEDULED', 'QUEUED', 'PRINTING', 'COMPLETED', 'PRINTED_PENDING_STACK', 'COLLECTED', 'CANCELLED'];

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
// terminal states (null) do nothing when clicked. SCHEDULED is promoted
// to QUEUED by a backend cron, never by hand.
const ORDER_STATUS_CHAIN: Record<string, string | null> = {
    PENDING: 'QUEUED',
    SCHEDULED: null,
    QUEUED: 'PRINTING',
    PRINTING: 'COMPLETED',
    PRINTED_PENDING_STACK: 'COMPLETED',
    COMPLETED: 'COLLECTED',
    COLLECTED: null,
    CANCELLED: null,
    FAILED: null,
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
    // extra data (a printer, a stack, or a reason). Never opens the details.
    const [statusJob, setStatusJob] = useState<any>(null);
    const [statusTarget, setStatusTarget] = useState('');
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

    // Click the status badge → escalate one step in the chain. No extra data
    // needed → apply instantly, inline. Needs data → open the small popup.
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

    const hasActiveFilters = statusFilter !== 'ALL' || userFilter !== 'ALL' || locationFilter !== 'ALL' || !!searchQuery || !!dateFrom || !!dateTo;

    const totalRevenue = filteredJobs.reduce((s, j) => s + (j.totalCost || 0), 0);

    const configLine = (j: any) =>
        `${j.pageType || 'A4'} · ${j.colorMode === 'COLOR' ? 'COLOUR' : 'B&W'} · ${j.printSide === 'DOUBLE' ? '2-SIDE' : '1-SIDE'} · ${j.copies || 1}×`;

    return (
        <>
            <PageHeader
                title="Orders"
                meta={`${filteredJobs.length} ${filteredJobs.length === 1 ? 'ORDER' : 'ORDERS'} · ${inr(totalRevenue)} ON THE BOOKS`}
                actions={
                    <button onClick={loadInitialData} disabled={loading} className="btn-ghost">
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                }
            />

            <div className="space-y-5">
                {/* Toolbar — filters as a workbench strip, not a card of cards. */}
                <div className="panel flex flex-wrap items-center gap-2.5 px-3.5 py-3">
                    <div className="relative min-w-[220px] flex-1">
                        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search reference or file…"
                            className="ctl !pl-10"
                        />
                    </div>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="ctl w-auto min-w-[130px] flex-none pr-8">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s.replace(/_/g, ' ')}</option>)}
                    </select>
                    <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="ctl w-auto min-w-[130px] max-w-[180px] flex-none pr-8">
                        <option value="ALL">All users</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name || u.email}</option>)}
                    </select>
                    <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="ctl w-auto min-w-[130px] max-w-[180px] flex-none pr-8">
                        <option value="ALL">All locations</option>
                        {locations.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                    </select>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="ctl w-auto flex-none" aria-label="From date" />
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="ctl w-auto flex-none" aria-label="To date" />
                    {hasActiveFilters && (
                        <button onClick={clearFilters} className="btn-ghost flex-none !px-3" title="Clear all filters">
                            <X size={14} /> Clear
                        </button>
                    )}
                </div>

                {/* The ledger. */}
                <div className="panel overflow-hidden">
                    {loading ? (
                        <SkeletonRows rows={8} />
                    ) : filteredJobs.length === 0 ? (
                        <EmptyState
                            icon={ClipboardList}
                            title={hasActiveFilters ? 'No orders match these filters' : 'No orders yet'}
                            hint={hasActiveFilters ? 'Loosen or clear the filters to see the rest of the ledger.' : 'Jobs appear here the moment they are submitted.'}
                            action={hasActiveFilters ? (
                                <button onClick={clearFilters} className="btn-ghost"><X size={14} /> Clear filters</button>
                            ) : undefined}
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="tbl">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>File</th>
                                        <th>User</th>
                                        <th>Location</th>
                                        <th>Config</th>
                                        <th className="!text-right">Cost</th>
                                        <th className="!text-center">Status</th>
                                        <th className="!text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJobs.map((job) => {
                                        const next = ORDER_STATUS_CHAIN[job.status || 'PENDING'];
                                        return (
                                            <tr
                                                key={job._id}
                                                className="cursor-pointer"
                                                onClick={() => setSelectedJob(job)}
                                            >
                                                <td className="mono whitespace-nowrap text-[12px] text-text-secondary">
                                                    {job.referenceId || job._id?.slice(-8)}
                                                </td>
                                                <td className="max-w-[190px] truncate font-medium text-text">
                                                    {job.originalName || '—'}
                                                </td>
                                                <td className="whitespace-nowrap text-text-secondary">
                                                    <span className="flex items-center gap-1.5">
                                                        <User size={12} className="text-text-muted" />
                                                        {getUserName(job.userId)}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap text-text-secondary">
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin size={12} className="text-text-muted" />
                                                        {getLocationName(job.locationId)}
                                                    </span>
                                                </td>
                                                <td className="mono whitespace-nowrap text-[11px] text-text-muted">
                                                    {configLine(job)}
                                                </td>
                                                <td className="mono !text-right whitespace-nowrap text-text">
                                                    {inr(job.totalCost)}
                                                </td>
                                                <td className="!text-center whitespace-nowrap">
                                                    <StatusChip
                                                        status={job.status || 'PENDING'}
                                                        onAdvance={(e) => handleStatusBadgeClick(e, job)}
                                                        disabled={!next}
                                                        advanceTitle={next ? `Advance to ${next.replace(/_/g, ' ')}` : 'Final status'}
                                                    />
                                                </td>
                                                <td className="mono !text-right whitespace-nowrap text-[11.5px] text-text-muted">
                                                    {fmtDate(job.createdAt)}
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

            {/* Order detail — a slide-over ledger card, not a modal wall. */}
            {selectedJob && (
                <SlideOver
                    title={selectedJob.originalName || 'Order'}
                    meta={`${selectedJob.referenceId || selectedJob._id} · ${(selectedJob.status || '').replace(/_/g, ' ')}`}
                    onClose={() => setSelectedJob(null)}
                >
                    <div className="well mb-5 flex items-center gap-3.5 px-4 py-3.5">
                        <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-white/6">
                            <FileText size={17} className="text-text-secondary" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-bold text-text">{selectedJob.originalName || '—'}</p>
                            <p className="mono mt-0.5 text-[11px] text-text-muted">{configLine(selectedJob)}</p>
                        </div>
                        <StatusChip status={selectedJob.status || 'PENDING'} />
                    </div>

                    <DetailSection label="JOB">
                        <DetailRow k="User" v={getUserName(selectedJob.userId)} />
                        <DetailRow k="Location" v={getLocationName(selectedJob.locationId)} />
                        <DetailRow
                            k="Pages"
                            v={selectedJob.selectedPages?.length
                                ? `${formatPageRanges(selectedJob.selectedPages)} (${selectedJob.totalPagesToPrint} of file)`
                                : String(selectedJob.totalPagesToPrint || 0)}
                            mono
                        />
                        <DetailRow k="Copies" v={String(selectedJob.copies || 1)} mono />
                        <DetailRow k="Colour" v={selectedJob.colorMode === 'COLOR' ? 'Colour' : 'B&W'} />
                        <DetailRow k="Side" v={selectedJob.printSide === 'DOUBLE' ? 'Double' : 'Single'} />
                        <DetailRow k="Page size" v={selectedJob.pageType || 'A4'} />
                        {selectedJob.stackName && !selectedJob.collectedStackName && (
                            <DetailRow k="Stack" v={selectedJob.stackName} />
                        )}
                        {selectedJob.collectedStackName && (
                            <DetailRow k="Collected from" v={selectedJob.collectedStackName} />
                        )}
                    </DetailSection>

                    <div className="receipt-rule my-4" />
                    <div className="flex items-baseline justify-between px-0.5">
                        <span className="receipt-line !text-white/60">TOTAL</span>
                        <span className="mono text-[22px] leading-none text-text">{inr(selectedJob.totalCost)}</span>
                    </div>
                    <div className="receipt-rule my-4" />

                    <DetailSection label="TIMELINE">
                        <DetailRow k="Created" v={fmtDateTime(selectedJob.createdAt)} mono />
                        {selectedJob.scheduleType === 'SCHEDULED' && selectedJob.scheduledFor && (
                            <DetailRow k="Scheduled for" v={fmtDateTime(selectedJob.scheduledFor)} mono />
                        )}
                        {selectedJob.printedAt && <DetailRow k="Printed" v={fmtDateTime(selectedJob.printedAt)} mono />}
                        {selectedJob.completedAt && <DetailRow k="Completed" v={fmtDateTime(selectedJob.completedAt)} mono />}
                        {selectedJob.collectedAt && <DetailRow k="Collected" v={fmtDateTime(selectedJob.collectedAt)} mono />}
                    </DetailSection>
                </SlideOver>
            )}

            {/* Status-advance popup — only when the next step needs data. */}
            {statusJob && (
                <Dialog
                    title={`Advance to ${statusTarget.replace(/_/g, ' ')}`}
                    icon={ArrowRightCircle}
                    meta={`${statusJob.referenceId || statusJob._id?.slice(-8)} · ${statusJob.status} → ${statusTarget}`}
                    onClose={() => setStatusJob(null)}
                    closeDisabled={statusSaving}
                    width="max-w-sm"
                >
                    <div className="space-y-4">
                        {statusRequirement === 'printer' && (
                            <Field label="Assign printer">
                                {jobPrinters.length === 0 ? (
                                    <p className="chip--wait rounded-[10px] border px-3 py-2.5 text-[12px] font-semibold">
                                        No printers configured. Add one on the Hardware page first.
                                    </p>
                                ) : (
                                    <select value={statusPrinterId} onChange={e => setStatusPrinterId(e.target.value)} className="ctl">
                                        <option value="">Choose a printer…</option>
                                        {jobPrinters.map(p => <option key={p._id} value={p._id}>{p._label || p.name}</option>)}
                                    </select>
                                )}
                            </Field>
                        )}
                        {statusRequirement === 'stack' && (
                            <Field label="Assign stack / tray">
                                {jobStacks.length === 0 ? (
                                    <p className="chip--wait rounded-[10px] border px-3 py-2.5 text-[12px] font-semibold">
                                        No stacks configured. Add one on the Hardware page first.
                                    </p>
                                ) : (
                                    <select value={statusStackId} onChange={e => setStatusStackId(e.target.value)} className="ctl">
                                        <option value="">Choose a stack…</option>
                                        {jobStacks.map(s => <option key={s._id} value={s._id}>{s._label || s.name}</option>)}
                                    </select>
                                )}
                            </Field>
                        )}
                        {statusRequirement === 'reason' && (
                            <Field label={statusTarget === 'CANCELLED' ? 'Reason for cancellation' : 'Reason for failure'}>
                                <input
                                    value={statusReason}
                                    onChange={e => setStatusReason(e.target.value)}
                                    autoFocus
                                    placeholder="Enter a reason…"
                                    className="ctl"
                                />
                            </Field>
                        )}

                        <button
                            onClick={handleConfirmStatus}
                            disabled={!canConfirmStatus || statusSaving}
                            className="press-btn w-full"
                        >
                            {statusSaving ? <Loader2 size={15} className="animate-spin" /> : <ArrowRightCircle size={15} />}
                            Confirm → {statusTarget.replace(/_/g, ' ')}
                        </button>
                    </div>
                </Dialog>
            )}
        </>
    );
};

// Compacts a sorted page-number array into printer-style ranges, e.g.
// [1,2,3,5,8,9] -> "1-3, 5, 8-9" — mirrors the mobile app's own formatter.
function formatPageRanges(pages: number[]): string {
    if (!pages || pages.length === 0) return '';
    const parts: string[] = [];
    let start = pages[0];
    let prev = pages[0];
    for (let i = 1; i < pages.length; i++) {
        const p = pages[i];
        if (p === prev + 1) { prev = p; continue; }
        parts.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = p; prev = p;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    return parts.join(', ');
}

const DetailSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <section className="mb-1">
        <p className="receipt-line mb-1.5">{label}</p>
        <div>{children}</div>
    </section>
);

const DetailRow: React.FC<{ k: string; v: string; mono?: boolean }> = ({ k, v, mono }) => (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/5 py-2.5 last:border-0">
        <span className="shrink-0 text-[12.5px] text-text-muted">{k}</span>
        <span className={`min-w-0 truncate text-right text-[13px] font-medium text-text ${mono ? 'mono !text-[12px]' : ''}`}>
            {v}
        </span>
    </div>
);

export default OrdersPage;
