import React, { useState, useEffect } from 'react';
import { Upload, Clock, CheckCircle, AlertCircle, FileText, LayoutDashboard, LogOut, Loader2, RefreshCw, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authService, jobService } from '../services/api';

const STATUS_STYLES: Record<string, string> = {
    PENDING:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    QUEUED:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PRINTING:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
    COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    FAILED:    'bg-red-700/10 text-red-500 border-red-700/20',
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
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchJobs(); }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError('');
            const storedUser = localStorage.getItem('user');
            const user = storedUser ? JSON.parse(storedUser) : {};
            const userId = user?._id || user?.id || user?.userId || user?.user_id;

            if (!userId) {
                setError('Could not identify user. Please log in again.');
                return;
            }

            const data = await jobService.getByUser(userId);
            const jobList = data?.DATA?.jobs || data?.DATA || data?.jobs || (Array.isArray(data) ? data : []);
            setJobs(jobList);
        } catch (err: any) {
            console.error('Error fetching jobs:', err);
            setError('Failed to load job history.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try { await authService.logout(); } catch (e) { console.error(e); } finally {
            setIsLoggingOut(false);
            navigate('/login');
        }
    };

    const completedJobs = jobs.filter(j => j.status === 'COMPLETED');
    const activeJobs    = jobs.filter(j => !['COMPLETED', 'CANCELLED', 'FAILED'].includes(j.status));

    return (
        <div className="min-h-screen bg-background gradient-bg p-6 lg:p-10">
            {/* Header */}
            <header className="flex items-center justify-between mb-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">P</span>
                    </div>
                    <h1 className="text-xl font-bold font-heading">PrintPost</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">Smart Campus</p>
                        <p className="text-xs text-green-400 flex items-center justify-end gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            Backend Connected
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5 text-secondary" />
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all text-sm font-medium group"
                    >
                        {isLoggingOut
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <LogOut className="w-4 h-4 text-text-muted group-hover:text-red-400 transition-colors" />}
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column */}
                <section className="lg:col-span-2 space-y-8">

                    {/* New Print Job */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass p-8 rounded-3xl">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Upload className="w-6 h-6 text-primary" /> New Print Job
                        </h2>
                        <div
                            onClick={() => navigate('/upload')}
                            className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center bg-surface/30 hover:bg-surface/50 transition-colors cursor-pointer group"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-lg font-medium mb-1">Click or drag files to upload</p>
                            <p className="text-text-muted text-sm text-center">PDF, JPG, PNG and DOCX (Max 50MB)</p>
                        </div>
                    </motion.div>

                    {/* Print History */}
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass p-8 rounded-3xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Clock className="w-6 h-6 text-secondary" /> Print History
                            </h2>
                            <button
                                onClick={fetchJobs}
                                disabled={loading}
                                className="flex items-center gap-2 text-sm text-text-muted hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-all"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                                <p>Loading your print history...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-10 bg-red-500/5 border border-red-500/20 rounded-2xl">
                                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-12 bg-surface/30 rounded-2xl border border-white/5">
                                <FileText className="w-14 h-14 text-white/10 mx-auto mb-3" />
                                <p className="text-text-muted font-medium">No print jobs yet</p>
                                <button onClick={() => navigate('/upload')} className="text-primary hover:underline mt-2 text-sm font-medium">
                                    Start your first print
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jobs.map((job) => {
                                    const status = job.status || 'PENDING';
                                    const styleClass = STATUS_STYLES[status] || STATUS_STYLES['PENDING'];
                                    const icon = STATUS_ICONS[status] || STATUS_ICONS['PENDING'];
                                    return (
                                        <motion.div
                                            key={job._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-surface-light flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-text-muted" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{job.referenceId || job._id}</p>
                                                    <p className="text-xs text-text-muted mt-0.5">
                                                        {new Date(job.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        &nbsp;·&nbsp;{job.pageType || 'A4'}
                                                        &nbsp;·&nbsp;{job.colorMode === 'COLOR' ? 'Colour' : 'B&W'}
                                                        &nbsp;·&nbsp;{job.printSide === 'DOUBLE' ? 'Double' : 'Single'} side
                                                        &nbsp;·&nbsp;{job.totalPagesToPrint || 0} pages
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                <span className="text-sm font-bold text-primary flex items-center gap-0.5">
                                                    <IndianRupee className="w-3.5 h-3.5" />
                                                    {job.totalCost?.toFixed(2) || '0.00'}
                                                </span>
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${styleClass}`}>
                                                    {icon}{status}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>
                </section>

                {/* Right sidebar */}
                <section className="space-y-8">
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent">
                        <h3 className="text-xl font-bold mb-4">Print Status</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface p-4 rounded-2xl border border-white/5">
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Active</p>
                                <p className="text-3xl font-bold text-yellow-400">{activeJobs.length}</p>
                            </div>
                            <div className="bg-surface p-4 rounded-2xl border border-white/5">
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Completed</p>
                                <p className="text-3xl font-bold text-green-400">{completedJobs.length}</p>
                            </div>
                            <div className="bg-surface p-4 rounded-2xl border border-white/5 col-span-2">
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Spent</p>
                                <p className="text-3xl font-bold text-primary flex items-center gap-1">
                                    <IndianRupee className="w-5 h-5" />
                                    {completedJobs.reduce((s, j) => s + (j.totalCost || 0), 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass p-8 rounded-3xl">
                        <h3 className="text-xl font-bold mb-4">Printer Status</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between">
                                <span className="text-text-muted">Library 1F</span>
                                <span className="flex items-center gap-1.5 text-green-400 text-sm"><CheckCircle className="w-4 h-4" /> Ready</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-text-muted">Admin Hall</span>
                                <span className="flex items-center gap-1.5 text-yellow-400 text-sm"><Clock className="w-4 h-4" /> Busy</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-text-muted">CS Lab B</span>
                                <span className="flex items-center gap-1.5 text-red-400 text-sm"><AlertCircle className="w-4 h-4" /> Offline</span>
                            </li>
                        </ul>
                    </motion.div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
