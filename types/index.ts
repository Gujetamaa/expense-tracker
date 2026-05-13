export type TransactionType = 'income' | 'expense' | 'savings_transfer' | 'credit_card_payment';

export type IncomeCategory = 'Salary' | 'Bonus' | 'Allowance' | 'Reimbursement' | 'Other Income';
export type ExpenseCategory = 'Bills' | 'Food' | 'Transportation' | 'Shopping' | 'Entertainment' | 'Health' | 'Certifications' | 'Miscellaneous';
export type SavingsTransferCategory = 'Goal Contribution' | 'Emergency Fund' | 'PC Fund' | 'MP2' | 'Investment' | 'General Savings' | 'Other Savings';
export type CreditCardPaymentCategory = 'Statement Payment' | 'Installment Payment' | 'Annual Fee Payment' | 'Advance Payment' | 'Other Credit Payment';

export type Category = IncomeCategory | ExpenseCategory | SavingsTransferCategory | CreditCardPaymentCategory;

export type PaymentMethod = 'Cash' | 'Debit Card' | 'Credit Card' | 'Bank Transfer' | 'E-wallet';

export type AccountType = 'Digital Bank' | 'Traditional Bank' | 'Cash' | 'E-Wallet' | 'Investment' | 'MP2' | 'Other';

export type GoalType = 'Emergency Fund' | 'PC Build' | 'Gadget' | 'Fitness' | 'Travel' | 'Investment' | 'MP2' | 'General Savings' | 'Other';

export type GoalPriority = 'Low' | 'Medium' | 'High';

export interface Goal {
  id: string;
  name: string;
  goalType: GoalType;
  targetAmount: number;
  linkedAccountId: string;
  priority: GoalPriority;
  targetDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: Category;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  linkedGoalId?: string;
  linkedAccountId?: string;
  linkedCreditCardId?: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  paymentSourceType?: 'Account' | 'Cash' | 'Other';
  notes: string;
  createdAt: string;
}

export interface SavingsAccount {
  id: string;
  name: string;
  accountType: AccountType;
  currentBalance: number;
  targetBalance: number;
  linkedGoalId?: string;
  notes: string;
  hasDebitCard?: boolean;
  createdAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  creditLimit: number;
  currentBalance: number; // Can be negative (overpayment)
  lastPaymentDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalarySettings {
  basicMonthlySalary: number;
  taxableAllowance: number;
  nonTaxableAllowance: number;
  reimbursements: number;
  payrollFrequency: 'Monthly' | 'Semi-monthly';
}

export interface SalaryDeductions {
  sssContribution: number;
  philHealthContribution: number;
  pagIbigContribution: number;
  withholdingTax: number;
  totalDeductions: number;
  monthlyNetPay: number;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  totalSavingsTransfers: number;
  pcFundTotal: number;
  emergencyFundTotal: number;
  remainingBudget: number;
}
