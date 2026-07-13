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

const rowToTodo = (r) => {
  const status = r.status || (r.completed ? 'done' : 'pending');
  return {
    id: r.id,
    text: r.text,
    assignee: r.assignee,
    completed: status === 'done',
    status,
    dueDate: r.due_date || '',
    images: Array.isArray(r.images) ? r.images : [],
  };
};

const todoToRow = (t) => ({
  id: t.id,
  text: t.text,
  assignee: t.assignee,
  completed: t.completed,
  status: t.status || (t.completed ? 'done' : 'pending'),
  due_date: t.dueDate || null,
  images: t.images || [],
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

const rowToNote = (r) => ({
  id: r.id,
  title: r.title,
  content: r.content,
  owner: r.owner,
  images: Array.isArray(r.images) ? r.images : [],
  color: r.color || 'yellow',
  drawing: r.drawing || null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const noteToRow = (n) => ({
  id: n.id,
  title: n.title,
  content: n.content,
  owner: n.owner,
  images: n.images || [],
  color: n.color || 'yellow',
  drawing: n.drawing || null,
  created_at: n.createdAt,
  updated_at: n.updatedAt,
});

export async function fetchAll() {
  const [profiles, expenses, todos, plans, goals, budgets, incomes, notes] = await Promise.all([
    supabase.from('profiles').select('*').then(unwrap),
    supabase.from('expenses').select('*').order('date', { ascending: false }).order('id', { ascending: false }).then(unwrap),
    supabase.from('todos').select('*').order('id', { ascending: false }).then(unwrap),
    supabase.from('monthly_plans').select('*').then(unwrap),
    supabase.from('savings_goals').select('*').then(unwrap),
    // tolerant: these tables may not exist until their migrations have run
    supabase.from('category_budgets').select('*').then(r => r.error ? [] : r.data),
    supabase.from('incomes').select('*').order('date', { ascending: false }).then(r => r.error ? [] : r.data),
    supabase.from('notes').select('*').order('updated_at', { ascending: false }).then(r => r.error ? [] : r.data),
  ]);

  return {
    profiles: Object.fromEntries(profiles.map(r => [r.id, {
      name: r.name,
      currency: r.currency || 'USD',
      timezone: r.timezone || (r.id === 'u2' ? 'Asia/Shanghai' : 'Asia/Colombo'),
      hiddenCards: Array.isArray(r.hidden_cards) ? r.hidden_cards : [],
      shareLocation: !!r.share_location,
      lat: r.lat != null ? Number(r.lat) : null,
      lng: r.lng != null ? Number(r.lng) : null,
      locationAccuracy: r.location_accuracy != null ? Number(r.location_accuracy) : null,
      locationUpdatedAt: r.location_updated_at || null,
    }])),
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
    // budgets grouped per person: { u1: { groceries: 100 }, u2: { groceries: 50 } }
    categoryBudgets: budgets.reduce((acc, r) => {
      const owner = r.owner || 'u2';
      if (!acc[owner]) acc[owner] = {};
      acc[owner][r.category] = Number(r.amount);
      return acc;
    }, { u1: {}, u2: {} }),
    incomes: incomes.map(rowToIncome),
    notes: notes.map(rowToNote),
  };
}

export const addIncome = (income) =>
  supabase.from('incomes').insert({ id: income.id, owner: income.owner, amount: income.amount, source: income.source, date: income.date }).then(unwrap);

export const deleteIncome = (id) =>
  supabase.from('incomes').delete().eq('id', id).then(unwrap);

export const upsertCategoryBudget = (owner, category, amount) =>
  supabase.from('category_budgets').upsert({ owner, category, amount }, { onConflict: 'category,owner' }).then(unwrap);

export const deleteCategoryBudget = (owner, category) =>
  supabase.from('category_budgets').delete().eq('owner', owner).eq('category', category).then(unwrap);

export const addExpense = (expense) =>
  supabase.from('expenses').insert(expenseToRow(expense)).then(unwrap);

export const addTodo = (todo) =>
  supabase.from('todos').insert(todoToRow(todo)).then(unwrap);

export const setTodoCompleted = (id, completed) =>
  supabase.from('todos').update({ completed }).eq('id', id).then(unwrap);

export const updateTodoStatus = (id, status) =>
  supabase.from('todos').update({ status, completed: status === 'done' }).eq('id', id).then(unwrap);

export const updateTodo = (id, updates) =>
  supabase.from('todos').update({
    text: updates.text,
    assignee: updates.assignee,
    due_date: updates.dueDate || null,
    images: updates.images || [],
  }).eq('id', id).then(unwrap);

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
    supabase.from('profiles').upsert({ id: 'u1', name: u1.name, currency: u1.currency, timezone: u1.timezone }).then(unwrap),
    supabase.from('profiles').upsert({ id: 'u2', name: u2.name, currency: u2.currency, timezone: u2.timezone }).then(unwrap),
  ]);

export const updateHiddenCards = (userId, hiddenCards) =>
  supabase.from('profiles').update({ hidden_cards: hiddenCards }).eq('id', userId).then(unwrap);

export const updateLocation = (userId, { lat, lng, accuracy }) =>
  supabase.from('profiles').update({
    lat, lng, location_accuracy: accuracy, location_updated_at: new Date().toISOString(),
  }).eq('id', userId).then(unwrap);

// Disabling clears the last known point too — no location should linger once sharing is off.
export const updateShareLocation = (userId, enabled) =>
  supabase.from('profiles').update(
    enabled
      ? { share_location: true }
      : { share_location: false, lat: null, lng: null, location_accuracy: null, location_updated_at: null }
  ).eq('id', userId).then(unwrap);

export const addNote = (note) =>
  supabase.from('notes').insert(noteToRow(note)).then(unwrap);

export const updateNote = (id, updates) =>
  supabase.from('notes').update({
    title: updates.title,
    content: updates.content,
    owner: updates.owner,
    images: updates.images,
    color: updates.color,
    drawing: updates.drawing,
    updated_at: new Date().toISOString(),
  }).eq('id', id).then(unwrap);

export const deleteNote = (id) =>
  supabase.from('notes').delete().eq('id', id).then(unwrap);

export async function uploadNoteImage(file) {
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
  const { error } = await supabase.storage.from('note-images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('note-images').getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort: a failed delete just leaves an orphan file in storage.
export async function deleteNoteImage(url) {
  try {
    const marker = '/note-images/';
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length));
    const { error } = await supabase.storage.from('note-images').remove([path]);
    if (error) console.error('Failed to delete note image:', error);
  } catch (err) {
    console.error('Failed to delete note image:', err);
  }
}

// Todo image attachments reuse the same `note-images` bucket (same app,
// same access pattern, no need for per-feature storage separation).
export const uploadTodoImage = uploadNoteImage;
export const deleteTodoImage = deleteNoteImage;

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
