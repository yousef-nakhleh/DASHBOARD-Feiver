import React from 'react';
import { Pencil, Trash2, DollarSign, X } from 'lucide-react';

const AppointmentSummaryBanner = ({ appointment, onEdit, onPay, onDelete, onClose }) => {
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-[500px] relative">
        {/* Header */}
        <div className="flex justify-between items-start px-6 pt-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Riepilogo Prenotazione</h2>
            <p className="text-sm text-gray-500">Dettagli rapidi dell'appuntamento selezionato</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-3">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Cliente:</span>{' '}
            {appointment.customer_name || 'Non disponibile'}
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700">Servizio:</span>{' '}
            {appointment.services?.name || 'Non disponibile'}
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700">Data:</span>{' '}
            {appointment.appointment_date}
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700">Orario:</span>{' '}
            {appointment.appointment_time?.slice(0, 5)}
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700">Durata:</span>{' '}
            {appointment.duration_min} minuti
          </div>
          <div className="text-sm">
            <span className="font-medium text-gray-700">Pagamento:</span>{' '}
            {appointment.paid ? 'Completato' : 'In sospeso'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 px-6 pb-5 pt-2 border-t">
          <button
            onClick={onEdit}
            className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700"
          >
            <Pencil size={16} className="mr-1" /> Modifica
          </button>
          <button
            onClick={onPay}
            className="flex items-center px-3 py-2 bg-green-100 hover:bg-green-200 rounded text-sm text-green-700"
          >
            <DollarSign size={16} className="mr-1" /> Pagamento
          </button>
          <button
            onClick={onDelete}
            className="flex items-center px-3 py-2 bg-red-100 hover:bg-red-200 rounded text-sm text-red-700"
          >
            <Trash2 size={16} className="mr-1" /> Elimina
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummaryBanner;