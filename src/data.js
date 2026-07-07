import { Home as HomeIcon, Zap, ShoppingBag, Coffee, Car, Target } from 'lucide-react';

export const INITIAL_USERS = [
  { id: 'u1', name: 'Dushman', color: 'bg-blue-500', lightColor: 'bg-blue-100', text: 'text-blue-500' },
  { id: 'u2', name: 'Hasini', color: 'bg-rose-500', lightColor: 'bg-rose-100', text: 'text-rose-500' }
];

export const CATEGORIES = [
  { id: 'rent', name: 'Rent/Mortgage', icon: HomeIcon, type: 'Fixed' },
  { id: 'utilities', name: 'Utilities', icon: Zap, type: 'Fixed' },
  { id: 'groceries', name: 'Groceries', icon: ShoppingBag, type: 'Variable' },
  { id: 'dining', name: 'Dining Out', icon: Coffee, type: 'Variable' },
  { id: 'transport', name: 'Transport', icon: Car, type: 'Variable' },
  { id: 'entertainment', name: 'Entertainment', icon: Target, type: 'Variable' }
];

// All real data lives in Supabase — these are just empty starting points
// used before the first sync (or when the database is not configured).
export const INITIAL_EXPENSES = [];

export const INITIAL_TODOS = [];

export const INITIAL_PLAN = {};

export const INITIAL_SAVINGS_GOAL = { target: 0, current: 0, name: 'Set your savings goal' };

// "2026-07-01" -> "July 2026"
export const monthLabel = (isoDate) => {
  const [year, month] = isoDate.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
