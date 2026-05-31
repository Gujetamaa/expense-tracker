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
    <div className="page-bg p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <h1 className="heading-page">All Transactions</h1>
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

        {/* Month Selector & Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
          <div className="filter-group">
            <label className="filter-label">Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-slate-300 font-semibold">Filter:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-blue-500 dark:bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setFilterStatus('draft')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'draft'
                  ? 'bg-amber-500 dark:bg-amber-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Draft ({draftCount})
            </button>
            <button
              onClick={() => setFilterStatus('posted')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'posted'
                  ? 'bg-green-500 dark:bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Posted ({transactions.filter((t) => t.status === 'posted').length})
            </button>
          </div>

          {draftCount > 0 && (
            <button
              onClick={handlePostAllDrafts}
              className="ml-auto bg-green-500 dark:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition"
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
