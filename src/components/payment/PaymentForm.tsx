import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const paymentMethods = ['Contanti', 'Carta', 'POS', 'Satispay', 'Altro'];

const PaymentForm = ({ prefill = {}, onSuccess }) => {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState(''); 
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    if (prefill.customer_name !== undefined) setCustomerName(prefill.customer_name);
    if (prefill.price !== undefined) setPrice(prefill.price);
    if (prefill.discount !== undefined) setDiscount(prefill.discount);
  }, [prefill]);

  const total = Math.max(price - discount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Update appointment: mark as paid + set payment method + update status to 'confirmed'
    await supabase.from('appointments').update({
      paid: true,
      payment_method: paymentMethod,
      appointment_status: 'confirmed', // ✅ AGGIUNTO
    }).eq('id', prefill.appointment_id);

    // 2. Insert transaction
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
    business_id: '6ebf5f92-14ff-430e-850c-f147c3dc16f4', // ✅ hardcoded
    business_id: '268e0ae9-c539-471c-b4c2-1663cf598436', // ✅ hardcoded
  },
]);

    setLoading(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-black mb-2">Cliente</label>
        <input
          type="text"
          value={customerName}
          disabled
          className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-black"
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-black mb-2">Prezzo</label>
        <input
          type="number"
          value={price}
          disabled
          className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-black"
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-black mb-2">Sconto</label>
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
        />
      </div>
      
      <div>
        <label className="block text-sm font-semibold text-black mb-2">Metodo di pagamento</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
        >
          <option value="">Seleziona metodo...</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>
      
      <div className="text-right p-4 bg-gray-50 rounded-xl">
        <p className="text-2xl font-bold text-black">Totale: €{total}</p>
      </div>
      
      <button
        type="submit"
        disabled={loading || !paymentMethod}
        className="w-full py-3 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
      >
        {loading ? 'Salvataggio...' : 'Conferma Pagamento'}
      </button>
    </form>
  );
};

export default PaymentForm;