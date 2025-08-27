// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import CashRegister from './pages/CashRegister';
import Contacts from './pages/Contacts';
import Trattamenti from './pages/Trattamenti';
import Statistiche from './pages/Analytics';
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
import { AgendaGate } from './gates/AgendaGate';
import { ChatbotGate } from './gates/ChatbotGate';
import { TransactionsGate } from './gates/TransactionsGate';
import { AvailabilityGate } from './gates/AvailabilityGate';
import { ContactsGate } from './gates/ContactsGate';
import { ServicesGate } from './gates/ServicesGate';
import { PhoneCallerGate } from './gates/PhoneCallerGate';
import { WaitingListGate } from './gates/WaitingListGate';
import { OpeningExceptionsGate } from './gates/OpeningExceptionsGate';
import { ClosingExceptionsGate } from './gates/ClosingExceptionsGate';

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

          {/* Protected */}
          <Route element={<RequireAuth />}>
            <Route element={<WithFeatures />}>
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
                <Route path="statistiche" element={<Analytics />} /> {/* ✅ analytics left open */}
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