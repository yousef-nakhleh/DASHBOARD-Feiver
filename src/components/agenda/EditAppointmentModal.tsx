import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const EditAppointmentModal = ({ appointment, onClose, onUpdated }) => {
  const [customerName, setCustomerName] = useState(appointment.customer_name);
  const [serviceId, setServiceId] = useState(appointment.service_id);
  const [duration, setDuration] = useState(appointment.duration_min);

  const handleSave = async () => {
    await supabase
      .from('appointments')
      .update({
        customer_name: customerName,
        service_id: serviceId,
        duration_min: duration,
      })
      .eq('id', appointment.id);

    onUpdated(); // Refresh appointments
    onClose();   // Close modal
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-lg font-semibold mb-4">Modifica Appuntamento</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Cliente</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Servizio</label>
            <input
              type="text"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Durata (minuti)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentModal;