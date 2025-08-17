import React from 'react';
import { Pencil, Trash2, DollarSign, X } from 'lucide-react';
import { toLocalFromUTC } from '../../lib/timeUtils';

const AppointmentSummaryBanner = ({ appointment, businessTimezone, onEdit, onPay, onDelete, onClose }) => {
  if (!appointment) return null;

  // Convert appointment_date (timestamptz) to local time for display
  const localTime = toLocalFromUTC({
    utcString: appointment.appointment_date,
    timezone: businessTimezone,
  });

  const displayDate = localTime.toFormat('yyyy-MM-dd');
  const displayTime = localTime.toFormat('HH:mm');

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-[600px] relative">
        <div className="flex justify-between items-start p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-black mb-1">Riepilogo Prenotazione</h2>
            <p className="text-sm text-gray-500">Dettagli dell'appuntamento selezionato</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Cliente</span>
              <p className="text-lg font-semibold text-black mt-1">
                {`${appointment.contact?.first_name || ''} ${appointment.contact?.last_name || ''}`.trim() || 'Non disponibile'}
              </p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Servizio</span>
              <p className="text-lg font-semibold text-black mt-1">{appointment.services?.name || 'Non disponibile'}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Data</span>
              <p className="text-lg font-semibold text-black mt-1">{displayDate}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Orario</span>
              <p className="text-lg font-semibold text-black mt-1">{displayTime}</p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Durata</span>
              <p className="text-lg font-semibold text-black mt-1">
                {(appointment.duration_min || appointment.services?.duration_min)
                  ? `${appointment.duration_min || appointment.services?.duration_min} minuti`
                  : 'Non disponibile'}
              </p>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pagamento</span>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${appointment.paid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className="text-lg font-semibold text-black">{appointment.paid ? 'Completato' : 'In sospeso'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 font-medium transition-colors"
          >
            <Pencil size={16} className="mr-2" /> Modifica
          </button>
          <button
            onClick={onPay}
            className="flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 rounded-xl text-sm text-green-700 font-medium transition-colors"
          >
            <DollarSign size={16} className="mr-2" /> Pagamento
          </button>
          <button
            onClick={onDelete}
            className="flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl text-sm text-red-700 font-medium transition-colors"
          >
            <Trash2 size={16} className="mr-2" /> Elimina
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummaryBanner;