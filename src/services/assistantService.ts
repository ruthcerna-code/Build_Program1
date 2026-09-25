import { QuoteRequest } from '../types';
import { cleanRut, formatRut, matchesRut } from '../utils/rutUtils';
import { getStoredQuotes } from './quoteStorage';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  matchedQuotesCount?: number;
  isOutOfScopeWarning?: boolean;
}

/**
 * Validates if the user query is strictly about quotes / installations / prices / technical details of their quotes.
 */
export function isQueryAboutQuotes(query: string): boolean {
  const q = query.toLowerCase();
  
  // Explicit forbidden topics / out-of-bounds queries
  const outOfBoundsPatterns = [
    'chiste', 'receta', 'cocina', 'cancion', 'cuento', 'poema',
    'quien gano', 'futbol', 'partido', 'politica', 'presidente',
    'javascript', 'python', 'programacion', 'codigo', 'chatgpt', 'openai',
    'inteligencia artificial', 'modelo de lenguaje', 'clima en', 'tiempo en',
    'horoscopo', 'pelicula', 'musica', 'capital de'
  ];

  for (const pattern of outOfBoundsPatterns) {
    if (q.includes(pattern)) {
      return false;
    }
  }

  return true;
}

/**
 * Format currency to Chilean Pesos
 */
function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Local fallback generator that strictly answers based on quotes of the given RUT.
 */
