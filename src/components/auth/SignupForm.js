import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { User, Mail, Lock, Loader2, UserPlus, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
const SignupForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        collegeId: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Signup Form Submission Triggered");
        if (loading)
            return;
        setLoading(true);
        setError('');
        try {
            console.log("Submitting Signup Data...");
            const response = await authService.signup(formData);
            console.log("Signup Success Result:", response);
            // If the response is successful, navigate to dashboard
            navigate('/dashboard');
        }
        catch (err) {
            console.error("FULL SIGNUP ERROR RESPONSE:", err.response?.data);
            // Extract the most specific error message possible from backend
            let errorMessage = 'Account creation failed. Please try again.';
            if (err.response?.data) {
                const data = err.response.data;
                // Handling different backend response formats
                errorMessage = data.MESSAGE ||
                    data.message ||
                    data.msg ||
                    data.error ||
                    (data.responseBody && (data.responseBody.msg || data.responseBody.MESSAGE)) ||
                    err.message;
            }
            else {
                errorMessage = err.message;
            }
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "glass p-8 rounded-2xl w-full max-w-md shadow-2xl", children: [_jsx("h2", { className: "text-3xl font-bold mb-2 text-center gradient-text", children: "Join PrintPost" }), _jsx("p", { className: "text-text-muted text-center mb-8", children: "Create an account to start printing smarter" }), error && (_jsxs("div", { className: "bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-6 text-sm text-center", children: [_jsx("strong", { children: "Error:" }), " ", error] })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-secondary/50 outline-none transition-all", placeholder: "John Doe", required: true })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "College ID" }), _jsxs("div", { className: "relative", children: [_jsx(Fingerprint, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "text", name: "collegeId", value: formData.collegeId, onChange: handleChange, className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-secondary/50 outline-none transition-all", placeholder: "AM.EN.U4CSEXXXXX", required: true })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-secondary/50 outline-none transition-all", placeholder: "name@example.com", required: true })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-sm font-medium text-text-muted ml-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" }), _jsx("input", { type: "password", name: "password", value: formData.password, onChange: handleChange, className: "w-full bg-surface border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-secondary/50 outline-none transition-all", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-secondary/20 mt-4 cursor-pointer", children: loading ? (_jsx(Loader2, { className: "w-5 h-5 animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(UserPlus, { className: "w-5 h-5" }), "Create Account"] })) })] }), _jsxs("p", { className: "mt-6 text-center text-text-muted", children: ["Already have an account?", ' ', _jsx("a", { href: "/login", className: "text-secondary hover:underline font-medium", children: "Log In" })] })] }));
};
export default SignupForm;
//# sourceMappingURL=SignupForm.js.map