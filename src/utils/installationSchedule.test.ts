import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIcs,
  formatSlot,
  normalizeDate,
  normalizeTime,
  scheduleSlot,
  scheduleWhatsappText,
  scheduleWhatsappUrl,
  slotToUtc,
  whatsappNumber,
} from './installationSchedule';

test('normaliza fechas y horas en formatos comunes', () => {
  assert.equal(normalizeDate('2026-12-03'), '2026-12-03');
  assert.equal(normalizeDate('3/12/2026'), '2026-12-03');
  assert.equal(normalizeDate('03-12-2026'), '2026-12-03');
  assert.equal(normalizeDate('A coordinar'), null);
  assert.equal(normalizeTime('9:30'), '09:30');
  assert.equal(normalizeTime('10:00 hrs'), '10:00');
  assert.equal(normalizeTime('25:00'), null);
  assert.deepEqual(scheduleSlot('2026-12-03', ''), { date: '2026-12-03', time: '10:00' });
});

test('convierte la hora de Santiago a UTC en verano e invierno', () => {
  // Diciembre: horario de verano de Chile (UTC-3).
  assert.equal(slotToUtc({ date: '2026-12-03', time: '10:00' }).toISOString(), '2026-12-03T13:00:00.000Z');
  // Julio: horario de invierno (UTC-4).
  assert.equal(slotToUtc({ date: '2026-07-15', time: '10:00' }).toISOString(), '2026-07-15T14:00:00.000Z');
});

test('arma la invitación con inicio, fin de 2 h y asistente', () => {
  const ics = buildIcs({
    uid: 'nydo-1@nydo.cl',
    slot: { date: '2026-12-03', time: '10:00' },
    title: 'Instalación de mallas',
    description: 'Cotización N° 1, con coma',
    location: 'Av. Siempre Viva 123, Maipú',
    organizerEmail: 'nydo.mallas@gmail.com',
    attendeeEmail: 'cliente@example.com',
  });
  assert.match(ics, /DTSTART:20261203T130000Z/);
  assert.match(ics, /DTEND:20261203T150000Z/);
  assert.match(ics, /LOCATION:Av. Siempre Viva 123\\, Maipú/);
  assert.match(ics, /ATTENDEE;.*mailto:cliente@example.com/);
  assert.ok(ics.includes('\r\n'));
});

test('normaliza celulares chilenos para WhatsApp', () => {
  assert.equal(whatsappNumber('+56 9 4746 0606'), '56947460606');
  assert.equal(whatsappNumber('947460606'), '56947460606');
  assert.equal(whatsappNumber('4746 0606'), '56947460606');
  assert.equal(whatsappNumber('22 123 4567'), null);
  assert.equal(scheduleWhatsappUrl('abc', 'hola'), null);
});

test('el mensaje de WhatsApp incluye fecha y dirección', () => {
  const slot = { date: '2026-12-03', time: '10:00' };
  const text = scheduleWhatsappText('María Pérez', slot, 'Av. Siempre Viva 123, Maipú');
  assert.match(text, /^Hola María,/);
  assert.ok(text.includes(formatSlot(slot)));
  assert.ok(text.includes('Av. Siempre Viva 123, Maipú'));
  const url = scheduleWhatsappUrl('+56 9 1234 5678', text)!;
  assert.ok(url.startsWith('https://wa.me/56912345678?text='));
  assert.match(scheduleWhatsappText('', null, ''), /coordinar el día y la hora/);
});
