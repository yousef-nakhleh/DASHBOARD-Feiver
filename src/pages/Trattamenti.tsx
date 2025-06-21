import React, { useEffect, useState, useMemo } from 'react';
import { Clock, DollarSign, Edit, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const BUSINESS_ID = '268e0ae9-c539-471c-b4c2-1663cf598436';

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
  category: string | null;
  popular: boolean | null;
}

const Trattamenti: React.FC = () => {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading]   = useState(true);

  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  /* ----------------------- FETCH FROM SUPABASE ----------------------- */
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', BUSINESS_ID);          // solo i servizi del business

      if (error) console.error('Errore fetch servizi:', error.message);
      else       setServices(data as ServiceRow[]);

      setLoading(false);
    };

    fetchServices();
  }, []);
  /* ------------------------------------------------------------------- */

  /* categorie dinamiche in base ai servizi ricevuti */
  const categories = useMemo(
    () => Array.from(new Set(services.map(s => s.category ?? ''))).filter(Boolean),
    [services]
  );

  /* filtri di ricerca + categoria */
  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedCategory ? s.category === selectedCategory : true)
  );

  return (
    <div className="h-full">
      {/* ---------- HEADER  ---------- */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trattamenti</h1>
          <p className="text-gray-600">Gestisci servizi e prezzi</p>
        </div>
        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" />
          Nuovo Trattamento
        </button>
      </div>

      {/* ---------- CARD CON TABELLA ---------- */}
      <div className="bg-white rounded-lg shadow mb-6">
        {/* barra di ricerca + filtri */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {/* search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cerca trattamento"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* categorie */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategory === null
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tutti
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedCategory === cat
                      ? 'bg-[#5D4037] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* tabella */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Trattamento</th>
                <th className="px-6 py-3 text-left">Durata</th>
                <th className="px-6 py-3 text-left">Prezzo</th>
                <th className="px-6 py-3 text-left">Categoria</th>
                <th className="px-6 py-3 text-left">Popolare</th>
                <th className="px-6 py-3 text-right">Azioni</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Caricamento...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nessun trattamento trovato
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    {/* nome + descrizione */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-500">{t.description}</div>
                    </td>

                    {/* durata */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm">{t.duration_min} min</span>
                      </div>
                    </td>

                    {/* prezzo */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm">€{t.price}</span>
                      </div>
                    </td>

                    {/* categoria */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {t.category}
                      </span>
                    </td>

                    {/* popolare */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {t.popular ? (
                        <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Sì
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </td>

                    {/* azioni */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Trattamenti;