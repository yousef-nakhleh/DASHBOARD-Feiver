import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const BUSINESS_ID = '268e0ae9-c539-471c-b4c2-1663cf598436';   // ← aggiunto

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

    // 1. Aggiorna appuntamento
    await supabase
      .from('appointments')
      .update({
        paid: true,
        payment_method: paymentMethod,
        appointment_status: 'confirmed',
      })
      .eq('id', prefill.appointment_id);

    // 2. Inserisci transazione (con business_id)
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
        business_id: BUSINESS_ID,           // ← unica aggiunta
      },
    ]);

    setLoading(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* …UI invariata… */}
      <div>
        <label className="block text-sm font-semibold text-black mb-2">Cliente</label>
        <input
          type="text"
          value={customerName}
          disabled
          className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-black"
        />
      </div>

      {/* resto del form identico */}
      {/* … */}
    </form>
  );
};

export default PaymentForm;