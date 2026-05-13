'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from '@/types';
import { getCreditCards, addCreditCard, updateCreditCard, deleteCreditCard } from '@/lib/storage';
import CreditCardForm from '@/components/CreditCardForm';
import CreditCardCard from '@/components/CreditCardCard';

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loadCards = () => {
      const freshCards = getCreditCards();
      // Deduplicate by ID (keep latest version)
      const uniqueCards = Array.from(
        new Map(freshCards.map((c) => [c.id, c])).values()
      );
      setCards(uniqueCards);
    };

    loadCards();
    setMounted(true);

    // Reload cards when page becomes visible (handles updates from other pages)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadCards();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAddCard = (card: CreditCard) => {
    if (editingCard) {
      updateCreditCard(card.id, card);
      setCards((prev) => prev.map((c) => (c.id === card.id ? card : c)));
      setEditingCard(null);
    } else {
      // Check if card with same ID already exists (prevent duplicates)
      const existingIndex = cards.findIndex((c) => c.id === card.id);
      if (existingIndex === -1) {
        addCreditCard(card);
        setCards((prev) => [...prev, card]);
      }
    }
    setShowForm(false);
  };

  const handleEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const handleDeleteCard = (id: string) => {
    deleteCreditCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setShowForm(false);
  };

  if (!mounted) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const totalCreditLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalBalance = cards.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalAvailableCredit = cards.reduce((sum, c) => sum + Math.max(c.creditLimit - Math.max(c.currentBalance, 0), 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-0">Credit Cards</h1>
          <button
            onClick={() => {
              setEditingCard(null);
              setShowForm(!showForm);
            }}
            className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition"
          >
            {showForm ? '✕ Close' : '+ Add Card'}
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Credit Limit</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ₱{totalCreditLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Balance</p>
            <p className={`text-3xl font-bold mt-2 ${totalBalance < 0 ? 'text-green-600' : totalBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
              ₱{Math.abs(totalBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {totalBalance < 0 ? 'Credit Surplus' : totalBalance > 0 ? 'Outstanding' : 'No balance'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Available Credit</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ₱{totalAvailableCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <CreditCardForm
              onSubmit={handleAddCard}
              initialCard={editingCard || undefined}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {/* Credit Cards Grid */}
        {cards.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No credit cards yet. Add one to start tracking!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <CreditCardCard
                key={card.id}
                card={card}
                onEdit={handleEditCard}
                onDelete={handleDeleteCard}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
