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
import Settings from './pages/Settings';
import PaymentPage from './components/payment/PaymentPage';
import Voiceflow from './pages/Voiceflow';
import WaitingList from './pages/WaitingList';
import Vapi from './pages/Vapi';
import ClosingExceptions from './pages/ClosingExceptions';
import OpeningExceptions from './pages/OpeningExceptions';

// 🔐 Auth (moved)
import { AuthProvider, useAuth } from './components/auth/AuthContext';
import LoginPage from './components/auth/LoginPage';

// ---------- Route guard ----------
function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // or a spinner

  if (!user) {
    // send them to /login and remember where they were going
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
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
              <Route path="voiceflow" element={<Voiceflow />} />
              <Route path="waiting-list" element={<WaitingList />} />
              <Route path="vapi" element={<Vapi />} />
              <Route path="aperture-eccezionali" element={<OpeningExceptions />} />
              <Route path="exceptions" element={<ClosingExceptions />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route> 
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;