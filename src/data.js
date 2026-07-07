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

export const INITIAL_EXPENSES = [
  { id: 1, amount: 1500, desc: 'July Rent', category: 'rent', paidBy: 'u1', date: '2026-07-01' },
  { id: 2, amount: 65, desc: "Dinner at Mario's", category: 'dining', paidBy: 'u2', date: '2026-07-02' },
  { id: 3, amount: 120, desc: 'Weekly Groceries', category: 'groceries', paidBy: 'u1', date: '2026-07-03' },
  { id: 4, amount: 45, desc: 'Movie Tickets', category: 'entertainment', paidBy: 'u2', date: '2026-07-03' },
  { id: 5, amount: 1500, desc: 'June Rent', category: 'rent', paidBy: 'u1', date: '2026-06-01' },
  { id: 6, amount: 85, desc: 'Date Night', category: 'dining', paidBy: 'u2', date: '2026-06-15' }
];

export const INITIAL_TODOS = [
  { id: 1, text: 'Call landlord about AC', assignee: 'u1', completed: false, dueDate: '2026-07-03' },
  { id: 2, text: 'Plan weekend trip itinerary', assignee: 'shared', completed: false, dueDate: '2026-07-10' },
  { id: 3, text: 'Pay electric bill', assignee: 'u2', completed: true, dueDate: '2026-06-28' }
];

export const INITIAL_PLAN = {
  'July 2026': { income: 6000, targetSavings: 1500 },
  'June 2026': { income: 6000, targetSavings: 1000 }
};

export const INITIAL_SAVINGS_GOAL = { target: 3000, current: 850, name: 'Paris Trip 2027' };

// "2026-07-01" -> "July 2026"
export const monthLabel = (isoDate) => {
  const [year, month] = isoDate.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
