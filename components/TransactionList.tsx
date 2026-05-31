'use client';

import { useEffect, useState } from 'react';
import { Transaction, Goal, SavingsAccount, CreditCard } from '@/types';
import { getGoals, getSavingsAccounts, getCreditCards } from '@/lib/storage';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onPost?: (id: string) => void;
}

const typeColors = {
  income: 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  expense: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  savings_transfer: 'text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  credit_card_payment: 'text-purple-700 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
};

const typeLabels = {
  income: 'Income',
  expense: 'Expense',
  savings_transfer: 'Savings Transfer',
  credit_card_payment: 'CC Payment',
};

export default function TransactionList({ transactions, onEdit, onDelete, onPost }: TransactionListProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    setGoals(getGoals());
    setAccounts(getSavingsAccounts());
    setCreditCards(getCreditCards());
  }, []);

  const getGoalName = (id?: string) => {
    if (!id) return null;
    return goals.find(g => g.id === id)?.name;
  };

  const getAccountName = (id?: string) => {
    if (!id) return null;
    return accounts.find(a => a.id === id)?.name;
  };

  const getCardName = (id?: string) => {
    if (!id) return null;
    return creditCards.find(c => c.id === id)?.name;
  };

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <p className="text-gray-500 dark:text-slate-400">No transactions yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">Type</th>
              <th className="table-header-cell">Category</th>
              <th className="table-header-cell">Description</th>
              <th className="table-header-cell text-right">Amount</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Links</th>
              <th className="table-header-cell text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const goalName = getGoalName(transaction.linkedGoalId);
              const accountName = getAccountName(transaction.linkedAccountId);
              const cardName = getCardName(transaction.linkedCreditCardId);

              return (
                <tr key={transaction.id} className={`table-tr ${transaction.status === 'draft' ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                  <td className="table-cell">{transaction.date}</td>
                  <td className="table-cell">
                    <span className={`badge ${typeColors[transaction.type]}`}>
                      {typeLabels[transaction.type]}
                    </span>
                  </td>
                  <td className="table-cell">{transaction.category}</td>
                  <td className="table-cell">{transaction.description}</td>
                  <td className="table-cell text-right font-semibold">
                    ₱{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`badge ${
                        transaction.status === 'draft'
                          ? 'badge-draft'
                          : 'badge-posted'
                      }`}
                    >
                      {transaction.status === 'draft' ? '📝 Draft' : '✓ Posted'}
                    </span>
                  </td>
                  <td className="table-cell text-sm">
                    {goalName && <div className="text-blue-600 dark:text-blue-400 font-semibold">Goal: {goalName}</div>}
                    {accountName && <div className="text-green-600 dark:text-green-400 font-medium">Account: {accountName}</div>}
                    {cardName && <div className="text-orange-600 dark:text-orange-400 font-semibold">Card: {cardName}</div>}
                    {!goalName && !accountName && !cardName && <span className="text-gray-400 dark:text-gray-500">—</span>}
                  </td>
                  <td className="table-cell text-center text-sm space-y-2">
                    {transaction.status === 'draft' && onPost && (
                      <button
                        onClick={() => onPost(transaction.id)}
                        className="link-success block"
                      >
                        Post
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(transaction)}
                      className="link-primary block"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this transaction?')) {
                          onDelete(transaction.id);
                        }
                      }}
                      className="link-danger block"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
