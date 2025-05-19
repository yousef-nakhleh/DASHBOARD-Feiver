import React, { useState } from 'react';
import { Users, Search, Plus, Phone, Mail, Calendar, Clock, Edit, Trash2 } from 'lucide-react';

// Mock staff data
const staffMembers = [
  { 
    id: 1, 
    name: 'Marco Bianchi', 
    role: 'Master Barber', 
    phone: '333-1234567', 
    email: 'marco.bianchi@email.it', 
    startDate: '2020-03-15', 
    schedule: {
      monday: '9:00 - 18:00',
      tuesday: '9:00 - 18:00',
      wednesday: '9:00 - 18:00',
      thursday: '9:00 - 18:00',
      friday: '9:00 - 18:00',
      saturday: '9:00 - 13:00',
      sunday: 'Chiuso'
    },
    image: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&w=300',
    services: ['Taglio Capelli', 'Barba', 'Taglio e Barba', 'Colore'],
    appointments: 18,
    weeklySales: 650
  },
  { 
    id: 2, 
    name: 'Paolo Rossi', 
    role: 'Barber', 
    phone: '333-7654321', 
    email: 'paolo.rossi@email.it', 
    startDate: '2022-01-10', 
    schedule: {
      monday: '9:00 - 18:00',
      tuesday: '9:00 - 18:00',
      wednesday: 'Chiuso',
      thursday: '9:00 - 18:00',
      friday: '9:00 - 18:00',
      saturday: '9:00 - 13:00',
      sunday: 'Chiuso'
    },
    image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=300',
    services: ['Taglio Capelli', 'Barba', 'Taglio e Barba'],
    appointments: 14,
    weeklySales: 480
  },
  { 
    id: 3, 
    name: 'Lucia Verdi', 
    role: 'Junior Barber', 
    phone: '333-9876543', 
    email: 'lucia.verdi@email.it', 
    startDate: '2023-06-05', 
    schedule: {
      monday: 'Chiuso',
      tuesday: '9:00 - 18:00',
      wednesday: '9:00 - 18:00',
      thursday: '9:00 - 18:00',
      friday: '9:00 - 18:00',
      saturday: '9:00 - 13:00',
      sunday: 'Chiuso'
    },
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
    services: ['Taglio Capelli', 'Barba'],
    appointments: 10,
    weeklySales: 320
  }
];

const Staff: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);

  // Filter staff based on search query
  const filteredStaff = staffMembers.filter(
    staff => staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected staff details
  const selectedStaffData = staffMembers.find(staff => staff.id === selectedStaff);

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
          <p className="text-gray-600">Gestisci il team del salone</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" />
          Nuovo Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff list */}
        <div className="md:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca staff"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[700px] overflow-y-auto">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => (
                <div 
                  key={staff.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedStaff === staff.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedStaff(staff.id)}
                >
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden">
                      <img src={staff.image} alt={staff.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-sm font-medium">{staff.name}</h3>
                      <p className="text-xs text-gray-500">{staff.role}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                Nessun membro trovato
              </div>
            )}
          </div>
        </div>

        {/* Staff details */}
        <div className="md:col-span-2 bg-white rounded-lg shadow">
          {selectedStaffData ? (
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center">
                  <div className="h-20 w-20 rounded-full overflow-hidden">
                    <img src={selectedStaffData.image} alt={selectedStaffData.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold">{selectedStaffData.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedStaffData.role}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                    <Edit size={18} />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Informazioni di Contatto</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Phone size={16} className="text-gray-400 mr-2" />
                      <span>{selectedStaffData.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail size={16} className="text-gray-400 mr-2" />
                      <span>{selectedStaffData.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span>Inizio: {new Date(selectedStaffData.startDate).toLocaleDateString('it-IT')}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Performance Settimanale</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Appuntamenti</p>
                      <p className="text-xl font-semibold">{selectedStaffData.appointments}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500">Vendite</p>
                      <p className="text-xl font-semibold">€{selectedStaffData.weeklySales}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Servizi Offerti</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStaffData.services.map((service, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Orario di Lavoro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(selectedStaffData.schedule).map(([day, hours], index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium capitalize">
                        {day === 'monday' ? 'Lunedì' :
                         day === 'tuesday' ? 'Martedì' :
                         day === 'wednesday' ? 'Mercoledì' :
                         day === 'thursday' ? 'Giovedì' :
                         day === 'friday' ? 'Venerdì' :
                         day === 'saturday' ? 'Sabato' : 'Domenica'}
                      </p>
                      <p className={`text-sm ${hours === 'Chiuso' ? 'text-red-500' : 'text-gray-700'}`}>
                        {hours}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center h-full text-gray-500">
              <Users size={48} className="mb-2" />
              <p>Seleziona un membro dello staff per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Staff;