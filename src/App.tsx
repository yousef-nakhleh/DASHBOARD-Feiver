// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import CashRegister from "./pages/CashRegister";
import Contacts from "./pages/Contacts";
import Trattamenti from "./pages/Trattamenti";
import Statistiche from "./pages/Statistiche";
import Magazzino from "./pages/Magazzino";
import StaffAvailability from "./pages/StaffAvailability";
import PaymentPage from "./components/payment/PaymentPage";
import Voiceflow from "./pages/Voiceflow";
import WaitingList from "./pages/WaitingList";
import Vapi from "./pages/Vapi";
import ClosingExceptions from "./pages/ClosingExceptions";
import OpeningExceptions from "./pages/OpeningExceptions";

// Auth
import { AuthProvider, useAuth } from "./components/auth/AuthContext";
import LoginPage from "./components/auth/LoginPage";

// ✅ Features
import { FeaturesProvider } from "./features/FeaturesProvider";
import { ChatbotGate } from "./gates/ChatbotGate"; // gate for chatbot/voiceflow

// ---------- Route guard ----------
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a spinner
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// ✅ Wrap protected routes with FeaturesProvider
function WithFeatures() {
  const { profile, loading } = useAuth();

  if (loading) return null; // wait for profile
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
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route element={<RequireAuth />}>
            <Route element={<WithFeatures />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="cassa" element={<CashRegister />} />
                <Route path="cassa/pagamento" element={<PaymentPage />} />
                <Route path="rubrica" element={<Contacts />} />
                <Route path="trattamenti" element={<Trattamenti />} />
                <Route path="statistiche" element={<Statistiche />} />
                <Route path="magazzino" element={<Magazzino />} />
                <Route path="staff" element={<StaffAvailability />} />

                {/* ✅ Voiceflow page is gated by ChatbotGate (chatbot.component) */}
                <Route
                  path="voiceflow"
                  element={
                    <ChatbotGate fallback={<Navigate to="/" replace />}>
                      <Voiceflow />
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