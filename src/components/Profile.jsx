import { useState, useEffect } from 'react';
import { TrendingDown, User, Bell, Trash2, Smartphone, CheckCircle2, Download } from 'lucide-react';
import { notificationSupport, requestNotificationPermission, showSystemNotification, getNotifyTime, setNotifyTime, enableBackgroundCheck } from '../notifications';
import { canInstall, isInstalled, isIOS, promptInstall, onInstallChange } from '../install';
import { CURRENCIES } from '../lib/currency';

function InstallApp() {
  const [installed, setInstalled] = useState(isInstalled());
  const [available, setAvailable] = useState(canInstall());

  useEffect(() => {
    const update = () => {
      setInstalled(isInstalled());
      setAvailable(canInstall());
    };
    const unsubscribe = onInstallChange(update);
    update();
    return unsubscribe;
  }, []);

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') setInstalled(true);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <Smartphone size={20} className="md:w-6 md:h-6" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold">Install App</h2>
          <p className="text-gray-500 text-xs md:text-sm">Add DuoHub to your home screen like a normal app.</p>
        </div>
      </div>

      {installed ? (
        <span className="inline-flex items-center gap-2 text-sm font-bold text-green-700 bg-green-100 px-4 py-2.5 rounded-xl">
          <CheckCircle2 size={16} /> Installed
        </span>
      ) : available ? (
        <button onClick={handleInstall} className="w-full sm:w-auto bg-indigo-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm flex items-center justify-center gap-2">
          <Download size={16} /> Install Now
        </button>
      ) : isIOS() ? (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="font-semibold text-gray-700 mb-1">To install on iPhone:</p>
          <p>Open this site in <strong>Safari</strong>, tap the <strong>Share</strong> button, then choose <strong>"Add to Home Screen"</strong>. Apple does not allow apps to trigger this automatically.</p>
        </div>
      ) : (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="font-semibold text-gray-700 mb-1">Install option not available right now.</p>
          <p>Use <strong>Chrome</strong> and open the browser menu (⋮) → <strong>"Add to Home screen"</strong> / <strong>"Install app"</strong>. If you just opened the page, wait a few seconds and revisit this tab — the button appears once the browser allows it.</p>
        </div>
      )}
    </div>
  );
}

