import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login({ email, password });
            console.log("Login Success - Full Response:", JSON.stringify(response, null, 2));
            navigate('/dashboard');
        } catch (err: any) {
            console.error("Login Error:", err);
            const message = err.response?.data?.MESSAGE ||
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Invalid credentials. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card-glass p-10 w-full max-w-md">
            <h2 className="text-3xl font-bold mb-2 text-center text-text font-heading tracking-[-0.03em]">Welcome Back</h2>
            <p className="text-text-muted text-center mb-8 text-sm">Sign in to manage your print jobs</p>

            {error && (
                <div className="bg-accent/5 border border-accent/20 text-accent p-3 rounded-xl mb-6 text-sm text-center">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-bg border border-border rounded-full py-3 pl-11 pr-5 text-text text-sm focus:outline-none focus:border-text/40 focus:ring-2 focus:ring-text/5 transition-all duration-300"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary ml-1 font-heading">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-bg border border-border rounded-full py-3 pl-11 pr-5 text-text text-sm focus:outline-none focus:border-text/40 focus:ring-2 focus:ring-text/5 transition-all duration-300"
                            placeholder="********"
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-end pr-2">
                    <Link to="/forgot-password" className="text-sm font-medium text-text-muted hover:text-text transition-colors duration-200">
                        Forgot Password?
                    </Link>
                </div>

                <button type="submit" disabled={loading} className="btn-pill-filled w-full justify-center py-3.5 text-[15px]">
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            <p className="mt-8 text-center text-text-muted text-sm">
                Don't have an account?{' '}
                <a href="/signup" className="text-text hover:underline font-medium">Create one</a>
            </p>
        </div>
    );
};

export default LoginForm;
