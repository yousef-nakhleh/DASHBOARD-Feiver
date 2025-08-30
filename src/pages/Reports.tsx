import React from 'react';

export default function Reports() {
  return (
    <div className="h-full space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Report</h1>
          <p className="text-gray-600">Totali giornalieri e settimanali</p>
        </div>
        {/* Placeholder for Date Picker (later) */}
        <div>
          <button className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            Oggi
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 mb-2">Incasso Totale</p>
          <div className="text-4xl font-bold text-black">€1.250</div>
          <p className="text-gray-500 mt-3">Media scontrino: €35,00</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 mb-2">Numero Transazioni</p>
          <div className="text-4xl font-bold text-black">36</div>
          <p className="text-gray-500 mt-3">Nuove prenotazioni: 12</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 mb-2">Metodo di Pagamento</p>
          <div className="text-4xl font-bold text-black">Carta</div>
          <p className="text-gray-500 mt-3">65% del totale</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-gray-600 mb-2">Tasso di Occupazione</p>
          <div className="text-4xl font-bold text-black">75%</div>
          <p className="text-gray-500 mt-3">Fasce più richieste: 10:00–12:00</p>
        </div>
      </div>

      {/* Breakdown tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Per Metodo di Pagamento</h2>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-2 text-left">Metodo</th>
                <th className="py-2 text-left">Transazioni</th>
                <th className="py-2 text-left">Totale</th>
                <th className="py-2 text-left">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2">Contanti</td>
                <td>12</td>
                <td>€420</td>
                <td>35%</td>
              </tr>
              <tr>
                <td className="py-2">Carta</td>
                <td>20</td>
                <td>€750</td>
                <td>60%</td>
              </tr>
              <tr>
                <td className="py-2">Satispay</td>
                <td>4</td>
                <td>€80</td>
                <td>5%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* By service */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-black mb-4">Per Servizio</h2>
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-2 text-left">Servizio</th>
                <th className="py-2 text-left">Transazioni</th>
                <th className="py-2 text-left">Totale</th>
                <th className="py-2 text-left">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2">Taglio Uomo</td>
                <td>18</td>
                <td>€540</td>
                <td>43%</td>
              </tr>
              <tr>
                <td className="py-2">Taglio Donna</td>
                <td>10</td>
                <td>€450</td>
                <td>36%</td>
              </tr>
              <tr>
                <td className="py-2">Colore</td>
                <td>8</td>
                <td>€260</td>
                <td>21%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions ledger */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-black mb-4">Dettaglio Transazioni</h2>
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
            <tr>
              <td className="py-2">09:30</td>
              <td>Mario Rossi</td>
              <td>Taglio Uomo</td>
              <td>€30</td>
              <td>Carta</td>
            </tr>
            <tr>
              <td className="py-2">10:15</td>
              <td>Luca Bianchi</td>
              <td>Colore</td>
              <td>€45</td>
              <td>Contanti</td>
            </tr>
            <tr>
              <td className="py-2">11:00</td>
              <td>Anna Verdi</td>
              <td>Taglio Donna</td>
              <td>€60</td>
              <td>Satispay</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
