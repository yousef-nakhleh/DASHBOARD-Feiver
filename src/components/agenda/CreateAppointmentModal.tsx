import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const CreateAppointmentModal = ({ onClose, onCreated, defaultDate }) => {
  const [customerName, setCustomerName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [barberId, setBarberId] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('07:00');
  const [duration, setDuration] = useState(30);

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: servicesData } = await supabase.from('services').select('*');
      const { data: barbersData } = await supabase.from('barbers').select('*');
      setServices(servicesData || []);
      setBarbers(barbersData || []);
    };
    fetchData();
  }, []);

  const handleServiceChange = (id) => {
    setServiceId(id);
    const selected = services.find((s) => s.id === id);
    if (selected) setDuration(selected.duration_min || 30);
  };

  const handleCreate = async () => {
    await supabase.from('appointments').insert({
      customer_name: customerName,
      service_id: serviceId,
      barber_id: barberId,
      appointment_date: defaultDate.toISOString().split('T')[0],
      appointment_time: appointmentTime + ':00',
      duration_min: duration,
    });

    onCreated();
    onClose();
  };

  const generateTimes = () => {
    const slots = [];
    for (let h = 6; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === 21 && m > 0) break;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-lg font-semibold mb-4">Nuovo Appuntamento</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nome Cliente</label>
            <input
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Servizio</label>
            <select
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              value={serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
            >
              <option value="">Seleziona servizio</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Barbiere</label>
            <select
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
            >
              <option value="">Seleziona barbiere</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Orario</label>
            <select
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
            >
              {generateTimes().map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Durata (minuti)</label>
            <input
              type="number"
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700">
            Annulla
          </button>
          <button onClick={handleCreate} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">
            Crea
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAppointmentModal;