// src/components/agenda/AppointmentSummaryButton.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Check,
  Trash2,
  Repeat,
  Scissors,
  Printer,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type AppointmentSummaryButtonProps = {
  position?: { top: number; left: number };
  onClose?: () => void;

  // dynamic data/control
  appointment: any; // expects: id, contact{...}, contact_id, services{name,price,duration_min}, duration_min, barber?.name
  onAfterUpdate?: () => void;         // refresh agenda after save/delete/confirm
  onOpenCash?: (appointmentId: string) => void; // (kept) not used here anymore
};

const minutesToHourLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const mm = m.toString().padStart(2, '0');
  return `${h}.${mm}h`;
};

const DURATION_MIN_OPTIONS = Array.from({ length: (180 - 5) / 5 + 1 }, (_, i) => 5 + i * 5); // 5..180 step 5

// UI -> DB mapping for payment methods
type UiPaymentMethod = 'Contanti' | 'POS' | 'Satispay' | 'Altro';
type DbPaymentMethod = 'Cash' | 'POS' | 'Satispay' | 'Other';
const UI_TO_DB: Record<UiPaymentMethod, DbPaymentMethod> = {
  Contanti: 'Cash',
  POS: 'POS',
  Satispay: 'Satispay',
  Altro: 'Other',
};

