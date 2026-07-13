import { useState, useMemo, useEffect, useCallback } from 'react';
import { Home, CreditCard, CheckSquare, PieChart as PieChartIcon, User, WifiOff, RefreshCw, Sun, Moon } from 'lucide-react';
import { INITIAL_USERS, CATEGORIES, INITIAL_EXPENSES, INITIAL_TODOS, INITIAL_PLAN, INITIAL_GOAL, monthLabel } from './data';
import { useLocalStorage } from './hooks/useLocalStorage';
import { showSystemNotification, getNotifyTime, enableBackgroundCheck } from './notifications';
import { isCloudEnabled } from './lib/supabase';
import { onUpdateAvailable, applyUpdate } from './updater';
import * as db from './lib/db';
import { NavItem, MobileNavItem } from './components/Nav';
import Notification from './components/Notification';
import UIHost from './components/UIHost';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Analytics from './components/Analytics';
import Todos from './components/Todos';
import Profile from './components/Profile';

const logSyncError = (err) => console.error('Cloud sync failed:', err);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  // Only the "who is using this device" toggle is remembered locally —
  // all data lives in the database and is fetched fresh on every load.
  const [currentUserId, setCurrentUserId] = useLocalStorage('duohub:v2:currentUserId', 'u1');
  const [theme, setTheme] = useLocalStorage('duohub:theme', 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const [users, setUsers] = useState(INITIAL_USERS);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [todos, setTodos] = useState(INITIAL_TODOS);
  const [savingsGoals, setSavingsGoals] = useState({ u1: INITIAL_GOAL, u2: INITIAL_GOAL });
  const [incomes, setIncomes] = useState([]);
  const [monthlyPlans, setMonthlyPlans] = useState({ u1: INITIAL_PLAN, u2: INITIAL_PLAN });
  const [categoryBudgets, setCategoryBudgets] = useState({ u1: {}, u2: {} });
  const [notification, setNotification] = useState(null);
  const [cloudStatus, setCloudStatus] = useState(isCloudEnabled ? 'connecting' : 'local');
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => onUpdateAvailable(() => setUpdateReady(true)), []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];
  const currentGoal = savingsGoals[currentUser.id] || INITIAL_GOAL;

  // Per-person views: each person sees their own expenses, plans, and tasks
  // (tasks assigned to them or marked shared).
  const myExpenses = useMemo(() => expenses.filter(e => e.paidBy === currentUser.id), [expenses, currentUser.id]);
  const myIncomes = useMemo(() => incomes.filter(i => i.owner === currentUser.id), [incomes, currentUser.id]);
  const myTodos = useMemo(() => todos.filter(t => t.assignee === currentUser.id || t.assignee === 'shared'), [todos, currentUser.id]);
  const myPlans = monthlyPlans[currentUser.id] || {};

  // Tell the service worker which person uses this device, so background
  // due-task alerts only fire for their own and shared tasks.
  useEffect(() => {
    if (!('caches' in window)) return;
    caches.open('duohub-config')
      .then(cache => cache.put('/device-user', new Response(JSON.stringify({ userId: currentUserId }), { headers: { 'Content-Type': 'application/json' } })))
      .catch(() => {});
  }, [currentUserId]);

  // --- Cloud sync: initial load + realtime updates from the other device ---
  const loadFromCloud = useCallback(async () => {
    setCloudStatus('connecting');
    try {
      const data = await db.fetchAll();
      setUsers(prev => prev.map(u => ({ ...u, ...(data.profiles[u.id] || {}) })));
      setExpenses(data.expenses);
      setTodos(data.todos);
      setMonthlyPlans(data.plans);
      setSavingsGoals(prev => ({ ...prev, ...data.goals }));
      setCategoryBudgets(data.categoryBudgets);
      setIncomes(data.incomes);
      setCloudStatus('online');
    } catch (err) {
      logSyncError(err);
      setCloudStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isCloudEnabled) return;
    loadFromCloud();
    const channel = db.subscribeToChanges(() => loadFromCloud());
    return () => db.unsubscribe(channel);
  }, [loadFromCloud]);

  // Register the background due-task check once notifications are allowed
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      enableBackgroundCheck();
    }
  }, []);

  // Generate available months including +/- 3 months from today for planning
  const availableMonths = useMemo(() => {
    const months = [];
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 3);

    for (let i = 0; i < 7; i++) {
      months.push(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      d.setMonth(d.getMonth() + 1);
    }

    expenses.forEach(exp => {
      const dateStr = monthLabel(exp.date);
      if (!months.includes(dateStr)) months.push(dateStr);
    });

    return [...new Set(months)].sort((a, b) => new Date(b) - new Date(a));
  }, [expenses]);

  const currentMonthStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState(currentMonthStr);

  // Due-task check: in-app banner always; device notification once per day,
  // only after the check time configured in Settings.
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      // Only this device's person: their own tasks + shared ones
      const dueTasks = todos.filter(t =>
        !t.completed && t.dueDate && t.dueDate <= today &&
        (t.assignee === currentUser.id || t.assignee === 'shared')
      );

      if (dueTasks.length === 0) {
        setNotification(null);
        return;
      }

      const taskNames = dueTasks.map(t => t.text).join(', ');
      setNotification({
        title: 'Tasks Need Attention',
        message: `Due/Overdue: ${taskNames}`,
        type: 'warning'
      });

      const pad = (n) => String(n).padStart(2, '0');
      const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const stampKey = 'duohub:lastDueNotifyDate';
      if (nowTime >= getNotifyTime() && localStorage.getItem(stampKey) !== today) {
        showSystemNotification('DuoHub — tasks need attention', `Due/Overdue: ${taskNames}`, 'duohub-due')
          .then(shown => { if (shown) localStorage.setItem(stampKey, today); });
      }
    };

    check();
    const interval = setInterval(check, 5 * 60 * 1000); // re-check every 5 minutes while open
    return () => clearInterval(interval);
  }, [todos, currentUser.id]);

  const toggleUser = () => {
    setCurrentUserId(prev => (prev === 'u1' ? 'u2' : 'u1'));
  };

  // --- Mutations: update local state, then write through to the database ---

  const addExpense = (newExpense) => {
    const expense = { ...newExpense, id: Date.now(), paidBy: currentUser.id };
    setExpenses(prev => [expense, ...prev]);
    if (isCloudEnabled) db.addExpense(expense).catch(logSyncError);
  };

  const addIncome = (newIncome) => {
    const income = { ...newIncome, id: Date.now(), owner: currentUser.id };
    setIncomes(prev => [income, ...prev]);
    if (isCloudEnabled) db.addIncome(income).catch(logSyncError);
  };

  const deleteIncome = (id) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    if (isCloudEnabled) db.deleteIncome(id).catch(logSyncError);
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (isCloudEnabled) db.deleteExpense(id).catch(logSyncError);
  };

  const toggleTodo = (id) => {
    const target = todos.find(t => t.id === id);
    if (!target) return;
    const completed = !target.completed;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
    if (isCloudEnabled) db.setTodoCompleted(id, completed).catch(logSyncError);
  };

  const addTodo = (text, assignee, dueDate) => {
    if (!text.trim()) return;
    const todo = { id: Date.now(), text, assignee, completed: false, dueDate };
    setTodos(prev => [todo, ...prev]);
    if (isCloudEnabled) db.addTodo(todo).catch(logSyncError);
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
    if (isCloudEnabled) db.deleteTodo(id).catch(logSyncError);
  };

  const editTodo = (id, updates) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    if (isCloudEnabled) db.updateTodo(id, updates).catch(logSyncError);
  };

  // Removes all expenses and due-dated tasks within the date range (inclusive)
  const resetRecords = (startDate, endDate) => {
    setExpenses(prev => prev.filter(e => e.date < startDate || e.date > endDate));
    setTodos(prev => prev.filter(t => !t.dueDate || t.dueDate < startDate || t.dueDate > endDate));
    if (isCloudEnabled) {
      db.deleteExpensesBetween(startDate, endDate).catch(logSyncError);
      db.deleteTodosBetween(startDate, endDate).catch(logSyncError);
    }
  };

  const addSavings = (amount) => {
    if (!Number.isFinite(amount)) return;
    const next = { ...currentGoal, current: currentGoal.current + amount };
    setSavingsGoals(prev => ({ ...prev, [currentUser.id]: next }));
    if (isCloudEnabled) db.updateGoal(currentUser.id, next).catch(logSyncError);
  };

  const updateSavingsGoal = (name, target) => {
    const next = { ...currentGoal, name, target: parseFloat(target) || 0 };
    setSavingsGoals(prev => ({ ...prev, [currentUser.id]: next }));
    if (isCloudEnabled) db.updateGoal(currentUser.id, next).catch(logSyncError);
  };

  const updatePlan = (month, income, savings) => {
    const parsedIncome = parseFloat(income) || 0;
    const parsedSavings = parseFloat(savings) || 0;
    setMonthlyPlans(prev => ({
      ...prev,
      [currentUser.id]: { ...(prev[currentUser.id] || {}), [month]: { income: parsedIncome, targetSavings: parsedSavings } }
    }));
    if (isCloudEnabled) db.upsertPlan(currentUser.id, month, parsedIncome, parsedSavings).catch(logSyncError);
  };

  const setCategoryBudget = (category, amount) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const owner = currentUser.id;
    setCategoryBudgets(prev => ({ ...prev, [owner]: { ...prev[owner], [category]: amount } }));
    if (isCloudEnabled) db.upsertCategoryBudget(owner, category, amount).catch(logSyncError);
  };

  const removeCategoryBudget = (category) => {
    const owner = currentUser.id;
    setCategoryBudgets(prev => {
      const next = { ...prev[owner] };
      delete next[category];
      return { ...prev, [owner]: next };
    });
    if (isCloudEnabled) db.deleteCategoryBudget(owner, category).catch(logSyncError);
  };

  const myCategoryBudgets = categoryBudgets[currentUser.id] || {};

  const updateProfile = (u1, u2) => {
    setUsers(prev => [
      { ...prev[0], ...u1 },
      { ...prev[1], ...u2 }
    ]);
    if (isCloudEnabled) db.updateProfiles(u1, u2).catch(logSyncError);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard expenses={myExpenses} savingsGoal={currentGoal} currentUser={currentUser} onAddSavings={addSavings} onUpdateGoal={updateSavingsGoal} onAddExpense={addExpense} categories={CATEGORIES} monthlyPlans={myPlans} selectedMonth={selectedDashboardMonth} setSelectedMonth={setSelectedDashboardMonth} availableMonths={availableMonths} todos={myTodos} onToggleTodo={toggleTodo} categoryBudgets={myCategoryBudgets} incomes={myIncomes} onAddIncome={addIncome} onDeleteIncome={deleteIncome} />;
      case 'expenses': return <Expenses expenses={expenses} users={users} categories={CATEGORIES} availableMonths={availableMonths} onAdd={addExpense} onDelete={deleteExpense} currentUser={currentUser} />;
      case 'analytics': return <Analytics expenses={myExpenses} categories={CATEGORIES} currency={currentUser.currency} categoryBudgets={myCategoryBudgets} onSetBudget={setCategoryBudget} onRemoveBudget={removeCategoryBudget} />;
      case 'todos': return <Todos todos={todos} onToggle={toggleTodo} onAdd={addTodo} onDelete={deleteTodo} onEdit={editTodo} users={users} currentUser={currentUser} availableMonths={availableMonths} />;
      case 'profile': return <Profile users={users} currentUser={currentUser} onUpdateProfile={updateProfile} monthlyPlans={myPlans} onUpdatePlan={updatePlan} availableMonths={availableMonths} currentMonthStr={currentMonthStr} expenses={expenses} todos={todos} onReset={resetRecords} incomes={myIncomes} onAddIncome={addIncome} onDeleteIncome={deleteIncome} />;
      default: return null;
    }
  };

  const syncIndicator = {
    local: { color: 'bg-gray-300', label: 'Local only — database not configured' },
    connecting: { color: 'bg-amber-400', label: 'Connecting to database…' },
    online: { color: 'bg-green-500', label: 'Synced with database' },
    error: { color: 'bg-red-500', label: 'Database connection failed — working locally' },
  }[cloudStatus];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800 relative overflow-x-hidden">

      <UIHost />
      <Notification notification={notification} onClose={() => setNotification(null)} />

      {updateReady && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[90] bg-indigo-600 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 w-[92%] max-w-md">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">New version available</p>
            <p className="text-xs text-indigo-200">Tap update to get the latest features.</p>
          </div>
          <button onClick={applyUpdate} className="bg-white text-indigo-700 font-bold text-sm px-5 py-2 rounded-xl hover:bg-indigo-50 transition-colors shrink-0 flex items-center gap-1.5">
            <RefreshCw size={14} /> Update
          </button>
        </div>
      )}

      {/* SIDEBAR (Desktop) */}
      <div className="bg-white border-b md:border-r border-gray-200 w-full md:w-64 md:min-h-screen flex flex-row md:flex-col justify-between md:justify-start md:gap-6 items-center md:items-start p-4 md:p-6 sticky top-0 z-40 shadow-sm md:shadow-none shrink-0 h-16 md:h-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md shrink-0">
            D
          </div>
          <span className="text-lg md:text-xl font-extrabold tracking-tight">DuoHub</span>
          <span className={`w-2 h-2 rounded-full ${syncIndicator.color}`} title={syncIndicator.label}></span>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-1"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex items-center bg-gray-100 rounded-full p-1 cursor-pointer hover:bg-gray-200 transition-colors shrink-0" onClick={toggleUser}>
          <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${currentUser.id === 'u1' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
            {users[0].name}
          </div>
          <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${currentUser.id === 'u2' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500'}`}>
            {users[1].name}
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-2 w-full mt-2">
          <NavItem icon={<Home size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} color={currentUser.text} />
          <NavItem icon={<CreditCard size={20}/>} label="Expenses" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} color={currentUser.text} />
          <NavItem icon={<CheckSquare size={20}/>} label="To-Dos" active={activeTab === 'todos'} onClick={() => setActiveTab('todos')} color={currentUser.text} />
          <NavItem icon={<PieChartIcon size={20}/>} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} color={currentUser.text} />
          <NavItem icon={<User size={20}/>} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} color={currentUser.text} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto h-[calc(100vh-4rem)] md:h-screen">
        <div className="p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 md:pb-8">
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Hey <span className={currentUser.text}>{currentUser.name}</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Here is what's happening today.</p>
          </div>
        </header>

        {cloudStatus === 'connecting' ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium">Loading your data from the database…</p>
          </div>
        ) : cloudStatus === 'error' ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-14 h-14 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-4">
              <WifiOff size={28} />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Can't reach the database</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">Check your internet connection. Your data is safe — nothing loads until the connection is back.</p>
            <button onClick={loadFromCloud} className="bg-gray-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-800 transition-colors shadow-sm text-sm flex items-center gap-2">
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : renderTab()}
        </div>
      </div>

      {/* MOBILE NAV (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavItem icon={<Home size={22}/>} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} color={currentUser.text} />
        <MobileNavItem icon={<CreditCard size={22}/>} label="Expenses" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} color={currentUser.text} />
        <MobileNavItem icon={<CheckSquare size={22}/>} label="Tasks" active={activeTab === 'todos'} onClick={() => setActiveTab('todos')} color={currentUser.text} />
        <MobileNavItem icon={<PieChartIcon size={22}/>} label="Insights" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} color={currentUser.text} />
        <MobileNavItem icon={<User size={22}/>} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} color={currentUser.text} />
      </div>
    </div>
  );
}
