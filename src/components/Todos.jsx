import { useState, useEffect } from 'react';
import { Plus, Calendar, CheckSquare, Trash2, Bell, Pencil, X, Check, Clock, Filter } from 'lucide-react';
import { monthLabel } from '../data';
import { getNotifyTime } from '../notifications';
import { confirmDialog, toast } from '../ui';
import SelectMenu from './SelectMenu';
import QuickDates from './QuickDates';
import ImagePicker from './ImagePicker';
import ImageLightbox from './ImageLightbox';
import { todayISO, addDaysISO } from '../lib/dates';
import * as db from '../lib/db';
import { isCloudEnabled } from '../lib/supabase';

const uploadImage = (file) => (isCloudEnabled ? db.uploadTodoImage(file) : Promise.resolve(URL.createObjectURL(file)));

export default function Todos({ todos, onSetStatus, onAdd, onDelete, onEdit, users, currentUser, availableMonths }) {
  const todayStr = todayISO();
  const [isComposing, setIsComposing] = useState(false);
  const [task, setTask] = useState('');
  const [assignTo, setAssignTo] = useState('shared');
  const [dueDate, setDueDate] = useState(todayStr); // defaults to today
  const [images, setImages] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [lightbox, setLightbox] = useState(null); // { images, index } | null
  const [userFilter, setUserFilter] = useState(currentUser.id);
  const [monthFilter, setMonthFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editAssignee, setEditAssignee] = useState('shared');
  const [editDueDate, setEditDueDate] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [editUploadingCount, setEditUploadingCount] = useState(0);

  // Default to the selected person's own tasks; follows the top toggle
  useEffect(() => {
    setUserFilter(currentUser.id);
  }, [currentUser.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!task.trim()) return;
    onAdd(task, assignTo, dueDate, images);
    toast('Task added');
    setTask('');
    setDueDate(todayStr);
    setImages([]);
    setIsComposing(false);
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditAssignee(todo.assignee);
    setEditDueDate(todo.dueDate || '');
    setEditImages(todo.images || []);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id) => {
    if (!editText.trim()) return;
    onEdit(id, { text: editText.trim(), assignee: editAssignee, dueDate: editDueDate, images: editImages });
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
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (dateFilter && t.dueDate !== dateFilter) return false;
    return true;
  });
  return (
    <div className="space-y-6">
      {!isComposing ? (
        <button
          onClick={() => setIsComposing(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-dashed border-gray-300 rounded-2xl px-4 py-3.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Plus size={16} /> Add Task
        </button>
      ) : (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-6">
        <h3 className="text-lg font-bold mb-4">Add Task</h3>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 md:gap-2">
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
          <input type="text" value={task} onChange={(e) => setTask(e.target.value)} placeholder="Add a new task..." autoFocus className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 w-full md:w-auto">
            <Calendar size={16} className="text-gray-400 shrink-0" />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-transparent text-sm focus:outline-none text-gray-600" />
          </div>
          <button type="submit" className="w-full md:w-auto bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-800 transition-colors active:scale-95 text-sm flex items-center justify-center gap-2 shrink-0">
            <Plus size={16} /> Add Task
          </button>
        </form>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
          <span className="text-[10px] font-medium text-gray-400 shrink-0">Set due date:</span>
          <QuickDates
            value={dueDate}
            onChange={setDueDate}
            variant="muted"
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
        <div className="mt-3">
          <ImagePicker
            images={images}
            onAdd={(url) => setImages(prev => [...prev, url])}
            onRemove={(url) => setImages(prev => prev.filter(u => u !== url))}
            uploadingCount={uploadingCount}
            setUploadingCount={setUploadingCount}
            uploadFn={uploadImage}
          />
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={() => setIsComposing(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
      )}

      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h3 className="text-lg font-bold">Action Items</h3>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            <SelectMenu
              className="w-full sm:w-44"
              value={monthFilter}
              onChange={setMonthFilter}
              options={[{ value: 'all', label: 'All Dates' }, ...availableMonths.map(m => ({ value: m, label: m }))]}
            />
            <SelectMenu
              className="w-full sm:w-36"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'waiting', label: 'Waiting' },
                { value: 'done', label: 'Done' },
              ]}
            />
            <div className="flex bg-gray-200 rounded-xl md:rounded-full p-1 w-full sm:w-auto">
              <button onClick={() => setUserFilter('all')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium ${userFilter === 'all' ? 'bg-white shadow' : 'text-gray-500'}`}>All</button>
              <button onClick={() => setUserFilter('u1')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${userFilter === 'u1' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>{users[0].name}</button>
              <button onClick={() => setUserFilter('u2')} className={`flex-1 text-xs px-3 py-2 md:py-1 rounded-lg md:rounded-full font-medium truncate ${userFilter === 'u2' ? 'bg-white shadow text-rose-600' : 'text-gray-500'}`}>{users[1].name}</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4 bg-indigo-50 border border-indigo-100 rounded-2xl px-3 py-2.5">
          <span className="text-xs font-bold text-indigo-500 flex items-center gap-1.5 shrink-0">
            <Filter size={12} /> Filter list by due date
          </span>
          <QuickDates
            value={dateFilter}
            onChange={(d) => setDateFilter(prev => prev === d ? null : d)}
            options={[
              { label: 'Today', date: todayStr },
              { label: 'Tomorrow', date: addDaysISO(1) },
              { label: 'In 3 Days', date: addDaysISO(3) },
              { label: 'Next Week', date: addDaysISO(7) },
            ]}
          />
        </div>

        <div className="space-y-2">
        {filteredTodos.map(todo => {
          const assigneeName = todo.assignee === 'shared' ? 'Shared' : users.find(u => u.id === todo.assignee)?.name;
          const assigneeColor = todo.assignee === 'u1' ? 'text-blue-500 bg-blue-50' : todo.assignee === 'u2' ? 'text-rose-500 bg-rose-50' : 'text-gray-500 bg-gray-100';
          const status = todo.status || (todo.completed ? 'done' : 'pending');
          let dateWarning = false;
          if (todo.dueDate && status === 'pending') { dateWarning = todo.dueDate <= todayStr; }
          if (editingId === todo.id) {
            return (
              <div
                key={todo.id}
                className="flex flex-col gap-3 p-3 md:p-4 rounded-2xl border bg-white border-gray-200 shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-3">
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
                <ImagePicker
                  images={editImages}
                  onAdd={(url) => setEditImages(prev => [...prev, url])}
                  onRemove={(url) => setEditImages(prev => prev.filter(u => u !== url))}
                  uploadingCount={editUploadingCount}
                  setUploadingCount={setEditUploadingCount}
                  uploadFn={uploadImage}
                />
              </div>
            );
          }
          const isWaiting = status === 'waiting';
          const isDone = status === 'done';
          return (
            <div key={todo.id} className={`flex items-center justify-between p-3 md:p-4 rounded-2xl border transition-all ${isDone ? 'bg-gray-50 border-gray-100 opacity-60' : isWaiting ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}>
              <div className="flex items-start md:items-center gap-3 md:gap-4 cursor-pointer flex-1 min-w-0" onClick={() => onSetStatus(todo.id, isDone ? 'pending' : 'done')}>
                <div title={isDone ? 'Done — click to mark pending' : 'Click to mark done'} className={`w-5 h-5 md:w-6 md:h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5 md:mt-0 ${isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                  {isDone && <CheckSquare size={14} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm md:text-base font-medium break-words ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>{todo.text}</span>
                  {todo.dueDate && (<span className={`text-[10px] md:text-xs font-medium flex items-center gap-1 mt-1 md:mt-0.5 ${dateWarning ? 'text-amber-600' : 'text-gray-400'}`}><Calendar size={10} /> {todo.dueDate} {dateWarning && '(Due!)'}</span>)}
                  {(todo.images || []).length > 0 && (() => {
                    const imgs = todo.images;
                    const shownImgs = imgs.slice(0, 3);
                    const overflow = imgs.length - shownImgs.length;
                    return (
                      <div className="flex gap-1.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
                        {shownImgs.map((url, i) => (
                          <button
                            key={url}
                            onClick={() => setLightbox({ images: imgs, index: i })}
                            className="w-10 h-10 rounded-lg overflow-hidden shrink-0 block border border-gray-200"
                          >
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                        {overflow > 0 && (
                          <button
                            onClick={() => setLightbox({ images: imgs, index: shownImgs.length })}
                            className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0"
                          >
                            +{overflow}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-md text-center ${assigneeColor}`}>{assigneeName}</span>
                {!isDone && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSetStatus(todo.id, isWaiting ? 'pending' : 'waiting'); }}
                    className={`p-1 transition-colors ${isWaiting ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}
                    title={isWaiting ? 'Waiting — click to unmark' : 'Mark as waiting'}
                  >
                    <Clock size={16} />
                  </button>
                )}
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
                    const hasImages = (todo.images || []).length > 0;
                    const ok = await confirmDialog({
                      title: 'Delete task?',
                      message: hasImages
                        ? `"${todo.text}" and its attached images will be removed for both of you.`
                        : `"${todo.text}" will be removed for both of you.`,
                    });
                    if (ok) {
                      onDelete(todo.id);
                      toast('Task deleted');
                      if (isCloudEnabled) {
                        for (const url of todo.images || []) {
                          db.deleteTodoImage(url);
                        }
                      }
                    }
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

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox(prev => ({ ...prev, index: i }))}
        />
      )}
    </div>
  );
}
