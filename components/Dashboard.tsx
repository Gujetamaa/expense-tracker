'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, Goal, SavingsAccount, CreditCard } from '@/types';
import { getTransactions, saveTransaction, updateTransaction, deleteTransaction, getGoals, deleteGoal, getSavingsAccounts, getCreditCards, postTransactionDraft } from '@/lib/storage';
import { getMonthYear, getTransactionsForMonth, calculateMonthlyStats } from '@/lib/calculations';
import { applyTransactionEffects, reverseTransactionEffects, editTransactionEffects } from '@/lib/transactionEffects';
import StatCard from './StatCard';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import GoalsSection from './GoalsSection';

export default function Dashboard() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getMonthYear(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getTransactions();
    setTransactions(stored);
    setGoals(getGoals());
    setAccounts(getSavingsAccounts());
    setCreditCards(getCreditCards());
  }, []);

  const monthlyTransactions = getTransactionsForMonth(transactions, selectedMonth);
  // Only count posted transactions in stats
  const postedTransactions = monthlyTransactions.filter((t) => t.status === 'posted');
  const draftTransactions = monthlyTransactions.filter((t) => t.status === 'draft');
  const stats = calculateMonthlyStats(postedTransactions);

  // Calculate draft summary
  const draftIncome = draftTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const draftExpenses = draftTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate total saved across all goals (from their linked accounts)
  const accountBalances = Object.fromEntries(accounts.map(a => [a.id, a.currentBalance]));
  const totalGoalsSaved = goals.reduce((sum, g) => sum + (accountBalances[g.linkedAccountId] || 0), 0);

  // Calculate total money in savings accounts (initial balances + transaction effects)
  const totalInAccounts = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // Calculate credit card stats
  const totalCreditCardBalance = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const cardsWithIssues = creditCards.filter(card => card.currentBalance > card.creditLimit || card.currentBalance > 0).length;

  const handleAddTransaction = (transaction: Transaction) => {
    if (editingTransaction) {
      if (editingTransaction.status === 'posted' && transaction.status === 'posted') {
        editTransactionEffects(editingTransaction, transaction);
      } else if (editingTransaction.status === 'posted' && transaction.status === 'draft') {
        reverseTransactionEffects(editingTransaction);
      } else if (editingTransaction.status === 'draft' && transaction.status === 'posted') {
        applyTransactionEffects(transaction);
      }
      updateTransaction(transaction.id, transaction);
      setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? transaction : t)));
      setEditingTransaction(null);
    } else {
      if (transaction.status === 'posted') {
        applyTransactionEffects(transaction);
      }
      saveTransaction(transaction);
      setTransactions((prev) => [...prev, transaction]);
    }
    setShowForm(false);
    setAccounts(getSavingsAccounts());
    setCreditCards(getCreditCards());
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      if (transaction.status === 'posted') {
        reverseTransactionEffects(transaction);
      }
    }
    deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setShowForm(false);
  };

  const handlePostDraft = (id: string) => {
    const posted = postTransactionDraft(id);
    if (posted) {
      applyTransactionEffects(posted);
      setTransactions((prev) => prev.map((t) => (t.id === id ? posted : t)));
      setAccounts(getSavingsAccounts());
      setCreditCards(getCreditCards());
    }
  };

  const handleEditGoal = (goal: Goal) => {
    router.push(`/goals?edit=${goal.id}`);
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleAddGoal = () => {
    router.push('/goals');
  };

  if (!mounted) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="page-bg p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <h1 className="heading-page">Dashboard</h1>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(!showForm);
            }}
            className="button-primary"
          >
            {showForm ? '✕ Close' : '+ Add Transaction'}
          </button>
        </div>

        {/* Month Selector */}
        <div className="filter-group">
          <label className="filter-label">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <TransactionForm
              onSubmit={handleAddTransaction}
              initialTransaction={editingTransaction || undefined}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid-cols-5-responsive mb-8">
          <StatCard
            title="Total Income"
            amount={stats.totalIncome}
            icon="💰"
            bgColor="kpi-income border-emerald-200 dark:border-emerald-700/60"
            textColor="text-emerald-700 dark:text-emerald-300"
          />
          <StatCard
            title="Total Expenses"
            amount={stats.totalExpenses}
            icon="💸"
            bgColor="kpi-expenses border-rose-200 dark:border-rose-700/60"
            textColor="text-rose-700 dark:text-rose-300"
          />
          <StatCard
            title="In Accounts"
            amount={totalInAccounts}
            icon="🏦"
            bgColor="kpi-accounts border-blue-200 dark:border-blue-700/60"
            textColor="text-blue-700 dark:text-blue-300"
          />
          <StatCard
            title="Goals Saved"
            amount={totalGoalsSaved}
            icon="🎯"
            bgColor="kpi-goals border-violet-200 dark:border-violet-700/60"
            textColor="text-violet-700 dark:text-violet-300"
          />
          <StatCard
            title="Remaining Budget"
            amount={Math.max(stats.remainingBudget, 0)}
            icon="📊"
            bgColor="kpi-budget border-indigo-200 dark:border-indigo-700/60"
            textColor="text-indigo-700 dark:text-indigo-300"
          />
        </div>

        {/* Pending Drafts Summary */}
        {draftTransactions.length > 0 && (
          <div className="section-warning mb-8">
            <h2 className="text-xl font-bold section-warning-text mb-4">📝 Pending Drafts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-slate-700/40 rounded-xl border border-amber-200 dark:border-amber-700/40">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Draft Transactions</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{draftTransactions.length}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-700/40 rounded-xl border border-green-200 dark:border-green-700/40">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Pending Income</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">₱{draftIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 bg-white dark:bg-slate-700/40 rounded-xl border border-red-200 dark:border-red-700/40">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Pending Expenses</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">₱{draftExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        )}

        {/* Credit Cards Section */}
        {creditCards.length > 0 && (
          <div className="section-panel mb-8">
            <div className="section-title mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Credit Cards Overview</h2>
              <button
                onClick={() => router.push('/credit-cards')}
                className="link-primary"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700/40">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Total Limit</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  ₱{totalCreditLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className={`p-4 rounded-xl border ${totalCreditCardBalance < 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40' : totalCreditCardBalance > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/40' : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700/40'}`}>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Total Balance</p>
                <p className={`text-2xl font-bold mt-1 ${totalCreditCardBalance < 0 ? 'text-green-600 dark:text-green-400' : totalCreditCardBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  ₱{Math.abs(totalCreditCardBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{totalCreditCardBalance < 0 ? 'Surplus' : totalCreditCardBalance > 0 ? 'Outstanding' : 'Paid off'}</p>
              </div>
              <div className={`p-4 rounded-xl border ${cardsWithIssues > 0 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/40' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/40'}`}>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Status</p>
                <p className={`text-2xl font-bold mt-1 ${cardsWithIssues > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {cardsWithIssues > 0 ? `${cardsWithIssues} card${cardsWithIssues !== 1 ? 's' : ''} need attention` : 'All good'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Goals Section */}
        <div className="mb-8">
          <GoalsSection
            goals={goals}
            accounts={accounts}
            onEdit={handleEditGoal}
            onDelete={handleDeleteGoal}
            onAddGoal={handleAddGoal}
          />
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="heading-section mb-4">Recent Transactions</h2>
          <TransactionList
            transactions={monthlyTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onPost={handlePostDraft}
          />
        </div>
      </div>
    </div>
  );
}
