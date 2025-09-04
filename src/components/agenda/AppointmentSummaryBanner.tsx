// src/components/agenda/AppointmentSummaryButton.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { X, Check, Trash2, Repeat, Scissors, Printer, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

type DbPaymentMethod = 'Cash' | 'POS' | 'Satispay' | 'Other';
type UiPaymentMethod = 'Contanti' | 'POS' | 'Satispay' | 'Altro';
const UI_TO_DB_PAYMENT: Record<UiPaymentMethod, DbPaymentMethod> = {
  Contanti: 'Cash',
  POS: 'POS',
  Satispay: 'Satispay',
  Altro: 'Other',
};

type AppointmentSummaryButtonProps = {
  position?: { top: number; left: number };
  onClose?: () => void;

  // Required: pass the selected appointment record (as you already have it in Agenda)
  appointment: {
    id: string;
    business_id?: string;
    appointment_date?: string;
    duration_min?: number | null;
    service_id?: string | null;
    barber_id?: string | null;
    paid?: boolean | null;
    // nested (as fetched in Agenda)
    services?: { id?: string; name?: string; price?: number | null; duration_min?: number | null } | null;
    barber?: { id?: string; name?: string | null } | null;
    contact_id?: string | null;
    contact?: { id?: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone_number_e164?: string | null } | null;
  };

  // Call to refresh Agenda after we save/delete/pay
  onAfterUpdate?: () => void;
};

const minutesToHourLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const frac = m.toString().padStart(2, '0'); // 5 -> "05" => "0.05h"
  return `${h}.${frac}h`;
};

const AppointmentSummaryButton: React.FC<AppointmentSummaryButtonProps> = ({
  position,
  onClose,
  appointment,
  onAfterUpdate,
}) => {
  const { profile } = useAuth();
  const businessId = appointment.business_id || profile?.business_id || undefined;

  const style = useMemo<React.CSSProperties>(() => {
    const top = position?.top ?? 120;
    const left = position?.left ?? 460;
    return { position: 'absolute', top, left, zIndex: 60, transform: 'translateX(8px)' };
  }, [position]);

  // ---------------- Tabs ----------------
  const [activeTab, setActiveTab] = useState<'riepilogo' | 'cliente' | 'cassa'>('riepilogo');

  // ---------------- Duration (pending until confirm) ----------------
  const originalDuration =
    appointment.duration_min ?? appointment.services?.duration_min ?? 30;
  const [pendingDuration, setPendingDuration] = useState<number>(originalDuration);
  const [showDurationMenu, setShowDurationMenu] = useState(false);

  // Duration options in 5-min steps
  const durationOptions = useMemo(() => {
    const opts: number[] = [];
    for (let m = 5; m <= 180; m += 5) opts.push(m);
    return opts;
  }, []);

  // ---------------- Contact (editable) ----------------
  const contactId =
    appointment.contact_id ||
    appointment.contact?.id ||
    null;

  const [contact, setContact] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number_e164: string;
  }>({
    first_name: appointment.contact?.first_name || '',
    last_name: appointment.contact?.last_name || '',
    email: appointment.contact?.email || '',
    phone_number_e164: appointment.contact?.phone_number_e164 || '',
  });

  // If email/phone aren’t present in nested contact, fetch once from DB
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!contactId) return;
      const needsFetch =
        !appointment.contact?.email || !appointment.contact?.phone_number_e164;
      if (!needsFetch) return;

      const { data, error } = await supabase
        .from('contacts')
        .select('first_name,last_name,email,phone_number_e164')
        .eq('id', contactId)
        .single();

      if (!cancelled && !error && data) {
        setContact({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone_number_e164: data.phone_number_e164 || '',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactId, appointment.contact?.email, appointment.contact?.phone_number_e164]);

  const saveContact = async () => {
    if (!contactId) return;
    await supabase
      .from('contacts')
      .update({
        first_name: contact.first_name || null,
        last_name: contact.last_name || null,
        email: contact.email || null,
        phone_number_e164: contact.phone_number_e164 || null,
      })
      .eq('id', contactId);
    onAfterUpdate?.();
  };

  // ---------------- Cash (mini) ----------------
  const [payMethod, setPayMethod] = useState<UiPaymentMethod>('Contanti');
  const servicePrice = Number(appointment.services?.price ?? 0);
  const serviceName = appointment.services?.name || '—';
  const barberId = appointment.barber_id || appointment.barber?.id || null;

  const completePayment = async () => {
    if (!businessId) return;

    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        business_id: businessId,
        appointment_id: appointment.id,
        barber_id: barberId,
        payment_method: UI_TO_DB_PAYMENT[payMethod],
        total: servicePrice,
        status: 'succeeded',
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (txErr || !tx) return;

    // single service line
    await supabase.from('transaction_items').insert({
      transaction_id: tx.id,
      item_type: 'service',
      item_ref_id: appointment.service_id ?? appointment.services?.id ?? null,
      item_name_snapshot: serviceName,
      quantity: 1,
      unit_price: servicePrice,
      discount_type: 'none',
      discount_value: 0,
      tax_rate: 0,
      tax_amount: 0,
      line_total: servicePrice,
      barber_id: barberId,
    });

    await supabase.from('appointments').update({ paid: true }).eq('id', appointment.id);
    onAfterUpdate?.();
    // keep the modal open; user can close manually
  };

  // ---------------- Actions (✓ & Elimina) ----------------
  const handleConfirm = async () => {
    // Only write duration if user changed it
    if (pendingDuration !== originalDuration) {
      await supabase
        .from('appointments')
        .update({ duration_min: pendingDuration })
        .eq('id', appointment.id);
    }
    onAfterUpdate?.();
    onClose?.();
  };

  const handleDelete = async () => {
    await supabase
      .from('appointments')
      .update({ appointment_status: 'cancelled' })
      .eq('id', appointment.id);
    onAfterUpdate?.();
    onClose?.();
  };

  // ---------------- Derived UI fields ----------------
  const title = appointment.services?.name || '—';
  const barberName = appointment.barber?.name || '—';
  const priceLabel =
    appointment.services?.price != null
      ? `€ ${Number(appointment.services.price).toFixed(2).replace('.', ',')}`
      : '—';

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

      {/* Body (scrollable, capped height) */}
      <div className="max-h-[380px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Top row (service + duration) -- layout identical */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 truncate">
                {title}
              </div>

              {/* NOTE section removed on purpose */}

              <div className="mt-2 grid grid-cols-[68px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                <div className="text-gray-500">Con</div>
                <div className="font-medium text-gray-900">{barberName}</div>

                <div className="text-gray-500">Prezzo</div>
                <div className="font-semibold text-gray-900">{priceLabel}</div>
              </div>
            </div>

            {/* Duration button + dropdown (changes only stored locally) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowDurationMenu(v => !v)}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-gray-100 text-gray-900 text-[11px] font-semibold border border-gray-200"
                title="Durata"
              >
                {minutesToHourLabel(pendingDuration)} <ChevronDown size={13} className="opacity-70" />
              </button>

              {showDurationMenu && (
                <div
                  className="absolute right-0 mt-1 w-28 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-10"
                  onMouseLeave={() => setShowDurationMenu(false)}
                >
                  {durationOptions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPendingDuration(m)}
                      className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 ${
                        m === pendingDuration ? 'font-semibold text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {minutesToHourLabel(m)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pills (clickable) */}
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

          {/* --- Panels --- */}

          {/* Riepilogo: small recap card (same look, without the privacy banner or notes) */}
          {activeTab === 'riepilogo' && (
            <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50 text-[12px] text-gray-800">
              <div className="grid grid-cols-2 gap-y-1.5">
                <div className="text-gray-500">Servizio</div>
                <div className="font-medium text-gray-900">{title}</div>

                <div className="text-gray-500">Durata</div>
                <div className="font-medium text-gray-900">{minutesToHourLabel(pendingDuration)}</div>

                <div className="text-gray-500">Prezzo</div>
                <div className="font-medium text-gray-900">{priceLabel}</div>
              </div>
            </div>
          )}

          {/* Info Cliente: editable mini-form (mirrors Contacts) */}
          {activeTab === 'cliente' && (
            <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50">
              <div className="text-sm font-semibold text-gray-900 mb-2">Info Cliente</div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <div className="text-gray-500 text-[11px] mb-0.5">Nome</div>
                  <input
                    value={contact.first_name}
                    onChange={(e) => setContact((c) => ({ ...c, first_name: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <div className="text-gray-500 text-[11px] mb-0.5">Cognome</div>
                  <input
                    value={contact.last_name}
                    onChange={(e) => setContact((c) => ({ ...c, last_name: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500 text-[11px] mb-0.5">Email</div>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500 text-[11px] mb-0.5">Telefono</div>
                  <input
                    value={contact.phone_number_e164}
                    onChange={(e) => setContact((c) => ({ ...c, phone_number_e164: e.target.value }))}
                    className="w-full px-2 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={saveContact}
                  disabled={!contactId}
                  className="px-3 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                  Salva contatto
                </button>
              </div>
            </div>
          )}

          {/* Cassa: compact pay panel (mirrors Riepilogo pagamento) */}
          {activeTab === 'cassa' && (
            <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50">
              <div className="text-sm font-semibold text-gray-900 mb-2">Riepilogo Cassa</div>

              <div className="text-[12px] grid grid-cols-[80px_1fr] gap-y-1.5 gap-x-3">
                <div className="text-gray-500">Servizio</div>
                <div className="font-medium text-gray-900">{title}</div>

                <div className="text-gray-500">Prezzo</div>
                <div className="font-semibold text-gray-900">{priceLabel}</div>
              </div>

              <div className="mt-3">
                <label className="block text-[12px] font-semibold text-black mb-1.5">Metodo di pagamento</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as UiPaymentMethod)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-[12px]"
                >
                  {(['Contanti', 'POS', 'Satispay', 'Altro'] as UiPaymentMethod[]).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  onClick={completePayment}
                  className="px-3 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Concludi e stampa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer (fixed) */}
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