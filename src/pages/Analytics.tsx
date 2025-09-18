import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useSelectedBusiness } from '../components/auth/SelectedBusinessProvider'; // ✅ NEW import

// Utility: simple currency formatter (EUR)
const formatEUR = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

// Static demo data for the line chart
const SERIES: Record<string, { label: string; value: number }[]> = {
  day: [
    { label: '09:00', value: 40 },
    { label: '10:00', value: 85 },
    { label: '11:00', value: 120 },
    { label: '12:00', value: 160 },
    { label: '13:00', value: 180 },
    { label: '14:00', value: 210 },
    { label: '15:00', value: 240 },
  ],
  week: [
    { label: 'Lun', value: 320 },
    { label: 'Mar', value: 410 },
    { label: 'Mer', value: 380 },
    { label: 'Gio', value: 450 },
    { label: 'Ven', value: 520 },
    { label: 'Sab', value: 610 },
    { label: 'Dom', value: 300 },
  ],
  month: [
    { label: '1', value: 200 },
    { label: '5', value: 520 },
    { label: '10', value: 780 },
    { label: '15', value: 1100 },
    { label: '20', value: 1380 },
    { label: '25', value: 1620 },
    { label: '30', value: 1900 },
  ],
  quarter: [
    { label: 'Maggio', value: 2800 },
    { label: 'Giugno', value: 3400 },
    { label: 'Luglio', value: 3600 },
  ],
  year: [
    { label: 'Gen', value: 2500 },
    { label: 'Feb', value: 3000 },
    { label: 'Mar', value: 3200 },
    { label: 'Apr', value: 3800 },
    { label: 'Mag', value: 4300 },
    { label: 'Giu', value: 4100 },
    { label: 'Lug', value: 4000 },
    { label: 'Ago', value: 4200 },
    { label: 'Set', value: 4500 },
    { label: 'Ott', value: 4700 },
    { label: 'Nov', value: 4900 },
    { label: 'Dic', value: 5200 },
  ],
};

const RANGE_TABS: { key: keyof typeof SERIES; label: string }[] = [
  { key: 'day', label: 'Giorno' },
  { key: 'week', label: 'Settimana' },
  { key: 'month', label: 'Mese' },
  { key: 'quarter', label: '3 mesi' },
  { key: 'year', label: 'Anno' },
];

export default function CassaOverviewStatic() {
  const { effectiveBusinessId } = useSelectedBusiness(); // ✅ CHANGED
  const [range, setRange] = useState<keyof typeof SERIES>('month');
  const [businessTimezone, setBusinessTimezone] = useState('Europe/Rome'); // ✅ NEW

  // -------- Fetch business timezone --------
  useEffect(() => {
    const fetchBusinessTimezone = async () => {
      if (!effectiveBusinessId) return;
      const { data, error } = await supabase
        .from('business')
        .select('timezone')
        .eq('id', effectiveBusinessId)
        .single();
      if (!error && data?.timezone) {
        setBusinessTimezone(data.timezone);
      }
    };
    fetchBusinessTimezone();
  }, [effectiveBusinessId]);

  // Static KPIs (can be wired later)
  const KPIS = {
    appointments: { value: 8, delta: +12, sub: 'Tasso di occupazione: 75%' },
    revenue: { value: 280, delta: +8, sub: 'Media per cliente: €35,00' },
    newClients: { value: 2, delta: +15, sub: '25% del totale' },
    occupancy: { value: 75, delta: +3, sub: 'Fasce più richieste: 10:00–12:00' },
  };

  return (
    <div className="h-full space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Cassa</h1>
          <p className="text-gray-600">Panoramica giornaliera e trend</p>
        </div>
        <div className="text-gray-500 text-sm">
          Fuso orario: {businessTimezone} {/* ✅ shows business-level timezone */}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appuntamenti Oggi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 mb-2">Appuntamenti Oggi</p>
              <div className="text-4xl font-bold text-black">{KPIS.appointments.value}</div>
              <p className="text-gray-500 mt-3">{KPIS.appointments.sub}</p>
            </div>
            <div className="text-green-600 font-medium">+{KPIS.appointments.delta}%</div>
          </div>
        </div>

        {/* Incasso Oggi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 mb-2">Incasso Oggi</p>
              <div className="text-4xl font-bold text-black">{formatEUR(KPIS.revenue.value)}</div>
              <p className="text-gray-500 mt-3">{KPIS.revenue.sub}</p>
            </div>
            <div className="text-green-600 font-medium">+{KPIS.revenue.delta}%</div>
          </div>
        </div>

        {/* Nuovi Clienti */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 mb-2">Nuovi Clienti</p>
              <div className="text-4xl font-bold text-black">{KPIS.newClients.value}</div>
              <p className="text-gray-500 mt-3">{KPIS.newClients.sub}</p>
            </div>
            <div className="text-green-600 font-medium">+{KPIS.newClients.delta}%</div>
          </div>
        </div>

        {/* Tasso di Occupazione */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 mb-2">Tasso di Occupazione</p>
              <div className="text-4xl font-bold text-black">{KPIS.occupancy.value}%</div>
              <p className="text-gray-500 mt-3">{KPIS.occupancy.sub}</p>
            </div>
            <div className="text-green-600 font-medium">+{KPIS.occupancy.delta}%</div>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Fatturato</p>
          <div className="flex items-center gap-2">
            {RANGE_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setRange(t.key)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                  range === t.key
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SERIES[range]} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
              <YAxis tickFormatter={(v) => formatEUR(v as number)} tick={{ fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} width={80} />
              <Tooltip formatter={(value: any) => [formatEUR(value as number), 'Incasso']} labelStyle={{ color: '#6b7280' }} />
              <Line type="monotone" dataKey="value" stroke="#111827" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}