'use client';

import { useState, useEffect } from 'react';
import { Goal } from '@/types';
import { getGoals, addGoal, updateGoal, deleteGoal, getSavingsAccounts } from '@/lib/storage';
import { getTopActiveGoals, sortGoalsByPriority } from '@/lib/goalHelpers';
import GoalForm from '@/components/GoalForm';
import GoalCard from '@/components/GoalCard';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [goalOrder, setGoalOrder] = useState<string[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);

  useEffect(() => {
    const loadGoals = () => {
      const freshGoals = getGoals();
      // Deduplicate by ID (keep latest version)
      const uniqueGoals = Array.from(
        new Map(freshGoals.map((g) => [g.id, g])).values()
      );

      // Load custom order from localStorage
      const savedOrder = localStorage.getItem('goals_order');
      if (savedOrder) {
        const order = JSON.parse(savedOrder) as string[];
        const orderedGoals = order
          .map((id) => uniqueGoals.find((g) => g.id === id))
          .filter((g) => g !== undefined) as Goal[];
        // Add any new goals not in the saved order
        const newGoals = uniqueGoals.filter((g) => !order.includes(g.id));
        setGoals([...orderedGoals, ...newGoals]);
        setGoalOrder([...order, ...newGoals.map((g) => g.id)]);
      } else {
        setGoals(uniqueGoals);
        setGoalOrder(uniqueGoals.map((g) => g.id));
      }
    };

    loadGoals();
    setMounted(true);

    // Reload goals when page becomes visible (handles updates from other pages)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadGoals();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAddGoal = (goal: Goal) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, goal);
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
      setEditingGoal(null);
    } else {
      // Check if goal with same ID already exists (prevent duplicates)
      const existingIndex = goals.findIndex((g) => g.id === goal.id);
      if (existingIndex === -1) {
        addGoal(goal);
        setGoals((prev) => [...prev, goal]);
      }
    }
    setShowForm(false);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDeleteGoal = (id: string) => {
    deleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setShowForm(false);
  };

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

    const dragIndex = goalOrder.indexOf(draggedId);
    const dropIndex = goalOrder.indexOf(dropId);

    const newOrder = [...goalOrder];
    [newOrder[dragIndex], newOrder[dropIndex]] = [newOrder[dropIndex], newOrder[dragIndex]];

    setGoalOrder(newOrder);
    localStorage.setItem('goals_order', JSON.stringify(newOrder));

    // Reorder displayed goals
    const reordered = newOrder
      .map((goalId) => goals.find((g) => g.id === goalId))
      .filter((g) => g !== undefined) as Goal[];
    setGoals(reordered);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const handleEditMode = () => {
    if (!editMode) {
      setOriginalOrder([...goalOrder]);
    }
    setEditMode(!editMode);
  };

  const handleCancelReorder = () => {
    const reordered = originalOrder
      .map((goalId) => goals.find((g) => g.id === goalId))
      .filter((g) => g !== undefined) as Goal[];
    setGoals(reordered);
    setGoalOrder(originalOrder);
    setEditMode(false);
  };

  if (!mounted) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const accounts = getSavingsAccounts();
  const accountBalances = Object.fromEntries(accounts.map(a => [a.id, a.currentBalance]));
  const totalSaved = goals.reduce((sum, g) => sum + (accountBalances[g.linkedAccountId] || 0), 0);
  const topGoals = getTopActiveGoals(goals, accountBalances, 3);
  const sortedGoals = sortGoalsByPriority(goals);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Goals</h1>
          <div className="flex gap-2">
            {goals.length > 0 && (
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
                  setEditingGoal(null);
                  setShowForm(!showForm);
                }}
                className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition"
              >
                {showForm ? '✕ Close' : '+ Add Goal'}
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Total Saved</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              ₱{totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Active Goals</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{goals.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm font-semibold">Top Priority</p>
            <p className="text-lg font-bold text-purple-600 mt-2">
              {topGoals.length > 0 ? topGoals[0].name : '—'}
            </p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <GoalForm
              onSubmit={handleAddGoal}
              initialGoal={editingGoal || undefined}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No goals yet. Create one to start tracking!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                draggable={editMode}
                onDragStart={(e) => handleDragStart(e, goal.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, goal.id)}
                onDragEnd={handleDragEnd}
                className={`${editMode ? 'cursor-move' : ''} ${draggedId === goal.id ? 'opacity-50' : ''} transition-opacity`}
              >
                {editMode && (
                  <div className="absolute top-2 left-2 z-10 text-2xl text-gray-400">
                    ☰
                  </div>
                )}
                <GoalCard
                  goal={goal}
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
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
