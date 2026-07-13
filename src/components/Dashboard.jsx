import { useState, useEffect } from 'react';
import { Target, Edit2, Save, Plus, Calendar, CheckSquare, Wallet, PiggyBank, TrendingDown, CreditCard, Banknote, Clock, Settings, Mail, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { monthLabel } from '../data';
import { formatMoney } from '../lib/currency';
import { toast } from '../ui';
import { fetchWeather } from '../lib/weather';
import CategoryPicker from './CategoryPicker';
import SelectMenu from './SelectMenu';

const CARD_LABELS = {
  actionItems: 'Action Items',
  waiting: 'Waiting',
  overview: 'Overview',
  categoryBudgets: 'Category Budgets',
  quickExpense: 'Quick Log Expense',
  savingsGoal: 'Savings Goal',
  partnerWorld: "Partner's World",
  loveNotes: 'Love Notes',
};

// Fallback coordinates by timezone when the partner hasn't shared live GPS.
const TIMEZONE_COORDS = {
  'Asia/Shanghai': { lat: 31.23, lng: 121.47 },
  'Asia/Colombo': { lat: 6.93, lng: 79.85 },
};

function contextLine(hour) {
  if (hour >= 5 && hour < 11) return 'Morning coffee time ☕';
  if (hour >= 11 && hour < 17) return 'Daytime over there';
  if (hour >= 17 && hour < 22) return 'Evening — maybe say hi? 💬';
  return 'Probably sleeping — sweet dreams 🌙';
}

// Live clock + weather for the partner's timezone/location.
function PartnerWorldCard({ partnerUser, hiddenCards, onToggleCard, openMenuKey, setOpenMenuKey }) {
  const [now, setNow] = useState(new Date());
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const coords = (partnerUser.lat != null && partnerUser.lng != null)
      ? { lat: partnerUser.lat, lng: partnerUser.lng }
      : TIMEZONE_COORDS[partnerUser.timezone];
    if (!coords) { setWeather(null); return; }
    fetchWeather(coords.lat, coords.lng).then(setWeather);
  }, [partnerUser.lat, partnerUser.lng, partnerUser.timezone]);

  const tz = partnerUser.timezone || 'UTC';
  const timeStr = now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', month: 'short', day: 'numeric' });
  const hourNum = Number(now.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', hour12: false }).split(':')[0]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold flex items-center gap-2"><Globe size={18} className="text-indigo-400" /> In {partnerUser.name}'s world 🌏</h3>
        <CardMenu cardKey="partnerWorld" hiddenCards={hiddenCards} onToggleCard={onToggleCard} open={openMenuKey === 'partnerWorld'} onOpenChange={setOpenMenuKey} />
      </div>
      <p className="text-2xl md:text-3xl font-bold text-gray-800">{timeStr}</p>
      <p className="text-sm text-gray-400">{dateStr}</p>
      <p className="text-sm text-gray-600 mt-3">
        It's {timeStr}
        {weather ? ` and ${weather.emoji} ${weather.temperature}°C ${weather.label}` : ''} in {partnerUser.name}'s world
      </p>
      <p className="text-sm font-medium text-indigo-500 mt-1">{contextLine(hourNum)}</p>
    </div>
  );
}

