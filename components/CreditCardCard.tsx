'use client';

import { CreditCard } from '@/types';
import { getCardStats, getBalanceColor, getBalanceStatusMessage } from '@/lib/creditCardHelpers';

interface CreditCardCardProps {
  card: CreditCard;
  onEdit: (card: CreditCard) => void;
  onDelete: (id: string) => void;
  editMode?: boolean;
}

export default function CreditCardCard({ card, onEdit, onDelete, editMode = false }: CreditCardCardProps) {
  const stats = getCardStats(card);
  const colors = getBalanceColor(card);

  return (
    <div className={`${colors.bg} dark:bg-slate-800 ${colors.border} dark:border-slate-700/60 rounded-lg shadow-md p-6 border`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💳</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{card.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Credit Card</p>
          </div>
        </div>
        {!editMode && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(card)}
              className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm transition"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this card?')) {
                  onDelete(card.id);
                }
              }}
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold text-sm transition"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className={`mb-4 p-4 bg-white dark:bg-slate-700/40 rounded-lg border-l-4 ${colors.border}`}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">{stats.balanceLabel}</span>
          <span className={`text-2xl font-bold ${colors.text} dark:text-slate-100`}>
            ₱{Math.abs(stats.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Available Credit</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            ₱{stats.availableCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-white dark:bg-slate-700/40 rounded-lg">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Utilization</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats.utilization.toFixed(1)}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{stats.utilizationLevel}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Credit Limit</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
            ₱{card.creditLimit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className={`p-3 rounded-lg border-l-4 ${colors.border} ${colors.bg} dark:bg-slate-700/40`}>
        <p className={`text-sm font-semibold ${colors.text} dark:text-slate-100`}>{getBalanceStatusMessage(card)}</p>
      </div>

      {card.notes && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-amber-900/20 rounded-lg border border-yellow-200 dark:border-amber-700/40">
          <p className="text-sm text-gray-700 dark:text-amber-200">{card.notes}</p>
        </div>
      )}
    </div>
  );
}
