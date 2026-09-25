import React from 'react';
import { Bot, Sparkles, MessageSquareText } from 'lucide-react';

interface ClientAssistantFloatingButtonProps {
  onClick: () => void;
  quotesCount?: number;
}

export const ClientAssistantFloatingButton: React.FC<ClientAssistantFloatingButtonProps> = ({
  onClick,
  quotesCount = 0,
}) => {
  return (
    <div
      id="floating-assistant-container"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group animate-fade-in"
    >
      <button
        id="btn-open-assistant-floating"
        type="button"
        onClick={onClick}
        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer border border-sky-400/40 text-xs font-bold"
        title="Abrir Asistente para Clientes: consulta el estado y detalles de tus cotizaciones por RUT"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
        </div>

        <div className="text-left hidden sm:block">
          <div className="flex items-center gap-1">
            <span className="text-xs font-black tracking-tight">Asistente Clientes</span>
            <Sparkles className="w-3 h-3 text-amber-300" />
          </div>
          <p className="text-[10px] text-sky-100 font-medium">Consultar por RUT</p>
        </div>

        {quotesCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold hidden sm:inline">
            {quotesCount} cot.
          </span>
        )}
      </button>
    </div>
  );
};
