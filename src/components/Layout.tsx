// src/components/Layout.tsx
import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  DollarSign,
  Book,
  Scissors,
  BarChart2,
  Package,
  Users,
  Menu,
  X,
  LogOut,
  Home,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Clock,
  Phone,
  CalendarX,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Logout logic wrapper
import Logout from './auth/Logout';

// ✅ Feature flags
import { useFeatures } from '../features/FeaturesProvider';
import { FEATURE } from '../features/featureSlugs';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // ✅ Ask provider for flags
  const { ready, has } = useFeatures();

  // Build "Orari" children based on gates
  const orariChildren = useMemo(() => {
    const children: Array<{ path: string; name: string; icon: React.ReactNode }> = [];
    if (ready && has(FEATURE.AVAILABILITY)) {
      children.push({ path: '/staff', name: 'Staff Disponibilità', icon: <Users size={18} /> });
    }
    if (ready && has(FEATURE.OPENING_EXCEPTIONS)) {
      children.push({ path: '/aperture-eccezionali', name: 'Aperture Eccezionali', icon: <Calendar size={18} /> });
    }
    if (ready && has(FEATURE.CLOSING_EXCEPTIONS)) {
      children.push({ path: '/exceptions', name: 'Chiusure Eccezionali', icon: <CalendarX size={18} /> });
    }
    return children;
  }, [ready, has]);

  // ✅ Build sidebar dynamically (gate-based)
  const sidebarItems = useMemo(() => {
    const items: any[] = [];

    // Always visible
    items.push({ path: '/', name: 'Dashboard', icon: <Home size={20} /> });

    // Agenda
    if (ready && has(FEATURE.AGENDA)) {
      items.push({ path: '/agenda', name: 'Agenda', icon: <Calendar size={20} /> });
    }

    // Cassa (Transactions)
    if (ready && has(FEATURE.TRANSACTIONS)) {
      items.push({ path: '/cassa', name: 'Cassa', icon: <DollarSign size={20} /> });
    }

    // ✅ Reports (right under Cassa)
    if (ready && has(FEATURE.REPORTS)) {
      items.push({ path: '/reports', name: 'Reports', icon: <BarChart2 size={20} /> });
    }

    // Orari group (only if at least one child is enabled)
    if (orariChildren.length > 0) {
      items.push({
        name: 'Orari',
        icon: <Clock size={20} />,
        isGroup: true,
        children: orariChildren,
      });
    }

    // Rubrica (Contacts)
    if (ready && has(FEATURE.CONTACTS)) {
      items.push({ path: '/rubrica', name: 'Rubrica', icon: <Book size={20} /> });
    }

    // Trattamenti (Services)
    if (ready && has(FEATURE.SERVICES)) {
      items.push({ path: '/trattamenti', name: 'Trattamenti', icon: <Scissors size={20} /> });
    }

    // Statistiche (Analytics) — left open by your request (no gate)
    items.push({ path: '/analytics', name: 'Statistiche', icon: <BarChart2 size={20} /> });

    // Magazzino — left open
    items.push({ path: '/magazzino', name: 'Magazzino', icon: <Package size={20} /> });

    // Chatbot
    if (ready && has(FEATURE.CHATBOT)) {
      items.push({ path: '/chatbot', name: 'Chatbot', icon: <MessageSquare size={20} /> });
    }

    // Waiting List
    if (ready && has(FEATURE.WAITINGLIST)) {
      items.push({ path: '/waiting-list', name: "Lista d'Attesa", icon: <Clock size={20} /> });
    }

    // Phone Caller (Vapi)
    if (ready && has(FEATURE.PHONECALLER)) {
      items.push({ path: '/vapi', name: 'AI Phone Caller', icon: <Phone size={20} /> });
    }

    return items;
  }, [ready, has, orariChildren]);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-black text-white">
        {/* Desktop Sidebar */}
        <div
          className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-black border-r border-gray-800 transition-all duration-300 ${
            isDesktopSidebarOpen ? 'lg:w-64' : 'lg:w-0 overflow-hidden'
          }`}
        >
          <div className="flex items-center justify-center h-16 px-6 border-b border-gray-800">
            <h1 className="text-xl font-bold tracking-wider">Feiver</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="px-4 py-6 space-y-1">
              {sidebarItems.map((item) => (
                <div key={item.path || item.name}>
                  {item.isGroup ? (
                    <>
                      <button
                        onClick={() =>
                          setExpandedGroup(expandedGroup === item.name ? null : item.name)
                        }
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-300 hover:text-white hover:bg-gray-900"
                      >
                        <div className="flex items-center">
                          <span className="mr-3">{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                        {expandedGroup === item.name ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedGroup === item.name && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-8 space-y-1 mt-1">
                              {item.children?.map((child: any) => (
                                <button
                                  key={child.path}
                                  onClick={() => navigate(child.path)}
                                  className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                                    location.pathname === child.path
                                      ? 'bg-white text-black'
                                      : 'text-gray-300 hover:text-white hover:bg-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <span className="mr-3">{child.icon}</span>
                                    <span>{child.name}</span>
                                  </div>
                                  {location.pathname === child.path && <ChevronRight size={14} />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <button
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
                      {location.pathname === item.path && <ChevronRight size={16} />}
                    </button>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-800">
            <Logout>
              <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-lg transition-all duration-200">
                <LogOut size={20} className="mr-3" />
                <span>Logout</span>
              </button>
            </Logout>
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
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="absolute top-0 left-0 bottom-0 w-64 bg-black border-r border-gray-800 flex flex-col"
              >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
                  <h1 className="text-xl font-bold tracking-wider">Feiver</h1>
                  <button onClick={() => setIsSidebarOpen(false)}>
                    <X size={24} />
                  </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                  {sidebarItems.map((item) => (
                    <div key={item.path || item.name}>
                      {item.isGroup ? (
                        <>
                          <button
                            onClick={() =>
                              setExpandedGroup(expandedGroup === item.name ? null : item.name)
                            }
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group text-gray-300 hover:text-white hover:bg-gray-900"
                          >
                            <div className="flex items-center">
                              <span className="mr-3">{item.icon}</span>
                              <span>{item.name}</span>
                            </div>
                            {expandedGroup === item.name ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                          <AnimatePresence>
                            {expandedGroup === item.name && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="pl-8 space-y-1 mt-1">
                                  {item.children?.map((child: any) => (
                                    <button
                                      key={child.path}
                                      onClick={() => {
                                        navigate(child.path);
                                        setIsSidebarOpen(false);
                                      }}
                                      className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                                        location.pathname === child.path
                                          ? 'bg-white text-black'
                                          : 'text-gray-300 hover:text-white hover:bg-gray-900'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <span className="mr-3">{child.icon}</span>
                                        <span>{child.name}</span>
                                      </div>
                                      {location.pathname === child.path && <ChevronRight size={14} />}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <button
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
                          {location.pathname === item.path && <ChevronRight size={16} />}
                        </button>
                      )}
                    </div>
                  ))}
                </nav>

                <div className="p-4 border-t border-gray-800 flex-shrink-0">
                  <Logout>
                    <button
                      className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-900 rounded-lg transition-all duration-200"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <LogOut size={20} className="mr-3" />
                      <span>Logout</span>
                    </button>
                  </Logout>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isDesktopSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          }`}
        >
          {/* Header */}
          <header className="bg-black border-b border-gray-800 h-16 flex items-center justify-between px-6">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-900 transition-colors"
              >
                <Menu size={20} />
              </button>
              <button
                onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="hidden lg:block mr-4 p-2 rounded-lg hover:bg-gray-900 transition-colors"
                title={isDesktopSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {isDesktopSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
              <div>
                <h2 className="text-lg font-semibold">
                  {sidebarItems.find((item: any) => item.path === location.pathname)?.name ||
                    'Dashboard'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date().toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                className="p-6"
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