// src/pages/Reports.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';

type BarberRow = {
  name: string | null;
  revenue: number;
  appointments: number;
  percent: number; // computed against total revenue
};

type TxnRow = {
  id: string;
  total: number;
  payment_method: string | null;
  completed_at: string | null;
  barbers: { name: string | null } | null;
  services: { name: string | null } | null;
};

export default function Reports() {
  const { profile } = useAuth();
  const businessId = profile?.business_id ?? null;

  // ---- UI state ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPIs
  const [incassoTotale, setIncassoTotale] = useState(0);
  const [mediaScontrino, setMediaScontrino] = useState(0);
  const [numeroAppuntamenti, setNumeroAppuntamenti] = useState(0);
  const [nuoviClienti] = useState(0); // to be wired later if/when rule is defined

  // Tables
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [ledger, setLedger] = useState<TxnRow[]>([]);

  // ---- Business day bounds (Europe/Rome, cutoff 24:00) ----
  const timeZone = 'Europe/Rome';
  const { startISO, endISO, label } = useMemo(() => {
    // Build [00:00, 24:00) range for "today" in business TZ
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value || '0');
    const y = get('year');
    const m = get('month');
    const d = get('day');
    const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    const end = new Date(Date.UTC(y, m - 1, d + 1, 0, 0, 0));
    const label = new Intl.DateTimeFormat('it-IT', {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    return { startISO: start.toISOString(), endISO: end.toISOString(), label };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      if (!businessId) return;
      setLoading(true);
      setError(null);

      try {
        // 1) Fetch transactions in range for ledger + money KPIs
        const { data: txnsData, error: txnsErr } = await supabase
          .from('transactions')
          .select('id,total,payment_method,completed_at,barbers(name),services(name)')
          .eq('business_id', businessId)
          .eq('status', 'succeeded')
          .gte('completed_at', startISO)
          .lt('completed_at', endISO)
          .order('completed_at', { ascending: true });

        if (txnsErr) throw txnsErr;
        const txns = (txnsData || []) as TxnRow[];

        const total = txns.reduce((s, r) => s + Number(r.total || 0), 0);
        const countTx = txns.length;
        const avg = countTx > 0 ? total / countTx : 0;

        // 2) Numero appuntamenti via count (IMPORTANT: head:true => data is null, use count!)
        const { count: appCount, error: appErr } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .in('appointment_status', ['confirmed'])
          .gte('appointment_date', startISO)
          .lt('appointment_date', endISO);

        if (appErr) throw appErr;

        // 3) Per-barber aggregation from txns
        const byBarber = new Map<string, BarberRow>();
        for (const t of txns) {
          const key = t.barbers?.name ?? '—';
          const row = byBarber.get(key) ?? { name: t.barbers?.name ?? '—', revenue: 0, appointments: 0, percent: 0 };
          row.revenue += Number(t.total || 0);
          row.appointments += 1;
          byBarber.set(key, row);
        }
        const barberRows = Array.from(byBarber.values()).sort((a, b) => b.revenue - a.revenue);
        for (const b of barberRows) {
          b.percent = total > 0 ? Math.round((b.revenue / total) * 100) : 0;
        }

        if (!cancelled) {
          setLedger(txns);
          setIncassoTotale(total);
          setMediaScontrino(avg);
          setNumeroAppuntamenti(appCount ?? 0);
          setBarbers(barberRows);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Errore nel caricamento');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [businessId, startISO, endISO]);

  const formatEUR = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Report</h1>
          <p className="text-gray-600">Totali di {label}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            Oggi
          </button>
        </div>
      </div>

      {/* Error / Loading */}
      {error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-red-600">Errore: {error}</p>
        </div>
      )}
      {loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600">Caricamento…</p>
        </div>
      )}

      {/* KPI row */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Incasso Totale */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Incasso Totale</p>
            <div className="text-4xl font-bold text-black">{formatEUR(incassoTotale)}</div>
            <button className="text-sm text-gray-500 mt-3 hover:underline">Dettagli →</button>
          </div>

          {/* Numero Appuntamenti */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Numero Appuntamenti</p>
            <div className="text-4xl font-bold text-black">{numeroAppuntamenti}</div>
            <button className="text-sm text-gray-500 mt-3 hover:underline">Dettagli →</button>
          </div>

          {/* Nuovi Clienti (placeholder) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Nuovi Clienti</p>
            <div className="text-4xl font-bold text-black">{nuoviClienti}</div>
            <button className="text-sm text-gray-500 mt-3 hover:underline">Dettagli →</button>
          </div>

          {/* Media Scontrino */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Media Scontrino</p>
            <div className="text-4xl font-bold text-black">{formatEUR(mediaScontrino)}</div>
            <button className="text-sm text-gray-500 mt-3 hover:underline">Dettagli →</button>
          </div>
        </div>
      )}

      {/* Incasso per Barbiere */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Incasso per Barbiere</h2>
            <button className="text-sm text-gray-500 hover:underline">Dettagli →</button>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-2 text-left">Barbiere</th>
                <th className="py-2 text-left">Incasso</th>
                <th className="py-2 text-left">Appuntamenti</th>
                <th className="py-2 text-left">% del Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {barbers.map((b) => (
                <tr key={b.name ?? '—'} className="align-top">
                  <td className="py-3">
                    <p className="font-medium text-black">{b.name ?? '—'}</p>
                  </td>
                  <td className="py-3">{formatEUR(b.revenue)}</td>
                  <td className="py-3">{b.appointments}</td>
                  <td className="py-3 w-48">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 w-10">{b.percent}%</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-black h-2 rounded-full" style={{ width: `${b.percent}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {barbers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    Nessun dato disponibile per oggi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions ledger */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Dettaglio Transazioni</h2>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  // CSV export for current ledger
                  const header = ['Ora', 'Barbiere', 'Servizio', 'Totale', 'Metodo'];
                  const rows = ledger.map((t) => [
                    t.completed_at
                      ? new Date(t.completed_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                      : '',
                    t.barbers?.name ?? '',
                    t.services?.name ?? '',
                    String(t.total ?? ''),
                    t.payment_method ?? '',
                  ]);
                  const csv = [header, ...rows]
                    .map((r) => r.map((s) => `"${String(s).replace(/"/g, '""')}"`).join(';'))
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `report-${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Esporta CSV
              </button>
            </div>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-2 text-left">Ora</th>
                <th className="py-2 text-left">Barbiere</th>
                <th className="py-2 text-left">Servizio</th>
                <th className="py-2 text-left">Totale</th>
                <th className="py-2 text-left">Metodo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledger.map((t) => (
                <tr key={t.id}>
                  <td className="py-2">
                    {t.completed_at
                      ? new Date(t.completed_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td>{t.barbers?.name ?? '—'}</td>
                  <td>{t.services?.name ?? '—'}</td>
                  <td>{formatEUR(Number(t.total || 0))}</td>
                  <td>{t.payment_method ?? '—'}</td>
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Nessuna transazione per oggi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}