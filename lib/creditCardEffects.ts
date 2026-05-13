import { getCreditCards, updateCreditCard } from './storage';

export function applyCardCharge(cardId: string, amount: number): void {
  const cards = getCreditCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.currentBalance += amount;
    card.updatedAt = new Date().toISOString();
    updateCreditCard(cardId, card);
  }
}

export function reverseCardCharge(cardId: string, amount: number): void {
  const cards = getCreditCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.currentBalance -= amount;
    card.updatedAt = new Date().toISOString();
    updateCreditCard(cardId, card);
  }
}

export function applyCardPayment(cardId: string, amount: number): void {
  const cards = getCreditCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.currentBalance -= amount;
    card.updatedAt = new Date().toISOString();
    updateCreditCard(cardId, card);
  }
}

export function reverseCardPayment(cardId: string, amount: number): void {
  const cards = getCreditCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.currentBalance += amount;
    card.updatedAt = new Date().toISOString();
    updateCreditCard(cardId, card);
  }
}
