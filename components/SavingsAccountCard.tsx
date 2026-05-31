'use client';

import { SavingsAccount } from '@/types';
import ProgressBar from './ProgressBar';

interface SavingsAccountCardProps {
  account: SavingsAccount;
  onEdit: (account: SavingsAccount) => void;
  onDelete: (id: string) => void;
  editMode?: boolean;
}

const accountTypeEmoji = {
  'Digital Bank': '🏦',
  'Traditional Bank': '🏛️',
  'Cash': '💵',
  'E-Wallet': '📱',
  'Investment': '📈',
  'MP2': '🏛️',
  'Other': '💼',
};

export default function SavingsAccountCard({ account, onEdit, onDelete, editMode = false }: SavingsAccountCardProps) {
  const emoji = accountTypeEmoji[account.accountType] || '💼';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700/60">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-3xl">{emoji}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{account.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{account.accountType}</p>
              {account.hasDebitCard && (
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded">
                  Debit Card
                </span>
              )}
            </div>
          </div>
        </div>
        {!editMode && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(account)}
              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm transition"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this account? This action cannot be undone.')) {
                  onDelete(account.id);
                }
              }}
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold text-sm transition"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/40 rounded-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Balance</span>
          <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
            ₱{account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            ₱{account.targetBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {account.targetBalance > 0 && (
        <ProgressBar
          label="Progress to Target"
          current={account.currentBalance}
          target={account.targetBalance}
          color="blue"
        />
      )}

      {account.notes && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-amber-900/20 rounded-lg border border-yellow-200 dark:border-amber-700/40">
          <p className="text-sm text-gray-700 dark:text-amber-200">{account.notes}</p>
        </div>
      )}
    </div>
  );
}
