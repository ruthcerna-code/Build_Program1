export type FaqItem = {
  id: 'visita' | 'instalacion' | 'cambio';
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'visita',
    question: '¿Se realizan visitas de cotización?',
    answer:
      'Sí. Realizamos visitas de cotización. Tienen un costo de $20.000, el cual se descuenta de la cotización total si contratas el servicio.',
  },
  {
    id: 'instalacion',
    question: '¿Cuánto tiempo se demora la instalación?',
    answer:
      'Depende de la cantidad de ventanas. En general nos demoramos 1 hora, sujeto a confirmación en terreno.',
  },
  {
    id: 'cambio',
    question: '¿Realizan cambio de mallas?',
    answer:
      'Sí. En un cambio de mallas solo se cobra materiales y mano de obra. Los clientes antiguos tienen 20% de descuento.',
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchFaqAnswer(query: string): FaqItem | null {
  const q = normalize(query);
  if (!q) return null;

  const has = (...parts: string[]) => parts.every((p) => q.includes(p));
  const any = (...parts: string[]) => parts.some((p) => q.includes(p));

  if (
    (any('cambio', 'cambiar', 'reemplazo', 'reemplazar', 'renovar') && any('malla', 'mallas')) ||
    has('clientes', 'antiguos') ||
    (has('descuento') && any('malla', 'cliente'))
  ) {
    return FAQ_ITEMS.find((item) => item.id === 'cambio') || null;
  }

  if (
    (any('demora', 'demoran', 'tiempo', 'duracion', 'durara', 'tardan', 'tarda') &&
      any('instal', 'instalar', 'instalan')) ||
    has('cuanto', 'demora') ||
    (any('hora', 'horas') && any('instal'))
  ) {
    return FAQ_ITEMS.find((item) => item.id === 'instalacion') || null;
  }

  if (
    any('visita', 'visitas') ||
    (has('van') && any('casa', 'depto', 'departamento', 'terreno', 'domicilio')) ||
    (has('cotizacion') && any('terreno', 'presencial'))
  ) {
    return FAQ_ITEMS.find((item) => item.id === 'visita') || null;
  }

  return null;
}
