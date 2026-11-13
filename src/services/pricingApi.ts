import { apiFetch } from './sessionApi';
import type { PricingRate } from '../utils/quotePricing';

export async function fetchPricingRates(): Promise<PricingRate[]> {
  const data = await apiFetch('/api/pricing');
  return data.rates || [];
}

export async function fetchPricingScreen(): Promise<{ rates: PricingRate[]; notice?: string }> {
  const data = await apiFetch('/api/pricing');
  return { rates: data.rates || [], notice: data.notice };
}

export async function savePricingRates(
  rates: { id: string; amount: number }[]
): Promise<{ rates: PricingRate[]; message: string }> {
  return apiFetch('/api/pricing', { method: 'PUT', body: JSON.stringify({ rates }) });
}
