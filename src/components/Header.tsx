import React, { useState } from 'react';
import {
  ShieldCheck,
  Inbox,
  Home,
  Phone,
  Sparkles,
  FileText,
  CheckCircle2,
  UserCheck,
  Wrench,
  User,
  LogIn,
  LogOut,
  KeyRound,
  ChevronDown,
  Database,
  Bot
} from 'lucide-react';
import { UserAccount } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { isFirebaseConfigured } from '../services/firebaseClient';
import { isUserAdmin, isUserGmailConnected } from '../services/authStorage';

export type AppView =
  | 'client'
  | 'admin'
  | 'received_quotes'
  | 'approved_quotes'
  | 'technician_orders'
  | 'client_portal';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  pendingQuotesCount: number;
  receivedQuotesCount: number;
  approvedQuotesCount: number;
  technicianOrdersCount: number;
  currentUser?: UserAccount | null;
  onOpenLogin?: (mode?: 'login' | 'recover' | 'reset_password') => void;
  onOpenGmailConnect?: () => void;
  onLogout?: () => void;
  onOpenSupabaseModal?: () => void;
  onOpenAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  pendingQuotesCount,
  receivedQuotesCount,
  approvedQuotesCount,
  technicianOrdersCount,
  currentUser,
  onOpenLogin,
  onOpenGmailConnect,
  onLogout,
  onOpenSupabaseModal,
  onOpenAssistant,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const firebaseConnected = isFirebaseConfigured();
  const supabaseConnected = isSupabaseConfigured();
  const cloudConnected = firebaseConnected || supabaseConnected;

  const isAdmin = isUserAdmin(currentUser || null);
  const isGmailConnected = isUserGmailConnected(currentUser || null);

  return (
    <header
      id="app-main-header"
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        isAdmin
          ? 'bg-slate-900 border-b border-slate-800 text-white shadow-md'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs text-slate-900'
      }`}
    >
      {/* Top Administrative Status Bar (Visible only to Admin) */}
      {isAdmin && (
        <div
          id="admin-top-status-strip"
          className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-1 text-[11px] font-black tracking-wide flex items-center justify-between border-b border-amber-600/40"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
            <span className="uppercase">Panel Administrador Central &bull; Modo Gestión y Control</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-semibold">
              Admin: {currentUser?.email || 'rcv.informacion@gmail.com'}
            </span>
            <span className="text-[10px] bg-slate-950/20 px-2 py-0.2 rounded font-bold">
              Firestore BD Conectada
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Tagline */}
          <div
            id="brand-logo-container"
            onClick={() => onNavigate('client')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 ${
                isAdmin
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-sky-500/20'
              }`}
            >
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-black tracking-tight ${
                    isAdmin ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Mallas
                  <span className={isAdmin ? 'text-amber-400' : 'text-sky-600'}>
                    Seguras
                  </span>
                </span>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40 uppercase tracking-wider">
                    👑 Portal Administrador
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200/70">
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    Redes Certificadas
                  </span>
                )}
              </div>
              <p
                className={`text-xs font-medium ${
                  isAdmin ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {isAdmin
                  ? 'Centro de Recepción y Control de Cotizaciones'
                  : 'Protección para ventanas, balcones y terrazas'}
              </p>
            </div>
          </div>

          {/* Navigation between Views based on Admin & Gmail Auth */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav
              id="navigation-toggle"
              className={`flex items-center p-1.5 rounded-xl border overflow-x-auto max-w-full gap-1 ${
                isAdmin
                  ? 'bg-slate-800/90 border-slate-700/80 text-slate-200'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              {isAdmin ? (
                /* NAVEGACIÓN ADMINISTRADOR: Home Admin, Recepción (Admin), Pedidos Técnicos */
                <>
                  {/* Pantalla 1 Admin: Home Administrador */}
                  <button
                    id="btn-nav-client"
                    type="button"
                    onClick={() => onNavigate('client')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'client'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title="Ir al Home del Administrador (Dashboard Ejecutivo)"
                  >
                    <Home
                      className={`w-3.5 h-3.5 ${
                        currentView === 'client' ? 'text-slate-950' : 'text-amber-400'
                      }`}
                    />
                    <span>Home Admin</span>
                  </button>

                  {/* Pantalla 2 Admin: Recepción de Cotizaciones */}
                  <button
                    id="btn-nav-admin"
                    type="button"
                    onClick={() => onNavigate('admin')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 relative whitespace-nowrap cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title="Dashboard de Recepción de Cotizaciones"
                  >
                    <Inbox
                      className={`w-3.5 h-3.5 ${
                        currentView === 'admin' ? 'text-white' : 'text-sky-400'
                      }`}
                    />
                    <span>1. Recepción (Admin)</span>
                    {pendingQuotesCount > 0 && (
                      <span
                        id="badge-pending-count"
                        className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          currentView === 'admin'
                            ? 'bg-white text-sky-700'
                            : 'bg-amber-400 text-slate-950 font-black animate-pulse'
                        }`}
                      >
                        {pendingQuotesCount}
                      </span>
                    )}
                  </button>

                  {/* Pantalla 3 Admin: Recepción de Pedidos por Técnicos */}
                  <button
                    id="btn-nav-technician-orders"
                    type="button"
                    onClick={() => onNavigate('technician_orders')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'technician_orders'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title="Recepción de pedidos por técnicos: registrar notas, aceptar solicitud o indicar trabajo realizado"
                  >
                    <Wrench
                      className={`w-3.5 h-3.5 ${
                        currentView === 'technician_orders' ? 'text-white' : 'text-indigo-400'
                      }`}
                    />
                    <span>2. Pedidos Técnicos</span>
                    {technicianOrdersCount > 0 && (
                      <span
                        className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          currentView === 'technician_orders'
                            ? 'bg-white text-indigo-900'
                            : 'bg-indigo-500/30 text-indigo-300'
                        }`}
                      >
                        {technicianOrdersCount}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                /* NAVEGACIÓN CLIENTES / VISITANTES */
                <>
                  {/* Inicio */}
                  <button
                    id="btn-nav-client"
                    type="button"
                    onClick={() => onNavigate('client')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'client'
                        ? 'bg-white text-sky-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                    title="Página de inicio, oferta y objetivos de la empresa"
                  >
                    <Home className="w-3.5 h-3.5 text-sky-600" />
                    <span>Inicio</span>
                  </button>

                  {/* Cotizar Malla: SOLO visible si el usuario ya está autenticado con Gmail */}
                  {isGmailConnected ? (
                    <button
                      id="btn-nav-quote-mesh"
                      type="button"
                      onClick={() => onNavigate('quote_mesh' as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                        (currentView as string) === 'quote_mesh'
                          ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-xs'
                          : 'text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200'
                      }`}
                      title="Cotizar mallas para ventanas (Autenticado con Gmail)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>Cotizar Malla</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Gmail ✓
                      </span>
                    </button>
                  ) : onOpenGmailConnect ? (
                    <button
                      id="btn-nav-auth-gmail"
                      type="button"
                      onClick={onOpenGmailConnect}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all whitespace-nowrap cursor-pointer"
                      title="Autentícate con tu cuenta de Gmail para acceder a Cotizar Malla"
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center text-[9px] font-black">
                        G
                      </span>
                      <span>Autenticar con Gmail</span>
                    </button>
                  ) : null}

                  {/* Asistente Virtual para Clientes por RUT */}
                  {onOpenAssistant && (
                    <button
                      id="btn-nav-assistant-client"
                      type="button"
                      onClick={onOpenAssistant}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200"
                      title="Asistente para Clientes: consulta información y estado de tus cotizaciones por RUT"
                    >
                      <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Asistente por RUT</span>
                    </button>
                  )}
                </>
              )}
            </nav>

            {/* Quick Contact badge on desktop */}
            <div className="hidden 2xl:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Asistencia inmediata</p>
                <p className="font-bold text-slate-800">+56 9 8000 2400</p>
              </div>
            </div>

            {/* CLOUD DATABASE STATUS / CONFIG BUTTON */}
            {onOpenSupabaseModal && (
              <button
                id="btn-open-supabase-modal"
                type="button"
                onClick={onOpenSupabaseModal}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  cloudConnected
                    ? 'bg-amber-50/90 text-amber-950 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title={
                  firebaseConnected
                    ? 'Google Firebase Firestore conectado y activo'
                    : 'Configuración y sincronización en la nube'
                }
              >
                <Database className={`w-3.5 h-3.5 ${cloudConnected ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="hidden xl:inline">
                  {firebaseConnected ? 'Firebase BD' : supabaseConnected ? 'Supabase' : 'BD Nube'}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    cloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`}
                />
              </button>
            )}

            {/* USER LOGIN / PROFILE BUTTON */}
            <div className={`relative pl-2 sm:pl-3 border-l ${isAdmin ? 'border-slate-800' : 'border-slate-200'}`}>
              {currentUser ? (
                <div className="relative">
                  <button
                    id="btn-user-profile-menu"
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl transition-colors cursor-pointer border ${
                      isAdmin
                        ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-white'
                        : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-xs ${
                        isAdmin ? 'bg-amber-500 text-slate-950' : 'bg-sky-600 text-white'
                      }`}
                    >
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className={`text-xs font-bold leading-tight flex items-center gap-1 ${isAdmin ? 'text-white' : 'text-slate-900'}`}>
                        <span className="truncate max-w-[110px]">{currentUser.fullName || currentUser.email}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className={`text-[10px] font-semibold capitalize block ${isAdmin ? 'text-amber-400' : 'text-sky-700'}`}>
                        {currentUser.role === 'admin' ? '🛡️ Administrador' : currentUser.role === 'tecnico' ? '🔧 Técnico' : '👤 Cliente'}
                      </span>
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <div
                      id="menu-user-dropdown"
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in text-xs"
                    >
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                          Usuario Activo
                        </span>
                        <p className="font-bold text-slate-900 truncate mt-0.5">{currentUser.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      </div>

                      <div className="py-1">
                        {onOpenSupabaseModal && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenSupabaseModal();
                            }}
                            className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Database className="w-3.5 h-3.5 text-amber-600" />
                              <span>Base de Datos en Nube</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              Activo
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onOpenLogin) onOpenLogin('reset_password');
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                          <span>Cambiar Contraseña</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onLogout) onLogout();
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-700 flex items-center gap-2 font-medium transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="btn-open-login"
                  type="button"
                  onClick={() => onOpenLogin && onOpenLogin('login')}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
                  title="Iniciar sesión o crear cuenta inmediata"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span>Iniciar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
