import React, { useState } from 'react';
import { CompanyGoalAndOffer } from './CompanyGoalAndOffer';
import { HomeAdminView } from './HomeAdminView';
import { QuoteRequest, UserAccount } from '../types';
import { isUserAdmin } from '../services/authStorage';
import { ArrowLeft } from 'lucide-react';

interface HomeClientViewProps {
  quotes: QuoteRequest[];
  onGoToQuoteMesh: () => void;
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
    <div id="view-home-client">
      {isAdmin && adminViewingClientPreview && (
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-14 py-4">
          <div className="bg-nydo-yellow/40 border border-nydo-ink/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-nydo-ink">
            <span className="font-bold">
              Vista previa: estás viendo la página pública tal como la ve un cliente.
            </span>
            <button
              type="button"
              onClick={() => setAdminViewingClientPreview(false)}
              className="nydo-btn nydo-btn-ink !min-h-10 !py-2 !px-4 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Home de Administrador
            </button>
          </div>
        </div>
      )}

      <CompanyGoalAndOffer
        onGoToQuoteMesh={onGoToQuoteMesh}
        onOpenAssistant={onOpenAssistant}
      />
    </div>
  );
};
