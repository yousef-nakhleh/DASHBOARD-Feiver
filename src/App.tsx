// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
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

import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import LoginPage from "./components/auth/LoginPage";

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

import { SelectedBusinessProvider, useSelectedBusiness } from "./components/auth/SelectedBusinessProvider";
import BusinessSelector from "./components/auth/BusinessSelector";

// ---- guards ----
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Blocks app routes until a business is chosen.
// If none, push to the selector page.
function RequireBusiness() {
  const { effectiveBusinessId } = useSelectedBusiness();
  const location = useLocation();
  if (!effectiveBusinessId) {
    // avoid loop if already on selector
    if (location.pathname !== "/select-business") {
      return <Navigate to="/select-business" replace />;
    }
  }
  return <Outlet />;
}

// Mount features only when we surely have a business id
function WithFeatures() {
  const { effectiveBusinessId } = useSelectedBusiness();
  if (!effectiveBusinessId) return <Outlet />; // on /select-business this is fine
  return (
    <FeaturesProvider businessId={effectiveBusinessId}>
      <Outlet />
    </FeaturesProvider>
  );
}

// Full-screen selector page
function SelectBusinessPage() {
  const { selectedBusinessId } = useSelectedBusiness();
  // Once user picks one, immediately go to dashboard
  if (selectedBusinessId) return <Navigate to="/" replace />;
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-xl font-semibold text-black mb-4">Seleziona Business</h1>
        <BusinessSelector />
      </div>
    </div>
  );
}

// ---- app ----
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <SelectedBusinessProvider>
          <Routes>
            {/* public */}
            <Route path="/login" element={<LoginPage />} />

            {/* private */}
            <Route element={<RequireAuth />}>
              {/* selector step */}
              <Route path="/select-business" element={<SelectBusinessPage />} />

              {/* app area (requires a chosen business) */}
              <Route element={<RequireBusiness />}>
                <Route element={<WithFeatures />}>
                  <Route
                    path="/"
                    element={<Layout />}
                  >
                    <Route index element={<Dashboard />} />
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

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Route>
              </Route>
            </Route>
          </Routes>
        </SelectedBusinessProvider>
      </Router>
    </AuthProvider>
  );
}