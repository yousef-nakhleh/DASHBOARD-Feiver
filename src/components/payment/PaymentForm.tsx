import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const paymentMethods = ['Contanti', 'Carta', 'POS', 'Satispay', 'Altro'];

const PaymentForm = ({ appointment }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    customerName: appointment?.customer_name || '',
    barberId: appointment?.barber_id || '',
    serviceId: appointment?.service_id || '',
    price: 0,
    discount: 0,
    paymentMethod: '',
  });

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from('services').select('*');
      setServices(data || []);
      const service = data?.find((s) => s.id === form.serviceId);
      if (service) setForm((f) => ({ ...f, price: service.price }));
    };
    fetchServices();
  }, [form.serviceId]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const total = form.price - form.discount;

    const { error } = await supabase.from('transactions').insert([
      {
        appointment_id: appointment?.id || null,
        barber_id: form.barberId,
        service_id: form.serviceId,
        price: form.price,
        discount: form.discount,
        total,
        payment_method: form.paymentMethod,
        completed_at: new Date().toISOString(),
      },
    ]);

    if (!error && appointment?.id) {
      await supabase.from('appointments').update({ paid: true, payment_method: form.paymentMethod }).eq('id', appointment.id);
    }

    navigate('/cassa');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Cliente</label>
        <input
          type="text"
          value={form.customerName}
          disabled
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2 bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Servizio</label>
        <select
          value={form.serviceId}
          onChange={(e) => handleChange('serviceId', e.target.value)}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Seleziona servizio</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Prezzo</label>
        <input
          type="number"
          value={form.price}
          onChange={(e) => handleChange('price', parseFloat(e.target.value))}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Sconto</label>
        <input
          type="number"
          value={form.discount}
          onChange={(e) => handleChange('discount', parseFloat(e.target.value))}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Metodo di pagamento</label>
        <select
          value={form.paymentMethod}
          onChange={(e) => handleChange('paymentMethod', e.target.value)}
          className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Seleziona metodo</option>
          {paymentMethods.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="text-right">
        <button
          type="submit"
          className="bg-[#5D4037] hover:bg-[#4E342E] text-white px-6 py-2 rounded-lg"
        >
          Conferma Pagamento
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;