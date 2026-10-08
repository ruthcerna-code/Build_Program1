// server/createApiApp.ts
import express from "express";

// server/config.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
var ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "ruth.cerna@gmail.com").trim().toLowerCase();
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
var CONTACT_TO_EMAIL = (process.env.CONTACT_TO_EMAIL || "nydo.mallas@gmail.com").trim().toLowerCase();
var QUOTE_COPY_EMAIL = (process.env.QUOTE_COPY_EMAIL || "nydo.mallas@gmail.com").trim().toLowerCase();
var FORMSUBMIT_COMPANY_ID = (process.env.FORMSUBMIT_COMPANY_ID || "6312175e06725a0677d2696caf1892c6").trim();
var SESSION_SECRET = process.env.SESSION_SECRET || "";
var GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "").trim();
var SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
var SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
var RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
var MAIL_FROM = (process.env.MAIL_FROM || "Nydo Mallas <onboarding@resend.dev>").trim();
var SITE_URL = (process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")).replace(/\/$/, "");
function isPrincipalAdmin(email) {
  return (email || "").trim().toLowerCase() === ADMIN_EMAIL;
}
function missingServerConfig() {
  const missing = [];
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) missing.push("SESSION_SECRET");
  if (!SUPABASE_URL) missing.push("SUPABASE_URL o VITE_SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

// server/session.ts
import crypto2 from "crypto";

// server/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";
var admin = null;
function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!admin) {
    admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return admin;
}
function requireAdminClient() {
  const client = getAdminClient();
  if (!client) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Sin esa clave no se pueden consultar ni guardar registros en la nube."
    );
  }
  return client;
}

// server/passwords.ts
import crypto from "crypto";
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  if (!password || !stored) return false;
  if (!stored.includes(":")) {
    return safeEqual(password, stored);
  }
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  return safeEqual(hash, check);
}
function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

// server/session.ts
var EMPTY_PERMS = {
  viewQuotes: false,
  editQuotes: false,
  deleteQuotes: false,
  viewSales: false
};
var ADMIN_PERMS = {
  viewQuotes: true,
  editQuotes: true,
  deleteQuotes: true,
  viewSales: true
};
function sign(payload) {
  if (!SESSION_SECRET) return "";
  return crypto2.createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}
function createSessionToken(user) {
  const body = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + 12 * 60 * 60 * 1e3 })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}
function readSessionToken(token) {
  if (!token || !SESSION_SECRET) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || sign(body) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!data?.email || !data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
function getBearerToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}
async function resolveRole(email, name) {
  const normalized = email.trim().toLowerCase();
  if (isPrincipalAdmin(normalized)) {
    return {
      email: normalized,
      name: name || "Administradora",
      role: "admin",
      permissions: ADMIN_PERMS,
      active: true,
      emailVerified: true
    };
  }
  const admin2 = getAdminClient();
  if (admin2) {
    const { data } = await admin2.from("internal_users").select("*").eq("email", normalized).maybeSingle();
    if (data) {
      return {
        email: normalized,
        name: data.full_name || name,
        role: "interno",
        permissions: {
          viewQuotes: !!data.can_view_quotes,
          editQuotes: !!data.can_edit_quotes,
          deleteQuotes: !!data.can_delete_quotes,
          viewSales: !!data.can_view_sales
        },
        active: data.active !== false,
        emailVerified: true
      };
    }
  }
  return {
    email: normalized,
    name: name || normalized.split("@")[0],
    role: "cliente",
    permissions: EMPTY_PERMS,
    active: true,
    emailVerified: true
  };
}
async function authenticateWithPassword(email, password) {
  const normalized = email.trim().toLowerCase();
  const pass = password.trim();
  if (!normalized || !pass) {
    throw new Error("Ingresa tu correo y tu contrase\xF1a.");
  }
  if (isPrincipalAdmin(normalized)) {
    if (!safeEqual(pass, ADMIN_PASSWORD)) {
      throw new Error("Correo o contrase\xF1a incorrectos.");
    }
    return resolveRole(normalized, "Ruth Cerna");
  }
  const admin2 = getAdminClient();
  if (!admin2) {
    throw new Error("No hay una cuenta creada para ese correo.");
  }
  const { data: internal } = await admin2.from("internal_users").select("*").eq("email", normalized).maybeSingle();
  if (!internal) {
    throw new Error("No hay una cuenta creada para ese correo. Pide a la administradora que te registre.");
  }
  if (internal.active === false) {
    throw new Error("Tu acceso est\xE1 desactivado. Pide ayuda a la administradora.");
  }
  let storedHash = String(internal.password_hash || "");
  if (!storedHash) {
    const { data: appUser } = await admin2.from("app_users").select("password_hash").eq("email", normalized).maybeSingle();
    storedHash = String(appUser?.password_hash || "");
  }
  if (!verifyPassword(pass, storedHash)) {
    throw new Error("Correo o contrase\xF1a incorrectos.");
  }
  return resolveRole(normalized, internal.full_name || normalized.split("@")[0]);
}
function requireSession(req, res, next) {
  const user = readSessionToken(getBearerToken(req));
  if (!user) {
    return res.status(401).json({
      error: "Debes iniciar sesi\xF3n para continuar."
    });
  }
  if (user.active === false) {
    return res.status(403).json({
      error: "Tu acceso est\xE1 desactivado. Pide ayuda a la administradora."
    });
  }
  req.sessionUser = user;
  next();
}
function getSessionUser(req) {
  return req.sessionUser || readSessionToken(getBearerToken(req));
}
function requirePrincipalAdmin(req, res, next) {
  const user = getSessionUser(req);
  if (!user || !isPrincipalAdmin(user.email)) {
    return res.status(403).json({
      error: "Solo la administradora principal puede hacer esta acci\xF3n."
    });
  }
  next();
}
function sessionToAccount(user) {
  return {
    id: `user-${user.email}`,
    email: user.email,
    passwordHash: "",
    fullName: user.name,
    role: user.role,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    active: user.active,
    permissions: user.permissions,
    authProvider: "password"
  };
}

// src/constants/guidedQuote.ts
var WORK_TYPE_OPTIONS = [
  { id: "instalar", label: "Instalar mallas de protecci\xF3n" },
  { id: "cambiar", label: "Cambiar mallas de protecci\xF3n" },
  { id: "no_se", label: "No lo s\xE9" }
];
var SURFACE_OPTIONS = [
  { id: "batiente_interior", label: "Ventana batiente (abre hacia el interior)" },
  { id: "batiente_exterior", label: "Ventana batiente (abre hacia el exterior)" },
  { id: "balcon_recto", label: "Balc\xF3n recto" },
  { id: "balcon_l", label: "Balc\xF3n en forma de \u201CL\u201D" },
  { id: "balcon_u", label: "Balc\xF3n en forma de \u201CU\u201D" },
  { id: "no_se", label: "No lo s\xE9" }
];
var LENGTH_OPTIONS = [
  { id: "menos_2", label: "Menos de 2 m" },
  { id: "entre_2_5", label: "Entre 2 y 5 m" },
  { id: "mas_5", label: "M\xE1s de 5 m" },
  { id: "no_se", label: "No lo s\xE9" }
];
var HEIGHT_OPTIONS = [
  { id: "menos_050", label: "Menos de 0,50 m" },
  { id: "entre_050_120", label: "Entre 0,50 m y 1,20 m" },
  { id: "mas_120", label: "M\xE1s de 1,20 m" }
];
var FINISH_OPTIONS = [
  { id: "metalico", label: "Acabado met\xE1lico" },
  { id: "lacado_blanco", label: "Lacado blanco" },
  { id: "lacado_negro", label: "Lacado negro" },
  { id: "lacado_otros", label: "Lacado otros colores" },
  { id: "no_se", label: "No lo s\xE9" }
];
var TIMELINE_OPTIONS = [
  { id: "antes_posible", label: "Lo antes posible" },
  { id: "1_a_3_meses", label: "De 1 a 3 meses" },
  { id: "mas_3_meses", label: "M\xE1s de 3 meses" },
  { id: "no_pensado", label: "De momento no tengo pensado hacerlo" }
];
function labelOf(options, id) {
  return options.find((item) => item.id === id)?.label || "";
}

