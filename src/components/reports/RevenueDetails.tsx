// src/components/reports/RevenueDetails.tsx
import React from "react";

const RevenueDetails: React.FC = () => {
  // 🔴 Static data for now
  const barbers = [
    { name: "Mario Rossi", revenue: 520, appointments: 14, percent: 41 },
    { name: "Luca Bianchi", revenue: 430, appointments: 11, percent: 34 },
    { name: "Anna Verdi", revenue: 310, appointments: 8, percent: 25 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-black mb-4">Incasso per Barbiere</h2>
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 text-sm">
            <th className="py-2 text-left">Barbiere</th>
            <th className="py-2 text-left">Incasso</th>
            <th className="py-2 text-left">Appuntamenti</th>
            <th className="py-2 text-left">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {barbers.map((barber) => (
            <tr key={barber.name} className="align-top">
              <td className="py-3">
                <p className="font-medium text-black">{barber.name}</p>
              </td>
              <td className="py-3">€{barber.revenue}</td>
              <td className="py-3">{barber.appointments}</td>
              <td className="py-3 w-40">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 w-10">{barber.percent}%</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full"
                      style={{ width: `${barber.percent}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RevenueDetails; 