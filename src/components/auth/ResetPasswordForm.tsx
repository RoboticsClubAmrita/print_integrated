import React, { useState } from 'react';
import { Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/api';

const ResetPasswordForm: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) { setError('Invalid or missing reset token.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setLoading(true);
        setError('');
        try {
            await authService.resetPassword({ token, password, confirmPassword });
            setSuccess(true);
        } catch (err: any) {
            const message = err.response?.data?.MESSAGE || err.response?.data?.message || err.response?.data?.msg || err.message || 'Failed to reset password.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-bg border border-border rounded-full py-3 pl-11 pr-5 text-text text-sm focus:outline-none focus:border-text/40 focus:ring-2 focus:ring-text/5 transition-all duration-300";

    if (success) {
        return (
            <div className="card p-10 w-full max-w-md text-center backdrop-blur-md bg-surface/80 dark:bg-surface/60">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-text font-heading tracking-[-0.03em]">Password Reset!</h2>
                <p className="text-text-muted mb-8 text-sm">Your password has been updated. You can now log in.</p>
                <Link to="/login" className="btn-pill-filled w-full justify-center py-3.5 text-[15px]">Return to Login</Link>
            </div>
        );
    }

    return (
        <div className="card-glass p-10 w-full max-w-md">
            <h2 className="text-3xl font-bold mb-2 text-text font-heading tracking-[-0.03em]">Reset Password</h2>
            <p className="text-text-muted mb-8 text-sm">Enter your new password below.</p>

            {error && <div className="bg-accent/5 border border-accent/20 text-accent p-3 rounded-xl mb-6 text-sm text-center">{error}</div>}
            {!token && <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 p-3 rounded-xl mb-6 text-sm text-center">No reset token found in URL.</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="********" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">Confirm Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="********" required />
                    </div>
                </div>
                <button type="submit" disabled={loading || !token} className="btn-pill-filled w-full justify-center py-3.5 text-[15px] disabled:opacity-50">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                </button>
            </form>
            <Link to="/login" className="flex items-center justify-center gap-2 text-text-muted hover:text-text transition-colors duration-200 text-sm mt-8">
                <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
        </div>
    );
};

export default ResetPasswordForm;
