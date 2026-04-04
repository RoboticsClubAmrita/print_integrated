import React, { useState, useEffect } from 'react';
import { hardwareService, jobService, userService } from '../services/api';
import { Search, Filter, RefreshCw, FileText, Clock, CheckCircle, AlertCircle, Loader2, IndianRupee, MapPin, User, Calendar, ChevronDown, X } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'QUEUED', 'PRINTING', 'COMPLETED', 'PRINTED_PENDING_STACK', 'COLLECTED', 'CANCELLED'];

const STATUS_STYLES: Record<string, string> = {
    PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    QUEUED:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PRINTING:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
    COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
    PRINTED_PENDING_STACK: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    COLLECTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    FAILED:    'bg-red-700/10 text-red-500 border-red-700/20',
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

    // Filters
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [userFilter, setUserFilter] = useState('ALL');
    const [locationFilter, setLocationFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Detail modal
    const [selectedJob, setSelectedJob] = useState<any>(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [jobs, statusFilter, userFilter, locationFilter, searchQuery, dateFrom, dateTo]);

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

        if (statusFilter !== 'ALL') {
            result = result.filter(j => j.status === statusFilter);
        }
        if (userFilter !== 'ALL') {
            result = result.filter(j => (j.userId?._id || j.userId) === userFilter);
        }
        if (locationFilter !== 'ALL') {
            result = result.filter(j => (j.locationId?._id || j.locationId) === locationFilter);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(j =>
                (j.referenceId || '').toLowerCase().includes(q) ||
                (j.originalName || '').toLowerCase().includes(q)
            );
        }
        if (dateFrom) {
            result = result.filter(j => new Date(j.createdAt) >= new Date(dateFrom));
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            result = result.filter(j => new Date(j.createdAt) <= to);
        }

        setFilteredJobs(result);
    };

    const clearFilters = () => {
        setStatusFilter('ALL');
        setUserFilter('ALL');
        setLocationFilter('ALL');
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
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

    // Stats
    const totalRevenue = filteredJobs.reduce((s, j) => s + (j.totalCost || 0), 0);
    const statusCounts = filteredJobs.reduce((acc: any, j) => { acc[j.status] = (acc[j.status] || 0) + 1; return acc; }, {});

    return (
        <div className="min-h-screen bg-background gradient-bg p-6 lg:p-10">
            <header className="mb-8 max-w-[1400px] mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">P</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-heading">Orders Management</h1>
                            <p className="text-text-muted text-xs">View and filter all print jobs across the system</p>
                        </div>
                    </div>
                    <button onClick={loadInitialData} disabled={loading} className="flex items-center gap-2 text-sm text-text-muted hover:text-white border border-white/10 px-4 py-2 rounded-xl transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass p-4 rounded-2xl">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Orders</p>
                        <p className="text-2xl font-bold text-primary">{filteredJobs.length}</p>
                    </div>
                    <div className="glass p-4 rounded-2xl">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Revenue</p>
                        <p className="text-2xl font-bold text-green-400 flex items-center gap-0.5"><IndianRupee className="w-4 h-4" />{totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="glass p-4 rounded-2xl">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Active</p>
                        <p className="text-2xl font-bold text-yellow-400">{(statusCounts['PENDING'] || 0) + (statusCounts['QUEUED'] || 0) + (statusCounts['PRINTING'] || 0)}</p>
                    </div>
                    <div className="glass p-4 rounded-2xl">
                        <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Collected</p>
                        <p className="text-2xl font-bold text-emerald-400">{statusCounts['COLLECTED'] || 0}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> Filters</h3>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                                <X className="w-3 h-3" /> Clear All
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* Search */}
                        <div className="relative col-span-1 lg:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by reference ID or file name..."
                                className="w-full bg-surface border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        {/* Status */}
                        <div className="relative">
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full appearance-none bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary cursor-pointer">
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? '🔹 All Statuses' : s}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>
                        {/* User */}
                        <div className="relative">
                            <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full appearance-none bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary cursor-pointer">
                                <option value="ALL">👤 All Users</option>
                                {users.map(u => <option key={u._id} value={u._id}>{u.name || u.email}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        </div>
                        {/* Date From */}
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                        {/* Date To */}
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-surface border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary" />
                    </div>
                </div>

                {/* Jobs Table */}
                <div className="glass rounded-3xl overflow-hidden">
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
                                    <tr className="border-b border-white/5 text-text-muted text-xs uppercase tracking-wider">
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
                                    {filteredJobs.map((job, i) => {
                                        const status = job.status || 'PENDING';
                                        const styleClass = STATUS_STYLES[status] || STATUS_STYLES['PENDING'];
                                        const icon = STATUS_ICONS[status] || STATUS_ICONS['PENDING'];
                                        return (
                                            <motion.tr
                                                key={job._id}
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                                                onClick={() => setSelectedJob(job)}
                                            >
                                                <td className="p-4 font-mono text-xs text-primary">{job.referenceId || job._id?.slice(-8)}</td>
                                                <td className="p-4 max-w-[180px] truncate">{job.originalName || '—'}</td>
                                                <td className="p-4">
                                                    <span className="flex items-center gap-1.5">
                                                        <User className="w-3 h-3 text-text-muted" />
                                                        {getUserName(job.userId)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3 text-text-muted" />
                                                        {getLocationName(job.locationId)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-text-muted text-xs">
                                                    {job.pageType || 'A4'} · {job.colorMode === 'COLOR' ? 'Color' : 'B&W'} · {job.printSide === 'DOUBLE' ? 'Double' : 'Single'} · {job.copies || 1}x
                                                </td>
                                                <td className="p-4 text-right font-bold text-primary flex items-center justify-end gap-0.5">
                                                    <IndianRupee className="w-3 h-3" />{job.totalCost?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${styleClass}`}>
                                                        {icon}{status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right text-text-muted text-xs">
                                                    {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedJob && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass rounded-3xl p-8 w-full max-w-lg border border-white/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Order Details</h3>
                                <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
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
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
};

const DetailRow: React.FC<{ label: string; value: any; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
        <span className="text-text-muted">{label}</span>
        <span className={highlight ? 'text-primary font-bold text-lg' : 'font-medium'}>{value}</span>
    </div>
);

export default OrdersPage;
