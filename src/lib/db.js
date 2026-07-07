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

export async function fetchAll() {
  const [profiles, expenses, todos, plans, goal] = await Promise.all([
    supabase.from('profiles').select('*').then(unwrap),
    supabase.from('expenses').select('*').order('date', { ascending: false }).order('id', { ascending: false }).then(unwrap),
    supabase.from('todos').select('*').order('id', { ascending: false }).then(unwrap),
    supabase.from('monthly_plans').select('*').then(unwrap),
    supabase.from('savings_goal').select('*').eq('id', 1).maybeSingle().then(unwrap),
  ]);

  return {
    names: Object.fromEntries(profiles.map(r => [r.id, r.name])),
    expenses: expenses.map(rowToExpense),
    todos: todos.map(rowToTodo),
    plans: Object.fromEntries(plans.map(r => [r.month, { income: Number(r.income), targetSavings: Number(r.target_savings) }])),
    goal: goal ? { name: goal.name, target: Number(goal.target), current: Number(goal.current) } : null,
  };
}

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

export const upsertPlan = (month, income, targetSavings) =>
  supabase.from('monthly_plans').upsert({ month, income, target_savings: targetSavings }).then(unwrap);

export const updateGoal = (goal) =>
  supabase.from('savings_goal').upsert({ id: 1, name: goal.name, target: goal.target, current: goal.current }).then(unwrap);

export const updateProfileNames = (u1Name, u2Name) =>
  Promise.all([
    supabase.from('profiles').upsert({ id: 'u1', name: u1Name }).then(unwrap),
    supabase.from('profiles').upsert({ id: 'u2', name: u2Name }).then(unwrap),
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
