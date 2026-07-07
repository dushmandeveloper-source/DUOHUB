import { useState } from 'react';
import { Plus, Filter, Calendar, CheckSquare } from 'lucide-react';
import { monthLabel } from '../data';

export default function Todos({ todos, onToggle, onAdd, users, currentUser, availableMonths }) {
  const [task, setTask] = useState('');
  const [assignTo, setAssignTo] = useState('shared');
  const [dueDate, setDueDate] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(task, assignTo, dueDate);
    setTask('');
    setDueDate('');
  };

  const filteredTodos = todos.filter(t => {
    if (userFilter === 'u1' && t.assignee !== 'u1' && t.assignee !== 'shared') return false;
    if (userFilter === 'u2' && t.assignee !== 'u2' && t.assignee !== 'shared') return false;
    if (monthFilter !== 'all') {
      if (!t.dueDate) return false;
      if (monthLabel(t.dueDate) !== monthFilter) return false;
    }
    return true;
  });
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h3 className="text-lg font-bold">Action Items</h3>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 md:py-1.5 rounded-xl md:rounded-full border border-gray-200 shadow-sm w-full sm:w-auto">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="bg-transparent border-none focus:outline-none text-xs md:text-sm font-medium text-gray-700 cursor-pointer w-full">
              <option value="all">All Dates</option>
              {availableMonths.map(month => <option key={month} value={month}>{month}</option>)}
            </select>
          </div>
          <div className="flex bg-gray-200 rounded-xl md:rounded-full p-1 w-full sm:w-auto">
            <button onClick={() => setUserFilter('all')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium ${userFilter === 'all' ? 'bg-white shadow' : 'text-gray-500'}`}>All</button>
            <button onClick={() => setUserFilter('u1')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${userFilter === 'u1' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{users[0].name}</button>
            <button onClick={() => setUserFilter('u2')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${userFilter === 'u2' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>{users[1].name}</button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row bg-white p-3 md:p-2 rounded-2xl md:rounded-full shadow-sm border border-gray-100 gap-3 md:gap-2">
        <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="w-full md:w-auto bg-gray-50 border-none outline-none text-sm font-medium rounded-xl md:rounded-full px-4 py-3 md:py-2 shrink-0 cursor-pointer">
          <option value="shared">Shared</option>
          <option value="u1">{users[0].name}</option>
          <option value="u2">{users[1].name}</option>
        </select>
        <input type="text" value={task} onChange={(e) => setTask(e.target.value)} placeholder="Add a new task..." className="flex-1 bg-transparent px-4 py-3 md:py-2 focus:outline-none text-sm border md:border-none border-gray-100 rounded-xl md:rounded-none" />
        <div className="flex items-center gap-2 px-4 md:px-2 py-3 md:py-0 bg-gray-50 rounded-xl md:rounded-full border border-transparent focus-within:border-gray-200 transition-colors w-full md:w-auto">
          <Calendar size={16} className="text-gray-400 shrink-0" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-transparent text-sm focus:outline-none text-gray-600" />
        </div>
        <button type="submit" className={`w-full md:w-10 md:h-10 p-3 md:p-0 rounded-xl md:rounded-full text-white shadow-sm transition-transform active:scale-95 flex justify-center items-center shrink-0 ${currentUser.color}`}>
          <Plus size={20} className="hidden md:block" /><span className="md:hidden font-bold">Add Task</span>
        </button>
      </form>

      <div className="space-y-2">
        {filteredTodos.map(todo => {
          const assigneeName = todo.assignee === 'shared' ? 'Shared' : users.find(u => u.id === todo.assignee)?.name;
          const assigneeColor = todo.assignee === 'u1' ? 'text-blue-500 bg-blue-50' : todo.assignee === 'u2' ? 'text-rose-500 bg-rose-50' : 'text-gray-500 bg-gray-100';
          let dateWarning = false;
          if (todo.dueDate && !todo.completed) { dateWarning = todo.dueDate <= todayStr; }
          return (
            <div key={todo.id} className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border transition-all ${todo.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}>
              <div className="flex items-start md:items-center gap-3 md:gap-4 cursor-pointer flex-1 min-w-0" onClick={() => onToggle(todo.id)}>
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 md:mt-0 ${todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{todo.completed && <CheckSquare size={14} />}</div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm md:text-base font-medium break-words ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{todo.text}</span>
                  {todo.dueDate && (<span className={`text-[10px] md:text-xs font-medium flex items-center gap-1 mt-1 md:mt-0.5 ${dateWarning ? 'text-amber-600' : 'text-gray-400'}`}><Calendar size={10} /> {todo.dueDate} {dateWarning && '(Due!)'}</span>)}
                </div>
              </div>
              <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-md ml-3 shrink-0 text-center ${assigneeColor}`}>{assigneeName}</span>
            </div>
          );
        })}
        {filteredTodos.length === 0 && (<div className="text-center py-10 text-gray-400 font-medium text-sm">No tasks found for these filters.</div>)}
      </div>
    </div>
  );
}
