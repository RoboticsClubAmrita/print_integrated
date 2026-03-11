import React, { useState } from 'react';
import { Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/api';

const ResetPasswordForm: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError('Invalid or missing reset token. Please request a new link.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await authService.resetPassword({ token, password, confirmPassword });
            setSuccess(true);
        } catch (err: any) {
            console.error("Reset Password Error:", err);
            const message = err.response?.data?.MESSAGE ||
                err.response?.data?.message ||
                err.response?.data?.msg ||
                err.message ||
                'Failed to reset password. The link may have expired.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-8 rounded-2xl w-full max-w-md shadow-2xl text-center"
            >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4 gradient-text">Password Reset!</h2>
                <p className="text-text-muted mb-8">
                    Your password has been successfully updated. You can now log in with your new password.
                </p>
                <Link
                    to="/login"
                    className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                    Return to Login
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-2xl w-full max-w-md shadow-2xl"
        >
            <h2 className="text-3xl font-bold mb-2 gradient-text">Reset Password</h2>
            <p className="text-text-muted mb-8">Enter your new password below.</p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            {!token && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 p-3 rounded-xl mb-6 text-sm text-center">
                    Warning: No reset token found in URL. This submission will fail.
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted ml-1">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted ml-1">Confirm New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Reset Password
                        </>
                    )}
                </button>
            </form>

            <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-text-muted hover:text-white transition-colors text-sm mt-8"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
            </Link>
        </motion.div>
    );
};

export default ResetPasswordForm;
