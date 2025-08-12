import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { Plus, Search, Check, Trash2, Minus } from "lucide-react";

// --- Types (UI-only) ---
type Appointment = {
  id: string;
  time: string; // "12:30"
  client: string;
  barber: string;
  service: string;
  price: number;
  confirmed: boolean; // UI meaning: confirmed in calendar
  paid: boolean; // UI meaning: already paid
};

type LineItem = {
  id: string;
  kind: "service" | "product";
  name: string;
  barber?: string; // attribution
  qty: number;
  unit: number;
  discountType?: "none" | "fixed" | "percent";
  discountValue?: number; // matches type
};

// --- Demo data ---
const DEMO_APPTS: Appointment[] = [
  { id: "a1", time: "12:28", client: "Alket", barber: "Alket", service: "Taglio Uomo", price: 20, confirmed: true, paid: false },
  { id: "a2", time: "12:33", client: "Gabriel", barber: "Gino", service: "Taglio + Barba", price: 30, confirmed: false, paid: false },
  { id: "a3", time: "11:10", client: "Marco", barber: "Alket", service: "Colore", price: 40, confirmed: true, paid: true }, // appears in Confirmed section
];

const PAYMENT_METHODS = ["Contanti", "Carta", "Satispay", "Altro"];

// Utility to compute totals
function computeLineTotal(li: LineItem): number {
  const base = li.qty * li.unit;
  const type = li.discountType || "none";
  const val = li.discountValue || 0;
  if (type === "fixed") return Math.max(base - val, 0);
  if (type === "percent") return Math.max(base - (base * val) / 100, 0);
  return base;
}

// Quick helper for classic currency alignment
const money = (n: number) => `€ ${n.toFixed(2)}`;

