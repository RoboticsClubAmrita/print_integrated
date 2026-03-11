import React from 'react';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

const ResetPasswordPage: React.FC = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 gradient-bg relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" />

            <div className="w-full flex flex-col items-center">
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl">P</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">PrintPost</h1>
                </div>
                <ResetPasswordForm />
            </div>
        </div>
    );
};

export default ResetPasswordPage;
