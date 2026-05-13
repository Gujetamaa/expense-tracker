'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import { getTransactions, saveTransaction, updateTransaction, deleteTransaction } from '@/lib/storage';
import { getMonthYear, getTransactionsForMonth } from '@/lib/calculations';
import { applyTransactionEffects, editTransactionEffects, deleteTransactionEffects } from '@/lib/transactionEffects';
import { getSavingsAccounts, getCreditCards } from '@/lib/storage';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getMonthYear(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getTransactions();
    setTransactions(stored);
  }, []);

  const monthlyTransactions = getTransactionsForMonth(transactions, selectedMonth);

  const handleAddTransaction = (transaction: Transaction) => {
    if (editingTransaction) {
      // Reverse old effects and apply new ones
      editTransactionEffects(editingTransaction, transaction);
      updateTransaction(transaction.id, transaction);
      setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? transaction : t)));
      setEditingTransaction(null);
    } else {
      // Apply new transaction effects
      applyTransactionEffects(transaction);
      saveTransaction(transaction);
      setTransactions((prev) => [...prev, transaction]);
    }
    setShowForm(false);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDeleteTransaction = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      deleteTransactionEffects(transaction);
    }
    deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setShowForm(false);
  };

  if (!mounted) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">
            All Transactions
          </h1>
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

        {/* Transactions List */}
        <TransactionList
          transactions={monthlyTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
        />
      </div>
    </div>
  );
}
