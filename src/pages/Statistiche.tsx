import React, { useState } from 'react';
import { BarChart2, TrendingUp, Users, DollarSign, Calendar, ChevronDown } from 'lucide-react';

// Sample chart component
const SimpleBarChart = () => {
  // Mock data for chart
  const data = [
    { day: 'Lun', value: 42 },
    { day: 'Mar', value: 35 },
    { day: 'Mer', value: 40 },
    { day: 'Gio', value: 55 },
    { day: 'Ven', value: 60 },
    { day: 'Sab', value: 75 },
    { day: 'Dom', value: 10 },
  ];

  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className="flex h-64 items-end justify-between mt-6">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center">
          <div 
            className="w-12 bg-[#5D4037] hover:bg-[#4E342E] transition-all rounded-t-md"
            style={{ height: `${(item.value / maxValue) * 200}px` }}
          ></div>
          <div className="text-xs mt-2">{item.day}</div>
        </div>
      ))}
    </div>
  );
};

// Sample line chart component
const SimpleLineChart = () => {
  // Mock data for line chart
  const data = [
    { month: 'Gen', value: 2500 },
    { month: 'Feb', value: 3000 },
    { month: 'Mar', value: 3200 },
    { month: 'Apr', value: 3800 },
    { month: 'Mag', value: 4200 },
    { month: 'Giu', value: 4000 },
  ];

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  
  // Calculate points for line
  const getPoints = () => {
    const totalWidth = 100 / (data.length - 1);
    return data.map((item, i) => {
      const x = i * totalWidth;
      // Normalize height to fit in chart
      const normalizedValue = (item.value - minValue) / (maxValue - minValue);
      const y = 100 - (normalizedValue * 80); // 80% of height to leave space for dots
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="h-64 relative mt-6">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={getPoints()}
          fill="none"
          stroke="#5D4037"
          strokeWidth="2"
        />
        {data.map((item, i) => {
          const x = i * (100 / (data.length - 1));
          const normalizedValue = (item.value - minValue) / (maxValue - minValue);
          const y = 100 - (normalizedValue * 80);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill="#5D4037"
            />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((item, i) => (
          <div key={i} className="text-xs text-center">
            <div>{item.month}</div>
            <div className="font-medium">€{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Questa Settimana');
  
  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-600">Analisi delle performance del salone</p>
        </div>
        <div className="relative">
          <button 
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
          >
            <span>{timeRange}</span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Calendar className="text-blue-600 mr-2" size={20} />
            <h3 className="text-gray-600">Appuntamenti</h3>
          </div>
          <p className="text-2xl font-semibold">32</p>
          <p className="text-sm text-green-600 mt-1">+15% rispetto a prima</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <DollarSign className="text-green-600 mr-2" size={20} />
            <h3 className="text-gray-600">Fatturato</h3>
          </div>
          <p className="text-2xl font-semibold">€2,850</p>
          <p className="text-sm text-green-600 mt-1">+8% rispetto a prima</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Users className="text-purple-600 mr-2" size={20} />
            <h3 className="text-gray-600">Nuovi Clienti</h3>
          </div>
          <p className="text-2xl font-semibold">12</p>
          <p className="text-sm text-green-600 mt-1">+5% rispetto a prima</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="text-amber-600 mr-2" size={20} />
            <h3 className="text-gray-600">Tasso di Occupazione</h3>
          </div>
          <p className="text-2xl font-semibold">85%</p>
          <p className="text-sm text-green-600 mt-1">+3% rispetto a prima</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Appuntamenti Giornalieri</h2>
          </div>
          <SimpleBarChart />
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Fatturato Mensile</h2>
          </div>
          <SimpleLineChart />
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Servizi Più Popolari</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servizio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prenotazioni
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fatturato
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crescita
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Taglio e Barba</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">45</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€1,575</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    +12%
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Taglio Capelli</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">38</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€950</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    +8%
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rasatura Completa</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">22</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€440</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    -3%
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Shampoo e Taglio</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€540</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    +15%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Statistiche;