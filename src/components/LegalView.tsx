import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY } from '../constants/contact';

interface LegalViewProps {
  kind: 'privacy' | 'terms';
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ kind, onBack }) => {
  const isPrivacy = kind === 'privacy';

  return (
    <section className="max-w-2xl mx-auto pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-sky-700 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <h1 className="text-2xl font-black text-slate-900">
          {isPrivacy ? 'Política de Privacidad' : 'Términos de uso'}
        </h1>
        {isPrivacy ? (
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              Nydo Mallas usa los datos del formulario de cotización (nombre, correo, teléfono, comuna,
              región y respuestas técnicas) para preparar una cotización y contactarte.
            </p>
            <p>No vendemos tus datos. El ingreso al panel es solo para cuentas creadas por la administradora.</p>
            <p>
              El almacenamiento se hace en la base de datos del proyecto (Supabase) y, en este equipo, en
              el almacenamiento local del navegador para el trabajo del panel.
            </p>
            <p>
              Contacto: {CONTACT_EMAIL} · WhatsApp {CONTACT_PHONE_DISPLAY}.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              El formulario de cotización reúne antecedentes. No calcula precios ni confirma una
              instalación. Las medidas se piden por rangos y se revisan en terreno si corresponde.
            </p>
            <p>
              Las fechas u opciones de plazo son una preferencia del cliente, no una reserva.
            </p>
            <p>
              Las visitas de cotización, cuando se coordinan, tienen el costo informado en preguntas
              frecuentes y se descuentan si contratas el servicio.
            </p>
            <p>
              Al enviar una solicitud aceptas que te contactemos por correo, teléfono o WhatsApp para
              responder esa cotización.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
