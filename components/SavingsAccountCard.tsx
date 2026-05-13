'use client';

import { SavingsAccount } from '@/types';
import ProgressBar from './ProgressBar';

interface SavingsAccountCardProps {
  account: SavingsAccount;
  onEdit: (account: SavingsAccount) => void;
  onDelete: (id: string) => void;
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

export default function SavingsAccountCard({ account, onEdit, onDelete }: SavingsAccountCardProps) {
  const emoji = accountTypeEmoji[account.accountType] || '💼';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-3xl">{emoji}</span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{account.name}</h3>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">{account.accountType}</p>
              {account.hasDebitCard && (
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                  Debit Card
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(account)}
            className="text-blue-500 hover:text-blue-700 font-semibold text-sm transition"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this account? This action cannot be undone.')) {
                onDelete(account.id);
              }
            }}
            className="text-red-500 hover:text-red-700 font-semibold text-sm transition"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600">Balance</span>
          <span className="text-xl font-bold text-gray-800">
            ₱{account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Target</span>
          <span className="text-sm text-gray-700">
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
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-700">{account.notes}</p>
        </div>
      )}
    </div>
  );
}
