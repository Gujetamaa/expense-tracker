'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from '@/types';
import { getCreditCards, addCreditCard, updateCreditCard, deleteCreditCard } from '@/lib/storage';
import CreditCardForm from '@/components/CreditCardForm';
import CreditCardCard from '@/components/CreditCardCard';
import StatCard from '@/components/StatCard';

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>([]);

  useEffect(() => {
    const loadCards = () => {
      const freshCards = getCreditCards();
      // Deduplicate by ID (keep latest version)
      const uniqueCards = Array.from(
        new Map(freshCards.map((c) => [c.id, c])).values()
      );

      // Load custom order from localStorage
      const savedOrder = localStorage.getItem('credit_cards_order');
      if (savedOrder) {
        const order = JSON.parse(savedOrder) as string[];
        const orderedCards = order
          .map((id) => uniqueCards.find((c) => c.id === id))
          .filter((c) => c !== undefined) as CreditCard[];
        // Add any new cards not in the saved order
        const newCards = uniqueCards.filter((c) => !order.includes(c.id));
        setCards([...orderedCards, ...newCards]);
        setCardOrder([...order, ...newCards.map((c) => c.id)]);
      } else {
        setCards(uniqueCards);
        setCardOrder(uniqueCards.map((c) => c.id));
      }
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

    const dragIndex = cardOrder.indexOf(draggedId);
    const dropIndex = cardOrder.indexOf(dropId);

    const newOrder = [...cardOrder];
    [newOrder[dragIndex], newOrder[dropIndex]] = [newOrder[dropIndex], newOrder[dragIndex]];

    setCardOrder(newOrder);
    localStorage.setItem('credit_cards_order', JSON.stringify(newOrder));

    // Reorder displayed cards
    const reordered = newOrder
      .map((cardId) => cards.find((c) => c.id === cardId))
      .filter((c) => c !== undefined) as CreditCard[];
    setCards(reordered);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleEditMode = () => {
    if (!editMode) {
      setOriginalOrder([...cardOrder]);
    }
    setEditMode(!editMode);
  };

  const handleCancelReorder = () => {
    const reordered = originalOrder
      .map((cardId) => cards.find((c) => c.id === cardId))
      .filter((c) => c !== undefined) as CreditCard[];
    setCards(reordered);
    setCardOrder(originalOrder);
    setEditMode(false);
  };

  if (!mounted) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const totalCreditLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalBalance = cards.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalAvailableCredit = cards.reduce((sum, c) => sum + Math.max(c.creditLimit - Math.max(c.currentBalance, 0), 0), 0);

  return (
    <div className="page-bg p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <h1 className="heading-page">Credit Cards</h1>
          <div className="flex gap-2">
            {cards.length > 0 && (
              <>
                {editMode ? (
                  <>
                    <button
                      onClick={() => setEditMode(false)}
                      className="button-primary bg-green-600 hover:bg-green-700"
                    >
                      ✓ Done
                    </button>
                    <button
                      onClick={handleCancelReorder}
                      className="button-secondary"
                    >
                      ✕ Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditMode}
                    className="button-secondary"
                  >
                    ✎ Edit Order
                  </button>
                )}
              </>
            )}
            {!editMode && (
              <button
                onClick={() => {
                  setEditingCard(null);
                  setShowForm(!showForm);
                }}
                className="button-primary"
              >
                {showForm ? '✕ Close' : '+ Add Card'}
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid-cols-2-responsive mb-8">
          <StatCard
            title="Total Credit Limit"
            amount={totalCreditLimit}
            icon="💳"
            bgColor="kpi-accounts border-blue-200 dark:border-blue-700/60"
            textColor="text-blue-700 dark:text-blue-300"
          />
          <StatCard
            title="Total Balance"
            amount={Math.abs(totalBalance)}
            icon={totalBalance < 0 ? '✅' : totalBalance > 0 ? '⚠️' : '💰'}
            bgColor="kpi-expenses border-rose-200 dark:border-rose-700/60"
            textColor={totalBalance < 0 ? 'text-emerald-700 dark:text-emerald-300' : totalBalance > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'}
          />
          <StatCard
            title="Available Credit"
            amount={totalAvailableCredit}
            icon="🎯"
            bgColor="kpi-goals border-emerald-200 dark:border-emerald-700/60"
            textColor="text-emerald-700 dark:text-emerald-300"
          />
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
          <div className="empty-state p-12">
            <p className="text-gray-500 text-lg">No credit cards yet. Add one to start tracking!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {cards.map((card) => (
              <div
                key={card.id}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, card.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, card.id)}
                onDragEnd={handleDragEnd}
                className={`h-full flex flex-col ${editMode ? 'cursor-move' : ''} ${draggedId === card.id ? 'opacity-50' : ''} transition-opacity`}
              >
                {editMode && (
                  <div className="absolute top-2 left-2 z-10 text-2xl text-gray-400">
                    ☰
                  </div>
                )}
                <CreditCardCard
                  card={card}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
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