export function generateLocalAssistantResponse(
  userQuery: string,
  userRut: string,
  quotes: QuoteRequest[]
): { text: string; isOutOfScope: boolean } {
  const cleanedRut = cleanRut(userRut);
  const formattedRut = formatRut(userRut);

  // Check if query is unrelated to quotes
  if (!isQueryAboutQuotes(userQuery)) {
    return {
      text: `Como asistente de MallasSeguras, estoy facultado exclusivamente para responder información sobre las cotizaciones asociadas a su RUT (${formattedRut}).\n\nNo tengo autorización para responder consultas sobre otros temas. Para dudas generales o nuevos requerimientos, contáctanos a rcv.informacion@gmail.com o al +56 9 8000 2400.`,
      isOutOfScope: true,
    };
  }

  // Check if there are quotes for this RUT
  if (!quotes || quotes.length === 0) {
    return {
      text: `No encontramos cotizaciones registradas para el RUT **${formattedRut}**.\n\nPor favor verifica que el RUT ingresado sea el mismo utilizado al cotizar, o solicita una nueva cotización desde la opción **Cotizar Malla** en el menú superior.`,
      isOutOfScope: false,
    };
  }

  const q = userQuery.toLowerCase();
  const mainQuote = quotes[0];
  const count = quotes.length;

  // Status query
  if (q.includes('estado') || q.includes('cómo va') || q.includes('avance') || q.includes('proceso')) {
    const statusLabels: Record<string, string> = {
      pendiente: '⏳ Pendiente de evaluación técnica por administración',
      cotizada: '📋 Cotizada (Presupuesto listo y disponible)',
      aceptada: '✅ Aceptada y aprobada por el cliente',
      rechazada: '❌ Rechazada',
    };

    let reply = `Para su RUT **${formattedRut}**, encontramos **${count}** cotización(es):\n\n`;
    quotes.forEach((item, idx) => {
      reply += `**${idx + 1}. Folio ${item.folio}** (${new Date(item.createdAt).toLocaleDateString('es-CL')}):\n`;
      reply += `• **Estado actual:** ${statusLabels[item.status] || item.status}\n`;
      reply += `• **Superficie:** ${item.totalAreaM2} m² (${item.windows.length} ventanas/sectores)\n`;
      if (item.adminQuote) {
        reply += `• **Monto cotizado:** ${formatCLP(item.adminQuote.total)} CLP\n`;
      }
      if (item.installerAssignment) {
        reply += `• **Instalación:** Técnico ${item.installerAssignment.technicianName} (${item.installerAssignment.installationStatus})\n`;
      }
      reply += '\n';
    });
    return { text: reply.trim(), isOutOfScope: false };
  }

  // Price / Cost query
  if (q.includes('precio') || q.includes('cuanto') || q.includes('cuánto') || q.includes('costo') || q.includes('total') || q.includes('valor') || q.includes('pagar') || q.includes('abono')) {
    let reply = `Detalle presupuestario para el RUT **${formattedRut}**:\n\n`;
    quotes.forEach((item) => {
      reply += `**Cotización ${item.folio}:**\n`;
      if (item.adminQuote) {
        reply += `• **Total a pagar:** ${formatCLP(item.adminQuote.total)} CLP\n`;
        reply += `• **Detalle:** Malla: ${formatCLP(item.adminQuote.meshTotalCost)} | Perfiles: ${formatCLP(item.adminQuote.profilesAndFixingsCost)} | Mano de obra: ${formatCLP(item.adminQuote.laborAndInstallCost)}\n`;
        if (item.adminQuote.discountAmount > 0) {
          reply += `• **Descuento aplicado:** ${formatCLP(item.adminQuote.discountAmount)} (${item.adminQuote.discountPercentage}%)\n`;
        }
        if (item.paidAmount !== undefined && item.paidAmount > 0) {
          reply += `• **Monto pagado/abonado:** ${formatCLP(item.paidAmount)} (${item.paymentStatus || 'registrado'})\n`;
        }
      } else {
        reply += `• Esta solicitud está en proceso de cálculo por nuestro equipo técnico y pronto recibirá el presupuesto detallado.\n`;
      }
      reply += '\n';
    });
    return { text: reply.trim(), isOutOfScope: false };
  }

  // Date / Schedule / Technician query
  if (q.includes('fecha') || q.includes('cuándo') || q.includes('cuando') || q.includes('horario') || q.includes('técnico') || q.includes('tecnico') || q.includes('instalador') || q.includes('instalan')) {
    let reply = `Información de agenda e instalación para el RUT **${formattedRut}**:\n\n`;
    quotes.forEach((item) => {
      reply += `**Cotización ${item.folio}:**\n`;
      if (item.adminQuote?.confirmedInstallationDate) {
        reply += `• **Fecha confirmada:** ${item.adminQuote.confirmedInstallationDate} a las ${item.adminQuote.confirmedInstallationTime || '10:00'} hrs.\n`;
      } else {
        reply += `• **Fechas tentativas solicitadas:** Opción 1: ${item.tentativeDate1 || 'Pendiente'} (${item.tentativeTime1 || ''}) | Opción 2: ${item.tentativeDate2 || 'Pendiente'} (${item.tentativeTime2 || ''})\n`;
      }
      if (item.installerAssignment) {
        reply += `• **Técnico Asignado:** ${item.installerAssignment.technicianName} (Fono: ${item.installerAssignment.technicianPhone})\n`;
        reply += `• **Estado del técnico:** ${item.installerAssignment.installationStatus === 'instalado' ? 'Instalado ✓' : item.installerAssignment.installationStatus === 'en_camino' ? 'En camino al domicilio 🚗' : 'Por instalar 📦'}\n`;
      }
      reply += '\n';
    });
    return { text: reply.trim(), isOutOfScope: false };
  }

  // Windows / Measures / Materials query
  if (q.includes('medida') || q.includes('ventana') || q.includes('malla') || q.includes('tipo') || q.includes('material') || q.includes('metro') || q.includes('garantía') || q.includes('garantia')) {
    let reply = `Detalles técnicos de las ventanas cotizadas para el RUT **${formattedRut}**:\n\n`;
    quotes.forEach((item) => {
      reply += `**Cotización ${item.folio} (${item.totalAreaM2} m² totales):**\n`;
      item.windows.forEach((win, i) => {
        reply += `• **${win.name || `Ventana ${i + 1}`}:** ${win.width}m ancho x ${win.height}m alto = ${win.area} m² (Malla: ${win.meshType})\n`;
      });
      if (item.adminQuote?.warrantyYears) {
        reply += `• **Garantía certificada:** ${item.adminQuote.warrantyYears} años.\n`;
      }
      reply += '\n';
    });
    return { text: reply.trim(), isOutOfScope: false };
  }

  // General summary response about their quotes
  let summary = `Resumen de sus cotizaciones registradas para el RUT **${formattedRut}** (${mainQuote.clientName}):\n\n`;
  quotes.forEach((item) => {
    summary += `• **Folio ${item.folio}:** Estado: **${item.status.toUpperCase()}** | Total: ${item.totalAreaM2} m² en ${item.windows.length} ventana(s)`;
    if (item.adminQuote) {
      summary += ` | Presupuesto: ${formatCLP(item.adminQuote.total)} CLP`;
    }
    if (item.adminQuote?.confirmedInstallationDate) {
      summary += ` | Instalación: ${item.adminQuote.confirmedInstallationDate}`;
    }
    summary += '\n';
  });
  summary += `\n¿Desea consultar detalles específicos sobre el presupuesto, las medidas de las ventanas o la fecha de instalación?`;
  return { text: summary, isOutOfScope: false };
}

/**
 * Sends a message to the backend assistant endpoint (/api/assistant/chat),
 * falling back to local grounded responses if backend is unavailable.
 */
export async function askClientAssistant(
  userQuery: string,
  userRut: string,
  allQuotes: QuoteRequest[],
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<AssistantMessage> {
  const cleanedRut = cleanRut(userRut);
  const matchedQuotes = allQuotes.filter((q) => matchesRut(q.clientRut, cleanedRut));

  try {
    const response = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rut: userRut,
        query: userQuery,
        quotes: matchedQuotes,
        history: conversationHistory.slice(-6),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.reply) {
        return {
          id: 'msg-' + Date.now(),
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toISOString(),
          matchedQuotesCount: matchedQuotes.length,
          isOutOfScopeWarning: data.isOutOfScope,
        };
      }
    }
  } catch (err) {
    console.warn('Backend assistant endpoint unreachable, generating local grounded reply:', err);
  }

  // Fallback grounded answer strictly keyed to RUT
  const localResult = generateLocalAssistantResponse(userQuery, userRut, matchedQuotes);
  return {
    id: 'msg-' + Date.now(),
    sender: 'assistant',
    text: localResult.text,
    timestamp: new Date().toISOString(),
    matchedQuotesCount: matchedQuotes.length,
    isOutOfScopeWarning: localResult.isOutOfScope,
  };
}
