// src/components/agenda/AppointmentSummaryButton.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { X, Check, Trash2, Repeat, Scissors, Printer, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type AppointmentSummaryButtonProps = {
  position?: { top: number; left: number };
  onClose?: () => void;

  // expects joined appointment:
  // { id, contact?, contact_id, services?, duration_min?, barber? }
  appointment: any;
  onAfterUpdate?: () => void;              // refresh agenda after save/delete
  onOpenCash?: (appointmentId: string) => void; // shortcut to cassa
};

const minutesToHourLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}.${String(m).padStart(2, '0')}h`;
};

const AppointmentSummaryButton: React.FC<AppointmentSummaryButtonProps> = ({
  position,
  onClose,
  appointment,
  onAfterUpdate,
  onOpenCash,
}) => {
  // Anchor near the card, no backdrop.
  const style = useMemo<React.CSSProperties>(() => {
    const top = position?.top ?? 120;
    const left = position?.left ?? 460;
    return { position: 'absolute', top, left, zIndex: 60, transform: 'translateX(8px)' };
  }, [position]);

  // Tabs
  const [activeTab, setActiveTab] = useState<'riepilogo' | 'cliente' | 'cassa'>('riepilogo');

  // Duration (pending until ✓)
  const [showDurationMenu, setShowDurationMenu] = useState(false);
  const [pending, setPending] = useState<{ duration_min?: number }>({});
  const baseDuration =
    appointment.duration_min ?? appointment.services?.duration_min ?? 30;
  const effectiveDuration = pending.duration_min ?? baseDuration;

  // Contact (hydrate if not embedded)
  const [contact, setContact] = useState<any>(appointment.contact || null);
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (appointment?.contact?.first_name || !appointment?.contact_id) return;
      const { data } = await supabase
        .from('contacts')
        .select('first_name,last_name,email,phone_number_e164')
        .eq('id', appointment.contact_id)
        .single();
      if (!ignore && data) setContact(data);
    })();
    return () => { ignore = true; };
  }, [appointment?.contact, appointment?.contact_id]);

  // Save ✓
  const handleConfirm = async () => {
    const updates: any = {};
    if (typeof pending.duration_min === 'number' && pending.duration_min !== baseDuration) {
      updates.duration_min = pending.duration_min;
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from('appointments').update(updates).eq('id', appointment.id);
    }
    onAfterUpdate?.();
    onClose?.();
  };

  // Delete -> cancelled
  const handleDelete = async () => {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'cancelled' })
      .eq('id', appointment.id);
    onAfterUpdate?.();
    onClose?.();
  };

  // Duration options (5m steps)
  const durationOptions: number[] = useMemo(() => {
    const arr: number[] = [];
    for (let m = 5; m <= 180; m += 5) arr.push(m);
    return arr;
  }, []);

  // Derived fields
  const serviceName = appointment?.services?.name ?? '—';
  const price = typeof appointment?.services?.price === 'number' ? appointment.services.price : null;
  const barberName = appointment?.barber?.name ?? '—';

  const firstName = contact?.first_name ?? '—';
  const lastName = contact?.last_name ?? '—';
  const email = contact?.email ?? '—';
  const phone = contact?.phone_number_e164 ?? '—';

  return (
    <div
      style={style}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 w-[460px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-black leading-tight">Riepilogo Prenotazione</h3>
          <p className="text-xs text-gray-500">Dettagli dell’appuntamento</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleConfirm}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
            title="Conferma"
            type="button"
          >
            <Check size={16} />
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
            title="Chiudi"
            type="button"
          >
            <X size={16} className="text-black" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[380px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Title row (matches your approved UI) */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 truncate">
                {serviceName}
              </div>

              {/* NOTE removed per your instruction */}

              <div className="mt-2 grid grid-cols-[68px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                <div className="text-gray-500">Con</div>
                <div className="font-medium text-gray-900">{barberName}</div>

                <div className="text-gray-500">Prezzo</div>
                <div className="font-semibold text-gray-900">
                  {price !== null ? `€ ${price.toFixed(2).replace('.', ',')}` : '—'}
                </div>
              </div>
            </div>

            {/* Duration: choose now, save on ✓ */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowDurationMenu(v => !v)}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-gray-100 text-gray-900 text-[11px] font-semibold border border-gray-200"
                title="Durata"
              >
                {minutesToHourLabel(effectiveDuration)} <ChevronDown size={13} className="opacity-70" />
              </button>

              {showDurationMenu && (
                <div
                  className="absolute right-0 mt-1 w-28 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-10"
                  onMouseLeave={() => setShowDurationMenu(false)}
                >
                  {durationOptions.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPending(p => ({ ...p, duration_min: m }))}
                      className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 ${
                        m === effectiveDuration ? 'font-semibold text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {minutesToHourLabel(m)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              className={`px-2.5 py-1.5 text-[11px] rounded-full ${
                activeTab === 'riepilogo' ? 'font-semibold bg-black text-white' : 'font-medium bg-gray-100 text-gray-700'
              }`}
              onClick={() => setActiveTab('riepilogo')}
              type="button"
            >
              Riepilogo
            </button>
            <button
              className={`px-2.5 py-1.5 text-[11px] rounded-full ${
                activeTab === 'cliente' ? 'font-semibold bg-black text-white' : 'font-medium bg-gray-100 text-gray-700'
              }`}
              onClick={() => setActiveTab('cliente')}
              type="button"
            >
              Info Cliente
            </button>
            <button
              className={`px-2.5 py-1.5 text-[11px] rounded-full ${
                activeTab === 'cassa' ? 'font-semibold bg-black text-white' : 'font-medium bg-gray-100 text-gray-700'
              }`}
              onClick={() => setActiveTab('cassa')}
              type="button"
            >
              Cassa
            </button>
          </div>

          {/* Panels */}
          {activeTab === 'riepilogo' && (
            <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50 text-[12px] text-gray-800">
              <div className="grid grid-cols-2 gap-y-1.5">
                <div className="text-gray-500">Servizio</div>
                <div className="font-medium text-gray-900">{serviceName}</div>

                <div className="text-gray-500">Durata</div>
                <div className="font-medium text-gray-900">{minutesToHourLabel(effectiveDuration)}</div>

                <div className="text-gray-500">Prezzo</div>
                <div className="font-medium text-gray-900">
                  {price !== null ? `€ ${price.toFixed(2).replace('.', ',')}` : '—'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cliente' && (
            <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50">
              <div className="text-sm font-semibold text-gray-900 mb-2">Info Cliente</div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <div className="text-gray-500 text-[11px] mb-0.5">Nome</div>
                  <div className="font-medium text-gray-900">{firstName}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[11px] mb-0.5">Cognome</div>
                  <div className="font-medium text-gray-900">{lastName || '—'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500 text-[11px] mb-0.5">Email</div>
                  <div className="font-medium text-gray-900 break-all">{email}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500 text-[11px] mb-0.5">Telefono</div>
                  <div className="font-medium text-gray-900 break-all">{phone}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cassa' && (
            <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50">
              <div className="text-sm font-semibold text-gray-900 mb-2">Riepilogo Cassa</div>
              <div className="text-[12px] grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-3">
                <div className="text-gray-500">Servizio</div>
                <div className="font-medium text-gray-900">{serviceName}</div>
                <div className="text-gray-500">Prezzo</div>
                <div className="font-semibold text-gray-900">
                  {price !== null ? `€ ${price.toFixed(2).replace('.', ',')}` : '—'}
                </div>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onOpenCash?.(appointment.id)}
                  className="px-3 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Vai alla cassa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          title="Elimina"
        >
          <Trash2 size={16} />
          <span className="text-sm font-medium">Elimina</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Taglia"
          >
            <Scissors size={16} />
            <span className="text-sm font-medium">Taglia</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Ripeti"
          >
            <Repeat size={16} />
            <span className="text-sm font-medium">Ripeti</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Stampa"
          >
            <Printer size={16} />
            <span className="text-sm font-medium">Stampa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummaryButton;