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
  income: 'text-green-600 bg-green-100',
  expense: 'text-red-600 bg-red-100',
  savings_transfer: 'text-blue-600 bg-blue-100',
  credit_card_payment: 'text-purple-600 bg-purple-100',
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
      <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
        <p className="text-gray-500">No transactions yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Links</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const goalName = getGoalName(transaction.linkedGoalId);
              const accountName = getAccountName(transaction.linkedAccountId);
              const cardName = getCardName(transaction.linkedCreditCardId);

              return (
                <tr key={transaction.id} className={`border-b border-gray-200 hover:bg-gray-50 transition ${transaction.status === 'draft' ? 'bg-amber-50' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-700">{transaction.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${typeColors[transaction.type]}`}>
                      {typeLabels[transaction.type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{transaction.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{transaction.description}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                    ₱{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'draft'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-green-200 text-green-800'
                      }`}
                    >
                      {transaction.status === 'draft' ? '📝 Draft' : '✓ Posted'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {goalName && <div className="text-blue-600 font-semibold">Goal: {goalName}</div>}
                    {accountName && <div className="text-green-600">Account: {accountName}</div>}
                    {cardName && <div className="text-orange-600 font-semibold">Card: {cardName}</div>}
                    {!goalName && !accountName && !cardName && <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-center text-sm space-y-2">
                    {transaction.status === 'draft' && onPost && (
                      <button
                        onClick={() => onPost(transaction.id)}
                        className="block text-green-500 hover:text-green-700 font-semibold transition"
                      >
                        Post
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(transaction)}
                      className="text-blue-500 hover:text-blue-700 font-semibold transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this transaction?')) {
                          onDelete(transaction.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 font-semibold transition"
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
