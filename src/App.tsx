import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Cassa from './pages/Cassa';
import Rubrica from './pages/Rubrica';
import Trattamenti from './pages/Trattamenti';
import Statistiche from './pages/Statistiche';
import Magazzino from './pages/Magazzino';
import Staff from './pages/Staff';
import Settings from './pages/Settings';
import PaymentPage from './components/payment/PaymentPage';
import Voiceflow from './pages/Voiceflow';
import WaitingList from './pages/WaitingList';
import Vapi from './pages/Vapi';

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
              <Route path="cassa" element={<Cassa />} />
              <Route path="cassa/pagamento" element={<PaymentPage />} />
              <Route path="rubrica" element={<Rubrica />} />
              <Route path="trattamenti" element={<Trattamenti />} />
              <Route path="statistiche" element={<Statistiche />} />
              <Route path="magazzino" element={<Magazzino />} />
              <Route path="staff" element={<Staff />} />
              <Route path="voiceflow" element={<Voiceflow />} />
              <Route path="waiting-list" element={<WaitingList />} />
              <Route path="vapi" element={<Vapi />} />
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