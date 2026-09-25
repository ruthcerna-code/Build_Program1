import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!ai,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Assistant Chat Endpoint
 * Strictly answers only based on the quotes requested by the user's RUT.
 */
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { rut, query, quotes = [], history = [] } = req.body;

    if (!rut || typeof rut !== 'string' || !rut.trim()) {
      return res.status(400).json({
        error: 'Debe proporcionar un RUT para consultar al asistente.',
        reply: 'Por favor ingrese su RUT chileno para consultar información sobre sus cotizaciones.',
      });
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        error: 'Debe ingresar una pregunta o mensaje.',
      });
    }

    const cleanRut = rut.trim();

    // If Gemini client is not configured, fall back to structured grounded answer
    if (!ai) {
      console.warn('Gemini API key not found on server, fallback to local grounded responder.');
      return res.json({
        reply: `Como asistente de MallasSeguras, estoy facultado exclusivamente para responder información sobre las cotizaciones asociadas a su RUT (${cleanRut}). (Modo local activo)`,
        fallback: true,
      });
    }

    // System prompt enforcing strict adherence to user's quotes by RUT
    const systemInstruction = `Eres el Asistente Oficial y Exclusivo de Cotizaciones para Clientes de MallasSeguras (empresa líder en Chile en mallas invisibles de seguridad y protección para ventanas, balcones y terrazas).

REGLA ESTRICTA E INQUEBRANTABLE DE SEGURIDAD Y ALCANCE:
1. Tu ÚNICA competencia es responder dudas sobre las cotizaciones solicitadas por el RUT del usuario: "${cleanRut}".
2. Te proporcionamos la lista completa de cotizaciones pertenecientes a este RUT en el contexto JSON.
3. Si el usuario te hace preguntas sobre CUALQUIER otro tema ajeno a sus cotizaciones (por ejemplo: cocina, recetas, chistes, fútbol, política, opiniones personales, programación, clima, tareas escolares, o cotizaciones de otras personas), TIENES ESTRICTAMENTE PROHIBIDO responder sobre ese tema ajeno. En ese caso, debes responder CORTÉS Y TAXATIVAMENTE:
"Como asistente de MallasSeguras, estoy facultado exclusivamente para responder información sobre las cotizaciones asociadas a su RUT (${cleanRut}). Para consultas generales o solicitar una nueva cotización, por favor comuníquese a rcv.informacion@gmail.com o al +56 9 8000 2400."
4. Si la lista de cotizaciones provista para este RUT está vacía, infórmale amablemente que no existen cotizaciones registradas para el RUT ${cleanRut}, y sugiérele revisar el RUT o solicitar una nueva cotización desde el botón "Cotizar Malla".
5. Si existen cotizaciones para este RUT:
   - Responde con tono profesional, cálido, claro y conciso en español de Chile.
   - Detalla folios (ej: COT-2026-1048), estado ('pendiente', 'cotizada', 'aceptada', 'rechazada'), medidas de ventanas, m² totales, tipo de malla (monofilamento/multifilamento), fechas de instalación, horas tentativas, datos del técnico asignado (nombre, teléfono, estado) y montos presupuestados en pesos chilenos ($ CLP).
   - Usa formato limpio con negritas y viñetas para que la lectura sea ágil y agradable.`;

    const userPrompt = `RUT DEL CLIENTE EN SESIÓN: ${cleanRut}

COTIZACIONES REGISTRADAS PARA ESTE RUT (DATOS REALES DEL CLIENTE):
${JSON.stringify(quotes, null, 2)}

HISTORIAL RECIENTE DE LA CONVERSACIÓN:
${history.map((h: any) => `${h.role === 'user' ? 'Cliente' : 'Asistente'}: ${h.content}`).join('\n')}

PREGUNTA ACTUAL DEL CLIENTE:
"${query}"

Recuerda: Responde ÚNICAMENTE en función de las cotizaciones de este RUT. Si la pregunta no se relaciona con sus cotizaciones de mallas, rechaza responder educadamente de acuerdo a la instrucción.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const reply = response.text || 'No pude procesar la respuesta en este momento.';

    return res.json({
      reply,
      rut: cleanRut,
      quotesCount: quotes.length,
    });
  } catch (error: any) {
    console.error('Gemini API call noticed error or spike, using server grounded fallback:', error);
    
    // Server-side fallback strictly answering based on the user's quotes
    const { rut = '', query = '', quotes = [] } = req.body;
    const cleanRut = String(rut).trim();
    const qLower = String(query).toLowerCase();

    // Check if query is unrelated to quotes
    const outOfBoundsPatterns = [
      'chiste', 'receta', 'cocina', 'cancion', 'cuento', 'poema',
      'quien gano', 'futbol', 'partido', 'politica', 'presidente',
      'javascript', 'python', 'programacion', 'codigo', 'chatgpt', 'openai',
      'inteligencia artificial', 'modelo de lenguaje', 'clima en', 'tiempo en',
      'horoscopo', 'pelicula', 'musica', 'capital de'
    ];

    for (const pattern of outOfBoundsPatterns) {
      if (qLower.includes(pattern)) {
        return res.json({
          reply: `Como asistente de MallasSeguras, estoy facultado exclusivamente para responder información sobre las cotizaciones asociadas a su RUT (${cleanRut}). Para consultas generales, por favor comuníquese a rcv.informacion@gmail.com o al +56 9 8000 2400.`,
          rut: cleanRut,
          isOutOfScope: true,
        });
      }
    }

    if (!quotes || quotes.length === 0) {
      return res.json({
        reply: `No encontramos cotizaciones registradas para el RUT **${cleanRut}**. Por favor verifica el RUT ingresado o solicita una nueva cotización en línea.`,
        rut: cleanRut,
        quotesCount: 0,
      });
    }

    const first = quotes[0];
    let reply = `Información de sus cotizaciones para el RUT **${cleanRut}** (${first.clientName}):\n\n`;
    quotes.forEach((item: any, idx: number) => {
      reply += `**${idx + 1}. Folio ${item.folio}:**\n`;
      reply += `• **Estado:** ${item.status}\n`;
      reply += `• **Medidas:** ${item.totalAreaM2} m² (${item.windows?.length || 0} ventanas)\n`;
      if (item.adminQuote) {
        reply += `• **Total:** $${Number(item.adminQuote.total || 0).toLocaleString('es-CL')} CLP\n`;
        if (item.adminQuote.confirmedInstallationDate) {
          reply += `• **Instalación agendada:** ${item.adminQuote.confirmedInstallationDate} (${item.adminQuote.confirmedInstallationTime || '10:00'} hrs)\n`;
        }
      }
      if (item.installerAssignment) {
        reply += `• **Técnico:** ${item.installerAssignment.technicianName} (${item.installerAssignment.installationStatus})\n`;
      }
      reply += '\n';
    });

    return res.json({
      reply: reply.trim(),
      rut: cleanRut,
      quotesCount: quotes.length,
      fallback: true,
    });
  }
});

// Setup dev server with Vite middlewares or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
