import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LocationsPage from './pages/LocationsPage';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import PricingPage from './pages/PricingPage';
import AdminLayout from './components/layout/AdminLayout';

const Background3D = React.lazy(() => import('./components/Background3D'));

const WithAdmin = ({ children }: { children: React.ReactNode }) => (
    <AdminLayout>{children}</AdminLayout>
);

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={null}>
                <Background3D />
            </Suspense>
            <div className="grain-overlay" />

            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                <Route path="/dashboard" element={<WithAdmin><Dashboard /></WithAdmin>} />
                <Route path="/orders" element={<WithAdmin><OrdersPage /></WithAdmin>} />
                <Route path="/users" element={<WithAdmin><UsersPage /></WithAdmin>} />
                <Route path="/locations" element={<WithAdmin><LocationsPage /></WithAdmin>} />
                <Route path="/pricing" element={<WithAdmin><PricingPage /></WithAdmin>} />
                <Route path="/upload" element={<WithAdmin><UploadPage /></WithAdmin>} />

                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
