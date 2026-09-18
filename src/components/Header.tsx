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
  Database
} from 'lucide-react';
import { UserAccount } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { isFirebaseConfigured } from '../services/firebaseClient';

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
  onLogout?: () => void;
  onOpenSupabaseModal?: () => void;
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
  onLogout,
  onOpenSupabaseModal,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const firebaseConnected = isFirebaseConfigured();
  const supabaseConnected = isSupabaseConfigured();
  const cloudConnected = firebaseConnected || supabaseConnected;
  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo & Tagline */}
          <div
            id="brand-logo-container"
            onClick={() => onNavigate('client')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  Mallas<span className="text-sky-600">Seguras</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full border border-sky-200/70">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  Redes Certificadas
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Protección para ventanas, balcones y terrazas
              </p>
            </div>
          </div>

          {/* Navigation between 4 Views */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav
              id="navigation-toggle"
              className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 overflow-x-auto max-w-full gap-1"
            >
              {/* Pantalla 1 */}
              <button
                id="btn-nav-client"
                type="button"
                onClick={() => onNavigate('client')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  currentView === 'client'
                    ? 'bg-white text-sky-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Oferta, objetivo de la empresa y cotizador de ventanas con fechas"
              >
                <Home className="w-3.5 h-3.5 text-sky-600" />
                <span>1. Inicio & Cotizar</span>
              </button>

              {/* Pantalla 2 */}
              <button
                id="btn-nav-admin"
                type="button"
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative whitespace-nowrap ${
                  currentView === 'admin'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Recepción de solicitudes, cambio de valores y envío de presupuesto"
              >
                <Inbox
                  className={`w-3.5 h-3.5 ${
                    currentView === 'admin' ? 'text-white' : 'text-slate-500'
                  }`}
                />
                <span>2. Recepción (Admin)</span>
                {pendingQuotesCount > 0 && (
                  <span
                    id="badge-pending-count"
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      currentView === 'admin'
                        ? 'bg-white text-sky-700'
                        : 'bg-amber-500 text-white animate-pulse'
                    }`}
                  >
                    {pendingQuotesCount}
                  </span>
                )}
              </button>

              {/* Pantalla 3: Cotizaciones Recibidas por Cliente (Consulta) */}
              <button
                id="btn-nav-received-quotes"
                type="button"
                onClick={() => onNavigate('received_quotes')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  currentView === 'received_quotes' || currentView === 'client_portal'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Lista de cotizaciones recibidas por el cliente (vista de consulta, no modificación)"
              >
                <FileText
                  className={`w-3.5 h-3.5 ${
                    currentView === 'received_quotes' || currentView === 'client_portal'
                      ? 'text-sky-400'
                      : 'text-slate-500'
                  }`}
                />
                <span>3. Cotizaciones Recibidas</span>
                {receivedQuotesCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      currentView === 'received_quotes'
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {receivedQuotesCount}
                  </span>
                )}
              </button>

              {/* Pantalla 4: Cotizaciones Aprobadas & Asignación de Instalador */}
              <button
                id="btn-nav-approved-quotes"
                type="button"
                onClick={() => onNavigate('approved_quotes')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  currentView === 'approved_quotes'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Cotizaciones aprobadas por el cliente y asignación de técnico/instalador"
              >
                <UserCheck
                  className={`w-3.5 h-3.5 ${
                    currentView === 'approved_quotes' ? 'text-white' : 'text-emerald-600'
                  }`}
                />
                <span>4. Aprobadas & Instalador</span>
                {approvedQuotesCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      currentView === 'approved_quotes'
                        ? 'bg-white text-emerald-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {approvedQuotesCount}
                  </span>
                )}
              </button>

              {/* Pantalla 5: Recepción de Pedidos por Técnicos */}
              <button
                id="btn-nav-technician-orders"
                type="button"
                onClick={() => onNavigate('technician_orders')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                  currentView === 'technician_orders'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Recepción de pedidos por técnicos: registrar notas, aceptar solicitud o indicar trabajo realizado"
              >
                <Wrench
                  className={`w-3.5 h-3.5 ${
                    currentView === 'technician_orders' ? 'text-white' : 'text-sky-600'
                  }`}
                />
                <span>5. Pedidos Técnicos</span>
                {technicianOrdersCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      currentView === 'technician_orders'
                        ? 'bg-white text-sky-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {technicianOrdersCount}
                  </span>
                )}
              </button>
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
            <div className="relative pl-2 sm:pl-3 border-l border-slate-200">
              {currentUser ? (
                <div className="relative">
                  <button
                    id="btn-user-profile-menu"
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">
                        <span className="truncate max-w-[110px]">{currentUser.fullName || currentUser.email}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <span className="text-[10px] text-sky-700 font-semibold capitalize block">
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
