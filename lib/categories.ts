import { TransactionType, Category } from '@/types';

export const CATEGORIES_BY_TYPE: Record<TransactionType, Category[]> = {
  income: ['Salary', 'Bonus', 'Allowance', 'Reimbursement', 'Other Income'],
  expense: ['Bills', 'Food', 'Transportation', 'Shopping', 'Entertainment', 'Health', 'Certifications', 'Miscellaneous'],
  savings_transfer: ['Goal Contribution', 'Emergency Fund', 'MP2', 'Investment', 'General Savings', 'Other Savings'],
  credit_card_payment: ['Statement Payment', 'Installment Payment', 'Annual Fee Payment', 'Advance Payment', 'Other Credit Payment'],
};

export function getCategoriesForType(type: TransactionType): Category[] {
  return CATEGORIES_BY_TYPE[type] || [];
}

export function getDefaultCategoryForType(type: TransactionType): Category {
  const categories = getCategoriesForType(type);
  return categories[0] || ('Miscellaneous' as Category);
}
