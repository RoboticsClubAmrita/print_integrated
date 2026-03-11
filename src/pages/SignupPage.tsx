import React from 'react';
import SignupForm from '../components/auth/SignupForm';
import { Printer } from 'lucide-react';

const SignupPage: React.FC = () => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 gradient-bg relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />

            <div className="w-full flex flex-col items-center">
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center shadow-lg">
                        <Printer className="text-white w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">PrintPost</h1>
                </div>
                <SignupForm />
            </div>
        </div>
    );
};

export default SignupPage;
