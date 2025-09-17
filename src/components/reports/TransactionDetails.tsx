// src/components/reports/TransactionDetails.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Item = {
  id: string;
  item_type: string;
  item_name_snapshot: string;
  quantity: number;
  unit_price: number;
  discount_type: "none" | "percent" | "amount";
  discount_value: number;
  tax_rate: number | null;
  tax_amount: number;
  line_total: number;
};

type Txn = {
  id: string;
  created_at: string;
  completed_at: string | null;
  currency: string;
  total: number;
  payment_method: string | null;
  status: string;
  barbers: { name: string | null } | null;
  appointments: {
    contacts: { first_name: string | null; last_name: string | null } | null;
  } | null;
};

type Props = {
  open: boolean;
  transactionId: string | null;
  onClose: () => void;
};

const TZ = "Europe/Rome";

const formatEUR = (n: number, currency = "EUR") =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(n);

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: TZ,
  })} ${d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  })}`;
};

export default function TransactionDetailsModal({ open, transactionId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [txn, setTxn] = useState<Txn | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  const headerDate = useMemo(() => {
    if (!txn) return "—";
    return formatDateTime(txn.completed_at || txn.created_at);
  }, [txn]);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!open || !transactionId) return;
      setLoading(true);
      setError(null);

      try {
        // 1) Transaction header (joins barber + customer name via appointment)
        const { data: t, error: te } = await supabase
          .from("transactions")
          .select(
            `id, created_at, completed_at, currency, total, payment_method, status,
             barbers(name),
             appointments(contacts(first_name,last_name))`
          )
          .eq("id", transactionId)
          .single();

        if (te) throw te;

        // 2) Items
        const { data: it, error: ie } = await supabase
          .from("transaction_items")
          .select(
            `id, item_type, item_name_snapshot, quantity, unit_price, discount_type, discount_value, tax_rate, tax_amount, line_total`
          )
          .eq("transaction_id", transactionId)
          .order("created_at", { ascending: true });

        if (ie) throw ie;

        if (!cancel) {
          setTxn(t as unknown as Txn);
          setItems((it || []) as Item[]);
        }
      } catch (e: any) {
        if (!cancel) setError(e.message || "Errore nel caricamento");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [open, transactionId]);

  if (!open) return null;

  const customerName = txn?.appointments?.contacts
    ? `${txn.appointments.contacts.first_name || ""} ${txn.appointments.contacts.last_name || ""}`.trim() || "—"
    : "—";
  const barberName = txn?.barbers?.name || "—";
  const currency = txn?.currency?.trim() || "EUR";

  return (
    <div className="fixed inset-0 z-[100]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* dialog */}
      <div className="absolute inset-x-0 top-10 mx-auto w-[95%] max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-black">Dettagli Transazione</h2>
              <p className="text-sm text-gray-500 mt-1">{headerDate}</p>
            </div>
            <button
              onClick={onClose}
              className="text-sm text-gray-600 hover:text-black border border-gray-200 rounded-lg px-3 py-1.5"
            >
              Chiudi
            </button>
          </div>

          {/* body */}
          <div className="px-6 py-6 space-y-6">
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            {loading && (
              <div className="text-gray-600 text-sm">Caricamento…</div>
            )}
            {!loading && !error && txn && (
              <>
                {/* transaction summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-600 text-sm">Cliente</p>
                    <p className="text-black font-medium">{customerName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-600 text-sm">Barbiere</p>
                    <p className="text-black font-medium">{barberName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-600 text-sm">Metodo di Pagamento</p>
                    <p className="text-black font-medium">{txn.payment_method || "—"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-600 text-sm">Stato</p>
                    <p className="text-black font-medium">{txn.status}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 md:col-span-2">
                    <p className="text-gray-600 text-sm">Totale</p>
                    <p className="text-2xl font-bold text-black">
                      {formatEUR(Number(txn.total || 0), currency)}
                    </p>
                  </div>
                </div>

                {/* items table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-black">Articoli</h3>
                    <p className="text-sm text-gray-500">
                      {items.length} riga{items.length !== 1 ? "he" : ""} • Somma righe:&nbsp;
                      <span className="font-medium text-black">
                        {formatEUR(items.reduce((s, i) => s + Number(i.line_total || 0), 0), currency)}
                      </span>
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 text-sm">
                          <th className="py-2 text-left">Tipo</th>
                          <th className="py-2 text-left">Nome</th>
                          <th className="py-2 text-left">Q.tà</th>
                          <th className="py-2 text-left">Prezzo</th>
                          <th className="py-2 text-left">Sconto</th>
                          <th className="py-2 text-left">IVA</th>
                          <th className="py-2 text-left">Totale riga</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((it) => {
                          const discountLabel =
                            it.discount_type === "percent"
                              ? `${it.discount_value}%`
                              : it.discount_type === "amount"
                              ? formatEUR(Number(it.discount_value || 0), currency)
                              : "—";
                          const iva =
                            it.tax_rate != null
                              ? `${Number(it.tax_rate).toFixed(2)}%`
                              : "—";
                          return (
                            <tr key={it.id}>
                              <td className="py-2">{it.item_type}</td>
                              <td className="py-2">{it.item_name_snapshot}</td>
                              <td className="py-2">{it.quantity}</td>
                              <td className="py-2">{formatEUR(Number(it.unit_price || 0), currency)}</td>
                              <td className="py-2">{discountLabel}</td>
                              <td className="py-2">{iva}</td>
                              <td className="py-2">{formatEUR(Number(it.line_total || 0), currency)}</td>
                            </tr>
                          );
                        })}
                        {items.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-gray-500">
                              Nessun articolo registrato per questa transazione.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}