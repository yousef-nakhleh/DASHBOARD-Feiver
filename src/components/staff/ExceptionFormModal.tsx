import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Barber {
  id: string;
  name: string;
  business_id: string;
}

interface BarberException {
  id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  business_id: string;
}

interface ExceptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  barbers: Barber[];
  businessId: string;
  defaultValues?: BarberException | null;
}

const ExceptionFormModal: React.FC<ExceptionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  barbers,
  businessId,
  defaultValues,
}) => {
  const [barberId, setBarberId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!defaultValues;

  useEffect(() => {
    if (defaultValues) {
      setBarberId(defaultValues.barber_id);
      setDate(defaultValues.date);
      setStartTime(defaultValues.start_time.slice(0, 5)); // Remove seconds
      setEndTime(defaultValues.end_time.slice(0, 5)); // Remove seconds
    } else {
      // Reset form for new exception
      setBarberId('');
      setDate('');
      setStartTime('');
      setEndTime('');
    }
    setError('');
  }, [defaultValues, isOpen]);

  const validateForm = () => {
    if (!barberId) {
      setError('Seleziona un barbiere');
      return false;
    }
    if (!date) {
      setError('Seleziona una data');
      return false;
    }
    if (!startTime) {
      setError('Inserisci l\'orario di inizio');
      return false;
    }
    if (!endTime) {
      setError('Inserisci l\'orario di fine');
      return false;
    }
    if (startTime >= endTime) {
      setError('L\'orario di fine deve essere successivo a quello di inizio');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      const exceptionData = {
        barber_id: barberId,
        date,
        start_time: startTime + ':00', // Add seconds
        end_time: endTime + ':00', // Add seconds
        business_id: businessId,
      };

      let result;
      if (isEditing && defaultValues) {
        // Update existing exception
        result = await supabase
          .from('barbers_exceptions')
          .update(exceptionData)
          .eq('id', defaultValues.id);
      } else {
        // Create new exception
        result = await supabase
          .from('barbers_exceptions')
          .insert([exceptionData]);
      }

      if (result.error) {
        throw result.error;
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving exception:', err);
      setError(err.message || 'Errore durante il salvataggio dell\'eccezione');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">
            {isEditing ? 'Modifica Eccezione' : 'Nuova Eccezione'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Barbiere</label>
            <select
              value={barberId}
              onChange={(e) => setBarberId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
              disabled={saving}
            >
              <option value="">Seleziona un barbiere</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              disabled={saving}
              min={new Date().toISOString().split('T')[0]} // Prevent past dates
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Orario Inizio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">Orario Fine</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                disabled={saving}
              />
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800 text-sm font-medium">Nota:</p>
            <p className="text-yellow-700 text-sm mt-1">
              Durante questo periodo, il barbiere selezionato non sarà disponibile per nuovi appuntamenti.
              Gli appuntamenti esistenti non verranno modificati automaticamente.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
            disabled={saving}
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : (isEditing ? 'Aggiorna Eccezione' : 'Crea Eccezione')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExceptionFormModal;