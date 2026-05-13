import { Goal, GoalType, GoalPriority } from '@/types';

export const GOAL_TYPES: GoalType[] = ['Emergency Fund', 'PC Build', 'Gadget', 'Fitness', 'Travel', 'Investment', 'MP2', 'General Savings', 'Other'];

export const GOAL_TYPE_EMOJIS: Record<GoalType, string> = {
  'Emergency Fund': '🛟',
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
  'Emergency Fund': { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  'PC Build': { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200' },
  'Gadget': { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200' },
  'Fitness': { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200' },
  'Travel': { bg: 'bg-cyan-50', text: 'text-cyan-900', border: 'border-cyan-200' },
  'Investment': { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200' },
  'MP2': { bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200' },
  'General Savings': { bg: 'bg-gray-50', text: 'text-gray-900', border: 'border-gray-200' },
  'Other': { bg: 'bg-slate-50', text: 'text-slate-900', border: 'border-slate-200' },
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
