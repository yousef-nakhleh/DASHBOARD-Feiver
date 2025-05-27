import React from 'react';
import NewContactForm from './NewContactForm';

interface SlidingPanelContactProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void; // Ensure this is correctly typed as a function
}

const SlidingPanelContact: React.FC<SlidingPanelContactProps> = ({ visible, onClose, onCreated }) => {
  if (!visible) return null;

  return (
    <div className="fixed right-0 top-0 w-[400px] h-full bg-white shadow-xl p-6 z-50 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Nuovo Cliente</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-black text-xl">&times;</button>
      </div>
      <div className="flex-grow overflow-y-auto">
        <NewContactForm onCreated={onCreated} />
      </div>
    </div>
  );
};

export default SlidingPanelContact;