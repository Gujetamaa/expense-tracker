'use client';

import { useState, useEffect } from 'react';
import { Transaction, Category, PaymentMethod, TransactionType, SavingsAccount, Goal, CreditCard } from '@/types';
import { getCategoriesForType, getDefaultCategoryForType } from '@/lib/categories';
import { getSavingsAccounts, getGoals, getCreditCards } from '@/lib/storage';

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'E-wallet'];

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
  initialTransaction?: Transaction;
  onCancel?: () => void;
}

export default function TransactionForm({ onSubmit, initialTransaction, onCancel }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialTransaction?.type || 'expense');
  const [date, setDate] = useState(initialTransaction?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(initialTransaction?.category || getDefaultCategoryForType('expense'));
  const [description, setDescription] = useState(initialTransaction?.description || '');
  const [amount, setAmount] = useState(initialTransaction?.amount.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initialTransaction?.paymentMethod || 'Cash');
  const [linkedGoalId, setLinkedGoalId] = useState(initialTransaction?.linkedGoalId || '');
  const [linkedAccountId, setLinkedAccountId] = useState(initialTransaction?.linkedAccountId || '');
  const [linkedCreditCardId, setLinkedCreditCardId] = useState(initialTransaction?.linkedCreditCardId || '');
  const [sourceAccountId, setSourceAccountId] = useState(initialTransaction?.sourceAccountId || '');
  const [destinationAccountId, setDestinationAccountId] = useState(initialTransaction?.destinationAccountId || '');
  const [paymentSourceType, setPaymentSourceType] = useState<'Account' | 'Cash' | 'Other'>(initialTransaction?.paymentSourceType || 'Account');
  const [notes, setNotes] = useState(initialTransaction?.notes || '');
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  useEffect(() => {
    setSavingsAccounts(getSavingsAccounts());
    setAllGoals(getGoals());
    setCreditCards(getCreditCards());
  }, []);

  const availableCategories = getCategoriesForType(type);

  useEffect(() => {
    if (!availableCategories.includes(category)) {
      setCategory(getDefaultCategoryForType(type));
    }
  }, [type, availableCategories]);

  // Helper: Show payment method selector only for expenses
  const shouldShowPaymentMethod = (): boolean => type === 'expense';

  // Helper: For expenses, determine what account/card dropdown to show based on payment method
  const getExpenseAccountsForPaymentMethod = (): SavingsAccount[] => {
    switch (paymentMethod) {
      case 'Debit Card':
        return savingsAccounts.filter(a => a.hasDebitCard);
      case 'Bank Transfer':
        return savingsAccounts.filter(a => ['Traditional Bank', 'Digital Bank'].includes(a.accountType));
      case 'E-wallet':
        return savingsAccounts.filter(a => a.accountType === 'E-Wallet');
      case 'Cash':
        return savingsAccounts.filter(a => a.accountType === 'Cash');
      default:
        return [];
    }
  };

  const shouldShowExpenseAccountDropdown = (): boolean => {
    return type === 'expense' && ['Debit Card', 'Bank Transfer', 'E-wallet', 'Cash'].includes(paymentMethod);
  };

  const shouldShowExpenseCreditCardDropdown = (): boolean => {
    return type === 'expense' && paymentMethod === 'Credit Card';
  };

  // For savings_transfer: show source and destination account dropdowns
  const shouldShowSavingsTransferDropdowns = (): boolean => {
    return type === 'savings_transfer';
  };

  const shouldShowLinkedGoalDropdown = (): boolean => {
    return type === 'savings_transfer';
  };

  // For credit card payment: show card dropdown and payment source selector
  const shouldShowCreditCardPaymentDropdown = (): boolean => type === 'credit_card_payment';

  const shouldShowPaymentSourceDropdown = (): boolean => type === 'credit_card_payment';

  const shouldShowPaymentSourceAccountDropdown = (): boolean => {
    return type === 'credit_card_payment' && (paymentSourceType === 'Account' || paymentSourceType === 'Cash');
  };

  // Notes requirement
  const isNotesRequired = (): boolean => {
    if (type === 'credit_card_payment' && paymentSourceType === 'Other') {
      return true;
    }
    return false;
  };

  // Validation helpers
  const validateExpense = (): boolean => {
    if (type !== 'expense') return true;
    if (paymentMethod === 'Credit Card' && !linkedCreditCardId) {
      alert('Please select a credit card for this expense');
      return false;
    }
    if (['Debit Card', 'Bank Transfer', 'E-wallet'].includes(paymentMethod) && !linkedAccountId) {
      alert('Please select an account for this expense');
      return false;
    }
    return true;
  };

  const validateCreditCardPayment = (): boolean => {
    if (type !== 'credit_card_payment') return true;
    if (!linkedCreditCardId) {
      alert('Please select a credit card for this payment');
      return false;
    }
    if ((paymentSourceType === 'Account' || paymentSourceType === 'Cash') && !linkedAccountId) {
      alert('Please select a payment source account');
      return false;
    }
    if (paymentSourceType === 'Other' && !notes.trim()) {
      alert('Please explain the payment source when "Other" is selected');
      return false;
    }
    return true;
  };

  const validateSavingsTransfer = (): boolean => {
    if (type !== 'savings_transfer') return true;
    if (!sourceAccountId) {
      alert('Please select a source account');
      return false;
    }
    if (!destinationAccountId) {
      alert('Please select a destination account');
      return false;
    }
    if (sourceAccountId === destinationAccountId) {
      alert('Source and destination accounts must be different');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !description || !amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (!validateExpense() || !validateCreditCardPayment() || !validateSavingsTransfer()) {
      return;
    }

    const transaction: Transaction = {
      id: initialTransaction?.id || Date.now().toString(),
      date,
      type,
      category,
      description,
      amount: parseFloat(amount),
      paymentMethod,
      linkedGoalId: type === 'savings_transfer' ? linkedGoalId || undefined : undefined,
      linkedAccountId: (type === 'savings_transfer' || (type === 'expense' && paymentMethod !== 'Credit Card') || type === 'credit_card_payment') ? linkedAccountId || undefined : undefined,
      linkedCreditCardId: (type === 'expense' && paymentMethod === 'Credit Card') || type === 'credit_card_payment' ? linkedCreditCardId || undefined : undefined,
      sourceAccountId: type === 'savings_transfer' ? sourceAccountId || undefined : undefined,
      destinationAccountId: type === 'savings_transfer' ? destinationAccountId || undefined : undefined,
      paymentSourceType: type === 'credit_card_payment' ? paymentSourceType : undefined,
      notes,
      createdAt: initialTransaction?.createdAt || new Date().toISOString(),
    };

    onSubmit(transaction);

    if (!initialTransaction) {
      setDate(new Date().toISOString().split('T')[0]);
      setType('expense');
      setCategory(getDefaultCategoryForType('expense'));
      setDescription('');
      setAmount('');
      setPaymentMethod('Cash');
      setLinkedGoalId('');
      setLinkedAccountId('');
      setLinkedCreditCardId('');
      setSourceAccountId('');
      setDestinationAccountId('');
      setPaymentSourceType('Account');
      setNotes('');
    }
  };

  const expenseAccounts = getExpenseAccountsForPaymentMethod();

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="savings_transfer">Savings Transfer</option>
            <option value="credit_card_payment">Credit Card Payment</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (₱)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {shouldShowPaymentMethod() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        )}

        {shouldShowExpenseCreditCardDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Credit Card *</label>
            <select
              value={linkedCreditCardId}
              onChange={(e) => setLinkedCreditCardId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a card...</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} (₱{Math.abs(card.currentBalance).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {shouldShowExpenseAccountDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              {paymentMethod === 'Cash' ? 'Cash Account' : 'Account'} {paymentMethod === 'Cash' ? '(Optional)' : '*'}
            </label>
            <select
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={paymentMethod !== 'Cash'}
            >
              <option value="">Select an account...</option>
              {expenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (₱{account.currentBalance.toLocaleString()})
                </option>
              ))}
            </select>
            {paymentMethod === 'Cash' && expenseAccounts.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">No cash accounts. This expense will not update an account balance.</p>
            )}
          </div>
        )}

        {shouldShowSavingsTransferDropdowns() && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">From Account *</label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select source account...</option>
                {savingsAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (₱{account.currentBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">To Account *</label>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select destination account...</option>
                {savingsAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (₱{account.currentBalance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Linked Goal (Optional)</label>
              <select
                value={linkedGoalId}
                onChange={(e) => setLinkedGoalId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No linked goal</option>
                {allGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">For tagging/filtering only. Goal progress derives from its linked account balance.</p>
            </div>
          </>
        )}

        {shouldShowCreditCardPaymentDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Credit Card *</label>
            <select
              value={linkedCreditCardId}
              onChange={(e) => setLinkedCreditCardId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a card...</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} (₱{Math.abs(card.currentBalance).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {shouldShowPaymentSourceDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Source *</label>
            <select
              value={paymentSourceType}
              onChange={(e) => setPaymentSourceType(e.target.value as 'Account' | 'Cash' | 'Other')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Account">From Account</option>
              <option value="Cash">From Cash</option>
              <option value="Other">Other (explain in notes)</option>
            </select>
          </div>
        )}

        {shouldShowPaymentSourceAccountDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Source Account *</label>
            <select
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an account...</option>
              {savingsAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (₱{account.currentBalance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Notes {isNotesRequired() ? '*' : '(Optional)'}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            type === 'credit_card_payment' && paymentSourceType === 'Other'
              ? 'Explain the payment source (e.g., loan, advance, gift)'
              : 'Optional notes'
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={isNotesRequired()}
        ></textarea>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition"
        >
          {initialTransaction ? 'Update' : 'Add'} Transaction
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
