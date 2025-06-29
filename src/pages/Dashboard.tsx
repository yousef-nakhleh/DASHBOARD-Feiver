import React from 'react';
import { Clock, DollarSign, Users, Scissors, Calendar, TrendingUp, Package, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const todayStats = {
    appointments: 8,
    revenue: 280,
    newClients: 2,
    occupancyRate: 75
  };

  const popularServices = [
    { name: 'Extention', bookings: 3, revenue: 105 },
    { name: 'Piega', bookings: 2, revenue: 50 },
    { name: 'Unique ristrutturante', bookings: 2, revenue: 40 }
  ];

  const staffToday = [
    { name: 'Pietro', appointments: 5, revenue: 175, available: true },
    { name: 'Annarita', appointments: 3, revenue: 105, available: true },
    { name: 'Federica', appointments: 0, revenue: 0, available: false }
  ];

  const lowStockProducts = [
    { name: 'Shampoo Professionale', current: 2, minimum: 5 },
    { name: 'Gel Modellante', current: 3, minimum: 8 }
  ];

  const activePromotions = [
    { name: 'Sconto Studenti', discount: '15%', code: 'STUDENTE15' },
    { name: 'Happy Hour Mattina', discount: '20%', code: 'MATTINA20' }
  ];

  return (
    <div className="h-full space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Buongiorno, Pietro</h1>
        <p className="text-gray-600">Panoramica del {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-black rounded-xl">
              <Calendar className="text-white" size={24} />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUpRight size={16} />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Appuntamenti Oggi</h3>
          <p className="text-3xl font-bold text-black">{todayStats.appointments}</p>
          <p className="text-sm text-gray-500 mt-2">Tasso di occupazione: {todayStats.occupancyRate}%</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-black rounded-xl">
              <DollarSign className="text-white" size={24} />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUpRight size={16} />
              <span className="text-sm font-medium">+8%</span>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Incasso Oggi</h3>
          <p className="text-3xl font-bold text-black">€{todayStats.revenue}</p>
          <p className="text-sm text-gray-500 mt-2">Media per cliente: €{(todayStats.revenue / todayStats.appointments).toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-black rounded-xl">
              <Users className="text-white" size={24} />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUpRight size={16} />
              <span className="text-sm font-medium">+15%</span>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Nuovi Clienti</h3>
          <p className="text-3xl font-bold text-black">{todayStats.newClients}</p>
          <p className="text-sm text-gray-500 mt-2">{((todayStats.newClients / todayStats.appointments) * 100).toFixed(1)}% del totale</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-black rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div className="flex items-center text-green-600">
              <ArrowUpRight size={16} />
              <span className="text-sm font-medium">+3%</span>
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Tasso di Occupazione</h3>
          <p className="text-3xl font-bold text-black">{todayStats.occupancyRate}%</p>
          <p className="text-sm text-gray-500 mt-2">Fasce più richieste: 10:00-12:00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Prossimi Appuntamenti</h2>
              <button className="text-sm text-black hover:text-gray-600 font-medium transition-colors">
                Vedi Agenda →
              </button>
            </div>
            <p className="text-gray-500 text-sm">Visualizza i dettagli nella sezione Agenda</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">Staff Oggi</h2>
              <button className="text-sm text-black hover:text-gray-600 font-medium transition-colors">
                Gestisci Staff →
              </button>
            </div>
            <div className="space-y-4">
              {staffToday.map((staff, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white font-bold">
                      {staff.name[0]}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-black">{staff.name}</p>
                      <p className="text-sm text-gray-500">{staff.appointments} appuntamenti</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-black">€{staff.revenue}</p>
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${staff.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <p className={`text-sm ${staff.available ? 'text-green-600' : 'text-red-600'}`}> 
                        {staff.available ? 'Disponibile' : 'Non disponibile'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black">Servizi Popolari</h2>
              <Scissors size={20} className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {popularServices.map((service, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-black">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.bookings} prenotazioni</p>
                  </div>
                  <p className="font-bold text-black">€{service.revenue}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black">Prodotti in Esaurimento</h2>
              <Package size={20} className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {lowStockProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <p className="font-semibold text-black">{product.name}</p>
                    <p className="text-sm text-red-600">{product.current} pz (min. {product.minimum})</p>
                  </div>
                  <button className="text-sm text-black hover:text-gray-600 font-medium transition-colors">
                    Ordina →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black">Promozioni Attive</h2>
              <Tag size={20} className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {activePromotions.map((promo, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-black">{promo.name}</p>
                    <span className="text-sm font-bold text-black">{promo.discount}</span>
                  </div>
                  <code className="text-xs bg-black text-white px-2 py-1 rounded font-mono">{promo.code}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;