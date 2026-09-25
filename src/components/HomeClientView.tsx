import React, { useState } from 'react';
import { CompanyGoalAndOffer } from './CompanyGoalAndOffer';
import { HomeAdminView } from './HomeAdminView';
import { QuoteRequest, UserAccount } from '../types';
import { isUserAdmin } from '../services/authStorage';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

interface HomeClientViewProps {
  quotes: QuoteRequest[];
  onGoToQuoteMesh: () => void;
  onAuthenticateWithGmail: () => void;
  onGoToAdmin?: () => void;
  onGoToTechnicianOrders?: () => void;
  onGoToAccessLogs?: () => void;
  onOpenAssistant?: () => void;
  currentUser?: UserAccount | null;
  onRespondQuote?: (quote: QuoteRequest) => void;
}

export const HomeClientView: React.FC<HomeClientViewProps> = ({
  quotes,
  onGoToQuoteMesh,
  onAuthenticateWithGmail,
  onGoToAdmin,
  onGoToTechnicianOrders,
  onGoToAccessLogs,
  onOpenAssistant,
  currentUser,
  onRespondQuote,
}) => {
  const isAdmin = isUserAdmin(currentUser || null);
  const [adminViewingClientPreview, setAdminViewingClientPreview] = useState(false);

  // When logged in as Administrator, show the distinct Administrator Home!
  if (isAdmin && !adminViewingClientPreview) {
    return (
      <HomeAdminView
        quotes={quotes}
        currentUser={currentUser || null}
        onGoToAdminQuotes={onGoToAdmin || (() => {})}
        onGoToTechnicianOrders={onGoToTechnicianOrders || (() => {})}
        onGoToAccessLogs={onGoToAccessLogs || onGoToAdmin || (() => {})}
        onViewClientPreview={() => setAdminViewingClientPreview(true)}
        onRespondQuote={onRespondQuote}
      />
    );
  }

  // Client Home (Public presentation of offer, goals & Gmail auth gate)
  return (
    <div id="view-home-client" className="space-y-6 pb-16">
      {/* Banner for Admin when previewing client mode */}
      {isAdmin && adminViewingClientPreview && (
        <div className="bg-amber-500/10 border border-amber-400/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-bold">
              Vista previa activa: Estás viendo la página pública tal como la visualiza un cliente visitante.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAdminViewingClientPreview(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Home de Administrador</span>
          </button>
        </div>
      )}

      {/* Presentation of Offer and Company Goal */}
      <CompanyGoalAndOffer
        onGoToQuoteMesh={onGoToQuoteMesh}
        onAuthenticateWithGmail={onAuthenticateWithGmail}
        onGoToAdmin={onGoToAdmin}
        onGoToTechnicianOrders={onGoToTechnicianOrders}
        onOpenAssistant={onOpenAssistant}
        currentUser={currentUser}
      />
    </div>
  );
};