// src/constants/chileRegions.ts
var CHILE_REGIONS = [
  {
    code: "XV",
    name: "Arica y Parinacota",
    communes: ["Arica", "Camarones", "Putre", "General Lagos"]
  },
  {
    code: "I",
    name: "Tarapac\xE1",
    communes: ["Iquique", "Alto Hospicio", "Pozo Almonte", "Cami\xF1a", "Colchane", "Huara", "Pica"]
  },
  {
    code: "II",
    name: "Antofagasta",
    communes: [
      "Antofagasta",
      "Mejillones",
      "Sierra Gorda",
      "Taltal",
      "Calama",
      "Ollag\xFCe",
      "San Pedro de Atacama",
      "Tocopilla",
      "Mar\xEDa Elena"
    ]
  },
  {
    code: "III",
    name: "Atacama",
    communes: [
      "Copiap\xF3",
      "Caldera",
      "Tierra Amarilla",
      "Cha\xF1aral",
      "Diego de Almagro",
      "Vallenar",
      "Alto del Carmen",
      "Freirina",
      "Huasco"
    ]
  },
  {
    code: "IV",
    name: "Coquimbo",
    communes: [
      "La Serena",
      "Coquimbo",
      "Andacollo",
      "La Higuera",
      "Paiguano",
      "Vicu\xF1a",
      "Illapel",
      "Canela",
      "Los Vilos",
      "Salamanca",
      "Ovalle",
      "Combarbal\xE1",
      "Monte Patria",
      "Punitaqui",
      "R\xEDo Hurtado"
    ]
  },
  {
    code: "V",
    name: "Valpara\xEDso",
    communes: [
      "Valpara\xEDso",
      "Casablanca",
      "Conc\xF3n",
      "Juan Fern\xE1ndez",
      "Puchuncav\xED",
      "Quintero",
      "Vi\xF1a del Mar",
      "Isla de Pascua",
      "Los Andes",
      "Calle Larga",
      "Rinconada",
      "San Esteban",
      "La Ligua",
      "Cabildo",
      "Papudo",
      "Petorca",
      "Zapallar",
      "Quillota",
      "Calera",
      "Hijuelas",
      "La Cruz",
      "Nogales",
      "San Antonio",
      "Algarrobo",
      "Cartagena",
      "El Quisco",
      "El Tabo",
      "Santo Domingo",
      "San Felipe",
      "Catemu",
      "Llaillay",
      "Panquehue",
      "Putaendo",
      "Santa Mar\xEDa",
      "Quilpu\xE9",
      "Limache",
      "Olmu\xE9",
      "Villa Alemana"
    ]
  },
  {
    code: "RM",
    name: "Metropolitana de Santiago",
    communes: [
      "Cerrillos",
      "Cerro Navia",
      "Conchal\xED",
      "El Bosque",
      "Estaci\xF3n Central",
      "Huechuraba",
      "Independencia",
      "La Cisterna",
      "La Florida",
      "La Granja",
      "La Pintana",
      "La Reina",
      "Las Condes",
      "Lo Barnechea",
      "Lo Espejo",
      "Lo Prado",
      "Macul",
      "Maip\xFA",
      "\xD1u\xF1oa",
      "Pedro Aguirre Cerda",
      "Pe\xF1alol\xE9n",
      "Providencia",
      "Pudahuel",
      "Quilicura",
      "Quinta Normal",
      "Recoleta",
      "Renca",
      "San Joaqu\xEDn",
      "San Miguel",
      "San Ram\xF3n",
      "Santiago",
      "Vitacura",
      "Puente Alto",
      "Pirque",
      "San Jos\xE9 de Maipo",
      "Colina",
      "Lampa",
      "Tiltil",
      "San Bernardo",
      "Buin",
      "Calera de Tango",
      "Paine",
      "Melipilla",
      "Alhu\xE9",
      "Curacav\xED",
      "Mar\xEDa Pinto",
      "San Pedro",
      "Talagante",
      "El Monte",
      "Isla de Maipo",
      "Padre Hurtado",
      "Pe\xF1aflor"
    ]
  },
  {
    code: "VI",
    name: "O'Higgins",
    communes: [
      "Rancagua",
      "Codegua",
      "Coinco",
      "Coltauco",
      "Do\xF1ihue",
      "Graneros",
      "Las Cabras",
      "Machal\xED",
      "Malloa",
      "Mostazal",
      "Olivar",
      "Peumo",
      "Pichidegua",
      "Quinta de Tilcoco",
      "Rengo",
      "Requ\xEDnoa",
      "San Vicente",
      "Pichilemu",
      "La Estrella",
      "Litueche",
      "Marchihue",
      "Navidad",
      "Paredones",
      "San Fernando",
      "Ch\xE9pica",
      "Chimbarongo",
      "Lolol",
      "Nancagua",
      "Palmilla",
      "Peralillo",
      "Placilla",
      "Pumanque",
      "Santa Cruz"
    ]
  },
  {
    code: "VII",
    name: "Maule",
    communes: [
      "Talca",
      "Constituci\xF3n",
      "Curepto",
      "Empedrado",
      "Maule",
      "Pelarco",
      "Pencahue",
      "R\xEDo Claro",
      "San Clemente",
      "San Rafael",
      "Cauquenes",
      "Chanco",
      "Pelluhue",
      "Curic\xF3",
      "Huala\xF1\xE9",
      "Licant\xE9n",
      "Molina",
      "Rauco",
      "Romeral",
      "Sagrada Familia",
      "Teno",
      "Vichuqu\xE9n",
      "Linares",
      "Colb\xFAn",
      "Longav\xED",
      "Parral",
      "Retiro",
      "San Javier",
      "Villa Alegre",
      "Yerbas Buenas"
    ]
  },
  {
    code: "XVI",
    name: "\xD1uble",
    communes: [
      "Chill\xE1n",
      "Bulnes",
      "Chill\xE1n Viejo",
      "El Carmen",
      "Pemuco",
      "Pinto",
      "Quill\xF3n",
      "San Ignacio",
      "Yungay",
      "Quirihue",
      "Cobquecura",
      "Coelemu",
      "Ninhue",
      "Portezuelo",
      "R\xE1nquil",
      "Treguaco",
      "San Carlos",
      "Coihueco",
      "\xD1iqu\xE9n",
      "San Fabi\xE1n",
      "San Nicol\xE1s"
    ]
  },
  {
    code: "VIII",
    name: "Biob\xEDo",
    communes: [
      "Concepci\xF3n",
      "Coronel",
      "Chiguayante",
      "Florida",
      "Hualp\xE9n",
      "Hualqui",
      "Lota",
      "Penco",
      "San Pedro de la Paz",
      "Santa Juana",
      "Talcahuano",
      "Tom\xE9",
      "Lebu",
      "Arauco",
      "Ca\xF1ete",
      "Contulmo",
      "Curanilahue",
      "Los \xC1lamos",
      "Tir\xFAa",
      "Los \xC1ngeles",
      "Antuco",
      "Cabrero",
      "Laja",
      "Mulch\xE9n",
      "Nacimiento",
      "Negrete",
      "Quilaco",
      "Quilleco",
      "San Rosendo",
      "Santa B\xE1rbara",
      "Tucapel",
      "Yumbel",
      "Alto Biob\xEDo"
    ]
  },
  {
    code: "IX",
    name: "La Araucan\xEDa",
    communes: [
      "Temuco",
      "Carahue",
      "Cholchol",
      "Cunco",
      "Curarrehue",
      "Freire",
      "Galvarino",
      "Gorbea",
      "Lautaro",
      "Loncoche",
      "Melipeuco",
      "Nueva Imperial",
      "Padre Las Casas",
      "Perquenco",
      "Pitrufqu\xE9n",
      "Puc\xF3n",
      "Saavedra",
      "Teodoro Schmidt",
      "Tolt\xE9n",
      "Vilc\xFAn",
      "Villarrica",
      "Angol",
      "Collipulli",
      "Curacaut\xEDn",
      "Ercilla",
      "Lonquimay",
      "Los Sauces",
      "Lumaco",
      "Pur\xE9n",
      "Renaico",
      "Traigu\xE9n",
      "Victoria"
    ]
  },
  {
    code: "XIV",
    name: "Los R\xEDos",
    communes: [
      "Valdivia",
      "Corral",
      "Lanco",
      "Los Lagos",
      "M\xE1fil",
      "Mariquina",
      "Paillaco",
      "Panguipulli",
      "La Uni\xF3n",
      "Futrono",
      "Lago Ranco",
      "R\xEDo Bueno"
    ]
  },
  {
    code: "X",
    name: "Los Lagos",
    communes: [
      "Puerto Montt",
      "Calbuco",
      "Cocham\xF3",
      "Fresia",
      "Frutillar",
      "Los Muermos",
      "Llanquihue",
      "Maull\xEDn",
      "Puerto Varas",
      "Castro",
      "Ancud",
      "Chonchi",
      "Curaco de V\xE9lez",
      "Dalcahue",
      "Puqueld\xF3n",
      "Queil\xE9n",
      "Quell\xF3n",
      "Quemchi",
      "Quinchao",
      "Osorno",
      "Puerto Octay",
      "Purranque",
      "Puyehue",
      "R\xEDo Negro",
      "San Juan de la Costa",
      "San Pablo",
      "Chait\xE9n",
      "Futaleuf\xFA",
      "Hualaihu\xE9",
      "Palena"
    ]
  },
  {
    code: "XI",
    name: "Ays\xE9n",
    communes: [
      "Coyhaique",
      "Lago Verde",
      "Ays\xE9n",
      "Cisnes",
      "Guaitecas",
      "Cochrane",
      "O\u2019Higgins",
      "Tortel",
      "Chile Chico",
      "R\xEDo Ib\xE1\xF1ez"
    ]
  },
  {
    code: "XII",
    name: "Magallanes",
    communes: [
      "Punta Arenas",
      "Laguna Blanca",
      "R\xEDo Verde",
      "San Gregorio",
      "Cabo de Hornos",
      "Ant\xE1rtica",
      "Porvenir",
      "Primavera",
      "Timaukel",
      "Natales",
      "Torres del Paine"
    ]
  }
];
function getRegionByCode(code) {
  return CHILE_REGIONS.find((region) => region.code === code);
}
function isValidRegionCommune(regionCode, commune) {
  const region = getRegionByCode(regionCode);
  return !!region && region.communes.includes(commune);
}

// src/utils/windowMeasures.ts
function parsePositiveCm(raw) {
  const n = Number(String(raw ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}
function areaM2FromCm(widthCm, heightCm) {
  return widthCm / 100 * (heightCm / 100);
}
function formatAreaM2(area) {
  return (Math.round((area + 1e-10) * 100) / 100).toFixed(2);
}
function isBalconySurface(surface) {
  return surface === "balcon_recto" || surface === "balcon_l" || surface === "balcon_u";
}
function itemNoun(surface, plural = false) {
  if (isBalconySurface(surface)) return plural ? "pa\xF1os" : "pa\xF1o";
  return plural ? "ventanas" : "ventana";
}
function itemTitle(surface, index) {
  const n = index + 1;
  return isBalconySurface(surface) ? `Pa\xF1o ${n}` : `Ventana ${n}`;
}
function toStoredWindow(draft, order, fallbackName) {
  const widthCm = parsePositiveCm(draft.widthCm);
  const heightCm = parsePositiveCm(draft.heightCm);
  if (widthCm == null) {
    return { error: `${fallbackName}: ingresa un ancho mayor a cero.` };
  }
  if (heightCm == null) {
    return { error: `${fallbackName}: ingresa un alto mayor a cero.` };
  }
  const area = areaM2FromCm(widthCm, heightCm);
  const meshType = "monofilamento";
  return {
    id: draft.id || `win-${order}-${Date.now()}`,
    name: draft.name.trim() || fallbackName,
    width: widthCm / 100,
    height: heightCm / 100,
    unit: "cm",
    meshType,
    area,
    order,
    widthCm,
    heightCm
  };
}
function displayCm(storedCm, value, unit) {
  if (typeof storedCm === "number" && Number.isFinite(storedCm) && storedCm > 0) return storedCm;
  if (unit === "cm" && value > 10) return value;
  return value * 100;
}
function displayWidthCm(win) {
  return displayCm(win.widthCm, win.width, win.unit);
}
function displayHeightCm(win) {
  return displayCm(win.heightCm, win.height, win.unit);
}

// server/guidedQuote.ts
var WORK = new Set(WORK_TYPE_OPTIONS.map((o) => o.id));
var SURFACE = new Set(SURFACE_OPTIONS.map((o) => o.id));
var LENGTH = new Set(LENGTH_OPTIONS.map((o) => o.id));
var HEIGHT = new Set(HEIGHT_OPTIONS.map((o) => o.id));
var FINISH = new Set(FINISH_OPTIONS.map((o) => o.id));
var TIMELINE = new Set(TIMELINE_OPTIONS.map((o) => o.id));
function validateGuidedQuote(body) {
  const regionCode = String(body.regionCode || "");
  const commune = String(body.commune || "");
  if (!getRegionByCode(regionCode) || !isValidRegionCommune(regionCode, commune)) {
    return "Selecciona una regi\xF3n y una comuna v\xE1lidas.";
  }
  if (!WORK.has(body.workType)) return "Elige qu\xE9 necesitas.";
  if (!SURFACE.has(body.surfaceType)) return "Elige el tipo de superficie.";
  if (!LENGTH.has(body.lengthRange)) return "Elige la longitud.";
  if (!HEIGHT.has(body.heightRange)) return "Elige la altura.";
  if (!FINISH.has(body.finishType)) return "Elige el tipo de acabado.";
  if (body.finishType === "lacado_otros" && !String(body.finishColor || "").trim()) {
    return "Indica el color que prefieres.";
  }
  if (!TIMELINE.has(body.timeline)) return "Elige un plazo.";
  if (!String(body.name || "").trim()) return "Ingresa tu nombre.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email || "").trim())) return "Ingresa un correo v\xE1lido.";
  if (String(body.phone || "").replace(/\D/g, "").length < 8) return "Ingresa un tel\xE9fono v\xE1lido.";
  if (body.acceptedTerms !== true) return "Debes aceptar la Pol\xEDtica de Privacidad y los T\xE9rminos de uso.";
  const windowsResult = parseGuidedWindows(body.windows, body.surfaceType);
  if ("error" in windowsResult) return windowsResult.error;
  return null;
}
function parseGuidedWindows(raw, surface) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "Agrega al menos una ventana o pa\xF1o con sus medidas." };
  }
  const windows = [];
  let total = 0;
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] || {};
    const draft = {
      id: String(item.id || `win-${i + 1}`),
      name: String(item.name || ""),
      widthCm: String(item.widthCm ?? ""),
      heightCm: String(item.heightCm ?? "")
    };
    const stored = toStoredWindow(draft, i + 1, itemTitle(surface, i));
    if ("error" in stored) return { error: stored.error };
    windows.push(stored);
    total += stored.area;
  }
  return { windows, totalAreaM2: total };
}
function buildGuidedQuoteRecord(body, ownerEmail, ownerName) {
  const region = getRegionByCode(String(body.regionCode));
  const finishType = body.finishType;
  const finishColor = finishType === "lacado_otros" ? String(body.finishColor || "").trim() : void 0;
  const guided = {
    regionCode: region.code,
    regionName: region.name,
    commune: String(body.commune),
    workType: body.workType,
    surfaceType: body.surfaceType,
    lengthRange: body.lengthRange,
    heightRange: body.heightRange,
    finishType,
    finishColor,
    timeline: body.timeline,
    acceptedTerms: true,
    commercialOptIn: !!body.commercialOptIn
  };
  const parsedWindows = parseGuidedWindows(body.windows, guided.surfaceType);
  if ("error" in parsedWindows) {
    throw new Error(parsedWindows.error);
  }
  const windowLines = parsedWindows.windows.map((win, i) => {
    const label = itemTitle(guided.surfaceType, i);
    return `${label}${win.name && win.name !== label ? ` (${win.name})` : ""}: ${win.widthCm} cm \xD7 ${win.heightCm} cm = ${formatAreaM2(win.area)} m\xB2`;
  });
  const summary = [
    "Solicitud guiada (sin precio; medidas por rangos). Las medidas por ventana son las ingresadas por el cliente.",
    `Regi\xF3n: ${guided.regionName}`,
    `Comuna: ${guided.commune}`,
    `Trabajo: ${labelOf(WORK_TYPE_OPTIONS, guided.workType)}`,
    `Superficie: ${labelOf(SURFACE_OPTIONS, guided.surfaceType)}`,
    `Longitud (rango): ${labelOf(LENGTH_OPTIONS, guided.lengthRange)}`,
    `Altura (rango): ${labelOf(HEIGHT_OPTIONS, guided.heightRange)}`,
    `Acabado: ${labelOf(FINISH_OPTIONS, guided.finishType)}${finishColor ? ` (${finishColor})` : ""}`,
    `Plazo (preferencia, no reserva): ${labelOf(TIMELINE_OPTIONS, guided.timeline)}`,
    `Comunicaciones comerciales: ${guided.commercialOptIn ? "s\xED" : "no"}`,
    `Cantidad: ${parsedWindows.windows.length}`,
    `Superficie total: ${formatAreaM2(parsedWindows.totalAreaM2)} m\xB2`,
    ...windowLines
  ].join("\n");
  const id = String(body.clientRequestId || "").trim() || `gq-${Date.now()}`;
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const folio = `COT-${year}-${String(Math.floor(1e3 + Math.random() * 9e3))}`;
  return {
    id,
    folio,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    clientName: String(body.name).trim() || ownerName,
    clientEmail: String(body.email).trim().toLowerCase(),
    clientPhone: String(body.phone).trim(),
    clientAddress: guided.regionName,
    clientCity: guided.commune,
    propertyType: "departamento",
    windows: parsedWindows.windows,
    totalAreaM2: parsedWindows.totalAreaM2,
    clientComments: summary,
    status: "pendiente",
    ownerEmail: ownerEmail.toLowerCase(),
    quoteSource: "guided",
    guidedQuote: guided
  };
}
function guidedQuoteToDbRow(quote) {
  return {
    id: quote.id,
    folio: quote.folio,
    created_at: quote.createdAt,
    client_name: quote.clientName,
    client_rut: quote.clientRut || "",
    client_email: quote.clientEmail.toLowerCase().trim(),
    client_phone: quote.clientPhone || "",
    client_address: quote.clientAddress || "",
    client_city: quote.clientCity || "",
    property_type: quote.propertyType,
    client_comments: quote.clientComments || "",
    total_area_m2: quote.totalAreaM2,
    status: quote.status,
    windows: quote.windows || [],
    owner_email: (quote.ownerEmail || quote.clientEmail || "").toLowerCase(),
    change_history: quote.changeHistory || [],
    quote_source: quote.quoteSource || "guided",
    guided_quote: quote.guidedQuote || null
  };
}

// src/constants/contact.ts
var CONTACT_PHONE_DISPLAY = "+56 9 4746 0606";
var CONTACT_PHONE_E164 = "56947460606";
var CONTACT_EMAIL = "nydo.mallas@gmail.com";
var WHATSAPP_QUOTE_URL = `https://wa.me/${CONTACT_PHONE_E164}?text=${encodeURIComponent(
  "Hola, quiero cotizar mallas de seguridad para mi hogar."
)}`;

