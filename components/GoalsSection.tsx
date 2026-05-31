'use client';

import { useState, useEffect } from 'react';
import { Goal, SavingsAccount } from '@/types';
import { sortGoalsByPriority } from '@/lib/goalHelpers';
import GoalCard from './GoalCard';
import GoalListItem from './GoalListItem';

type ViewMode = 'card' | 'list';

interface GoalsSectionProps {
  goals: Goal[];
  accounts: SavingsAccount[];
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onAddGoal: () => void;
}

export default function GoalsSection({ goals, accounts, onEdit, onDelete, onAddGoal }: GoalsSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  useEffect(() => {
    const saved = localStorage.getItem('goals_view_mode');
    if (saved === 'list') {
      setViewMode('list');
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('goals_view_mode', mode);
  };

  if (goals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center border border-gray-200">
        <p className="text-2xl font-bold text-gray-800 mb-2">No goals yet</p>
        <p className="text-gray-600 mb-6">
          Create your first goal like PC Fund, Emergency Fund, Running Shoes, or Steam Deck.
        </p>
        <button
          onClick={onAddGoal}
          className="bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition"
        >
          + Add Goal
        </button>
      </div>
    );
  }

  // Group goals by priority
  const goalsByPriority = {
    High: goals.filter(g => g.priority === 'High'),
    Medium: goals.filter(g => g.priority === 'Medium'),
    Low: goals.filter(g => g.priority === 'Low'),
  };

  const accountBalances = Object.fromEntries(accounts.map(a => [a.id, a.currentBalance]));
  const totalSavedAcrossGoals = goals.reduce((sum, g) => sum + (accountBalances[g.linkedAccountId] || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Goals</h2>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleViewModeChange('card')}
            className={`px-4 py-2 rounded font-semibold transition ${
              viewMode === 'card'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`px-4 py-2 rounded font-semibold transition ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>{goals.length} goal{goals.length !== 1 ? 's' : ''}</strong> •
          <strong className="ml-2">₱{totalSavedAcrossGoals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} saved</strong>
        </p>
      </div>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="space-y-8">
          {(['High', 'Medium', 'Low'] as const).map((priority) => {
            const priorityGoals = goalsByPriority[priority];
            if (priorityGoals.length === 0) return null;

            return (
              <div key={priority}>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Priority {priority === 'High' ? '1 / High' : priority === 'Medium' ? '2 / Medium' : '3 / Low'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {priorityGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Goal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Priority</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Progress</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">%</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Remaining</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Target Date</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {['High', 'Medium', 'Low'].map((priority) => {
                  const priorityGoals = goalsByPriority[priority as keyof typeof goalsByPriority];
                  return priorityGoals.map((goal) => (
                    <GoalListItem
                      key={goal.id}
                      goal={goal}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
