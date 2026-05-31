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
      <div className="empty-state p-12">
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No goals yet</p>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create your first goal like PC Fund, Emergency Fund, Running Shoes, or Steam Deck.
        </p>
        <button
          onClick={onAddGoal}
          className="button-primary"
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
      <div className="section-title">
        <h2 className="heading-section">Goals</h2>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/60 rounded-lg p-1">
          <button
            onClick={() => handleViewModeChange('card')}
            className={`px-4 py-2 rounded-md font-medium transition ${
              viewMode === 'card'
                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={`px-4 py-2 rounded-md font-medium transition ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="section-info p-4 rounded-xl">
        <p className="section-info-text text-sm">
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
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
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
        <div className="table-wrapper">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="table-header-cell">Goal</th>
                  <th className="table-header-cell">Priority</th>
                  <th className="table-header-cell text-right">Progress</th>
                  <th className="table-header-cell text-right">%</th>
                  <th className="table-header-cell text-right">Remaining</th>
                  <th className="table-header-cell text-center">Target Date</th>
                  <th className="table-header-cell text-center">Actions</th>
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
