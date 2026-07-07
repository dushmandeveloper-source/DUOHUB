import { useMemo, useState } from 'react';
import { AlertCircle, Target, Plus, X } from 'lucide-react';
import { formatMoney } from '../lib/currency';
import { monthLabel } from '../data';
import CategoryPicker from './CategoryPicker';

function CategoryBudgets({ expenses, categories, currency, budgets, onSet, onRemove }) {
  const fm = (value) => formatMoney(value, currency);
  const [newCat, setNewCat] = useState('groceries');
  const [newAmount, setNewAmount] = useState('');

  const currentMonth = monthLabel(new Date().toISOString().split('T')[0]);
  const spentByCategory = useMemo(() => {
    const spent = {};
    expenses.forEach(e => {
      if (monthLabel(e.date) === currentMonth) spent[e.category] = (spent[e.category] || 0) + e.amount;
    });
    return spent;
  }, [expenses, currentMonth]);

  const rows = Object.entries(budgets)
    .map(([catId, limit]) => {
      const spent = spentByCategory[catId] || 0;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return { catId, limit, spent, pct, category: categories.find(c => c.id === catId) };
    })
    .sort((a, b) => b.pct - a.pct);

  const warnings = rows.filter(r => r.pct >= 80);

  const handleAdd = (e) => {
    e.preventDefault();
    const amount = parseFloat(newAmount);
    if (!amount || amount <= 0) return;
    onSet(newCat, amount);
    setNewAmount('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Target size={20} className="md:w-6 md:h-6" />
        </div>
        <div>
          <h3 className="text-base md:text-lg font-bold">Category Budgets — {currentMonth}</h3>
          <p className="text-gray-500 text-xs md:text-sm">Set a monthly limit per category and get warned before overspending.</p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs md:text-sm text-amber-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0" />
          <span>
            {warnings.map(w => `${w.category?.name || w.catId} ${w.pct >= 100 ? 'is OVER budget' : `at ${Math.round(w.pct)}%`}`).join(' • ')}
          </span>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {rows.map(({ catId, limit, spent, pct, category }) => {
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
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold ${textColor}`}>
                    {fm(spent)} / {fm(limit)}{pct >= 100 && ' — over budget!'}
                  </span>
                  <button onClick={() => { if (window.confirm(`Remove the budget for ${category?.name || catId}?`)) onRemove(catId); }} className="text-gray-300 hover:text-red-500 p-0.5 transition-colors" title="Remove budget">
                    <X size={14} />
                  </button>
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: Math.min(100, pct) + '%' }}></div>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No budgets set yet — add your first one below.</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:flex-1">
          <CategoryPicker categories={categories} value={newCat} onChange={setNewCat} />
        </div>
        <input type="number" step="0.01" min="0" placeholder="Monthly limit" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full sm:w-40 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-800 transition-colors active:scale-95 text-sm flex items-center justify-center gap-2 shrink-0">
          <Plus size={16} /> Set Budget
        </button>
      </form>
    </div>
  );
}

export default function Analytics({ expenses, categories, currency, categoryBudgets, onSetBudget, onRemoveBudget }) {
  const fm = (value) => formatMoney(value, currency);
  const analyticsData = useMemo(() => {
    let fixedTotal = 0;
    let variableTotal = 0;
    const variableCategories = {};
    expenses.forEach(exp => {
      const cat = categories.find(c => c.id === exp.category);
      if (cat?.type === 'Fixed') {
        fixedTotal += exp.amount;
      } else {
        variableTotal += exp.amount;
        const name = cat?.name || 'Other';
        if (!variableCategories[name]) variableCategories[name] = { amount: 0 };
        variableCategories[name].amount += exp.amount;
      }
    });
    const total = fixedTotal + variableTotal;
    const variableItems = Object.entries(variableCategories).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.amount - a.amount);
    return { fixedTotal, variableTotal, total, variableItems };
  }, [expenses, categories]);

  const { fixedTotal, variableTotal, total, variableItems } = analyticsData;
  const fixedPct = total === 0 ? 0 : (fixedTotal / total) * 100;
  const variablePct = total === 0 ? 0 : (variableTotal / total) * 100;

  return (
    <div className="space-y-6 md:space-y-8">
      <CategoryBudgets expenses={expenses} categories={categories} currency={currency} budgets={categoryBudgets} onSet={onSetBudget} onRemove={onRemoveBudget} />

      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row items-start gap-4">
        <div className="bg-amber-100 text-amber-600 p-3 rounded-full shrink-0 hidden sm:block"><AlertCircle size={24} /></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={20} className="text-amber-600 sm:hidden" />
            <h3 className="font-bold text-amber-900 text-base md:text-lg">Trimming the Fat</h3>
          </div>
          <p className="text-amber-800 mb-3 text-xs md:text-sm">You've spent <strong>{fm(variableTotal)}</strong> on variable expenses. Cutting down on these is the fastest way to fund your savings goal!</p>
          <div className="flex flex-wrap gap-2">
            {variableItems.slice(0, 3).map(item => (
              <span key={item.name} className="bg-white px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold text-amber-700 shadow-sm border border-amber-100">{item.name}: {fm(item.amount)}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
        <h3 className="text-base md:text-lg font-bold mb-6 text-center">Fixed vs Variable Spending</h3>
        <div className="w-full bg-gray-100 h-10 md:h-12 rounded-full flex overflow-hidden shadow-inner mb-6">
          <div className="bg-blue-500 flex items-center justify-center text-white text-[10px] md:text-xs font-bold transition-all truncate px-1" style={{ width: fixedPct + '%' }}>{fixedPct > 15 && 'Fixed'}</div>
          <div className="bg-amber-400 flex items-center justify-center text-amber-900 text-[10px] md:text-xs font-bold transition-all truncate px-1" style={{ width: variablePct + '%' }}>{variablePct > 20 && 'Variable'}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-8">
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-4"><div className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></div><h4 className="font-bold text-gray-700 text-sm md:text-base">Fixed Expenses</h4></div>
            <p className="text-2xl md:text-3xl font-bold mb-2">{fm(fixedTotal)}</p>
            <p className="text-xs md:text-sm text-gray-500">Rent, Utilities, Insurance.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2 md:mb-4"><div className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></div><h4 className="font-bold text-gray-700 text-sm md:text-base">Variable Expenses</h4></div>
            <p className="text-2xl md:text-3xl font-bold mb-4">{fm(variableTotal)}</p>
            <ul className="space-y-2">
              {variableItems.map(item => (
                <li key={item.name} className="flex justify-between text-xs md:text-sm border-b border-gray-50 pb-2"><span className="truncate pr-2">{item.name}</span><span className="font-bold text-gray-700 shrink-0">{fm(item.amount)}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
