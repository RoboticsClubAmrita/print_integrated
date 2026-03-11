import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
const ForgotPasswordForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await authService.forgotPassword(email);
            setSuccess(true);
        }
        catch (err) {
            console.error("Forgot Password Error:", err);
            const message = err.response?.data?.MESSAGE ||
                err.response?.data?.message ||
                err.message ||
                'Failed to send reset link. Please try again.';
            setError(message);
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "glass p-8 rounded-2xl w-full max-w-md shadow-2xl text-center", children: [_jsx("div", { className: "w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(Send, { className: "w-8 h-8 text-green-400" }) }), _jsx("h2", { className: "text-3xl font-bold mb-4 gradient-text", children: "Check Your Email" }), _jsxs("p", { className: "text-text-muted mb-8", children: ["We've sent a password reset link to ", _jsx("span", { className: "text-white font-medium", children: email }), ". Please check your inbox and follow the instructions."] }), _jsxs(Link, { to: "/login", className: "flex items-center justify-center gap-2 text-secondary hover:underline font-medium", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Login"] })] }));
    }
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "glass p-8 rounded-2xl w-full max-w-md shadow-2xl", children: [_jsxs(Link, { to: "/login", className: "flex items-center gap-2 text-text-muted hover:text-white transition-colors text-sm mb-6 inline-flex", children: [_jsx(ArrowLeft, { className: "w-4 h-4" }), "Back to Login"] }), _jsx("h2", { className: "text-3xl font-bold mb-2 gradient-text", children: "Forgot Password?" }), _jsx("p", { className: "text-text-muted mb-8", children: "Enter your email and we'll send you a link to reset your password." }), error && (_jsx("div", { className: "bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all", placeholder: "name@example.com", required: true })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20", children: loading ? (_jsx(Loader2, { className: "w-5 h-5 animate-spin" })) : (_jsxs(_Fragment, { children: ["Send Reset Link", _jsx(Send, { className: "w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" })] })) })] })] }));
};
export default ForgotPasswordForm;
//# sourceMappingURL=ForgotPasswordForm.js.map