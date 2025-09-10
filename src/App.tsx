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

// ✅ Features gates
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

// ✅ Business selection provider
import {
  SelectedBusinessProvider,
  useSelectedBusiness,
} from "./components/auth/SelectedBusinessProvider";
import BusinessSelector from "./components/auth/BusinessSelector";

// ✅ Super admin panel
import SuperAdmin from "./superadmin/SuperAdmin";

/* -------- Auth guard -------- */
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}

/* -------- Business routing logic -------- */
function BusinessGate() {
  const {
    effectiveBusinessId,
    memberships,
    membershipsLoading,
    membershipsError,
    selectedBusinessId,
    isSuperAdmin,
  } = useSelectedBusiness();

  if (membershipsLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow text-center">
          <div className="animate-pulse text-gray-700 mb-2">Caricamento…</div>
          <div className="text-sm text-gray-500">
            Recupero aziende disponibili.
          </div>
        </div>
      </div>
    );
  }

  if (membershipsError) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">
            Errore: {membershipsError}
          </p>
        </div>
      </div>
    );
  }

  // ✅ Super admin: always land in the global SuperAdmin panel
  if (isSuperAdmin && !effectiveBusinessId) {
    return <SuperAdmin />;
  }

  // ✅ Non-super admin: auto-select if only one business
  if (!isSuperAdmin && memberships.length === 1 && !effectiveBusinessId) {
    return <Navigate to="/" replace />;
  }

  // ✅ When a business is selected → mount the dashboard with that business context
  if (effectiveBusinessId) {
    return (
      <FeaturesProvider key={effectiveBusinessId} businessId={effectiveBusinessId}>
        <Layout>
          <Outlet />
        </Layout>
      </FeaturesProvider>
    );
  }

  // ✅ Non-super admin: multiple memberships but none selected yet → show selector
  if (!isSuperAdmin && memberships.length > 1 && !effectiveBusinessId) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">
          <h1 className="text-xl font-bold text-black mb-2">
            Seleziona Business
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Scegli l’azienda con cui lavorare.
          </p>
          <BusinessSelector />
        </div>
      </div>
    );
  }

  // ✅ Fallback for users with no memberships at all
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <p className="text-gray-700 font-semibold">
          Nessun business associato.
        </p>
      </div>
    </div>
  );
}

/* -------- App -------- */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Private */}
          <Route element={<RequireAuth />}>
            <Route
              element={
                <SelectedBusinessProvider>
                  <BusinessGate />
                </SelectedBusinessProvider>
              }
            >
              {/* Normal business dashboard (only when a business is selected) */}
              <Route
                path="/"
                element={
                  <Layout>
                    <Dashboard />
                  </Layout>
                }
              />
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
            </Route>

            {/* ✅ Super Admin entry point */}
            <Route
              path="/superadmin"
              element={
                <SelectedBusinessProvider>
                  <SuperAdmin />
                </SelectedBusinessProvider>
              }
            />

            {/* Default */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;