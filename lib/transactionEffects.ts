import { Transaction } from '@/types';
import { applyAccountDebit, reverseAccountDebit, applyAccountCredit, reverseAccountCredit } from './accountEffects';
import { applyCardCharge, reverseCardCharge, applyCardPayment, reverseCardPayment } from './creditCardEffects';

export function applyTransactionEffects(transaction: Transaction): void {
  if (transaction.type === 'expense') {
    if (transaction.paymentMethod === 'Credit Card' && transaction.linkedCreditCardId) {
      applyCardCharge(transaction.linkedCreditCardId, transaction.amount);
    } else if (
      ['Debit Card', 'Bank Transfer', 'E-wallet', 'Cash'].includes(transaction.paymentMethod) &&
      transaction.linkedAccountId
    ) {
      applyAccountDebit(transaction.linkedAccountId, transaction.amount);
    }
  } else if (transaction.type === 'credit_card_payment') {
    if (transaction.linkedCreditCardId) {
      applyCardPayment(transaction.linkedCreditCardId, transaction.amount);
    }
    if (transaction.paymentSourceType !== 'Other' && transaction.linkedAccountId) {
      applyAccountDebit(transaction.linkedAccountId, transaction.amount);
    }
  } else if (transaction.type === 'savings_transfer') {
    // Debit source account
    if (transaction.sourceAccountId) {
      applyAccountDebit(transaction.sourceAccountId, transaction.amount);
    }
    // Credit destination account
    if (transaction.destinationAccountId) {
      applyAccountCredit(transaction.destinationAccountId, transaction.amount);
    }
    // linkedGoalId is metadata only; does not affect goal progress
  }
}

export function reverseTransactionEffects(transaction: Transaction): void {
  if (transaction.type === 'expense') {
    if (transaction.paymentMethod === 'Credit Card' && transaction.linkedCreditCardId) {
      reverseCardCharge(transaction.linkedCreditCardId, transaction.amount);
    } else if (
      ['Debit Card', 'Bank Transfer', 'E-wallet', 'Cash'].includes(transaction.paymentMethod) &&
      transaction.linkedAccountId
    ) {
      reverseAccountDebit(transaction.linkedAccountId, transaction.amount);
    }
  } else if (transaction.type === 'credit_card_payment') {
    if (transaction.linkedCreditCardId) {
      reverseCardPayment(transaction.linkedCreditCardId, transaction.amount);
    }
    if (transaction.paymentSourceType !== 'Other' && transaction.linkedAccountId) {
      reverseAccountDebit(transaction.linkedAccountId, transaction.amount);
    }
  } else if (transaction.type === 'savings_transfer') {
    // Reverse: re-credit source account
    if (transaction.sourceAccountId) {
      reverseAccountDebit(transaction.sourceAccountId, transaction.amount);
    }
    // Reverse: de-credit destination account
    if (transaction.destinationAccountId) {
      reverseAccountCredit(transaction.destinationAccountId, transaction.amount);
    }
  }
}

export function editTransactionEffects(oldTransaction: Transaction, newTransaction: Transaction): void {
  reverseTransactionEffects(oldTransaction);
  applyTransactionEffects(newTransaction);
}

export function deleteTransactionEffects(transaction: Transaction): void {
  reverseTransactionEffects(transaction);
}

export function checkNegativeBalanceWarning(transaction: Transaction): string | null {
  // No warnings for now; allow negative balances with understanding from user
  return null;
}
