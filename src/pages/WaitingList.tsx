import React, { useEffect, useState } from 'react';
import { Clock, User, Phone, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toLocalFromUTC } from '../lib/timeUtils'; // ✅ Timezone utility

// Hardcoded for now, should come from auth context
// TODO: Replace with dynamic business_id from user session
const BUSINESS_ID = '6ebf5f92-14ff-430e-850c-f147c3dc16f4';

interface WaitingListItem {
  id: string;
  customer_name: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
  date: string;
  created_at: string;
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
};

const WaitingList: React.FC = () => {
  const [waitingList, setWaitingList] = useState<WaitingListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWaitingList = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('waiting_list')
        .select('id, customer_name, customer_phone, start_time, end_time, date, created_at')
        .eq('business_id', '6ebf5f92-14ff-430e-850c-f147c3dc16f4')
        .order('created_at', { ascending: false });
 
      if (error) {
        throw error;
      }

      setWaitingList(data || []);
    } catch (err) {
      console.error('Errore nel caricamento della lista d\'attesa:', err);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingList();
  }, []);

  const filteredWaitingList = waitingList.filter(
    item =>
      item.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customer_phone?.includes(searchQuery)
  );

  return (
    <div className="h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">Lista d'Attesa</h1>
          <p className="text-gray-600">Gestisci le richieste in lista d'attesa</p>
        </div>
        <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center hover:bg-gray-800 transition-all duration-200 font-medium">
          <Plus size={18} className="mr-2" />
          Nuova Attesa
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca per nome o telefono"
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              <p className="mt-4 text-gray-500">Caricamento...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchWaitingList}
                className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Riprova
              </button>
            </div>
          ) : filteredWaitingList.length === 0 ? (
            <div className="p-8 text-center">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'Nessun risultato trovato' : 'Nessuna richiesta in lista d\'attesa'}
              </p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome e Cognome
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fascia Oraria
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orario Richiesta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWaitingList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-black text-white flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-black">{item.customer_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Phone size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-black">{item.customer_phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-black">
                          {formatTimeRange(item.start_time, item.end_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-black">
                        {new Date(item.date).toLocaleDateString('it-IT')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {formatDateTime(toLocalFromUTC(item.created_at))} {/* ✅ converted */}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitingList;