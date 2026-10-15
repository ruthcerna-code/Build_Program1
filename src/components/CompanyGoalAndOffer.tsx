import React from 'react';
import { CONTACT_PHONE_DISPLAY, WHATSAPP_QUOTE_URL, whatsappQuoteUrl } from '../constants/contact';
import { FAQ_ITEMS } from '../constants/faqAssistant';
import { NydoHeroArt } from './NydoHeroArt';

interface CompanyGoalAndOfferProps {
  onGoToQuoteMesh?: () => void;
  onOpenAssistant?: () => void;
}

const SPACES = [
  {
    id: 'ventanas',
    index: '01 / VENTANAS',
    title: 'Abre posibilidades.',
    copy: 'Cuéntanos cuántas ventanas tienes y sus medidas aproximadas.',
    quoteLabel: 'Cotizar ventanas ↗',
    space: 'ventanas',
    scene: 'yellow' as const,
    windowClass: 'nydo-mesh-window',
  },
  {
    id: 'balcones',
    index: '02 / BALCONES',
    title: 'Tu rincón favorito.',
    copy: 'Prepara las medidas del balcón para evaluar una solución para tu hogar.',
    quoteLabel: 'Cotizar balcón ↗',
    space: 'un balcón',
    scene: 'orange' as const,
    windowClass: 'nydo-mesh-window nydo-mesh-balcony',
  },
  {
    id: 'terrazas',
    index: '03 / TERRAZAS',
    title: 'Espacio para vivir.',
    copy: 'Describe tu terraza y los sectores donde necesitas instalar mallas.',
    quoteLabel: 'Cotizar terraza ↗',
    space: 'una terraza',
    scene: 'pink' as const,
    windowClass: 'nydo-mesh-window nydo-mesh-terrace',
  },
];

const sceneBg: Record<(typeof SPACES)[number]['scene'], string> = {
  yellow: 'bg-nydo-yellow',
  orange: 'bg-nydo-orange',
  pink: 'bg-nydo-pink',
};

