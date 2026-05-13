import { Transaction, MonthlyStats } from '@/types';

export const getMonthYear = (date: Date): string => {
  return date.toISOString().slice(0, 7);
};

export const getMonthYearFromString = (dateString: string): string => {
  return dateString.slice(0, 7);
};

export const getTransactionsForMonth = (transactions: Transaction[], monthYear: string): Transaction[] => {
  return transactions.filter((t) => getMonthYearFromString(t.date) === monthYear);
};

export const calculateMonthlyStats = (monthlyTransactions: Transaction[]): MonthlyStats => {
  const stats: MonthlyStats = {
    totalIncome: 0,
    totalExpenses: 0,
    totalSavingsTransfers: 0,
    pcFundTotal: 0,
    emergencyFundTotal: 0,
    remainingBudget: 0,
  };

  monthlyTransactions.forEach((transaction) => {
    if (transaction.type === 'income') {
      stats.totalIncome += transaction.amount;
    } else if (transaction.type === 'expense') {
      stats.totalExpenses += transaction.amount;
    } else if (transaction.type === 'savings_transfer') {
      stats.totalSavingsTransfers += transaction.amount;
      if (transaction.category === 'PC Fund') {
        stats.pcFundTotal += transaction.amount;
      } else if (transaction.category === 'Emergency Fund') {
        stats.emergencyFundTotal += transaction.amount;
      }
    }
  });

  stats.remainingBudget = stats.totalIncome - stats.totalExpenses - stats.totalSavingsTransfers;
  return stats;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};
