// src/components/agenda/EditAppointmentModal.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PaymentForm from '@/components/payment/PaymentForm';

interface Props {
  /** Oggetto appuntamento selezionato  */
  appointment: any;
  /** Chiude la modale (senza salvare)  */
  onClose: () => void;
  /** Callback dopo il salvataggio riuscito */
  onUpdated: () => void;
}

/* ────────────────────────────────────────────────────────────────────────── */
/** Genera tutte le ore dalle 06:00 alle 21:00 con step di 15 min */
const generateTimes = () => {
  const list: string[] = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 0) break;
      list.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return list;
};
const TIMES = generateTimes();
/* ────────────────────────────────────────────────────────────────────────── */

export default function EditAppointmentModal({ appointment, onClose, onUpdated }: Props) {
  const [tab, setTab] = useState<'edit' | 'payment'>('edit');
  const [edited, setEdited] = useState<any>(appointment);
  const [services, setServices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  /* carica servizi per la tendina */
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name')
        .eq('business_id', appointment.business_id);
      setServices(data ?? []);
    })();
  }, [appointment]);

  /* handler campi input/select ------------------------------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEdited((p: any) => ({
      ...p,
      [name]: name === 'duration_min' ? Number(value) : value,
    }));
  };

  /* salvataggio supabase -------------------------------------------------- */
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('appointments')
      .update({
        customer_name:    edited.customer_name,
        service_id:       edited.service_id,
        appointment_date: edited.appointment_date,
        appointment_time: edited.appointment_time,
        duration_min:     edited.duration_min,
      })
      .eq('id', edited.id);

    setSaving(false);
    if (!error) {
      onUpdated();
      onClose();
    } else {
      // semplice alert – sostituisci con UI custom se preferisci
      alert('Errore durante il salvataggio: ' + error.message);
    }
  };

  /* ---------------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[600px] rounded-2xl shadow-xl">
        {/* Tabs header */}
        <div className="flex p-4 space-x-2 border-b border-gray-100">
          {(['edit', 'payment'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1 rounded-full text-sm font-medium ${
                tab === t ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-700'
              }`}
            >
              {t === 'edit' ? 'Modifica' : 'Pagamento'}
            </button>
          ))}
        </div>

        {/* TAB : MODIFICA -------------------------------------------------- */}
        {tab === 'edit' && (
          <div className="p-6 space-y-5">
            {/* Nome cliente */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nome Cliente
              </label>
              <input
                type="text"
                name="customer_name"
                value={edited.customer_name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2"
              />
            </div>

            {/* Servizio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Servizio
              </label>
              <select
                name="service_id"
                value={edited.service_id}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                name="appointment_date"
                value={edited.appointment_date}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2"
              />
            </div>

            {/* Orario */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Orario
              </label>
              <select
                name="appointment_time"
                value={edited.appointment_time?.slice(0, 5)}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2"
              >
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Durata */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Durata (minuti)
              </label>
              <input
                type="number"
                name="duration_min"
                min={5}
                step={5}
                value={edited.duration_min}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-2"
              />
            </div>

            {/* Bottoni footer */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </div>
        )}

        {/* TAB : PAGAMENTO ------------------------------------------------- */}
        {tab === 'payment' && (
          <div className="p-6">
            <PaymentForm
              prefill={{
                appointment_id: edited.id,
                barber_id:      edited.barber_id,
                service_id:     edited.service_id,
                price:          edited.services?.price ?? 0,
                customer_name:  edited.customer_name,
              }}
              onSuccess={() => {
                onUpdated();
                onClose();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}