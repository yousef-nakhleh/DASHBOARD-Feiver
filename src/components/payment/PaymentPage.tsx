import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { Check, Trash2, Plus, X } from 'lucide-react';

// Types and constants from CashRegister
type DbPaymentMethod = "Cash" | "POS" | "Satispay" | "Other";
type UiPaymentMethod = "Contanti" | "POS" | "Satispay" | "Altro";

const UI_TO_DB_PAYMENT: Record<UiPaymentMethod, DbPaymentMethod> = {
  Contanti: "Cash",
  POS: "POS",
  Satispay: "Satispay",
  Altro: "Other",
};

type LineItem = {
  id: string;
  kind: "service" | "product";
  name: string;
  barberId?: string | null;
  qty: number;
  unit: number;
  discountType?: "none" | "fixed" | "percent";
  discountValue?: number;
  refServiceId?: string | null;
};

function computeLineTotal(li: LineItem): number {
  const base = (li.qty ?? 1) * (li.unit ?? 0);
  const type = li.discountType || "none";
  const val = li.discountValue || 0;
  if (type === "fixed") return Math.max(base - val, 0);
  if (type === "percent") return Math.max(base - (base * val) / 100, 0);
  return base;
}

const PaymentPage = () => {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const prefill = location.state || {};

  // Payment form state
  const [items, setItems] = useState<LineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<UiPaymentMethod>("Contanti");
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Initialize items from prefill data
  useEffect(() => {
    if (prefill.appointment_id && prefill.service_id) {
      const initialItem: LineItem = {
        id: "li" + Math.random().toString(36).slice(2, 8),
        kind: "service",
        name: prefill.service_name || "Servizio",
        barberId: prefill.barber_id || null,
        qty: 1,
        unit: Number(prefill.price || 0),
        discountType: "none",
        discountValue: 0,
        refServiceId: prefill.service_id,
      };
      setItems([initialItem]);
    }
  }, [prefill]);

  const total = useMemo(() => items.reduce((s, i) => s + computeLineTotal(i), 0), [items]);

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addService = () => {
    const id = "li" + Math.random().toString(36).slice(2, 8);
    setItems((prev) => [
      ...prev,
      {
        id,
        kind: "service",
        name: "Servizio",
        barberId: prefill.barber_id || null,
        qty: 1,
        unit: 0,
        discountType: "none",
        discountValue: 0,
        refServiceId: null,
      },
    ]);
  };

  const completePayment = async () => {
    if (!profile?.business_id || !prefill.appointment_id || items.length === 0) {
      setError("Dati mancanti per completare il pagamento");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const dbMethod: DbPaymentMethod = UI_TO_DB_PAYMENT[paymentMethod];

      // Insert transaction
      const { data: tx, error: txErr } = await supabase
        .from("transactions")
        .insert({
          business_id: profile.business_id,
          appointment_id: prefill.appointment_id,
          payment_method: dbMethod,
          total: total,
          status: "succeeded",
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (txErr || !tx) {
        throw new Error(txErr?.message || "Errore durante la creazione della transazione");
      }

      // Insert transaction items
      const itemRows = items.map((i) => ({
        transaction_id: tx.id,
        item_type: i.kind === "product" ? "product" : "service",
        item_ref_id: i.refServiceId ?? null,
        item_name_snapshot: i.name,
        quantity: i.qty,
        unit_price: i.unit,
        discount_type: (i.discountType as "none" | "fixed" | "percent" | undefined) ?? "none",
        discount_value: Number(i.discountValue ?? 0),
        tax_rate: 0,
        tax_amount: 0,
        line_total: computeLineTotal(i),
        barber_id: i.barberId ?? prefill.barber_id ?? null,
      }));

      const { error: itemsErr } = await supabase.from("transaction_items").insert(itemRows);
      if (itemsErr) {
        throw new Error(itemsErr.message || "Errore durante l'inserimento degli elementi");
      }

      // Mark appointment as paid
      const { error: apptErr } = await supabase
        .from("appointments")
        .update({ paid: true })
        .eq("id", prefill.appointment_id);

      if (apptErr) {
        throw new Error(apptErr.message || "Errore durante l'aggiornamento dell'appuntamento");
      }

      // Navigate back to cash register
      navigate('/cassa');
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Errore durante il pagamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  if (!profile?.business_id) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
        <p className="text-red-600">Errore: Profilo non configurato. Contatta l'amministratore.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-black">
                Trattamenti
                {prefill.customer_name && (
                  <span className="text-gray-500 font-normal"> • {prefill.customer_name}</span>
                )}
              </h2>
              <button
                onClick={() => setItems([])}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} /> Svuota
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {items.map((li) => (
                <div key={li.id} className="relative rounded-xl border border-gray-200 p-4">
                  {/* Row 1: name and barber */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={li.name}
                      onChange={(e) => updateItem(li.id, { name: e.target.value })}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                      placeholder="Nome servizio"
                    />
                    <input
                      value={li.unit}
                      type="number"
                      step="0.01"
                      onChange={(e) => updateItem(li.id, { unit: Number(e.target.value) })}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                      placeholder="Prezzo"
                    />
                  </div>

                  {/* Row 2: discount type and amount */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <select
                      value={li.discountType || "none"}
                      onChange={(e) => updateItem(li.id, { discountType: e.target.value as any })}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                    >
                      <option value="none">Senza sconto</option>
                      <option value="fixed">Sconto €</option>
                      <option value="percent">Sconto %</option>
                    </select>
                    <input
                      type="number"
                      value={li.discountValue ?? 0}
                      onChange={(e) => updateItem(li.id, { discountValue: Number(e.target.value) })}
                      className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                      placeholder="Valore sconto"
                    />
                  </div>

                  {/* Trash button */}
                  <button
                    onClick={() => removeItem(li.id)}
                    className="absolute right-3 bottom-3 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Rimuovi riga"
                  >
                    <Trash2 size={16} />
                  </button>

                  {/* Row 3: total */}
                  <div className="mt-6 flex items-center justify-center text-sm text-black">
                    Totale riga:&nbsp;<span className="font-semibold">€ {computeLineTotal(li).toFixed(2)}</span>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nessun elemento. Aggiungi un servizio.
                </p>
              )}
            </div>

            {/* Add service button */}
            <div className="mt-6">
              <button
                onClick={addService}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-black"
              >
                <Plus size={16} /> Aggiungi servizio
              </button>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-black">Riepilogo pagamento</h2>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              {items.length === 0 && <p className="text-sm text-gray-500">Nessun trattamento aggiunto.</p>}
              {items.map((li) => (
                <div key={li.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{li.name}</span>
                  <span className="text-black font-medium">€ {computeLineTotal(li).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200" />

            <div className="flex items-center justify-between text-lg">
              <div className="text-gray-700 font-semibold">Totale</div>
              <div className="text-black font-bold">€ {total.toFixed(2)}</div>
            </div>

            <div className="border-t border-gray-200 pt-4" />

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-black">Metodo di pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as UiPaymentMethod)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
              >
                <option value="Contanti">Contanti</option>
                <option value="POS">POS</option>
                <option value="Satispay">Satispay</option>
                <option value="Altro">Altro</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-black">Note</label>
              <input
                placeholder="Nota facoltativa per la ricevuta"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={items.length === 0 || saving}
                className="w-full bg-black text-white py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
              >
                <Check size={16} />
                {saving ? 'Elaborazione...' : 'Concludi e stampa'}
              </button>
            </div>

            <div>
              <button
                onClick={() => navigate('/cassa')}
                className="w-full px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-black font-medium"
              >
                Torna alla Cassa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-md">
            <div className="p-5 border-b">
              <div className="text-lg font-semibold">Conferma pagamento</div>
            </div>
            <div className="p-5">
              <p>Sei sicuro di voler confermare il pagamento di <strong>€{total.toFixed(2)}</strong>?</p>
              {prefill.customer_name && (
                <p className="text-sm text-gray-600 mt-2">Cliente: {prefill.customer_name}</p>
              )}
            </div>
            <div className="p-5 flex justify-end gap-2 border-t">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                disabled={saving}
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  setConfirmOpen(false);
                  await completePayment();
                }}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Elaborazione...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;