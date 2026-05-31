'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';
import { getTransactions, saveTransaction, updateTransaction, deleteTransaction, postMultipleDrafts, postTransactionDraft } from '@/lib/storage';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'posted'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getTransactions();
    setTransactions(stored);
  }, []);

  const monthlyTransactions = getTransactionsForMonth(transactions, selectedMonth).filter((t) => {
    if (filterStatus === 'draft') return t.status === 'draft';
    if (filterStatus === 'posted') return t.status === 'posted';
    return true;
  });

  const handleAddTransaction = (transaction: Transaction) => {
    if (editingTransaction) {
      // When editing, handle status changes and effects accordingly
      if (editingTransaction.status === 'posted' && transaction.status === 'posted') {
        // Posted → Posted: reverse old and apply new effects
        editTransactionEffects(editingTransaction, transaction);
      } else if (editingTransaction.status === 'posted' && transaction.status === 'draft') {
        // Posted → Draft: reverse effects only
        deleteTransactionEffects(editingTransaction);
      } else if (editingTransaction.status === 'draft' && transaction.status === 'posted') {
        // Draft → Posted: apply effects only
        applyTransactionEffects(transaction);
      }
      // Draft → Draft: no effects needed
      updateTransaction(transaction.id, transaction);
      setTransactions((prev) => prev.map((t) => (t.id === transaction.id ? transaction : t)));
      setEditingTransaction(null);
    } else {
      // New transaction: only apply effects if posted
      if (transaction.status === 'posted') {
        applyTransactionEffects(transaction);
      }
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
      // Only reverse effects if the transaction was posted
      if (transaction.status === 'posted') {
        deleteTransactionEffects(transaction);
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
    }
  };

  const handlePostAllDrafts = () => {
    const drafts = getTransactions().filter((t) => t.status === 'draft');
    if (drafts.length === 0) {
      alert('No draft transactions to post.');
      return;
    }
    const confirmed = confirm(`Post all ${drafts.length} draft transactions?`);
    if (!confirmed) return;

    const posted = postMultipleDrafts(drafts.map((d) => d.id));
    posted.forEach((t) => applyTransactionEffects(t));
    setTransactions(getTransactions());
  };

  const draftCount = transactions.filter((t) => t.status === 'draft').length;

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

        {/* Month Selector & Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <label className="text-gray-700 font-semibold">Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-semibold">Filter:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'draft'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Draft ({draftCount})
            </button>
            <button
              onClick={() => setFilterStatus('posted')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'posted'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Posted ({transactions.filter((t) => t.status === 'posted').length})
            </button>
          </div>

          {draftCount > 0 && (
            <button
              onClick={handlePostAllDrafts}
              className="ml-auto bg-green-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-600 transition"
            >
              📤 Post All {draftCount} Drafts
            </button>
          )}
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
          onPost={handlePostDraft}
        />
      </div>
    </div>
  );
}
