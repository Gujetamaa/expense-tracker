'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, Goal, SavingsAccount, CreditCard } from '@/types';
import { getTransactions, saveTransaction, updateTransaction, deleteTransaction, getGoals, deleteGoal, getSavingsAccounts, getCreditCards } from '@/lib/storage';
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
  const stats = calculateMonthlyStats(monthlyTransactions);

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
      editTransactionEffects(editingTransaction, transaction);
      updateTransaction(transaction.id, transaction);
      setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? transaction : t)));
      setEditingTransaction(null);
    } else {
      applyTransactionEffects(transaction);
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
      reverseTransactionEffects(transaction);
    }
    deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setShowForm(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">Dashboard</h1>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(!showForm);
            }}
            className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition"
          >
            {showForm ? '✕ Close' : '+ Add Transaction'}
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-4 mb-8">
          <label className="text-gray-700 font-semibold">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Income"
            amount={stats.totalIncome}
            icon="💰"
            bgColor="bg-green-100 border-green-300"
            textColor="text-green-700"
          />
          <StatCard
            title="Total Expenses"
            amount={stats.totalExpenses}
            icon="💸"
            bgColor="bg-red-100 border-red-300"
            textColor="text-red-700"
          />
          <StatCard
            title="In Accounts"
            amount={totalInAccounts}
            icon="🏦"
            bgColor="bg-blue-100 border-blue-300"
            textColor="text-blue-700"
          />
          <StatCard
            title="Goals Saved"
            amount={totalGoalsSaved}
            icon="🎯"
            bgColor="bg-purple-100 border-purple-300"
            textColor="text-purple-700"
          />
          <StatCard
            title="Remaining Budget"
            amount={Math.max(stats.remainingBudget, 0)}
            icon="📊"
            bgColor="bg-indigo-100 border-indigo-300"
            textColor="text-indigo-700"
          />
        </div>

        {/* Credit Cards Section */}
        {creditCards.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Credit Cards Overview</h2>
              <button
                onClick={() => router.push('/credit-cards')}
                className="text-blue-500 hover:text-blue-700 font-semibold text-sm transition"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-gray-600">Total Limit</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  ₱{totalCreditLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${totalCreditCardBalance < 0 ? 'bg-green-50 border-green-200' : totalCreditCardBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-xs font-semibold text-gray-600">Total Balance</p>
                <p className={`text-2xl font-bold mt-1 ${totalCreditCardBalance < 0 ? 'text-green-600' : totalCreditCardBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  ₱{Math.abs(totalCreditCardBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-600 mt-1">{totalCreditCardBalance < 0 ? 'Surplus' : totalCreditCardBalance > 0 ? 'Outstanding' : 'Paid off'}</p>
              </div>
              <div className={`p-4 rounded-lg border ${cardsWithIssues > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <p className="text-xs font-semibold text-gray-600">Status</p>
                <p className={`text-2xl font-bold mt-1 ${cardsWithIssues > 0 ? 'text-orange-600' : 'text-green-600'}`}>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Transactions</h2>
          <TransactionList
            transactions={monthlyTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />
        </div>
      </div>
    </div>
  );
}
