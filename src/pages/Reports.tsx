// src/pages/Reports.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthContext';
import TransactionsDetails from '../components/reports/TransactionsDetails';

type BarberRow = {
  name: string | null;
  revenue: number;
  appointments: number;
  percent: number;
};

export default function Reports() {
  const { profile } = useAuth();
  const businessId = profile?.business_id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPIs
  const [incassoTotale, setIncassoTotale] = useState(0);
  const [mediaScontrino, setMediaScontrino] = useState(0);
  const [numeroAppuntamenti, setNumeroAppuntamenti] = useState(0);
  const [nuoviClienti] = useState(0); // wire later

  // Tables
  const [barbers, setBarbers] = useState<BarberRow[]>([]);

  // Business day (Europe/Rome), cutoff 24:00
  const timeZone = 'Europe/Rome';
  const { startISO, endISO, label } = useMemo(() => {
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
        // 1) Primary fetch: transactions (for KPIs and barber breakdown)
        const txSelect =
          `id,total,payment_method,status,completed_at,
           barbers(name)`;

        const { data: txnsToday, error: txTodayErr } = await supabase
          .from('transactions')
          .select(txSelect)
          .eq('business_id', businessId)
          .eq('status', 'succeeded')
          .gte('completed_at', startISO)
          .lt('completed_at', endISO);

        if (txTodayErr) throw txTodayErr;

        // KPIs from today's transactions only
        const totalToday = (txnsToday || []).reduce((s, r: any) => s + Number(r.total || 0), 0);
        const countTxToday = (txnsToday || []).length;
        const avgToday = countTxToday > 0 ? totalToday / countTxToday : 0;

        // 2) Numero appuntamenti: (paid = true) OR (status = 'pending')
        const { count: appCount, error: appErr } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .or('paid.is.true,appointment_status.eq.pending')
          .gte('appointment_date', startISO)
          .lt('appointment_date', endISO);

        if (appErr) throw appErr;

        // 3) Per-barber aggregation
        const byBarber = new Map<string, { name: string | null; revenue: number; appointments: number }>();
        (txnsToday || []).forEach((t: any) => {
          const key = t?.barbers?.name ?? '—';
          const row = byBarber.get(key) ?? { name: t?.barbers?.name ?? '—', revenue: 0, appointments: 0 };
          row.revenue += Number(t.total || 0);
          row.appointments += 1;
          byBarber.set(key, row);
        });
        const barberRows = Array.from(byBarber.values())
          .map(b => ({
            ...b,
            percent: totalToday > 0 ? Math.round((b.revenue / totalToday) * 100) : 0,
          }))
          .sort((a, b) => b.revenue - a.revenue);

        if (!cancelled) {
          setIncassoTotale(totalToday);
          setMediaScontrino(avgToday);
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Incasso Totale</p>
            <div className="text-4xl font-bold text-black">{formatEUR(incassoTotale)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Numero Appuntamenti</p>
            <div className="text-4xl font-bold text-black">{numeroAppuntamenti}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Nuovi Clienti</p>
            <div className="text-4xl font-bold text-black">{nuoviClienti}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Media Scontrino</p>
            <div className="text-4xl font-bold text-black">{formatEUR(mediaScontrino)}</div>
          </div>
        </div>
      )}

      {/* Incasso per Barbiere */}
      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Incasso per Barbiere</h2>
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
                  <td className="py-3">{b.name ?? '—'}</td>
                  <td className="py-3">{formatEUR(b.revenue)}</td>
                  <td className="py-3">{b.appointments}</td>
                  <td className="py-3">{b.percent}%</td>
                </tr>
              ))}
              {barbers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    Nessun dato disponibile.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dettaglio Transazioni */}
      {!loading && !error && (
        <TransactionsDetails
          limit={5}
          onShowAll={() => {
            // Qui apriremo la pagina dedicata
            console.log("Vai alla pagina completa delle transazioni");
          }}
        />
      )}
    </div>
  );
}