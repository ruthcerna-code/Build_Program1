import React, { useRef } from 'react';
import { CompanyGoalAndOffer } from './CompanyGoalAndOffer';
import { QuoteRequestForm } from './QuoteRequestForm';
import { QuoteSuccessModal } from './QuoteSuccessModal';
import { QuoteRequest, UserAccount } from '../types';

interface HomeClientViewProps {
  onQuoteCreated: (quote: QuoteRequest) => void;
  lastCreatedQuote: QuoteRequest | null;
  showSuccessModal: boolean;
  onCloseSuccessModal: () => void;
  onGoToAdmin: () => void;
  currentUser?: UserAccount | null;
}

export const HomeClientView: React.FC<HomeClientViewProps> = ({
  onQuoteCreated,
  lastCreatedQuote,
  showSuccessModal,
  onCloseSuccessModal,
  onGoToAdmin,
  currentUser,
}) => {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="view-home-client" className="space-y-12 pb-16">
      {/* 1. Presentation of Offer and Company Goal */}
      <CompanyGoalAndOffer onScrollToForm={scrollToForm} />

      {/* 2. Interactive Quotation Form (1 or multiple windows) */}
      <div ref={formRef} id="section-quote-form-anchor" className="scroll-mt-24">
        <QuoteRequestForm onSubmitQuote={onQuoteCreated} currentUser={currentUser} />
      </div>

      {/* Success Modal */}
      {showSuccessModal && lastCreatedQuote && (
        <QuoteSuccessModal
          quote={lastCreatedQuote}
          onClose={onCloseSuccessModal}
          onGoToAdmin={onGoToAdmin}
        />
      )}
    </div>
  );
};
