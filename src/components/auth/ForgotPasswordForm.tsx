import React, { useState } from 'react';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/api';

const ForgotPasswordForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            const message = err.response?.data?.MESSAGE || err.response?.data?.message || err.message || 'Failed to send reset link.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="card p-10 w-full max-w-md text-center backdrop-blur-md bg-surface/80 dark:bg-surface/60">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-text font-heading tracking-[-0.03em]">Check Your Email</h2>
                <p className="text-text-muted mb-8 text-sm">
                    We've sent a password reset link to <span className="text-text font-medium">{email}</span>.
                </p>
                <Link to="/login" className="btn-pill justify-center w-full">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="card-glass p-10 w-full max-w-md">
            <Link to="/login" className="flex items-center gap-2 text-text-muted hover:text-text transition-colors duration-200 text-sm mb-6 inline-flex">
                <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
            <h2 className="text-3xl font-bold mb-2 text-text font-heading tracking-[-0.03em]">Forgot Password?</h2>
            <p className="text-text-muted mb-8 text-sm">Enter your email and we'll send you a reset link.</p>

            {error && (
                <div className="bg-accent/5 border border-accent/20 text-accent p-3 rounded-xl mb-6 text-sm text-center">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-bg border border-border rounded-full py-3 pl-11 pr-5 text-text text-sm focus:outline-none focus:border-text/40 focus:ring-2 focus:ring-text/5 transition-all duration-300" placeholder="name@example.com" required />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="btn-pill-filled w-full justify-center py-3.5 text-[15px]">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Reset Link</>}
                </button>
            </form>
        </div>
    );
};

export default ForgotPasswordForm;
