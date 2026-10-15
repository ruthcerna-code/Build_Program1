import React, { useState } from 'react';
import { LogIn, LogOut, ChevronDown, Database, ExternalLink } from 'lucide-react';
import { UserAccount } from '../types';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { isUserAdmin, isUserTechnician } from '../services/authStorage';
import { WHATSAPP_QUOTE_URL } from '../constants/contact';
import { canViewQuotes, canViewSales } from '../services/permissions';
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
  | 'privacy'
  | 'terms'
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

interface NavItem {
  view: AppView;
  label: string;
  count?: number;
  id?: string;
}

function roleLabel(user: UserAccount) {
  if (isUserAdmin(user)) return 'Administradora';
  if (user.role === 'tecnico') return 'Técnico';
  if (user.role === 'interno') return 'Equipo interno';
  return 'Cliente';
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  pendingQuotesCount,
  approvedQuotesCount,
  technicianOrdersCount,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenSupabaseModal,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabaseConnected = isSupabaseConfigured();
  const user = currentUser || null;
  const isAdmin = isUserAdmin(user);
  const isTechnician = isUserTechnician(user);
  const isStaff = isAdmin || isTechnician || user?.role === 'interno';
  const showInternalTools = isPrincipalAdminEmail(user?.email);

  const goPublicSection = (id: string) => {
    if (currentView !== 'client') onNavigate('client');
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, currentView === 'client' ? 0 : 80);
  };

  const staffNav: NavItem[] = isAdmin
    ? [
        { view: 'admin', label: 'CT recibida', count: pendingQuotesCount, id: 'btn-nav-admin' },
        { view: 'approved_quotes', label: 'CT Aceptadas', count: approvedQuotesCount, id: 'btn-nav-approved-quotes' },
        { view: 'sales', label: 'Ventas' },
        { view: 'team', label: 'Cuentas' },
      ]
    : isTechnician
    ? [
        { view: 'client', label: 'Inicio', id: 'btn-nav-client' },
        { view: 'technician_orders', label: 'Pedidos', count: technicianOrdersCount, id: 'btn-nav-technician-orders' },
      ]
    : [
        { view: 'client', label: 'Inicio' },
        ...(canViewQuotes(user) ? [{ view: 'admin' as AppView, label: 'Cotizaciones' }] : []),
        ...(canViewSales(user) ? [{ view: 'sales' as AppView, label: 'Ventas' }] : []),
        { view: 'contact', label: 'Contáctanos' },
      ];

  const userMenu = user ? (
    <div className="relative">
      <button
        id="btn-user-profile-menu"
        type="button"
        aria-haspopup="menu"
        aria-expanded={showUserMenu}
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`flex items-center gap-2 rounded-full py-1 pl-1 pr-3 cursor-pointer transition-colors ${
          isStaff ? 'bg-nydo-cream/10 hover:bg-nydo-cream/20 text-nydo-cream' : 'bg-nydo-ink/10 hover:bg-nydo-ink/15 text-nydo-ink'
        }`}
      >
        <span
          className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
            isStaff ? 'bg-nydo-orange text-nydo-ink' : 'bg-nydo-ink text-nydo-cream'
          }`}
        >
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
        </span>
        <span className="hidden md:block text-left leading-tight">
          <span className="block max-w-[140px] truncate text-xs font-bold">{user.fullName || user.email}</span>
          <span className={`block text-[11px] ${isStaff ? 'text-nydo-cream/60' : 'text-nydo-ink/70'}`}>{roleLabel(user)}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {showUserMenu && (
        <div
          id="menu-user-dropdown"
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-nydo-ink/10 bg-white py-1.5 text-sm text-nydo-ink shadow-xl z-50"
        >
          <div className="border-b border-nydo-ink/10 px-4 py-2.5">
            <p className="truncate font-bold">{user.fullName}</p>
            <p className="truncate text-xs text-nydo-ink/60">{user.email}</p>
          </div>
          {isStaff && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowUserMenu(false);
                onNavigate('client');
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-nydo-cream/60 cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 opacity-60" />
              {isAdmin ? 'Resumen del panel' : 'Ver sitio público'}
            </button>
          )}
          {showInternalTools && onOpenSupabaseModal && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowUserMenu(false);
                onOpenSupabaseModal();
              }}
              className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left hover:bg-nydo-cream/60 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 opacity-60" />
                Base de datos
              </span>
              <span className="text-[11px] font-bold text-nydo-ink/60">{supabaseConnected ? 'Activa' : 'Local'}</span>
            </button>
          )}
          <div className="mt-1 border-t border-nydo-ink/10 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowUserMenu(false);
                onLogout?.();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left font-semibold text-[#9f1d24] hover:bg-[#fdecec] cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <button
      id="btn-open-login"
      type="button"
      onClick={() => onOpenLogin?.('login')}
      className="nydo-btn nydo-btn-ink !min-h-10 !py-2 !px-4 text-xs"
      title="Iniciar sesión"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Cuenta</span>
    </button>
  );

  if (isStaff) {
    return (
      <header id="app-main-header" className="sticky top-0 z-40 bg-nydo-ink text-nydo-cream font-body shadow-[0_1px_0_#f2e7dd1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <button
              id="brand-logo-container"
              type="button"
              onClick={() => onNavigate(isAdmin ? 'admin' : 'client')}
              className="flex items-baseline gap-3 shrink-0 cursor-pointer bg-transparent border-0 text-nydo-cream"
            >
              <span className="nydo-display text-3xl tracking-[-0.06em]">
                nydo<span className="text-nydo-orange" aria-hidden="true">✳</span>
              </span>
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em] text-nydo-cream/55">
                Panel de operación
              </span>
            </button>

            <div className="flex items-center gap-3">
              {showInternalTools && onOpenSupabaseModal && (
                <button
                  id="btn-open-supabase-modal"
                  type="button"
                  onClick={onOpenSupabaseModal}
                  className="hidden md:inline-flex items-center gap-2 rounded-full border border-nydo-cream/15 px-3 py-1.5 text-xs font-semibold text-nydo-cream/80 hover:bg-nydo-cream/10 cursor-pointer"
                  title={supabaseConnected ? 'Supabase conectado' : 'Configuración de base de datos'}
                >
                  <span className={`h-2 w-2 rounded-full ${supabaseConnected ? 'bg-[#3ccf74]' : 'bg-nydo-yellow'}`} />
                  {supabaseConnected ? 'Base conectada' : 'Base local'}
                </button>
              )}
              {userMenu}
            </div>
          </div>

          <nav id="navigation-toggle" aria-label="Secciones del panel" className="-mb-px flex gap-1 overflow-x-auto">
            {staffNav.map((item) => {
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  id={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onNavigate(item.view)}
                  className={`relative inline-flex items-center gap-2 whitespace-nowrap border-b-[3px] px-3.5 pb-3 pt-1 text-sm font-bold transition-colors cursor-pointer ${
                    active
                      ? 'border-nydo-orange text-nydo-cream'
                      : 'border-transparent text-nydo-cream/60 hover:text-nydo-cream'
                  }`}
                >
                  {item.label}
                  {!!item.count && (
                    <span
                      id={item.view === 'admin' ? 'badge-pending-count' : undefined}
                      className={`min-w-5 rounded-full px-1.5 text-center text-[11px] font-bold tabular-nums ${
                        active ? 'bg-nydo-orange text-nydo-ink' : 'bg-nydo-cream/15 text-nydo-cream'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header id="app-main-header" className="sticky top-0 z-40 bg-nydo-orange text-nydo-ink">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14">
        <div className="flex items-center justify-between gap-3 py-5 border-b border-nydo-ink/25">
          <div
            id="brand-logo-container"
            onClick={() => onNavigate('client')}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div className="leading-none">
              <span className="nydo-display text-[2rem] sm:text-4xl tracking-[-0.08em]">
                nydo<span aria-hidden="true">✳</span>
              </span>
              <small className="block font-body text-[10px] tracking-[0.2em] font-bold mt-1.5">
                MALLAS DE PROTECCIÓN
              </small>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <nav id="navigation-toggle" className="flex items-center gap-4 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => goPublicSection('espacios')}
                className="hidden md:inline text-sm font-semibold cursor-pointer bg-transparent border-0"
              >
                Espacios
              </button>
              <button
                type="button"
                onClick={() => goPublicSection('proceso')}
                className="hidden md:inline text-sm font-semibold cursor-pointer bg-transparent border-0"
              >
                Cómo funciona
              </button>
              <button
                type="button"
                onClick={() => goPublicSection('preguntas')}
                className="hidden md:inline text-sm font-semibold cursor-pointer bg-transparent border-0"
              >
                Preguntas
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="hidden sm:inline text-sm font-semibold cursor-pointer bg-transparent border-0"
              >
                Contáctanos
              </button>
              {user?.role === 'cliente' && (
                <button
                  type="button"
                  onClick={() => onNavigate('received_quotes')}
                  className="hidden sm:inline text-sm font-semibold cursor-pointer bg-transparent border-0"
                >
                  Mis cotizaciones
                </button>
              )}
              <button
                id="btn-nav-quote-mesh"
                type="button"
                onClick={() => onNavigate('quote_mesh')}
                className="nydo-btn !min-h-10 !py-2 !px-5 text-sm"
              >
                Cotizar mi espacio ↗
              </button>
            </nav>

            <a
              id="btn-header-whatsapp"
              href={WHATSAPP_QUOTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex nydo-btn nydo-btn-whatsapp !min-h-10 !py-2 !px-4 text-sm"
            >
              WhatsApp
            </a>

            <div className="relative pl-2 sm:pl-3 border-l border-nydo-ink/25">{userMenu}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
