'use client';

import { useEffect, useState } from 'react';
import { Goal, SavingsAccount } from '@/types';
import { getSavingsAccounts } from '@/lib/storage';
import ProgressBar from './ProgressBar';
import { GOAL_TYPE_EMOJIS, GOAL_COLORS, calculateGoalProgress, getRemainingAmount } from '@/lib/goalHelpers';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const [linkedAccount, setLinkedAccount] = useState<SavingsAccount | null>(null);

  useEffect(() => {
    const accounts = getSavingsAccounts();
    const account = accounts.find(a => a.id === goal.linkedAccountId);
    setLinkedAccount(account || null);
  }, [goal.linkedAccountId]);

  const emoji = GOAL_TYPE_EMOJIS[goal.goalType];
  const colors = GOAL_COLORS[goal.goalType];
  const currentBalance = linkedAccount?.currentBalance || 0;
  const progress = calculateGoalProgress(currentBalance, goal.targetAmount);
  const remaining = getRemainingAmount(currentBalance, goal.targetAmount);

  return (
    <div className={`${colors.bg} rounded-lg shadow-md p-6 border border-gray-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{goal.name}</h3>
            <p className="text-xs text-gray-500">
              {goal.goalType} • Priority: {goal.priority}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(goal)}
            className="text-blue-500 hover:text-blue-700 font-semibold text-sm transition"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this goal?')) {
                onDelete(goal.id);
              }
            }}
            className="text-red-500 hover:text-red-700 font-semibold text-sm transition"
          >
            Delete
          </button>
        </div>
      </div>

      {linkedAccount && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-gray-600 mb-1">Linked Account:</p>
          <p className="text-sm text-gray-800">{linkedAccount.name}</p>
          <p className="text-xs text-gray-500">Balance: ₱{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      )}

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-semibold text-gray-800">
            ₱{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ₱{goal.targetAmount.toLocaleString()}
          </span>
        </div>
        <ProgressBar
          label=""
          current={currentBalance}
          target={goal.targetAmount}
          color="blue"
        />
        <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% complete</p>
      </div>

      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg">
        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className="text-lg font-bold text-gray-800">₱{remaining.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Target Date</p>
          <p className="text-lg font-bold text-gray-800">
            {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : '—'}
          </p>
        </div>
      </div>

      {goal.notes && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-700">{goal.notes}</p>
        </div>
      )}
    </div>
  );
}
