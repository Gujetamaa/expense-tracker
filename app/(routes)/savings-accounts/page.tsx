'use client';

import { useState, useEffect } from 'react';
import { SavingsAccount } from '@/types';
import { getSavingsAccounts, saveSavingsAccount, updateSavingsAccount, deleteSavingsAccount } from '@/lib/storage';
import SavingsAccountForm from '@/components/SavingsAccountForm';
import SavingsAccountCard from '@/components/SavingsAccountCard';

export default function SavingsAccountsPage() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavingsAccount | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [accountOrder, setAccountOrder] = useState<string[]>([]);

  useEffect(() => {
    const loadAccounts = () => {
      const freshAccounts = getSavingsAccounts();
      // Deduplicate by ID (keep latest version)
      const uniqueAccounts = Array.from(
        new Map(freshAccounts.map((a) => [a.id, a])).values()
      );

      // Load custom order from localStorage
      const savedOrder = localStorage.getItem('savings_accounts_order');
      if (savedOrder) {
        const order = JSON.parse(savedOrder) as string[];
        const orderedAccounts = order
          .map((id) => uniqueAccounts.find((a) => a.id === id))
          .filter((a) => a !== undefined) as SavingsAccount[];
        // Add any new accounts not in the saved order
        const newAccounts = uniqueAccounts.filter((a) => !order.includes(a.id));
        setAccounts([...orderedAccounts, ...newAccounts]);
        setAccountOrder([...order, ...newAccounts.map((a) => a.id)]);
      } else {
        setAccounts(uniqueAccounts);
        setAccountOrder(uniqueAccounts.map((a) => a.id));
      }
    };

    loadAccounts();
    setMounted(true);

    // Reload accounts when page becomes visible (handles updates from other pages)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAccounts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAddAccount = (account: SavingsAccount) => {
    if (editingAccount) {
      updateSavingsAccount(account.id, account);
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
      setEditingAccount(null);
    } else {
      // Check if account with same ID already exists (prevent duplicates)
      const existingIndex = accounts.findIndex((a) => a.id === account.id);
      if (existingIndex === -1) {
        saveSavingsAccount(account);
        setAccounts((prev) => [...prev, account]);
      }
    }
    setShowForm(false);
  };

  const handleEditAccount = (account: SavingsAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDeleteAccount = (id: string) => {
    deleteSavingsAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
    setShowForm(false);
  };

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === dropId) return;

    const dragIndex = accountOrder.indexOf(draggedId);
    const dropIndex = accountOrder.indexOf(dropId);

    const newOrder = [...accountOrder];
    [newOrder[dragIndex], newOrder[dropIndex]] = [newOrder[dropIndex], newOrder[dragIndex]];

    setAccountOrder(newOrder);
    localStorage.setItem('savings_accounts_order', JSON.stringify(newOrder));

    // Reorder displayed accounts
    const reordered = newOrder
      .map((accountId) => accounts.find((a) => a.id === accountId))
      .filter((a) => a !== undefined) as SavingsAccount[];
    setAccounts(reordered);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleEditMode = () => {
    if (!editMode) {
      setOriginalOrder([...accountOrder]);
    }
    setEditMode(!editMode);
  };

  const handleCancelReorder = () => {
    const reordered = originalOrder
      .map((accountId) => accounts.find((a) => a.id === accountId))
      .filter((a) => a !== undefined) as SavingsAccount[];
    setAccounts(reordered);
    setAccountOrder(originalOrder);
    setEditMode(false);
  };

  if (!mounted) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalTarget = accounts.reduce((sum, acc) => sum + acc.targetBalance, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Savings Accounts
          </h1>
          <div className="flex gap-2">
            {accounts.length > 0 && (
              <>
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="bg-green-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-600 transition"
                    >
                      ✓ Done
                    </button>
                    <button
                      onClick={handleCancelReorder}
                      className="bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-600 transition"
                    >
                      ✕ Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditMode}
                    className="bg-gray-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-gray-600 transition"
                  >
                    ✎ Edit Order
                  </button>
                )}
              </>
            )}
            {!editMode && (
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setShowForm(!showForm);
                }}
                className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition"
              >
                {showForm ? '✕ Close' : '+ Add Account'}
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Balance</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ₱{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Target</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ₱{totalTarget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Accounts</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{accounts.length}</p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <SavingsAccountForm
              onSubmit={handleAddAccount}
              initialAccount={editingAccount || undefined}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {/* Accounts Grid */}
        {accounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">
              No savings accounts yet. Create one to start tracking your savings!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <div
                key={account.id}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, account.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, account.id)}
                onDragEnd={handleDragEnd}
                className={`${editMode ? 'cursor-move' : ''} ${draggedId === account.id ? 'opacity-50' : ''} transition-opacity`}
              >
                {editMode && (
                  <div className="absolute top-2 left-2 z-10 text-2xl text-gray-400">
                    ☰
                  </div>
                )}
                <SavingsAccountCard
                  account={account}
                  onEdit={handleEditAccount}
                  onDelete={handleDeleteAccount}
                  editMode={editMode}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
