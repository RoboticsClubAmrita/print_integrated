import React, { useState } from 'react';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
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
            console.error("Forgot Password Error:", err);
            const message = err.response?.data?.MESSAGE ||
                err.response?.data?.message ||
                err.message ||
                'Failed to send reset link. Please try again.';
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
                    <Send className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4 gradient-text">Check Your Email</h2>
                <p className="text-text-muted mb-8">
                    We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
                    Please check your inbox and follow the instructions.
                </p>
                <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 text-secondary hover:underline font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
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
            <Link
                to="/login"
                className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-sm mb-6 inline-flex"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
            </Link>

            <h2 className="text-3xl font-bold mb-2 gradient-text">Forgot Password?</h2>
            <p className="text-text-muted mb-8">Enter your email and we'll send you a link to reset your password.</p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Send Reset Link
                            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default ForgotPasswordForm;
