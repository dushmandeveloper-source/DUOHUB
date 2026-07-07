
import { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { monthLabel } from '../data';

export default function Expenses({ expenses, users, categories, availableMonths }) {
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
    <div className="space-y-8">
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
                          <p className="text-xs text-gray-400">{exp.date} • {category?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0 pl-14 sm:pl-0">
                        <span className="font-bold text-base md:text-lg">${exp.amount.toFixed(2)}</span>
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white shrink-0 ${user?.color || 'bg-gray-400'}`} title={`Paid by ${user?.name || 'Unknown'}`}>{user?.name.charAt(0) || '?'}</div>
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
