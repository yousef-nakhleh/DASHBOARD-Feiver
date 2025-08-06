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
  Home,
  ChevronRight,
  MessageSquare,
  Clock
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
  { path: '/Voiceflow', name: 'ChatBot', icon: <MessageSquare size={20} /> },
  { path: '/waiting-list', name: 'Lista d\'Attesa', icon: <Clock size={20} /> },
  { path: '/vapi', name: 'Vapi AI', icon: <Phone size={20} /> },
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
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3, ease: "easeIn" },
    },
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-black text-white">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-black border-r border-gray-800">
          <div className="flex items-center justify-center h-16 px-6 border-b border-gray-800">
            <h1 className="text-xl font-bold tracking-wider">Extro</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  location.pathname === item.path
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:text-white hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                {location.pathname === item.path && (
                  <ChevronRight size={16} />
                )}
              </button>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-lg transition-all duration-200"
            >
              <LogOut size={20} className="mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              <div
                className="absolute inset-0 bg-black bg-opacity-75"
                onClick={() => setIsSidebarOpen(false)}
              ></div>
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute top-0 left-0 bottom-0 w-64 bg-black border-r border-gray-800"
              >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
                  <h1 className="text-xl font-bold tracking-wider">Extro</h1>
                  <button onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                  </button>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        location.pathname === item.path
                          ? 'bg-white text-black'
                          : 'text-gray-300 hover:text-white hover:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      {location.pathname === item.path && (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  ))}
                </nav>
                
                <div className="p-4 border-t border-gray-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-lg transition-all duration-200"
                  >
                    <LogOut size={20} className="mr-3" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Header */}
          <header className="bg-black border-b border-gray-800 h-16 flex items-center justify-between px-6">
            <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-900 transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold">
                  {sidebarItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date().toLocaleDateString('it-IT', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium">Davide</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-white text-black flex items-center justify-center font-semibold">
                  A
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-hidden bg-gray-50">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                className="h-full p-6"
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