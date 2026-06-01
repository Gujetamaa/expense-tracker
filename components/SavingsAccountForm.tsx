'use client';

import { useState, useEffect } from 'react';
import { SavingsAccount, AccountType, Goal } from '@/types';
import { getGoals } from '@/lib/storage';

const ACCOUNT_TYPES: AccountType[] = [
  'Digital Bank',
  'Traditional Bank',
  'Cash',
  'E-Wallet',
  'Investment',
  'MP2',
  'Other',
];

interface SavingsAccountFormProps {
  onSubmit: (account: SavingsAccount) => void;
  initialAccount?: SavingsAccount;
  onCancel?: () => void;
}

export default function SavingsAccountForm({
  onSubmit,
  initialAccount,
  onCancel,
}: SavingsAccountFormProps) {
  const [name, setName] = useState(initialAccount?.name || '');
  const [accountType, setAccountType] = useState<AccountType>(
    initialAccount?.accountType || 'Digital Bank'
  );
  const [currentBalance, setCurrentBalance] = useState(
    initialAccount?.currentBalance.toString() || '0'
  );
  const [targetBalance, setTargetBalance] = useState(
    initialAccount?.targetBalance.toString() || '0'
  );
  const [linkedGoalId, setLinkedGoalId] = useState(initialAccount?.linkedGoalId || '');

  const [hasDebitCard, setHasDebitCard] = useState(initialAccount?.hasDebitCard ?? false);
  const [hasBankTransfer, setHasBankTransfer] = useState(
    initialAccount?.hasBankTransfer ??
      ['Traditional Bank', 'Digital Bank'].includes(initialAccount?.accountType || '')
  );
  const [hasEWallet, setHasEWallet] = useState(
    initialAccount?.hasEWallet ?? initialAccount?.accountType === 'E-Wallet'
  );

  const [notes, setNotes] = useState(initialAccount?.notes || '');
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setGoals(getGoals());
  }, []);

  const getDefaultCapabilitiesForType = (type: AccountType) => {
    switch (type) {
      case 'Traditional Bank':
      case 'Digital Bank':
        return {
          hasDebitCard: true,
          hasBankTransfer: true,
          hasEWallet: false,
        };

      case 'E-Wallet':
        return {
          hasDebitCard: false,
          hasBankTransfer: true,
          hasEWallet: true,
        };

      case 'Cash':
      case 'Investment':
      case 'MP2':
      case 'Other':
      default:
        return {
          hasDebitCard: false,
          hasBankTransfer: false,
          hasEWallet: false,
        };
    }
  };

  const handleAccountTypeChange = (newType: AccountType) => {
    setAccountType(newType);

    const defaults = getDefaultCapabilitiesForType(newType);

    setHasDebitCard(defaults.hasDebitCard);
    setHasBankTransfer(defaults.hasBankTransfer);
    setHasEWallet(defaults.hasEWallet);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter an account name');
      return;
    }

    const account: SavingsAccount = {
      id: initialAccount?.id || Date.now().toString(),
      name: name.trim(),
      accountType,
      currentBalance: parseFloat(currentBalance) || 0,
      targetBalance: parseFloat(targetBalance) || 0,
      linkedGoalId: linkedGoalId || undefined,

      // Payment capability flags
      hasDebitCard,
      hasBankTransfer,
      hasEWallet,

      notes,
      createdAt: initialAccount?.createdAt || new Date().toISOString(),
    };

    onSubmit(account);

    if (!initialAccount) {
      const defaults = getDefaultCapabilitiesForType('Digital Bank');

      setName('');
      setAccountType('Digital Bank');
      setCurrentBalance('0');
      setTargetBalance('0');
      setLinkedGoalId('');
      setHasDebitCard(defaults.hasDebitCard);
      setHasBankTransfer(defaults.hasBankTransfer);
      setHasEWallet(defaults.hasEWallet);
      setNotes('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Account Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., MariBank, Emergency Fund, GCash"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Account Type
          </label>
          <select
            value={accountType}
            onChange={(e) => handleAccountTypeChange(e.target.value as AccountType)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACCOUNT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This is mainly for display and organization.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/40 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Payment Capabilities
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDebitCard}
                onChange={(e) => setHasDebitCard(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Has Debit Card
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Show this account when paying via Debit Card.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasBankTransfer}
                onChange={(e) => setHasBankTransfer(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Supports Bank Transfer
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Show this account when paying or transferring via bank transfer.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEWallet}
                onChange={(e) => setHasEWallet(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                  Usable as E-Wallet
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Show this account when paying via E-wallet.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Current Balance
          </label>
          <input
            type="number"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Target Balance
          </label>
          <input
            type="number"
            value={targetBalance}
            onChange={(e) => setTargetBalance(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Linked Goal (Optional)
          </label>
          <select
            value={linkedGoalId}
            onChange={(e) => setLinkedGoalId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No linked goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name} ({goal.goalType})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Link this account to a goal for organizational purposes.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}