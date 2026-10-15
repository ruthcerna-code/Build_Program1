import React from 'react';
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, WHATSAPP_QUOTE_URL } from '../constants/contact';

interface LegalViewProps {
  kind: 'privacy' | 'terms';
  onBack: () => void;
}

export const LegalView: React.FC<LegalViewProps> = ({ kind, onBack }) => {
  const isPrivacy = kind === 'privacy';

  return (
    <section className="max-w-2xl mx-auto pb-16 font-body text-nydo-ink">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-bold underline underline-offset-4 bg-transparent border-0 p-0 cursor-pointer mb-6"
      >
        ← Volver
      </button>
      <p className="uppercase tracking-[0.14em] text-xs font-bold mb-3">Nydo Mallas</p>
      <h1 className="nydo-display text-[clamp(2.8rem,6vw,4.5rem)] mb-6">
        {isPrivacy ? 'Política de Privacidad' : 'Términos de uso'}
      </h1>
      {isPrivacy ? (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Nydo Mallas usa los datos del formulario de cotización (nombre, correo, teléfono, comuna, región y
            respuestas técnicas) para preparar una cotización y contactarte.
          </p>
          <p>No vendemos tus datos. El ingreso al panel es solo para cuentas creadas por la administradora.</p>
          <p>
            El almacenamiento se hace en la base de datos del proyecto (Supabase) y, en este equipo, en el
            almacenamiento local del navegador para el trabajo del panel.
          </p>
          <p>
            Contacto: {CONTACT_EMAIL} · WhatsApp {CONTACT_PHONE_DISPLAY}.
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            El formulario de cotización reúne antecedentes. No calcula precios ni confirma una instalación. Las medidas
            se piden por rangos y se revisan en terreno si corresponde.
          </p>
          <p>Las fechas u opciones de plazo son una preferencia del cliente, no una reserva.</p>
          <p>
            Las visitas de cotización, cuando se coordinan, tienen el costo informado en preguntas frecuentes y se
            descuentan si contratas el servicio.
          </p>
          <p>
            Al enviar una solicitud aceptas que te contactemos por correo, teléfono o WhatsApp para responder esa
            cotización.
          </p>
        </div>
      )}
      <a href={WHATSAPP_QUOTE_URL} target="_blank" rel="noopener noreferrer" className="nydo-btn nydo-btn-whatsapp mt-8">
        WhatsApp {CONTACT_PHONE_DISPLAY}
      </a>
    </section>
  );
};