const AppointmentSummaryButton: React.FC<AppointmentSummaryButtonProps> = ({
  position,
  onClose,
  appointment,
  onAfterUpdate,
}) => {
  // —— position (unchanged UI) ——
  const style = useMemo<React.CSSProperties>(() => {
    const top = position?.top ?? 120;
    const left = position?.left ?? 460;
    return { position: 'absolute', top, left, zIndex: 60, transform: 'translateX(8px)' };
  }, [position]);

  // —— tabs ——
  const [activeTab, setActiveTab] = useState<'riepilogo' | 'cliente' | 'cassa'>('riepilogo');
  const [showDurMenu, setShowDurMenu] = useState(false);

  // —— pending changes (ONLY saved with ✓) ——
  const baseDuration =
    appointment?.duration_min ?? appointment?.services?.duration_min ?? 30;
  const [pendingDuration, setPendingDuration] = useState<number | null>(null);
  const effectiveDuration = pendingDuration ?? baseDuration;

  // —— contact (hydrate if not provided) ——
  const [contact, setContact] = useState<any>(appointment?.contact || null);

  // Draft mirrors EditContactModal fields (UI remains this page’s)
  const [contactDraft, setContactDraft] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    phone_prefix: string;
    phone_number_raw: string;
    phone_number_e164: string;
    birthdate: string | null;
    notes: string;
  } | null>(null);

  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (appointment?.contact?.first_name || !appointment?.contact_id) return;
      const { data } = await supabase
        .from('contacts')
        .select('first_name,last_name,email,phone_number_e164,phone_prefix,phone_number_raw,birthdate,notes')
        .eq('id', appointment.contact_id)
        .single();
      if (!cancelled && data) setContact(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [appointment?.contact, appointment?.contact_id]);

  // Prepare editable draft when switching to "cliente"
  useEffect(() => {
    if (activeTab === 'cliente') {
      const phone_prefix = contact?.phone_prefix ?? '+39';
      const phone_number_raw = contact?.phone_number_raw ?? '';
      const phone_number_e164 = contact?.phone_number_e164 ?? (phone_prefix && phone_number_raw ? `${phone_prefix}${phone_number_raw}` : '');
      setContactDraft({
        first_name: contact?.first_name ?? '',
        last_name: contact?.last_name ?? '',
        email: contact?.email ?? '',
        phone_prefix,
        phone_number_raw,
        phone_number_e164,
        birthdate: contact?.birthdate ?? null,
        notes: contact?.notes ?? '',
      });
    }
  }, [activeTab, contact]);

  // —— actions ——
  const handleConfirm = async () => {
    const updates: Record<string, any> = {};
    if (pendingDuration !== null && pendingDuration !== baseDuration) {
      updates.duration_min = pendingDuration;
    }
    if (Object.keys(updates).length) {
      await supabase.from('appointments').update(updates).eq('id', appointment.id);
    }
    setPendingDuration(null);
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

  const saveContact = async () => {
    if (!appointment?.contact_id || !contactDraft) return;
    setSavingContact(true);

    // Build E.164
    const e164 = (contactDraft.phone_prefix || '') + (contactDraft.phone_number_raw || '');
    const payload = {
      first_name: contactDraft.first_name,
      last_name: contactDraft.last_name,
      email: contactDraft.email,
      phone_prefix: contactDraft.phone_prefix,
      phone_number_raw: contactDraft.phone_number_raw,
      phone_number_e164: e164 || null,
      birthdate: contactDraft.birthdate || null,
      notes: contactDraft.notes || null,
    };

    await supabase
      .from('contacts')
      .update(payload)
      .eq('id', appointment.contact_id);

    setSavingContact(false);
    setContact({
      ...contact,
      ...payload,
    });
    onAfterUpdate?.();
  };

  // —— Cassa state (summary + payment) ——
  const [payMethod, setPayMethod] = useState<UiPaymentMethod>('Contanti');
  const [payNote,   setPayNote]   = useState('');
  const [paying,    setPaying]    = useState(false);
  const [paidOk,    setPaidOk]    = useState(false);

  // —— derived fields for UI (no layout changes) ——
  const serviceName = appointment?.services?.name ?? '—';
  const priceNum =
    typeof appointment?.services?.price === 'number'
      ? appointment.services.price
      : 0;
  const priceLabel = `€ ${priceNum.toFixed(2).replace('.', ',')}`;
  const barberName = appointment?.barber?.name ?? '—';

  const firstName = contact?.first_name ?? '—';
  const lastName = contact?.last_name ?? '—';
  const email = contact?.email ?? '—';
  const phone = contact?.phone_number_e164 ?? '—';

  // Create transaction + items, mark appointment as paid
  const confirmPayment = async () => {
    if (!appointment?.id) return;
    try {
      setPaying(true);
      setPaidOk(false);

      // Get business_id, service_id, barber_id directly from DB to avoid extra props
      const { data: apptRow, error: apptErr } = await supabase
        .from('appointments')
        .select('id, business_id, service_id, barber_id, paid')
        .eq('id', appointment.id)
        .single();
      if (apptErr || !apptRow) throw apptErr || new Error('Appointment not found');

      // Don’t double-charge
      if (apptRow.paid) {
        setPaidOk(true);
        setPaying(false);
        return;
      }

      const dbMethod: DbPaymentMethod = UI_TO_DB[payMethod];

      // Insert transaction
      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .insert({
          business_id: apptRow.business_id,
          appointment_id: appointment.id,
          barber_id: apptRow.barber_id ?? null,
          payment_method: dbMethod,
          total: priceNum,
          status: 'succeeded',
          completed_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (txErr || !tx) throw txErr || new Error('Transaction insert failed');

      // Insert single service line
      const { error: itemsErr } = await supabase.from('transaction_items').insert({
        transaction_id: tx.id,
        item_type: 'service',
        item_ref_id: apptRow.service_id ?? null,
        item_name_snapshot: serviceName,
        quantity: 1,
        unit_price: priceNum,
        discount_type: 'none',
        discount_value: 0,
        tax_rate: 0,
        tax_amount: 0,
        line_total: priceNum,
        barber_id: apptRow.barber_id ?? null,
      });
      if (itemsErr) throw itemsErr;

      // Mark appointment as paid
      await supabase.from('appointments').update({ paid: true }).eq('id', appointment.id);

      setPaidOk(true);
      onAfterUpdate?.();
    } catch (e) {
      console.error(e);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div style={style} className="bg-white rounded-2xl shadow-xl border border-gray-100 w-[460px] overflow-hidden">
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

      {/* Body (scrollable, capped height) — stays same height for all tabs */}
      <div className="max-h-[380px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Top section ONLY on Riepilogo */}
          {activeTab === 'riepilogo' && (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-gray-900 break-words">
                  {serviceName}
                </div>
                <div className="mt-2 grid grid-cols-[68px_1fr] gap-x-3 gap-y-1.5 text=[12px] text-[12px]">
                  <div className="text-gray-500">Con</div>
                  <div className="font-medium text-gray-900">{barberName}</div>
                  <div className="text-gray-500">Prezzo</div>
                  <div className="font-semibold text-gray-900">{priceLabel}</div>
                </div>
              </div>

              {/* Duration selector (pending) */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDurMenu(v => !v)}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-gray-100 text-gray-900 text-[11px] font-semibold border border-gray-200"
                  title="Durata"
                >
                  {minutesToHourLabel(effectiveDuration)} <ChevronDown size={13} className="opacity-70" />
                </button>
                {showDurMenu && (
                  <div
                    className="absolute right-0 mt-1 w-28 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-10"
                    onMouseLeave={() => setShowDurMenu(false)}
                  >
                    {DURATION_MIN_OPTIONS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPendingDuration(m)} // select only; save with ✓
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
          )}

          {/* Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              className={`px-2.5 py-1.5 text-[11px] rounded-full ${
                activeTab === 'riepilogo' ? 'font-semibold bg-black text-white' : 'font-medium bg-gray-100 text-gray-700'
              }`}
              onClick={() => { setActiveTab('riepilogo'); setShowDurMenu(false); }}
              type="button"
            >
              Riepilogo
            </button>
            <button
              className={`px-2.5 py-1.5 text-[11px] rounded-full ${
                activeTab === 'cliente' ? 'font-semibold bg-black text-white' : 'font-medium bg-gray-100 text-gray-700'
              }`}
              onClick={() => { setActiveTab('cliente'); setShowDurMenu(false); }}
              type="button"
            >
              Info Cliente
            </button>
            <button
              className={`px-2.5 py-1.5 text-[11px] rounded-full ${
                activeTab === 'cassa' ? 'font-semibold bg-black text-white' : 'font-medium bg-gray-100 text-gray-700'
              }`}
              onClick={() => { setActiveTab('cassa'); setShowDurMenu(false); }}
              type="button"
            >
              Cassa
            </button>
          </div>

          {/* Riepilogo page */}
          {activeTab === 'riepilogo' && (
            <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50 text-[12px] text-gray-800">
              <div className="grid grid-cols-2 gap-y-1.5">
                <div className="text-gray-500">Servizio</div>
                <div className="font-medium text-gray-900 break-words">{serviceName}</div>
                <div className="text-gray-500">Durata</div>
                <div className="font-medium text-gray-900">{minutesToHourLabel(effectiveDuration)}</div>
                <div className="text-gray-500">Prezzo</div>
                <div className="font-medium text-gray-900">{priceLabel}</div>
              </div>

              {/* Info Cliente summary card (read-only) */}
              <div className="mt-3 rounded-xl border border-gray-100 p-3.5 bg-white">
                <div className="text-sm font-semibold text-gray-900 mb-2">Info Cliente</div>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <div>
                    <div className="text-gray-500 text-[11px] mb-0.5">Nome</div>
                    <div className="font-medium text-gray-900">{firstName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[11px] mb-0.5">Cognome</div>
                    <div className="font-medium text-gray-900">{lastName}</div>
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
            </div>
          )}

          {/* Info Cliente page (extended fields, same UI style) */}
          {activeTab === 'cliente' && (
            <>
              <div className="flex items-center justify-center relative">
                <button
                  type="button"
                  onClick={() => setActiveTab('riepilogo')}
                  className="absolute left-0 inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100"
                  aria-label="Torna al riepilogo"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-semibold text-gray-900">Info Cliente</div>
              </div>

              <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50">
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="col-span-1">
                    <div className="text-gray-500 text-[11px] mb-0.5">Nome</div>
                    <input
                      value={contactDraft?.first_name ?? ''}
                      onChange={(e) => setContactDraft(d => ({ ...(d || {}), first_name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-1">
                    <div className="text-gray-500 text-[11px] mb-0.5">Cognome</div>
                    <input
                      value={contactDraft?.last_name ?? ''}
                      onChange={(e) => setContactDraft(d => ({ ...(d || {}), last_name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="text-gray-500 text-[11px] mb-0.5">Email</div>
                    <input
                      type="email"
                      value={contactDraft?.email ?? ''}
                      onChange={(e) => setContactDraft(d => ({ ...(d || {}), email: e.target.value }))}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  {/* Phone prefix + raw */}
                  <div className="col-span-1">
                    <div className="text-gray-500 text-[11px] mb-0.5">Prefisso</div>
                    <select
                      value={contactDraft?.phone_prefix ?? '+39'}
                      onChange={(e) =>
                        setContactDraft(d => ({ ...(d || {}), phone_prefix: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="+39">+39</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <div className="text-gray-500 text-[11px] mb-0.5">Telefono</div>
                    <input
                      value={contactDraft?.phone_number_raw ?? ''}
                      onChange={(e) =>
                        setContactDraft(d => ({ ...(d || {}), phone_number_raw: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="text-gray-500 text-[11px] mb-0.5">Data di nascita</div>
                    <input
                      type="date"
                      value={contactDraft?.birthdate ?? ''}
                      onChange={(e) =>
                        setContactDraft(d => ({ ...(d || {}), birthdate: e.target.value || null }))
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <div className="text-gray-500 text-[11px] mb-0.5">Note</div>
                    <textarea
                      rows={3}
                      value={contactDraft?.notes ?? ''}
                      onChange={(e) =>
                        setContactDraft(d => ({ ...(d || {}), notes: e.target.value }))
                      }
                      className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={saveContact}
                    disabled={savingContact}
                    className="px-3 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
                  >
                    {savingContact ? 'Salvataggio…' : 'Salva modifiche'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Cassa page — now shows inline "Riepilogo pagamento" with confirm */}
          {activeTab === 'cassa' && (
            <>
              <div className="flex items-center justify-center relative">
                <button
                  type="button"
                  onClick={() => setActiveTab('riepilogo')}
                  className="absolute left-0 inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100"
                  aria-label="Torna al riepilogo"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-sm font-semibold text-gray-900">Cassa</div>
              </div>

              <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50">
                {/* Riepilogo pagamento (compact) */}
                <div className="text-sm font-semibold text-gray-900 mb-2">Riepilogo pagamento</div>

                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{serviceName}</span>
                    <span className="text-black font-medium">{priceLabel}</span>
                  </div>

                  <div className="border-t border-gray-200 my-2" />

                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-gray-700 font-semibold">Totale</span>
                    <span className="text-black font-bold">{priceLabel}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-3" />

                {/* Metodo di pagamento */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-black">Metodo di pagamento</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as UiPaymentMethod)}
                    className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-[13px]"
                  >
                    <option>Contanti</option>
                    <option>POS</option>
                    <option>Satispay</option>
                    <option>Altro</option>
                  </select>
                </div>

                {/* Note */}
                <div className="space-y-1.5 mt-3">
                  <label className="block text-[12px] font-semibold text-black">Note</label>
                  <input
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Nota facoltativa per la ricevuta"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-[13px]"
                  />
                </div>

                {/* Confirm button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={confirmPayment}
                    disabled={paying || paidOk}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${paidOk
                      ? 'bg-gray-200 text-gray-600 cursor-default'
                      : 'bg-black text-white hover:bg-gray-800'
                      }`}
                  >
                    {paidOk ? 'Pagamento registrato' : paying ? 'Conferma…' : 'Conferma pagamento'}
                  </button>
                </div>
              </div>
            </>
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