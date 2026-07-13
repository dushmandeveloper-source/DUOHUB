import { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, Filter } from 'lucide-react';
import { monthLabel } from '../data';
import { formatMoney } from '../lib/currency';
import { confirmDialog, toast } from '../ui';
import CategoryPicker from './CategoryPicker';
import SelectMenu from './SelectMenu';
import QuickDates from './QuickDates';
import { todayISO, addDaysISO } from '../lib/dates';

function AddExpenseForm({ onAdd, categories, currentUser }) {
  const today = todayISO();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('groceries');
  const [date, setDate] = useState(today);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !desc) return;
    onAdd({ amount: parseFloat(amount), desc, category: cat, date: date || today });
    toast('Expense added');
    setAmount('');
    setDesc('');
    setDate(today);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
      <h3 className="text-lg font-bold mb-4">Add Expense <span className="text-xs font-medium text-gray-400">(paid by {currentUser.name})</span></h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input type="number" step="0.01" min="0" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        <input type="text" placeholder="What was it for?" value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm lg:col-span-2" />
        <CategoryPicker categories={categories} value={cat} onChange={setCat} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-600" />
        <div className="sm:col-span-2 lg:col-span-5 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[10px] font-medium text-gray-400 shrink-0">Set date:</span>
          <QuickDates
            value={date}
            onChange={setDate}
            variant="muted"
            options={[
              { label: 'Today', date: today },
              { label: 'Yesterday', date: addDaysISO(-1) },
              { label: '2 Days Ago', date: addDaysISO(-2) },
            ]}
          />
        </div>
        <button type="submit" className="sm:col-span-2 lg:col-span-5 bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-800 transition-colors active:scale-95 text-sm flex items-center justify-center gap-2">
          <Plus size={16} /> Add Expense
        </button>
      </form>
    </div>
  );
}

export default function Expenses({ expenses, users, categories, availableMonths, onAdd, onDelete, currentUser }) {
  const [filterMonth, setFilterMonth] = useState('all');
  const [payerFilter, setPayerFilter] = useState(currentUser.id);
  const [dateFilter, setDateFilter] = useState(null);

  // Default to the selected person's own expenses; follows the top toggle
  useEffect(() => {
    setPayerFilter(currentUser.id);
  }, [currentUser.id]);

  const groupedExpenses = useMemo(() => {
    const groups = {};
    const visible = payerFilter === 'all' ? expenses : expenses.filter(e => e.paidBy === payerFilter);
    const sortedExpenses = [...visible].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedExpenses.forEach(exp => {
      const dateStr = monthLabel(exp.date);
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(exp);
    });
    return groups;
  }, [expenses, payerFilter]);

  const visibleGroups = Object.entries(groupedExpenses)
    .filter(([monthYear]) => filterMonth === 'all' || filterMonth === monthYear)
    .map(([monthYear, monthExpenses]) => [monthYear, dateFilter ? monthExpenses.filter(e => e.date === dateFilter) : monthExpenses])
    .filter(([, monthExpenses]) => monthExpenses.length > 0);

  return (
    <div className="space-y-6 md:space-y-8">
      <AddExpenseForm onAdd={onAdd} categories={categories} currentUser={currentUser} />

      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold">Expense History</h3>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <div className="flex bg-gray-200 rounded-xl md:rounded-full p-1 w-full sm:w-auto">
              <button onClick={() => setPayerFilter('u1')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${payerFilter === 'u1' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{users[0].name}</button>
              <button onClick={() => setPayerFilter('u2')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${payerFilter === 'u2' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>{users[1].name}</button>
              <button onClick={() => setPayerFilter('all')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium ${payerFilter === 'all' ? 'bg-white shadow' : 'text-gray-500'}`}>Both</button>
            </div>
            <SelectMenu
              className="w-full sm:w-48"
              value={filterMonth}
              onChange={setFilterMonth}
              options={[{ value: 'all', label: 'All Time' }, ...availableMonths.map(m => ({ value: m, label: m }))]}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-3 py-2.5">
          <span className="text-xs font-bold text-indigo-500 flex items-center gap-1.5 shrink-0">
            <Filter size={12} /> Filter list by date
          </span>
          <QuickDates
            value={dateFilter}
            onChange={(d) => setDateFilter(prev => prev === d ? null : d)}
            options={[
              { label: 'Today', date: todayISO() },
              { label: 'Yesterday', date: addDaysISO(-1) },
              { label: '2 Days Ago', date: addDaysISO(-2) },
            ]}
          />
        </div>

        <div className="space-y-6 md:space-y-8">
          {visibleGroups.map(([monthYear, monthExpenses]) => (
            <div key={monthYear} className="space-y-3">
              <h4 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wider pl-2 border-l-4 border-indigo-500">{monthYear}</h4>
              <div className="space-y-3">
                {monthExpenses.map(exp => {
                  const user = users.find(u => u.id === exp.paidBy);
                  const category = categories.find(c => c.id === exp.category);
                  const CategoryIcon = category?.icon;
                  return (
                    <div key={exp.id} className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border border-gray-50 hover:shadow-md transition-shadow gap-3">
                      <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center shrink-0">{CategoryIcon && <CategoryIcon size={20} />}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm md:text-base truncate">{exp.desc}</p>
                          <p className="text-xs text-gray-400">{exp.date} • {category?.name || 'Other'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-14 sm:pl-0">
                        <span className="font-bold text-base md:text-lg">{formatMoney(exp.amount, user?.currency)}</span>
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white shrink-0 ${user?.color || 'bg-gray-400'}`} title={`Paid by ${user?.name || 'Unknown'}`}>{user?.name.charAt(0) || '?'}</div>
                        <button
                          onClick={async () => {
                            const ok = await confirmDialog({ title: 'Delete expense?', message: `"${exp.desc}" (${formatMoney(exp.amount, user?.currency)}) will be removed for both of you.` });
                            if (ok) { onDelete(exp.id); toast('Expense deleted'); }
                          }}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0"
                          title="Delete expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {visibleGroups.length === 0 && (
            <div className="text-center py-10 text-gray-400 font-medium text-sm">No expenses found for this period.</div>
          )}
        </div>
      </div>
    </div>
  );
}