// Unseen "thinking of you" pings addressed to me, most recent first.
function LoveNotesCard({ partnerUser, unseenPings, onMarkSeen, hiddenCards, onToggleCard, openMenuKey, setOpenMenuKey }) {
  if (unseenPings.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-5 md:p-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold flex items-center gap-2"><Mail size={18} className="text-rose-400" /> Love notes 💌</h3>
        <CardMenu cardKey="loveNotes" hiddenCards={hiddenCards} onToggleCard={onToggleCard} open={openMenuKey === 'loveNotes'} onOpenChange={setOpenMenuKey} />
      </div>
      <p className="text-sm text-gray-500 mb-3">{partnerUser.name} was thinking of you</p>
      <div className="space-y-2 mb-4">
        {unseenPings.slice(0, 10).map(p => (
          <div key={p.id} className="flex items-center gap-3 bg-rose-50/60 rounded-2xl px-4 py-2.5">
            <span className="text-2xl shrink-0">{p.emoji}</span>
            <div className="flex-1 min-w-0">
              {p.message && <p className="text-sm text-gray-700 break-words">{p.message}</p>}
              <p className="text-[10px] text-gray-400">{new Date(p.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onMarkSeen(unseenPings.map(p => p.id))}
        className="w-full sm:w-auto bg-rose-500 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-rose-600 transition-colors text-sm"
      >
        So sweet 🥰
      </button>
    </div>
  );
}

// Small inline popover with a single "Hide/Show this card" action, used by the
// gear icon on each dashboard card's header row.
function CardMenu({ cardKey, hiddenCards, onToggleCard, open, onOpenChange, light = false }) {
  const isHidden = hiddenCards.includes(cardKey);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(open ? null : cardKey)}
        className={light ? 'text-indigo-200 hover:text-white transition-colors p-2' : 'text-gray-300 hover:text-gray-600 transition-colors p-2'}
        title="Card settings"
      >
        <Settings size={16} />
      </button>
      {open && (
        <div className="absolute z-20 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-[popIn_0.12s_ease-out]">
          <button
            type="button"
            onClick={() => { onToggleCard(cardKey); onOpenChange(null); }}
            className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isHidden ? 'Show this card' : 'Hide this card'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ expenses, savingsGoal, currentUser, partnerUser, users, onAddSavings, onUpdateGoal, onAddExpense, categories, monthlyPlans, selectedMonth, setSelectedMonth, availableMonths, todos, onSetTodoStatus, categoryBudgets, incomes, hiddenCards = [], onToggleCard, pings = [], onMarkPingsSeen }) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editName, setEditName] = useState(savingsGoal.name);
  const [editTarget, setEditTarget] = useState(savingsGoal.target);
  const [addAmount, setAddAmount] = useState('');
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const [now, setNow] = useState(new Date());

  // Live world-clock tick — 30s is plenty for a minute-resolution display.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fm = (value) => formatMoney(value, currentUser.currency);

  // Keep the edit form in sync when switching between the two users' goals
  useEffect(() => {
    setEditName(savingsGoal.name);
    setEditTarget(savingsGoal.target);
    setIsEditingGoal(false);
  }, [savingsGoal]);

  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('groceries');


  const handleSaveGoal = () => {
    onUpdateGoal(editName, editTarget);
    setIsEditingGoal(false);
  };

  const handleQuickExpense = (e) => {
    e.preventDefault();
    if (!amount || !desc) return;
    const today = new Date().toISOString().split('T')[0];
    onAddExpense({ amount: parseFloat(amount), desc, category: cat, date: today });
    toast('Expense added');
    setAmount('');
    setDesc('');
  };

  const currentPlan = monthlyPlans[selectedMonth] || { income: 0, targetSavings: 0 };

  const monthExpenses = expenses.filter(exp => monthLabel(exp.date) === selectedMonth);

  const totalSpent = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Total income = base plan income + extra income entries for the month
  const monthIncomes = (incomes || []).filter(i => monthLabel(i.date) === selectedMonth);
  const extraIncome = monthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = currentPlan.income + extraIncome;

  const budgetAllowed = totalIncome - currentPlan.targetSavings;
  const remainingBudget = Math.max(0, budgetAllowed - totalSpent);
  const availableBalance = totalIncome - totalSpent;
  const monthSavingsDeposits = monthExpenses.filter(e => e.category === 'savings-deposit').reduce((acc, curr) => acc + curr.amount, 0);

  const spendPercent = budgetAllowed > 0 ? Math.min(100, (totalSpent / budgetAllowed) * 100) : 0;
  const progressPercent = savingsGoal.target > 0 ? Math.min(100, Math.round((savingsGoal.current / savingsGoal.target) * 100)) : 0;

  const chartData = [
    { name: 'Spent', value: totalSpent, color: '#ef4444' },
    { name: 'Remaining', value: remainingBudget, color: '#10b981' },
    { name: 'Target Savings', value: currentPlan.targetSavings, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  const pendingTodos = todos
    .filter(t => (t.status || (t.completed ? 'done' : 'pending')) === 'pending')
    .sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'))
    .slice(0, 4);

  const waitingTodos = todos
    .filter(t => (t.status || (t.completed ? 'done' : 'pending')) === 'waiting')
    .sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'))
    .slice(0, 4);

  // Per-category spending for the selected month + budget comparison
  const spentByCategory = {};
  monthExpenses.forEach(e => { spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount; });
  const topSpendEntry = Object.entries(spentByCategory).sort((a, b) => b[1] - a[1])[0];
  const topSpendCategory = topSpendEntry ? categories.find(c => c.id === topSpendEntry[0]) : null;
  const unseenPings = pings
    .filter(p => p.toUser === currentUser.id && !p.seen)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const budgetRows = Object.entries(categoryBudgets || {})
    .map(([catId, limit]) => {
      const spent = spentByCategory[catId] || 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return { catId, limit, spent, pct, category: categories.find(c => c.id === catId) };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6">

      {/* Month Selector */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-3">
        <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
          <Calendar size={18} className="text-indigo-500" />
          Financial Snapshot
        </h2>
        <SelectMenu
          className="w-full sm:w-52"
          value={selectedMonth}
          onChange={setSelectedMonth}
          options={availableMonths.map(m => ({ value: m, label: m }))}
        />
      </div>

      {/* LOVE NOTES */}
      {!hiddenCards.includes('loveNotes') && (
        <LoveNotesCard
          partnerUser={partnerUser}
          unseenPings={unseenPings}
          onMarkSeen={onMarkPingsSeen}
          hiddenCards={hiddenCards}
          onToggleCard={onToggleCard}
          openMenuKey={openMenuKey}
          setOpenMenuKey={setOpenMenuKey}
        />
      )}

      {/* PARTNER'S WORLD */}
      {!hiddenCards.includes('partnerWorld') && partnerUser && (
        <PartnerWorldCard
          partnerUser={partnerUser}
          hiddenCards={hiddenCards}
          onToggleCard={onToggleCard}
          openMenuKey={openMenuKey}
          setOpenMenuKey={setOpenMenuKey}
        />
      )}

      {/* World Clock */}
      {users && users.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <Clock size={14} className="text-indigo-400 shrink-0" />
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${u.color}`}></span>
              <span className="font-medium text-gray-600">{u.name}</span>
              <span className="text-gray-400 font-mono">
                {now.toLocaleTimeString('en-US', { timeZone: u.timezone || 'UTC', hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden cards strip */}
      {hiddenCards.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 font-medium">Hidden:</span>
          {hiddenCards.map(key => (
            <button
              key={key}
              onClick={() => onToggleCard(key)}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors"
            >
              {CARD_LABELS[key] || key} <span className="text-gray-400">×</span>
            </button>
          ))}
        </div>
      )}

      {/* UPCOMING ACTION ITEMS */}
      {!hiddenCards.includes('actionItems') && (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Upcoming Action Items</h3>
          <CardMenu cardKey="actionItems" hiddenCards={hiddenCards} onToggleCard={onToggleCard} open={openMenuKey === 'actionItems'} onOpenChange={setOpenMenuKey} />
        </div>

        <div className="space-y-3 flex-1">
          {pendingTodos.length > 0 ? pendingTodos.map(todo => {
            const todayStr = new Date().toISOString().split('T')[0];
            const isDue = todo.dueDate && todo.dueDate <= todayStr;
            return (
              <div key={todo.id} className="flex items-start md:items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:border-gray-300 transition-all" onClick={() => onSetTodoStatus(todo.id, 'waiting')}>
                <div className="w-5 h-5 rounded border-2 border-gray-300 shrink-0 mt-0.5 md:mt-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 break-words">{todo.text}</p>
                  {todo.dueDate && (
                    <p className={`text-xs font-medium flex items-center gap-1 mt-1 md:mt-0.5 ${isDue ? 'text-amber-600' : 'text-gray-400'}`}>
                      <Calendar size={10} /> {todo.dueDate} {isDue && '(Due!)'}
                    </p>
                  )}
                </div>
              </div>
            )
          }) : (
            <div className="flex flex-col items-center justify-center text-gray-400 py-6">
              <CheckSquare size={32} className="mb-2 opacity-20" />
              <p className="text-sm font-medium">All caught up!</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* WAITING */}
      {!hiddenCards.includes('waiting') && waitingTodos.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Waiting</h3>
            <CardMenu cardKey="waiting" hiddenCards={hiddenCards} onToggleCard={onToggleCard} open={openMenuKey === 'waiting'} onOpenChange={setOpenMenuKey} />
          </div>

          <div className="space-y-3 flex-1">
            {waitingTodos.map(todo => (
              <div key={todo.id} className="flex items-start md:items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:border-gray-300 transition-all" onClick={() => onSetTodoStatus(todo.id, 'done')}>
                <div className="w-5 h-5 rounded border-2 border-amber-400 bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 md:mt-0">
                  <Clock size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 break-words">{todo.text}</p>
                  {todo.dueDate && (
                    <p className="text-xs font-medium flex items-center gap-1 mt-1 md:mt-0.5 text-gray-400">
                      <Calendar size={10} /> {todo.dueDate}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OVERVIEW CHARTS & STATS */}
      {!hiddenCards.includes('overview') && (
      <>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-700">Overview</h3>
        <CardMenu cardKey="overview" hiddenCards={hiddenCards} onToggleCard={onToggleCard} open={openMenuKey === 'overview'} onOpenChange={setOpenMenuKey} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Wallet size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">Total Income</p>
            </div>
            <p className="text-xl md:text-2xl font-bold">{fm(totalIncome)}</p>
            {extraIncome > 0 && (
              <p className="text-[10px] font-bold mt-1 text-gray-400 uppercase tracking-wider">Base {fm(currentPlan.income)} + Extra {fm(extraIncome)}</p>
            )}
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <CreditCard size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">Spent This Month</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-red-600">{fm(totalSpent)}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <PiggyBank size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">To Save</p>
            </div>
            <p className="text-xl md:text-2xl font-bold">{fm(currentPlan.targetSavings)}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${availableBalance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                <Banknote size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">Available Balance</p>
            </div>
            <p className={`text-xl md:text-2xl font-bold ${availableBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fm(availableBalance)}</p>
            <p className="text-[10px] font-bold mt-1 text-gray-400 uppercase tracking-wider">Income − Spent</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <PiggyBank size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">Savings Deposits</p>
            </div>
            <p className="text-xl md:text-2xl font-bold text-emerald-600">{fm(monthSavingsDeposits)}</p>
            <p className="text-[10px] font-bold mt-1 text-gray-400 uppercase tracking-wider">Included in Spent · Real spending {fm(totalSpent - monthSavingsDeposits)}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Target size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">Safe to Spend</p>
            </div>
            <p className="text-xl md:text-2xl font-bold">{fm(budgetAllowed)}</p>

            <div className="mt-3">
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${spendPercent > 90 ? 'bg-red-500' : spendPercent > 75 ? 'bg-amber-400' : 'bg-green-500'}`}
                  style={{ width: spendPercent + '%' }}
                ></div>
              </div>
              <p className="text-[10px] font-bold text-right mt-1 text-gray-400 uppercase tracking-wider">
                {spendPercent.toFixed(0)}% Used ({fm(remainingBudget)} left)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col w-full min-h-64 sm:min-h-72 lg:min-h-0">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 text-center shrink-0">Budget Breakdown</h3>
          {chartData.length > 0 ? (
            <div className="w-full flex-1 min-h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 4, left: 20 }}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="75%"
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                    label={({ cx, cy, midAngle, outerRadius, value }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 14;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="fill-gray-600 text-[10px] font-bold">
                          {fm(value)}
                        </text>
                      );
                    }}
                    labelLine={{ stroke: '#cbd5e1' }}
                  >
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => fm(value)} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', lineHeight: '16px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-400 text-sm flex-1 flex items-center justify-center text-center px-4">No financial plan set for this month.</div>
          )}
        </div>
      </div>
      </>
      )}

      {/* CATEGORY BUDGETS for the selected month */}
      {!hiddenCards.includes('categoryBudgets') && (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-lg font-bold">Category Budgets — {selectedMonth}</h3>
          <span className="flex items-center gap-2 self-start sm:self-auto">
            {topSpendEntry && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full">
                <TrendingDown size={13} /> Highest spend: {topSpendCategory?.name || topSpendEntry[0]} · {fm(topSpendEntry[1])}
              </span>
            )}
            <CardMenu cardKey="categoryBudgets" hiddenCards={hiddenCards} onToggleCard={onToggleCard} open={openMenuKey === 'categoryBudgets'} onOpenChange={setOpenMenuKey} />
          </span>
        </div>

        {budgetRows.length > 0 ? (
          <div className="space-y-4">
            {budgetRows.map(({ catId, limit, spent, pct, category }) => {
              const Icon = category?.icon;
              const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-green-500';
              const textColor = pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-gray-400';
              return (
                <div key={catId}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700 min-w-0">
                      {Icon && <Icon size={15} className="text-gray-400 shrink-0" />}
                      <span className="truncate">{category?.name || catId}</span>
                    </span>
                    <span className={`text-xs font-bold shrink-0 ${textColor}`}>
                      {fm(spent)} / {fm(limit)}{pct >= 100 && ' — over!'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: Math.min(100, pct) + '%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No category limits set yet — add them in the Analytics tab under "Category Budgets".</p>
        )}
      </div>
      )}

      {/* QUICK LOG EXPENSE */}
      {!hiddenCards.includes('quickExpense') && (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Quick Log Expense</h3>
          <CardMenu cardKey="quickExpense" hiddenCards={hiddenCards} onToggleCard={onToggleCard} open={openMenuKey === 'quickExpense'} onOpenChange={setOpenMenuKey} />
        </div>
        <form onSubmit={handleQuickExpense} className="flex flex-col sm:flex-row gap-3">
          <input type="number" step="0.01" min="0" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full sm:w-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <input type="text" placeholder="What did you buy?" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full sm:flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <div className="w-full sm:w-56">
            <CategoryPicker categories={categories} value={cat} onChange={setCat} />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-800 transition-colors active:scale-95 text-sm shrink-0">Save</button>
        </form>
      </div>
      )}

      {/* SAVINGS GOAL */}
      {!hiddenCards.includes('savingsGoal') && (
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 w-full mb-6">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-indigo-200 font-medium text-xs md:text-sm tracking-wider uppercase">{currentUser.name}'s Savings Goal</h3>
              <span className="flex items-center gap-1">
                {!isEditingGoal && (
                  <button onClick={() => setIsEditingGoal(true)} className="text-indigo-200 hover:text-white transition-colors p-2" title="Edit Goal">
                    <Edit2 size={16} />
                  </button>
                )}
                <CardMenu cardKey="savingsGoal" hiddenCards={hiddenCards} onToggleCard={onToggleCard} open={openMenuKey === 'savingsGoal'} onOpenChange={setOpenMenuKey} light />
              </span>
            </div>

            {isEditingGoal ? (
              <div className="mb-4 space-y-2">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-indigo-950/50 border border-indigo-500/50 rounded-lg px-3 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" placeholder="Goal Name" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative w-full sm:flex-1">
                    <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="w-full bg-indigo-950/50 border border-indigo-500/50 rounded-lg px-3 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" placeholder="Target Amount" />
                  </div>
                  <button onClick={handleSaveGoal} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-1 font-medium transition-colors text-sm">
                    <Save size={16} /> Save
                  </button>
                </div>
              </div>
            ) : (
              <h2 className="text-xl md:text-2xl font-bold mb-4 truncate">{savingsGoal.name}</h2>
            )}

            <div className="w-full bg-black/30 h-3 md:h-4 rounded-full overflow-hidden mb-2">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-300 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: progressPercent + '%' }}></div>
            </div>
            <div className="flex justify-between text-xs md:text-sm font-medium">
              <span>{fm(savingsGoal.current)} saved</span>
              <span className="text-indigo-200">{fm(savingsGoal.target)} target</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-row gap-2 items-center w-full mt-auto">
            <input type="number" step="0.01" min="0" placeholder="Amount" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="w-24 sm:w-32 bg-white/10 border border-white/20 rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" />
            <button onClick={() => { if(addAmount) { onAddSavings(parseFloat(addAmount)); toast('Added to savings goal'); setAddAmount(''); } }} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 px-3 py-2 md:px-6 md:py-3 rounded-xl transition-all font-medium flex justify-center items-center gap-2 active:scale-95 text-xs md:text-sm">
              <Plus size={16} className="shrink-0" /> Add
            </button>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
