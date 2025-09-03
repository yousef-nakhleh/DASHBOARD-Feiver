// src/components/agenda/AppointmentSummaryButton.tsx
import React, { useMemo, useState } from 'react';
import { X, Check, Trash2, Scissors, Repeat, Printer } from 'lucide-react';
import { DateTime } from 'luxon';
import { toLocalFromUTC } from '../../lib/timeUtils';

type AppointmentSummaryButtonProps = {
  appointment: any;                 // enriched from Agenda (includes contact + services)
  businessTimezone: string;
  onClose: () => void;

  // actions wired from Agenda
  onUpdateDuration: (id: string, newDurationMin: number) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onPay?: (appt: any) => void;       // open SlidingPanelPayment with prefill
};

const Tab = {
  SUMMARY: 'summary',
  CLIENT: 'client',
  CASH: 'cash',
} as const;

const chipBase =
  'px-3 py-1 rounded-xl text-sm font-medium transition-colors border';
const chipOn = `${chipBase} bg-black text-white border-black`;
const chipOff = `${chipBase} bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200`;

const ActionGhost =
  'inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800';

export default function AppointmentSummaryButton({
  appointment,
  businessTimezone,
  onClose,
  onUpdateDuration,
  onCancel,
  onPay,
}: AppointmentSummaryButtonProps) {
  const [tab, setTab] = useState<typeof Tab[keyof typeof Tab]>(Tab.SUMMARY);
  const [saving, setSaving] = useState(false);

  // Local editable duration (±5m)
  const initialDuration =
    appointment?.duration_min ?? appointment?.services?.duration_min ?? 30;
  const [duration, setDuration] = useState<number>(initialDuration);

  const local = useMemo(
    () =>
      toLocalFromUTC({
        utcString: appointment.appointment_date,
        timezone: businessTimezone,
      }),
    [appointment.appointment_date, businessTimezone]
  );

  const timeLabel = local.toFormat('HH:mm');
  const dateLabel = local.toFormat('yyyy-LL-dd');

  const clientName = `${appointment?.contact?.first_name || ''} ${
    appointment?.contact?.last_name || ''
  }`.trim();

  const handleBump = async (delta: number) => {
    const next = Math.max(5, duration + delta);
    setDuration(next);
  };

  const handleSaveDuration = async () => {
    if (duration === initialDuration) return;
    setSaving(true);
    try {
      await onUpdateDuration(appointment.id, duration);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setSaving(true);
    try {
      await onCancel(appointment.id);
      onClose(); // close after cancel
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="absolute z-50 top-4 left-4 w-[760px] max-h-[78vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-black">Riepilogo Prenotazione</h2>
          <p className="text-sm text-gray-500 -mt-0.5">Dettagli dell’appuntamento</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-full bg-black text-white hover:bg-gray-800"
            title="Conferma"
            onClick={onClose}
          >
            <Check size={18} />
          </button>
          <button
            className="p-2 rounded-full hover:bg-gray-100"
            title="Chiudi"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="px-6 py-4 overflow-auto">
        {/* Top facts (like your static mock) */}
        <div className="space-y-2 text-[15px] text-gray-900">
          <div className="font-semibold">{appointment?.services?.name ?? '—'}</div>
          {/* Optional “source/ref” block reserved — omitted per your request */}
          <div className="flex items-center gap-8">
            <div>
              <span className="text-gray-500 mr-2">Prezzo</span>
              <span className="font-semibold">
                € {appointment?.services?.price != null ? appointment.services.price.toFixed(2) : '—'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 mr-2">Data</span>
              <span className="font-semibold">{dateLabel}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-2">Orario</span>
              <span className="font-semibold">{timeLabel}</span>
            </div>
            <div>
              <span className="text-gray-500 mr-2">Durata</span>
              <span className="font-semibold">{duration} min</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-3">
          <button
            className={tab === Tab.SUMMARY ? chipOn : chipOff}
            onClick={() => setTab(Tab.SUMMARY)}
          >
            Riepilogo
          </button>
          <button
            className={tab === Tab.CLIENT ? chipOn : chipOff}
            onClick={() => setTab(Tab.CLIENT)}
          >
            Info Cliente
          </button>
          <button
            className={tab === Tab.CASH ? chipOn : chipOff}
            onClick={() => setTab(Tab.CASH)}
          >
            Cassa
          </button>
        </div>

        {/* Panels */}
        <div className="mt-4">
          {tab === Tab.SUMMARY && (
            <div className="space-y-6">
              {/* Duration editor (±5m) */}
              <div className="p-4 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Durata</div>
                    <div className="text-lg font-semibold">{duration} minuti</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                      onClick={() => handleBump(-5)}
                    >
                      −5m
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                      onClick={() => handleBump(+5)}
                    >
                      +5m
                    </button>
                    <button
                      disabled={saving || duration === initialDuration}
                      onClick={handleSaveDuration}
                      className={`px-4 py-2 rounded-xl text-white font-medium ${
                        saving || duration === initialDuration
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-black hover:bg-gray-800'
                      }`}
                    >
                      Salva
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick facts */}
              <div className="p-4 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Cliente</div>
                    <div className="font-medium">{clientName || 'Cliente'}</div>
                    {appointment?.contact?.phone_number_e164 && (
                      <div className="text-gray-600">
                        {appointment.contact.phone_number_e164}
                      </div>
                    )}
                    {appointment?.contact?.email && (
                      <div className="text-gray-600">{appointment.contact.email}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-gray-500">Barbiere</div>
                    <div className="font-medium">{appointment?.barbers?.name ?? '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === Tab.CLIENT && (
            <div className="p-4 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Info Cliente</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Nome</div>
                  <div className="font-medium">{appointment?.contact?.first_name || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Cognome</div>
                  <div className="font-medium">{appointment?.contact?.last_name || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Email</div>
                  <div className="font-medium">{appointment?.contact?.email || '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Telefono</div>
                  <div className="font-medium">
                    {appointment?.contact?.phone_number_e164 || '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === Tab.CASH && (
            <div className="p-4 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-2">Cassa</h3>
              <p className="text-sm text-gray-600 mb-4">
                Apri la cassa per registrare il pagamento di questo appuntamento.
              </p>
              <button
                className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
                onClick={() => onPay?.(appointment)}
              >
                Apri Cassa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100"
          disabled={saving}
          onClick={handleCancel}
        >
          <Trash2 size={16} /> Elimina
        </button>
        <div className="flex items-center gap-3">
          <button className={ActionGhost}><Scissors size={16}/> Taglia</button>
          <button className={ActionGhost}><Repeat size={16}/> Ripeti</button>
          <button className={ActionGhost}><Printer size={16}/> Stampa</button>
        </div>
      </div>
    </div>
  );
}