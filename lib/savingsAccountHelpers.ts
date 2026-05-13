import { SavingsAccount } from '@/types';

export function createSavingsAccount(
  name: string,
  accountType: 'Digital Bank' | 'Traditional Bank' | 'Cash' | 'Investment' | 'Other',
  currentBalance: number = 0,
  targetBalance: number = 0,
  linkedGoalId?: string
): SavingsAccount {
  return {
    id: Date.now().toString(),
    name,
    accountType,
    currentBalance,
    targetBalance,
    linkedGoalId,
    notes: '',
    createdAt: new Date().toISOString(),
  };
}

export function calculateAccountProgress(account: SavingsAccount): number {
  if (account.targetBalance <= 0) return 0;
  return Math.min((account.currentBalance / account.targetBalance) * 100, 100);
}

export function getRemainingAmountForAccount(account: SavingsAccount): number {
  if (account.targetBalance <= 0) return 0;
  return Math.max(account.targetBalance - account.currentBalance, 0);
}

export function getTotalBalance(accounts: SavingsAccount[]): number {
  return accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
}

export function getTotalTarget(accounts: SavingsAccount[]): number {
  return accounts.reduce((sum, acc) => sum + acc.targetBalance, 0);
}

export function getAccountsByGoal(accounts: SavingsAccount[], goalId: string): SavingsAccount[] {
  return accounts.filter(acc => acc.linkedGoalId === goalId);
}

export function getLinkedGoalTotalBalance(accounts: SavingsAccount[], goalId: string): number {
  return getAccountsByGoal(accounts, goalId).reduce((sum, acc) => sum + acc.currentBalance, 0);
}
