import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
const LoginForm = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authService.login({ email, password });
            console.log("Login Success:", response);
            navigate('/dashboard');
        }
        catch (err) {
            console.error("Login Error:", err);
            const message = err.response?.data?.MESSAGE ||
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Invalid credentials. Please try again.';
            setError(message);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "glass p-8 rounded-2xl w-full max-w-md", children: [_jsx("h2", { className: "text-3xl font-bold mb-2 text-center gradient-text", children: "Welcome Back" }), _jsx("p", { className: "text-text-muted text-center mb-8", children: "Sign in to manage your print jobs" }), error && (_jsx("div", { className: "bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all", placeholder: "name@example.com", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsx("div", { className: "flex justify-end pr-1", children: _jsx(Link, { to: "/forgot-password", className: "text-sm font-medium text-primary hover:underline transition-all", children: "Forgot Password?" }) }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20", children: loading ? (_jsx(Loader2, { className: "w-5 h-5 animate-spin" })) : (_jsxs(_Fragment, { children: ["Sign In", _jsx(ArrowRight, { className: "w-4 h-4 group-hover:translate-x-1 transition-transform" })] })) })] }), _jsxs("p", { className: "mt-8 text-center text-text-muted", children: ["Don't have an account?", ' ', _jsx("a", { href: "/signup", className: "text-primary hover:underline font-medium", children: "Create one" })] })] }));
};
export default LoginForm;
//# sourceMappingURL=LoginForm.js.map