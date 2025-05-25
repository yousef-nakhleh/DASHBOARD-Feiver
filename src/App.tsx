import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Cassa from './pages/Cassa';
import Rubrica from './pages/Rubrica';
import Trattamenti from './pages/Trattamenti';
import Statistiche from './pages/Statistiche';
import Magazzino from './pages/Magazzino';
import Staff from './pages/Staff';
import Spese from './pages/Spese';
import Promozioni from './pages/Promozioni';

// ✅ Import the PaymentPage from the correct path
import PaymentPage from './components/payment/PaymentPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="cassa" element={<Cassa />} />
          <Route path="rubrica" element={<Rubrica />} />
          <Route path="trattamenti" element={<Trattamenti />} />
          <Route path="statistiche" element={<Statistiche />} />
          <Route path="magazzino" element={<Magazzino />} />
          <Route path="staff" element={<Staff />} />
          <Route path="spese" element={<Spese />} />
          <Route path="promozioni" element={<Promozioni />} />

          {/* ✅ Correct route to PaymentPage */}
          <Route path="cassa/nuova" element={<PaymentPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;