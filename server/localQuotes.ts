import fs from 'node:fs';
import path from 'node:path';
import type { QuoteRequest } from '../src/types';

const FILE = path.join(process.cwd(), 'data', 'local-quotes.json');

export function readLocalQuotes(): QuoteRequest[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalQuote(quote: QuoteRequest) {
  const quotes = readLocalQuotes().filter((item) => item.id !== quote.id);
  quotes.unshift(quote);
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(quotes, null, 2), 'utf8');
}
