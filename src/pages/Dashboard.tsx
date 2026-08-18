import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowRight,
    ClipboardList,
    FileText,
    Loader2,
    MapPin,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';
import { hardwareService, jobService, penaltyService, systemService, userService } from '../services/api';
// Read the session through tokenStore — "Remember me" unticked keeps it in
// sessionStorage, where a direct localStorage read finds nothing.
import { getStoredUser, getToken } from '../services/tokenStore';
import { EmptyState, LedDot, Panel, PageHeader, SkeletonRows, StatusChip, inr } from '../components/admin/ui';

/**
 * Overview — the shop floor at a glance. Live lanes on the left (what the
 * press is doing right now), the day ticket and fleet on the right (what
 * today amounts to, and whether the machines can take it). The admin's
 * personal print history is gone: Orders is the ledger, this is the floor.
 */

const parseJobs = (data: any) =>
    data?.DATA?.jobs || data?.DATA || data?.jobs || (Array.isArray(data) ? data : []);

const isToday = (d?: string) => {
    if (!d) return false;
    const a = new Date(d);
    const b = new Date();
    return (
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear()
    );
};

const LANES: { key: string; label: string; statuses: string[] }[] = [
    { key: 'waiting', label: 'Waiting', statuses: ['PENDING', 'QUEUED', 'SCHEDULED'] },
    { key: 'printing', label: 'On the press', statuses: ['PRINTING'] },
    { key: 'pickup', label: 'Awaiting pickup', statuses: ['PRINTED_PENDING_STACK', 'COMPLETED'] },
];

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [fleet, setFleet] = useState<{ loc: any; printers: any[]; stacks: any[] }[]>([]);
    const [loadingFleet, setLoadingFleet] = useState(true);
    const [accruing, setAccruing] = useState(0);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        loadAll();
        fetchCurrentUser();
    }, []);

    const loadAll = () => {
        setLoadingJobs(true);
        jobService
            .getAll()
            .then((data) => setJobs(parseJobs(data)))
            .catch((err) => console.error('Failed to load jobs', err))
            .finally(() => setLoadingJobs(false));

        setLoadingFleet(true);
        (async () => {
            try {
                const locData = await hardwareService.getLocations();
                const locs = locData?.DATA || locData || [];
                const rows = await Promise.all(
                    locs.map(async (loc: any) => ({
                        loc,
                        printers: await hardwareService
                            .getPrinters(loc._id)
                            .then((d: any) => d?.DATA || d || [])
                            .catch(() => []),
                        stacks: await hardwareService
                            .getStacks(loc._id)
                            .then((d: any) => d?.DATA || d || [])
                            .catch(() => []),
                    })),
                );
                setFleet(rows);
            } catch (err) {
                console.error('Failed to load fleet', err);
                setFleet([]);
            } finally {
                setLoadingFleet(false);
            }
        })();

        penaltyService
            .getAll({ status: 'ACCRUING' })
            .then((data: any) => setAccruing((data?.DATA?.penalties || data?.penalties || []).length))
            .catch(() => setAccruing(0));
    };

    const fetchCurrentUser = async () => {
        try {
            const storedUser = getStoredUser();
            const localUser = storedUser ? JSON.parse(storedUser) : null;
            let userId = localUser?._id || localUser?.id || localUser?.userId;

            // Fallback: decode JWT to get userId if user object not in localStorage
            if (!userId) {
                const token = getToken();
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        userId = payload?.userId || payload?.id || payload?._id;
                    } catch {
                        /* ignore decode errors */
                    }
                }
            }

            if (!userId) return;
            const res = await userService.getById(userId);
            const user = res?.DATA || res?.data || res;
            const role = user?.role;
            if (role === 'SUPER_ADMIN' || role === 'ADMIN') setIsSuperAdmin(true);
        } catch {
            const storedUser = getStoredUser();
            const localUser = storedUser ? JSON.parse(storedUser) : null;
            if (localUser?.role === 'SUPER_ADMIN' || localUser?.role === 'ADMIN') setIsSuperAdmin(true);
        }
    };

    const handleResetSystem = async () => {
        if (!confirm('WARNING: Hard reset the entire system? This cannot be undone!')) return;
        if (!confirm('FINAL WARNING: All data will be permanently deleted.')) return;
        setIsResetting(true);
        try {
            await systemService.resetSystem();
            alert('System has been fully reset.');
            navigate('/login');
        } catch (err: any) {
            alert('Reset failed: ' + (err.response?.data?.MESSAGE || err.message));
        } finally {
            setIsResetting(false);
        }
    };

    /* ————— derived ————— */

    const lanes = LANES.map((lane) => ({
        ...lane,
        jobs: jobs.filter((j) => lane.statuses.includes(j.status)),
    }));
    const liveCount = lanes.reduce((s, l) => s + l.jobs.length, 0);
    const pressRunning = lanes[1].jobs.length > 0;
    const failedCount = jobs.filter((j) => j.status === 'FAILED').length;

    const todayIn = jobs.filter((j) => isToday(j.createdAt));
    const ticket = {
        jobsIn: todayIn.length,
        printed: jobs.filter((j) => isToday(j.printedAt)).length,
        collected: jobs.filter((j) => isToday(j.collectedAt)).length,
        revenue: todayIn
            .filter((j) => !['CANCELLED', 'FAILED'].includes(j.status))
            .reduce((s, j) => s + (j.totalCost || 0), 0),
    };

    const dateLine = new Date()
        .toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
        .toUpperCase();

    const userLabel = (j: any) => j.userId?.name || j.userId?.email || null;

    return (
        <>
            <PageHeader
                title="Overview"
                meta={`${dateLine} · ${liveCount} LIVE ${liveCount === 1 ? 'JOB' : 'JOBS'} · PRESS ${pressRunning ? 'RUNNING' : 'STANDING BY'}`}
                actions={
                    <button onClick={loadAll} disabled={loadingJobs} className="btn-ghost">
                        <RefreshCw size={15} className={loadingJobs ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                }
            />

            {(accruing > 0 || failedCount > 0) && (
                <button
                    type="button"
                    onClick={() => navigate(accruing > 0 ? '/admin/penalties' : '/admin/orders')}
                    className="well well-hover mb-6 flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                    <AlertTriangle size={16} className="shrink-0 text-accent-secondary" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text-secondary">
                        Needs attention:
                        {accruing > 0 && ` ${accruing} ${accruing === 1 ? 'penalty' : 'penalties'} accruing`}
                        {accruing > 0 && failedCount > 0 && ' · '}
                        {failedCount > 0 && ` ${failedCount} ${failedCount === 1 ? 'job' : 'jobs'} failed`}
                    </span>
                    <ArrowRight size={15} className="shrink-0 text-text-muted" />
                </button>
            )}

            <div className="grid grid-cols-12 gap-5 lg:gap-6">
                {/* ————— the floor ————— */}
                <div className="col-span-12 xl:col-span-8">
                    <Panel
                        title="On the floor"
                        icon={ClipboardList}
                        actions={
                            <button
                                onClick={() => navigate('/admin/orders')}
                                className="flex items-center gap-1 text-[12.5px] font-semibold text-text-muted transition-colors hover:text-text"
                            >
                                All orders <ArrowRight size={13} />
                            </button>
                        }
                        bodyClassName="p-0"
                    >
                        {loadingJobs ? (
                            <SkeletonRows rows={7} />
                        ) : liveCount === 0 ? (
                            <EmptyState
                                icon={FileText}
                                title="The press is idle"
                                hint="New jobs land here the moment they are submitted — waiting, printing, and ready for pickup."
                            />
                        ) : (
                            <div className="divide-y divide-white/5">
                                {lanes.map((lane) => (
                                    <div key={lane.key} className="px-5 py-4">
                                        <div className="mb-2.5 flex items-center gap-2.5">
                                            <h3 className="text-[12px] font-bold tracking-wide text-text-secondary">
                                                {lane.label}
                                            </h3>
                                            <span className="mono text-[11px] text-text-muted">
                                                {lane.jobs.length}
                                            </span>
                                        </div>
                                        {lane.jobs.length === 0 ? (
                                            <p className="receipt-line !text-white/22 py-1.5">— CLEAR —</p>
                                        ) : (
                                            <div className="space-y-1.5">
                                                {lane.jobs.slice(0, 4).map((job) => (
                                                    <button
                                                        key={job._id}
                                                        type="button"
                                                        onClick={() => navigate('/admin/orders')}
                                                        className="well well-hover flex w-full items-center gap-3 px-3.5 py-2.5 text-left"
                                                    >
                                                        <span className="mono w-[86px] shrink-0 truncate text-[11.5px] text-text-secondary">
                                                            {job.referenceId || job._id?.slice(-8)}
                                                        </span>
                                                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">
                                                            {job.originalName || '—'}
                                                            {userLabel(job) && (
                                                                <span className="ml-2 text-[12px] font-normal text-text-muted">
                                                                    {userLabel(job)}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="mono shrink-0 text-[12px] text-text-secondary">
                                                            {inr(job.totalCost)}
                                                        </span>
                                                        <StatusChip status={job.status} />
                                                    </button>
                                                ))}
                                                {lane.jobs.length > 4 && (
                                                    <p className="px-1 pt-1 text-[11.5px] font-semibold text-text-muted">
                                                        + {lane.jobs.length - 4} more in Orders
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>

                {/* ————— the right rail ————— */}
                <div className="col-span-12 space-y-5 xl:col-span-4 lg:space-y-6">
                    {/* Day ticket — today, printed the way the press prints it. */}
                    <section className="panel p-5">
                        <div className="flex items-baseline justify-between">
                            <h2 className="receipt-line !text-white/60">DAY TICKET</h2>
                            <span className="receipt-line">{dateLine}</span>
                        </div>
                        <div className="receipt-rule my-4" />
                        <dl className="space-y-3">
                            {[
                                ['JOBS IN', String(ticket.jobsIn)],
                                ['PRINTED', String(ticket.printed)],
                                ['COLLECTED', String(ticket.collected)],
                            ].map(([k, v]) => (
                                <div key={k} className="flex items-baseline justify-between gap-3">
                                    <dt className="receipt-line">{k}</dt>
                                    <dd className="mono text-[15px] text-text">{loadingJobs ? '·····' : v}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="receipt-rule my-4" />
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="receipt-line !text-white/60">REVENUE</span>
                            <span className="mono text-[22px] leading-none text-text">
                                {loadingJobs ? '·····' : inr(ticket.revenue)}
                            </span>
                        </div>
                    </section>

                    {/* Fleet — real machines, real availability. */}
                    <Panel title="Fleet" icon={MapPin} bodyClassName="p-3">
                        {loadingFleet ? (
                            <SkeletonRows rows={3} />
                        ) : fleet.length === 0 ? (
                            <EmptyState
                                icon={MapPin}
                                title="No locations yet"
                                hint="Set up your first print hub to see its machines here."
                                action={
                                    <button onClick={() => navigate('/admin/locations')} className="btn-ghost">
                                        Open Hardware <ArrowRight size={14} />
                                    </button>
                                }
                            />
                        ) : (
                            <div className="space-y-2">
                                {fleet.map(({ loc, printers, stacks }) => {
                                    const up = printers.filter((p) => p.status === 'AVAILABLE').length;
                                    const free = stacks.filter((s) => s.status === 'AVAILABLE').length;
                                    return (
                                        <button
                                            key={loc._id}
                                            type="button"
                                            onClick={() => navigate('/admin/locations')}
                                            className="well well-hover block w-full px-4 py-3 text-left"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="truncate text-[13.5px] font-bold text-text">
                                                    {loc.name}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    {printers.slice(0, 6).map((p: any) => (
                                                        <LedDot
                                                            key={p._id}
                                                            tone={p.status === 'AVAILABLE' ? 'ok' : 'bad'}
                                                            title={`${p.name} · ${p.status === 'AVAILABLE' ? 'available' : 'unavailable'}`}
                                                        />
                                                    ))}
                                                    {printers.length === 0 && <LedDot tone="off" title="No printers" />}
                                                </span>
                                            </div>
                                            <p className="mono mt-1.5 text-[11px] text-text-muted">
                                                {up}/{printers.length} PRINTERS · {free}/{stacks.length} STACKS FREE
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Panel>

                    {/* System — quiet until it must not be. */}
                    {isSuperAdmin && (
                        <Panel title="System" icon={ShieldAlert}>
                            <p className="text-[12.5px] leading-relaxed text-text-muted">
                                Hard reset wipes every job, user, penalty and machine record. There is no undo.
                            </p>
                            <button
                                onClick={handleResetSystem}
                                disabled={isResetting}
                                className="btn-danger mt-4 w-full"
                            >
                                {isResetting ? <Loader2 size={15} className="animate-spin" /> : <ShieldAlert size={15} />}
                                {isResetting ? 'Wiping system…' : 'Hard reset system'}
                            </button>
                        </Panel>
                    )}
                </div>
            </div>
        </>
    );
};

export default Dashboard;
