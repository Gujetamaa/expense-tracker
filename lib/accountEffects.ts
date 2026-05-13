import { getSavingsAccounts, updateSavingsAccount } from './storage';

export function applyAccountDebit(accountId: string, amount: number): void {
  const accounts = getSavingsAccounts();
  const account = accounts.find(a => a.id === accountId);
  if (account) {
    account.currentBalance -= amount;
    updateSavingsAccount(accountId, account);
  }
}

export function reverseAccountDebit(accountId: string, amount: number): void {
  const accounts = getSavingsAccounts();
  const account = accounts.find(a => a.id === accountId);
  if (account) {
    account.currentBalance += amount;
    updateSavingsAccount(accountId, account);
  }
}

export function applyAccountCredit(accountId: string, amount: number): void {
  const accounts = getSavingsAccounts();
  const account = accounts.find(a => a.id === accountId);
  if (account) {
    account.currentBalance += amount;
    updateSavingsAccount(accountId, account);
  }
}

export function reverseAccountCredit(accountId: string, amount: number): void {
  const accounts = getSavingsAccounts();
  const account = accounts.find(a => a.id === accountId);
  if (account) {
    account.currentBalance -= amount;
    updateSavingsAccount(accountId, account);
  }
}
