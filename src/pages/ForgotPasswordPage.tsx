import React from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';
import ThemeToggle from '../components/ThemeToggle';
import Reveal from '../components/Reveal';

const ForgotPasswordPage: React.FC = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
            <ThemeToggle className="absolute top-6 right-6 z-10" />

            <div className="w-full flex flex-col items-center relative z-10">
                <Reveal>
                    <div className="mb-10 flex flex-col items-center gap-4">
                        <div className="w-14 h-14 bg-text rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-bg font-bold text-2xl font-heading">P</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-[-0.04em] text-text font-heading">PrintPost</h1>
                    </div>
                </Reveal>
                <Reveal delay={0.15}>
                    <ForgotPasswordForm />
                </Reveal>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
