import { Dialog } from "@headlessui/react";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel className="bg-white p-6 rounded shadow max-w-sm w-full">
          <Dialog.Title className="text-lg font-semibold mb-4">
            Conferma eliminazione
          </Dialog.Title>
          <p className="mb-6">Sei sicuro di voler eliminare questo trattamento?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Annulla
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Elimina
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}