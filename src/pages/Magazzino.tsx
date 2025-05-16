import React, { useState } from 'react';
import { Package, Search, Plus, AlertCircle, ShoppingCart, Edit, Trash2 } from 'lucide-react';

// Mock products data
const products = [
  { id: 1, name: 'Shampoo Professionale', category: 'Capelli', stock: 15, minStock: 5, price: 12.99, supplier: 'BeautySupply', image: 'https://images.pexels.com/photos/3735650/pexels-photo-3735650.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 2, name: 'Balsamo Nutriente', category: 'Capelli', stock: 8, minStock: 3, price: 10.50, supplier: 'BeautySupply', image: 'https://images.pexels.com/photos/3737579/pexels-photo-3737579.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 3, name: 'Gel Modellante', category: 'Styling', stock: 20, minStock: 8, price: 8.75, supplier: 'HairPro', image: 'https://images.pexels.com/photos/3321416/pexels-photo-3321416.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 4, name: 'Cera per Barba', category: 'Barba', stock: 12, minStock: 6, price: 15.00, supplier: 'BarberTools', image: 'https://images.pexels.com/photos/5797999/pexels-photo-5797999.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 5, name: 'Olio da Barba', category: 'Barba', stock: 4, minStock: 5, price: 18.50, supplier: 'BarberTools', image: 'https://images.pexels.com/photos/4465126/pexels-photo-4465126.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 6, name: 'Tinta per Capelli N.5', category: 'Colore', stock: 6, minStock: 3, price: 9.99, supplier: 'ColorMaster', image: 'https://images.pexels.com/photos/7290115/pexels-photo-7290115.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 7, name: 'Schiuma da Barba', category: 'Barba', stock: 10, minStock: 4, price: 7.25, supplier: 'BarberTools', image: 'https://images.pexels.com/photos/6621471/pexels-photo-6621471.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { id: 8, name: 'Asciugamani Monouso', category: 'Accessori', stock: 100, minStock: 30, price: 0.50, supplier: 'BeautySupply', image: 'https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=300' },
];

const categories = [...new Set(products.map(p => p.category))];

const Magazzino: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

  // Filter products based on search query, category, and low stock status
  const filteredProducts = products.filter(
    product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (selectedCategory ? product.category === selectedCategory : true) &&
      (showLowStock ? product.stock <= product.minStock : true)
  );

  // Count low stock items
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Magazzino</h1>
          <p className="text-gray-600">Gestisci prodotti e scorte</p>
        </div>
        <div className="flex space-x-3">
          <button 
            className={`flex items-center px-4 py-2 rounded-lg border ${
              showLowStock 
                ? 'bg-red-50 text-red-700 border-red-300' 
                : 'bg-white text-gray-700 border-gray-300'
            }`}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            <AlertCircle size={18} className={`${showLowStock ? 'text-red-500' : 'text-gray-400'} mr-2`} />
            <span>{lowStockCount} prodotti in esaurimento</span>
          </button>
          <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
            <Plus size={18} className="mr-1" />
            Nuovo Prodotto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca prodotto"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037] w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategory === null
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                Tutti
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 text-sm rounded-full ${
                    selectedCategory === category
                      ? 'bg-[#5D4037] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow">
                <div className="h-32 bg-gray-200 relative">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button className="p-1 bg-white rounded-full shadow hover:bg-gray-100">
                      <Edit size={16} className="text-blue-600" />
                    </button>
                    <button className="p-1 bg-white rounded-full shadow hover:bg-gray-100">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium mb-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">Fornitore: {product.supplier}</p>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-gray-600 text-sm">Prezzo:</p>
                      <p className="font-semibold">€{product.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Disponibilità:</p>
                      <p className={`font-semibold ${product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock} pz
                      </p>
                    </div>
                  </div>
                  
                  <button className="w-full mt-2 bg-gray-100 hover:bg-gray-200 py-2 rounded flex items-center justify-center text-gray-700">
                    <ShoppingCart size={16} className="mr-2" />
                    Ordina
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              Nessun prodotto trovato
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Magazzino;