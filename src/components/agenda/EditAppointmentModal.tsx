import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const EditAppointmentModal = ({ appointment, onClose, onUpdated, services = [], payments = [] }) => {
  const [customerName, setCustomerName] = useState(appointment.customer_name);
  const [serviceId, setServiceId] = useState(appointment.service_id);
  const [duration, setDuration] = useState(appointment.duration_min);
  const [paymentStatus, setPaymentStatus] = useState(appointment.payment_status || 'non_pagato');
  const [paymentMethod, setPaymentMethod] = useState(appointment.payment_method || '');

  const handleSave = async () => {
    await supabase
      .from('appointments')
      .update({
        customer_name: customerName,
        service_id: serviceId,
        duration_min: duration,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
      })
      .eq('id', appointment.id);

    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[420px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Modifica Appuntamento</h2>

        {/* SECTION 1: Appointment Details */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-600">🖋 Dettagli Appuntamento</h3>
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
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
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

        <hr className="my-4" />

        {/* SECTION 2: Payment */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-600">💳 Pagamento</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stato Pagamento</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="pagato">Pagato</option>
              <option value="non_pagato">Non Pagato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Metodo di Pagamento</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleziona metodo</option>
              <option value="contanti">Contanti</option>
              <option value="carta">Carta</option>
              <option value="satispay">Satispay</option>
              <option value="pos">POS</option>
              <option value="altro">Altro</option>
            </select>
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
