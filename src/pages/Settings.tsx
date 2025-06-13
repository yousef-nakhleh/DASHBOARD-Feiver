import React, { useState } from 'react';
import { Settings as SettingsIcon, Calendar, Clock, Save, Bell, User, Shield, Palette } from 'lucide-react';

const Settings: React.FC = () => {
  const [slotType, setSlotType] = useState<'standard' | 'dynamic'>('standard');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [workingHours, setWorkingHours] = useState({
    start: '08:00',
    end: '20:00',
  });
  const [language, setLanguage] = useState('it');
  const [theme, setTheme] = useState('light');

  const handleSave = () => {
    // Here you would typically save to your backend/database
    console.log('Settings saved:', {
      slotType,
      notifications,
      workingHours,
      language,
      theme,
    });
    alert('Impostazioni salvate con successo!');
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Impostazioni</h1>
          <p className="text-gray-600">Configura le preferenze del sistema</p>
        </div>
        <button
          onClick={handleSave}
          className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors"
        >
          <Save size={18} className="mr-1" />
          Salva Modifiche
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Calendar size={24} className="text-[#5D4037] mr-3" />
            <h2 className="text-lg font-semibold text-gray-800">Gestione Calendario</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo di Slot Temporali
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="slotType"
                    value="standard"
                    checked={slotType === 'standard'}
                    onChange={(e) => setSlotType(e.target.value as 'standard' | 'dynamic')}
                    className="h-4 w-4 text-[#5D4037] focus:ring-[#5D4037] border-gray-300"
                  />
                  <span className="ml-3 text-sm">
                    <span className="font-medium">Slot Standardizzati (15m)</span>
                    <p className="text-gray-500 text-xs mt-1">
                      Appuntamenti organizzati in intervalli fissi di 15 minuti
                    </p>
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="slotType"
                    value="dynamic"
                    checked={slotType === 'dynamic'}
                    onChange={(e) => setSlotType(e.target.value as 'standard' | 'dynamic')}
                    className="h-4 w-4 text-[#5D4037] focus:ring-[#5D4037] border-gray-300"
                  />
                  <span className="ml-3 text-sm">
                    <span className="font-medium">Slot Dinamici</span>
                    <p className="text-gray-500 text-xs mt-1">
                      Appuntamenti con durata variabile basata sul servizio
                    </p>
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orari di Lavoro
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Apertura</label>
                  <input
                    type="time"
                    value={workingHours.start}
                    onChange={(e) => setWorkingHours(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Chiusura</label>
                  <input
                    type="time"
                    value={workingHours.end}
                    onChange={(e) => setWorkingHours(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Bell size={24} className="text-[#5D4037] mr-3" />
            <h2 className="text-lg font-semibold text-gray-800">Notifiche</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Email</span>
                <p className="text-xs text-gray-500">Ricevi notifiche via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => setNotifications(prev => ({ ...prev, email: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5D4037]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5D4037]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">SMS</span>
                <p className="text-xs text-gray-500">Ricevi notifiche via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) => setNotifications(prev => ({ ...prev, sms: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5D4037]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5D4037]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Push</span>
                <p className="text-xs text-gray-500">Notifiche push del browser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => setNotifications(prev => ({ ...prev, push: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#5D4037]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5D4037]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <User size={24} className="text-[#5D4037] mr-3" />
            <h2 className="text-lg font-semibold text-gray-800">Account</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lingua
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
              >
                <option value="it">Italiano</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
              >
                <option value="light">Chiaro</option>
                <option value="dark">Scuro</option>
                <option value="auto">Automatico</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Shield size={24} className="text-[#5D4037] mr-3" />
            <h2 className="text-lg font-semibold text-gray-800">Sicurezza</h2>
          </div>
          
          <div className="space-y-4">
            <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-700">Cambia Password</div>
              <div className="text-xs text-gray-500 mt-1">Aggiorna la tua password di accesso</div>
            </button>

            <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-700">Autenticazione a Due Fattori</div>
              <div className="text-xs text-gray-500 mt-1">Aggiungi un livello extra di sicurezza</div>
            </button>

            <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-700">Sessioni Attive</div>
              <div className="text-xs text-gray-500 mt-1">Visualizza e gestisci le sessioni di accesso</div>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Palette size={24} className="text-[#5D4037] mr-3" />
          <h2 className="text-lg font-semibold text-gray-800">Personalizzazione</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Logo del Salone</h3>
            <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
              Carica Logo
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Colore Principale</h3>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-[#5D4037] rounded-full border-2 border-gray-300"></div>
              <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-gray-300"></div>
              <div className="w-8 h-8 bg-green-600 rounded-full border-2 border-gray-300"></div>
              <div className="w-8 h-8 bg-purple-600 rounded-full border-2 border-gray-300"></div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Layout Dashboard</h3>
            <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5D4037]">
              <option>Compatto</option>
              <option>Standard</option>
              <option>Espanso</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;