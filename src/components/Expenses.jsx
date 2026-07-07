import { useState, useMemo } from 'react';
import { Filter, Trash2, Plus } from 'lucide-react';
import { monthLabel } from '../data';
import { formatMoney } from '../lib/currency';
import CategoryPicker from './CategoryPicker';

function AddExpenseForm({ onAdd, categories, currentUser }) {
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('groceries');
  const [date, setDate] = useState(today);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !desc) return;
    onAdd({ amount: parseFloat(amount), desc, category: cat, date: date || today });
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
        <button type="submit" className="sm:col-span-2 lg:col-span-5 bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-800 transition-colors active:scale-95 text-sm flex items-center justify-center gap-2">
          <Plus size={16} /> Add Expense
        </button>
      </form>
    </div>
  );
}

export default function Expenses({ expenses, users, categories, availableMonths, onAdd, onDelete, currentUser }) {
  const [filterMonth, setFilterMonth] = useState('all');

  const groupedExpenses = useMemo(() => {
    const groups = {};
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    sortedExpenses.forEach(exp => {
      const dateStr = monthLabel(exp.date);
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(exp);
    });
    return groups;
  }, [expenses]);

  const visibleGroups = Object.entries(groupedExpenses).filter(([monthYear]) => filterMonth === 'all' || filterMonth === monthYear);

  return (
    <div className="space-y-6 md:space-y-8">
      <AddExpenseForm onAdd={onAdd} categories={categories} currentUser={currentUser} />

      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold">Expense History</h3>
          <div className="flex items-center gap-2 bg-white px-3 py-2 md:py-1.5 rounded-xl md:rounded-full border border-gray-200 shadow-sm w-full md:w-auto">
            <Filter size={16} className="text-gray-400 shrink-0" />
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700 cursor-pointer w-full">
              <option value="all">All Time</option>
              {availableMonths.map(month => <option key={month} value={month}>{month}</option>)}
            </select>
          </div>
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
                          onClick={() => { if (window.confirm(`Delete "${exp.desc}" (${formatMoney(exp.amount, user?.currency)})?`)) onDelete(exp.id); }}
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
