import { CreditCard } from '@/types';

export type UtilizationLevel = 'healthy' | 'moderate' | 'high' | 'over-limit';

export interface CreditCardStats {
  balance: number;
  availableCredit: number;
  utilization: number;
  utilizationLevel: UtilizationLevel;
  isOverLimit: boolean;
  hasSurplus: boolean;
  balanceLabel: 'Outstanding Balance' | 'Credit Surplus';
}

export function calculateAvailableCredit(card: CreditCard): number {
  // Available credit = limit - max(balance, 0)
  // This means negative balance increases available credit up to the limit
  return card.creditLimit - Math.max(card.currentBalance, 0);
}

export function calculateUtilization(card: CreditCard): number {
  // Utilization only applies when balance is positive
  if (card.currentBalance <= 0) {
    return 0;
  }
  return (card.currentBalance / card.creditLimit) * 100;
}

export function getUtilizationLevel(utilization: number): UtilizationLevel {
  if (utilization > 100) return 'over-limit';
  if (utilization > 70) return 'high';
  if (utilization > 30) return 'moderate';
  return 'healthy';
}

export function getBalanceLabel(balance: number): 'Outstanding Balance' | 'Credit Surplus' {
  return balance >= 0 ? 'Outstanding Balance' : 'Credit Surplus';
}

export function getCardStats(card: CreditCard): CreditCardStats {
  const utilization = calculateUtilization(card);
  const utilizationLevel = getUtilizationLevel(utilization);
  const isOverLimit = card.currentBalance > card.creditLimit;
  const hasSurplus = card.currentBalance < 0;
  const balanceLabel = getBalanceLabel(card.currentBalance);

  return {
    balance: card.currentBalance,
    availableCredit: calculateAvailableCredit(card),
    utilization,
    utilizationLevel,
    isOverLimit,
    hasSurplus,
    balanceLabel,
  };
}

export function getBalanceColor(card: CreditCard): { bg: string; text: string; border: string } {
  const stats = getCardStats(card);

  if (stats.isOverLimit) {
    return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-900 dark:text-red-300', border: 'border-red-200 dark:border-red-700/40' };
  }
  if (stats.hasSurplus) {
    return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-900 dark:text-green-300', border: 'border-green-200 dark:border-green-700/40' };
  }

  // For outstanding balance, use utilization level
  if (stats.utilizationLevel === 'high' || stats.utilizationLevel === 'over-limit') {
    return { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-900 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700/40' };
  }
  if (stats.utilizationLevel === 'moderate') {
    return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-900 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700/40' };
  }

  return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-900 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700/40' };
}

export function getBalanceStatusMessage(card: CreditCard): string {
  const stats = getCardStats(card);

  if (stats.isOverLimit) {
    return `Over limit by ₱${Math.abs(card.creditLimit - card.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (stats.hasSurplus) {
    return `Advance payment: ₱${Math.abs(card.currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (stats.utilizationLevel === 'high') {
    return `High utilization: ${stats.utilization.toFixed(0)}%`;
  }
  if (stats.utilizationLevel === 'moderate') {
    return `Moderate utilization: ${stats.utilization.toFixed(0)}%`;
  }

  return `Good standing • ${stats.utilization.toFixed(0)}% utilized`;
}

export function createCreditCard(
  name: string,
  creditLimit: number,
  currentBalance: number = 0
): CreditCard {
  return {
    id: Date.now().toString(),
    name,
    creditLimit,
    currentBalance,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
