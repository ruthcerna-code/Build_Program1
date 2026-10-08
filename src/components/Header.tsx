import React, { useState } from 'react';
import {
  ShieldCheck,
  Inbox,
  Home,
  Phone,
  Sparkles,
  Wrench,
  LogIn,
  LogOut,
  KeyRound,
  ChevronDown,
  Database,
} from 'lucide-react';
import { UserAccount } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { isUserAdmin, isUserTechnician } from '../services/authStorage';
import { CONTACT_PHONE_DISPLAY, WHATSAPP_QUOTE_URL } from '../constants/contact';
import { canManageUsers, canViewQuotes, canViewSales } from '../services/permissions';
import { isPrincipalAdminEmail } from '../constants/admin';

export type AppView =
  | 'client'
  | 'quote_mesh'
  | 'admin'
  | 'received_quotes'
  | 'approved_quotes'
  | 'technician_orders'
  | 'client_portal'
  | 'contact'
  | 'sales'
  | 'team';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  pendingQuotesCount: number;
  receivedQuotesCount: number;
  approvedQuotesCount: number;
  technicianOrdersCount: number;
  currentUser?: UserAccount | null;
  onOpenLogin?: (mode?: 'login' | 'recover' | 'reset_password') => void;
  onLogout?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  pendingQuotesCount,
  technicianOrdersCount,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenSupabaseModal,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabaseConnected = isSupabaseConfigured();
  const isAdmin = isUserAdmin(currentUser || null);
  const isTechnician = isUserTechnician(currentUser || null);
  const showSales = canViewSales(currentUser || null);
  const showTeam = canManageUsers(currentUser || null);
  const showInternalTools = isPrincipalAdminEmail(currentUser?.email);

  const navBase = isAdmin
    ? 'bg-slate-800/90 border-slate-700/80 text-slate-200'
    : 'bg-slate-100 border-slate-200 text-slate-700';

  return (
    <header
      id="app-main-header"
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        isAdmin
          ? 'bg-slate-900 border-b border-slate-800 text-white shadow-md'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs text-slate-900'
      }`}
    >
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
              {supabaseConnected ? 'Supabase conectado' : 'BD local'}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3">
          <div
            id="brand-logo-container"
            onClick={() => onNavigate('client')}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105 shrink-0 ${
                isAdmin
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-tr from-sky-600 to-blue-700 text-white shadow-sky-500/20'
              }`}
            >
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
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
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/40 uppercase tracking-wider">
                    Portal Administrador
                  </span>
                ) : (
                  <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200/70">
                    <Sparkles className="w-3 h-3 text-sky-600" />
                    Mallas de seguridad
                  </span>
                )}
              </div>
              <p
                className={`text-xs font-medium truncate ${
                  isAdmin ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {isAdmin
                  ? 'Centro de Recepción y Control de Cotizaciones'
                  : 'Evaluación y cotización sin costo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <nav
              id="navigation-toggle"
              className={`flex items-center p-1.5 rounded-xl border overflow-x-auto max-w-full gap-1 ${navBase}`}
            >
              {isAdmin ? (
                <>
                  <button
                    id="btn-nav-client"
                    type="button"
                    onClick={() => onNavigate('client')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'client'
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title="Ir al Home del Administrador"
                  >
                    <Home
                      className={`w-3.5 h-3.5 ${
                        currentView === 'client' ? 'text-slate-950' : 'text-amber-400'
                      }`}
                    />
                    <span>Home Admin</span>
                  </button>

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
                    <span className="hidden sm:inline">Recepción</span>
                    {pendingQuotesCount > 0 && (
                      <span
                        id="badge-pending-count"
                        className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          currentView === 'admin'
                            ? 'bg-white text-sky-700'
                            : 'bg-amber-400 text-slate-950 font-black'
                        }`}
                      >
                        {pendingQuotesCount}
                      </span>
                    )}
                  </button>

                  <button
                    id="btn-nav-technician-orders"
                    type="button"
                    onClick={() => onNavigate('technician_orders')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'technician_orders'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                    title="Recepción de pedidos por técnicos"
                  >
                    <Wrench
                      className={`w-3.5 h-3.5 ${
                        currentView === 'technician_orders' ? 'text-white' : 'text-indigo-400'
                      }`}
                    />
                    <span className="hidden sm:inline">Pedidos</span>
                    {technicianOrdersCount > 0 && (
                      <span
                        className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          currentView === 'technician_orders'
                            ? 'bg-white text-indigo-900'
                            : 'bg-indigo-500/30 text-indigo-300'
                        }`}
                      >
                        {technicianOrdersCount}
                      </span>
                    )}
                  </button>
                  {showSales && (
                    <button
                      type="button"
                      onClick={() => onNavigate('sales')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                        currentView === 'sales'
                          ? 'bg-white text-slate-900'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                      }`}
                    >
                      <span>Ventas</span>
                    </button>
                  )}
                  {showTeam && (
                    <button
                      type="button"
                      onClick={() => onNavigate('team')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                        currentView === 'team'
                          ? 'bg-white text-slate-900'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                      }`}
                    >
                      <span>Equipo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                      currentView === 'contact'
                        ? 'bg-white text-slate-900'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    <span>Contáctanos</span>
                  </button>
                </>
              ) : currentUser?.role === 'interno' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('client')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      currentView === 'client' ? 'bg-white text-sky-900 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 text-sky-600" />
                    <span>Inicio</span>
                  </button>
                  {canViewQuotes(currentUser) && (
                    <button
                      type="button"
                      onClick={() => onNavigate('admin')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                        currentView === 'admin' ? 'bg-white text-sky-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      <Inbox className="w-3.5 h-3.5 text-sky-600" />
                      <span>Cotizaciones</span>
                    </button>
                  )}
                  {showSales && (
                    <button
                      type="button"
                      onClick={() => onNavigate('sales')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                        currentView === 'sales' ? 'bg-white text-sky-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      <span>Ventas</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      currentView === 'contact' ? 'bg-white text-sky-900 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>Contáctanos</span>
                  </button>
                </>
              ) : isTechnician ? (
                <>
                  <button
                    id="btn-nav-client"
                    type="button"
                    onClick={() => onNavigate('client')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'client'
                        ? 'bg-white text-sky-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 text-sky-600" />
                    <span>Inicio</span>
                  </button>
                  <button
                    id="btn-nav-technician-orders"
                    type="button"
                    onClick={() => onNavigate('technician_orders')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'technician_orders'
                        ? 'bg-white text-indigo-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pedidos</span>
                    {technicianOrdersCount > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                        {technicianOrdersCount}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="btn-nav-client"
                    type="button"
                    onClick={() => onNavigate('client')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'client'
                        ? 'bg-white text-sky-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 text-sky-600" />
                    <span>Inicio</span>
                  </button>
                  <button
                    id="btn-nav-quote-mesh"
                    type="button"
                    onClick={() => onNavigate('quote_mesh')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      currentView === 'quote_mesh'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200'
                    }`}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${currentView === 'quote_mesh' ? 'text-amber-300' : 'text-sky-600'}`} />
                    <span>Cotizar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      currentView === 'contact'
                        ? 'bg-white text-sky-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-600" />
                    <span>Contáctanos</span>
                  </button>
                  {currentUser?.role === 'cliente' && (
                    <button
                      type="button"
                      onClick={() => onNavigate('received_quotes')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        currentView === 'received_quotes'
                          ? 'bg-white text-sky-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <Inbox className="w-3.5 h-3.5 text-sky-600" />
                      <span>Mis cotizaciones</span>
                    </button>
                  )}
                  {showSales && (
                    <button
                      type="button"
                      onClick={() => onNavigate('sales')}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        currentView === 'sales' ? 'bg-white text-sky-900 font-bold' : 'text-slate-600'
                      }`}
                    >
                      <span>Ventas</span>
                    </button>
                  )}
                </>
              )}
            </nav>

            {!isAdmin && (
              <a
                id="btn-header-whatsapp"
                href={WHATSAPP_QUOTE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 pl-2 pr-1 border-l border-slate-200 text-xs hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">WhatsApp</p>
                  <p className="font-bold text-slate-800">{CONTACT_PHONE_DISPLAY}</p>
                </div>
              </a>
            )}

            {showInternalTools && onOpenSupabaseModal && (
              <button
                id="btn-open-supabase-modal"
                type="button"
                onClick={onOpenSupabaseModal}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  supabaseConnected
                    ? 'bg-amber-50/90 text-amber-950 border-amber-300 hover:bg-amber-100'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title={supabaseConnected ? 'Supabase conectado' : 'Configuración de base de datos'}
              >
                <Database className={`w-3.5 h-3.5 ${supabaseConnected ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="hidden xl:inline">Supabase</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    supabaseConnected ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                />
              </button>
            )}

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
                    <div className="hidden md:block text-left">
                      <div className={`text-xs font-bold leading-tight flex items-center gap-1 ${isAdmin ? 'text-white' : 'text-slate-900'}`}>
                        <span className="truncate max-w-[110px]">{currentUser.fullName || currentUser.email}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className={`text-[10px] font-semibold capitalize block ${isAdmin ? 'text-amber-400' : 'text-sky-700'}`}>
                        {currentUser.role === 'admin'
                          ? 'Administrador'
                          : currentUser.role === 'tecnico'
                          ? 'Técnico'
                          : 'Cliente'}
                      </span>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div
                      id="menu-user-dropdown"
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in text-xs"
                    >
                      <div className="px-3.5 py-2 border-b border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                          Usuario activo
                        </span>
                        <p className="font-bold text-slate-900 truncate mt-0.5">{currentUser.fullName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      </div>

                      <div className="py-1">
                        {showInternalTools && onOpenSupabaseModal && (
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
                              <span>Base de datos</span>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              {supabaseConnected ? 'Activo' : 'Local'}
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
                          <span>Cambiar contraseña</span>
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
                          <span>Cerrar sesión</span>
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
                  title="Iniciar sesión"
                >
                  <LogIn className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Cuenta</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
