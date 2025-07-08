// src/components/agenda/EditAppointmentModal.tsx
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_min: number;
  service_id: string;
  barber_id: string;
}

interface Barber {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  duration_min: number;
}

interface Props {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditAppointmentModal({
  appointment,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({
    barber_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_min: 30,
  });

  // carica barbers + services
  useEffect(() => {
    (async () => {
      const [{ data: barbers }, { data: services }] = await Promise.all([
        supabase.from('barbers').select('id, name'),
        supabase.from('services').select('id, name, duration_min'),
      ]);
      if (barbers) setBarbers(barbers);
      if (services) setServices(services);
    })();
  }, []);

  // precompila form
  useEffect(() => {
    if (!appointment) return;
    setForm({
      barber_id: appointment.barber_id,
      service_id: appointment.service_id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      duration_min: appointment.duration_min,
    });
  }, [appointment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!appointment) return;

    await supabase
      .from('appointments')
      .update({
        ...form,
        duration_min: Number(form.duration_min),
      })
      .eq('id', appointment.id);

    onUpdated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Appuntamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Barbiere</Label>
            <select
              name="barber_id"
              value={form.barber_id}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Servizio</Label>
            <select
              name="service_id"
              value={form.service_id}
              onChange={handleChange}
              className="w-full border rounded px-2 py-1"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Data</Label>
            <Input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Ora</Label>
            <Input
              type="time"
              name="appointment_time"
              value={form.appointment_time}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label>Durata (minuti)</Label>
            <Input
              type="number"
              name="duration_min"
              value={form.duration_min}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-6 w-full rounded bg-black text-white py-2"
        >
          Salva modifiche
        </button>
      </DialogContent>
    </Dialog>
  );
}