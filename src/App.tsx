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
import { AgendaGate } from './gates/AgendaGate'; // ✅ NEW

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

                <Route path="cassa" element={<CashRegister />} />
                <Route path="cassa/pagamento" element={<PaymentPage />} />
                <Route path="rubrica" element={<Contacts />} />
                <Route path="trattamenti" element={<Trattamenti />} />
                <Route path="statistiche" element={<Statistiche />} />
                <Route path="magazzino" element={<Magazzino />} />
                <Route path="staff" element={<StaffAvailability />} />

                {/* ✅ Chatbot gated */}
                <Route
                  path="chatbot"
                  element={
                    <ChatbotGate fallback={<Navigate to="/" replace />}>
                      <Chatbot />
                    </ChatbotGate>
                  }
                />

                <Route path="waiting-list" element={<WaitingList />} />
                <Route path="vapi" element={<Vapi />} />
                <Route path="aperture-eccezionali" element={<OpeningExceptions />} />
                <Route path="exceptions" element={<ClosingExceptions />} />
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