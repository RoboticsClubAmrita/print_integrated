import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MotionConfig } from 'motion/react';

// ————— PrintEase (User Portal) —————
import { RedirectIfAuthed, RequireAuth } from '@/app/guards';
import { AppShell } from '@/app/AppShell';
import { Spinner } from '@/components/ui/Spinner';
import { ToastHost } from '@/components/ui/ToastHost';
import { SuccessOverlay } from '@/components/app/SuccessOverlay';
import { MockRazorpayModal } from '@/components/app/MockRazorpayModal';

const LandingPage = lazy(() => import('@/pages/landing/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const NewOrderPage = lazy(() => import('@/pages/app/new-order/NewOrderPage'));
const UserOrdersPage = lazy(() => import('@/pages/app/orders/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/app/order-detail/OrderDetailPage'));
const BillingPage = lazy(() => import('@/pages/app/billing/BillingPage'));
const ProfilePage = lazy(() => import('@/pages/app/profile/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// ————— Print_Integrated (Admin Portal) —————
import RequireAdminAuth from './components/auth/RequireAdminAuth';
import AdminLayout from './components/layout/AdminLayout';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import AdminOrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import LocationsPage from './pages/LocationsPage';
import PricingPage from './pages/PricingPage';
import PenaltiesPage from './pages/PenaltiesPage';

const Background3D = React.lazy(() => import('./components/Background3D'));

const WithAdmin = ({ children }: { children: React.ReactNode }) => (
    <AdminLayout>{children}</AdminLayout>
);

/** Admin-only globals (3D background, grain overlay) — scoped here so they never bleed into PrintEase's pages. */
function AdminRoot() {
    return (
        <>
            <Suspense fallback={null}>
                <Background3D />
            </Suspense>
            <div className="grain-overlay" />
            <Outlet />
        </>
    );
}

function PageFallback() {
    return (
        <div className="min-h-screen grid place-items-center">
            <Spinner size={28} />
        </div>
    );
}

export default function App() {
    return (
        <MotionConfig reducedMotion="user">
            <BrowserRouter>
                <Suspense fallback={<PageFallback />}>
                    <Routes>
                        {/* PrintEase — single entry point, public + user routes unchanged */}
                        <Route path="/" element={<LandingPage />} />
                        <Route
                            path="/login"
                            element={
                                <RedirectIfAuthed>
                                    <LoginPage />
                                </RedirectIfAuthed>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <RedirectIfAuthed>
                                    <RegisterPage />
                                </RedirectIfAuthed>
                            }
                        />
                        <Route
                            path="/forgot-password"
                            element={
                                <RedirectIfAuthed>
                                    <ForgotPasswordPage />
                                </RedirectIfAuthed>
                            }
                        />
                        <Route
                            path="/verify-email"
                            element={
                                <RedirectIfAuthed>
                                    <VerifyEmailPage />
                                </RedirectIfAuthed>
                            }
                        />
                        {/* Shared with Admin Mode's real password-reset flow (see merge plan decision 3) */}
                        <Route path="/reset-password" element={<ResetPasswordPage />} />

                        <Route
                            path="/app"
                            element={
                                <RequireAuth>
                                    <AppShell />
                                </RequireAuth>
                            }
                        >
                            <Route index element={<NewOrderPage />} />
                            <Route path="orders" element={<UserOrdersPage />} />
                            <Route path="orders/:id" element={<OrderDetailPage />} />
                            <Route path="billing" element={<BillingPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>

                        {/* Admin Mode — reachable only via the toggle, never a direct landing page */}
                        <Route
                            path="/admin"
                            element={
                                <RequireAdminAuth>
                                    <AdminRoot />
                                </RequireAdminAuth>
                            }
                        >
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<WithAdmin><Dashboard /></WithAdmin>} />
                            <Route path="orders" element={<WithAdmin><AdminOrdersPage /></WithAdmin>} />
                            <Route path="users" element={<WithAdmin><UsersPage /></WithAdmin>} />
                            <Route path="locations" element={<WithAdmin><LocationsPage /></WithAdmin>} />
                            <Route path="pricing" element={<WithAdmin><PricingPage /></WithAdmin>} />
                            <Route path="penalties" element={<WithAdmin><PenaltiesPage /></WithAdmin>} />
                        </Route>

                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
                <ToastHost />
                <SuccessOverlay />
                <MockRazorpayModal />
            </BrowserRouter>
        </MotionConfig>
    );
}
