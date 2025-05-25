// src/pages/cassa/PaymentPage.tsx
import { useLocation, useNavigate } from 'react-router-dom';
import PaymentForm from '../../components/payments/PaymentForm';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const prefill = location.state || {};

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-4">Nuova Transazione</h1>
      <PaymentForm
        prefill={prefill}
        onSuccess={() => navigate('/cassa')}
      />
    </div>
  );
};

export default PaymentPage;