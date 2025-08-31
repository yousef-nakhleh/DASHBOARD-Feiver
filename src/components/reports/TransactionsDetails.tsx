// src/components/reports/TransactionsDetails.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../components/auth/AuthContext";

type TxnRow = {
  id: string;
  total: number;
  payment_method: string | null;
  status: string | null;
  completed_at: string | null;
  barbers: { name: string | null } | null;
  services: { name: string | null } | null;
  appointment_id: string | null;
  // enriched
  appointment?: {
    duration_min: number | null;
    contact?: { first_name: string | null; last_name: string | null } | null;
  } | null;
};

type Props = {
  /** How many rows to show. Omit or set large number to show all. */
  limit?: number;
  /** Called when “Mostra tutto” is pressed (Reports can navigate to a full page). */
  onShowAll?: () => void;
  /** Optional title override */
  title?: string;
};

const timeZone = "Europe/Rome";

/** Format as DD-MM-YY HH:mm (business local time) */
function formatDateDT(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  // convert to local parts for the given TZ
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => fmt.find(p => p.type === t)?.value || "";
  // en-CA gives YYYY-MM-DD, but we want DD-MM-YY
  const yy = get("year");
  const mm = get("month");
  const dd = get("day");
  const hh = get("hour");
  const mi = get("minute");
  return `${dd}-${mm}-${yy} ${hh}:${mi}`;
}

export default function TransactionsDetails({
  limit = 5,
  onShowAll,
  title = "Dettaglio Transazioni",
}: Props) {
  const { profile } = useAuth();
  const businessId = profile?.business_id ?? null;

  const [rows, setRows] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Today window (00:00–24:00 Europe/Rome) for KPI-style “recent” default;
  // we still show the latest N overall if the day is empty.
  const { startISO, endISO } = useMemo(() => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value || "0");
    const y = get("year");
    const m = get("month");
    const d = get("day");
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!businessId) return;
      setLoading(true);
      setError(null);

      try {
        // 1) Fetch transactions first (source of truth) + direct FKs
        const txSelect =
          `id,appointment_id,total,payment_method,status,completed_at,` +
          `barbers(name),services(name)`;

        const { data: todayTx, error: todayErr } = await supabase
          .from("transactions")
          .select(txSelect)
          .eq("business_id", businessId)
          .eq("status", "succeeded")
          .gte("completed_at", startISO)
          .lt("completed_at", endISO)
          .order("completed_at", { ascending: false });

        if (todayErr) throw todayErr;

        let txns: TxnRow[] = (todayTx || []) as any;

        // If empty today, fallback to latest “limit” overall so preview isn’t blank
        if (txns.length === 0) {
          const { data: lastN, error: lastErr } = await supabase
            .from("transactions")
            .select(txSelect)
            .eq("business_id", businessId)
            .eq("status", "succeeded")
            .order("completed_at", { ascending: false })
            .limit(limit);
          if (lastErr) throw lastErr;
          txns = (lastN || []) as any;
        }

        // 2) Enrich with appointment contact + duration (only for rows with appointment_id)
        const apptIds = Array.from(new Set(txns.map(t => t.appointment_id).filter(Boolean))) as string[];
        let apptMap = new Map<string, { duration_min: number | null; contact?: { first_name: string | null; last_name: string | null } | null }>();

        if (apptIds.length > 0) {
          const { data: appts, error: apptErr } = await supabase
            .from("appointments")
            .select("id,duration_min,contacts(first_name,last_name)")
            .in("id", apptIds);

          if (apptErr) throw apptErr;

          (appts || []).forEach((a: any) => {
            apptMap.set(a.id, {
              duration_min: a.duration_min ?? null,
              contact: a.contacts
                ? {
                    first_name: a.contacts.first_name ?? null,
                    last_name: a.contacts.last_name ?? null,
                  }
                : null,
            });
          });
        }

        const merged = txns.map(t => ({
          ...t,
          appointment: t.appointment_id ? apptMap.get(t.appointment_id) ?? null : null,
        }));

        if (!cancelled) {
          setRows(merged);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Errore nel caricamento");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [businessId, startISO, endISO, limit]);

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

  const visible = rows.slice(0, limit);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-black">{title}</h2>
        <div className="flex items-center gap-2">
          {onShowAll && (
            <button
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              onClick={onShowAll}
            >
              Mostra tutto
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {loading && !error && <p className="text-gray-600">Caricamento…</p>}

      {!loading && !error && (
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-sm">
              <th className="py-2 text-left">Data/Ora</th>
              <th className="py-2 text-left">Cliente</th>
              <th className="py-2 text-left">Servizio</th>
              <th className="py-2 text-left">Durata</th>
              <th className="py-2 text-left">Barbiere</th>
              <th className="py-2 text-left">Metodo</th>
              <th className="py-2 text-left">Totale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-black">
            {visible.length > 0 ? (
              visible.map((t) => {
                const contact = t.appointment?.contact;
                const fullName = contact
                  ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || "—"
                  : "—";
                const durata = t.appointment?.duration_min;
                return (
                  <tr key={t.id}>
                    <td className="py-2">{formatDateDT(t.completed_at)}</td>
                    <td className="py-2">{fullName}</td>
                    <td className="py-2">{t.services?.name ?? "—"}</td>
                    <td className="py-2">{durata != null ? `${durata}′` : "—"}</td>
                    <td className="py-2">{t.barbers?.name ?? "—"}</td>
                    <td className="py-2">{t.payment_method ?? "—"}</td>
                    <td className="py-2">{formatEUR(Number(t.total || 0))}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  Nessuna transazione.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}