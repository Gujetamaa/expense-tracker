'use client';

import { useState, useEffect } from 'react';
import {
  Transaction,
  Category,
  PaymentMethod,
  TransactionType,
  SavingsAccount,
  Goal,
  CreditCard,
} from '@/types';
import { getCategoriesForType, getDefaultCategoryForType } from '@/lib/categories';
import { getSavingsAccounts, getGoals, getCreditCards, getAccountByName } from '@/lib/storage';

const PAYMENT_METHODS: PaymentMethod[] = ['Debit Card', 'Credit Card', 'Bank Transfer', 'E-wallet', 'Cash'];

type SelectedPaymentMethod = PaymentMethod | '';

type TransactionWithTransferFee = Transaction & {
  hasTransferFee?: boolean;
  transferFeeAmount?: number;
};

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
  initialTransaction?: Transaction;
  onCancel?: () => void;
}

export default function TransactionForm({ onSubmit, initialTransaction, onCancel }: TransactionFormProps) {
  const initialTx = initialTransaction as TransactionWithTransferFee | undefined;

  const [type, setType] = useState<TransactionType>(initialTx?.type || 'expense');
  const [date, setDate] = useState(initialTx?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>(
    initialTx?.category || getDefaultCategoryForType(initialTx?.type || 'expense')
  );
  const [description, setDescription] = useState(initialTx?.description || '');
  const [amount, setAmount] = useState(initialTx?.amount.toString() || '');

  // Empty string means no method selected yet
  const [paymentMethod, setPaymentMethod] = useState<SelectedPaymentMethod>(
    initialTx?.paymentMethod || ''
  );

  const [linkedGoalId, setLinkedGoalId] = useState(initialTx?.linkedGoalId || '');
  const [linkedAccountId, setLinkedAccountId] = useState(initialTx?.linkedAccountId || '');
  const [linkedCreditCardId, setLinkedCreditCardId] = useState(initialTx?.linkedCreditCardId || '');
  const [sourceAccountId, setSourceAccountId] = useState(initialTx?.sourceAccountId || '');
  const [destinationAccountId, setDestinationAccountId] = useState(initialTx?.destinationAccountId || '');

  const [hasTransferFee, setHasTransferFee] = useState(initialTx?.hasTransferFee || false);
  const [transferFeeAmount, setTransferFeeAmount] = useState(
    initialTx?.transferFeeAmount?.toString() || ''
  );

  const [paymentSourceType, setPaymentSourceType] = useState<'Account' | 'Other'>(
    initialTx?.paymentSourceType === 'Other' ? 'Other' : 'Account'
  );

  const [notes, setNotes] = useState(initialTx?.notes || '');
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [bpiAccountMissing, setBpiAccountMissing] = useState(false);

  useEffect(() => {
    setSavingsAccounts(getSavingsAccounts());
    setAllGoals(getGoals());
    setCreditCards(getCreditCards());
  }, []);

  // Auto-select BPI Payroll for income transactions
  useEffect(() => {
    if (type === 'income' && !linkedAccountId) {
      const bpiAccount = getAccountByName('BPI Payroll');

      if (bpiAccount) {
        setLinkedAccountId(bpiAccount.id);
        setBpiAccountMissing(false);
      } else {
        setLinkedAccountId('');
        setBpiAccountMissing(true);
      }
    }
  }, [type, linkedAccountId]);

  const availableCategories = getCategoriesForType(type);

  useEffect(() => {
    if (!availableCategories.includes(category)) {
      setCategory(getDefaultCategoryForType(type));
    }
  }, [type, availableCategories, category]);

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const parsedAmount = parseFloat(amount) || 0;
  const parsedTransferFeeAmount = hasTransferFee ? parseFloat(transferFeeAmount) || 0 : 0;
  const totalTransferOutflow = parsedAmount + parsedTransferFeeAmount;

  // Helper: Show payment method selector only for expenses
  const shouldShowPaymentMethod = (): boolean => type === 'expense';

  // Helper: Show destination account dropdown for income
  const shouldShowIncomeAccountDropdown = (): boolean => type === 'income';


  const getAccountById = (accountId?: string): SavingsAccount | undefined => {
    if (!accountId) return undefined;
    return savingsAccounts.find((account) => account.id === accountId);
  };

  const formatInsufficientFundsMessage = (
    account: SavingsAccount,
    requiredAmount: number
  ): string => {
    return `Insufficient funds in ${account.name}.\n\nAvailable: ₱${formatCurrency(
      account.currentBalance
    )}\nRequired: ₱${formatCurrency(requiredAmount)}`;
  };

  const hasSufficientFunds = (accountId: string, requiredAmount: number): boolean => {
    const account = getAccountById(accountId);

    if (!account) {
      alert('Selected account was not found.');
      return false;
    }

    if (requiredAmount > account.currentBalance) {
      alert(formatInsufficientFundsMessage(account, requiredAmount));
      return false;
    }

    return true;
  };  


  // Helper: For expenses, determine what account/card dropdown to show based on payment method
  const getExpenseAccountsForPaymentMethod = (): SavingsAccount[] => {
    switch (paymentMethod) {
      case 'Debit Card':
        return savingsAccounts.filter((account) => account.hasDebitCard);

      case 'Bank Transfer':
        return savingsAccounts.filter((account) => account.hasBankTransfer);

      case 'E-wallet':
        return savingsAccounts.filter((account) => account.hasEWallet);

      case 'Cash':
        return savingsAccounts.filter((account) => account.accountType === 'Cash');

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

  // For credit card payment: show card dropdown and payment source selector
  const shouldShowCreditCardPaymentDropdown = (): boolean => type === 'credit_card_payment';

  const shouldShowPaymentSourceDropdown = (): boolean => type === 'credit_card_payment';

  const shouldShowPaymentSourceAccountDropdown = (): boolean => {
    return type === 'credit_card_payment' && paymentSourceType === 'Account';
  };

  // Notes requirement
  const isNotesRequired = (): boolean => {
    return type === 'credit_card_payment' && paymentSourceType === 'Other';
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);

    // Reset expense-only fields when leaving expense
    if (newType !== 'expense') {
      setPaymentMethod('');
      setLinkedCreditCardId('');
    }

    // Reset credit card payment-only fields when leaving credit card payment
    if (newType !== 'credit_card_payment') {
      setPaymentSourceType('Account');
    }

    // Clear transfer-specific fields when leaving savings transfer
    if (newType !== 'savings_transfer') {
      setSourceAccountId('');
      setDestinationAccountId('');
      setLinkedGoalId('');
      setHasTransferFee(false);
      setTransferFeeAmount('');
    }
  };

  const handlePaymentMethodChange = (method: SelectedPaymentMethod) => {
    setPaymentMethod(method);

    // Clear old selections when switching methods
    setLinkedAccountId('');
    setLinkedCreditCardId('');
  };

  // Validation helpers
  const validateIncome = (): boolean => {
    if (type !== 'income') return true;

    if (bpiAccountMissing) {
      alert('BPI Payroll not found. Please select an income destination account.');
      return false;
    }

    if (!linkedAccountId) {
      alert('Please select an income destination account');
      return false;
    }

    return true;
  };

  const validateExpense = (): boolean => {
    if (type !== 'expense') return true;

    if (!paymentMethod) {
      alert('Please select a payment method');
      return false;
    }

    if (paymentMethod === 'Credit Card' && !linkedCreditCardId) {
      alert('Please select a credit card for this expense');
      return false;
    }

    if (['Debit Card', 'Bank Transfer', 'E-wallet', 'Cash'].includes(paymentMethod)) {
      if (!linkedAccountId) {
        alert('Please select an account for this expense');
        return false;
      }

      if (!hasSufficientFunds(linkedAccountId, parseFloat(amount))) {
        return false;
      }
    }

    return true;
  };

  const validateCreditCardPayment = (): boolean => {
    if (type !== 'credit_card_payment') return true;

    if (!linkedCreditCardId) {
      alert('Please select a credit card for this payment');
      return false;
    }

    if (paymentSourceType === 'Account' && !linkedAccountId) {
      alert('Please select a payment source account');
      return false;
    }

    if (paymentSourceType === 'Account' && linkedAccountId) {
      if (!hasSufficientFunds(linkedAccountId, parseFloat(amount))) {
        return false;
      }
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

  let totalRequired = parseFloat(amount);

  if (hasTransferFee) {
    if (!transferFeeAmount) {
      alert('Please enter the transfer fee amount');
      return false;
    }

    if (parseFloat(transferFeeAmount) <= 0) {
      alert('Transfer fee must be greater than 0');
      return false;
    }

    totalRequired += parseFloat(transferFeeAmount);
  }

  if (!hasSufficientFunds(sourceAccountId, totalRequired)) {
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

    if (!validateIncome() || !validateExpense() || !validateCreditCardPayment() || !validateSavingsTransfer()) {
      return;
    }

    const finalPaymentMethod: PaymentMethod =
      type === 'expense'
        ? (paymentMethod as PaymentMethod)
        : initialTx?.paymentMethod || 'Debit Card';

    const transaction: TransactionWithTransferFee = {
      id: initialTx?.id || Date.now().toString(),
      date,
      type,
      category,
      description,
      amount: parseFloat(amount),
      paymentMethod: finalPaymentMethod,
      linkedGoalId: type === 'savings_transfer' ? linkedGoalId || undefined : undefined,
      linkedAccountId:
        type === 'income' ||
        type === 'savings_transfer' ||
        (type === 'expense' && paymentMethod !== 'Credit Card') ||
        type === 'credit_card_payment'
          ? linkedAccountId || undefined
          : undefined,
      linkedCreditCardId:
        (type === 'expense' && paymentMethod === 'Credit Card') || type === 'credit_card_payment'
          ? linkedCreditCardId || undefined
          : undefined,
      sourceAccountId: type === 'savings_transfer' ? sourceAccountId || undefined : undefined,
      destinationAccountId: type === 'savings_transfer' ? destinationAccountId || undefined : undefined,
      paymentSourceType: type === 'credit_card_payment' ? paymentSourceType : undefined,
      hasTransferFee: type === 'savings_transfer' ? hasTransferFee : undefined,
      transferFeeAmount:
        type === 'savings_transfer' && hasTransferFee ? parseFloat(transferFeeAmount) : undefined,
      notes,
      createdAt: initialTx?.createdAt || new Date().toISOString(),
      status: initialTx?.status || (saveAsDraft ? 'draft' : 'posted'),
    };

    onSubmit(transaction);

    if (!initialTx) {
      setDate(new Date().toISOString().split('T')[0]);
      setType('expense');
      setCategory(getDefaultCategoryForType('expense'));
      setDescription('');
      setAmount('');
      setPaymentMethod('');
      setLinkedGoalId('');
      setLinkedAccountId('');
      setLinkedCreditCardId('');
      setSourceAccountId('');
      setDestinationAccountId('');
      setHasTransferFee(false);
      setTransferFeeAmount('');
      setPaymentSourceType('Account');
      setNotes('');
      setSaveAsDraft(false);
    }
  };

  const expenseAccounts = getExpenseAccountsForPaymentMethod();

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="savings_transfer">Savings Transfer</option>
            <option value="credit_card_payment">Credit Card Payment</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Amount (₱)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {type === 'savings_transfer' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This is the amount that will be moved to the destination account.
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {shouldShowIncomeAccountDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Destination Account *
              {linkedAccountId && savingsAccounts.find((a) => a.id === linkedAccountId) && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Auto-selected BPI Payroll)</span>
              )}
            </label>
            <select
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select destination account...</option>
              {savingsAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (₱{formatCurrency(account.currentBalance)})
                </option>
              ))}
            </select>
          </div>
        )}

        {shouldShowPaymentMethod() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value as SelectedPaymentMethod)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select a method...
              </option>
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Credit Card *</label>
            <select
              value={linkedCreditCardId}
              onChange={(e) => setLinkedCreditCardId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a card...</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} (₱{formatCurrency(Math.abs(card.currentBalance))})
                </option>
              ))}
            </select>
          </div>
        )}

        {shouldShowExpenseAccountDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Account *</label>
            <select
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an account...</option>
              {expenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (₱{formatCurrency(account.currentBalance)})
                </option>
              ))}
            </select>
          </div>
        )}

        {shouldShowSavingsTransferDropdowns() && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                From Account *
              </label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select source account...</option>
                {savingsAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (₱{formatCurrency(account.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                To Account *
              </label>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select destination account...</option>
                {savingsAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (₱{formatCurrency(account.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700/40 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTransferFee}
                  onChange={(e) => {
                    setHasTransferFee(e.target.checked);
                    if (!e.target.checked) {
                      setTransferFeeAmount('');
                    }
                  }}
                  className="mt-1 accent-blue-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    This transfer has a fee
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Example: ₱15 GCash transfer fee to another bank.
                  </span>
                </span>
              </label>

              {hasTransferFee && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Transfer Fee Amount (₱) *
                    </label>
                    <input
                      type="number"
                      value={transferFeeAmount}
                      onChange={(e) => setTransferFeeAmount(e.target.value)}
                      placeholder="15.00"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={hasTransferFee}
                    />
                  </div>

                  <div className="rounded-lg border border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/20 p-3">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Transfer Summary
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Destination receives:{' '}
                      <span className="font-semibold">₱{formatCurrency(parsedAmount)}</span>
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Fee:{' '}
                      <span className="font-semibold">₱{formatCurrency(parsedTransferFeeAmount)}</span>
                    </p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      Total deducted from source:{' '}
                      <span className="font-bold">₱{formatCurrency(totalTransferOutflow)}</span>
                    </p>
                  </div>
                </div>
              )}
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
                {allGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                For tagging/filtering only. Goal progress derives from its linked account balance.
              </p>
            </div>
          </>
        )}

        {shouldShowCreditCardPaymentDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Credit Card *</label>
            <select
              value={linkedCreditCardId}
              onChange={(e) => setLinkedCreditCardId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a card...</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name} (₱{formatCurrency(Math.abs(card.currentBalance))})
                </option>
              ))}
            </select>
          </div>
        )}

        {shouldShowPaymentSourceDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Payment Source *
            </label>
            <select
              value={paymentSourceType}
              onChange={(e) => setPaymentSourceType(e.target.value as 'Account' | 'Other')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Account">From Account</option>
              <option value="Other">Other (explain in notes)</option>
            </select>
          </div>
        )}

        {shouldShowPaymentSourceAccountDropdown() && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Source Account *
            </label>
            <select
              value={linkedAccountId}
              onChange={(e) => setLinkedAccountId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an account...</option>
              {savingsAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (₱{formatCurrency(account.currentBalance)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {type === 'income' && bpiAccountMissing && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️ <strong>BPI Payroll not found.</strong> Please select an income destination account from the dropdown
            below.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          Notes {isNotesRequired() ? '*' : '(Optional)'}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            type === 'credit_card_payment' && paymentSourceType === 'Other'
              ? 'Explain the payment source (e.g., reimbursement, correction, outside source)'
              : type === 'savings_transfer' && hasTransferFee
              ? 'Optional notes about the transfer fee'
              : 'Optional notes'
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={isNotesRequired()}
        ></textarea>
      </div>

      {!initialTx && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Save as:</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!saveAsDraft}
              onChange={() => setSaveAsDraft(false)}
              className="accent-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Post Transaction (apply effects immediately)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="radio"
              checked={saveAsDraft}
              onChange={() => setSaveAsDraft(true)}
              className="accent-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Save as Draft (review later)</span>
          </label>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className={`flex-1 font-semibold py-2 rounded-lg transition ${
            initialTx
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : saveAsDraft
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {initialTx ? 'Update Transaction' : saveAsDraft ? '✓ Save as Draft' : '✓ Post Transaction'}
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