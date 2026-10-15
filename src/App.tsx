import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/Header';
import { HomeClientView } from './components/HomeClientView';
import { GuidedQuoteView } from './components/GuidedQuoteView';
import { LegalView } from './components/LegalView';
import { SimpleQuotesView } from './components/SimpleQuotesView';
import { ContactView } from './components/ContactView';
import { SalesView } from './components/SalesView';
import { InternalUsersView } from './components/InternalUsersView';
import { AdminSyncBar } from './components/AdminSyncBar';
import { TechnicianOrdersView } from './components/TechnicianOrdersView';
import { ClientQuotePortalView } from './components/ClientQuotePortalView';
import { AdminQuoteEditorModal } from './components/AdminQuoteEditorModal';
import { LoginModal, AuthMode } from './components/LoginModal';
import { SupabaseModal } from './components/SupabaseModal';
import { ClientAssistantModal } from './components/ClientAssistantModal';
import { ClientAssistantFloatingButton } from './components/ClientAssistantFloatingButton';
import {
  QuoteRequest,
  AdminQuoteDetails,
  InstallerAssignment,
  TechnicianExecution,
  UserAccount,
  QuoteStatus,
} from './types';
import {
  getStoredQuotes,
  addQuoteRequest,
  updateQuoteWithAdminDetails,
  deleteQuoteRequest,
  registerQuoteAcceptance,
  updateQuotePayment,
  assignInstallerToQuote,
  unassignInstallerFromQuote,
  updateTechnicianExecution,
  syncWithCloudDatabases,
  updateQuoteStatus,
  updateQuoteTotalDirectly,
  registerQuotePayment,
  saveQuotesToStorage,
} from './services/quoteStorage';
import { getCurrentUser, logoutUser, isUserAdmin, isInternalUser, syncUsersWithSupabase } from './services/authStorage';
import { canSyncData, canViewQuotes, canViewSales, canManageUsers } from './services/permissions';
import { clearGuidedDraft, hasUnsavedGuidedDraft } from './services/guidedQuoteDraft';
import { CONTACT_PHONE_DISPLAY, CONTACT_EMAIL, CONTACT_COVERAGE, WHATSAPP_QUOTE_URL } from './constants/contact';
import { recordUserAccessLog, syncAccessLogsWithSupabase } from './services/accessLogService';
import { apiFetch } from './services/sessionApi';
import {
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Wrench,
  Check
} from 'lucide-react';

function viewFromPath(pathname: string): AppView {
  if (pathname.startsWith('/cotizar')) return 'quote_mesh';
  if (pathname.startsWith('/contacto')) return 'contact';
  if (pathname.startsWith('/privacidad')) return 'privacy';
  if (pathname.startsWith('/terminos')) return 'terms';
  return 'client';
}

