'use client';

import { useEffect, useState } from 'react';
import { Goal, SavingsAccount } from '@/types';
import { getSavingsAccounts } from '@/lib/storage';
import { calculateGoalProgress, getRemainingAmount } from '@/lib/goalHelpers';

interface GoalListItemProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

export default function GoalListItem({ goal, onEdit, onDelete }: GoalListItemProps) {
  const [linkedAccount, setLinkedAccount] = useState<SavingsAccount | null>(null);

  useEffect(() => {
    const accounts = getSavingsAccounts();
    const account = accounts.find(a => a.id === goal.linkedAccountId);
    setLinkedAccount(account || null);
  }, [goal.linkedAccountId]);

  const currentBalance = linkedAccount?.currentBalance || 0;
  const progress = calculateGoalProgress(currentBalance, goal.targetAmount);
  const remaining = getRemainingAmount(currentBalance, goal.targetAmount);

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition">
      <td className="px-6 py-4 text-sm font-semibold text-gray-800">
        <div>{goal.name}</div>
        {linkedAccount && <div className="text-xs text-gray-500">{linkedAccount.name}</div>}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
          goal.priority === 'High' ? 'bg-red-100 text-red-800' :
          goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {goal.priority}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 text-right">
        ₱{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ₱{goal.targetAmount.toLocaleString()}
      </td>
      <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
        {progress.toFixed(0)}%
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 text-right">
        ₱{remaining.toLocaleString()}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 text-center">
        {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—'}
      </td>
      <td className="px-6 py-4 text-center space-x-2">
        <button
          onClick={() => onEdit(goal)}
          className="text-blue-500 hover:text-blue-700 text-sm font-semibold transition"
        >
          Edit
        </button>
        <button
          onClick={() => {
            if (confirm('Delete this goal?')) {
              onDelete(goal.id);
            }
          }}
          className="text-red-500 hover:text-red-700 text-sm font-semibold transition"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
