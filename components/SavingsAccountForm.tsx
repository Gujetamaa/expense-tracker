'use client';

import { useState, useEffect } from 'react';
import { SavingsAccount, AccountType, Goal } from '@/types';
import { getGoals } from '@/lib/storage';

const ACCOUNT_TYPES: AccountType[] = ['Digital Bank', 'Traditional Bank', 'Cash', 'E-Wallet', 'Investment', 'MP2', 'Other'];

interface SavingsAccountFormProps {
  onSubmit: (account: SavingsAccount) => void;
  initialAccount?: SavingsAccount;
  onCancel?: () => void;
}

export default function SavingsAccountForm({ onSubmit, initialAccount, onCancel }: SavingsAccountFormProps) {
  const [name, setName] = useState(initialAccount?.name || '');
  const [accountType, setAccountType] = useState<AccountType>(initialAccount?.accountType || 'Digital Bank');
  const [currentBalance, setCurrentBalance] = useState(initialAccount?.currentBalance.toString() || '0');
  const [targetBalance, setTargetBalance] = useState(initialAccount?.targetBalance.toString() || '0');
  const [linkedGoalId, setLinkedGoalId] = useState(initialAccount?.linkedGoalId || '');
  const [hasDebitCard, setHasDebitCard] = useState(initialAccount?.hasDebitCard || false);
  const [notes, setNotes] = useState(initialAccount?.notes || '');
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setGoals(getGoals());
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name) {
      alert('Please enter an account name');
      return;
    }

    const account: SavingsAccount = {
      id: initialAccount?.id || Date.now().toString(),
      name,
      accountType,
      currentBalance: parseFloat(currentBalance) || 0,
      targetBalance: parseFloat(targetBalance) || 0,
      linkedGoalId: linkedGoalId || undefined,
      hasDebitCard: hasDebitCard || undefined,
      notes,
      createdAt: initialAccount?.createdAt || new Date().toISOString(),
    };

    onSubmit(account);

    if (!initialAccount) {
      setName('');
      setAccountType('Digital Bank');
      setCurrentBalance('0');
      setTargetBalance('0');
      setLinkedGoalId('');
      setHasDebitCard(false);
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Account Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., MariBank, Emergency Fund"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Account Type</label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value as AccountType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {['Traditional Bank', 'Digital Bank', 'E-Wallet'].includes(accountType) && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasDebitCard"
              checked={hasDebitCard}
              onChange={(e) => setHasDebitCard(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="hasDebitCard" className="text-sm font-semibold text-gray-700">
              Has Debit Card
            </label>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Current Balance</label>
          <input
            type="number"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Target Balance</label>
          <input
            type="number"
            value={targetBalance}
            onChange={(e) => setTargetBalance(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Linked Goal (Optional)</label>
          <select
            value={linkedGoalId}
            onChange={(e) => setLinkedGoalId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No linked goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name} ({goal.goalType})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Link this account to a goal for organizational purposes</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition"
        >
          {initialAccount ? 'Update' : 'Add'} Account
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