function ResetRecords({ expenses, todos, onReset }) {
  const pad = (n) => String(n).padStart(2, '0');
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const ranges = [
    { label: 'Today', start: toISO(now), end: toISO(now) },
    { label: 'This Week', start: toISO(monday), end: toISO(sunday) },
    { label: 'This Month', start: toISO(new Date(now.getFullYear(), now.getMonth(), 1)), end: toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0)) },
  ];

  const handleReset = (range) => {
    const expCount = expenses.filter(e => e.date >= range.start && e.date <= range.end).length;
    const todoCount = todos.filter(t => t.dueDate && t.dueDate >= range.start && t.dueDate <= range.end).length;
    if (expCount + todoCount === 0) {
      window.alert(`No records found for ${range.label.toLowerCase()}.`);
      return;
    }
    const confirmed = window.confirm(
      `Delete ${expCount} expense(s) and ${todoCount} task(s) dated ${range.start} to ${range.end}?\n\nThis cannot be undone.`
    );
    if (confirmed) onReset(range.start, range.end);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-5 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
          <Trash2 size={20} className="md:w-6 md:h-6" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold">Reset Records</h2>
          <p className="text-gray-500 text-xs md:text-sm">Permanently delete all expenses and due-dated tasks for a period.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {ranges.map(range => (
          <button
            key={range.label}
            onClick={() => handleReset(range)}
            className="w-full sm:flex-1 bg-red-50 text-red-600 border border-red-200 font-bold py-3 px-4 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors text-sm"
          >
            {range.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] md:text-xs text-gray-400 mt-4">
        You will be asked to confirm before anything is deleted. Deletions sync to the database and cannot be undone.
      </p>
    </div>
  );
}

function NotificationSettings() {
  const [status, setStatus] = useState(notificationSupport());
  const [checkTime, setCheckTime] = useState(getNotifyTime());

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setStatus(result);
    if (result === 'granted') {
      enableBackgroundCheck();
      showSystemNotification('DuoHub notifications enabled', "You'll get an alert here when tasks are due.");
    }
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    if (!time) return;
    setCheckTime(time);
    setNotifyTime(time);
  };

  const statusInfo = {
    unsupported: { text: 'Not supported in this browser.', color: 'text-gray-500 bg-gray-100' },
    granted: { text: 'Enabled', color: 'text-green-700 bg-green-100' },
    denied: { text: 'Blocked — allow notifications for this site in your browser/phone settings.', color: 'text-red-700 bg-red-50' },
    default: { text: 'Off', color: 'text-gray-500 bg-gray-100' },
  }[status];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
          <Bell size={20} className="md:w-6 md:h-6" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold">Device Notifications</h2>
          <p className="text-gray-500 text-xs md:text-sm">Get due-task alerts in your phone's notification bar.</p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className={`text-xs font-bold px-3 py-2 rounded-xl ${statusInfo.color}`}>{statusInfo.text}</span>
        {status === 'default' && (
          <button onClick={handleEnable} className="w-full sm:w-auto bg-amber-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-amber-600 transition-colors shadow-sm text-sm">
            Enable Notifications
          </button>
        )}
        {status === 'granted' && (
          <button onClick={() => showSystemNotification('DuoHub test', 'This is how due-task alerts will look.')} className="w-full sm:w-auto bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors text-sm">
            Send Test
          </button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-5 pt-5 border-t border-gray-100">
        <label className="font-semibold text-gray-700 text-sm md:text-base sm:w-48 shrink-0">Daily check time</label>
        <input type="time" value={checkTime} onChange={handleTimeChange} className="w-full sm:w-40 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-gray-700" />
        <p className="text-xs text-gray-400 sm:flex-1">Due-task alerts fire after this time each day (this device).</p>
      </div>
      <p className="text-[11px] md:text-xs text-gray-400 mt-4">
        Alerts fire while the app is open or installed on your home screen. On Android, installing the app also enables background checks so alerts arrive even when the app is closed. On iPhone, install the app to your home screen first (iOS 16.4+).
      </p>
    </div>
  );
}

export default function Profile({ users, onUpdateProfile, monthlyPlans, onUpdatePlan, availableMonths, currentMonthStr, expenses, todos, onReset }) {
  const [u1Name, setU1Name] = useState(users[0].name);
  const [u2Name, setU2Name] = useState(users[1].name);
  const [u1Currency, setU1Currency] = useState(users[0].currency || 'USD');
  const [u2Currency, setU2Currency] = useState(users[1].currency || 'USD');

  useEffect(() => {
    setU1Name(users[0].name);
    setU2Name(users[1].name);
    setU1Currency(users[0].currency || 'USD');
    setU2Currency(users[1].currency || 'USD');
  }, [users]);

  const [planMonth, setPlanMonth] = useState(currentMonthStr);
  const [income, setIncome] = useState(monthlyPlans[planMonth]?.income ?? '');
  const [targetSavings, setTargetSavings] = useState(monthlyPlans[planMonth]?.targetSavings ?? '');

  useEffect(() => {
    const plan = monthlyPlans[planMonth] || { income: '', targetSavings: '' };
    setIncome(plan.income);
    setTargetSavings(plan.targetSavings);
  }, [planMonth, monthlyPlans]);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    onUpdateProfile({ name: u1Name, currency: u1Currency }, { name: u2Name, currency: u2Currency });
  };

  const handlePlanSubmit = (e) => {
    e.preventDefault();
    onUpdatePlan(planMonth, income, targetSavings);
  };

  return (
    <div className="space-y-6">
      <InstallApp />

      <NotificationSettings />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingDown size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold">Monthly Financial Plan</h2>
            <p className="text-gray-500 text-xs md:text-sm">Set your income and savings target for a specific month.</p>
          </div>
        </div>

        <form onSubmit={handlePlanSubmit} className="space-y-4 md:space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <label className="font-semibold text-gray-700 w-full sm:w-32 shrink-0 text-sm md:text-base">Select Month</label>
            <select value={planMonth} onChange={(e) => setPlanMonth(e.target.value)} className="w-full sm:flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm">
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <label className="font-semibold text-gray-700 w-full sm:w-32 shrink-0 text-sm md:text-base">Total Income</label>
            <div className="relative w-full sm:flex-1">
              <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder="e.g. 6000" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <label className="font-semibold text-gray-700 w-full sm:w-32 shrink-0 text-sm md:text-base">Target Savings</label>
            <div className="relative w-full sm:flex-1">
              <input type="number" value={targetSavings} onChange={(e) => setTargetSavings(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" placeholder="e.g. 1500" />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button type="submit" className="w-full sm:w-auto bg-green-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-green-600 transition-colors shadow-sm text-sm">Save Month Plan</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <User size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold">Couple Profiles</h2>
            <p className="text-gray-500 text-xs md:text-sm">Customize your display names.</p>
          </div>
        </div>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="font-semibold text-gray-700 block text-sm md:text-base">Person 1 Name</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shrink-0">{u1Name.charAt(0) || '1'}</div>
                <input type="text" value={u1Name} onChange={(e) => setU1Name(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <label className="font-semibold text-gray-700 block text-sm md:text-base pt-2">Person 1 Currency</label>
              <select value={u1Currency} onChange={(e) => setU1Currency(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-gray-700 block text-sm md:text-base">Person 2 Name</label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold shrink-0">{u2Name.charAt(0) || '2'}</div>
                <input type="text" value={u2Name} onChange={(e) => setU2Name(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" />
              </div>
              <label className="font-semibold text-gray-700 block text-sm md:text-base pt-2">Person 2 Currency</label>
              <select value={u2Currency} onChange={(e) => setU2Currency(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end border-t border-gray-100">
            <button type="submit" className="w-full sm:w-auto bg-gray-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-gray-800 transition-colors shadow-sm text-sm">Update Profiles</button>
          </div>
        </form>
      </div>

      <ResetRecords expenses={expenses} todos={todos} onReset={onReset} />
    </div>
  );
}
