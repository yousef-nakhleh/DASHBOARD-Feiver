// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import CashRegister from "./pages/CashRegister";
import Contacts from "./pages/Contacts";
import Trattamenti from "./pages/Trattamenti";
import Analytics from "./pages/Analytics";
import Magazzino from "./pages/Magazzino";
import StaffAvailability from "./pages/StaffAvailability";
import PaymentPage from "./components/payment/PaymentPage";
import Chatbot from "./pages/Chatbot";
import WaitingList from "./pages/WaitingList";
import Vapi from "./pages/Vapi";
import ClosingExceptions from "./pages/ClosingExceptions";
import OpeningExceptions from "./pages/OpeningExceptions";
import Reports from "./pages/Reports";

// 🔐 Auth
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import LoginPage from "./components/auth/LoginPage";

// ✅ Features
import { FeaturesProvider } from "./features/FeaturesProvider";
import { AgendaGate } from "./gates/AgendaGate";
import { ChatbotGate } from "./gates/ChatbotGate";
import { TransactionsGate } from "./gates/TransactionsGate";
import { AvailabilityGate } from "./gates/AvailabilityGate";
import { ContactsGate } from "./gates/ContactsGate";
import { ServicesGate } from "./gates/ServicesGate";
import { PhoneCallerGate } from "./gates/PhoneCallerGate";
import { WaitingListGate } from "./gates/WaitingListGate";
import { OpeningExceptionsGate } from "./gates/OpeningExceptionsGate";
import { ClosingExceptionsGate } from "./gates/ClosingExceptionsGate";
import { ReportsGate } from "./gates/ReportsGate";
import { AnalyticsGate } from "./gates/AnalyticsGate";

// ✅ Business selection
import {
  SelectedBusinessProvider,
  useSelectedBusiness,
} from "./components/auth/SelectedBusinessProvider";

// ✅ Auth flow
import AuthCallback from "./components/auth/AuthCallback";
import CompleteAccount from "./components/auth/CompleteAccount";
import AuthError from "./components/auth/AuthError";
import PendingAccess from "./components/auth/PendingAccess";
import MembershipGuard from "./components/auth/MembershipGuard";

// ---------- Route guard ----------
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// ✅ Needs business_id to mount FeaturesProvider
function WithFeatures() {
  const { effectiveBusinessId } = useSelectedBusiness();
  if (!effectiveBusinessId) {
    return <div className="p-6">Nessun business associato.</div>;
  }
  return (
    <FeaturesProvider businessId={effectiveBusinessId}>
      <Outlet />
    </FeaturesProvider>
  );
}

// ---------- App ----------
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ---------- PUBLIC FLOW ---------- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/complete-account" element={<CompleteAccount />} />
          <Route path="/auth/error" element={<AuthError />} />
          <Route path="/pending-access" element={<PendingAccess />} />

          {/* ---------- PRIVATE FLOW ---------- */}
          <Route element={<RequireAuth />}>
            {/* Put the provider OUTSIDE so MembershipGuard can read memberships/selection */}
            <Route
              element={
                <SelectedBusinessProvider>
                  {/* This guard is responsible for showing the selector first (including super_admin full list) */}
                  <MembershipGuard>
                    <WithFeatures />
                  </MembershipGuard>
                </SelectedBusinessProvider>
              }
            >
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />

                {/* ✅ Gated routes */}
                <Route
                  path="agenda"
                  element={
                    <AgendaGate fallback={<Navigate to="/" replace />}>
                      <Agenda />
                    </AgendaGate>
                  }
                />
                <Route
                  path="cassa"
                  element={
                    <TransactionsGate fallback={<Navigate to="/" replace />}>
                      <CashRegister />
                    </TransactionsGate>
                  }
                />
                <Route path="cassa/pagamento" element={<PaymentPage />} />
                <Route
                  path="rubrica"
                  element={
                    <ContactsGate fallback={<Navigate to="/" replace />}>
                      <Contacts />
                    </ContactsGate>
                  }
                />
                <Route
                  path="trattamenti"
                  element={
                    <ServicesGate fallback={<Navigate to="/" replace />}>
                      <Trattamenti />
                    </ServicesGate>
                  }
                />
                <Route
                  path="analytics"
                  element={
                    <AnalyticsGate fallback={<Navigate to="/" replace />}>
                      <Analytics />
                    </AnalyticsGate>
                  }
                />
                <Route path="magazzino" element={<Magazzino />} />
                <Route
                  path="staff"
                  element={
                    <AvailabilityGate fallback={<Navigate to="/" replace />}>
                      <StaffAvailability />
                    </AvailabilityGate>
                  }
                />
                <Route
                  path="chatbot"
                  element={
                    <ChatbotGate fallback={<Navigate to="/" replace />}>
                      <Chatbot />
                    </ChatbotGate>
                  }
                />
                <Route
                  path="waiting-list"
                  element={
                    <WaitingListGate fallback={<Navigate to="/" replace />}>
                      <WaitingList />
                    </WaitingListGate>
                  }
                />
                <Route
                  path="vapi"
                  element={
                    <PhoneCallerGate fallback={<Navigate to="/" replace />}>
                      <Vapi />
                    </PhoneCallerGate>
                  }
                />
                <Route
                  path="aperture-eccezionali"
                  element={
                    <OpeningExceptionsGate fallback={<Navigate to="/" replace />}>
                      <OpeningExceptions />
                    </OpeningExceptionsGate>
                  }
                />
                <Route
                  path="exceptions"
                  element={
                    <ClosingExceptionsGate fallback={<Navigate to="/" replace />}>
                      <ClosingExceptions />
                    </ClosingExceptionsGate>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <ReportsGate fallback={<Navigate to="/" replace />}>
                      <Reports />
                    </ReportsGate>
                  }
                />

                {/* Default */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;