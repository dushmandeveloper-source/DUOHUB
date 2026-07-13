import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Home, CreditCard, CheckSquare, NotebookPen, PieChart as PieChartIcon, User, WifiOff, RefreshCw, Sun, Moon, MapPin, Heart, Mail, MessageCircle } from 'lucide-react';
import { INITIAL_USERS, CATEGORIES, INITIAL_EXPENSES, INITIAL_TODOS, INITIAL_PLAN, INITIAL_GOAL, monthLabel } from './data';
import { useLocalStorage } from './hooks/useLocalStorage';
import { usePresence } from './hooks/usePresence';
import { showSystemNotification, getNotifyTime, enableBackgroundCheck } from './notifications';
import { isCloudEnabled } from './lib/supabase';
import { onUpdateAvailable, applyUpdate } from './updater';
import { getCurrentPosition, startWatch, haversineKm } from './lib/geo';
import { toast } from './ui';
import * as db from './lib/db';
import { NavItem, MobileNavItem } from './components/Nav';
import Notification from './components/Notification';
import UIHost from './components/UIHost';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Analytics from './components/Analytics';
import Todos from './components/Todos';
import Notes from './components/Notes';
import Us from './components/Us';
import Chat from './components/Chat';
import Profile from './components/Profile';
import LocationMap from './components/LocationMap';
import ThinkingOfYouModal from './components/ThinkingOfYouModal';

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
  const [notes, setNotes] = useState([]);
  const [pings, setPings] = useState([]);
  const [bucketList, setBucketList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [cloudStatus, setCloudStatus] = useState(isCloudEnabled ? 'connecting' : 'local');
  const [updateReady, setUpdateReady] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [liveTracking, setLiveTracking] = useState(false);
  const [showThinkingOfYou, setShowThinkingOfYou] = useState(false);
  const dismissedDueRef = useRef(new Set());

  useEffect(() => onUpdateAvailable(() => setUpdateReady(true)), []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];
  const partnerUser = users.find(u => u.id !== currentUser.id) || users[1];
  const currentGoal = savingsGoals[currentUser.id] || INITIAL_GOAL;

  const partnerOnline = usePresence(
    currentUserId,
    partnerUser.id,
    useCallback(() => toast(`${partnerUser.name} just opened DuoHub 💚`), [partnerUser.name])
  );

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
  // silent = realtime refresh in the background — don't flash the
  // "connecting" indicator for those, only for the initial load.
  const loadFromCloud = useCallback(async (silent = false) => {
    if (!silent) setCloudStatus('connecting');
    try {
      const data = await db.fetchAll();
      setUsers(prev => prev.map(u => ({ ...u, ...(data.profiles[u.id] || {}) })));
      setExpenses(data.expenses);
      setTodos(data.todos);
      setMonthlyPlans(data.plans);
      setSavingsGoals(prev => ({ ...prev, ...data.goals }));
      setCategoryBudgets(data.categoryBudgets);
      setIncomes(data.incomes);
      setNotes(data.notes);
      setPings(data.pings);
      setBucketList(data.bucketList);
      setMessages(data.messages);
      setCloudStatus('online');
    } catch (err) {
      logSyncError(err);
      setCloudStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isCloudEnabled) return;
    loadFromCloud();
    const channel = db.subscribeToChanges(() => loadFromCloud(true));
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
      // Only this device's person: their own tasks + shared ones.
      // Tasks parked as "waiting" are intentionally excluded — that status
      // is the user's way of saying "don't nag me about this."
      const dueTasks = todos.filter(t =>
        !t.completed && t.status !== 'waiting' && t.dueDate && t.dueDate <= today &&
        (t.assignee === currentUser.id || t.assignee === 'shared')
      );

      if (dueTasks.length === 0) {
        setNotifications([]);
        return;
      }

      // Banners the user already swiped away stay away, even when a
      // background sync re-runs this check with a fresh todos array.
      setNotifications(dueTasks
        .filter(t => !dismissedDueRef.current.has(t.id))
        .map(t => ({
          id: t.id,
          title: 'Task Needs Attention',
          message: `Due/Overdue: ${t.text}`,
        })));

      const taskNames = dueTasks.map(t => t.text).join(', ');
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

  const setTodoStatus = (id, status) => {
    const target = todos.find(t => t.id === id);
    if (!target) return;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, status, completed: status === 'done' } : t));
    if (isCloudEnabled) db.updateTodoStatus(id, status).catch(logSyncError);
  };

  const addTodo = (text, assignee, dueDate, images = []) => {
    if (!text.trim()) return;
    const todo = { id: Date.now(), text, assignee, completed: false, status: 'pending', dueDate, images };
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

  const addNote = (note) => {
    const now = new Date().toISOString();
    const newNote = { ...note, id: Date.now(), createdAt: now, updatedAt: now };
    setNotes(prev => [newNote, ...prev]);
    if (isCloudEnabled) db.addNote(newNote).catch(logSyncError);
  };

  const editNote = (id, updates) => {
    const updatedAt = new Date().toISOString();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt } : n));
    if (isCloudEnabled) db.updateNote(id, updates).catch(logSyncError);
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (isCloudEnabled) db.deleteNote(id).catch(logSyncError);
  };

  const sendPing = ({ emoji, message }) => {
    const ping = { id: Date.now(), fromUser: currentUser.id, toUser: partnerUser.id, emoji, message, seen: false, createdAt: new Date().toISOString() };
    setPings(prev => [ping, ...prev]);
    if (isCloudEnabled) db.addPing(ping).catch(logSyncError);
    toast('Sent 💌');
  };

  const markPingsSeen = (ids) => {
    setPings(prev => prev.map(p => ids.includes(p.id) ? { ...p, seen: true } : p));
    if (isCloudEnabled) db.markPingsSeen(ids).catch(logSyncError);
  };

  // Notify on newly-arrived unseen pings addressed to me (realtime from the
  // partner's device) — but not for pings that were already sitting there on
  // the initial load, which get a dashboard card instead of a notification spam.
  const [pingsLoaded, setPingsLoaded] = useState(false);
  useEffect(() => {
    if (!pingsLoaded) {
      setPingsLoaded(true);
      return;
    }
    const incoming = pings.filter(p => p.toUser === currentUser.id && !p.seen && p.fromUser === partnerUser.id);
    const newest = incoming[0];
    if (newest && Date.now() - new Date(newest.createdAt).getTime() < 15000) {
      showSystemNotification(`💌 from ${partnerUser.name}`, newest.emoji + (newest.message ? ' ' + newest.message : ''));
      toast(`${partnerUser.name} is thinking of you ${newest.emoji}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pings]);

  const sendMessage = ({ kind, body, mediaUrl, replyTo }) => {
    const msg = { id: Date.now(), sender: currentUser.id, kind, body: body || null, mediaUrl: mediaUrl || null, replyTo: replyTo || null, seen: false, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    if (isCloudEnabled) db.addMessage(msg).catch(logSyncError);
  };

  const deleteMessage = (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    if (isCloudEnabled) db.deleteMessage(id).catch(logSyncError);
  };

  const markChatSeen = () => {
    const unseenIds = messages.filter(m => m.sender === partnerUser.id && !m.seen).map(m => m.id);
    if (unseenIds.length === 0) return;
    setMessages(prev => prev.map(m => unseenIds.includes(m.id) ? { ...m, seen: true } : m));
    if (isCloudEnabled) db.markMessagesSeen(unseenIds).catch(logSyncError);
  };

  const unseenChatCount = useMemo(() => messages.filter(m => m.sender !== currentUser.id && !m.seen).length, [messages, currentUser.id]);

  // Notify on newly-arrived messages from the partner, same pattern as pings —
  // skip the notification while the chat tab is already open and visible.
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  useEffect(() => {
    if (!messagesLoaded) {
      setMessagesLoaded(true);
      return;
    }
    const incoming = messages.filter(m => m.sender === partnerUser.id);
    const newest = incoming[incoming.length - 1];
    if (newest && Date.now() - new Date(newest.createdAt).getTime() < 15000) {
      if (!(activeTab === 'chat' && document.visibilityState === 'visible')) {
        const preview = newest.kind === 'text' ? newest.body
          : newest.kind === 'image' ? '📷 Photo'
          : newest.kind === 'video' ? '🎥 Video'
          : newest.body;
        toast(`New message from ${partnerUser.name} 💬: ${preview}`);
        showSystemNotification(`💬 ${partnerUser.name}`, preview);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const addBucketItem = ({ emoji, title, note }) => {
    const item = { id: Date.now(), title, emoji: emoji || '✨', note: note || '', done: false, doneAt: null, createdBy: currentUser.id, createdAt: new Date().toISOString() };
    setBucketList(prev => [item, ...prev]);
    if (isCloudEnabled) db.addBucketItem(item).catch(logSyncError);
  };

  const updateBucketItem = (id, updates) => {
    setBucketList(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    if (isCloudEnabled) db.updateBucketItem(id, { ...bucketList.find(b => b.id === id), ...updates }).catch(logSyncError);
  };

  const toggleBucketDone = (id) => {
    const item = bucketList.find(b => b.id === id);
    if (!item) return;
    updateBucketItem(id, { done: !item.done, doneAt: !item.done ? new Date().toISOString() : null });
  };

  const deleteBucketItem = (id) => {
    setBucketList(prev => prev.filter(b => b.id !== id));
    if (isCloudEnabled) db.deleteBucketItem(id).catch(logSyncError);
  };

  const updateAvatar = async (userId, blob) => {
    try {
      const url = await db.uploadAvatar(userId, blob);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatarUrl: url } : u));
      await db.updateAvatar(userId, url);
      toast('Looking good! 📸');
    } catch (err) {
      toast(err.message || 'Could not upload photo.', 'error');
    }
  };

  const updateProfile = (u1, u2) => {
    setUsers(prev => [
      { ...prev[0], ...u1 },
      { ...prev[1], ...u2 }
    ]);
    if (isCloudEnabled) db.updateProfiles(u1, u2).catch(logSyncError);
  };

  const toggleDashboardCard = (cardKey) => {
    const current = currentUser.hiddenCards || [];
    const next = current.includes(cardKey) ? current.filter(k => k !== cardKey) : [...current, cardKey];
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, hiddenCards: next } : u));
    if (isCloudEnabled) db.updateHiddenCards(currentUser.id, next).catch(logSyncError);
  };

  const refreshMyLocation = useCallback(async () => {
    if (!isCloudEnabled) return false;
    try {
      const pos = await getCurrentPosition();
      const now = new Date().toISOString();
      setUsers(prev => prev.map(u => u.id === currentUserId
        ? { ...u, lat: pos.lat, lng: pos.lng, locationAccuracy: pos.accuracy, locationUpdatedAt: now }
        : u));
      await db.updateLocation(currentUserId, pos);
      return true;
    } catch (err) {
      toast(err.message || 'Could not update your location.', 'error');
      return false;
    }
  }, [currentUserId]);

  const toggleShareLocation = async (enabled) => {
    if (!isCloudEnabled) return;
    if (enabled) {
      try {
        const pos = await getCurrentPosition();
        const now = new Date().toISOString();
        setUsers(prev => prev.map(u => u.id === currentUserId
          ? { ...u, shareLocation: true, lat: pos.lat, lng: pos.lng, locationAccuracy: pos.accuracy, locationUpdatedAt: now }
          : u));
        await db.updateShareLocation(currentUserId, true);
        await db.updateLocation(currentUserId, pos);
        toast('Location shared 💖');
      } catch (err) {
        toast(err.message || 'Could not share your location.', 'error');
      }
    } else {
      setUsers(prev => prev.map(u => u.id === currentUserId
        ? { ...u, shareLocation: false, lat: null, lng: null, locationAccuracy: null, locationUpdatedAt: null }
        : u));
      db.updateShareLocation(currentUserId, false).catch(logSyncError);
      toast('Location sharing turned off');
    }
  };

  // Live tracking while the app is open: when sharing is on and permission is
  // already granted (never prompt), follow the GPS and push an update whenever
  // we move ~25m+ or every 5 minutes, whichever comes first.
  useEffect(() => {
    if (cloudStatus !== 'online' || !currentUser.shareLocation) return;
    let stop = null;
    let cancelled = false;
    const lastSaved = {
      lat: currentUser.lat,
      lng: currentUser.lng,
      t: currentUser.locationUpdatedAt ? new Date(currentUser.locationUpdatedAt).getTime() : 0,
    };

    (async () => {
      try {
        if (navigator.permissions?.query) {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state !== 'granted') return;
        }
      } catch {
        // Permissions API unavailable — proceed, since enabling share_location already required a grant.
      }
      if (cancelled) return;
      setLiveTracking(true);
      stop = startWatch((pos) => {
        const now = Date.now();
        const moved = lastSaved.lat == null || haversineKm(lastSaved, pos) > 0.025;
        const stale = now - lastSaved.t > 5 * 60 * 1000;
        if (!moved && !stale) return;
        lastSaved.lat = pos.lat;
        lastSaved.lng = pos.lng;
        lastSaved.t = now;
        setUsers(prev => prev.map(u => u.id === currentUserId
          ? { ...u, lat: pos.lat, lng: pos.lng, locationAccuracy: pos.accuracy, locationUpdatedAt: new Date(now).toISOString() }
          : u));
        db.updateLocation(currentUserId, pos).catch(logSyncError);
      });
    })();

    return () => {
      cancelled = true;
      setLiveTracking(false);
      if (stop) stop();
    };
    // lastSaved is seeded from the profile once at watch start — deliberately not reactive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudStatus, currentUser.shareLocation, currentUserId]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard expenses={myExpenses} savingsGoal={currentGoal} currentUser={currentUser} partnerUser={partnerUser} users={users} onAddSavings={addSavings} onUpdateGoal={updateSavingsGoal} onAddExpense={addExpense} categories={CATEGORIES} monthlyPlans={myPlans} selectedMonth={selectedDashboardMonth} setSelectedMonth={setSelectedDashboardMonth} availableMonths={availableMonths} todos={myTodos} onSetTodoStatus={setTodoStatus} categoryBudgets={myCategoryBudgets} incomes={myIncomes} onAddIncome={addIncome} onDeleteIncome={deleteIncome} hiddenCards={currentUser.hiddenCards || []} onToggleCard={toggleDashboardCard} pings={pings} onMarkPingsSeen={markPingsSeen} />;
      case 'chat': return <Chat messages={messages} currentUser={currentUser} partnerUser={partnerUser} partnerOnline={partnerOnline} onSend={sendMessage} onDelete={deleteMessage} onMarkSeen={markChatSeen} />;
      case 'expenses': return <Expenses expenses={expenses} users={users} categories={CATEGORIES} availableMonths={availableMonths} onAdd={addExpense} onDelete={deleteExpense} currentUser={currentUser} />;
      case 'analytics': return <Analytics expenses={myExpenses} categories={CATEGORIES} currency={currentUser.currency} categoryBudgets={myCategoryBudgets} onSetBudget={setCategoryBudget} onRemoveBudget={removeCategoryBudget} />;
      case 'todos': return <Todos todos={todos} onSetStatus={setTodoStatus} onAdd={addTodo} onDelete={deleteTodo} onEdit={editTodo} users={users} currentUser={currentUser} availableMonths={availableMonths} />;
      case 'notes': return <Notes notes={notes} onAdd={addNote} onEdit={editNote} onDelete={deleteNote} users={users} currentUser={currentUser} />;
      case 'us': return <Us bucketList={bucketList} onAdd={addBucketItem} onToggleDone={toggleBucketDone} onEdit={updateBucketItem} onDelete={deleteBucketItem} users={users} currentUser={currentUser} />;
      case 'profile': return <Profile users={users} currentUser={currentUser} partner={partnerUser} onUpdateProfile={updateProfile} monthlyPlans={myPlans} onUpdatePlan={updatePlan} availableMonths={availableMonths} currentMonthStr={currentMonthStr} expenses={expenses} todos={todos} onReset={resetRecords} incomes={myIncomes} onAddIncome={addIncome} onDeleteIncome={deleteIncome} onToggleShareLocation={toggleShareLocation} onRefreshLocation={refreshMyLocation} onUpdateAvatar={updateAvatar} />;
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
    <div className="h-dvh bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800 relative overflow-hidden">

      <UIHost />
      {showLocationMap && (
        <LocationMap
          users={users}
          currentUser={currentUser}
          live={liveTracking}
          onClose={() => setShowLocationMap(false)}
          onRefresh={refreshMyLocation}
        />
      )}
      {notifications.length > 0 && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col items-center gap-3 w-[90%] max-w-sm">
          {notifications.map(n => (
            <Notification
              key={n.id}
              notification={n}
              stacked
              onClose={() => {
                dismissedDueRef.current.add(n.id);
                setNotifications(prev => prev.filter(x => x.id !== n.id));
              }}
            />
          ))}
        </div>
      )}

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
      <div className="bg-white border-b md:border-r border-gray-200 w-full md:w-64 md:h-full md:overflow-y-auto flex flex-row md:flex-col justify-between md:justify-start md:gap-6 items-center md:items-start p-4 md:p-6 z-40 shadow-sm md:shadow-none shrink-0 h-16">
        <div className="flex flex-row md:flex-col items-center md:items-start gap-2 md:gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-md shrink-0">
              D
            </div>
            <span className="hidden min-[400px]:inline md:inline text-lg md:text-xl font-extrabold tracking-tight">DuoHub</span>
            <span className={`w-2 h-2 rounded-full ${syncIndicator.color}`} title={syncIndicator.label}></span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-1 md:p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} className="md:hidden" /> : <Moon size={16} className="md:hidden" />}
              {theme === 'dark' ? <Sun size={18} className="hidden md:block" /> : <Moon size={18} className="hidden md:block" />}
            </button>
            <button
              onClick={() => setShowLocationMap(true)}
              className="relative p-1 md:p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={`Where is ${partnerUser.name}?`}
            >
              <MapPin size={16} className="md:hidden" />
              <MapPin size={18} className="hidden md:block" />
              <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none">💕</span>
            </button>
            <button
              onClick={() => setShowThinkingOfYou(true)}
              className="p-1 md:p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title={`Send love to ${partnerUser.name}`}
            >
              <Mail size={16} className="md:hidden" />
              <Mail size={18} className="hidden md:block" />
            </button>
          </div>
        </div>

        <div className="flex items-center bg-gray-100 rounded-full p-1 cursor-pointer hover:bg-gray-200 transition-colors shrink-0" onClick={toggleUser}>
          <div className={`flex items-center gap-1.5 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${currentUser.id === 'u1' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
            {users[0].avatarUrl ? (
              <img src={users[0].avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
            ) : null}
            {users[0].id === partnerUser.id && partnerOnline && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" title="Online now" />
            )}
            {users[0].name}
          </div>
          <div className={`flex items-center gap-1.5 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${currentUser.id === 'u2' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500'}`}>
            {users[1].avatarUrl ? (
              <img src={users[1].avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
            ) : null}
            {users[1].id === partnerUser.id && partnerOnline && (
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" title="Online now" />
            )}
            {users[1].name}
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-2 w-full mt-2">
          <NavItem icon={<Home size={20}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} color={currentUser.text} />
          <NavItem icon={<MessageCircle size={20}/>} label="Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} color={currentUser.text} badge={unseenChatCount} />
          <NavItem icon={<CreditCard size={20}/>} label="Expenses" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} color={currentUser.text} />
          <NavItem icon={<CheckSquare size={20}/>} label="To-Dos" active={activeTab === 'todos'} onClick={() => setActiveTab('todos')} color={currentUser.text} />
          <NavItem icon={<NotebookPen size={20}/>} label="Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} color={currentUser.text} />
          <NavItem icon={<Heart size={20}/>} label="Us" active={activeTab === 'us'} onClick={() => setActiveTab('us')} color={currentUser.text} />
          <NavItem icon={<PieChartIcon size={20}/>} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} color={currentUser.text} />
          <NavItem icon={<User size={20}/>} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} color={currentUser.text} />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Chat owns the full content area (its own scroll + pinned input);
            every other tab flows and scrolls as a normal page. */}
        <div className={activeTab === 'chat' && cloudStatus !== 'connecting' && cloudStatus !== 'error'
          ? 'p-4 md:p-8 w-full max-w-6xl mx-auto h-full pb-20 md:pb-8 flex flex-col min-h-0'
          : 'p-4 md:p-8 w-full max-w-6xl mx-auto pb-24 md:pb-8'}>
        {activeTab !== 'chat' && (
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div className="flex items-center gap-3">
            {currentUser.avatarUrl && (
              <img src={currentUser.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Hey <span className={currentUser.text}>{currentUser.name}</span>
              </h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base">Here is what's happening today.</p>
              {partnerOnline && (
                <p className="text-emerald-600 text-sm font-medium mt-1">💚 {partnerUser.name} is here right now</p>
              )}
            </div>
          </div>
        </header>
        )}

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
        <MobileNavItem icon={<Home size={20}/>} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} color={currentUser.text} />
        <MobileNavItem icon={<MessageCircle size={20}/>} label="Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} color={currentUser.text} badge={unseenChatCount} />
        <MobileNavItem icon={<CreditCard size={20}/>} label="Expenses" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} color={currentUser.text} />
        <MobileNavItem icon={<CheckSquare size={20}/>} label="Tasks" active={activeTab === 'todos'} onClick={() => setActiveTab('todos')} color={currentUser.text} />
        <MobileNavItem icon={<NotebookPen size={20}/>} label="Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} color={currentUser.text} />
        <MobileNavItem icon={<Heart size={20}/>} label="Us" active={activeTab === 'us'} onClick={() => setActiveTab('us')} color={currentUser.text} />
        <MobileNavItem icon={<PieChartIcon size={20}/>} label="Insights" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} color={currentUser.text} />
        <MobileNavItem icon={<User size={20}/>} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} color={currentUser.text} />
      </div>

      {showThinkingOfYou && (
        <ThinkingOfYouModal
          partner={partnerUser}
          onSend={(payload) => { sendPing(payload); setShowThinkingOfYou(false); }}
          onClose={() => setShowThinkingOfYou(false)}
        />
      )}
    </div>
  );
}