// src/services/emailFormatter.ts
var COMPANY_NOTIFICATION_EMAIL = "nydo.mallas@gmail.com";
function generateFormattedQuoteSubject(quote, _recipient) {
  return `Solicitud de cotizaci\xF3n ${quote.folio} recibida`;
}
function generateFormattedQuoteEmailText(quote, recipient) {
  const formattedDate = new Date(quote.createdAt || Date.now()).toLocaleString("es-CL", {
    dateStyle: "full",
    timeStyle: "short"
  });
  const lines = [
    "============================================================",
    recipient === "company" ? "       NYDO MALLAS - REGISTRO CENTRAL DE COTIZACI\xD3N" : "       NYDO MALLAS - AVISO DE COTIZACI\xD3N EN CURSO",
    `                 N\xDAMERO DE FOLIO: ${quote.folio}`,
    "============================================================",
    "",
    `Identificador: ${quote.id}`,
    `Fecha de Emisi\xF3n: ${formattedDate}`,
    recipient === "company" ? `Destinatario: Central de Operaciones (${COMPANY_NOTIFICATION_EMAIL})` : `Destinatario: ${quote.clientName} <${quote.clientEmail}>`,
    ""
  ];
  if (recipient === "client") {
    lines.push(
      "------------------------------------------------------------",
      " AVISO IMPORTANTE AL CLIENTE: EST\xC1S COTIZANDO",
      "------------------------------------------------------------",
      `Estimado(a) ${quote.clientName}:`,
      "Te confirmamos que has solicitado una cotizaci\xF3n formal de mallas de seguridad para tus ventanas.",
      "Tu requerimiento ha sido registrado con \xE9xito en nuestro sistema y est\xE1 en proceso de revisi\xF3n.",
      "",
      "\u2022 NOTA SOBRE EL PRECIO:",
      "En esta instancia no se incluye ning\xFAn precio autom\xE1tico o referencial.",
      "Nuestro equipo t\xE9cnico de Nydo Mallas evaluar\xE1 las medidas de tus ventanas, el tipo de malla",
      "y las condiciones de instalaci\xF3n para formular tu presupuesto formal y coordinar la fecha definitiva.",
      ""
    );
  } else {
    lines.push(
      "------------------------------------------------------------",
      " NOTA INTERNA DE RECEPCI\xD3N (ADMIN)",
      "------------------------------------------------------------",
      `Nueva cotizaci\xF3n solicitada por el cliente ${quote.clientName}.`,
      "\u2022 AVISO: No se ha colocado ning\xFAn precio al cliente; \xFAnicamente se le notific\xF3 que est\xE1 cotizando.",
      "\u2022 ACCI\xD3N: El administrador debe ingresar a la Pantalla de Recepci\xF3n para evaluar las medidas,",
      "fijar el valor oficial y coordinar la cuadrilla t\xE9cnica.",
      ""
    );
  }
  lines.push(
    "------------------------------------------------------------",
    " 1. DATOS DEL CLIENTE",
    "------------------------------------------------------------",
    ` \u2022 Nombre del Titular   : ${quote.clientName}`,
    ` \u2022 Correo Electr\xF3nico   : ${quote.clientEmail}`,
    ` \u2022 Tel\xE9fono de Contacto : ${quote.clientPhone}`,
    ` \u2022 Direcci\xF3n Inmueble   : ${quote.guidedQuote?.regionName || quote.clientAddress}`,
    ` \u2022 Comuna / Ciudad      : ${quote.guidedQuote?.commune || quote.clientCity}`,
    ` \u2022 Tipo de Propiedad    : ${quote.propertyType.toUpperCase()}`,
    quote.clientComments && !quote.guidedQuote ? ` \u2022 Observaciones        : "${quote.clientComments}"` : "",
    ""
  );
  if (quote.guidedQuote) {
    const g = quote.guidedQuote;
    const finish = g.finishType === "lacado_otros" && g.finishColor ? `${labelOf(FINISH_OPTIONS, g.finishType)} (${g.finishColor})` : labelOf(FINISH_OPTIONS, g.finishType);
    lines.push(
      "------------------------------------------------------------",
      " 2. RESPUESTAS DEL FORMULARIO",
      "------------------------------------------------------------",
      ` \u2022 Tipo de trabajo      : ${labelOf(WORK_TYPE_OPTIONS, g.workType)}`,
      ` \u2022 Superficie           : ${labelOf(SURFACE_OPTIONS, g.surfaceType)}`,
      ` \u2022 Longitud (rango)     : ${labelOf(LENGTH_OPTIONS, g.lengthRange)}`,
      ` \u2022 Altura (rango)       : ${labelOf(HEIGHT_OPTIONS, g.heightRange)}`,
      ` \u2022 Acabado              : ${finish}`,
      ` \u2022 Plazo (preferencia)  : ${labelOf(TIMELINE_OPTIONS, g.timeline)}`,
      ""
    );
  } else {
    lines.push(
      "------------------------------------------------------------",
      " 2. FECHAS Y HORARIOS TENTATIVOS DE INSTALACI\xD3N SOLICITADOS",
      "------------------------------------------------------------",
      ` \u2022 Opci\xF3n Tentativa 1 (Preferente) : ${quote.tentativeDate1 || "A coordinar"} a las ${quote.tentativeTime1 || "10:00"} hrs`,
      ` \u2022 Opci\xF3n Tentativa 2 (Alternativa): ${quote.tentativeDate2 || "A coordinar"} a las ${quote.tentativeTime2 || "15:30"} hrs`,
      ""
    );
  }
  const balcony = isBalconySurface(quote.guidedQuote?.surfaceType || "");
  lines.push(
    "------------------------------------------------------------",
    ` 3. DETALLE DE ${balcony ? "PA\xD1OS" : "VENTANAS"} Y MEDIDAS (${quote.windows.length} en total)`,
    "------------------------------------------------------------",
    " Ventana o pa\xF1o | Ubicaci\xF3n | Ancho (cm) | Alto (cm) | Superficie (m\xB2)"
  );
  quote.windows.forEach((win, index) => {
    const label = itemTitle(quote.guidedQuote?.surfaceType || "", index);
    const widthCm = displayWidthCm(win);
    const heightCm = displayHeightCm(win);
    lines.push(
      ` ${label} | ${win.name || "\u2014"} | ${widthCm} | ${heightCm} | ${formatAreaM2(win.area)}`
    );
  });
  lines.push("");
  lines.push(
    "------------------------------------------------------------",
    " 4. ESTADO DE LA SOLICITUD",
    "------------------------------------------------------------",
    ` \u2022 Cantidad Total de ${balcony ? "Pa\xF1os" : "Ventanas"} : ${quote.windows.length}`,
    ` \u2022 Superficie Total Solicitada: ${formatAreaM2(quote.totalAreaM2)} m\xB2`,
    " \u2022 Las medidas ingresadas son referenciales y deber\xE1n confirmarse antes de la instalaci\xF3n.",
    " \u2022 Estado del Presupuesto     : EN PROCESO DE COTIZACI\xD3N (Sin precio previo emitido)",
    recipient === "client" ? " \u2022 Pr\xF3ximo Paso               : Un asesor t\xE9cnico revisar\xE1 tus medidas y te contactar\xE1 para confirmar tu cotizaci\xF3n formal." : " \u2022 Pr\xF3ximo Paso               : Fijar el presupuesto en Recepci\xF3n (Admin) y asignar t\xE9cnico instalador.",
    "",
    "------------------------------------------------------------",
    " 5. EST\xC1NDARES T\xC9CNICOS Y GARANT\xCDA CERTIFICADA",
    "------------------------------------------------------------",
    " \u2022 Resistencia al Impacto : Certificaci\xF3n de hasta 180 kg por m\xB2 para protecci\xF3n infantil y mascotas.",
    " \u2022 Filtro Solar           : Protecci\xF3n UV 100% contra resecamiento prematuro.",
    " \u2022 Perfiler\xEDa             : Perfiles de aluminio anodizado y anclajes perimetrales certificados.",
    " \u2022 Garant\xEDa Escrita       : 2 a 3 a\xF1os garantizados por escrito tras la instalaci\xF3n.",
    "",
    "============================================================",
    " REGISTRO DE DISTRIBUCI\xD3N AUTOM\xC1TICA:",
    ` 1. Recepci\xF3n Central Empresa : ${COMPANY_NOTIFICATION_EMAIL}`,
    ` 2. Copia de Aviso al Cliente : ${quote.clientEmail}`,
    "============================================================",
    "",
    recipient === "company" ? "Gesti\xF3n: Accede a la plataforma para determinar el presupuesto y derivar al instalador." : "Aviso: Gracias por cotizar con Nydo Mallas. Estamos procesando tu solicitud."
  );
  return lines.filter((line) => line !== void 0).join("\n");
}
function formatCLP(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount);
}
function generatePricedQuoteSubject(quote) {
  return `Cotizaci\xF3n ${quote.folio} - Nydo Mallas`;
}
function generatePricedQuoteEmailText(quote, recipient) {
  const adminQuote = quote.adminQuote;
  const total = adminQuote ? formatCLP(adminQuote.total) : "A coordinar";
  const greeting = recipient === "client" ? `Estimado/a ${quote.clientName}:` : `Copia interna. Presupuesto enviado a ${quote.clientName} <${quote.clientEmail}>.`;
  const windowLines = (quote.windows || []).map((win, i) => {
    const width = win.widthCm ?? Math.round((win.width || 0) * 100);
    const height = win.heightCm ?? Math.round((win.height || 0) * 100);
    return ` \u2022 ${win.name || `Ventana ${i + 1}`}: ${width} cm \xD7 ${height} cm (${formatAreaM2(win.area)} m\xB2)`;
  }).join("\n");
  const valueLines = adminQuote ? [
    ` \u2022 Malla y anclajes: ${formatCLP(adminQuote.meshTotalCost)}`,
    ` \u2022 Perfiles y fijaciones: ${formatCLP(adminQuote.profilesAndFixingsCost)}`,
    ` \u2022 Mano de obra e instalaci\xF3n: ${formatCLP(adminQuote.laborAndInstallCost)}`,
    adminQuote.discountAmount > 0 ? ` \u2022 Descuento (${adminQuote.discountPercentage}%): -${formatCLP(adminQuote.discountAmount)}` : "",
    ` \u2022 TOTAL: ${total}`
  ].filter(Boolean).join("\n") : " \u2022 El importe se coordinar\xE1 con el cliente.";
  return [
    greeting,
    "",
    `Folio ${quote.folio}. Presupuesto de mallas de seguridad.`,
    `Ubicaci\xF3n: ${quote.guidedQuote?.commune || quote.clientCity || "No indicada"}.`,
    "",
    "Medidas:",
    windowLines || " \u2022 Sin detalle de ventanas",
    "",
    "Valores:",
    valueLines,
    "",
    adminQuote ? `Garant\xEDa: ${adminQuote.warrantyYears} a\xF1os. Tiempo estimado: ${adminQuote.estimatedTime}.` : "",
    adminQuote?.adminNotes ? `Observaciones: ${adminQuote.adminNotes}` : "",
    "",
    `Para confirmar o agendar, responde este correo o escribe al WhatsApp ${CONTACT_PHONE_DISPLAY}.`,
    "",
    "Equipo Nydo Mallas"
  ].filter((line) => line !== void 0).join("\n");
}