function pathFromView(view: AppView): string | null {
  if (view === 'quote_mesh') return '/cotizar';
  if (view === 'contact') return '/contacto';
  if (view === 'privacy') return '/privacidad';
  if (view === 'terms') return '/terminos';
  if (view === 'client') return '/';
  return null;
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() =>
    typeof window === 'undefined' ? 'client' : viewFromPath(window.location.pathname)
  );
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [lastCreatedQuote, setLastCreatedQuote] = useState<QuoteRequest | null>(null);
  const [selectedQuoteForPortal, setSelectedQuoteForPortal] = useState<QuoteRequest | null>(null);
  const [editingQuoteFromPortal, setEditingQuoteFromPortal] = useState<QuoteRequest | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<AuthMode>('login');
  const [authToast, setAuthToast] = useState<string | null>(null);

  // Automatic background synchronization with Supabase only
  useEffect(() => {
    syncWithCloudDatabases(currentUser?.role === 'cliente' ? currentUser.email : undefined)
      .then((res) => {
        if (res.success && res.quotes.length > 0) {
          setQuotes(res.quotes);
        }
      })
      .catch((err) => console.warn('Cloud database initial sync notice:', err));

    syncUsersWithSupabase().catch((err) => console.warn('Supabase users sync notice:', err));
    syncAccessLogsWithSupabase().catch((err) => console.warn('Supabase access logs sync notice:', err));
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

  useEffect(() => {
    if (!isUserAdmin(currentUser)) return;
    if (currentView === 'contact' || currentView === 'client') {
      setCurrentView('admin');
    }
  }, [currentUser, currentView]);

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
    setCurrentView('client');
    setAuthToast('Has cerrado sesión correctamente.');
    setTimeout(() => setAuthToast(null), 3500);
  };

  const handleAuthSuccess = (user: UserAccount, message: string) => {
    setCurrentUser(user);
    recordUserAccessLog(user, 'login', `Inicio de sesión exitoso: ${user.fullName} (${user.role})`);
    setAuthToast(message);
    setTimeout(() => setAuthToast(null), 4500);
    if (isUserAdmin(user)) {
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToView = (view: AppView, options?: { force?: boolean }) => {
    const leavingQuote =
      currentView === 'quote_mesh' && view !== 'quote_mesh' && view !== 'privacy' && view !== 'terms';
    if (!options?.force && leavingQuote && hasUnsavedGuidedDraft()) {
      const ok = window.confirm(
        'Tienes una solicitud sin enviar. Si sales ahora, se perderán las respuestas.'
      );
      if (!ok) return;
      clearGuidedDraft();
    }
    setCurrentView(view);
    const path = pathFromView(view);
    if (path && window.location.pathname !== path) {
      window.history.pushState({ view }, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToQuoteMesh = () => {
    goToView('quote_mesh');
  };

  useEffect(() => {
    const onPop = () => setCurrentView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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

  const handleUpdateStatus = (quoteId: string, status: QuoteStatus) => {
    setQuotes(updateQuoteStatus(quoteId, status));
    setAuthToast('Estado actualizado.');
    setTimeout(() => setAuthToast(null), 3000);
  };

  const handleSendQuoteEmail = async (
    quoteId: string,
    details?: { total?: number; notes?: string; adminQuote?: QuoteRequest['adminQuote'] }
  ) => {
    try {
      const current = quotes.find((q) => q.id === quoteId);
      const data = await apiFetch(`/api/quotes/${quoteId}/send-email`, {
        method: 'POST',
        body: JSON.stringify({
          adminQuote: details?.adminQuote || current?.adminQuote,
          total: details?.total,
          notes: details?.notes,
        }),
      });
      if (data.quote) {
        setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, ...data.quote } : q)));
      }
      setAuthToast(data.message || `Correo enviado.`);
    } catch (err: any) {
      const message = err?.message || 'No pudimos enviar el correo al cliente.';
      setAuthToast(message);
      throw err;
    }
    setTimeout(() => setAuthToast(null), 7000);
  };

  const handleUpdateNotes = (quoteId: string, notes: string, total?: number) => {
    if (typeof total === 'number') {
      setQuotes(updateQuoteTotalDirectly(quoteId, total, notes));
    }
    setAuthToast('Cambios guardados.');
    setTimeout(() => setAuthToast(null), 3000);
  };

  const handleRegisterPayment = (quoteId: string, amount: number, method?: string, notes?: string) => {
    setQuotes(registerQuotePayment(quoteId, amount, method, notes));
    setAuthToast('Pago registrado.');
    setTimeout(() => setAuthToast(null), 3000);
  };

  const handleSoftDelete = (quoteId: string) => {
    setQuotes(deleteQuoteRequest(quoteId));
    setAuthToast('Cotización eliminada. Queda en el historial.');
    setTimeout(() => setAuthToast(null), 3500);
  };

  const adminUi = isUserAdmin(currentUser);
  const staffUi = isInternalUser(currentUser);

  return (
    <div
      className={
        staffUi
          ? 'min-h-screen ops-shell flex flex-col selection:bg-nydo-yellow selection:text-nydo-ink'
          : 'min-h-screen bg-nydo-cream text-nydo-ink flex flex-col font-body selection:bg-nydo-yellow selection:text-nydo-ink'
      }
    >
      {/* Top Header with streamlined navigation views */}
      <Header
        currentView={currentView}
        onNavigate={goToView}
        pendingQuotesCount={pendingQuotesCount}
        receivedQuotesCount={receivedQuotesCount}
        approvedQuotesCount={approvedQuotesCount}
        technicianOrdersCount={technicianOrdersCount}
        currentUser={currentUser}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
        onOpenSupabaseModal={() => setShowSupabaseModal(true)}
      />

      {/* Main Content Area */}
      <main
        className={
          currentView === 'client' && !adminUi
            ? 'flex-1 w-full'
            : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8'
        }
      >
        {currentView === 'client' && (
          <HomeClientView
            quotes={quotes}
            onGoToQuoteMesh={handleNavigateToQuoteMesh}
            onGoToAdmin={() => goToView('admin')}
            onGoToTechnicianOrders={() => goToView('technician_orders')}
            onGoToAccessLogs={() => goToView('admin')}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            currentUser={currentUser}
            onRespondQuote={(quote) => {
              handleViewClientQuoteScreen(quote);
            }}
          />
        )}

        {currentView === 'quote_mesh' && (
          <GuidedQuoteView
            currentUser={currentUser}
            onBackToHome={() => goToView('client')}
            onGoToPrivacy={() => goToView('privacy')}
            onGoToTerms={() => goToView('terms')}
            onSubmitted={(quote) => {
              const current = getStoredQuotes();
              if (!current.some((item) => item.id === quote.id)) {
                setQuotes(addQuoteRequest(quote));
              }
              setLastCreatedQuote(quote);
            }}
          />
        )}

        {currentView === 'privacy' && <LegalView kind="privacy" onBack={() => goToView('quote_mesh', { force: true })} />}
        {currentView === 'terms' && <LegalView kind="terms" onBack={() => goToView('quote_mesh', { force: true })} />}

        {currentView === 'admin' && (
          !(isUserAdmin(currentUser) || (currentUser?.role === 'interno' && canViewQuotes(currentUser))) ? (
            <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Acceso Exclusivo para Usuario Administrador
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                El usuario administrador es quien puede recepcionar las cotizaciones y pedidos técnicos. Inicia sesión con la cuenta creada en administración (administradora: <strong>ruth.cerna@gmail.com</strong>).
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
            <SimpleQuotesView
              quotes={quotes.filter((q) => q.status !== 'aceptada')}
              currentUser={currentUser}
              title="CT recibida"
              banner={
                canSyncData(currentUser) ? (
                  <AdminSyncBar
                    onApplyQuotes={(remote) => {
                      const local = getStoredQuotes();
                      const remoteIds = new Set(remote.map((q: QuoteRequest) => q.id));
                      const extras = local.filter((q) => !remoteIds.has(q.id));
                      const merged = [...remote, ...extras];
                      saveQuotesToStorage(merged);
                      setQuotes(merged);
                    }}
                  />
                ) : undefined
              }
              onUpdateStatus={handleUpdateStatus}
              onUpdateNotes={handleUpdateNotes}
              onDeleteQuote={handleSoftDelete}
              onAcceptQuote={handleAcceptQuote}
              onRegisterPayment={handleRegisterPayment}
              onSendEmail={handleSendQuoteEmail}
              toast={authToast}
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

        {currentView === 'contact' && !isUserAdmin(currentUser) && <ContactView />}

        {currentView === 'approved_quotes' &&
          (isUserAdmin(currentUser) || (currentUser?.role === 'interno' && canViewQuotes(currentUser)) ? (
            <SimpleQuotesView
              quotes={quotes.filter((q) => q.status === 'aceptada')}
              currentUser={currentUser}
              title="CT Aceptadas"
              variant="accepted"
              onUpdateStatus={handleUpdateStatus}
              onUpdateNotes={handleUpdateNotes}
              onDeleteQuote={handleSoftDelete}
              onRegisterPayment={handleRegisterPayment}
              onSendEmail={handleSendQuoteEmail}
              toast={authToast}
            />
          ) : (
            <p className="text-center py-16 text-slate-600">Solo el administrador ve las cotizaciones aceptadas.</p>
          ))}

        {currentView === 'received_quotes' && (
          <SimpleQuotesView
            quotes={quotes}
            currentUser={currentUser}
            title="Mis cotizaciones"
            onAcceptQuote={handleAcceptQuote}
            toast={authToast}
          />
        )}

        {currentView === 'sales' &&
          (canViewSales(currentUser) ? (
            <SalesView
              quotes={quotes}
              currentUser={currentUser}
              onRegisterPayment={handleRegisterPayment}
            />
          ) : (
            <p className="text-center py-16 text-slate-600">No tienes permiso para ver ventas.</p>
          ))}

        {currentView === 'team' &&
          (canManageUsers(currentUser) ? (
            <InternalUsersView />
          ) : (
            <p className="text-center py-16 text-slate-600">Solo la administradora gestiona las cuentas.</p>
          ))}

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
            void handleSendQuoteEmail(quoteId, { adminQuote: details, total: details.total, notes: details.adminNotes });
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

      {/* Customer Virtual Assistant Modal (Strictly grounded by RUT) */}
      <ClientAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        quotes={quotes}
        currentUser={currentUser}
        onSelectQuoteToView={(q) => handleViewClientQuoteScreen(q)}
      />

      {(currentView === 'client' ||
        currentView === 'quote_mesh' ||
        currentView === 'client_portal' ||
        currentView === 'received_quotes' ||
        currentView === 'contact') &&
        !isUserAdmin(currentUser) && (
        <>
          <a
            href={WHATSAPP_QUOTE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 left-6 z-40 nydo-btn nydo-btn-whatsapp shadow-xl"
          >
            WhatsApp
          </a>
          <ClientAssistantFloatingButton
            onClick={() => setIsAssistantOpen(true)}
            quotesCount={
              quotes.filter((q) =>
                currentUser?.rut
                  ? q.clientRut === currentUser.rut
                  : currentUser?.email
                  ? q.clientEmail.toLowerCase() === currentUser.email.toLowerCase()
                  : false
              ).length
            }
          />
        </>
      )}

      {/* Floating System Auth Toast */}
      {authToast && (
        <div
          id="auth-notification-toast"
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-nydo-ink text-nydo-cream px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm max-w-md animate-fade-in font-body"
        >
          <div className="w-7 h-7 rounded-full bg-nydo-orange text-nydo-ink flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <p className="font-semibold flex-1">{authToast}</p>
          <button
            type="button"
            onClick={() => setAuthToast(null)}
            aria-label="Cerrar aviso"
            className="text-nydo-cream/60 hover:text-nydo-cream text-xs font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {staffUi ? (
        <footer className="border-t border-nydo-ink/10 bg-[#f7f1eb] py-5 text-xs text-nydo-ink/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>
              <span className="nydo-display text-base text-nydo-ink tracking-[-0.04em]">
                nydo<span className="text-nydo-orange" aria-hidden="true">✳</span>
              </span>{' '}
              Panel de operación · © {new Date().getFullYear()} Nydo Mallas
            </p>
            <p>
              {CONTACT_PHONE_DISPLAY} · {CONTACT_EMAIL}
            </p>
          </div>
        </footer>
      ) : (
        <footer className="bg-nydo-orange text-nydo-ink py-12">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-6 mb-12 text-sm">
              <div>
                <span className="nydo-display text-4xl tracking-[-0.08em]">
                  nydo<span aria-hidden="true">✳</span>
                </span>
                <small className="block text-[10px] tracking-[0.2em] font-bold mt-1.5">MALLAS DE PROTECCIÓN</small>
              </div>
              <p>
                Una casa llena de vida.
                <br />
                Un espacio para los tuyos.
              </p>
            </div>
            <h2 className="nydo-display uppercase text-nydo-cream text-[clamp(3.4rem,8vw,8rem)]">
              ¿Armamos tu Nydo?
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p>Cuéntanos qué quieres proteger.</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleNavigateToQuoteMesh} className="nydo-btn">
                  EMPECEMOS ↗
                </button>
                <a href={WHATSAPP_QUOTE_URL} target="_blank" rel="noopener noreferrer" className="nydo-btn nydo-btn-whatsapp">
                  WhatsApp
                </a>
              </div>
            </div>
            <div className="mt-12 pt-5 border-t border-nydo-ink/25 flex flex-col sm:flex-row justify-between gap-3 text-xs">
              <span>© {new Date().getFullYear()} Nydo Mallas</span>
              <span>
                {CONTACT_PHONE_DISPLAY} · {CONTACT_EMAIL}
              </span>
              <button type="button" onClick={() => goToView('contact')} className="bg-transparent border-0 font-bold underline cursor-pointer">
                Contáctanos
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
