// src/components/agenda/AppointmentSummaryButton.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { X, Check, Trash2, Repeat, Scissors, Printer, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type AppointmentSummaryButtonProps = {
  position?: { top: number; left: number };
  onClose?: () => void;

  // 🔹 dynamic data
  appointment: {
    id: string;
    appointment_date: string;
    duration_min?: number;
    paid?: boolean;
    appointment_status?: string;
    service_id?: string;
    barber_id?: string;
    services?: { name?: string; price?: number; duration_min?: number } | null;
    contact?: {
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      phone_number_e164?: string | null;
    } | null;
    // optional convenience fields if you already have them
    barber_name?: string;
    notes?: string | null;
  };

  // 🔹 optional parent hooks
  onAfterUpdate?: () => void;     // e.g. refetch calendar
  onOpenCash?: (appointmentId: string) => void;
};

const AppointmentSummaryButton: React.FC<AppointmentSummaryButtonProps> = ({
  position,
  onClose,
  appointment,
  onAfterUpdate,
  onOpenCash,
}) => {
  // ---- layout/position (unchanged) ----
  const style = useMemo<React.CSSProperties>(() => {
    const top = position?.top ?? 120;
    const left = position?.left ?? 460;
    return {
      position: 'absolute',
      top,
      left,
      zIndex: 60,
      transform: 'translateX(8px)',
    };
  }, [position]);

  // ---- derived display fields (no UI changes) ----
  const serviceName =
    appointment?.services?.name ?? '—';
  const price =
    typeof appointment?.services?.price === 'number'
      ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(appointment.services!.price!)
      : '—';
  const barberName = appointment?.barber_name ?? 'Alket'; // fallback to keep identical visual
  const durationMin = appointment?.duration_min ?? appointment?.services?.duration_min ?? 30;

  const fullName = `${appointment?.contact?.first_name ?? ''} ${appointment?.contact?.last_name ?? ''}`.trim() || 'Gabriel';
  const email = appointment?.contact?.email ?? 'morminagabriel17@gmail.co';
  const phone = appointment?.contact?.phone_number_e164 ?? '+39 000 000 0000';

  // ---- duration dropdown (5m steps) ----
  const [showDurMenu, setShowDurMenu] = useState(false);
  const [localDuration, setLocalDuration] = useState<number>(durationMin);
  useEffect(() => setLocalDuration(durationMin), [durationMin]);

  // build compact list around current duration (keep menu small like the UI)
  const durationOptions = useMemo(() => {
    const base = durationMin;
    const values = new Set<number>();
    // -15m .. +45m around current, step 5m
    for (let d = base - 15; d <= base + 45; d += 5) {
      if (d >= 5 && d <= 240) values.add(d);
    }
    // also include the service default if present
    if (appointment?.services?.duration_min) values.add(appointment.services.duration_min);
    return Array.from(values).sort((a, b) => a - b);
  }, [durationMin, appointment?.services?.duration_min]);

  const durMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!durMenuRef.current) return;
      if (!durMenuRef.current.contains(e.target as Node)) setShowDurMenu(false);
    };
    if (showDurMenu) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showDurMenu]);

  const asHoursLabel = (m: number) => {
    // keep your exact label pattern "0.30h"
    const h = Math.floor(m / 60);
    const min = m % 60;
    const parts = [];
    parts.push(h.toString());
    parts.push('.');
    parts.push(min.toString().padStart(2, '0'));
    return `${parts.join('')}h`;
  };

  const updateDuration = async (newMin: number) => {
    setLocalDuration(newMin);
    // persist
    await supabase.from('appointments').update({ duration_min: newMin }).eq('id', appointment.id);
    setShowDurMenu(false);
    onAfterUpdate?.();
  };

  const handleDelete = async () => {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'cancelled' })
      .eq('id', appointment.id);
    onAfterUpdate?.();
    onClose?.();
  };

  return (
    <div
      style={style}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 w-[460px] overflow-hidden"
    >
      {/* Header (fixed) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-black leading-tight">Riepilogo Prenotazione</h3>
          <p className="text-xs text-gray-500">Dettagli dell’appuntamento</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
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

      {/* Body (scrollable, capped height) */}
      <div className="max-h-[380px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Service row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 truncate">
                {serviceName || 'Taglio Uomo con Shampoo'}
              </div>
              <div className="mt-2 grid grid-cols-[68px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                <div className="text-gray-500">Con</div>
                <div className="font-medium text-gray-900">{barberName}</div>

                <div className="text-gray-500">Note</div>
                <div className="text-gray-800 whitespace-pre-line">
                  {appointment?.notes
                    ? appointment.notes
                    : `Alban\n(shampoo)\nSource: Treatwell\nOrder Reference: T2157334518\nBooking Reference: bk_142692964`}
                </div>

                <div className="text-gray-500">Prezzo</div>
                <div className="font-semibold text-gray-900">{price || '€ 20,00'}</div>
              </div>
            </div>

            {/* Duration button + dropdown (same visual) */}
            <div className="relative" ref={durMenuRef}>
              <button
                type="button"
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-gray-100 text-gray-900 text-[11px] font-semibold border border-gray-200"
                title="Durata"
                onClick={() => setShowDurMenu(v => !v)}
              >
                {asHoursLabel(localDuration)} <ChevronDown size={13} className="opacity-70" />
              </button>

              {showDurMenu && (
                <div className="absolute right-0 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  {durationOptions.map((m) => (
                    <button
                      key={m}
                      className={`w-full text-left px-3 py-1.5 text-[11px] ${
                        m === localDuration ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => updateDuration(m)}
                    >
                      {asHoursLabel(m)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabs mimic (static look) */}
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1.5 text-[11px] font-semibold rounded-full bg-black text-white">
              Riepilogo
            </span>
            <span className="px-2.5 py-1.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-700">
              Info Cliente
            </span>
            <button
              type="button"
              className="px-2.5 py-1.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-700"
              onClick={() => onOpenCash?.(appointment.id)}
            >
              Cassa
            </button>
          </div>

          {/* Info Cliente block */}
          <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50">
            <div className="text-sm font-semibold text-gray-900 mb-2">Info Cliente</div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <div className="text-gray-500 text-[11px] mb-0.5">Nome</div>
                <div className="font-medium text-gray-900">{fullName.split(' ')[0] || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500 text-[11px] mb-0.5">Cognome</div>
                <div className="font-medium text-gray-900">
                  {fullName.split(' ').slice(1).join(' ') || '—'}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 text-[11px] mb-0.5">Email</div>
                <div className="font-medium text-gray-900">{email}</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 text-[11px] mb-0.5">Telefono</div>
                <div className="font-medium text-gray-900">{phone}</div>
              </div>
            </div>

            <div className="mt-2 text-[11px] font-semibold text-white bg-red-500 rounded-md px-2.5 py-1.5 inline-flex">
              Non ha dato i consensi per la privacy
            </div>
          </div>
        </div>
      </div>

      {/* Footer (fixed) */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          title="Elimina"
          onClick={handleDelete}
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