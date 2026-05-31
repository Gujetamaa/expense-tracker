import { Goal, GoalType, GoalPriority } from '@/types';

export const GOAL_TYPES: GoalType[] = ['Emergency Fund', 'PC Build', 'Gadget', 'Fitness', 'Travel', 'Investment', 'MP2', 'General Savings', 'Other'];

export const GOAL_TYPE_EMOJIS: Record<GoalType, string> = {
  'Emergency Fund': '🆘',
  'PC Build': '🖥️',
  'Gadget': '📱',
  'Fitness': '💪',
  'Travel': '✈️',
  'Investment': '📈',
  'MP2': '🏦',
  'General Savings': '💰',
  'Other': '🎯',
};

export const GOAL_COLORS: Record<GoalType, { bg: string; text: string; border: string }> = {
  'Emergency Fund': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-900 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700/40' },
  'PC Build': { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-900 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700/40' },
  'Gadget': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-900 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700/40' },
  'Fitness': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-900 dark:text-green-300', border: 'border-green-200 dark:border-green-700/40' },
  'Travel': { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-900 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-700/40' },
  'Investment': { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-900 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-700/40' },
  'MP2': { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-900 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-700/40' },
  'General Savings': { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-900 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700/40' },
  'Other': { bg: 'bg-slate-50 dark:bg-slate-900/20', text: 'text-slate-900 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700/40' },
};

export function createGoal(
  name: string,
  goalType: GoalType,
  targetAmount: number,
  linkedAccountId: string,
  priority: GoalPriority,
  targetDate: string,
  notes: string = ''
): Goal {
  return {
    id: Date.now().toString(),
    name,
    goalType,
    targetAmount,
    linkedAccountId,
    priority,
    targetDate,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function calculateGoalProgress(linkedAccountBalance: number, targetAmount: number): number {
  return Math.min((linkedAccountBalance / targetAmount) * 100, 100);
}

export function getRemainingAmount(linkedAccountBalance: number, targetAmount: number): number {
  return Math.max(targetAmount - linkedAccountBalance, 0);
}

export function getPriorityOrder(priority: GoalPriority): number {
  const order = { High: 0, Medium: 1, Low: 2 };
  return order[priority];
}

export function sortGoalsByPriority(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority));
}

export function getTopActiveGoals(goals: Goal[], accountBalances: Record<string, number>, limit: number = 3): Goal[] {
  return sortGoalsByPriority(
    goals.filter(g => {
      const balance = accountBalances[g.linkedAccountId] || 0;
      return balance < g.targetAmount;
    })
  ).slice(0, limit);
}

export function estimateMonthsToComplete(linkedAccountBalance: number, targetAmount: number, monthlyContribution: number): number | null {
  if (monthlyContribution <= 0) return null;
  const remaining = getRemainingAmount(linkedAccountBalance, targetAmount);
  return Math.ceil(remaining / monthlyContribution);
}
