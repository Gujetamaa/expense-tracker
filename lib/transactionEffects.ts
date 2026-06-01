import { Transaction } from '@/types';
import {
  applyAccountDebit,
  reverseAccountDebit,
  applyAccountCredit,
  reverseAccountCredit,
} from './accountEffects';
import {
  applyCardCharge,
  reverseCardCharge,
  applyCardPayment,
  reverseCardPayment,
} from './creditCardEffects';
import { getSavingsAccounts } from './storage';

function getTransferFeeAmount(transaction: Transaction): number {
  if (transaction.type !== 'savings_transfer') return 0;
  if (!transaction.hasTransferFee) return 0;

  const fee = transaction.transferFeeAmount || 0;
  return fee > 0 ? fee : 0;
}

function getSavingsTransferSourceDeduction(transaction: Transaction): number {
  return transaction.amount + getTransferFeeAmount(transaction);
}

function getAccountBalance(accountId: string): number {
  const account = getSavingsAccounts().find((a) => a.id === accountId);
  return account?.currentBalance ?? 0;
}

function assertSufficientAccountBalance(accountId: string, requiredAmount: number): void {
  const currentBalance = getAccountBalance(accountId);

  if (requiredAmount > currentBalance) {
    throw new Error(
      `Insufficient funds. Available balance is ₱${currentBalance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}, but this transaction requires ₱${requiredAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}.`
    );
  }
}

export function applyTransactionEffects(transaction: Transaction): void {
  if (transaction.type === 'income') {
    if (transaction.linkedAccountId) {
      applyAccountCredit(transaction.linkedAccountId, transaction.amount);
    }
  } else if (transaction.type === 'expense') {
    if (transaction.paymentMethod === 'Credit Card' && transaction.linkedCreditCardId) {
      applyCardCharge(transaction.linkedCreditCardId, transaction.amount);
    } else if (
      ['Debit Card', 'Bank Transfer', 'E-wallet', 'Cash'].includes(transaction.paymentMethod) &&
      transaction.linkedAccountId
    ) {
      assertSufficientAccountBalance(transaction.linkedAccountId, transaction.amount);
      applyAccountDebit(transaction.linkedAccountId, transaction.amount);
    }
  } else if (transaction.type === 'credit_card_payment') {
    if (transaction.linkedCreditCardId) {
      applyCardPayment(transaction.linkedCreditCardId, transaction.amount);
    }

    if (transaction.paymentSourceType !== 'Other' && transaction.linkedAccountId) {
      assertSufficientAccountBalance(transaction.linkedAccountId, transaction.amount);
      applyAccountDebit(transaction.linkedAccountId, transaction.amount);
    }
  } else if (transaction.type === 'savings_transfer') {
    const sourceDeduction = getSavingsTransferSourceDeduction(transaction);

    if (transaction.sourceAccountId) {
      assertSufficientAccountBalance(transaction.sourceAccountId, sourceDeduction);
      applyAccountDebit(transaction.sourceAccountId, sourceDeduction);
    }

    if (transaction.destinationAccountId) {
      applyAccountCredit(transaction.destinationAccountId, transaction.amount);
    }

    // linkedGoalId is metadata only; does not affect goal progress
  }
}

export function reverseTransactionEffects(transaction: Transaction): void {
  if (transaction.type === 'income') {
    if (transaction.linkedAccountId) {
      reverseAccountCredit(transaction.linkedAccountId, transaction.amount);
    }
  } else if (transaction.type === 'expense') {
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
    const sourceDeduction = getSavingsTransferSourceDeduction(transaction);

    if (transaction.sourceAccountId) {
      reverseAccountDebit(transaction.sourceAccountId, sourceDeduction);
    }

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
  const getAccount = (accountId?: string) => {
    if (!accountId) return null;
    return getSavingsAccounts().find((account) => account.id === accountId) || null;
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (transaction.type === 'expense' && transaction.paymentMethod !== 'Credit Card') {
    const account = getAccount(transaction.linkedAccountId);
    if (!account) return null;

    if (transaction.amount > account.currentBalance) {
      return `Insufficient funds in ${account.name}. Available: ₱${formatCurrency(
        account.currentBalance
      )}, required: ₱${formatCurrency(transaction.amount)}.`;
    }
  }

  if (transaction.type === 'credit_card_payment' && transaction.paymentSourceType !== 'Other') {
    const account = getAccount(transaction.linkedAccountId);
    if (!account) return null;

    if (transaction.amount > account.currentBalance) {
      return `Insufficient funds in ${account.name}. Available: ₱${formatCurrency(
        account.currentBalance
      )}, required: ₱${formatCurrency(transaction.amount)}.`;
    }
  }

  if (transaction.type === 'savings_transfer') {
    const account = getAccount(transaction.sourceAccountId);
    if (!account) return null;

    const totalRequired = transaction.amount + getTransferFeeAmount(transaction);

    if (totalRequired > account.currentBalance) {
      return `Insufficient funds in ${account.name}. Available: ₱${formatCurrency(
        account.currentBalance
      )}, required: ₱${formatCurrency(totalRequired)}.`;
    }
  }

  return null;
}