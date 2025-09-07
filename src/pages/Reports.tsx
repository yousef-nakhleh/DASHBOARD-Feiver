// src/pages/Reports.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useSelectedBusiness } from '../components/auth/SelectedBusinessProvider'; // ⬅️ NEW

type BarberRow = {
  name: string | null;
  revenue: number;
  appointments: number;
  percent: number;
};

type TxnRow = {
  id: string;
  total: number;
  payment_method: string | null;
  status: string | null;
  completed_at: string | null;
  barbers: { name: string | null } | null;
  services: { name: string | null } | null;
  // Enriched via separate appointments fetch
  appointments: {
    appointment_date: string | null;
    duration_min: number | null;
    contacts: { first_name: string | null; last_name: string | null } | null;
  } | null;
};

export default function Reports() {
  const { effectiveBusinessId: businessId } = useSelectedBusiness(); // ⬅️ source business_id here

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPIs
  const [incassoTotale, setIncassoTotale] = useState(0);
  const [mediaScontrino, setMediaScontrino] = useState(0);
  const [numeroAppuntamenti, setNumeroAppuntamenti] = useState(0);
  const [nuoviClienti] = useState(0); // wire later

  // Tables
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [ledger, setLedger] = useState<TxnRow[]>([]);
  const [showAllLedger, setShowAllLedger] = useState(false);

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
        // 1) Primary fetch: transactions + direct FKs (barber, service)
        const txSelect =
          `id,appointment_id,total,payment_method,status,completed_at,
           barbers(name),
           services(name)`;

        const { data: txnsToday, error: txTodayErr } = await supabase
          .from('transactions')
          .select(txSelect)
          .eq('business_id', businessId)
          .eq('status', 'succeeded')
          .gte('completed_at', startISO)
          .lt('completed_at', endISO)
          .order('completed_at', { ascending: false });

        if (txTodayErr) throw txTodayErr;

        let txns = (txnsToday || []) as Array<
          Omit<TxnRow, 'appointments'> & { appointment_id: string | null }
        >;

        // If empty for today, fallback to latest 5 overall so the section isn't empty
        if (txns.length === 0) {
          const { data: txnsLast5, error: txLastErr } = await supabase
            .from('transactions')
            .select(txSelect)
            .eq('business_id', businessId)
            .eq('status', 'succeeded')
            .order('completed_at', { ascending: false })
            .limit(5);
          if (txLastErr) throw txLastErr;
          txns = (txnsLast5 || []) as Array<
            Omit<TxnRow, 'appointments'> & { appointment_id: string | null }
          >;
        }

        // KPIs from today's transactions only
        const totalToday = (txnsToday || []).reduce((s, r: any) => s + Number(r.total || 0), 0);
        const countTxToday = (txnsToday || []).length;
        const avgToday = countTxToday > 0 ? totalToday / countTxToday : 0;

        // 2) Appointments enrich (only for rows that have an appointment_id)
        const apptIds = Array.from(
          new Set(txns.map(t => t.appointment_id).filter((v): v is string => !!v))
        );

        let apptMap = new Map<string, TxnRow['appointments']>();
        if (apptIds.length > 0) {
          const { data: appts, error: apptErr } = await supabase
            .from('appointments')
            .select(`id, appointment_date, duration_min, contacts(first_name,last_name)`)
            .in('id', apptIds);

          if (apptErr) throw apptErr;

          (appts || []).forEach((a: any) => {
            apptMap.set(a.id, {
              appointment_date: a.appointment_date ?? null,
              duration_min: a.duration_min ?? null,
              contacts: a.contacts
                ? {
                    first_name: a.contacts.first_name ?? null,
                    last_name: a.contacts.last_name ?? null,
                  }
                : null,
            });
          });
        }

        // 3) Merge: transactions + (optional) appointment details
        const ledgerRows: TxnRow[] = txns.map(t => ({
          id: t.id,
          total: t.total,
          payment_method: t.payment_method,
          status: t.status,
          completed_at: t.completed_at,
          barbers: (t as any).barbers ?? null,
          services: (t as any).services ?? null,
          appointments: t.appointment_id ? apptMap.get(t.appointment_id) ?? null : null,
        }));

        // 4) Numero appuntamenti: (paid = true) OR (status = 'pending')
        const { count: appCount, error: appErr } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .or('paid.is.true,appointment_status.eq.pending')
          .gte('appointment_date', startISO)
          .lt('appointment_date', endISO);

        if (appErr) throw appErr;

        // 5) Per-barber aggregation from today's txns
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
          setLedger(ledgerRows);
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

  const renderLedgerRows = (rows: TxnRow[]) => {
    const slice = showAllLedger ? rows : rows.slice(0, 5);
    return slice.map((t) => {
      const time =
        t.completed_at &&
        new Date(t.completed_at).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const date =
        t.completed_at &&
        new Date(t.completed_at).toLocaleDateString('it-IT', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        });
      const first = t.appointments?.contacts?.first_name ?? '';
      const last = t.appointments?.contacts?.last_name ?? '';
      const fullName = `${first} ${last}`.trim() || '—';
      const servizio = t.services?.name ?? '—';
      const durata = t.appointments?.duration_min ?? null;
      const barbiere = t.barbers?.name ?? '—';
      const metodo = t.payment_method ?? '—';
      const totale = formatEUR(Number(t.total || 0));

      return (
        <tr key={t.id}>
          <td className="py-2">{date} {time}</td>
          <td className="py-2">{fullName}</td>
          <td className="py-2">{servizio}</td>
          <td className="py-2">{durata !== null ? `${durata}′` : '—'}</td>
          <td className="py-2">{barbiere}</td>
          <td className="py-2">{metodo}</td>
          <td className="py-2">{totale}</td>
        </tr>
      );
    });
  };

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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Incasso Totale</p>
            <div className="text-4xl font-bold text-black">{formatEUR(incassoTotale)}</div>
            <button className="text-sm text-gray-500 mt-3 hover:underline">Dettagli →</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Numero Appuntamenti</p>
            <div className="text-4xl font-bold text-black">{numeroAppuntamenti}</div>
            <button className="text-sm text-gray-500 mt-3 hover:underline">Dettagli →</button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-gray-600 mb-2">Nuovi Clienti</p>
            <div className="text-4xl font-bold text-black">{nuoviClienti}</div>
            <button className="text-sm text-gray-500 mt-3 hover:underline">Dettagli →</button>
          </div>

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Dettaglio Transazioni</h2>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setShowAllLedger((v) => !v)}
              >
                {showAllLedger ? 'Mostra meno' : 'Mostra tutto'}
              </button>
              <button
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  const header = ['Data/Ora', 'Cliente', 'Servizio', 'Durata', 'Barbiere', 'Metodo', 'Totale'];
                  const rows = ledger.map((t) => {
                    const first = t.appointments?.contacts?.first_name ?? '';
                    const last = t.appointments?.contacts?.last_name ?? '';
                    const fullName = `${first} ${last}`.trim();
                    return [
                      t.completed_at
                        ? `${new Date(t.completed_at).toLocaleDateString('it-IT', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                          })} ${new Date(t.completed_at).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : '',
                      fullName,
                      t.services?.name ?? '',
                      t.appointments?.duration_min != null ? `${t.appointments.duration_min}′` : '',
                      t.barbers?.name ?? '',
                      t.payment_method ?? '',
                      String(t.total ?? ''),
                    ];
                  });
                  const csv = [header, ...rows]
                    .map((r) => r.map((s) => `"${String(s).replace(/"/g, '""')}"`).join(';'))
                    .join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `transazioni-${new Date().toISOString().slice(0, 10)}.csv`;
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
                <th className="py-2 text-left">Data/Ora</th>
                <th className="py-2 text-left">Cliente</th>
                <th className="py-2 text-left">Servizio</th>
                <th className="py-2 text-left">Durata</th>
                <th className="py-2 text-left">Barbiere</th>
                <th className="py-2 text-left">Metodo</th>
                <th className="py-2 text-left">Totale</th>
              </tr>
            </thead> 
            <tbody className="divide-y divide-gray-100">
              {ledger.length > 0 ? (
                renderLedgerRows(ledger)
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500">
                    Nessuna transazione.
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