// src/services/quoteEmailHtml.ts
var PROPERTY_LABEL = {
  departamento: "Departamento",
  casa: "Casa",
  oficina: "Oficina",
  otro: "Otro"
};
function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function formatWhen(iso) {
  return new Date(iso || Date.now()).toLocaleString("es-CL", {
    dateStyle: "full",
    timeStyle: "short"
  });
}
function formatCLP2(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(amount);
}
function infoRow(label, value) {
  if (!value) return "";
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #e6edf2;width:42%;font-size:13px;color:#6b8494;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0;border-bottom:1px solid #e6edf2;font-size:14px;color:#1f2d3a;font-weight:bold;vertical-align:top;">${esc(value)}</td>
  </tr>`;
}
function sectionTitle(title) {
  return `<p style="margin:0 0 12px 0;font-size:12px;letter-spacing:0.8px;text-transform:uppercase;color:#6b8494;font-weight:bold;">${esc(title)}</p>`;
}
function wrapEmail(params) {
  const { folio, title, preview, innerHtml } = params;
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f5;font-family:Arial,Helvetica,sans-serif;color:#1f2d3a;">

<!-- Texto de vista previa (se ve en la bandeja de entrada, no en el cuerpo) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
${esc(preview)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f5;">
<tr>
<td align="center" style="padding:24px 12px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:10px;overflow:hidden;">

  <!-- ENCABEZADO -->
  <tr>
    <td style="background-color:#12344d;padding:28px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.3px;">NydoMallas</td>
          <td align="right" style="font-size:12px;color:#a9c4d8;">Folio<br><span style="font-size:15px;font-weight:bold;color:#ffffff;">${esc(folio)}</span></td>
        </tr>
      </table>
    </td>
  </tr>

${innerHtml}

  <!-- PIE -->
  <tr>
    <td style="background-color:#12344d;padding:22px 32px;">
      <p style="margin:0 0 6px 0;font-size:14px;font-weight:bold;color:#ffffff;">Nydo Mallas</p>
      <p style="margin:0;font-size:12px;line-height:1.6;color:#a9c4d8;">
        ${esc(CONTACT_EMAIL)} \xB7 WhatsApp ${esc(CONTACT_PHONE_DISPLAY)}<br>
        Mallas de seguridad para ventanas y balcones.
      </p>
    </td>
  </tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}
function measuresTable(quote) {
  const balcony = isBalconySurface(quote.guidedQuote?.surfaceType || "");
  const noun = itemNoun(quote.guidedQuote?.surfaceType || "", true);
  const rows = (quote.windows || []).map((win, index) => {
    const zebra = index % 2 === 1 ? "background-color:#f7fafc;" : "";
    return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e6edf2;font-size:13px;color:#1f2d3a;${zebra}">${esc(itemTitle(quote.guidedQuote?.surfaceType || "", index))}<br><span style="font-size:12px;color:#6b8494;font-weight:normal;">${esc(win.name || "\u2014")}</span></td>
        <td align="center" style="padding:10px 8px;border-bottom:1px solid #e6edf2;font-size:13px;color:#1f2d3a;${zebra}">${esc(displayWidthCm(win))}</td>
        <td align="center" style="padding:10px 8px;border-bottom:1px solid #e6edf2;font-size:13px;color:#1f2d3a;${zebra}">${esc(displayHeightCm(win))}</td>
        <td align="right" style="padding:10px 8px;border-bottom:1px solid #e6edf2;font-size:13px;color:#1f2d3a;${zebra}">${esc(formatAreaM2(win.area))}</td>
      </tr>`;
  }).join("");
  return `${sectionTitle(`Detalle de ${noun} (${quote.windows.length})`)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding:8px;background-color:#eef2f5;font-size:11px;font-weight:bold;color:#12344d;text-transform:uppercase;">${balcony ? "Pa\xF1o" : "Ventana"} / ubicaci\xF3n</td>
    <td align="center" style="padding:8px;background-color:#eef2f5;font-size:11px;font-weight:bold;color:#12344d;text-transform:uppercase;">Ancho (cm)</td>
    <td align="center" style="padding:8px;background-color:#eef2f5;font-size:11px;font-weight:bold;color:#12344d;text-transform:uppercase;">Alto (cm)</td>
    <td align="right" style="padding:8px;background-color:#eef2f5;font-size:11px;font-weight:bold;color:#12344d;text-transform:uppercase;">m\xB2</td>
  </tr>
  ${rows || `<tr><td colspan="4" style="padding:12px 8px;font-size:13px;color:#6b8494;">Sin medidas registradas.</td></tr>`}
  <tr>
    <td colspan="3" style="padding:12px 8px 4px 8px;font-size:13px;color:#6b8494;">Superficie total</td>
    <td align="right" style="padding:12px 8px 4px 8px;font-size:15px;font-weight:bold;color:#12344d;">${esc(formatAreaM2(quote.totalAreaM2))} m\xB2</td>
  </tr>
</table>
<p style="margin:10px 0 0 0;font-size:12px;line-height:1.5;color:#6b8494;">Las medidas son referenciales y se confirman antes de la instalaci\xF3n.</p>`;
}
function clientBlock(quote) {
  const g = quote.guidedQuote;
  const finish = g ? g.finishType === "lacado_otros" && g.finishColor ? `${labelOf(FINISH_OPTIONS, g.finishType)} (${g.finishColor})` : labelOf(FINISH_OPTIONS, g.finishType) : "";
  return `${sectionTitle("Datos del cliente")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  ${infoRow("Nombre", quote.clientName)}
  ${infoRow("Correo", quote.clientEmail)}
  ${infoRow("Tel\xE9fono", quote.clientPhone)}
  ${infoRow("Regi\xF3n", g?.regionName || quote.clientAddress)}
  ${infoRow("Comuna", g?.commune || quote.clientCity)}
  ${infoRow("Tipo de propiedad", PROPERTY_LABEL[quote.propertyType] || quote.propertyType)}
  ${g ? infoRow("Tipo de trabajo", labelOf(WORK_TYPE_OPTIONS, g.workType)) : ""}
  ${g ? infoRow("Superficie", labelOf(SURFACE_OPTIONS, g.surfaceType)) : ""}
  ${g ? infoRow("Longitud", labelOf(LENGTH_OPTIONS, g.lengthRange)) : ""}
  ${g ? infoRow("Altura", labelOf(HEIGHT_OPTIONS, g.heightRange)) : ""}
  ${g ? infoRow("Acabado", finish) : ""}
  ${g ? infoRow("Plazo preferente", labelOf(TIMELINE_OPTIONS, g.timeline)) : ""}
  ${quote.clientComments ? infoRow("Observaciones", quote.clientComments) : ""}
</table>`;
}
function ctaBlock() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="background-color:#12344d;border-radius:6px;">
      <a href="${esc(WHATSAPP_QUOTE_URL)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">Escribir por WhatsApp</a>
    </td>
  </tr>
