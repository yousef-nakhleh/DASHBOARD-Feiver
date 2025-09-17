import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../lib/supabase";
import { useSelectedBusiness } from "../auth/SelectedBusinessProvider";

type TxnRow = {
  id: string;
  created_at: string | null;
  total: number;
  payment_method: string | null;
  barbers: { name: string | null } | null;
  appointments: {
    contacts: { first_name: string | null; last_name: string | null } | null;
  } | null;
};

type RangeKey = 'today' | 'yesterday' | '7d' | 'custom';

const TZ = 'Europe/Rome';

// compute an ISO range (UTC) from local TZ calendar days
function dayRange(key: RangeKey, customFrom?: string, customTo?: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value || '0');
  const y = get('year'), m = get('month'), d = get('day');

  const startOfLocalDay = (Y: number, M: number, D: number) => new Date(Date.UTC(Y, M - 1, D, 0, 0, 0));
  const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86400000);

  if (key === 'today') {
    const start = startOfLocalDay(y, m, d);
    const end = addDays(start, 1);
    return { startISO: start.toISOString(), endISO: end.toISOString(), label: 'Oggi' };
  }
  if (key === 'yesterday') {
    const end = startOfLocalDay(y, m, d);
    const start = addDays(end, -1);
    return { startISO: start.toISOString(), endISO: end.toISOString(), label: 'Ieri' };
  }
  if (key === '7d') {
    const end = startOfLocalDay(y, m, d + 1);
    const start = addDays(end, -7);
    return { startISO: start.toISOString(), endISO: end.toISOString(), label: 'Ultimi 7 giorni' };
  }
  // custom
  const [cfY, cfM, cfD] = (customFrom || '').split('-').map(Number);
  const [ctY, ctM, ctD] = (customTo || '').split('-').map(Number);
  const start = startOfLocalDay(cfY, cfM, cfD);
  const end = addDays(startOfLocalDay(ctY, ctM, ctD), 1);
  return { startISO: start.toISOString(), endISO: end.toISOString(), label: 'Personalizzato' };
}

export default function TransactionsList() {
  const navigate = useNavigate();
  const { effectiveBusinessId: businessId } = useSelectedBusiness();

  const [rangeKey, setRangeKey] = useState<RangeKey>('today');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const { startISO, endISO, label } = useMemo(
    () => dayRange(rangeKey, customFrom, customTo),
    [rangeKey, customFrom, customTo]
  );

  const [rows, setRows] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // keep it simple: pull all matching (cap at 500)
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id, created_at, total, payment_method,
            barbers(name),
            appointments(contacts(first_name,last_name))
          `)
          .eq('business_id', businessId)
          .eq('status', 'succeeded')
          .gte('created_at', startISO)
          .lt('created_at', endISO)
          .order('created_at', { ascending: false })
          .limit(500);

        if (error) throw error;
        if (!cancelled) setRows((data || []) as TxnRow[]);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || 'Errore nel caricamento');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [businessId, startISO, endISO]);

  const formatEUR = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));

  const formatWhen = (iso: string | null) =>
    iso
      ? `${new Date(iso).toLocaleDateString('it-IT', {
          weekday: 'short', day: '2-digit', month: '2-digit'
        })} ${new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
      : '—';

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Transazioni</h1>
          <p className="text-gray-600">{label}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/reports')}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
          >
            ← Torna ai Reports
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={`px-3 py-1.5 rounded-xl border text-sm ${
              rangeKey === 'today' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setRangeKey('today')}
          >
            Oggi
          </button>
          <button
            className={`px-3 py-1.5 rounded-xl border text-sm ${
              rangeKey === 'yesterday' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setRangeKey('yesterday')}
          >
            Ieri
          </button>
          <button
            className={`px-3 py-1.5 rounded-xl border text-sm ${
              rangeKey === '7d' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setRangeKey('7d')}
          >
            Ultimi 7 giorni
          </button>

          <div className="ml-2 flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => { setCustomFrom(e.target.value); setRangeKey('custom'); }}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-800"
            />
            <span className="text-gray-500 text-sm">→</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => { setCustomTo(e.target.value); setRangeKey('custom'); }}
              className="px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {err && <p className="text-red-600">{err}</p>}
        {loading && !err && <p className="text-gray-600">Caricamento…</p>}

        {!loading && !err && (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-2 text-left">Data/Ora</th>
                <th className="py-2 text-left">Cliente</th>
                <th className="py-2 text-left">Barbiere</th>
                <th className="py-2 text-left">Metodo</th>
                <th className="py-2 text-left">Totale</th>
                <th className="py-2 text-right">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-black">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">Nessuna transazione.</td>
                </tr>
              )}
              {rows.map((t) => {
                const first = t.appointments?.contacts?.first_name ?? '';
                const last = t.appointments?.contacts?.last_name ?? '';
                const fullName = `${first} ${last}`.trim() || '—';
                return (
                  <tr key={t.id}>
                    <td className="py-2">{formatWhen(t.created_at)}</td>
                    <td className="py-2">{fullName}</td>
                    <td className="py-2">{t.barbers?.name ?? '—'}</td>
                    <td className="py-2">{t.payment_method ?? '—'}</td>
                    <td className="py-2">{formatEUR(t.total)}</td>
                    <td className="py-2 text-right">
                      <button
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          // Placeholder - next step will open details modal
                          // e.g., setSelectedId(t.id); setOpen(true);
                          alert('Vedi Dettagli – in arrivo (transaction_items)');
                        }}
                      >
                        Vedi Dettagli
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}