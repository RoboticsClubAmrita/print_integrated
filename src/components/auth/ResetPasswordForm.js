import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authService } from '../../services/api';
const ResetPasswordForm = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const handleSubmit = async (e) => {
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
        }
        catch (err) {
            console.error("Reset Password Error:", err);
            const message = err.response?.data?.MESSAGE ||
                err.response?.data?.message ||
                err.response?.data?.msg ||
                err.message ||
                'Failed to reset password. The link may have expired.';
            setError(message);
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "glass p-8 rounded-2xl w-full max-w-md shadow-2xl text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircle, { className: "w-8 h-8 text-green-400" }) }), _jsx("h2", { className: "text-3xl font-bold mb-4 gradient-text", children: "Password Reset!" }), _jsx("p", { className: "text-text-muted mb-8", children: "Your password has been successfully updated. You can now log in with your new password." }), _jsx(Link, { to: "/login", className: "w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20", children: "Return to Login" })] }));
    }
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "glass p-8 rounded-2xl w-full max-w-md shadow-2xl", children: [_jsx("h2", { className: "text-3xl font-bold mb-2 gradient-text", children: "Reset Password" }), _jsx("p", { className: "text-text-muted mb-8", children: "Enter your new password below." }), error && (_jsx("div", { className: "bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center", children: error })), !token && (_jsx("div", { className: "bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 p-3 rounded-xl mb-6 text-sm text-center", children: "Warning: No reset token found in URL. This submission will fail." })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "New Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "Confirm New Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsx("button", { type: "submit", disabled: loading || !token, className: "w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20", children: loading ? (_jsx(Loader2, { className: "w-5 h-5 animate-spin" })) : (_jsx(_Fragment, { children: "Reset Password" })) })] }), _jsxs(Link, { to: "/login", className: "flex items-center justify-center gap-2 text-text-muted hover:text-white transition-colors text-sm mt-8", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Login"] })] }));
};
export default ResetPasswordForm;
//# sourceMappingURL=ResetPasswordForm.js.map