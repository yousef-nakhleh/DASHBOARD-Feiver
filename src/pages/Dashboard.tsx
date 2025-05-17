import React from 'react';
import { Calendar, DollarSign, Users, Scissors, Clock } from 'lucide-react';
import AppointmentCard from '../components/agenda/AppointmentCard';

const Dashboard: React.FC = () => {
  // Mock data for demonstration
  const todayAppointments = [
    { time: '09:30', clientName: 'Giovanni Rossi', service: 'Taglio e barba', duration: 45, stylist: 'Marco' },
    { time: '11:00', clientName: 'Luca Bianchi', service: 'Taglio classico', duration: 30, stylist: 'Paolo' },
    { time: '14:30', clientName: 'Andrea Verdi', service: 'Rasatura completa', duration: 25, stylist: 'Marco' },
  ];

  return (
    <div className="h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Buongiorno, Mario</h1>
        <p className="text-gray-600">Ecco un riepilogo della giornata</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Appuntamenti Oggi" 
          value="8" 
          icon={<Calendar className="text-blue-600" />}
          change="2 rispetto a ieri" 
          changeType="increase" 
        />
        <StatCard 
          title="Incasso Giornaliero" 
          value="€420" 
          icon={<DollarSign className="text-green-600" />}
          change="15% rispetto a ieri" 
          changeType="increase" 
        />
        <StatCard 
          title="Clienti Nuovi" 
          value="3" 
          icon={<Users className="text-purple-600" />}
          change="1 rispetto a ieri" 
          changeType="increase" 
        />
        <StatCard 
          title="Servizi Completati" 
          value="5" 
          icon={<Scissors className="text-amber-600" />}
          change="63%" 
          changeType="neutral" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Prossimi Appuntamenti</h2>
            <button className="text-sm text-blue-600 hover:underline">
              Vedi Tutti
            </button>
          </div>
          <div>
            {todayAppointments.map((appointment, index) => (
              <AppointmentCard
                key={index}
                time={appointment.time}
                clientName={appointment.clientName}
                service={appointment.service}
                duration={appointment.duration}
                stylist={appointment.stylist}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Orari di Lavoro</h2>
          <div className="space-y-4">
            <div className="flex items-center text-sm">
              <div className="w-20 font-medium">Lunedì</div>
              <div className="text-gray-600">9:00 - 19:00</div>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-20 font-medium">Martedì</div>
              <div className="text-gray-600">9:00 - 19:00</div>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-20 font-medium">Mercoledì</div>
              <div className="text-gray-600">9:00 - 19:00</div>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-20 font-medium">Giovedì</div>
              <div className="text-gray-600">9:00 - 19:00</div>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-20 font-medium">Venerdì</div>
              <div className="text-gray-600">9:00 - 19:00</div>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-20 font-medium">Sabato</div>
              <div className="text-gray-600">8:30 - 18:00</div>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-20 font-medium">Domenica</div>
              <div className="text-gray-600">Chiuso</div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-800 mb-2">Oggi</h3>
            <div className="flex items-center">
              <Clock size={16} className="text-gray-500 mr-2" />
              <span className="text-sm">Aperto • Chiude alle 19:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;