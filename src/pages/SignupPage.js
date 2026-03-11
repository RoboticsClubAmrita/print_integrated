import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import SignupForm from '../components/auth/SignupForm';
import { Printer } from 'lucide-react';
const SignupPage = () => {
    return (_jsxs("div", { className: "min-h-screen w-full flex items-center justify-center p-4 gradient-bg relative overflow-hidden", children: [_jsx("div", { className: "absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px]" }), _jsx("div", { className: "absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" }), _jsxs("div", { className: "w-full flex flex-col items-center", children: [_jsxs("div", { className: "mb-8 flex items-center gap-3", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center shadow-lg", children: _jsx(Printer, { className: "text-white w-7 h-7" }) }), _jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "PrintPost" })] }), _jsx(SignupForm, {})] })] }));
};
export default SignupPage;
//# sourceMappingURL=SignupPage.js.map