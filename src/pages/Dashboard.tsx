import React, { useState } from 'react';
import { Upload, Clock, CheckCircle, AlertCircle, FileText, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-background gradient-bg p-6 lg:p-10">
            <header className="flex items-center justify-between mb-12 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-xl">P</span>
                    </div>
                    <h1 className="text-xl font-bold font-heading">PrintPost</h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium">Smart Campus</p>
                        <p className="text-xs text-green-400 flex items-center justify-end gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Backend Connected
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface border border-white/10 flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 text-secondary" />
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all text-sm font-medium group"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4 text-text-muted group-hover:text-red-400 transition-colors" />
                            )}
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <section className="lg:col-span-2 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass p-8 rounded-3xl"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Upload className="w-6 h-6 text-primary" />
                            New Print Job
                        </h2>
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center bg-surface/30 hover:bg-surface/50 transition-colors cursor-pointer group">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-lg font-medium mb-1">Click or drag files to upload</p>
                            <p className="text-text-muted text-sm text-center">Support for PDF, JPG, PNG and DOCX files (Max 50MB)</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass p-8 rounded-3xl"
                    >
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Clock className="w-6 h-6 text-secondary" />
                            Recent Activity
                        </h2>
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-text-muted" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Assignment_Final.pdf</p>
                                            <p className="text-xs text-text-muted">Uploaded 2 hours ago â€¢ 12 pages</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full">Completed</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* Sidebar Info */}
                <section className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent"
                    >
                        <h3 className="text-xl font-bold mb-4">Print Status</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-surface p-4 rounded-2xl border border-white/5">
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Queue Pos</p>
                                <p className="text-2xl font-bold">#4</p>
                            </div>
                            <div className="bg-surface p-4 rounded-2xl border border-white/5">
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Est. Time</p>
                                <p className="text-2xl font-bold">8 min</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass p-8 rounded-3xl"
                    >
                        <h3 className="text-xl font-bold mb-4">Printer Status</h3>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between">
                                <span className="text-text-muted">Library 1F</span>
                                <span className="flex items-center gap-1.5 text-green-400 text-sm">
                                    <CheckCircle className="w-4 h-4" /> Ready
                                </span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-text-muted">Admin Hall</span>
                                <span className="flex items-center gap-1.5 text-yellow-400 text-sm">
                                    <Clock className="w-4 h-4" /> Busy
                                </span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-text-muted">CS Lab B</span>
                                <span className="flex items-center gap-1.5 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4" /> Offline
                                </span>
                            </li>
                        </ul>
                    </motion.div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
