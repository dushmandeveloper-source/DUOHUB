import { useState, useEffect } from 'react';
import { Plus, Calendar, CheckSquare, Trash2, Bell, Pencil, X, Check } from 'lucide-react';
import { monthLabel } from '../data';
import { getNotifyTime } from '../notifications';
import { confirmDialog, toast } from '../ui';
import SelectMenu from './SelectMenu';
import QuickDates from './QuickDates';
import { todayISO, addDaysISO } from '../lib/dates';

export default function Todos({ todos, onToggle, onAdd, onDelete, onEdit, users, currentUser, availableMonths }) {
  const todayStr = todayISO();
  const [task, setTask] = useState('');
  const [assignTo, setAssignTo] = useState('shared');
  const [dueDate, setDueDate] = useState(todayStr); // defaults to today
  const [userFilter, setUserFilter] = useState(currentUser.id);
  const [monthFilter, setMonthFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editAssignee, setEditAssignee] = useState('shared');
  const [editDueDate, setEditDueDate] = useState('');

  // Default to the selected person's own tasks; follows the top toggle
  useEffect(() => {
    setUserFilter(currentUser.id);
  }, [currentUser.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    onAdd(task, assignTo, dueDate);
    toast('Task added');
    setTask('');
    setDueDate(todayStr);
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditAssignee(todo.assignee);
    setEditDueDate(todo.dueDate || '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id) => {
    if (!editText.trim()) return;
    onEdit(id, { text: editText.trim(), assignee: editAssignee, dueDate: editDueDate });
    toast('Task updated');
    setEditingId(null);
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
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <h3 className="text-lg font-bold">Action Items</h3>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <SelectMenu
            className="w-full sm:w-44"
            value={monthFilter}
            onChange={setMonthFilter}
            options={[{ value: 'all', label: 'All Dates' }, ...availableMonths.map(m => ({ value: m, label: m }))]}
          />
          <div className="flex bg-gray-200 rounded-xl md:rounded-full p-1 w-full sm:w-auto">
            <button onClick={() => setUserFilter('all')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium ${userFilter === 'all' ? 'bg-white shadow' : 'text-gray-500'}`}>All</button>
            <button onClick={() => setUserFilter('u1')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${userFilter === 'u1' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{users[0].name}</button>
            <button onClick={() => setUserFilter('u2')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${userFilter === 'u2' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>{users[1].name}</button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row bg-white p-3 md:p-2 rounded-2xl md:rounded-full shadow-sm border border-gray-100 gap-3 md:gap-2">
        <SelectMenu
          className="w-full md:w-40 shrink-0"
          value={assignTo}
          onChange={setAssignTo}
          options={[
            { value: 'shared', label: 'Shared' },
            { value: 'u1', label: users[0].name },
            { value: 'u2', label: users[1].name },
          ]}
        />
        <input type="text" value={task} onChange={(e) => setTask(e.target.value)} placeholder="Add a new task..." className="flex-1 bg-transparent px-4 py-3 md:py-2 focus:outline-none text-sm border md:border-none border-gray-100 rounded-xl md:rounded-none" />
        <div className="flex items-center gap-2 px-4 md:px-2 py-3 md:py-0 bg-gray-50 rounded-xl md:rounded-full border border-transparent focus-within:border-gray-200 transition-colors w-full md:w-auto">
          <Calendar size={16} className="text-gray-400 shrink-0" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-transparent text-sm focus:outline-none text-gray-600" />
        </div>
        <button type="submit" className={`w-full md:w-10 md:h-10 p-3 md:p-0 rounded-xl md:rounded-full text-white shadow-sm transition-transform active:scale-95 flex justify-center items-center shrink-0 ${currentUser.color}`}>
          <Plus size={20} className="hidden md:block" /><span className="md:hidden font-bold">Add Task</span>
        </button>
      </form>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 -mt-3 px-2">
        <QuickDates
          value={dueDate}
          onChange={setDueDate}
          options={[
            { label: 'Today', date: todayStr },
            { label: 'Tomorrow', date: addDaysISO(1) },
            { label: 'In 3 Days', date: addDaysISO(3) },
            { label: 'Next Week', date: addDaysISO(7) },
          ]}
        />
        {dueDate && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Bell size={12} /> Alert on {dueDate} after {getNotifyTime()}
          </p>
        )}
      </div>

      <div className="space-y-2">
        {filteredTodos.map(todo => {
          const assigneeName = todo.assignee === 'shared' ? 'Shared' : users.find(u => u.id === todo.assignee)?.name;
          const assigneeColor = todo.assignee === 'u1' ? 'text-blue-500 bg-blue-50' : todo.assignee === 'u2' ? 'text-rose-500 bg-rose-50' : 'text-gray-500 bg-gray-100';
          let dateWarning = false;
          if (todo.dueDate && !todo.completed) { dateWarning = todo.dueDate <= todayStr; }
          if (editingId === todo.id) {
            return (
              <div
                key={todo.id}
                className="flex flex-col md:flex-row md:items-center gap-3 p-3 md:p-4 rounded-2xl border bg-white border-gray-200 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(todo.id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <SelectMenu
                    className="w-full sm:w-36"
                    value={editAssignee}
                    onChange={setEditAssignee}
                    options={[
                      { value: 'shared', label: 'Shared' },
                      { value: 'u1', label: users[0].name },
                      { value: 'u2', label: users[1].name },
                    ]}
                  />
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 w-full sm:w-auto">
                    <Calendar size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(todo.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="w-full bg-transparent text-sm focus:outline-none text-gray-600"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1 justify-end shrink-0">
                  <button onClick={() => saveEdit(todo.id)} className="text-gray-300 hover:text-green-500 transition-colors p-1" title="Save task">
                    <Check size={18} />
                  </button>
                  <button onClick={cancelEdit} className="text-gray-300 hover:text-gray-500 transition-colors p-1" title="Cancel edit">
                    <X size={18} />
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div key={todo.id} className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border transition-all ${todo.completed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}>
              <div className="flex items-start md:items-center gap-3 md:gap-4 cursor-pointer flex-1 min-w-0" onClick={() => onToggle(todo.id)}>
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 md:mt-0 ${todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{todo.completed && <CheckSquare size={14} />}</div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm md:text-base font-medium break-words ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{todo.text}</span>
                  {todo.dueDate && (<span className={`text-[10px] md:text-xs font-medium flex items-center gap-1 mt-1 md:mt-0.5 ${dateWarning ? 'text-amber-600' : 'text-gray-400'}`}><Calendar size={10} /> {todo.dueDate} {dateWarning && '(Due!)'}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-md text-center ${assigneeColor}`}>{assigneeName}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); startEdit(todo); }}
                  className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                  title="Edit task"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await confirmDialog({ title: 'Delete task?', message: `"${todo.text}" will be removed for both of you.` });
                    if (ok) { onDelete(todo.id); toast('Task deleted'); }
                  }}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        {filteredTodos.length === 0 && (<div className="text-center py-10 text-gray-400 font-medium text-sm">No tasks found for these filters.</div>)}
      </div>
    </div>
  );
}
