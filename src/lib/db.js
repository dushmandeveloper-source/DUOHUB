import { supabase } from './supabase';

// Row <-> app-object mapping (DB uses snake_case, app uses camelCase)

const rowToExpense = (r) => ({
  id: r.id,
  amount: Number(r.amount),
  desc: r.description,
  category: r.category,
  paidBy: r.paid_by,
  date: r.date,
});

const expenseToRow = (e) => ({
  id: e.id,
  amount: e.amount,
  description: e.desc,
  category: e.category,
  paid_by: e.paidBy,
  date: e.date,
});

const rowToTodo = (r) => ({
  id: r.id,
  text: r.text,
  assignee: r.assignee,
  completed: r.completed,
  dueDate: r.due_date || '',
});

const todoToRow = (t) => ({
  id: t.id,
  text: t.text,
  assignee: t.assignee,
  completed: t.completed,
  due_date: t.dueDate || null,
});

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

const rowToIncome = (r) => ({
  id: r.id,
  owner: r.owner,
  amount: Number(r.amount),
  source: r.source,
  date: r.date,
});

export async function fetchAll() {
  const [profiles, expenses, todos, plans, goals, budgets, incomes] = await Promise.all([
    supabase.from('profiles').select('*').then(unwrap),
    supabase.from('expenses').select('*').order('date', { ascending: false }).order('id', { ascending: false }).then(unwrap),
    supabase.from('todos').select('*').order('id', { ascending: false }).then(unwrap),
    supabase.from('monthly_plans').select('*').then(unwrap),
    supabase.from('savings_goals').select('*').then(unwrap),
    // tolerant: these tables may not exist until their migrations have run
    supabase.from('category_budgets').select('*').then(r => r.error ? [] : r.data),
    supabase.from('incomes').select('*').order('date', { ascending: false }).then(r => r.error ? [] : r.data),
  ]);

  return {
    profiles: Object.fromEntries(profiles.map(r => [r.id, { name: r.name, currency: r.currency || 'USD' }])),
    expenses: expenses.map(rowToExpense),
    todos: todos.map(rowToTodo),
    // plans grouped per person: { u1: { 'July 2026': {...} }, u2: {...} }
    plans: plans.reduce((acc, r) => {
      const owner = r.owner || 'u1';
      if (!acc[owner]) acc[owner] = {};
      acc[owner][r.month] = { income: Number(r.income), targetSavings: Number(r.target_savings) };
      return acc;
    }, { u1: {}, u2: {} }),
    goals: Object.fromEntries(goals.map(r => [r.owner, { name: r.name, target: Number(r.target), current: Number(r.current) }])),
    categoryBudgets: Object.fromEntries(budgets.map(r => [r.category, Number(r.amount)])),
    incomes: incomes.map(rowToIncome),
  };
}

export const addIncome = (income) =>
  supabase.from('incomes').insert({ id: income.id, owner: income.owner, amount: income.amount, source: income.source, date: income.date }).then(unwrap);

export const deleteIncome = (id) =>
  supabase.from('incomes').delete().eq('id', id).then(unwrap);

export const upsertCategoryBudget = (category, amount) =>
  supabase.from('category_budgets').upsert({ category, amount }).then(unwrap);

export const deleteCategoryBudget = (category) =>
  supabase.from('category_budgets').delete().eq('category', category).then(unwrap);

export const addExpense = (expense) =>
  supabase.from('expenses').insert(expenseToRow(expense)).then(unwrap);

export const addTodo = (todo) =>
  supabase.from('todos').insert(todoToRow(todo)).then(unwrap);

export const setTodoCompleted = (id, completed) =>
  supabase.from('todos').update({ completed }).eq('id', id).then(unwrap);

export const deleteExpense = (id) =>
  supabase.from('expenses').delete().eq('id', id).then(unwrap);

export const deleteTodo = (id) =>
  supabase.from('todos').delete().eq('id', id).then(unwrap);

export const deleteExpensesBetween = (startDate, endDate) =>
  supabase.from('expenses').delete().gte('date', startDate).lte('date', endDate).then(unwrap);

export const deleteTodosBetween = (startDate, endDate) =>
  supabase.from('todos').delete().gte('due_date', startDate).lte('due_date', endDate).then(unwrap);

export const upsertPlan = (owner, month, income, targetSavings) =>
  supabase.from('monthly_plans').upsert({ month, owner, income, target_savings: targetSavings }, { onConflict: 'month,owner' }).then(unwrap);

export const updateGoal = (owner, goal) =>
  supabase.from('savings_goals').upsert({ owner, name: goal.name, target: goal.target, current: goal.current }).then(unwrap);

export const updateProfiles = (u1, u2) =>
  Promise.all([
    supabase.from('profiles').upsert({ id: 'u1', name: u1.name, currency: u1.currency }).then(unwrap),
    supabase.from('profiles').upsert({ id: 'u2', name: u2.name, currency: u2.currency }).then(unwrap),
  ]);

// Fires callback on any change made from another device.
export function subscribeToChanges(onChange) {
  return supabase
    .channel('duohub-sync')
    .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
    .subscribe();
}

export function unsubscribe(channel) {
  supabase.removeChannel(channel);
}
