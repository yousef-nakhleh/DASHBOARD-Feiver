import React from 'react';
import NewContactForm from './NewContactForm';
import { X } from 'lucide-react';

interface SlidingPanelContactProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SlidingPanelContact: React.FC<SlidingPanelContactProps> = ({ visible, onClose, onCreated }) => {
  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div className="fixed right-0 top-0 w-[500px] h-full bg-white shadow-xl z-50 flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Nuovo Cliente</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6">
          <NewContactForm onCreated={onCreated} />
        </div>
      </div>
    </>
  );
};

export default SlidingPanelContact;