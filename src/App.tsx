// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import CashRegister from './pages/CashRegister';
import Contacts from './pages/Contacts';
import Trattamenti from './pages/Trattamenti';
import Statistiche from './pages/Statistiche';
import Magazzino from './pages/Magazzino';
import StaffAvailability from './pages/StaffAvailability';
import PaymentPage from './components/payment/PaymentPage';
import Chatbot from './pages/Chatbot';
import WaitingList from './pages/WaitingList';
import Vapi from './pages/Vapi';
import ClosingExceptions from './pages/ClosingExceptions';
import OpeningExceptions from './pages/OpeningExceptions';

// 🔐 Auth
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import LoginPage from './components/auth/LoginPage';

// ✅ Features
import { FeaturesProvider } from './features/FeaturesProvider';
import { ChatbotGate } from './gates/ChatbotGate';
import { AgendaGate } from './gates/AgendaGate';

// ✅ Newly added gates
import { TransactionsGate } from './gates/TransactionsGate';
import { AvailabilityGate } from './gates/AvailabilityGate';
import { ContactsGate } from './gates/ContactsGate';
import { ServicesGate } from './gates/ServicesGate';
import { AnalyticsGate } from './gates/AnalyticsGate';
import { PhoneCallerGate } from './gates/PhoneCallerGate';
import { OpeningExceptionsGate } from './gates/OpeningExceptionsGate';
import { ClosingExceptionsGate } from './gates/ClosingExceptionsGate';
import { WaitingListGate } from './gates/WaitingList'; // assuming this file exports WaitingListGate

// ---------- Route guard ----------
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// ✅ Wrap protected routes with FeaturesProvider (needs business_id)
function WithFeatures() {
  const { profile, loading } = useAuth();
  if (loading) return null;

  const businessId = profile?.business_id ?? null;
  if (!businessId) {
    return <div className="p-6">Nessun business associato.</div>;
  }

  return (
    <FeaturesProvider businessId={businessId}>
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
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Everything else is protected */}
          <Route element={<RequireAuth />}>
            {/* mount FeaturesProvider for all protected routes */}
            <Route element={<WithFeatures />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />

                {/* ✅ Agenda gated */}
                <Route
                  path="agenda"
                  element={
                    <AgendaGate fallback={<Navigate to="/" replace />}>
                      <Agenda />
                    </AgendaGate>
                  }
                />

                {/* ✅ Transactions (Cash Register) gated */}
                <Route
                  path="cassa"
                  element={
                    <TransactionsGate fallback={<Navigate to="/" replace />}>
                      <CashRegister />
                    </TransactionsGate>
                  }
                />
                <Route
                  path="cassa/pagamento"
                  element={
                    <TransactionsGate fallback={<Navigate to="/" replace />}>
                      <PaymentPage />
                    </TransactionsGate>
                  }
                />

                {/* ✅ Contacts gated */}
                <Route
                  path="rubrica"
                  element={
                    <ContactsGate fallback={<Navigate to="/" replace />}>
                      <Contacts />
                    </ContactsGate>
                  }
                />

                {/* ✅ Services (Trattamenti) gated */}
                <Route
                  path="trattamenti"
                  element={
                    <ServicesGate fallback={<Navigate to="/" replace />}>
                      <Trattamenti />
                    </ServicesGate>
                  }
                />

                {/* ✅ Analytics (Statistiche) gated */}
                <Route
                  path="statistiche"
                  element={
                    <AnalyticsGate fallback={<Navigate to="/" replace />}>
                      <Statistiche />
                    </AnalyticsGate>
                  }
                />

                {/* (No gate requested) */}
                <Route path="magazzino" element={<Magazzino />} />

                {/* ✅ Availability (Staff) gated */}
                <Route
                  path="staff"
                  element={
                    <AvailabilityGate fallback={<Navigate to="/" replace />}>
                      <StaffAvailability />
                    </AvailabilityGate>
                  }
                />

                {/* ✅ Chatbot gated */}
                <Route
                  path="chatbot"
                  element={
                    <ChatbotGate fallback={<Navigate to="/" replace />}>
                      <Chatbot />
                    </ChatbotGate>
                  }
                />

                {/* ✅ Waiting List gated */}
                <Route
                  path="waiting-list"
                  element={
                    <WaitingListGate fallback={<Navigate to="/" replace />}>
                      <WaitingList />
                    </WaitingListGate>
                  }
                />

                {/* ✅ Phone Caller gated */}
                <Route
                  path="vapi"
                  element={
                    <PhoneCallerGate fallback={<Navigate to="/" replace />}>
                      <Vapi />
                    </PhoneCallerGate>
                  }
                />

                {/* ✅ Opening/Closing Exceptions gated */}
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