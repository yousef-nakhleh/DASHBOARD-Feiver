import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Book,
  Scissors,
  BarChart2,
  Package,
  Users,
  Wallet,
  Tag,
  Settings,
  Menu,
  X,
  LogOut,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const sidebarItems = [
  { path: '/', name: 'Dashboard', icon: <Home size={20} /> },
  { path: '/agenda', name: 'Agenda', icon: <Calendar size={20} /> },
  { path: '/cassa', name: 'Cassa', icon: <DollarSign size={20} /> },
  { path: '/rubrica', name: 'Rubrica', icon: <Book size={20} /> },
  { path: '/trattamenti', name: 'Trattamenti', icon: <Scissors size={20} /> },
  { path: '/statistiche', name: 'Statistiche', icon: <BarChart2 size={20} /> },
  { path: '/magazzino', name: 'Magazzino', icon: <Package size={20} /> },
  { path: '/staff', name: 'Staff', icon: <Users size={20} /> },
  { path: '/spese', name: 'Spese', icon: <Wallet size={20} /> },
  { path: '/promozioni', name: 'Promozioni', icon: <Tag size={20} /> },
  { path: '/settings', name: 'Impostazioni', icon: <Settings size={20} /> },
];

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    alert('Logout clicked');
  };

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 },
    },
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50"
            >
              <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setIsSidebarOpen(false)}
              ></div>
              <div className="absolute top-0 left-0 bottom-0 w-64 bg-[#263238] text-white">
                <div className="flex justify-between items-center p-5 border-b border-gray-600">
                  <h1 className="text-2xl font-serif font-bold">Unique</h1>
                  <button onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-5 py-3 transition-colors ${
                        location.pathname === item.path
                          ? 'bg-[#5D4037] text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </nav>
                <div className="p-4 border-t border-gray-600">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
                  >
                    <LogOut size={20} className="mr-3" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow z-10">
            <div className="px-4 py-3 flex justify-between items-center">
              <button onClick={() => setIsSidebarOpen(true)} className="text-gray-700 hover:text-gray-900">
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-medium font-serif text-gray-800 md:ml-0 ml-4">
                {sidebarItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
              </h2>
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">Patrizia</span>
                <div className="h-8 w-8 rounded-full bg-[#5D4037] text-white flex items-center justify-center">
                  P
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </DndProvider>
  );
};

export default Layout;