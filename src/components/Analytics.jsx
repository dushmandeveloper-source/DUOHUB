import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { formatMoney } from '../lib/currency';

export default function Analytics({ expenses, categories, currency }) {
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
