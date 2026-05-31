'use client';

import { useState, useEffect } from 'react';
import { Goal, GoalType, GoalPriority, SavingsAccount } from '@/types';
import { getSavingsAccounts } from '@/lib/storage';
import { GOAL_TYPES } from '@/lib/goalHelpers';

const PRIORITIES: GoalPriority[] = ['Low', 'Medium', 'High'];

interface GoalFormProps {
  onSubmit: (goal: Goal) => void;
  initialGoal?: Goal;
  onCancel?: () => void;
}

export default function GoalForm({ onSubmit, initialGoal, onCancel }: GoalFormProps) {
  const [name, setName] = useState(initialGoal?.name || '');
  const [goalType, setGoalType] = useState<GoalType>(initialGoal?.goalType || 'General Savings');
  const [targetAmount, setTargetAmount] = useState(initialGoal?.targetAmount.toString() || '');
  const [linkedAccountId, setLinkedAccountId] = useState(initialGoal?.linkedAccountId || '');
  const [priority, setPriority] = useState<GoalPriority>(initialGoal?.priority || 'Medium');
  const [targetDate, setTargetDate] = useState(initialGoal?.targetDate || '');
  const [notes, setNotes] = useState(initialGoal?.notes || '');
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);

  useEffect(() => {
    setAccounts(getSavingsAccounts());
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !targetAmount) {
      alert('Please fill in goal name and target amount');
      return;
    }

    if (!linkedAccountId) {
      alert('Please select an account to link to this goal');
      return;
    }

    const goal: Goal = {
      id: initialGoal?.id || Date.now().toString(),
      name,
      goalType,
      targetAmount: parseFloat(targetAmount),
      linkedAccountId,
      priority,
      targetDate,
      notes,
      createdAt: initialGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSubmit(goal);

    if (!initialGoal) {
      setName('');
      setGoalType('General Savings');
      setTargetAmount('');
      setLinkedAccountId('');
      setPriority('Medium');
      setTargetDate('');
      setNotes('');
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-yellow-200 bg-yellow-50">
        <p className="text-sm text-yellow-900 font-semibold mb-3">
          ⚠️ No accounts found
        </p>
        <p className="text-sm text-yellow-800 mb-4">
          You need to create an account before you can create a goal. Goals track progress through account balances.
        </p>
        <button
          onClick={() => window.location.href = '/savings-accounts'}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition"
        >
          + Add Account
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Goal Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Emergency Fund, PC Build"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Goal Type</label>
          <select
            value={goalType}
            onChange={(e) => setGoalType(e.target.value as GoalType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {GOAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as GoalPriority)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Target Amount (₱)</label>
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00"
            step="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Linked Account *</label>
          <select
            value={linkedAccountId}
            onChange={(e) => setLinkedAccountId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select an account...</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} (₱{account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Goal progress is calculated from this account's balance</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Target Date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this goal"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition"
        >
          {initialGoal ? 'Update' : 'Add'} Goal
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