</table>
<p style="margin:12px 0 0 0;font-size:12px;color:#6b8494;">O responde este correo \xB7 ${esc(CONTACT_EMAIL)}</p>`;
}
function requestInner(quote, recipient) {
  const heading = recipient === "company" ? "Nueva solicitud de cotizaci\xF3n" : "Recibimos tu solicitud de cotizaci\xF3n";
  const intro = recipient === "company" ? `El cliente ${quote.clientName} ingres\xF3 una solicitud. Revisa las medidas, emite el presupuesto en Recepci\xF3n y coordina la instalaci\xF3n. En este aviso no hay precio para el cliente.` : `Hola ${quote.clientName}: un asesor revisar\xE1 tus medidas y te enviar\xE1 la cotizaci\xF3n formal. En esta instancia no incluimos precios autom\xE1ticos ni referenciales.`;
  const status = recipient === "company" ? "En proceso \xB7 Sin precio emitido \xB7 Acci\xF3n: evaluar en Recepci\xF3n" : "En proceso de cotizaci\xF3n \xB7 Sin precio emitido";
  return `
  <!-- MENSAJE PRINCIPAL -->
  <tr>
    <td style="padding:32px 32px 8px 32px;">
      <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.8px;text-transform:uppercase;color:#6b8494;font-weight:bold;">Solicitud recibida</p>
      <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#12344d;">${esc(heading)}</h1>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1f2d3a;">${esc(intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f5;border-radius:8px;">
        <tr>
          <td style="padding:14px 16px;font-size:14px;color:#12344d;">
            <strong>Estado:</strong> ${esc(status)}<br>
            <span style="font-size:12px;color:#6b8494;">Fecha de ingreso: ${esc(formatWhen(quote.createdAt))}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">${clientBlock(quote)}</td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">${measuresTable(quote)}</td>
  </tr>
  <tr>
    <td style="padding:24px 32px 32px 32px;">
      ${sectionTitle("Siguiente paso")}
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#1f2d3a;">${recipient === "company" ? "Fija el presupuesto oficial y avisa al cliente cuando la cotizaci\xF3n formal est\xE9 lista." : "Un asesor t\xE9cnico te contactar\xE1 para confirmar medidas y enviarte la cotizaci\xF3n formal."}</p>
      ${ctaBlock()}
    </td>
  </tr>`;
}
function pricedInner(quote, recipient) {
  const admin2 = quote.adminQuote;
  const heading = recipient === "company" ? "Copia del presupuesto enviado" : "Tu cotizaci\xF3n formal est\xE1 lista";
  const intro = recipient === "company" ? `Presupuesto enviado a ${quote.clientName} <${quote.clientEmail}>.` : `Hola ${quote.clientName}: adjuntamos el presupuesto de mallas de seguridad para tu propiedad.`;
  const valueRows = admin2 ? `${infoRow("Malla y anclajes", formatCLP2(admin2.meshTotalCost))}
       ${infoRow("Perfiles y fijaciones", formatCLP2(admin2.profilesAndFixingsCost))}
       ${infoRow("Mano de obra e instalaci\xF3n", formatCLP2(admin2.laborAndInstallCost))}
       ${admin2.discountAmount > 0 ? infoRow(`Descuento (${admin2.discountPercentage}%)`, `-${formatCLP2(admin2.discountAmount)}`) : ""}
       ${infoRow("Garant\xEDa", `${admin2.warrantyYears} a\xF1os`)}
       ${infoRow("Tiempo estimado", admin2.estimatedTime)}
       ${admin2.adminNotes ? infoRow("Observaciones", admin2.adminNotes) : ""}` : infoRow("Valor", "A coordinar");
  const total = admin2 ? formatCLP2(admin2.total) : "A coordinar";
  return `
  <tr>
    <td style="padding:32px 32px 8px 32px;">
      <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.8px;text-transform:uppercase;color:#6b8494;font-weight:bold;">Cotizaci\xF3n formal</p>
      <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;color:#12344d;">${esc(heading)}</h1>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1f2d3a;">${esc(intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#12344d;border-radius:8px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0 0 4px 0;font-size:12px;color:#a9c4d8;">Total</p>
            <p style="margin:0;font-size:24px;font-weight:bold;color:#ffffff;">${esc(total)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">${clientBlock(quote)}</td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">${measuresTable(quote)}</td>
  </tr>
  <tr>
    <td style="padding:24px 32px 8px 32px;">
      ${sectionTitle("Valores")}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${valueRows}</table>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 32px 32px 32px;">
      ${sectionTitle("Confirmar o agendar")}
      <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#1f2d3a;">Responde este correo o escribe al WhatsApp para confirmar el presupuesto.</p>
      ${ctaBlock()}
    </td>
  </tr>`;
}
function generateQuoteEmailHtml(quote, kind, recipient) {
  const folio = quote.folio || "\u2014";
  if (kind === "priced" && quote.adminQuote) {
    const title2 = `Cotizaci\xF3n ${folio} - Nydo Mallas`;
    const preview2 = recipient === "company" ? `Copia interna. Presupuesto ${folio} enviado a ${quote.clientName}.` : `Tu cotizaci\xF3n ${folio} est\xE1 lista. Revisa el presupuesto de Nydo Mallas.`;
    return wrapEmail({
      folio,
      title: title2,
      preview: preview2,
      innerHtml: pricedInner(quote, recipient)
    });
  }
  const title = `Solicitud de cotizaci\xF3n ${folio} recibida`;
  const preview = recipient === "company" ? `Nueva solicitud ${folio} de ${quote.clientName}. Revisa las medidas y emite el presupuesto.` : `Recibimos tu solicitud ${folio}. Un asesor revisar\xE1 tus medidas y te enviar\xE1 la cotizaci\xF3n formal.`;
  return wrapEmail({
    folio,
    title,
    preview,
    innerHtml: requestInner(quote, recipient)
  });
}

// server/sendQuoteMail.ts
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function toHtml(text) {
  return `<pre style="font-family:Georgia,serif;white-space:pre-wrap;font-size:14px;line-height:1.45;color:#0f172a">${escapeHtml(
    text
  )}</pre>`;
}
function isResendTestBlock(detail) {
  const lower = detail.toLowerCase();
  return lower.includes("verify a domain") || lower.includes("testing emails");
}
function explainResendError(detail) {
  if (isResendTestBlock(detail)) {
    return "Resend no entrega a nydo.mallas@gmail.com con el remitente de prueba. Usamos la bandeja alternativa de la empresa.";
  }
  return detail.slice(0, 220) || "El servicio de correo no acept\xF3 el env\xEDo.";
}
async function postResendEmail(to, subject, text, replyTo, html) {
  if (!RESEND_API_KEY) {
    return { sent: false, error: "El env\xEDo de correo a\xFAn no est\xE1 configurado." };
  }
  const sendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [to],
      reply_to: replyTo || QUOTE_COPY_EMAIL,
      subject,
      text,
      html: html || toHtml(text)
    })
  });
  if (sendRes.ok) return { sent: true };
  const detail = await sendRes.text();
  console.warn("[mail] Resend rechaz\xF3 el env\xEDo a", to, sendRes.status, detail.slice(0, 240));
  return {
    sent: false,
    blockedTest: isResendTestBlock(detail),
    error: explainResendError(detail)
  };
}
async function postCompanyInboxEmail(to, subject, text, _html, replyTo) {
  const inboxId = FORMSUBMIT_COMPANY_ID || to;
  const sendRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(inboxId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: SITE_URL,
      Referer: `${SITE_URL}/`
    },
    body: JSON.stringify({
      _subject: subject,
      _template: "box",
      _captcha: "false",
      _replyto: replyTo || to,
      name: "Nydo Mallas",
      email: replyTo || to,
      message: text
    })
  });
  const body = await sendRes.text();
  let parsed = {};
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { message: body.slice(0, 180) };
  }
  const message = String(parsed.message || "");
  const activated = parsed.success === "true" || /activated|successfully/i.test(message);
  const needsActivation = /activation|activ/i.test(message);
  if (activated || needsActivation) {
    if (needsActivation) {
      console.warn("[mail] nydo.mallas@gmail.com debe confirmar el enlace de activaci\xF3n del correo.");
    }
    return { sent: true };
  }
  console.warn("[mail] Bandeja empresa rechaz\xF3 el env\xEDo:", sendRes.status, message.slice(0, 240));
  return { sent: false, error: message.slice(0, 220) || "No pudimos dejar el correo en nydo.mallas@gmail.com." };
}
async function sendInboxEmail(to, subject, text, replyTo, html) {
  const destination = to.trim().toLowerCase();
  const resend = await postResendEmail(destination, subject, text, replyTo, html);
  if (resend.sent) return { sent: true };
  const companyInbox = (QUOTE_COPY_EMAIL || "nydo.mallas@gmail.com").toLowerCase();
  if (destination === companyInbox) {
    return postCompanyInboxEmail(destination, subject, text, html, replyTo);
  }
  return { sent: false, error: resend.error };
}
function contentFor(quote, kind, recipient) {
  const html = generateQuoteEmailHtml(quote, kind, recipient);
  if (kind === "priced" && quote.adminQuote) {
    return {
      subject: generatePricedQuoteSubject(quote),
      text: generatePricedQuoteEmailText(quote, recipient),
      html
    };
  }
  return {
    subject: generateFormattedQuoteSubject(quote, recipient),
    text: generateFormattedQuoteEmailText(quote, recipient),
    html
  };
}
async function sendQuoteRequestEmail(quote, kind = "request") {
  const clientTo = String(quote.clientEmail || "").trim().toLowerCase();
  if (!clientTo.includes("@")) {
    return { sent: false, error: "El correo del cliente no es v\xE1lido." };
  }
  try {
    const companyTo = (QUOTE_COPY_EMAIL || "nydo.mallas@gmail.com").toLowerCase();
    const companyMail = contentFor(quote, kind, "company");
    const clientMail = contentFor(quote, kind, "client");
    const company = await sendInboxEmail(
      companyTo,
      companyMail.subject,
      companyMail.text,
      clientTo,
      companyMail.html
    );
    const client = clientTo === companyTo ? company : await sendInboxEmail(
      clientTo,
      clientMail.subject,
      clientMail.text,
      companyTo,
      clientMail.html
    );
    if (!company.sent) {
      return {
        sent: false,
        error: `No lleg\xF3 a nydo.mallas@gmail.com. ${company.error || ""}`.trim()
      };
    }
    if (!client.sent) {
      return {
        sent: false,
        error: `Lleg\xF3 a nydo.mallas@gmail.com, pero no al cliente (${clientTo}). ${client.error || ""}`.trim()
      };
    }
    return { sent: true };
  } catch {
    return { sent: false, error: "No pudimos conectar con el servicio de correo." };
  }
}

// server/apiRoutes.ts
var contactAttempts = /* @__PURE__ */ new Map();
var syncLocks = /* @__PURE__ */ new Set();
function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
}
function tooManyContact(ip) {
  const now = Date.now();
  const recent = (contactAttempts.get(ip) || []).filter((t) => now - t < 10 * 60 * 1e3);
  contactAttempts.set(ip, recent);
  return recent.length >= 3;
}
function markContact(ip) {
  const list = contactAttempts.get(ip) || [];
  list.push(Date.now());
  contactAttempts.set(ip, list);
}
function canViewQuotes(user) {
  return isPrincipalAdmin(user.email) || user.role === "admin" || user.permissions.viewQuotes;
}
function canEditQuotes(user) {
  return isPrincipalAdmin(user.email) || user.role === "admin" || user.permissions.editQuotes;
}
function canDeleteQuotes(user) {
  return isPrincipalAdmin(user.email) || user.role === "admin" || user.permissions.deleteQuotes;
}
function canViewSales(user) {
  return isPrincipalAdmin(user.email) || user.role === "admin" || user.permissions.viewSales;
}
function mapQuoteRow(row) {
  return {
    id: row.id,
    folio: row.folio,
    createdAt: row.created_at,
    clientName: row.client_name,
    clientRut: row.client_rut,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    clientAddress: row.client_address,
    clientCity: row.client_city,
    propertyType: row.property_type,
    clientComments: row.client_comments,
    totalAreaM2: Number(row.total_area_m2) || 0,
    status: row.status,
    acceptedAt: row.accepted_at,
    paidAmount: row.paid_amount != null ? Number(row.paid_amount) : 0,
    paymentStatus: row.payment_status || "pendiente",
    paymentMethod: row.payment_method,
    paymentNotes: row.payment_notes,
    windows: row.windows || [],
    adminQuote: row.admin_quote,
    installerAssignment: row.installer_assignment,
    technicianExecution: row.technician_execution,
    payments: row.payments || [],
    changeHistory: row.change_history || [],
    deletedAt: row.deleted_at,
    ownerEmail: row.owner_email || row.client_email,
    quoteSource: row.quote_source || void 0,
    guidedQuote: row.guided_quote || void 0
  };
}
async function fetchVisibleQuotes(user, includeDeleted = false) {
  const db = requireAdminClient();
  let query = db.from("quotes").select("*").order("created_at", { ascending: false });
  if (!includeDeleted) query = query.is("deleted_at", null);
  if (user.role === "cliente") {
    query = query.or(`owner_email.eq.${user.email},client_email.eq.${user.email}`);
  } else if (!canViewQuotes(user)) {
    return [];
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapQuoteRow);
}
function mountApiRoutes(app) {
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      googleConfigured: false,
      supabaseAdmin: missingServerConfig().filter((x) => x.includes("SUPABASE")).length === 0,
      mailConfigured: !!RESEND_API_KEY,
      missing: missingServerConfig(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.get("/api/auth/config", (_req, res) => {
    res.json({
      googleClientId: null,
      googleReady: false
    });
  });
  app.post("/api/auth/login", async (req, res) => {
    try {
      const email = String(req.body?.email || "").trim();
      const password = String(req.body?.password || "");
      const sessionUser = await authenticateWithPassword(email, password);
      if (sessionUser.active === false) {
        return res.status(403).json({ error: "Tu acceso est\xE1 desactivado." });
      }
      const token = createSessionToken(sessionUser);
      if (!token) {
        return res.status(500).json({
          error: "Falta SESSION_SECRET en el servidor. No se puede crear una sesi\xF3n segura."
        });
      }
      return res.json({
        token,
        user: sessionToAccount(sessionUser)
      });
    } catch (err) {
      return res.status(401).json({
        error: err?.message || "Correo o contrase\xF1a incorrectos."
      });
    }
  });
  app.get("/api/auth/me", requireSession, async (req, res) => {
    const current = getSessionUser(req);
    const refreshed = await resolveRole(current.email, current.name);
    res.json({ user: sessionToAccount(refreshed) });
  });
  app.post("/api/quotes/guided", async (req, res) => {
    try {
      const ip = clientIp(req);
      if (tooManyContact(ip)) {
        return res.status(429).json({
          error: "Enviaste varias solicitudes seguidas. Espera unos minutos e intenta de nuevo."
        });
      }
      const error = validateGuidedQuote(req.body || {});
      if (error) return res.status(400).json({ error });
      const db = requireAdminClient();
      const ownerEmail = String(req.body?.email || "").trim().toLowerCase();
      const ownerName = String(req.body?.name || "").trim();
      const quote = buildGuidedQuoteRecord(req.body || {}, ownerEmail, ownerName);
      const { data: existing } = await db.from("quotes").select("*").eq("id", quote.id).maybeSingle();
      if (existing) {
        return res.json({ quote: mapQuoteRow(existing), message: "Solicitud ya registrada." });
      }
      const row = guidedQuoteToDbRow(quote);
      const { data, error: insertError } = await db.from("quotes").insert(row).select("*").single();
      if (insertError) {
        const fallback = { ...row };
        delete fallback.guided_quote;
        delete fallback.quote_source;
        const retry = await db.from("quotes").insert(fallback).select("*").single();
        if (retry.error) return res.status(400).json({ error: retry.error.message });
        markContact(ip);
        const mail2 = await sendQuoteRequestEmail(quote);
        return res.json({
          quote: mapQuoteRow(retry.data),
          message: "Solicitud guardada.",
          mailSent: mail2.sent,
          mailError: mail2.error || null
        });
      }
      markContact(ip);
      const mail = await sendQuoteRequestEmail(quote);
      res.json({
        quote: mapQuoteRow(data),
        message: "Solicitud guardada.",
        mailSent: mail.sent,
        mailError: mail.error || null
      });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos guardar la solicitud." });
    }
  });
  app.post("/api/quotes/:id/send-email", requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req);
      if (!canEditQuotes(user)) {
        return res.status(403).json({ error: "No tienes permiso para enviar cotizaciones." });
      }
      const db = requireAdminClient();
      const { data: existing, error: findError } = await db.from("quotes").select("*").eq("id", req.params.id).maybeSingle();
      if (findError || !existing) {
        return res.status(404).json({ error: "No encontramos esa cotizaci\xF3n." });
      }
      const quote = mapQuoteRow(existing);
      if (req.body?.adminQuote && typeof req.body.adminQuote === "object") {
        quote.adminQuote = { ...quote.adminQuote || {}, ...req.body.adminQuote };
      }
      if (typeof req.body?.total === "number") {
        quote.adminQuote = {
          ...quote.adminQuote || {
            pricePerM2: 0,
            meshTotalCost: req.body.total,
            profilesAndFixingsCost: 0,
            laborAndInstallCost: 0,
            discountPercentage: 0,
            discountAmount: 0,
            subtotal: req.body.total,
            includeTax: false,
            taxAmount: 0,
            warrantyYears: 2,
            estimatedTime: "2 a 3 horas",
            adminNotes: ""
          },
          total: req.body.total,
          subtotal: req.body.total
        };
      }
      if (typeof req.body?.notes === "string" && quote.adminQuote) {
        quote.adminQuote.adminNotes = req.body.notes;
      }
      const mail = await sendQuoteRequestEmail(quote, quote.adminQuote ? "priced" : "request");
      if (!mail.sent) {
        return res.status(502).json({ error: mail.error || "No pudimos enviar el correo al cliente." });
      }
      const sentAt = (/* @__PURE__ */ new Date()).toISOString();
      const adminQuote = quote.adminQuote ? { ...quote.adminQuote, sentAt, sentToEmail: quote.clientEmail } : quote.adminQuote;
      if (adminQuote) {
        await db.from("quotes").update({ admin_quote: adminQuote }).eq("id", quote.id);
      }
      res.json({
        quote: { ...quote, adminQuote },
        message: `Enviamos un correo a nydo.mallas@gmail.com y otro a ${quote.clientEmail}.`,
        mailSent: true
      });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos enviar el correo." });
    }
  });
  app.get("/api/quotes", requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req);
      if (user.role !== "cliente" && !canViewQuotes(user)) {
        return res.status(403).json({ error: "No tienes permiso para ver cotizaciones." });
      }
      const quotes = await fetchVisibleQuotes(user);
      res.json({ quotes });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos consultar las cotizaciones." });
    }
  });
  app.patch("/api/quotes/:id", requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req);
      if (!canEditQuotes(user)) {
        return res.status(403).json({ error: "No tienes permiso para modificar cotizaciones." });
      }
      const db = requireAdminClient();
      const { data: existing, error: findError } = await db.from("quotes").select("*").eq("id", req.params.id).maybeSingle();
      if (findError || !existing) {
        return res.status(404).json({ error: "No encontramos esa cotizaci\xF3n." });
      }
      const patch = req.body || {};
      const history = Array.isArray(existing.change_history) ? existing.change_history : [];
      history.unshift({
        id: `ev-${Date.now()}`,
        at: (/* @__PURE__ */ new Date()).toISOString(),
        actorEmail: user.email,
        actorName: user.name,
        action: patch.status ? "Actualizar estado" : "Modificar cotizaci\xF3n",
        detail: patch.status ? `Estado cambiado a ${patch.status}` : "Se guardaron cambios en la cotizaci\xF3n"
      });
      const row = {
        change_history: history.slice(0, 50)
      };
      if (patch.status) row.status = patch.status;
      if (patch.adminNotes != null && existing.admin_quote) {
        row.admin_quote = { ...existing.admin_quote, adminNotes: patch.adminNotes };
      }
      if (typeof patch.total === "number" && existing.admin_quote) {
        row.admin_quote = {
          ...row.admin_quote || existing.admin_quote,
          total: patch.total,
          subtotal: patch.total
        };
      }
      if (patch.clientComments != null) row.client_comments = patch.clientComments;
      const { data, error } = await db.from("quotes").update(row).eq("id", req.params.id).select("*").single();
      if (error) return res.status(400).json({ error: error.message });
      const quote = mapQuoteRow(data);
      if (patch.sendEmail) {
        const mail = await sendQuoteRequestEmail(quote, quote.adminQuote ? "priced" : "request");
        return res.json({
          quote,
          message: mail.sent ? "Cambios guardados y correo enviado al cliente." : "Cambios guardados.",
          mailSent: mail.sent,
          mailError: mail.error || null
        });
      }
      res.json({ quote, message: "Cambios guardados." });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos guardar los cambios." });
    }
  });
  app.delete("/api/quotes/:id", requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req);
      if (!canDeleteQuotes(user)) {
        return res.status(403).json({ error: "No tienes permiso para eliminar cotizaciones." });
      }
      const db = requireAdminClient();
      const { data: existing } = await db.from("quotes").select("*").eq("id", req.params.id).maybeSingle();
      if (!existing) return res.status(404).json({ error: "No encontramos esa cotizaci\xF3n." });
      const history = Array.isArray(existing.change_history) ? existing.change_history : [];
      history.unshift({
        id: `ev-${Date.now()}`,
        at: (/* @__PURE__ */ new Date()).toISOString(),
        actorEmail: user.email,
        actorName: user.name,
        action: "Eliminar",
        detail: `Baja l\xF3gica de ${existing.folio}`
      });
      const { error } = await db.from("quotes").update({ deleted_at: (/* @__PURE__ */ new Date()).toISOString(), change_history: history }).eq("id", req.params.id);
      if (error) return res.status(400).json({ error: error.message });
      res.json({ message: `Se elimin\xF3 la cotizaci\xF3n ${existing.folio}. Queda en el historial.` });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos eliminar la cotizaci\xF3n." });
    }
  });
  app.post("/api/quotes/:id/payments", requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req);
      if (!canEditQuotes(user)) {
        return res.status(403).json({ error: "No tienes permiso para registrar pagos." });
      }
      const amount = Number(req.body?.amount);
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Ingresa un monto de pago mayor a cero." });
      }
      const db = requireAdminClient();
      const { data: quote } = await db.from("quotes").select("*").eq("id", req.params.id).maybeSingle();
      if (!quote) return res.status(404).json({ error: "No encontramos esa cotizaci\xF3n." });
      const payment = {
        id: `pay-${Date.now()}`,
        quote_id: quote.id,
        amount,
        method: String(req.body?.method || "").slice(0, 80) || null,
        notes: String(req.body?.notes || "").slice(0, 400) || null,
        created_by: user.email
      };
      const { error: payError } = await db.from("quote_payments").insert(payment);
      if (payError) return res.status(400).json({ error: payError.message });
      const { data: pays } = await db.from("quote_payments").select("amount").eq("quote_id", quote.id);
      const paid = (pays || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
      const quoted = Number(quote.admin_quote?.total || 0);
      const paymentStatus = paid <= 0 ? "pendiente" : quoted > 0 && paid >= quoted ? "pagado_total" : "abono_parcial";
      await db.from("quotes").update({
        paid_amount: paid,
        payment_status: paymentStatus,
        payment_method: payment.method,
        payment_notes: payment.notes
      }).eq("id", quote.id);
      res.json({ message: "Pago registrado.", paidAmount: paid, paymentStatus });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos registrar el pago." });
    }
  });
  app.get("/api/sales", requireSession, async (req, res) => {
    try {
      const user = getSessionUser(req);
      if (!canViewSales(user)) {
        return res.status(403).json({ error: "No tienes permiso para ver ventas." });
      }
      const quotes = (await fetchVisibleQuotes(user)).filter((q) => !q.deletedAt);
      const db = requireAdminClient();
      const { data: payments } = await db.from("quote_payments").select("*");
      const payByQuote = /* @__PURE__ */ new Map();
      (payments || []).forEach((p) => {
        payByQuote.set(p.quote_id, (payByQuote.get(p.quote_id) || 0) + Number(p.amount || 0));
      });
      const byStatus = {};
      let quotedTotal = 0;
      let acceptedTotal = 0;
      let collectedTotal = 0;
      quotes.forEach((q) => {
        byStatus[q.status] = (byStatus[q.status] || 0) + 1;
        const quoted = Number(q.adminQuote?.total || 0);
        quotedTotal += quoted;
        if (q.status === "aceptada") acceptedTotal += quoted;
        collectedTotal += payByQuote.get(q.id) || Number(q.paidAmount || 0);
      });
      res.json({
        counts: byStatus,
        quotedTotal,
        acceptedTotal,
        collectedTotal,
        quotes: quotes.map((q) => ({
          ...q,
          collectedAmount: payByQuote.get(q.id) || Number(q.paidAmount || 0)
        }))
      });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos cargar las ventas." });
    }
  });
  app.get("/api/internal-users", requireSession, requirePrincipalAdmin, async (_req, res) => {
    try {
      const db = requireAdminClient();
      const { data, error } = await db.from("internal_users").select("*").order("created_at", { ascending: false });
      if (error) return res.status(400).json({ error: error.message });
      res.json({ users: data || [] });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos cargar el equipo." });
    }
  });
  app.post("/api/internal-users", requireSession, requirePrincipalAdmin, async (req, res) => {
    try {
      const user = getSessionUser(req);
      const email = String(req.body?.email || "").trim().toLowerCase();
      const fullName = String(req.body?.fullName || "").trim();
      const password = String(req.body?.password || "").trim();
      if (!email.includes("@") || !fullName) {
        return res.status(400).json({ error: "Necesitamos nombre y un correo v\xE1lido." });
      }
      if (isPrincipalAdmin(email)) {
        return res.status(400).json({ error: "Esa cuenta ya es la administradora principal." });
      }
      const db = requireAdminClient();
      const { data: existing } = await db.from("internal_users").select("*").eq("email", email).maybeSingle();
      if (!existing && password.length < 4) {
        return res.status(400).json({ error: "Asigna una contrase\xF1a de al menos 4 caracteres." });
      }
      const passwordHash = password ? hashPassword(password) : existing?.password_hash;
      const row = {
        id: existing?.id || `int-${Date.now()}`,
        email,
        full_name: fullName,
        active: req.body?.active !== false,
        can_view_quotes: !!req.body?.viewQuotes,
        can_edit_quotes: !!req.body?.editQuotes,
        can_delete_quotes: !!req.body?.deleteQuotes,
        can_view_sales: !!req.body?.viewSales,
        created_by: user.email,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (passwordHash) row.password_hash = passwordHash;
      let { data, error } = await db.from("internal_users").upsert(row, { onConflict: "email" }).select("*").single();
      if (error && String(error.message || "").includes("password_hash")) {
        const fallback = { ...row };
        delete fallback.password_hash;
        const retry = await db.from("internal_users").upsert(fallback, { onConflict: "email" }).select("*").single();
        data = retry.data;
        error = retry.error;
      }
      if (error) return res.status(400).json({ error: error.message });
      if (passwordHash) {
        await db.from("app_users").upsert(
          {
            id: existing?.id || row.id,
            email,
            password_hash: passwordHash,
            full_name: fullName,
            role: "interno"
          },
          { onConflict: "email" }
        );
      }
      res.json({ user: data, message: "Cuenta interna guardada." });
    } catch (err) {
      res.status(503).json({ error: err?.message || "No pudimos guardar el usuario." });
    }
  });
  app.post("/api/contact", async (req, res) => {
    try {
      if (req.body?.website) {
        return res.json({ message: "Recibimos tu mensaje." });
      }
      const ip = clientIp(req);
      if (tooManyContact(ip)) {
        return res.status(429).json({
          error: "Enviaste varios mensajes seguidos. Espera unos minutos e intenta de nuevo."
        });
      }
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim();
      const phone = String(req.body?.phone || "").trim();
      const subject = String(req.body?.subject || "").trim();
      const message = String(req.body?.message || "").trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!name || !emailOk || !subject || !message) {
        return res.status(400).json({
          error: "Completa nombre, un correo v\xE1lido, asunto y mensaje."
        });
      }
      const mail = await sendInboxEmail(
        CONTACT_TO_EMAIL,
        `[Cont\xE1ctanos] ${subject}`,
        `Nombre: ${name}
Correo: ${email}
Tel\xE9fono: ${phone || "No indicado"}

${message}`,
        email
      );
      if (!mail.sent) {
        return res.status(502).json({
          error: mail.error || "El servicio de correo no acept\xF3 el env\xEDo. Intenta de nuevo en unos minutos."
        });
      }
      markContact(ip);
      try {
        const db = requireAdminClient();
        await db.from("contact_messages").insert({
          id: `msg-${Date.now()}`,
          name,
          email,
          phone,
          subject,
          message,
          delivered: true
        });
      } catch {
      }
      res.json({ message: "Tu mensaje fue enviado. Te responderemos a tu correo." });
    } catch {
      res.status(500).json({
        error: "No pudimos enviar el mensaje. Revisa tu conexi\xF3n e intenta de nuevo."
      });
    }
  });
  app.post("/api/sync", requireSession, requirePrincipalAdmin, async (req, res) => {
    const user = getSessionUser(req);
    if (syncLocks.has(user.email)) {
      return res.status(409).json({ error: "Ya hay una sincronizaci\xF3n en curso." });
    }
    syncLocks.add(user.email);
    try {
      const quotes = await fetchVisibleQuotes(user, true);
      const visible = quotes.filter((q) => !q.deletedAt);
      const issues = [];
      visible.forEach((q) => {
        if (!q.clientName) issues.push({ folio: q.folio, message: "Falta el nombre del cliente." });
        if (!q.clientEmail || !String(q.clientEmail).includes("@")) {
          issues.push({ folio: q.folio, message: "El correo del cliente est\xE1 incompleto." });
        }
        if (q.status === "aceptada" && !(Number(q.adminQuote?.total) > 0)) {
          issues.push({ folio: q.folio, message: "Est\xE1 aceptada pero no tiene un importe." });
        }
        if ((q.paymentStatus === "pagado_total" || q.paymentStatus === "abono_parcial") && !(Number(q.paidAmount) > 0)) {
          issues.push({ folio: q.folio, message: "Dice que hay pago, pero no hay un monto cobrado." });
        }
      });
      res.json({
        message: "Datos actualizados",
        syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
        consulted: quotes.length,
        visible: visible.length,
        issues,
        quotes: visible,
        review: issues.length === 0 ? "La revisi\xF3n no encontr\xF3 problemas evidentes." : `Encontramos ${issues.length} dato(s) para revisar.`
      });
    } catch (err) {
      res.status(503).json({
        error: err?.message || "No pudimos actualizar los datos. Intenta nuevamente."
      });
    } finally {
      syncLocks.delete(user.email);
    }
  });
}

// server/createApiApp.ts
function createApiApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  mountApiRoutes(app);
  return app;
}

// server/vercelHandler.ts
var vercelHandler_default = createApiApp();
export {
  vercelHandler_default as default
};
