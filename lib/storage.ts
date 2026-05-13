import { Transaction, SavingsAccount, SalarySettings, Goal, CreditCard } from '@/types';

// Storage keys
const TRANSACTIONS_KEY = 'expenses_tracker_transactions';
const SAVINGS_ACCOUNTS_KEY = 'expenses_tracker_savings_accounts';
const SALARY_SETTINGS_KEY = 'expenses_tracker_salary_settings';
const GOALS_KEY = 'expenses_tracker_goals';
const CREDIT_CARDS_KEY = 'expenses_tracker_credit_cards';

// Transactions
export const getTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  transactions.push(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

export const updateTransaction = (id: string, updated: Transaction): void => {
  const transactions = getTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactions[index] = updated;
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }
};

export const deleteTransaction = (id: string): void => {
  const transactions = getTransactions();
  const filtered = transactions.filter((t) => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
};

export const clearAllTransactions = (): void => {
  localStorage.removeItem(TRANSACTIONS_KEY);
};

// Savings Accounts
export const getSavingsAccounts = (): SavingsAccount[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SAVINGS_ACCOUNTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSavingsAccount = (account: SavingsAccount): void => {
  const accounts = getSavingsAccounts();
  const index = accounts.findIndex(a => a.id === account.id);
  if (index !== -1) {
    accounts[index] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem(SAVINGS_ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const updateSavingsAccount = (id: string, updated: SavingsAccount): void => {
  const accounts = getSavingsAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index !== -1) {
    accounts[index] = updated;
    localStorage.setItem(SAVINGS_ACCOUNTS_KEY, JSON.stringify(accounts));
  }
};

export const deleteSavingsAccount = (id: string): void => {
  const accounts = getSavingsAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  localStorage.setItem(SAVINGS_ACCOUNTS_KEY, JSON.stringify(filtered));
};

export const updateSavingsAccountBalance = (id: string, amount: number): void => {
  const accounts = getSavingsAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index !== -1) {
    accounts[index].currentBalance += amount;
    localStorage.setItem(SAVINGS_ACCOUNTS_KEY, JSON.stringify(accounts));
  }
};

// Salary Settings
export const getSalarySettings = (): SalarySettings | null => {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SALARY_SETTINGS_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveSalarySettings = (settings: SalarySettings): void => {
  localStorage.setItem(SALARY_SETTINGS_KEY, JSON.stringify(settings));
};

export const clearSalarySettings = (): void => {
  localStorage.removeItem(SALARY_SETTINGS_KEY);
};

// Goals
export const getGoals = (): Goal[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(GOALS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveGoal = (goalId: string, goal: Goal): void => {
  const goals = getGoals();
  const index = goals.findIndex((g) => g.id === goalId);
  if (index !== -1) {
    goals[index] = goal;
  } else {
    goals.push(goal);
  }
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
};

export const addGoal = (goal: Goal): void => {
  const goals = getGoals();
  goals.push(goal);
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
};

export const updateGoal = (id: string, updated: Goal): void => {
  const goals = getGoals();
  const index = goals.findIndex((g) => g.id === id);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updated, updatedAt: new Date().toISOString() };
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  }
};

export const deleteGoal = (id: string): void => {
  const goals = getGoals();
  const filtered = goals.filter((g) => g.id !== id);
  localStorage.setItem(GOALS_KEY, JSON.stringify(filtered));
};

export const clearAllGoals = (): void => {
  localStorage.removeItem(GOALS_KEY);
};

// Credit Cards
export const getCreditCards = (): CreditCard[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CREDIT_CARDS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addCreditCard = (card: CreditCard): void => {
  const cards = getCreditCards();
  cards.push(card);
  localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(cards));
};

export const updateCreditCard = (id: string, updated: CreditCard): void => {
  const cards = getCreditCards();
  const index = cards.findIndex((c) => c.id === id);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updated, updatedAt: new Date().toISOString() };
    localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(cards));
  }
};

export const deleteCreditCard = (id: string): void => {
  const cards = getCreditCards();
  const filtered = cards.filter((c) => c.id !== id);
  localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(filtered));
};

export const updateCreditCardBalance = (id: string, amount: number): void => {
  const cards = getCreditCards();
  const index = cards.findIndex((c) => c.id === id);
  if (index !== -1) {
    cards[index].currentBalance += amount;
    cards[index].updatedAt = new Date().toISOString();
    localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(cards));
  }
};
