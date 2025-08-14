import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PaymentForm from '@/components/payment/PaymentForm';
import { toUTCFromLocal, toLocalFromUTC } from '@/lib/timeUtils';
import { useAuth } from '@/components/auth/AuthContext';

interface Props {
  appointment: any;
  businessTimezone: string;
  onClose: () => void;
  onUpdated: () => void;
}

/* lista tempi ogni 10′ (06:00-21:00) */
const TIMES: string[] = (() => {
  const t: string[] = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h === 21 && m > 0) break;
      t.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return t;
})();

export default function EditAppointmentModal({ appointment, businessTimezone, onClose, onUpdated }: Props) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'edit' | 'payment'>('edit');
  const [edited, setEdited] = useState<any>(() => {
    // Convert UTC appointment_start to local time for editing
    const localTime = toLocalFromUTC({
      utcString: appointment.appointment_date,
      timezone: businessTimezone,
    });
    
    return {
      ...appointment,
      appointment_date: localTime.toFormat('yyyy-MM-dd'),
      appointment_time: localTime.toFormat('HH:mm'),
    };
  });
  const [services, setServices] = useState<any[]>([]);
  const [busyTimes, setBusyTimes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  /* servizi */
  useEffect(() => {
    supabase
      .from('services')
      .select('id,name')
      .eq('business_id', appointment.business_id)
      .then(({ data }) => setServices(data ?? []));
  }, [appointment]);

  /* slot occupati nella stessa data/barbiere (pending|confirmed) */
  useEffect(() => {
    (async () => {
      // Get UTC range for the selected date
      const startOfDay = toUTCFromLocal({
        date: edited.appointment_date,
        time: '00:00',
        timezone: businessTimezone,
      });
      const endOfDay = toUTCFromLocal({
        date: edited.appointment_date,
        time: '23:59',
        timezone: businessTimezone,
      });
      
      const { data } = await supabase
        .from('appointments')
        .select('appointment_date, services(duration_min), id')
        .eq('barber_id', appointment.barber_id)
        .eq('business_id', appointment.business_id)
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .in('appointment_status', ['pending', 'confirmed']);

      const blocked = new Set<string>();

      (data ?? []).forEach((a) => {
        if (a.id === appointment.id) return; // ignora sé stesso
        
        // Convert UTC appointment_start to local time for comparison
        const localAppt = toLocalFromUTC({
          utcString: a.appointment_date,
          timezone: businessTimezone,
        });
        const start = new Date(`2000-01-01T${localAppt.toFormat('HH:mm')}:00`);
        const end   = new Date(start.getTime() + (a.services?.duration_min || 30) * 60000);

        for (let t of TIMES) {
          const ts = new Date(`2000-01-01T${t}:00`);
          const te = new Date(ts.getTime() + edited.duration_min * 60000);
          if (ts < end && te > start) blocked.add(t);
        }
      });
      setBusyTimes(blocked);
    })();
  }, [appointment, edited.duration_min, edited.appointment_date, businessTimezone]);

  /* change handler */
  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEdited((p: any) => ({
      ...p,
      [name]: name === 'duration_min' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Convert local time back to UTC for storage
    const appointmentStartUTC = toUTCFromLocal({
      date: edited.appointment_date,
      time: edited.appointment_time,
      timezone: businessTimezone,
    });
    
    const { error } = await supabase
      .from('appointments')
      .update({
        customer_name:    edited.customer_name,
        service_id:       edited.service_id,
        appointment_date: appointmentStartUTC,
        duration_min:     edited.duration_min,
      })
      .eq('id', edited.id);

    setSaving(false);
    if (error) alert('Errore: ' + error.message);
    else {
      onUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white w-[600px] rounded-2xl shadow-xl">
        {/* TABs */}
        <div className="flex p-4 space-x-2 border-b">
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

        {tab === 'edit' ? (
          <div className="p-6 space-y-5">
            {/* nome */}
            <div>
              <label className="block text-sm font-semibold mb-1">Nome Cliente</label>
              <input
                type="text"
                name="customer_name"
                value={edited.customer_name}
                onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-black"
              />
            </div>

            {/* servizio */}
            <div>
              <label className="block text-sm font-semibold mb-1">Servizio</label>
              <select
                name="service_id"
                value={edited.service_id}
                onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-black"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* data */}
            <div>
              <label className="block text-sm font-semibold mb-1">Data</label>
              <input
                type="date"
                name="appointment_date"
                value={edited.appointment_date}
                onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-black"
              />
            </div>

            {/* orario */}
            <div>
              <label className="block text-sm font-semibold mb-1">Orario</label>
              <select
                name="appointment_time"
                value={edited.appointment_time}
                onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-black"
              >
                {TIMES.map((t) => (
                  <option
                    key={t}
                    value={t}
                    disabled={busyTimes.has(t)}
                    className={busyTimes.has(t) ? 'text-gray-400 line-through' : ''}
                  >
                    {t} {busyTimes.has(t) ? '(occupato)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* durata */}
            <div>
              <label className="block text-sm font-semibold mb-1">Durata (minuti)</label>
              <input
                type="number"
                name="duration_min"
                min={5}
                step={5}
                value={edited.duration_min}
                onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-black"
              />
            </div>

            {/* footer */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <PaymentForm
              prefill={{
                appointment_id: edited.id,
                barber_id:      edited.barber_id,
                service_id:     edited.service_id,
                price:          edited.services?.price ?? 0,
                customer_name:  edited.customer_name,
              }}
              businessId={profile?.business_id}
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