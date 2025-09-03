// src/components/agenda/AppointmentSummaryButton.tsx
import React, { useMemo } from 'react';
import { X, Check, Trash2, Repeat, Scissors, Printer, ChevronDown } from 'lucide-react';

type AppointmentSummaryButtonProps = {
  position?: { top: number; left: number };
  onClose?: () => void;
};

const AppointmentSummaryButton: React.FC<AppointmentSummaryButtonProps> = ({
  position,
  onClose,
}) => {
  const style = useMemo<React.CSSProperties>(() => {
    const top = position?.top ?? 120;
    const left = position?.left ?? 460;
    return {
      position: 'absolute',
      top,
      left,
      zIndex: 60,
      transform: 'translateX(8px)',
    };
  }, [position]);

  return (
    <div
      style={style}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 w-[460px] overflow-hidden"
    >
      {/* Header (fixed) */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-black leading-tight">Riepilogo Prenotazione</h3>
          <p className="text-xs text-gray-500">Dettagli dell’appuntamento</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
            title="Conferma"
            type="button"
          >
            <Check size={16} />
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 transition-colors"
            title="Chiudi"
            type="button"
          >
            <X size={16} className="text-black" />
          </button>
        </div>
      </div>

      {/* Body (scrollable, capped height) */}
      <div className="max-h-[380px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Service row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-gray-900 truncate">
                Taglio Uomo con Shampoo
              </div>
              <div className="mt-2 grid grid-cols-[68px_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                <div className="text-gray-500">Con</div>
                <div className="font-medium text-gray-900">Alket</div>

                <div className="text-gray-500">Note</div>
                <div className="text-gray-800 whitespace-pre-line">
                  Alban{'\n'}(shampoo){'\n'}Source: Treatwell{'\n'}
                  Order Reference: T2157334518{'\n'}
                  Booking Reference: bk_142692964
                </div>

                <div className="text-gray-500">Prezzo</div>
                <div className="font-semibold text-gray-900">€ 20,00</div>
              </div>
            </div>

            <button
              type="button"
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-gray-100 text-gray-900 text-[11px] font-semibold border border-gray-200"
              title="Durata"
            >
              0.30h <ChevronDown size={13} className="opacity-70" />
            </button>
          </div>

          {/* Tabs mimic */}
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1.5 text-[11px] font-semibold rounded-full bg-black text-white">
              Riepilogo
            </span>
            <span className="px-2.5 py-1.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-700">
              Info Cliente
            </span>
            <span className="px-2.5 py-1.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-700">
              Cassa
            </span>
          </div>

          {/* Info Cliente block */}
          <div className="rounded-xl border border-gray-100 p-3.5 bg-gray-50">
            <div className="text-sm font-semibold text-gray-900 mb-2">Info Cliente</div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <div className="text-gray-500 text-[11px] mb-0.5">Nome</div>
                <div className="font-medium text-gray-900">Gabriel</div>
              </div>
              <div>
                <div className="text-gray-500 text-[11px] mb-0.5">Cognome</div>
                <div className="font-medium text-gray-900">—</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 text-[11px] mb-0.5">Email</div>
                <div className="font-medium text-gray-900">morminagabriel17@gmail.co</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-500 text-[11px] mb-0.5">Telefono</div>
                <div className="font-medium text-gray-900">+39 000 000 0000</div>
              </div>
            </div>

            <div className="mt-2 text-[11px] font-semibold text-white bg-red-500 rounded-md px-2.5 py-1.5 inline-flex">
              Non ha dato i consensi per la privacy
            </div>
          </div>
        </div>
      </div>

      {/* Footer (fixed) */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          title="Elimina"
        >
          <Trash2 size={16} />
          <span className="text-sm font-medium">Elimina</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Taglia"
          >
            <Scissors size={16} />
            <span className="text-sm font-medium">Taglia</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Ripeti"
          >
            <Repeat size={16} />
            <span className="text-sm font-medium">Ripeti</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title="Stampa"
          >
            <Printer size={16} />
            <span className="text-sm font-medium">Stampa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummaryButton; 