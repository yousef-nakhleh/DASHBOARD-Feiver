// src/pages/Reports.tsx
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function Reports() {
  // ---- Static demo data ----
  const KPIS = {
    incassoTotale: { value: 1250, sub: 'Dettagli →' },
    numeroAppuntamenti: { value: 22, sub: 'Dettagli →' },
    nuoviClienti: { value: 4, sub: 'Dettagli →' },
    mediaScontrino: { value: 35, sub: 'Dettagli →' },
  };

  const [range] = useState<'day' | 'week'>('day'); // placeholder for future filters

  const INCASSO_PER_BARBIERE = [
    { name: 'Alket', value: 480 },
    { name: 'Gino', value: 360 },
    { name: 'Lisa', value: 290 },
    { name: 'Marco', value: 120 },
  ];

  const TRANSACTIONS = [
    { time: '09:30', customer: 'Mario Rossi', service: 'Taglio Uomo', total: 30, method: 'Carta' },
    { time: '10:15', customer: 'Luca Bianchi', service: 'Colore', total: 45, method: 'Contanti' },
    { time: '11:00', customer: 'Anna Verdi', service: 'Taglio Donna', total: 60, method: 'Satispay' },
    { time: '12:10', customer: 'Sara Neri', service: 'Piega', total: 25, method: 'Carta' },
    { time: '12:40', customer: 'Paolo Blu', service: 'Barba', total: 20, method: 'Contanti' },
  ];

  const formatEUR = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Report</h1>
          <p className="text-gray-600">Totali giornalieri e settimanali</p>
        </div>
        {/* Placeholder date/range control */}
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            Oggi
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Incasso Totale */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 mb-2">Incasso Totale</p>
          <div className="text-4xl font-bold text-black">{formatEUR(KPIS.incassoTotale.value)}</div>
          <button className="text-sm text-gray-500 mt-3 hover:underline">{KPIS.incassoTotale.sub}</button>
        </div>

        {/* Numero Appuntamenti */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 mb-2">Numero Appuntamenti</p>
          <div className="text-4xl font-bold text-black">{KPIS.numeroAppuntamenti.value}</div>
          <button className="text-sm text-gray-500 mt-3 hover:underline">{KPIS.numeroAppuntamenti.sub}</button>
        </div>

        {/* Nuovi Clienti */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 mb-2">Nuovi Clienti</p>
          <div className="text-4xl font-bold text-black">{KPIS.nuoviClienti.value}</div>
          <button className="text-sm text-gray-500 mt-3 hover:underline">{KPIS.nuoviClienti.sub}</button>
        </div>

        {/* Media Scontrino */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 mb-2">Media Scontrino</p>
          <div className="text-4xl font-bold text-black">{formatEUR(KPIS.mediaScontrino.value)}</div>
          <button className="text-sm text-gray-500 mt-3 hover:underline">{KPIS.mediaScontrino.sub}</button>
        </div>
      </div>

      {/* Chart: Incasso per Barbiere */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Incasso per Barbiere</p>
          <button className="text-sm text-gray-500 hover:underline">Dettagli →</button>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={INCASSO_PER_BARBIERE}
              margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis
                tickFormatter={(v) => formatEUR(v as number)}
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
                width={80}
              />
              <Tooltip
                formatter={(value: any) => [formatEUR(value as number), 'Incasso']}
                labelStyle={{ color: '#6b7280' }}
              />
              <Bar dataKey="value" fill="#111827" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions ledger (plain list, no summaries) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-black">Dettaglio Transazioni</h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
              Esporta CSV
            </button>
          </div>
        </div>
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 text-sm">
              <th className="py-2 text-left">Ora</th>
              <th className="py-2 text-left">Cliente</th>
              <th className="py-2 text-left">Servizio</th>
              <th className="py-2 text-left">Totale</th>
              <th className="py-2 text-left">Metodo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TRANSACTIONS.map((t, idx) => (
              <tr key={idx}>
                <td className="py-2">{t.time}</td>
                <td>{t.customer}</td>
                <td>{t.service}</td>
                <td>{formatEUR(t.total)}</td>
                <td>{t.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 