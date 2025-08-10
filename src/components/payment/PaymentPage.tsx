// src/pages/cassa/PaymentPage.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentForm from "./PaymentForm";
import { useAuth } from "../auth/AuthContext";

const PaymentPage = () => {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const prefill = location.state || {};

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!profile?.business_id) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
        <p className="text-red-600">Errore: Profilo non configurato. Contatta l'amministratore.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Nuova Transazione</h1>
      <PaymentForm
        prefill={prefill}
        businessId={profile.business_id}
        onSuccess={() => navigate('/cassa')}
      />
    </div>
  );
};

export default PaymentPage;