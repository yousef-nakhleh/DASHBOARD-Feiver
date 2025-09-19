import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { Plus, Search, Check, Trash2, X, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/auth/AuthContext";
import { useSelectedBusiness } from "../components/auth/SelectedBusinessProvider"; // ✅
import { toUTCFromLocal, toLocalFromUTC } from "../lib/timeUtils";
import { useBusinessTimezone } from "../hooks/useBusinessTimezone"; // ✅ NEW

// ---------- Types ----------
type DbPaymentMethod = "Cash" | "POS" | "Satispay" | "Other";
type UiPaymentMethod = "Contanti" | "POS" | "Satispay" | "Altro";

const UI_TO_DB_PAYMENT: Record<UiPaymentMethod, DbPaymentMethod> = {
  Contanti: "Cash",
  POS: "POS",
  Satispay: "Satispay",
  Altro: "Other",
};

type AppointmentRow = {
  id: string;
  appointment_date: string; // timestamptz in DB (UTC)
  paid: boolean | null;
  appointment_status: "pending" | "confirmed" | "cancelled" | null;
  service?: { id: string; name: string; price: number | null } | null;
  barber?: { id: string; name: string | null } | null;
  contact?: { id: string; full_name: string | null } | null;
};

type UiAppointment = {
  id: string;
  time: string; // "HH:MM" in business local time
  client: string;
  barber: string;
  service: string;
  price: number;
  appointment_status: "pending" | "confirmed" | "cancelled" | null;
  paid: boolean;
  raw: AppointmentRow;
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

type ServiceRow = { id: string; name: string; price: number | null };

type BarberRow = { id: string; name: string | null };

// ---------- Helpers ----------
function computeLineTotal(li: LineItem): number {
  const base = (li.qty ?? 1) * (li.unit ?? 0);
  const type = li.discountType || "none";
  const val = li.discountValue || 0;
  if (type === "fixed") return Math.max(base - val, 0);
  if (type === "percent") return Math.max(base - (base * val) / 100, 0);
  return base;
}

// ---------- Component ----------
export default function CashRegister() {
  const { loading: authLoading } = useAuth(); // ✅ changed
  const { effectiveBusinessId } = useSelectedBusiness(); // ✅ NEW
  const businessId = effectiveBusinessId ?? null; // ✅ changed
  const businessTimezone = useBusinessTimezone(businessId || undefined); // ✅ NEW (replaces manual fetch)

  const [query, setQuery] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<UiPaymentMethod>("Contanti");
  const [activeTab, setActiveTab] = useState<"toPay" | "confirmed">("toPay");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<UiAppointment[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);
  const [allBarbers, setAllBarbers] = useState<BarberRow[]>([]);

  // Service picker state
  const [servicePanelOpen, setServicePanelOpen] = useState(false);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");

  // Confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);

  // -------- Fetch all barbers for the dropdown --------
  useEffect(() => {
    const fetchAllBarbers = async () => {
      if (!businessId) {
        setAllBarbers([]);
        return;
      }

      const { data, error } = await supabase
        .from("barbers")
        .select("id, name")
        .eq("business_id", businessId)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching barbers:", error);
        setAllBarbers([]);
      } else {
        setAllBarbers((data as BarberRow[]) || []);
      }
    };

    fetchAllBarbers();
  }, [businessId]);

  // -------- Fetch appointments for the business local day (using appointment_date timestamptz) --------
  useEffect(() => {
    if (!businessId || !date || !businessTimezone) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const fromUTC = toUTCFromLocal({ date, time: "00:00", timezone: businessTimezone });
        const toUTC = toUTCFromLocal({ date, time: "23:59", timezone: businessTimezone });

        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_date,
            paid,
            appointment_status,
            duration_min,
            service:service_id ( id, name, price ),
            barber:barber_id ( id, name ),
            contact:contact_id ( id, first_name, last_name )
          `
          )
          .eq("business_id", businessId)
          .neq("appointment_status", "cancelled")
          .gte("appointment_date", fromUTC)
          .lte("appointment_date", toUTC)
          .order("appointment_date", { ascending: true });

        if (error) throw error;

        // Fetch transactions data for the same date range
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("appointment_id, barber_id")
          .eq("business_id", businessId)
          .gte("completed_at", fromUTC)
          .lte("completed_at", toUTC);

        if (transactionsError) {
          console.error("Error fetching transactions:", transactionsError);
        }

        // Create a lookup map for transaction barber_ids by appointment_id
        const transactionBarberMap = new Map<string, string>();
        if (transactionsData) {
          transactionsData.forEach((tx) => {
            if (tx.appointment_id && tx.barber_id) {
              transactionBarberMap.set(tx.appointment_id, tx.barber_id);
            }
          });
        }
        const mapped: UiAppointment[] =
          (data as AppointmentRow[] | null)?.map((a) => {
            const time = toLocalFromUTC({
              utcString: a.appointment_date,
              timezone: businessTimezone,
            }).toFormat("HH:mm");

            // For paid appointments, try to get barber from transaction data
            let barberName = a.barber?.name || "—";
            if (a.paid && transactionBarberMap.has(a.id)) {
              const transactionBarberId = transactionBarberMap.get(a.id);
              const transactionBarber = allBarbers.find(b => b.id === transactionBarberId);
              if (transactionBarber) {
                barberName = transactionBarber.name || "—";
              }
            }
            return {
              id: a.id,
              time,
              client: `${a.contact?.first_name || ''} ${a.contact?.last_name || ''}`.trim() || "—",
              barber: barberName,
              service: a.service?.name || "—",
              price: Number(a.service?.price ?? 0),
              appointment_status: a.appointment_status,
              paid: Boolean(a.paid),
              raw: a,
            };
          }) ?? [];

        if (!cancelled) {
          setAppointments(mapped);

          // Clear selection when appointments are refreshed
          setSelectedApptId(null);
          setItems([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, date, businessTimezone, allBarbers]);

  // Handle appointment selection
  const handleAppointmentSelect = (appointment: UiAppointment) => {
    setSelectedApptId(appointment.id);
  };

  // Prefill items when selecting another appointment
  useEffect(() => {
    if (!selectedApptId) return;
    const appt = appointments.find((a) => a.id === selectedApptId);
    if (!appt) return;
    setItems([
      {
        id: "li" + Math.random().toString(36).slice(2, 8),
        kind: "service",
        name: appt.service,
        barberId: appt.raw.barber?.id ?? null,
        qty: 1,
        unit: appt.price,
        discountType: "none",
        discountValue: 0,
        refServiceId: appt.raw.service?.id ?? null,
      },
    ]);
  }, [selectedApptId, appointments]);

  // -------- Fetch services for the picker panel --------
  useEffect(() => {
    if (!businessId || !servicePanelOpen) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,price")
        .eq("business_id", businessId)
        .order("name", { ascending: true });
      if (!error && !cancelled) setServices((data as ServiceRow[]) || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, servicePanelOpen]);

  // -------- UI actions for items --------
  function addServiceFromPicker(s: ServiceRow) {
    const appt = selectedApptId ? appointments.find((a) => a.id === selectedApptId) : undefined;
    const id = "li" + Math.random().toString(36).slice(2, 8);
    setItems((prev) => [
      ...prev,
      {
        id,
        kind: "service",
        name: s.name,
        barberId: appt?.raw.barber?.id ?? null,
        qty: 1,
        unit: Number(s.price ?? 0),
        discountType: "none",
        discountValue: 0,
        refServiceId: s.id,
      },
    ]);
  }

  function addProduct() {
    // Placeholder for future products; keeps UI parity.
    // Disabled for now - future integration
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    
    // 🐛 DEBUG: Log the item update
    console.log('🔧 updateItem called:', { id, patch });
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
      console.log('🔧 Updated items array:', updated);
      if (updated[0]) {
        console.log('🔧 First item barberId after update:', updated[0].barberId);
      }
      return updated;
    });
  }

  const total = useMemo(() => items.reduce((s, i) => s + computeLineTotal(i), 0), [items]);

  // -------- Left list filtering --------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter(
      (a) => !q || a.client.toLowerCase().includes(q) || a.service.toLowerCase().includes(q)
    );
  }, [appointments, query]);

  // NEW: buckets by PAID flag (and cancelled already excluded at fetch)
  const toPay = filtered.filter((a) => !a.paid);
  const confirmedList = filtered.filter((a) => a.paid);

  // -------- Save transaction + items --------
  async function completePayment() {
    // 🐛 DEBUG: Log the state at the start of completePayment
    console.log('💰 completePayment called');
    console.log('💰 Current items array:', items);
    console.log('💰 items[0]:', items[0]);
    console.log('💰 items[0].barberId:', items[0]?.barberId);
    console.log('💰 Selected appointment:', selectedApptId);
    const appt = appointments.find((a) => a.id === selectedApptId);
    console.log('💰 Appointment details:', appt);
    console.log('💰 Appointment barber_id:', appt?.raw.barber?.id);
    
    if (!businessId || !selectedApptId || items.length === 0) return;

    const dbMethod: DbPaymentMethod = UI_TO_DB_PAYMENT[paymentMethod];
    if (!appt) return;

    // 🐛 DEBUG: Log the barber_id that will be sent to the database
    const finalBarberId = items[0].barberId || appt.raw.barber?.id || null;
    console.log('💰 Final barber_id for transaction:', finalBarberId);
    console.log('💰 Logic breakdown:');
    console.log('  - items[0].barberId:', items[0].barberId);
    console.log('  - appt.raw.barber?.id:', appt.raw.barber?.id);
    console.log('  - final result:', finalBarberId);

    // Insert transaction
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        business_id: businessId,
        appointment_id: appt.id,
        barber_id: finalBarberId,
        payment_method: dbMethod,
        total: total,
        status: "succeeded",
        completed_at: new Date().toISOString(), // UTC
      })
      .select("id")
      .single();

    // 🐛 DEBUG: Log the transaction result
    console.log('💰 Transaction insert result:', { data: tx, error: txErr });

    if (txErr || !tx) {
      console.error(txErr);
      return;
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
      barber_id: i.barberId ?? appt.raw.barber?.id ?? null,
    }));

    const { error: itemsErr } = await supabase.from("transaction_items").insert(itemRows);
    if (itemsErr) {
      console.error(itemsErr);
      return;
    }

    // Mark appointment as paid (do NOT change appointment_status here)
    await supabase.from("appointments").update({ paid: true }).eq("id", appt.id);

    // Refresh the list for the same day (using appointment_date timestamptz)
    try {
      const fromUTC = toUTCFromLocal({ date, time: "00:00", timezone: businessTimezone });
      const toUTC = toUTCFromLocal({ date, time: "23:59", timezone: businessTimezone });

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_date,
          paid,
          appointment_status,
          duration_min,
          service:service_id ( id, name, price ),
          barber:barber_id ( id, name ),
          contact:contact_id ( id, full_name )
        `
        )
        .eq("business_id", businessId)
        .neq("appointment_status", "cancelled")
        .gte("appointment_date", fromUTC)
        .lte("appointment_date", toUTC)
        .order("appointment_date", { ascending: true });

      if (error) throw error;

      const mapped: UiAppointment[] =
        (data as AppointmentRow[] | null)?.map((a) => ({
          id: a.id,
          time: toLocalFromUTC({ utcString: a.appointment_date, timezone: businessTimezone }).toFormat("HH:mm"),
          client: a.contact?.full_name || "—",
          barber: a.barber?.name || "—",
          service: a.service?.name || "—",
          price: Number(a.service?.price ?? 0),
          appointment_status: a.appointment_status,
          paid: Boolean(a.paid),
          raw: a,
        })) ?? [];

      setAppointments(mapped);
      const nextUnpaid = mapped.find((x) => !x.paid) || null;
      setSelectedApptId(nextUnpaid?.id ?? null);
      setItems([]);
      setActiveTab("confirmed"); // show it in the right bucket after confirmation
    } catch (e) {
      console.error(e);
    }
  }

  // ---------- UI ----------
  const PAYMENT_METHODS_UI: UiPaymentMethod[] = ["Contanti", "POS", "Satispay", "Altro"];

  // Guard for missing business configuration
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Caricamento autenticazione…</p>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="h-full flex items_center justify-center">
        <div className="text-center">
          <p className="text-gray-600">
            Profilo non configurato oppure nessun <code>business_id</code> associato.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Contatta l'amministratore per associare il tuo account a un business.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Cassa</h1>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium gap-2">
            <Plus size={18} /> Nuova transazione
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Appointments */}
        <div className="col-span-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[700px] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-black mb-4">Clienti in salone</h2>
              <div className="relative mb-4">
                <input
                  placeholder="Cerca cliente o servizio"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text_black"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab("toPay")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === "toPay" ? "bg-white text-black shadow-sm" : "text-gray-600 hover:text-black"
                  )}
                >
                  Da pagare
                </button>
                <button
                  onClick={() => setActiveTab("confirmed")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === "confirmed" ? "bg_white text-black shadow-sm" : "text-gray-600 hover:text-black"
                  )}
                >
                  Confermati
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "toPay" && (
                <div className="space-y-3">
                  {toPay.length === 0 && (
                    <p className="text-sm text-gray-500">
                      {loading ? "Caricamento..." : "Nessun appuntamento da pagare."}
                    </p>
                  )}
                  {toPay.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleAppointmentSelect(a)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                        selectedApptId === a.id && "border-black bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-black">{a.client}</div>
                        <div className="text-xs text-gray-500">{a.time}</div>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <span>{a.service}</span>
                        <span>•</span>
                        <span>{a.barber}</span>
                        <span className="ml-auto font-semibold text-black">€ {a.price.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                          Non pagato
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "confirmed" && (
                <div className="space-y-3">
                  {confirmedList.length === 0 && (
                    <p className="text-sm text-gray-500">
                      {loading ? "Caricamento..." : "Nessun pagamento confermato."}
                    </p>
                  )}
                  {confirmedList.map((a) => (
                    <div key={a.id} className="rounded-xl border px-4 py-3">
                      <div className="flex items-center justify_between">
                        <div className="font-semibold text-black">{a.client}</div>
                        <div className="text-xs text-gray-500">{a.time}</div>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <span>{a.service}</span>
                        <span>•</span>
                        <span>{a.barber}</span>
                        <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Pagato
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Payment editor */}
        <div className="col-span-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Items card */}
            <div className="relative col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm h-[700px] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">
                    Trattamenti
                  </h2>
                  <button
                    onClick={() => setItems([])}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} /> Svuota
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {items.map((li) => (
                    <div key={li.id} className="relative rounded-xl border border-gray-200 p-4">
                      {/* Row 1: name — barber (equal space, barber wider) */}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={li.name}
                          onChange={(e) => updateItem(li.id, { name: e.target.value })}
                          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                        />
                        <select
                          value={li.barberId ?? ""}
                          onChange={(e) => updateItem(li.id, { barberId: e.target.value || null })}
                          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                        >
                          {allBarbers.map((barber) => (
                            <option key={barber.id} value={barber.id}>
                              {barber.name || "—"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Row 2: sconto type — amount (equal space) */}
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <select
                          value={li.discountType || "none"}
                          onChange={(e) => updateItem(li.id, { discountType: e.target.value as any })}
                          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                        >
                          <option value="none">Senza sconto</option>
                          <option value="fixed">Sconto €</option>
                          <option value="percent">Sconto %</option>
                        </select>
                        <input
                          type="number"
                          value={li.discountValue ?? 0}
                          onChange={(e) => updateItem(li.id, { discountValue: Number(e.target.value) })}
                          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline_none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                        />
                      </div>

                      {/* Trash bottom-right */}
                      <button
                        onClick={() => removeItem(li.id)}
                        className="absolute right-3 bottom-3 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Rimuovi riga"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Row 3: centered total */}
                      <div className="mt-6 flex items-center justify-center text-sm text-black">
                        Totale riga:&nbsp;<span className="font-semibold">€ {computeLineTotal(li).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Nessun elemento. Aggiungi un servizio o prodotto.
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom bar with exactly two buttons */}
              <div className="p-6 border-t border-gray-100 flex items-center">
                <button
                  onClick={() => setServicePanelOpen((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-black"
                >
                  <Plus size={16} /> Aggiungi servizio
                </button>
                <div className="ml-auto" />
                <button
                  onClick={addProduct}
                  disabled={true}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-black"
                  title="Funzionalità in arrivo"
                >
                  <Plus size={16} /> Aggiungi prodotto
                </button>
              </div>

              {/* Service picker panel */}
              {servicePanelOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom_[88px] w_[85%] max-w_[720px] bg-white border border-gray-200 rounded-2xl shadow-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="font-semibold">Seleziona un servizio</div>
                    <button
                      onClick={() => setServicePanelOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-50 text-gray-500"
                      aria-label="Chiudi"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-3 border-b">
                    <div className="relative">
                      <input
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Cerca servizio..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline_none focus:ring-2 focus:ring-black"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="max-h-[340px] overflow-y-auto">
                    {services
                      .filter((s) =>
                        serviceSearch.trim()
                          ? s.name.toLowerCase().includes(serviceSearch.trim().toLowerCase())
                          : true
                      )
                      .map((s) => (
                        <div key={s.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                          <div className="flex flex-col">
                            <span className="font-medium text-black">{s.name}</span>
                            <span className="text-sm text-gray-600">€ {Number(s.price ?? 0).toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => addServiceFromPicker(s)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-black"
                          >
                            + Aggiungi
                          </button>
                        </div>
                      ))}
                    {services.length === 0 && (
                      <div className="px-4 py-6 text-sm text-gray-500">Nessun servizio disponibile.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Summary / payment */}
            <div className="col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm h-[700px] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-black">Riepilogo pagamento</h2>
              </div>

              <div className="flex-1 p-6 space-y-6">
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
                  <label className="block text-sm font-semibold text_black">Metodo di pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as UiPaymentMethod)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline_none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                  >
                    {["Contanti", "POS", "Satispay", "Altro"].map((m) => (
                      <option key={m} value={m as UiPaymentMethod}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text_black">Note</label>
                  <input
                    placeholder="Nota facoltativa per la ricevuta"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline_none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!selectedApptId || items.length === 0}
                  className={cn(
                    "flex-1 bg-black text-white py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2",
                    !selectedApptId || items.length === 0 ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-800"
                  )}
                >
                  <Check size={16} /> Concludi e stampa
                </button>
                <button className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-black font-medium">
                  Preventivo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-[95%] max-w-md">
            <div className="p-5 border-b">
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold text-black">Conferma pagamento</div>
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle size={20} className="text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-5 text-gray-700">Sei sicuro di voler confermare il pagamento?</div>
            <div className="p-5 flex justify-end gap-2 border-t">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-black"
              >
                Annulla
              </button>
              <button
                onClick={async () => {
                  setConfirmOpen(false);
                  await completePayment();
                }}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 