export const CompanyGoalAndOffer: React.FC<CompanyGoalAndOfferProps> = ({
  onGoToQuoteMesh,
  onOpenAssistant,
}) => {
  return (
    <div id="section-company-presentation" className="font-body text-nydo-ink">
      <section className="bg-nydo-orange overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14 pt-8 sm:pt-11">
          <p className="uppercase tracking-[0.14em] text-xs font-bold">Tu casa. Tu gente. Tu Nydo.</p>
          <h1 className="nydo-display uppercase text-nydo-cream mt-4 text-[clamp(3.4rem,10vw,9.5rem)]">
            Tu mundo,
            <br />
            protegido.
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-[1.35fr_0.65fr] items-center gap-6 md:gap-11 pt-2">
            <NydoHeroArt className="w-full h-auto max-h-[330px] md:max-h-none" />
            <div className="pb-10 md:pb-14">
              <p className="text-lg sm:text-[22px] leading-snug max-w-sm mb-6">
                Más vida en casa.
                <br />
                Mallas de protección para tus ventanas, balcones y terrazas.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {onGoToQuoteMesh && (
                  <button type="button" onClick={onGoToQuoteMesh} className="nydo-btn">
                    QUIERO COTIZAR <span aria-hidden="true">↗</span>
                  </button>
                )}
                <a
                  href={WHATSAPP_QUOTE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nydo-btn nydo-btn-whatsapp"
                >
                  WhatsApp {CONTACT_PHONE_DISPLAY}
                </a>
              </div>
              <p className="text-xs mt-4">Cuéntanos qué espacio quieres proteger. Cotización sin costo.</p>
              <div className="hidden md:block text-[100px] leading-none text-nydo-cream mt-8" aria-hidden="true">
                ✳
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-nydo-blue py-12 sm:py-16" id="espacios">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-9">
            <h2 className="nydo-display text-[clamp(3rem,6vw,5.5rem)]">
              Cada espacio
              <br />
              tiene su Nydo.
            </h2>
            <p className="max-w-xs text-sm">
              Empieza por el lugar que quieres proteger. Los detalles los definimos contigo.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {SPACES.map((space) => (
              <article key={space.id} className="bg-white rounded-[18px] overflow-hidden">
                <div className={`h-52 md:h-60 relative grid place-items-center overflow-hidden ${sceneBg[space.scene]}`}>
                  <div className={space.windowClass} aria-hidden="true" />
                  <span className="absolute bottom-4 left-5 text-xs font-bold">{space.index}</span>
                </div>
                <div className="p-6">
                  <h3 className="nydo-display text-[2rem] md:text-4xl">{space.title}</h3>
                  <p className="text-sm my-3">{space.copy}</p>
                  <div className="flex flex-col gap-2">
                    {onGoToQuoteMesh && (
                      <button
                        type="button"
                        onClick={onGoToQuoteMesh}
                        className="font-bold underline underline-offset-4 text-left cursor-pointer bg-transparent border-0 p-0"
                      >
                        {space.quoteLabel}
                      </button>
                    )}
                    <a
                      href={whatsappQuoteUrl(space.space)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold"
                    >
                      WhatsApp {space.id} ↗
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-nydo-cream py-12 sm:py-16" id="comparar">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14">
          <h2 className="nydo-display text-[clamp(3rem,6vw,5.5rem)] mb-9">
            Malla o rejas:
            <br />
            elige con claridad.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <article className="bg-nydo-blue rounded-2xl p-7 min-h-[260px] flex flex-col justify-between">
              <div>
                <p className="uppercase tracking-[0.14em] text-xs font-bold">Opción recomendada</p>
                <h3 className="nydo-display text-4xl mt-3 mb-5">Malla de seguridad</h3>
                <ul className="space-y-2.5 text-sm">
                  <li>Deja pasar la luz y no tapa la vista.</li>
                  <li>Suele estar permitida en condominios.</li>
                  <li>En una emergencia se puede cortar para evacuar.</li>
                  <li>Plazo de instalación según evaluación.</li>
                </ul>
              </div>
            </article>
            <article className="bg-white rounded-2xl p-7 min-h-[260px] flex flex-col justify-between border border-nydo-ink/15">
              <div>
                <p className="uppercase tracking-[0.14em] text-xs font-bold">Menos recomendable</p>
                <h3 className="nydo-display text-4xl mt-3 mb-5">Rejas de fierro</h3>
                <ul className="space-y-2.5 text-sm">
                  <li>Tapan la luz y el paisaje.</li>
                  <li>Muchos edificios no las permiten.</li>
                  <li>Dificultan la evacuación en un incendio.</li>
                  <li>Obra más pesada, óxido y soldadura.</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-nydo-cream pb-12 sm:pb-16" id="cotizar">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14 grid grid-cols-1 md:grid-cols-[0.85fr_1.15fr] gap-10 md:gap-16 items-start">
          <div>
            <p className="uppercase tracking-[0.14em] text-xs font-bold">Demos el primer paso</p>
            <h2 className="nydo-display text-[clamp(3rem,6vw,5.5rem)] my-5">
              Proteger
              <br />
              tu Nydo
              <br />
              empieza aquí.
            </h2>
            <p className="max-w-xs text-sm">
              Elige el espacio y completa la cotización guiada. También puedes escribirnos por WhatsApp.
            </p>
            <ol className="list-none p-0 mt-9 space-y-5" id="proceso">
              {['Elige el espacio.', 'Indica las medidas de cada abertura.', 'Deja tus datos y te respondemos.'].map(
                (step, index) => (
                  <li key={step} className="flex items-center gap-3.5 text-sm">
                    <span className="nydo-display text-[1.75rem] w-10 h-10 grid place-items-center border border-nydo-ink rounded-full shrink-0">
                      0{index + 1}
                    </span>
                    {step}
                  </li>
                )
              )}
            </ol>
          </div>
          <div className="bg-nydo-orange rounded-[20px] p-6 sm:p-8">
            <p className="nydo-display text-4xl mb-3">Cotiza tu espacio</p>
            <p className="text-sm mb-6 max-w-md">
              Sin crear cuenta. Te respondemos por correo, teléfono o WhatsApp. El valor se confirma después de revisar
              tus medidas.
            </p>
            <div className="flex flex-col gap-3">
              {onGoToQuoteMesh && (
                <button type="button" onClick={onGoToQuoteMesh} className="nydo-btn nydo-btn-blue w-full">
                  PREPARAR MI SOLICITUD ↗
                </button>
              )}
              <a
                href={WHATSAPP_QUOTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nydo-btn nydo-btn-whatsapp w-full"
              >
                Escribir por WhatsApp
              </a>
            </div>
            <p className="text-xs mt-4">
              Las medidas son referenciales. Precio, material e instalación se confirman con Nydo Mallas.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-nydo-yellow py-12 sm:py-16">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14">
          <h2 className="nydo-display text-[clamp(3rem,6vw,5.5rem)] mb-9">Un Nydo para lo que quieres.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <article className="bg-nydo-pink rounded-2xl p-7 min-h-[220px] flex flex-col justify-between">
              <span className="nydo-display text-6xl leading-none">01 ✳</span>
              <div>
                <h3 className="nydo-display text-4xl my-3">Tu familia.</h3>
                <p className="text-sm">Piensa en los espacios que comparten grandes y pequeños.</p>
              </div>
            </article>
            <article className="bg-nydo-blue rounded-2xl p-7 min-h-[220px] flex flex-col justify-between">
              <span className="nydo-display text-6xl leading-none">02 ↗</span>
              <div>
                <h3 className="nydo-display text-4xl my-3">Tus mascotas.</h3>
                <p className="text-sm">Incluye sus rincones favoritos al planificar la protección.</p>
              </div>
            </article>
            <article className="bg-nydo-orange rounded-2xl p-7 min-h-[220px] flex flex-col justify-between">
              <span className="nydo-display text-6xl leading-none">03 ⌂</span>
              <div>
                <h3 className="nydo-display text-4xl my-3">Tu forma de vivir.</h3>
                <p className="text-sm">Una propuesta que parte por conocer tu casa y lo que necesitas.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-nydo-cream py-14 sm:py-16" id="preguntas">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14 grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10">
          <h2 className="nydo-display text-[clamp(3rem,6vw,5.5rem)]">
            Hablemos
            <br />
            sin vueltas.
          </h2>
          <div>
            {FAQ_ITEMS.map((item) => (
              <details key={item.id} className="border-b border-nydo-ink/35 py-5">
                <summary className="cursor-pointer font-bold min-h-[30px]">{item.question}</summary>
                <p className="mt-3.5 text-sm max-w-xl">{item.answer}</p>
              </details>
            ))}
            <details className="border-b border-nydo-ink/35 py-5">
              <summary className="cursor-pointer font-bold min-h-[30px]">¿Cómo preparo las medidas?</summary>
              <p className="mt-3.5 text-sm max-w-xl">
                Mide el ancho y el alto de cada abertura por separado. En la cotización guiada puedes agregar varias.
                Las medidas finales se confirman antes de instalar.
              </p>
            </details>
            {onOpenAssistant && (
              <button
                type="button"
                onClick={onOpenAssistant}
                className="mt-6 font-bold underline underline-offset-4 bg-transparent border-0 p-0 cursor-pointer"
              >
                Más preguntas frecuentes ↗
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
