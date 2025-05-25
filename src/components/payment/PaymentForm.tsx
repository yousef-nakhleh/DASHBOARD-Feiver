// src/components/payment/PaymentForm.tsx
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const paymentMethods = ['Contanti', 'Carta', 'POS', 'Satispay', 'Altro'];

const PaymentForm = ({ prefill = {}, onSuccess }) => {
  const navigate = useNavigate();

  const [customerName] = useState(prefill.customer_name ?? '');
  const [price] = useState(prefill.price ?? 0);
  const [discount, setDiscount] = useState(prefill.discount ?? 0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);

  const total = Math.max(price - discount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await supabase.from('appointments').update({
      paid: true,
      payment_method: paymentMethod,
    }).eq('id', prefill.appointment_id);

    await supabase.from('transactions').insert([
      {
        appointment_id: prefill.appointment_id,
        barber_id: prefill.barber_id,
        service_id: prefill.service_id,
        price,
        discount,
        total,
        payment_method: paymentMethod,
        completed_at: new Date().toISOString(),
      },
    ]);

    setLoading(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Cliente</label>
        <input
          type="text"
          value={customerName}
          disabled
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Prezzo</label>
        <input
          type="number"
          value={price}
          disabled
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Sconto</label>
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Metodo di pagamento</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Seleziona...</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>
      <div className="text-right">
        <p className="text-lg font-semibold">Totale: €{total}</p>
      </div>
      <button
        type="submit"
        disabled={loading || !paymentMethod}
        className="w-full py-2 px-4 bg-[#5D4037] text-white rounded hover:bg-[#4E342E] transition"
      >
        {loading ? 'Salvataggio...' : 'Conferma Pagamento'}
      </button>
    </form>
  );
};

export default PaymentForm;