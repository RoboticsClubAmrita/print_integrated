import React, { useState } from 'react';
import { User, Mail, Lock, Loader2, UserPlus, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const SignupForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', collegeId: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError('');

        try {
            const response = await authService.signup(formData);
            console.log("Signup Success Result:", response);
            navigate('/dashboard');
        } catch (err: any) {
            console.error("FULL SIGNUP ERROR RESPONSE:", err.response?.data);
            let errorMessage = 'Account creation failed. Please try again.';
            if (err.response?.data) {
                const data = err.response.data;
                errorMessage = data.MESSAGE || data.message || data.msg || data.error ||
                    (data.responseBody && (data.responseBody.msg || data.responseBody.MESSAGE)) || err.message;
            } else {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-bg border border-border rounded-full py-3 pl-11 pr-5 text-text text-sm focus:outline-none focus:border-text/40 focus:ring-2 focus:ring-text/5 transition-all duration-300";

    return (
        <div className="card-glass p-10 w-full max-w-md">
            <h2 className="text-3xl font-bold mb-2 text-center text-text font-heading tracking-[-0.03em]">Join PrintPost</h2>
            <p className="text-text-muted text-center mb-8 text-sm">Create an account to start printing smarter</p>

            {error && (
                <div className="bg-accent/5 border border-accent/20 text-accent p-3 rounded-xl mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="John Doe" required />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">College ID</label>
                    <div className="relative">
                        <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input type="text" name="collegeId" value={formData.collegeId} onChange={handleChange} className={inputClass} placeholder="AM.EN.U4CSEXXXXX" required />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="name@example.com" required />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} placeholder="********" required />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn-pill-filled w-full justify-center py-3.5 text-[15px] mt-2 cursor-pointer">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UserPlus className="w-5 h-5" /> Create Account</>}
                </button>
            </form>

            <p className="mt-6 text-center text-text-muted text-sm">
                Already have an account?{' '}
                <a href="/login" className="text-text hover:underline font-medium">Log In</a>
            </p>
        </div>
    );
};

export default SignupForm;
