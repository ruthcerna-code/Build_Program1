import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/Header';
import { HomeClientView } from './components/HomeClientView';
import { QuoteMeshView } from './components/QuoteMeshView';
import { AdminQuotesView } from './components/AdminQuotesView';
import { ClientReceivedQuotesView } from './components/ClientReceivedQuotesView';
import { ApprovedQuotesView } from './components/ApprovedQuotesView';
import { TechnicianOrdersView } from './components/TechnicianOrdersView';
import { ClientQuotePortalView } from './components/ClientQuotePortalView';
import { AdminQuoteEditorModal } from './components/AdminQuoteEditorModal';
import { LoginModal, AuthMode } from './components/LoginModal';
import { GmailConnectModal } from './components/GmailConnectModal';
import { SupabaseModal } from './components/SupabaseModal';
import { ClientAssistantModal } from './components/ClientAssistantModal';
import { ClientAssistantFloatingButton } from './components/ClientAssistantFloatingButton';
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
  registerQuoteAcceptance,
  updateQuotePayment,
  assignInstallerToQuote,
  unassignInstallerFromQuote,
  updateTechnicianExecution,
  syncWithSupabaseDatabase,
  syncWithCloudDatabases,
} from './services/quoteStorage';
import { isSupabaseConfigured } from './services/supabaseClient';
import { getCurrentUser, logoutUser, isUserGmailConnected, isUserAdmin } from './services/authStorage';
import { recordUserAccessLog } from './services/accessLogService';
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
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
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
    if (currentUser) {
      recordUserAccessLog(currentUser, 'logout', `Cierre de sesión: ${currentUser.email}`);
    }
    logoutUser();
    setCurrentUser(null);
    setAuthToast('Has cerrado sesión correctamente.');
    setTimeout(() => setAuthToast(null), 3500);
  };

  const handleAuthSuccess = (user: UserAccount, message: string) => {
    setCurrentUser(user);
    recordUserAccessLog(user, 'login', `Inicio de sesión exitoso: ${user.fullName} (${user.role})`);
    setAuthToast(message);
    setTimeout(() => setAuthToast(null), 4500);
  };

  const handleNavigateToQuoteMesh = () => {
    if (currentUser && currentUser.email && currentUser.email.toLowerCase().endsWith('@gmail.com')) {
      setCurrentView('quote_mesh');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsGmailModalOpen(true);
    }
  };

  const handleGmailConnected = (user: UserAccount) => {
    setCurrentUser(user);
    recordUserAccessLog(user, 'login', `Autenticación con cuenta Gmail: ${user.email}`);
    setCurrentView('quote_mesh');
    setAuthToast(`¡Conectado con cuenta Gmail: ${user.email}! Ya puedes ingresar los datos de tu cotización.`);
    setTimeout(() => setAuthToast(null), 4500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Record connectivity timestamp in database on application start
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      recordUserAccessLog(
        user,
        'connectivity_ping',
        `Conectividad registrada en sistema: ${user.fullName} (${user.email})`
      );
    }
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

    // Record user connectivity and quote creation in Firestore database log
    recordUserAccessLog(
      currentUser || {
        id: newQuote.clientEmail,
        email: newQuote.clientEmail,
        fullName: newQuote.clientName,
        role: 'cliente',
        passwordHash: '',
        createdAt: new Date().toISOString(),
      },
      'quote_created',
      `Cotización realizada: Folio ${newQuote.folio} (${newQuote.windows.length} ventanas, ${newQuote.totalAreaM2} m²)`,
      newQuote.folio
    );
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
    const updated = registerQuoteAcceptance(quoteId);
    setQuotes(updated);
    const target = updated.find((q) => q.id === quoteId);
    if (target) {
      setSelectedQuoteForPortal(target);
    }
  };

  const handleUpdatePayment = (
    quoteId: string,
    paidAmount: number,
    paymentStatus?: 'pendiente' | 'abono_parcial' | 'pagado_total',
    paymentMethod?: string,
    paymentNotes?: string
  ) => {
    const updated = updateQuotePayment(
      quoteId,
      paidAmount,
      paymentStatus,
      paymentMethod,
      paymentNotes
    );
    setQuotes(updated);
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
      {/* Top Header with streamlined navigation views */}
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'quote_mesh') {
            handleNavigateToQuoteMesh();
          } else {
            setCurrentView(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        pendingQuotesCount={pendingQuotesCount}
        receivedQuotesCount={receivedQuotesCount}
        approvedQuotesCount={approvedQuotesCount}
        technicianOrdersCount={technicianOrdersCount}
        currentUser={currentUser}
        onOpenLogin={handleOpenLogin}
        onOpenGmailConnect={() => setIsGmailModalOpen(true)}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentView === 'client' && (
          <HomeClientView
            quotes={quotes}
            onGoToQuoteMesh={handleNavigateToQuoteMesh}
            onAuthenticateWithGmail={() => setIsGmailModalOpen(true)}
            onGoToAdmin={() => {
              setCurrentView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToTechnicianOrders={() => {
              setCurrentView('technician_orders');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onGoToAccessLogs={() => {
              setCurrentView('admin');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            currentUser={currentUser}
            onRespondQuote={(quote) => {
              handleViewClientQuoteScreen(quote);
            }}
          />
        )}

        {currentView === 'quote_mesh' && (
          !isUserGmailConnected(currentUser) ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Autenticación Requerida con Gmail
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Para solicitar cotización de mallas de seguridad, esta opción exige autenticarse previamente con tu cuenta de Gmail (@gmail.com). Conecta tu cuenta para ingresar las medidas de tus ventanas.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsGmailModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black">
                    G
                  </span>
                  <span>Autenticar con Gmail</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('client')}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          ) : (
            <QuoteMeshView
              onQuoteCreated={handleQuoteCreated}
              currentUser={currentUser}
              onBackToHome={() => {
                setCurrentView('client');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoToAdmin={() => {
                setCurrentView('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onChangeGmailAccount={() => setIsGmailModalOpen(true)}
            />
          )
        )}

        {currentView === 'admin' && (
          !isUserAdmin(currentUser) ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Acceso Exclusivo para Usuario Administrador
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                El usuario administrador es quien puede recepcionar las cotizaciones y pedidos técnicos. Inicia sesión con tus credenciales de administrador (ej: <strong>ruth.cerna@gmail.com</strong> o <strong>rcv.informacion@gmail.com</strong>).
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenLogin('login')}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Iniciar Sesión como Administrador
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('client')}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          ) : (
            <AdminQuotesView
              quotes={quotes}
              onSaveAdminQuote={handleSaveAdminQuote}
              onDeleteQuote={handleDeleteQuote}
              onAssignInstaller={handleAssignInstaller}
              onUnassignInstaller={handleUnassignInstaller}
              onAcceptQuote={handleAcceptQuote}
              onUpdatePayment={handleUpdatePayment}
              onNavigateToClient={() => {
                setCurrentView('client');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToClientQuoteScreen={handleViewClientQuoteScreen}
              onNavigateToTechnicianOrders={() => {
                setCurrentView('technician_orders');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )
        )}

        {currentView === 'technician_orders' && (
          (!isUserAdmin(currentUser) && currentUser?.role !== 'tecnico') ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-sky-800/10 text-sky-800 flex items-center justify-center mx-auto">
                <Wrench className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Recepción de Pedidos Técnicos
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Esta sección está disponible para el Usuario Administrador e Instaladores Técnicos para coordinar órdenes y ejecución técnica.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenLogin('login')}
                  className="px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('client')}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          ) : (
            <TechnicianOrdersView
              quotes={quotes}
              onUpdateTechnicianExecution={handleUpdateTechnicianExecution}
              onNavigateToApprovedAdmin={() => {
                setCurrentView('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              currentUser={currentUser}
              onOpenLogin={() => handleOpenLogin('login')}
            />
          )
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
            onGoToRequestQuote={handleNavigateToQuoteMesh}
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

      {/* Gmail Account Connection Modal to start Quoting */}
      <GmailConnectModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        onConnected={handleGmailConnected}
        defaultEmail={currentUser?.email || 'ruth.cerna@gmail.com'}
      />

      {/* Supabase PostgreSQL Database Integration & Sync Modal */}
      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
        currentUser={currentUser}
        onQuotesSynced={() => setQuotes(getStoredQuotes())}
      />

      {/* Customer Virtual Assistant Modal (Strictly grounded by RUT) */}
      <ClientAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        quotes={quotes}
        currentUser={currentUser}
        onSelectQuoteToView={(q) => handleViewClientQuoteScreen(q)}
      />

      {/* Floating Customer Assistant Trigger Button (Accessible to clients) */}
      {!isUserAdmin(currentUser) && (
        <ClientAssistantFloatingButton
          onClick={() => setIsAssistantOpen(true)}
          quotesCount={
            quotes.filter((q) =>
              currentUser?.rut
                ? q.clientRut === currentUser.rut
                : currentUser?.email
                ? q.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
                : true
            ).length
          }
        />
      )}

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