export default function CashRegister() {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedApptId, setSelectedApptId] = useState<string | null>("a1");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [cashReceived, setCashReceived] = useState<number | "">(""); // visible only when Contanti
  const [orderDiscountType, setOrderDiscountType] = useState<"none" | "fixed" | "percent">("none");
  const [orderDiscountValue, setOrderDiscountValue] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"toPay" | "confirmed">("toPay");
  const [notes, setNotes] = useState("");

  // Keyboard shortcuts (Cmd/Ctrl+K to quick add, Enter to add service when not typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || (target as HTMLInputElement).isContentEditable);

      // Cmd/Ctrl + K → open quick add (for now just adds a service quickly)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        addService();
        return;
      }
      // Enter (not typing) → add another service fast
      if (!isTyping && e.key === "Enter") {
        e.preventDefault();
        addService();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Build a working "cart" from selected appointment
  const selectedAppt: Appointment | undefined = useMemo(
    () => DEMO_APPTS.find((a) => a.id === selectedApptId || (selectedApptId === null && a.id === "")),
    [selectedApptId]
  );

  const [items, setItems] = useState<LineItem[]>([
    { id: "li1", kind: "service", name: "Taglio Uomo", barber: "Alket", qty: 1, unit: 20, discountType: "none", discountValue: 0 },
  ]);

  function addService() {
    const id = "li" + Math.random().toString(36).slice(2, 8);
    setItems((prev) => [
      ...prev,
      { id, kind: "service", name: "Nuovo Servizio", barber: selectedAppt?.barber, qty: 1, unit: 10, discountType: "none", discountValue: 0 },
    ]);
  }

  function addProduct() {
    const id = "li" + Math.random().toString(36).slice(2, 8);
    setItems((prev) => [
      ...prev,
      { id, kind: "product", name: "Shampoo", qty: 1, unit: 8, discountType: "none", discountValue: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function stepQty(id: string, delta: number) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, (i.qty || 1) + delta) } : i))
    );
  }

  const subtotal = useMemo(() => items.reduce((s, i) => s + computeLineTotal(i), 0), [items]);
  const orderLevelDiscount = useMemo(() => {
    if (orderDiscountType === "fixed") return Math.min(orderDiscountValue, subtotal);
    if (orderDiscountType === "percent") return Math.min((subtotal * orderDiscountValue) / 100, subtotal);
    return 0;
  }, [orderDiscountType, orderDiscountValue, subtotal]);

  const total = Math.max(subtotal - orderLevelDiscount, 0);

  // Cash: change due
  const changeDue =
    paymentMethod === "Contanti" && cashReceived !== "" ? Math.max(Number(cashReceived) - total, 0) : 0;

  // Filters for left list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_APPTS.filter((a) => !q || a.client.toLowerCase().includes(q) || a.service.toLowerCase().includes(q));
  }, [query]);

  const toPay = filtered.filter((a) => !a.paid);
  const alreadyConfirmedToday = filtered.filter((a) => a.paid);

  return (
    <div className="h-full space-y-6">
      {/* Hide native number spinners (local to this component) */}
      <style>{`
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Cassa</h1>
          <p className="text-gray-600">Gestisci transazioni e pagamenti</p>
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
                  {toPay.length === 0 && <p className="text-sm text-gray-500">Nessun appuntamento da pagare.</p>}
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
                        <span className="ml-auto font-semibold text-black font-mono tabular-nums">{money(a.price)}</span>
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
                  {alreadyConfirmedToday.length === 0 && (
                    <p className="text-sm text-gray-500">Nessun pagamento registrato oggi.</p>
                  )}
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
              {/* Header */}
              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">
                    Trattamenti {selectedAppt ? <span className="text-gray-500 font-normal">• {selectedAppt.client}</span> : null}
                  </h2>
                  <button
                    onClick={() => setItems([])}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} /> Svuota
                  </button>
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {items.map((li) => (
                    <div key={li.id} className="rounded-xl border border-gray-200 p-4">
                      {/* Primary row */}
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={cn(
                            "px-2 py-1 text-xs rounded-full font-medium",
                            li.kind === "service" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                          )}
                        >
                          {li.kind === "service" ? "Servizio" : "Prodotto"}
                        </span>

                        {/* Name */}
                        <input
                          value={li.name}
                          onChange={(e) => updateItem(li.id, { name: e.target.value })}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                        />

                        {/* Barber select */}
                        <select
                          value={li.barber || ""}
                          onChange={(e) => updateItem(li.id, { barber: e.target.value })}
                          className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                        >
                          <option value="">—</option>
                          <option value="Alket">Alket</option>
                          <option value="Gino">Gino</option>
                        </select>

                        {/* Qty with steppers */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => stepQty(li.id, -1)}
                            className="px-2 py-2 hover:bg-gray-50"
                            aria-label="Diminuisci quantità"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={li.qty}
                            onChange={(e) => updateItem(li.id, { qty: Math.max(1, Number(e.target.value)) })}
                            className="w-14 text-center px-2 py-2 focus:outline-none"
                          />
                          <button
                            onClick={() => stepQty(li.id, +1)}
                            className="px-2 py-2 hover:bg-gray-50"
                            aria-label="Aumenta quantità"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Unit price */}
                        <input
                          type="number"
                          value={li.unit}
                          onChange={(e) => updateItem(li.id, { unit: Number(e.target.value) })}
                          className="w-24 text-right border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black font-mono tabular-nums"
                        />
                      </div>

                      {/* Secondary row */}
                      <div className="flex items-center gap-3">
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
                          value={li.discountValue || 0}
                          onChange={(e) => updateItem(li.id, { discountValue: Number(e.target.value) })}
                          className="w-24 border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                        />

                        <div className="ml-auto text-sm text-black font-mono tabular-nums">
                          Totale riga: <span className="font-semibold">{money(computeLineTotal(li))}</span>
                        </div>
                        <button
                          onClick={() => removeItem(li.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Rimuovi riga"
                        >
                          <Trash2 size={16} />
                        </button>
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

              {/* Sticky Add Bar */}
              <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={addService}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-black"
                  >
                    <Plus size={16} /> Aggiungi servizio
                  </button>
                  <button
                    onClick={addProduct}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-black"
                  >
                    <Plus size={16} /> Aggiungi prodotto
                  </button>

                  {/* Più usati (placeholders) */}
                  <div className="ml-auto flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-full text-xs bg-gray-100 hover:bg-gray-200">
                      Taglio
                    </button>
                    <button className="px-3 py-1.5 rounded-full text-xs bg-gray-100 hover:bg-gray-200">
                      Barba
                    </button>
                    <button className="px-3 py-1.5 rounded-full text-xs bg-gray-100 hover:bg-gray-200">
                      Shampoo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary / payment */}
            <div className="col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm h-[700px] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-black">Riepilogo pagamento</h2>
              </div>

              <div className="flex-1 p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-gray-600">Totale parziale</div>
                  <div className="text-right font-semibold text-black font-mono tabular-nums">{money(subtotal)}</div>

                  <div className="text-gray-600">Sconto sul totale</div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <select
                        value={orderDiscountType}
                        onChange={(e) => setOrderDiscountType(e.target.value as any)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                      >
                        <option value="none">Nessuno</option>
                        <option value="fixed">€</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="number"
                        value={orderDiscountValue}
                        onChange={(e) => setOrderDiscountValue(Number(e.target.value))}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                      />
                    </div>
                  </div>

                  <div className="text-gray-600">Netto a pagare</div>
                  <div className="text-right text-xl font-bold text-black font-mono tabular-nums">{money(total)}</div>
                </div>

                <div className="border-t border-gray-200 pt-6" />

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-black">Metodo di pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setCashReceived(""); // reset cash field if switching methods
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  {/* Cash-only extras */}
                  {paymentMethod === "Contanti" && (
                    <div className="grid grid-cols-2 gap-4 items-end">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Importo ricevuto</label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Resto</div>
                        <div className="text-xl font-bold font-mono tabular-nums">{money(changeDue)}</div>
                      </div>
                    </div>
                  )}
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

              {/* Sticky footer actions */}
              <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
                <button
                  disabled={items.length === 0 || total <= 0}
                  className={cn(
                    "flex-1 py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2",
                    items.length === 0 || total <= 0
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
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
    </div>
  );
}