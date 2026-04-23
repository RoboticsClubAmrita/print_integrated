import React, { useState, useEffect } from 'react';
import { Upload, Clock, CheckCircle, AlertCircle, FileText, Loader2, RefreshCw, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jobService, systemService } from '../services/api';
import Reveal from '../components/Reveal';

const STATUS_STYLES: Record<string, string> = {
    PENDING:   'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    QUEUED:    'bg-neutral-200/60 text-neutral-600 dark:bg-neutral-500/10 dark:text-neutral-400',
    PRINTING:  'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    COMPLETED: 'bg-green-500/10 text-green-600 dark:text-green-400',
    CANCELLED: 'bg-red-500/10 text-red-600 dark:text-red-400',
    FAILED:    'bg-red-500/10 text-red-600 dark:text-red-400',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING:   <Clock className="w-3 h-3" />,
    QUEUED:    <Clock className="w-3 h-3" />,
    PRINTING:  <Loader2 className="w-3 h-3 animate-spin" />,
    COMPLETED: <CheckCircle className="w-3 h-3" />,
    CANCELLED: <AlertCircle className="w-3 h-3" />,
    FAILED:    <AlertCircle className="w-3 h-3" />,
};

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const storedUser = localStorage.getItem('user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

    useEffect(() => { fetchJobs(); }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true); setError('');
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : {};
            const userId = user?._id || user?.id || user?.userId;
            if (!userId) { setError('Could not identify user. Please log in again.'); return; }
            const data = await jobService.getByUser(userId);
            setJobs(data?.DATA?.jobs || data?.DATA || data?.jobs || (Array.isArray(data) ? data : []));
        } catch (err: any) {
            console.error('Error fetching jobs:', err);
            setError('Failed to load job history.');
        } finally { setLoading(false); }
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
        } finally { setIsResetting(false); }
    };

    const completedJobs = jobs.filter(j => j.status === 'COMPLETED');
    const activeJobs = jobs.filter(j => !['COMPLETED', 'CANCELLED', 'FAILED'].includes(j.status));

    return (
        <div className="min-h-screen bg-bg p-6 lg:p-8">
            <header className="mb-10 max-w-[1200px] mx-auto">
                <Reveal>
                    <h1 className="text-4xl font-bold tracking-[-0.04em] text-text font-heading">Dashboard</h1>
                    <p className="text-sm text-text-muted mt-2">Track print activity and monitor system status.</p>
                </Reveal>
            </header>

            <main className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-2 space-y-6">
                    <Reveal>
                        <div className="card p-8">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-text font-heading">
                                <Upload className="w-5 h-5 text-text-muted" /> New Print Job
                            </h2>
                            <div
                                onClick={() => navigate('/upload')}
                                className="border border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center bg-bg hover:bg-bg-secondary transition-all duration-300 cursor-pointer group"
                            >
                                <div className="w-16 h-16 rounded-full bg-text/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Upload className="w-8 h-8 text-text-muted" />
                                </div>
                                <p className="text-base font-medium mb-1 text-text font-heading">Click or drag files to upload</p>
                                <p className="text-text-muted text-sm text-center">PDF, JPG, PNG and DOCX (Max 50MB)</p>
                            </div>
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <div className="card p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2 text-text font-heading">
                                    <Clock className="w-5 h-5 text-text-muted" /> Print History
                                </h2>
                                <button onClick={fetchJobs} disabled={loading} className="btn-pill py-2 px-4 text-xs">
                                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                                </button>
                            </div>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                                    <p className="text-sm">Loading your print history...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-10 bg-accent/5 border border-accent/20 rounded-2xl">
                                    <AlertCircle className="w-10 h-10 text-accent mx-auto mb-2" />
                                    <p className="text-accent text-sm">{error}</p>
                                </div>
                            ) : jobs.length === 0 ? (
                                <div className="text-center py-14 bg-bg rounded-2xl border border-border">
                                    <FileText className="w-14 h-14 text-text-muted/20 mx-auto mb-3" />
                                    <p className="text-text-muted font-medium font-heading">No print jobs yet</p>
                                    <button onClick={() => navigate('/upload')} className="text-text hover:underline mt-2 text-sm font-medium">
                                        Start your first print
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {jobs.map((job, i) => {
                                        const status = job.status || 'PENDING';
                                        const styleClass = STATUS_STYLES[status] || STATUS_STYLES['PENDING'];
                                        const icon = STATUS_ICONS[status] || STATUS_ICONS['PENDING'];
                                        return (
                                            <Reveal key={job._id} delay={i * 0.05}>
                                                <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border hover:border-text/10 transition-all duration-300">
                                                    <div className="flex items-center gap-4 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center shrink-0">
                                                            <FileText className="w-5 h-5 text-text-muted" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-sm truncate text-text">{job.referenceId || job._id}</p>
                                                            <p className="text-xs text-text-muted mt-0.5">
                                                                {new Date(job.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                                &nbsp;&middot;&nbsp;{job.pageType || 'A4'}
                                                                &nbsp;&middot;&nbsp;{job.colorMode === 'COLOR' ? 'Colour' : 'B&W'}
                                                                &nbsp;&middot;&nbsp;{job.printSide === 'DOUBLE' ? 'Double' : 'Single'} side
                                                                &nbsp;&middot;&nbsp;{job.totalPagesToPrint || 0} pages
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                                        <span className="text-sm font-bold text-text flex items-center gap-0.5">
                                                            <IndianRupee className="w-3.5 h-3.5" />
                                                            {job.totalCost?.toFixed(2) || '0.00'}
                                                        </span>
                                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${styleClass}`}>
                                                            {icon}{status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Reveal>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Reveal>
                </section>

                <section className="space-y-6">
                    <Reveal direction="right">
                        <div className="card p-6">
                            <h3 className="text-xl font-semibold mb-5 text-text font-heading">Print Status</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-bg p-4 rounded-xl border border-border">
                                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1 font-heading">Active</p>
                                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 font-heading">{activeJobs.length}</p>
                                </div>
                                <div className="bg-bg p-4 rounded-xl border border-border">
                                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1 font-heading">Completed</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 font-heading">{completedJobs.length}</p>
                                </div>
                                <div className="bg-bg p-4 rounded-xl border border-border col-span-2">
                                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1 font-heading">Total Spent</p>
                                    <p className="text-3xl font-bold text-text flex items-center gap-1 font-heading">
                                        <IndianRupee className="w-5 h-5" />
                                        {completedJobs.reduce((s, j) => s + (j.totalCost || 0), 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Reveal>

                    <Reveal direction="right" delay={0.1}>
                        <div className="card p-6">
                            <h3 className="text-xl font-semibold mb-5 text-text font-heading">Printer Status</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center justify-between">
                                    <span className="text-text-secondary text-sm">Library 1F</span>
                                    <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm"><CheckCircle className="w-4 h-4" /> Ready</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-text-secondary text-sm">Admin Hall</span>
                                    <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400 text-sm"><Clock className="w-4 h-4" /> Busy</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-text-secondary text-sm">CS Lab B</span>
                                    <span className="flex items-center gap-1.5 text-accent text-sm"><AlertCircle className="w-4 h-4" /> Offline</span>
                                </li>
                            </ul>
                        </div>
                    </Reveal>

                    {isSuperAdmin && (
                        <Reveal direction="right" delay={0.2}>
                            <div className="card p-6 border-accent/20">
                                <h3 className="text-lg font-semibold mb-2 text-accent flex items-center gap-2 font-heading">
                                    <AlertCircle className="w-5 h-5" /> Danger Zone
                                </h3>
                                <p className="text-xs text-text-muted mb-4">
                                    Hard reset the entire system. All data will be permanently wiped.
                                </p>
                                <button
                                    onClick={handleResetSystem}
                                    disabled={isResetting}
                                    className="btn-pill w-full justify-center border-accent/30 text-accent hover:bg-accent hover:text-white hover:border-accent text-sm"
                                >
                                    {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                                    {isResetting ? 'Wiping System...' : 'Hard Reset System'}
                                </button>
                            </div>
                        </Reveal>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
