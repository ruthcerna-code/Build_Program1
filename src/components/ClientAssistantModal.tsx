import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  FileText,
  Calendar,
  DollarSign,
  Wrench,
  RotateCcw,
  CheckCircle2,
  Clock,
  ChevronRight,
  Search
} from 'lucide-react';
import { QuoteRequest, UserAccount } from '../types';
import { cleanRut, formatRut, matchesRut } from '../utils/rutUtils';
import { askClientAssistant, AssistantMessage } from '../services/assistantService';

interface ClientAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes: QuoteRequest[];
  currentUser?: UserAccount | null;
  onSelectQuoteToView?: (quote: QuoteRequest) => void;
}

export const ClientAssistantModal: React.FC<ClientAssistantModalProps> = ({
  isOpen,
  onClose,
  quotes,
  currentUser,
  onSelectQuoteToView,
}) => {
  // Client RUT state
  const defaultRut =
    currentUser?.rut ||
    (currentUser?.email === 'ruth.cerna@gmail.com' ? '14.582.910-K' : '14.582.910-K');

  const [inputRut, setInputRut] = useState<string>(defaultRut);
  const [activeRut, setActiveRut] = useState<string>(defaultRut);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter quotes matching the active RUT
  const matchedQuotes = quotes.filter((q) => matchesRut(q.clientRut, activeRut));

  // Initialize greeting whenever active RUT changes
  useEffect(() => {
    if (!isOpen) return;

    const formatted = formatRut(activeRut);
    const count = matchedQuotes.length;

    let initialText = `¡Hola! Soy tu **Asistente Oficial de Cotizaciones de MallasSeguras**.\n\n`;

    if (count > 0) {
      const main = matchedQuotes[0];
      initialText += `He verificado tu RUT **${formatted}** y encontré **${count} cotización(es)** registrada(s) a nombre de **${main.clientName}**.\n\n`;
      initialText += `Recuerda: Estoy facultado **únicamente para responder sobre tus cotizaciones** (estado, presupuesto, fechas de instalación, medidas o datos de tu técnico).\n\n¿En qué te puedo ayudar hoy?`;
    } else {
      initialText += `Actualmente tu RUT activo es **${formatted || 'sin ingresar'}**, pero **no encontramos cotizaciones registradas** bajo este RUT.\n\nPor favor verifica tu RUT ingresándolo arriba o selecciona uno de los RUTs de prueba para explorar tus cotizaciones.`;
    }

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: initialText,
        timestamp: new Date().toISOString(),
        matchedQuotesCount: count,
      },
    ]);
  }, [activeRut, isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleApplyRut = (rutToApply: string) => {
    const formatted = formatRut(rutToApply);
    setInputRut(formatted);
    setActiveRut(formatted);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');

    // Append user message
    const userMsg: AssistantMessage = {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const historyPayload = newHistory
        .filter((m) => m.sender !== 'system')
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.text,
        }));

      const reply = await askClientAssistant(query, activeRut, quotes, historyPayload);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-err-' + Date.now(),
          sender: 'assistant',
          text: 'Ocurrió un inconveniente al consultar los datos de tus cotizaciones. Por favor intenta nuevamente.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    '¿Cuál es el estado de mi cotización?',
    '¿Cuándo viene el técnico a instalar?',
    '¿Cuánto es el total a pagar y qué incluye?',
    '¿Qué medidas y tipo de malla tienen mis ventanas?',
    '¿Quién es mi técnico instalador asignado?',
    '¿Qué garantía tienen mis mallas de seguridad?',
  ];

  return (
    <div
      id="modal-client-assistant"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-sky-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-amber-400 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                  Asistente de Cotizaciones por RUT
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    <Sparkles className="w-2.5 h-2.5 mr-1" />
                    Cliente
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-300">
                Responde exclusivamente en función a las cotizaciones solicitadas por tu RUT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar Asistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* RUT Selector & Active Quotes Status Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>RUT del Cliente Consultante:</span>
            </label>

            <div className="flex items-center gap-2 flex-1 max-w-xs">
              <input
                type="text"
                value={inputRut}
                onChange={(e) => setInputRut(formatRut(e.target.value))}
                placeholder="Ej: 14.582.910-K"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => handleApplyRut(inputRut)}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                Consultar
              </button>
            </div>
          </div>

          {/* Quick-fill chips for testing seeded RUTs */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              RUTs disponibles:
            </span>
            {[
              { name: 'Ruth Cerna', rut: '14.582.910-K' },
              { name: 'Camila Morales', rut: '18.234.567-2' },
              { name: 'Daniela Valenzuela', rut: '19.456.789-8' },
              { name: 'Ignacio Riquelme', rut: '16.789.012-3' },
            ].map((seed) => (
              <button
                key={seed.rut}
                type="button"
                onClick={() => handleApplyRut(seed.rut)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  matchesRut(activeRut, seed.rut)
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {seed.name} ({seed.rut})
              </button>
            ))}
          </div>

          {/* Real-time matched quote mini card */}
          {matchedQuotes.length > 0 ? (
            <div className="bg-white rounded-2xl p-2.5 border border-sky-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800">
                  {matchedQuotes.length} cotización(es) vinculada(s) al RUT {formatRut(activeRut)}:
                </span>
                <span className="font-mono text-sky-700 font-black">
                  {matchedQuotes.map((q) => q.folio).join(', ')}
                </span>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                Cliente: {matchedQuotes[0].clientName}
              </span>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-2xl p-2.5 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                No se encontraron cotizaciones para el RUT <strong>{formatRut(activeRut)}</strong>. El asistente responderá informando la falta de cotizaciones para este RUT.
              </span>
            </div>
          )}
        </div>

        {/* Chat Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-100/60 min-h-[260px] max-h-[380px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-2xs whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none font-medium'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                }`}
              >
                {/* Out of scope warning badge */}
                {msg.isOutOfScopeWarning && (
                  <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    <span>Límite de Seguridad: Pregunta fuera del alcance de cotizaciones</span>
                  </div>
                )}

                <div>{msg.text}</div>

                <div
                  className={`mt-2 text-[10px] flex items-center justify-end gap-1 ${
                    msg.sender === 'user' ? 'text-sky-200' : 'text-slate-400'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-7 h-7 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-200 shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium text-slate-600 ml-1">
                  Consultando cotizaciones de {formatRut(activeRut)}...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Question Prompts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">
            Preguntas rápidas:
          </span>
          {quickQuestions.map((qText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(qText)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full text-[11px] bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-300 transition-all whitespace-nowrap cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {qText}
            </button>
          ))}
        </div>

        {/* Input Form Footer */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Pregunta sobre las cotizaciones del RUT ${formatRut(activeRut)}...`}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Enviar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Restricción activa: Solo responde consultas sobre cotizaciones asociadas al RUT ingresado.
            </span>
            <button
              type="button"
              onClick={() => handleApplyRut(activeRut)}
              className="text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reiniciar conversación"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Limpiar chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
