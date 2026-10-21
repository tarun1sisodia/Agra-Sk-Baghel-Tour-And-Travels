import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LoginPage } from "@/components/login/LoginPage";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardPage } from "@/pages/DashboardPage";

const BookingsPage = lazy(() => import("@/pages/BookingsPage").then((m) => ({ default: m.BookingsPage })));
const FinancePage = lazy(() => import("@/pages/FinancePage").then((m) => ({ default: m.FinancePage })));
const RoutesPage = lazy(() => import("@/pages/RoutesPage").then((m) => ({ default: m.RoutesPage })));
const CatalogPage = lazy(() => import("@/pages/CatalogPage").then((m) => ({ default: m.CatalogPage })));
const TourPackagesPage = lazy(() => import("@/pages/TourPackagesPage").then((m) => ({ default: m.TourPackagesPage })));
const LocalTransfersPage = lazy(() => import("@/pages/LocalTransfersPage").then((m) => ({ default: m.LocalTransfersPage })));
const PoliciesPage = lazy(() => import("@/pages/PoliciesPage").then((m) => ({ default: m.PoliciesPage })));
const SignoffPage = lazy(() => import("@/pages/SignoffPage").then((m) => ({ default: m.SignoffPage })));
const ReviewsPage = lazy(() => import("@/pages/ReviewsPage").then((m) => ({ default: m.ReviewsPage })));
const RentalRequestsPage = lazy(() => import("@/pages/RentalRequestsPage").then((m) => ({ default: m.RentalRequestsPage })));
const InquiriesPage = lazy(() => import("@/pages/InquiriesPage").then((m) => ({ default: m.InquiriesPage })));
const VehiclesPage = lazy(() => import("@/pages/VehiclesPage").then((m) => ({ default: m.VehiclesPage })));
const FareSettingsPage = lazy(() => import("@/pages/FareSettingsPage").then((m) => ({ default: m.FareSettingsPage })));
const RoundTripRatesPage = lazy(() => import("@/pages/RoundTripRatesPage").then((m) => ({ default: m.RoundTripRatesPage })));
const ExtraChargesPage = lazy(() => import("@/pages/ExtraChargesPage").then((m) => ({ default: m.ExtraChargesPage })));
const PublishingPage = lazy(() => import("@/pages/PublishingPage").then((m) => ({ default: m.PublishingPage })));
const AuditPage = lazy(() => import("@/pages/AuditPage").then((m) => ({ default: m.AuditPage })));
import { AUTH_EXPIRED_EVENT, clearSession, getStoredSession, saveSession, validateStoredSession } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

import { AuthCallbackPage } from "@/pages/AuthCallbackPage";

function Root({ user, onLogin, onLogout }: { user: AdminUser | null; onLogin: (u: AdminUser) => void; onLogout: () => void }) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isOAuthCallback =
    typeof window !== "undefined" &&
    (window.location.pathname === "/auth/callback" ||
      Boolean(searchParams?.has("code")) ||
      Boolean(searchParams?.has("error")) ||
      window.location.hash.includes("access_token="));

  if (!user && isOAuthCallback) {
    return (
      <AuthCallbackPage
        onLogin={(authedUser) => {
          onLogin(authedUser);
          navigate("/", { replace: true });
        }}
      />
    );
  }

  return (
    <Routes>
      <Route
        path="/auth/callback"
        element={
          <AuthCallbackPage
            onLogin={(authedUser) => {
              onLogin(authedUser);
              navigate("/", { replace: true });
            }}
          />
        }
      />
      <Route
        path="/*"
        element={
          <AnimatePresence mode="wait">
            {!user ? (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <LoginPage
                  onLogin={(authedUser) => {
                    onLogin(authedUser);
                    navigate("/");
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-slate-400">Loading module...</div>}>
                  <Routes>
                    <Route element={<AdminLayout user={user} onLogout={onLogout} />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="bookings" element={<BookingsPage user={user} />} />
                      <Route path="vehicles" element={<VehiclesPage user={user} />} />
                      <Route path="fares/settings" element={<FareSettingsPage user={user} />} />
                      <Route path="fares/rates" element={<RoundTripRatesPage user={user} />} />
                      <Route path="fares/extra-charges" element={<ExtraChargesPage user={user} />} />
                      <Route path="fares" element={<Navigate to="/fares/settings" replace />} />
                      <Route path="routes" element={<RoutesPage user={user} />} />
                      <Route path="catalog" element={<CatalogPage user={user} />} />
                      <Route path="tour-packages" element={<TourPackagesPage user={user} />} />
                      <Route path="local-transfers" element={<LocalTransfersPage user={user} />} />
                      <Route path="policies" element={<PoliciesPage user={user} />} />
                      <Route path="sign-off" element={<SignoffPage user={user} />} />
                      <Route path="reviews" element={<ReviewsPage user={user} />} />
                      <Route path="publishing" element={<PublishingPage user={user} />} />
                      <Route path="inquiries" element={<InquiriesPage user={user} />} />
                      <Route path="rental-requests" element={<RentalRequestsPage user={user} />} />
                      <Route path="finance" element={<FinancePage user={user} />} />
                      <Route path="audit" element={<AuditPage user={user} />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    document.documentElement.lang = "en-IN";

    if (import.meta.env.DEV && typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("dev_auth") === "super_admin") {
        const devUser: AdminUser = {
          id: "00000000-0000-4000-a000-000000000004",
          role: "super_admin",
          name: "Super Admin",
          email: "super_admin@test.local",
          token: "test-super_admin",
        };
        saveSession(devUser);
        setUser(devUser);
        setAuthChecked(true);
        return;
      }
    }

    const stored = getStoredSession();
    if (!stored) {
      setAuthChecked(true);
      return;
    }

    let active = true;
    validateStoredSession(stored).then((valid) => {
      if (!active) return;
      if (valid) setUser(stored);
      else clearSession();
      setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback((authedUser: AdminUser) => {
    saveSession(authedUser);
    setUser(authedUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  if (!authChecked) return null;

  return (
    <BrowserRouter>
      <Root user={user} onLogin={login} onLogout={logout} />
    </BrowserRouter>
  );
}
