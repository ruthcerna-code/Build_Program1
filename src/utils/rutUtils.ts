/**
 * Utility functions for Chilean RUT handling, validation, formatting and matching.
 */

export function cleanRut(rut?: string | null): string {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(rut?: string | null): string {
  const cleaned = cleanRut(rut);
  if (!cleaned || cleaned.length < 2) return cleaned || '';
  const dv = cleaned.slice(-1);
  const cuerpo = cleaned.slice(0, -1);

  // Format with thousand dots
  let formattedCuerpo = '';
  for (let i = cuerpo.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedCuerpo = '.' + formattedCuerpo;
    }
    formattedCuerpo = cuerpo[i] + formattedCuerpo;
  }
  return `${formattedCuerpo}-${dv}`;
}

export function validateRut(rut?: string | null): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 7 || cleaned.length > 9) return false;

  const cuerpo = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // Calculate Chilean modulo 11
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  let dvCalculado = '';
  if (dvEsperado === 11) dvCalculado = '0';
  else if (dvEsperado === 10) dvCalculado = 'K';
  else dvCalculado = dvEsperado.toString();

  return dvCalculado === dv;
}

export function matchesRut(rutA?: string | null, rutB?: string | null): boolean {
  if (!rutA || !rutB) return false;
  return cleanRut(rutA) === cleanRut(rutB);
}
