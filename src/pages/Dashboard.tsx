import React from 'react';
import { Clock, DollarSign, Users, Scissors, Calendar, TrendingUp, Package, Tag } from 'lucide-react';

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
    { name: 'Marco', appointments: 5, revenue: 175, available: true },
    { name: 'Paolo', appointments: 3, revenue: 105, available: true },
    { name: 'Lucia', appointments: 0, revenue: 0, available: false }
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
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Buongiorno, Patrizia</h1>
        <p className="text-gray-600">Panoramica del {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Calendar className="text-blue-600 mr-2" size={20} />
            <h3 className="text-gray-600">Appuntamenti Oggi</h3>
          </div>
          <p className="text-2xl font-semibold">{todayStats.appointments}</p>
          <p className="text-sm text-gray-500 mt-1">Tasso di occupazione: {todayStats.occupancyRate}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <DollarSign className="text-green-600 mr-2" size={20} />
            <h3 className="text-gray-600">Incasso Oggi</h3>
          </div>
          <p className="text-2xl font-semibold">€{todayStats.revenue}</p>
          <p className="text-sm text-gray-500 mt-1">Media per cliente: €{(todayStats.revenue / todayStats.appointments).toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Users className="text-purple-600 mr-2" size={20} />
            <h3 className="text-gray-600">Nuovi Clienti</h3>
          </div>
          <p className="text-2xl font-semibold">{todayStats.newClients}</p>
          <p className="text-sm text-gray-500 mt-1">{((todayStats.newClients / todayStats.appointments) * 100).toFixed(1)}% del totale</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="text-amber-600 mr-2" size={20} />
            <h3 className="text-gray-600">Tasso di Occupazione</h3>
          </div>
          <p className="text-2xl font-semibold">{todayStats.occupancyRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Fasce più richieste: 10:00-12:00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800">Prossimi Appuntamenti</h2>
              <button className="text-sm text-blue-600 hover:underline">
                Vedi Agenda
              </button>
            </div>
            <p className="text-gray-500 text-sm">Visualizza i dettagli nella sezione Agenda</p>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800">Staff Oggi</h2>
              <button className="text-sm text-blue-600 hover:underline">
                Gestisci Staff
              </button>
            </div>
            <div className="divide-y">
              {staffToday.map((staff, index) => (
                <div key={index} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                      {staff.name[0]}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{staff.name}</p>
                      <p className="text-sm text-gray-500">{staff.appointments} appuntamenti</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{staff.revenue}</p>
                    <p className={`text-sm ${staff.available ? 'text-green-600' : 'text-red-600'}`}> 
                      {staff.available ? 'Disponibile' : 'Non disponibile'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Servizi Popolari</h2>
              <Scissors size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {popularServices.map((service, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-gray-500">{service.bookings} prenotazioni</p>
                  </div>
                  <p className="font-medium">€{service.revenue}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Prodotti in Esaurimento</h2>
              <Package size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {lowStockProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-red-600">{product.current} pz (min. {product.minimum})</p>
                  </div>
                  <button className="text-sm text-blue-600 hover:underline">
                    Ordina
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-800">Promozioni Attive</h2>
              <Tag size={20} className="text-gray-400" />
            </div>
            <div className="space-y-3">
              {activePromotions.map((promo, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{promo.name}</p>
                    <p className="text-sm text-gray-500">Sconto: {promo.discount}</p>
                  </div>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{promo.code}</code>
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
