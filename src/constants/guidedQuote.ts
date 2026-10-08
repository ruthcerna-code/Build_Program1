export const GUIDED_QUOTE_STEPS = 9;

export type WorkType = 'instalar' | 'cambiar' | 'no_se';
export type SurfaceType =
  | 'batiente_interior'
  | 'batiente_exterior'
  | 'balcon_recto'
  | 'balcon_l'
  | 'balcon_u'
  | 'no_se';
export type LengthRange = 'menos_2' | 'entre_2_5' | 'mas_5' | 'no_se';
export type HeightRange = 'menos_050' | 'entre_050_120' | 'mas_120';
export type FinishType = 'metalico' | 'lacado_blanco' | 'lacado_negro' | 'lacado_otros' | 'no_se';
export type TimelineType = 'antes_posible' | '1_a_3_meses' | 'mas_3_meses' | 'no_pensado';

export const WORK_TYPE_OPTIONS: { id: WorkType; label: string }[] = [
  { id: 'instalar', label: 'Instalar mallas de protección' },
  { id: 'cambiar', label: 'Cambiar mallas de protección' },
  { id: 'no_se', label: 'No lo sé' },
];

export const SURFACE_OPTIONS: { id: SurfaceType; label: string }[] = [
  { id: 'batiente_interior', label: 'Ventana batiente (abre hacia el interior)' },
  { id: 'batiente_exterior', label: 'Ventana batiente (abre hacia el exterior)' },
  { id: 'balcon_recto', label: 'Balcón recto' },
  { id: 'balcon_l', label: 'Balcón en forma de “L”' },
  { id: 'balcon_u', label: 'Balcón en forma de “U”' },
  { id: 'no_se', label: 'No lo sé' },
];

export const LENGTH_OPTIONS: { id: LengthRange; label: string }[] = [
  { id: 'menos_2', label: 'Menos de 2 m' },
  { id: 'entre_2_5', label: 'Entre 2 y 5 m' },
  { id: 'mas_5', label: 'Más de 5 m' },
  { id: 'no_se', label: 'No lo sé' },
];

export const HEIGHT_OPTIONS: { id: HeightRange; label: string }[] = [
  { id: 'menos_050', label: 'Menos de 0,50 m' },
  { id: 'entre_050_120', label: 'Entre 0,50 m y 1,20 m' },
  { id: 'mas_120', label: 'Más de 1,20 m' },
];

export const FINISH_OPTIONS: { id: FinishType; label: string }[] = [
  { id: 'metalico', label: 'Acabado metálico' },
  { id: 'lacado_blanco', label: 'Lacado blanco' },
  { id: 'lacado_negro', label: 'Lacado negro' },
  { id: 'lacado_otros', label: 'Lacado otros colores' },
  { id: 'no_se', label: 'No lo sé' },
];

export const TIMELINE_OPTIONS: { id: TimelineType; label: string }[] = [
  { id: 'antes_posible', label: 'Lo antes posible' },
  { id: '1_a_3_meses', label: 'De 1 a 3 meses' },
  { id: 'mas_3_meses', label: 'Más de 3 meses' },
  { id: 'no_pensado', label: 'De momento no tengo pensado hacerlo' },
];

export const TIMELINE_DISCLAIMER =
  'Esta opción es una preferencia. No reserva fecha ni confirma la instalación.';

export const FINISH_HELP =
  'El acabado se refiere al color del perfil de aluminio que sujeta la malla, no al color de la malla (la malla se mantiene transparente). En el catálogo que mostramos en el sitio, el marco se ofrece en blanco, gris (titanio) y negro. Si eliges “Lacado otros colores”, indícanos el color que prefieres; no está listado como opción estándar.';

export const SURFACE_HELP: Record<Exclude<SurfaceType, 'no_se'>, string> = {
  batiente_interior:
    'Ventana que abre hacia adentro de la habitación. La malla se evalúa en el marco, sin impedir el movimiento de las hojas hacia el interior.',
  batiente_exterior:
    'Ventana que abre hacia afuera. Hay que considerar el espacio del marco y que las hojas no choquen con la malla.',
  balcon_recto:
    'Balcón de un solo tramo, en línea recta. La longitud es el lado que se desea cubrir.',
  balcon_l:
    'Balcón con dos tramos que forman una L. La longitud es la suma de los tramos que se desean cubrir.',
  balcon_u:
    'Balcón con tres tramos que forman una U. La longitud es la suma de los tramos que se desean cubrir.',
};

export function labelOf<T extends string>(
  options: { id: T; label: string }[],
  id: T | ''
): string {
  return options.find((item) => item.id === id)?.label || '';
}
