import { useState } from 'react';
import { Target, Edit2, Save, Plus, Calendar, CheckSquare, Wallet, PiggyBank } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { monthLabel } from '../data';

export default function Dashboard({ expenses, savingsGoal, onAddSavings, onUpdateGoal, onAddExpense, categories, monthlyPlans, selectedMonth, setSelectedMonth, availableMonths, todos, onToggleTodo }) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editName, setEditName] = useState(savingsGoal.name);
  const [editTarget, setEditTarget] = useState(savingsGoal.target);
  const [addAmount, setAddAmount] = useState('');

  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState(categories[2].id);

  const handleSaveGoal = () => {
    onUpdateGoal(editName, editTarget);
    setIsEditingGoal(false);
  };

  const handleQuickExpense = (e) => {
    e.preventDefault();
    if (!amount || !desc) return;
    const today = new Date().toISOString().split('T')[0];
    onAddExpense({ amount: parseFloat(amount), desc, category: cat, date: today });
    setAmount('');
    setDesc('');
  };

  const currentPlan = monthlyPlans[selectedMonth] || { income: 0, targetSavings: 0 };

  const monthExpenses = expenses.filter(exp => monthLabel(exp.date) === selectedMonth);

  const totalSpent = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const budgetAllowed = currentPlan.income - currentPlan.targetSavings;
  const remainingBudget = Math.max(0, budgetAllowed - totalSpent);

  const spendPercent = budgetAllowed > 0 ? Math.min(100, (totalSpent / budgetAllowed) * 100) : 0;
  const progressPercent = savingsGoal.target > 0 ? Math.min(100, Math.round((savingsGoal.current / savingsGoal.target) * 100)) : 0;

  const chartData = [
    { name: 'Spent', value: totalSpent, color: '#ef4444' },
    { name: 'Remaining', value: remainingBudget, color: '#10b981' },
    { name: 'Target Savings', value: currentPlan.targetSavings, color: '#8b5cf6' }
  ].filter(d => d.value > 0);

  const pendingTodos = todos
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'))
    .slice(0, 4);

  return (
    <div className="space-y-6">

      {/* Month Selector */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-3">
        <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
          <Calendar size={18} className="text-indigo-500" />
          Financial Snapshot
        </h2>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* OVERVIEW CHARTS & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Wallet size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">Income Limit</p>
            </div>
            <p className="text-xl md:text-2xl font-bold">${currentPlan.income.toLocaleString()}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <PiggyBank size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">To Save</p>
            </div>
            <p className="text-xl md:text-2xl font-bold">${currentPlan.targetSavings.toLocaleString()}</p>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Target size={20} />
              </div>
              <p className="text-sm text-gray-500 font-medium leading-tight">Safe to Spend</p>
            </div>
            <p className="text-xl md:text-2xl font-bold">${budgetAllowed.toLocaleString()}</p>

            <div className="mt-3">
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${spendPercent > 90 ? 'bg-red-500' : spendPercent > 75 ? 'bg-amber-400' : 'bg-green-500'}`}
                  style={{ width: spendPercent + '%' }}
                ></div>
              </div>
              <p className="text-[10px] font-bold text-right mt-1 text-gray-400 uppercase tracking-wider">
                {spendPercent.toFixed(0)}% Used (${remainingBudget.toLocaleString()} left)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col w-full min-h-64 sm:min-h-72 lg:min-h-0">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 text-center shrink-0">Budget Breakdown</h3>
          {chartData.length > 0 ? (
            <div className="w-full flex-1 min-h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius="50%" outerRadius="75%" paddingAngle={4} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', lineHeight: '16px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-gray-400 text-sm flex-1 flex items-center justify-center text-center px-4">No financial plan set for this month.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 className="text-lg font-bold mb-4">Quick Log Expense</h3>
        <form onSubmit={handleQuickExpense} className="flex flex-col sm:flex-row gap-3">
          <input type="number" step="0.01" min="0" placeholder="$ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full sm:w-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <input type="text" placeholder="What did you buy?" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full sm:flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full sm:w-48 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-800 transition-colors active:scale-95 text-sm shrink-0">Save</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 w-full mb-6">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-indigo-200 font-medium text-xs md:text-sm tracking-wider uppercase">Our Next Adventure</h3>
              {!isEditingGoal && (
                <button onClick={() => setIsEditingGoal(true)} className="text-indigo-200 hover:text-white transition-colors p-2" title="Edit Goal">
                  <Edit2 size={16} />
                </button>
              )}
            </div>

            {isEditingGoal ? (
              <div className="mb-4 space-y-2">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-indigo-950/50 border border-indigo-500/50 rounded-lg px-3 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" placeholder="Goal Name" />
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative w-full sm:flex-1">
                    <span className="absolute left-3 top-2 text-indigo-300">$</span>
                    <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="w-full bg-indigo-950/50 border border-indigo-500/50 rounded-lg pl-8 pr-3 py-2 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm" placeholder="Target Amount" />
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
              <span>${savingsGoal.current.toLocaleString()} saved</span>
              <span className="text-indigo-200">${savingsGoal.target.toLocaleString()} target</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-row gap-2 items-center w-full mt-auto">
            <input type="number" step="0.01" min="0" placeholder="$ Amount" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} className="w-24 sm:w-32 bg-white/10 border border-white/20 rounded-xl px-3 py-2 md:px-4 md:py-3 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm" />
            <button onClick={() => { if(addAmount) { onAddSavings(parseFloat(addAmount)); setAddAmount(''); } }} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 px-3 py-2 md:px-6 md:py-3 rounded-xl transition-all font-medium flex justify-center items-center gap-2 active:scale-95 text-xs md:text-sm">
              <Plus size={16} className="shrink-0" /> Add
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Upcoming Action Items</h3>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {pendingTodos.length > 0 ? pendingTodos.map(todo => {
              const todayStr = new Date().toISOString().split('T')[0];
              const isDue = todo.dueDate && todo.dueDate <= todayStr;
              return (
                <div key={todo.id} className="flex items-start md:items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer hover:border-gray-300 transition-all" onClick={() => onToggleTodo(todo.id)}>
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
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8">
                <CheckSquare size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">All caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
