import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { Plus, Search, Check, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../components/auth/AuthContext";

// ---------- Types ----------
type DbPaymentMethod = "Cash" | "POS" | "Satispay" | "Other";

type UiPaymentMethod = "Contanti" | "POS" | "Satispay" | "Altro";
const UI_TO_DB_PAYMENT: Record<UiPaymentMethod, DbPaymentMethod> = {
  Contanti: "Cash",
  POS: "POS",
  Satispay: "Satispay",
  Altro: "Other",
};
const DB_TO_UI_PAYMENT: Record<DbPaymentMethod, UiPaymentMethod> = {
  Cash: "Contanti",
  POS: "POS",
  Satispay: "Satispay",
  Other: "Altro",
};

type AppointmentRow = {
  id: string;
  appointment_start: string; // UTC ISO
  paid: boolean | null;
  appointment_status: "pending" | "confirmed" | "cancelled" | null;
  // Joined fields (via FKs)
  service?: { id: string; name: string; price: number | null } | null;
  barber?: { id: string; display_name: string | null } | null;
  contact?: { id: string; full_name: string | null } | null;
};

type UiAppointment = {
  id: string;
  time: string; // "HH:MM" in business local time
  client: string;
  barber: string;
  service: string;
  price: number;
  confirmed: boolean;
  paid: boolean;
  raw: AppointmentRow;
};

type LineItem = {
  id: string;
  kind: "service" | "product"; // product reserved for future
  name: string;
  barberId?: string | null;
  qty: number;
  unit: number;
  discountType?: "none" | "fixed" | "percent";
  discountValue?: number;
  refServiceId?: string | null;
};

// ---------- Helpers ----------
function computeLineTotal(li: LineItem): number {
  const base = (li.qty ?? 1) * (li.unit ?? 0);
  const type = li.discountType || "none";
  const val = li.discountValue || 0;
  if (type === "fixed") return Math.max(base - val, 0);
  if (type === "percent") return Math.max(base - (base * val) / 100, 0);
  return base;
}

function startOfLocalDayUTC(dateISO: string, timeZone: string): { fromUTC: string; toUTC: string } {
  // dateISO is yyyy-mm-dd (selected in the UI). Interpret it in business tz,
  // then convert the day's [00:00, 23:59:59.999] to UTC ISO strings for the DB filter.
  const [y, m, d] = dateISO.split("-").map(Number);
  // Use the Intl API to get the UTC instants for local bounds
  const localStart = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0));
  const localEnd = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999));

  // Offset localStart/localEnd from the target timeZone back to UTC by formatting “as if” in tz
  // Trick: build the actual UTC instants by asking the formatter for the parts in that TZ,
  // then reconstruct a timestamp and let JS interpret as UTC.
  const toUTCInstant = (dt: Date) => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(dt).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
    // parts are the local wall clock in business tz at the given instant.
    // Construct a UTC Date from those local parts:
    const isoLocal = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.000Z`;
    return new Date(isoLocal).toISOString();
  };

  // We want the UTC instants that correspond to the local day's bounds
  const fromUTC = toUTCInstant(localStart);
  const toUTC = toUTCInstant(localEnd);
  return { fromUTC, toUTC };
}

function toLocalTimeHHMM(utcISO: string, timeZone: string) {
  const dt = new Date(utcISO);
  return new Intl.DateTimeFormat("it-IT", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);
}

// ---------- Component ----------
export default function CashRegister() {
  const { business } = useAuth(); // must expose { business: { id, timezone }, user, ... }
  const businessId = business?.id as string | undefined;
  const businessTz = business?.timezone || "Europe/Rome";

  const [query, setQuery] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<UiPaymentMethod>("Contanti");
  const [activeTab, setActiveTab] = useState<"toPay" | "confirmed">("toPay");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<UiAppointment[]>([]);
  const [items, setItems] = useState<LineItem[]>([]);

  // -------- Fetch appointments for the business local day --------
  useEffect(() => {
    if (!businessId || !date) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { fromUTC, toUTC } = startOfLocalDayUTC(date, businessTz);

        // Pull appointments and join names/prices via FKs
        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            appointment_start,
            paid,
            appointment_status,
            service:service_id ( id, name, price ),
            barber:barber_id ( id, display_name ),
            contact:contact_id ( id, full_name )
          `
          )
          .eq("business_id", businessId)
          .gte("appointment_start", fromUTC)
          .lte("appointment_start", toUTC)
          .order("appointment_start", { ascending: true });

        if (error) throw error;

        const mapped: UiAppointment[] =
          (data as AppointmentRow[] | null)?.map((a) => {
            const time = toLocalTimeHHMM(a.appointment_start, businessTz);
            return {
              id: a.id,
              time,
              client: a.contact?.full_name || "—",
              barber: a.barber?.display_name || "—",
              service: a.service?.name || "—",
              price: Number(a.service?.price ?? 0),
              confirmed: a.appointment_status === "confirmed",
              paid: Boolean(a.paid),
              raw: a,
            };
          }) ?? [];

        if (!cancelled) {
          setAppointments(mapped);
          // Auto-select first unpaid appointment; prefill items
          const firstUnpaid = mapped.find((x) => !x.paid) || mapped[0] || null;
          setSelectedApptId(firstUnpaid?.id ?? null);
          if (firstUnpaid) {
            setItems([
              {
                id: "li" + Math.random().toString(36).slice(2, 8),
                kind: "service",
                name: firstUnpaid.service,
                barberId: firstUnpaid.raw.barber?.id ?? null,
                qty: 1,
                unit: firstUnpaid.price,
                discountType: "none",
                discountValue: 0,
                refServiceId: firstUnpaid.raw.service?.id ?? null,
              },
            ]);
          } else {
            setItems([]);
          }
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
  }, [businessId, date, businessTz]);

  // When user selects another appointment, prefill “Trattamenti” with its booked service
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
  }, [selectedApptId]); // eslint-disable-line react-hooks/exhaustive-deps

  // -------- UI actions for items --------
  function addService() {
    // Adds a blank service row; in future, hook to a selection modal
    const appt = selectedApptId ? appointments.find((a) => a.id === selectedApptId) : undefined;
    const id = "li" + Math.random().toString(36).slice(2, 8);
    setItems((prev) => [
      ...prev,
      {
        id,
        kind: "service",
        name: "Nuovo Servizio",
        barberId: appt?.raw.barber?.id ?? null,
        qty: 1,
        unit: 0,
        discountType: "none",
        discountValue: 0,
        refServiceId: null,
      },
    ]);
  }

  function addProduct() {
    // Reserved for future; for now we keep UI behavior but save only services.
    const id = "li" + Math.random().toString(36).slice(2, 8);
    setItems((prev) => [
      ...prev,
      {
        id,
        kind: "product",
        name: "Prodotto",
        barberId: null,
        qty: 1,
        unit: 0,
        discountType: "none",
        discountValue: 0,
        refServiceId: null,
      },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  const total = useMemo(() => items.reduce((s, i) => s + computeLineTotal(i), 0), [items]);

  // -------- Left list filtering --------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter(
      (a) => !q || a.client.toLowerCase().includes(q) || a.service.toLowerCase().includes(q)
    );
  }, [appointments, query]);

  const toPay = filtered.filter((a) => !a.paid);
  const alreadyConfirmedToday = filtered.filter((a) => a.paid);

  // -------- Save transaction + items --------
  async function onCompleteAndPrint() {
    if (!businessId) return;
    if (!selectedApptId) return;
    if (items.length === 0) return;

    const dbMethod: DbPaymentMethod = UI_TO_DB_PAYMENT[paymentMethod];
    const appt = appointments.find((a) => a.id === selectedApptId);
    if (!appt) return;

    // 1) Insert transaction (timestamptz stored as UTC by Supabase/PG)
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        business_id: businessId,
        appointment_id: appt.id,
        payment_method: dbMethod, // enum: 'Cash' | 'POS' | 'Satispay' | 'Other'
        total: total,
        status: "succeeded",
        completed_at: new Date().toISOString(), // UTC
      })
      .select("id")
      .single();

    if (txErr || !tx) {
      console.error(txErr);
      return;
    }

    // 2) Insert transaction_items (service-only for now)
    const itemRows = items.map((i) => {
      const base = (i.qty ?? 1) * (i.unit ?? 0);
      const line_total = computeLineTotal(i);
      const discount_type =
        (i.discountType as "none" | "fixed" | "percent" | undefined) ?? "none";
      const discount_value = Number(i.discountValue ?? 0);

      return {
        transaction_id: tx.id,
        item_type: i.kind === "product" ? "product" : "service", // enum item_type_enum
        item_ref_id: i.refServiceId ?? null,
        item_name_snapshot: i.name,
        quantity: i.qty,
        unit_price: i.unit,
        discount_type, // enum discount_type_enum
        discount_value,
        tax_rate: 0,
        tax_amount: 0,
        line_total,
        barber_id: i.barberId ?? appt.raw.barber?.id ?? null,
      };
    });

    const { error: itemsErr } = await supabase.from("transaction_items").insert(itemRows);
    if (itemsErr) {
      console.error(itemsErr);
      return;
    }

    // 3) Mark appointment as paid (and confirmed for clarity)
    await supabase
      .from("appointments")
      .update({ paid: true, appointment_status: "confirmed" })
      .eq("id", appt.id);

    // 4) Refresh list to move it to "Confermati oggi"
    // Trigger the fetch by re-setting date (or call same fetch logic)
    setDate((d) => d); // noop to keep value; fetch effect depends on [businessId, date, tz], so do manual refresh:
    // Manual refresh:
    try {
      const { fromUTC, toUTC } = startOfLocalDayUTC(date, businessTz);
      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          appointment_start,
          paid,
          appointment_status,
          service:service_id ( id, name, price ),
          barber:barber_id ( id, display_name ),
          contact:contact_id ( id, full_name )
        `
        )
        .eq("business_id", businessId)
        .gte("appointment_start", fromUTC)
        .lte("appointment_start", toUTC)
        .order("appointment_start", { ascending: true });

      if (error) throw error;

      const mapped: UiAppointment[] =
        (data as AppointmentRow[] | null)?.map((a) => ({
          id: a.id,
          time: toLocalTimeHHMM(a.appointment_start, businessTz),
          client: a.contact?.full_name || "—",
          barber: a.barber?.display_name || "—",
          service: a.service?.name || "—",
          price: Number(a.service?.price ?? 0),
          confirmed: a.appointment_status === "confirmed",
          paid: Boolean(a.paid),
          raw: a,
        })) ?? [];

      setAppointments(mapped);
      setSelectedApptId(null);
      setItems([]);
    } catch (e) {
      console.error(e);
    }
  }

  // ---------- UI (unchanged visually) ----------
  const PAYMENT_METHODS_UI: UiPaymentMethod[] = ["Contanti", "POS", "Satispay", "Altro"];

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
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
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
                    activeTab === "confirmed" ? "bg-white text-black shadow-sm" : "text-gray-600 hover:text-black"
                  )}
                >
                  Confermati oggi
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "toPay" && (
                <div className="space-y-3">
                  {toPay.length === 0 && <p className="text-sm text-gray-500">{loading ? "Caricamento..." : "Nessun appuntamento da pagare."}</p>}
                  {toPay.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedApptId(a.id)}
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
                        {a.confirmed ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Confermato</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Non confermato</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "confirmed" && (
                <div className="space-y-3">
                  {alreadyConfirmedToday.length === 0 && <p className="text-sm text-gray-500">{loading ? "Caricamento..." : "Nessun pagamento registrato oggi."}</p>}
                  {alreadyConfirmedToday.map((a) => (
                    <div key={a.id} className="rounded-xl border px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-black">{a.client}</div>
                        <div className="text-xs text-gray-500">{a.time}</div>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <span>{a.service}</span>
                        <span>•</span>
                        <span>{a.barber}</span>
                        <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Pagato</span>
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
            <div className="col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm h-[700px] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">
                    Trattamenti
                    {selectedApptId ? (
                      <span className="text-gray-500 font-normal">
                        {" "}
                        • {appointments.find((a) => a.id === selectedApptId)?.client || ""}
                      </span>
                    ) : null}
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
                    <div key={li.id} className="rounded-xl border border-gray-200 p-4">
                      {/* Row 1: name — barber (equal space) */}
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          value={li.name}
                          onChange={(e) => updateItem(li.id, { name: e.target.value })}
                          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                        />
                        <div className="flex gap-3">
                          <select
                            value={li.barberId ?? ""}
                            onChange={(e) => updateItem(li.id, { barberId: e.target.value || null })}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                          >
                            {/* NOTE: for now we only list the appointment's barber to keep it simple */}
                            <option value={appointments.find((a) => a.id === selectedApptId)?.raw.barber?.id ?? ""}>
                              {appointments.find((a) => a.id === selectedApptId)?.barber ?? "—"}
                            </option>
                          </select>
                          <button
                            onClick={() => removeItem(li.id)}
                            className="px-3 py-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            aria-label="Rimuovi riga"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: sconto type — amount (equal space) */}
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
                        />
                      </div>

                      {/* Row 3: centered total */}
                      <div className="mt-3 flex items-center justify-center text-sm text-black">
                        Totale riga:&nbsp;<span className="font-semibold">€ {computeLineTotal(li).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">Nessun elemento. Aggiungi un servizio o prodotto.</p>
                  )}
                </div>
              </div>

              {/* Bottom bar with exactly two buttons */}
              <div className="p-6 border-t border-gray-100 flex items-center">
                <button
                  onClick={addService}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-black"
                >
                  <Plus size={16} /> Aggiungi servizio
                </button>
                <div className="ml-auto" />
                <button
                  onClick={addProduct}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-black"
                >
                  <Plus size={16} /> Aggiungi prodotto
                </button>
              </div>
            </div>

            {/* Summary / payment */}
            <div className="col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm h-[700px] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-black">Riepilogo pagamento</h2>
              </div>

              <div className="flex-1 p-6 space-y-6">
                {/* List of trattamenti with price */}
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

                {/* Totale only */}
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
                    {["Contanti", "POS", "Satispay", "Altro"].map((m) => (
                      <option key={m} value={m as UiPaymentMethod}>
                        {m}
                      </option>
                    ))}
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
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={onCompleteAndPrint}
                  className="flex-1 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
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
    </div>
  );
}