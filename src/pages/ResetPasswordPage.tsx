import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AuthLayout } from '@/pages/auth/AuthLayout';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { fadeIn } from '@/lib/motion';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { authService } from '../services/api';

/**
 * Public reset-password screen (linked from the email flow). Shares the
 * storefront auth shell — one design language on every public surface.
 */
const ResetPasswordPage: React.FC = () => {
    useDocumentTitle('Choose a new password');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!token) {
            setError('This reset link is invalid or has expired. Request a new one.');
            return;
        }
        if (password.length < 4) {
            setError('Choose a slightly longer password.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await authService.resetPassword({ token, password, confirmPassword });
            setSuccess(true);
        } catch (err: any) {
            setError(
                err.response?.data?.MESSAGE ||
                    err.response?.data?.message ||
                    err.response?.data?.msg ||
                    err.message ||
                    'Could not reset the password. Try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <button
                type="button"
                onClick={() => navigate('/login')}
                className="press-soft mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-muted hover:text-ink transition-colors"
            >
                <ArrowLeft size={16} /> Back to sign in
            </button>

            <AnimatePresence mode="wait">
                {!success ? (
                    <motion.form
                        key="form"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onSubmit={submit}
                    >
                        <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-ink">
                            Choose a new password
                        </h1>
                        <p className="mt-2 text-[14px] font-medium text-muted leading-relaxed">
                            Set a fresh password for your account — you will be signed in with it
                            from now on.
                        </p>

                        {!token && (
                            <p
                                role="alert"
                                className="mt-4 rounded-[14px] bg-warning/10 px-4 py-3 text-[13px] font-semibold text-ink"
                            >
                                No reset token found — open this page from the link in your email.
                            </p>
                        )}

                        <div className="mt-6 space-y-4">
                            <Field
                                label="New password"
                                type="password"
                                icon={Lock}
                                placeholder="••••••••"
                                value={password}
                                onChange={setPassword}
                                autoComplete="new-password"
                                autoFocus
                            />
                            <Field
                                label="Confirm password"
                                type="password"
                                icon={Lock}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                autoComplete="new-password"
                                onSubmit={submit}
                            />
                        </div>

                        {error && (
                            <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">
                                {error}
                            </p>
                        )}

                        <Button
                            fullWidth
                            className="mt-6"
                            loading={loading}
                            disabled={!token}
                            type="submit"
                        >
                            Reset Password
                        </Button>
                    </motion.form>
                ) : (
                    <motion.div
                        key="done"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="text-center"
                    >
                        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success/12">
                            <CheckCircle2 size={30} className="text-success" strokeWidth={2} />
                        </span>
                        <h1 className="mt-5 text-[26px] font-extrabold tracking-[-0.5px] text-ink">
                            Password updated
                        </h1>
                        <p className="mt-2 text-[14px] font-medium text-muted leading-relaxed">
                            Your new password is live. Sign in to pick up where you left off.
                        </p>
                        <Link to="/login" className="block mt-6">
                            <Button fullWidth>Go to sign in</Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthLayout>
    );
};

export default ResetPasswordPage;
