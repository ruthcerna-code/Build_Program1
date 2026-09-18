import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/Header';
import { HomeClientView } from './components/HomeClientView';
import { AdminQuotesView } from './components/AdminQuotesView';
import { ClientReceivedQuotesView } from './components/ClientReceivedQuotesView';
import { ApprovedQuotesView } from './components/ApprovedQuotesView';
import { TechnicianOrdersView } from './components/TechnicianOrdersView';
import { ClientQuotePortalView } from './components/ClientQuotePortalView';
import { AdminQuoteEditorModal } from './components/AdminQuoteEditorModal';
import { LoginModal, AuthMode } from './components/LoginModal';
import { SupabaseModal } from './components/SupabaseModal';
import {
  QuoteRequest,
  AdminQuoteDetails,
  InstallerAssignment,
  TechnicianExecution,
  UserAccount,
} from './types';
import {
  getStoredQuotes,
  addQuoteRequest,
  updateQuoteWithAdminDetails,
  deleteQuoteRequest,
  updateQuoteStatus,
  assignInstallerToQuote,
  unassignInstallerFromQuote,
  updateTechnicianExecution,
  syncWithSupabaseDatabase,
  syncWithCloudDatabases,
} from './services/quoteStorage';
import { isSupabaseConfigured } from './services/supabaseClient';
import { getCurrentUser, logoutUser } from './services/authStorage';
import {
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Eye,
  Sparkles,
  UserCheck,
  FileText,
  Wrench,
  Check
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('client');
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [lastCreatedQuote, setLastCreatedQuote] = useState<QuoteRequest | null>(null);
  const [selectedQuoteForPortal, setSelectedQuoteForPortal] = useState<QuoteRequest | null>(null);
  const [editingQuoteFromPortal, setEditingQuoteFromPortal] = useState<QuoteRequest | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<AuthMode>('login');
  const [authToast, setAuthToast] = useState<string | null>(null);

  // Automatic background synchronization with Cloud Database (Firebase / Supabase)
  useEffect(() => {
    syncWithCloudDatabases(currentUser?.role === 'cliente' ? currentUser.email : undefined)
      .then((res) => {
        if (res.success && res.quotes.length > 0) {
          setQuotes(res.quotes);
        }
      })
      .catch((err) => console.warn('Cloud database initial sync notice:', err));
  }, [currentUser]);

  // Sync auth state with localStorage and events
  useEffect(() => {
    const handleAuthEvent = (e: Event) => {
      const customEvent = e as CustomEvent<UserAccount | null>;
      if (customEvent.detail !== undefined) {
        setCurrentUser(customEvent.detail);
      } else {
        setCurrentUser(getCurrentUser());
      }
    };

    window.addEventListener('mallas_auth_updated', handleAuthEvent);
    return () => {
      window.removeEventListener('mallas_auth_updated', handleAuthEvent);
    };
  }, []);

  const handleOpenLogin = (mode: AuthMode = 'login') => {
    setLoginModalMode(mode);
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setAuthToast('Has cerrado sesión correctamente.');
    setTimeout(() => setAuthToast(null), 3500);
  };

  const handleAuthSuccess = (user: UserAccount, message: string) => {
    setCurrentUser(user);
    setAuthToast(message);
    setTimeout(() => setAuthToast(null), 4500);
  };

  // Load initial quotes and listen for updates
  useEffect(() => {
    const loaded = getStoredQuotes();
    setQuotes(loaded);

    const handleStorageUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<QuoteRequest[]>;
      if (customEvent.detail) {
        setQuotes(customEvent.detail);
      } else {
        setQuotes(getStoredQuotes());
      }
    };

    window.addEventListener('mallas_quotes_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener('mallas_quotes_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const pendingQuotesCount = quotes.filter((q) => q.status === 'pendiente').length;
  const receivedQuotesCount = quotes.filter(
    (q) => q.adminQuote !== undefined || q.status === 'cotizada' || q.status === 'aceptada'
  ).length;
  const approvedQuotesCount = quotes.filter((q) => q.status === 'aceptada').length;

  // For technician work orders badge: if logged in as client, count only their orders
  const technicianOrdersCount = quotes.filter((q) => {
    if (q.status !== 'aceptada') return false;
    if (currentUser && currentUser.role === 'cliente' && currentUser.email) {
      return q.clientEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim();
    }
    return true;
  }).length;

  // Effective quote for portal view
  const activePortalQuote =
    selectedQuoteForPortal ||
    quotes.find((q) => q.status === 'cotizada') ||
    quotes.find((q) => q.adminQuote) ||
    quotes[0] ||
    lastCreatedQuote ||
    null;

  const handleQuoteCreated = (newQuote: QuoteRequest) => {
    const updated = addQuoteRequest(newQuote);
    setQuotes(updated);
    setLastCreatedQuote(newQuote);
    setSelectedQuoteForPortal(newQuote);
    setShowSuccessModal(true);
  };

  const handleSaveAdminQuote = (quoteId: string, details: AdminQuoteDetails) => {
    const updated = updateQuoteWithAdminDetails(quoteId, details);
    setQuotes(updated);
    const target = updated.find((q) => q.id === quoteId);
    if (target) {
      setSelectedQuoteForPortal(target);
    }
  };

  const handleDeleteQuote = (quoteId: string) => {
    const updated = deleteQuoteRequest(quoteId);
    setQuotes(updated);
    if (selectedQuoteForPortal?.id === quoteId) {
      setSelectedQuoteForPortal(updated[0] || null);
    }
  };

  const handleViewClientQuoteScreen = (quote: QuoteRequest) => {
    setSelectedQuoteForPortal(quote);
    setCurrentView('received_quotes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToAdminFromSuccess = () => {
    setShowSuccessModal(false);
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAcceptQuote = (quoteId: string) => {
    const updated = updateQuoteStatus(quoteId, 'aceptada');
    setQuotes(updated);
    const target = updated.find((q) => q.id === quoteId);
    if (target) {
      setSelectedQuoteForPortal(target);
    }
  };

  const handleAssignInstaller = (quoteId: string, assignment: InstallerAssignment) => {
    const updated = assignInstallerToQuote(quoteId, assignment);
    setQuotes(updated);
  };

  const handleUnassignInstaller = (quoteId: string) => {
    const updated = unassignInstallerFromQuote(quoteId);
    setQuotes(updated);
  };

  const handleUpdateTechnicianExecution = (
    quoteId: string,
    execution: Partial<TechnicianExecution>
  ) => {
    const updated = updateTechnicianExecution(quoteId, execution);
    setQuotes(updated);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Header with 5 navigation views */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        pendingQuotesCount={pendingQuotesCount}
        receivedQuotesCount={receivedQuotesCount}
        approvedQuotesCount={approvedQuotesCount}
        technicianOrdersCount={technicianOrdersCount}
        currentUser={currentUser}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
      />

      {/* Screen selector indicator strip */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-800">Pantalla activa:</span>
            {currentView === 'client' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">
                Pantalla 1: Oferta, Objetivo & Solicitud de Ventanas (Cliente)
              </span>
            )}
            {currentView === 'admin' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-600 text-white font-bold">
                Pantalla 2: Recepción de Cotizaciones, Cambio de Valor & Envío (Admin)
              </span>
            )}
            {currentView === 'received_quotes' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold">
                Pantalla 3: Cotizaciones Recibidas por el Cliente (Vista de Consulta, No Modificación)
              </span>
            )}
            {currentView === 'approved_quotes' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-bold">
                Pantalla 4: Cotizaciones Aprobadas & Asignación de Instalador
              </span>
            )}
            {currentView === 'technician_orders' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-800 text-white font-bold">
                Pantalla 5: Recepción de Pedidos por Técnicos (Notas, Aceptar Solicitud & Trabajo Realizado)
              </span>
            )}
            {currentView === 'client_portal' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-white font-bold">
                Pantalla de Presupuesto Individual
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            {currentView !== 'client' && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('client');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-600 hover:text-sky-700 font-bold flex items-center gap-1 hover:underline"
              >
                <span>1. Inicio & Cotizar</span>
              </button>
            )}

            {currentView !== 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 hover:underline"
              >
                <span>2. Recepción (Admin)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentView !== 'received_quotes' && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('received_quotes');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-800 hover:text-sky-800 font-bold flex items-center gap-1 hover:underline"
              >
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>3. Cotizaciones Recibidas</span>
              </button>
            )}

            {currentView !== 'approved_quotes' && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('approved_quotes');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>4. Aprobadas & Instalador</span>
              </button>
            )}

            {currentView !== 'technician_orders' && (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('technician_orders');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 hover:underline"
              >
                <Wrench className="w-3.5 h-3.5 text-sky-600" />
                <span>5. Pedidos Técnicos</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentView === 'client' && (
          <HomeClientView
            onQuoteCreated={handleQuoteCreated}
            lastCreatedQuote={lastCreatedQuote}
            showSuccessModal={showSuccessModal}
            onCloseSuccessModal={() => setShowSuccessModal(false)}
            onGoToAdmin={handleGoToAdminFromSuccess}
            currentUser={currentUser}
          />
        )}

        {currentView === 'admin' && (
          <AdminQuotesView
            quotes={quotes}
            onSaveAdminQuote={handleSaveAdminQuote}
            onDeleteQuote={handleDeleteQuote}
            onAssignInstaller={handleAssignInstaller}
            onUnassignInstaller={handleUnassignInstaller}
            onNavigateToClient={() => {
              setCurrentView('client');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToClientQuoteScreen={handleViewClientQuoteScreen}
            onNavigateToReceivedQuotes={() => {
              setCurrentView('received_quotes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToApprovedQuotes={() => {
              setCurrentView('approved_quotes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToTechnicianOrders={() => {
              setCurrentView('technician_orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'received_quotes' && (
          <ClientReceivedQuotesView
            quotes={quotes}
            onAcceptQuote={handleAcceptQuote}
            onNavigateToApproved={() => {
              setCurrentView('approved_quotes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            currentUser={currentUser}
            onOpenLogin={() => handleOpenLogin('login')}
          />
        )}

        {currentView === 'approved_quotes' && (
          <ApprovedQuotesView
            quotes={quotes}
            onAssignInstaller={handleAssignInstaller}
            onNavigateToQuotes={() => {
              setCurrentView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToTechnicianOrders={() => {
              setCurrentView('technician_orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'technician_orders' && (
          <TechnicianOrdersView
            quotes={quotes}
            onUpdateTechnicianExecution={handleUpdateTechnicianExecution}
            onNavigateToApprovedAdmin={() => {
              setCurrentView('approved_quotes');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            currentUser={currentUser}
            onOpenLogin={() => handleOpenLogin('login')}
          />
        )}

        {currentView === 'client_portal' && (
          <ClientQuotePortalView
            quote={activePortalQuote}
            allQuotes={quotes}
            onSelectQuote={(q) => setSelectedQuoteForPortal(q)}
            onBackToAdmin={() => {
              setCurrentView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToRequestQuote={() => {
              setCurrentView('client');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onChangeValue={(q) => setEditingQuoteFromPortal(q)}
            onAcceptQuote={handleAcceptQuote}
            isAdminViewing={true}
          />
        )}
      </main>

      {/* Quick Edit Modal if opened from Client Portal */}
      {editingQuoteFromPortal && (
        <AdminQuoteEditorModal
          quote={editingQuoteFromPortal}
          onClose={() => setEditingQuoteFromPortal(null)}
          onSaveAndSend={(quoteId, details) => {
            handleSaveAdminQuote(quoteId, details);
            setEditingQuoteFromPortal(null);
            const updated = quotes.find((q) => q.id === quoteId);
            if (updated) {
              setSelectedQuoteForPortal({ ...updated, adminQuote: details });
            }
          }}
        />
      )}

      {/* User Login, Immediate Account Creation & Password Recovery Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={loginModalMode}
        prefilledEmail={currentUser?.email || ''}
      />

      {/* Supabase PostgreSQL Database Integration & Sync Modal */}
      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
        currentUser={currentUser}
        onQuotesSynced={() => setQuotes(getStoredQuotes())}
      />

      {/* Floating System Auth Toast */}
      {authToast && (
        <div
          id="auth-notification-toast"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs max-w-md animate-fade-in"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <p className="font-semibold text-slate-100 flex-1">{authToast}</p>
          <button
            type="button"
            onClick={() => setAuthToast(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Corporate Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800 text-xs">
            {/* Brand column */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-lg font-black text-white tracking-tight">
                  Mallas<span className="text-sky-400">Seguras</span>
                </span>
              </div>
              <p className="text-slate-400 max-w-md leading-relaxed">
                Empresa especializada en la fabricación e instalación de mallas de seguridad de alta resistencia 
                para ventanas, balcones y terrazas. Protegemos lo más valioso de tu hogar con garantía por escrito.
              </p>
              <div className="flex items-center gap-4 text-slate-400 text-xs pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Redes 180 kg/m²
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Perfiles Aluminio
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Garantía 2-3 Años
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <div className="space-y-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Navegación del Sistema
              </span>
              <ul className="space-y-2">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('client');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    1. Inicio y Cotizador
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('admin');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>2. Recepción (Admin)</span>
                    {pendingQuotesCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                        {pendingQuotesCount}
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('received_quotes');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    3. Cotizaciones Recibidas por Cliente
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('approved_quotes');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors"
                  >
                    4. Cotizaciones Aprobadas & Instalador
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('technician_orders');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <span>5. Recepción de Pedidos por Técnicos</span>
                    {technicianOrdersCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-sky-600 text-white font-bold text-[10px]">
                        {technicianOrdersCount}
                      </span>
                    )}
                  </button>
                </li>
                <li className="pt-2 border-t border-slate-800">
                  {currentUser ? (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate">
                        Conectado: <strong className="text-sky-400">{currentUser.fullName}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-rose-400 hover:text-rose-300 font-bold ml-2 underline cursor-pointer"
                      >
                        Salir
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenLogin('login')}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>🔐 Iniciar Sesión / Crear Cuenta</span>
                    </button>
                  )}
                </li>
                {!currentUser && (
                  <li>
                    <button
                      type="button"
                      onClick={() => handleOpenLogin('recover')}
                      className="text-slate-400 hover:text-sky-300 transition-colors text-[11px] cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña? Recuperar aquí
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact info */}
            <div className="space-y-2">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Atención y Contacto
              </span>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>+56 9 8000 2400 (WhatsApp)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>cotizaciones@mallas-seguras.cl</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Cobertura en toda la Región Metropolitana y alrededores</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <p>&copy; {new Date().getFullYear()} MallasSeguras &bull; Todos los derechos reservados.</p>
            <p>Sistema de Cotización y Gestión Técnica de Mallas para Ventanas</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
