import { useState, useEffect } from 'react';
import { useRef } from 'react';
import { TrendingDown, User, Bell, Trash2, Smartphone, CheckCircle2, Download, Banknote, Plus, MapPin, Camera, Loader2 } from 'lucide-react';
import { notificationSupport, requestNotificationPermission, showSystemNotification, getNotifyTime, setNotifyTime, enableBackgroundCheck } from '../notifications';
import { canInstall, isInstalled, promptInstall, onInstallChange, getInstallSteps } from '../install';
import { checkForUpdates, hasPendingUpdate, BUILD_VERSION } from '../updater';
import { confirmDialog, toast } from '../ui';
import { isCloudEnabled } from '../lib/supabase';
import { timeAgo } from '../lib/geo';
import { compressImage } from '../lib/imageCompression';
import SelectMenu from './SelectMenu';
import QuickDates from './QuickDates';
import { todayISO, addDaysISO } from '../lib/dates';
import { CURRENCIES, TIMEZONES, formatMoney } from '../lib/currency';

// Circular avatar with camera-badge upload, shown per-person in Couple
// Profiles. Only the signed-in person can change their own picture.
function AvatarPicker({ user, name, colorClass, isEditable, onUpdateAvatar }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      await onUpdateAvatar(user.id, compressed);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative shrink-0">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
      ) : (
        <div className={`w-16 h-16 rounded-full ${colorClass} text-white flex items-center justify-center font-bold text-xl`}>
          {name.charAt(0) || '?'}
        </div>
      )}
      {isEditable && (
        <>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gray-800/70 text-white flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Change your photo"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          </button>
        </>
      )}
    </div>
  );
}

function ExtraIncome({ incomes, onAdd, onDelete, currentUser }) {
  const today = todayISO();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(today);

  const fm = (value) => formatMoney(value, currentUser.currency);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !source) return;
    onAdd({ amount: parseFloat(amount), source, date: date || today });
    toast('Income added');
    setAmount('');
    setSource('');
    setDate(today);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <Banknote size={20} className="md:w-6 md:h-6" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold">Extra Income — <span className={currentUser.text}>{currentUser.name}</span></h2>
          <p className="text-gray-500 text-xs md:text-sm">Bonus, freelance, gifts — anything besides your base income. Counted into that month's totals on the dashboard.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-5">
        <input type="number" step="0.01" min="0" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full sm:w-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
        <input type="text" placeholder="Source (e.g. freelance project, bonus)" value={source} onChange={(e) => setSource(e.target.value)} className="w-full sm:flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full sm:w-44 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-gray-600" />
        <button type="submit" className="w-full sm:w-auto bg-emerald-600 text-white rounded-xl px-6 py-3 font-medium hover:bg-emerald-700 transition-colors active:scale-95 text-sm shrink-0 flex items-center justify-center gap-2">
          <Plus size={16} /> Add
        </button>
      </form>
      <div className="mb-5 -mt-2">
        <QuickDates
          value={date}
          onChange={setDate}
          options={[
            { label: 'Today', date: today },
            { label: 'Yesterday', date: addDaysISO(-1) },
          ]}
        />
      </div>

      {incomes.length > 0 ? (
        <div className="space-y-2">
          {incomes.map(income => (
            <div key={income.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">{income.source}</p>
                <p className="text-xs text-gray-400">{income.date}</p>
              </div>
              <span className="font-bold text-sm text-emerald-600 shrink-0">+{fm(income.amount)}</span>
              <button
                onClick={async () => {
                  const ok = await confirmDialog({ title: 'Delete income?', message: `"${income.source}" (${fm(income.amount)}) will be removed from this month's totals.` });
                  if (ok) { onDelete(income.id); toast('Income deleted'); }
                }}
                className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0"
                title="Delete income"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No extra income recorded yet.</p>
      )}
    </div>
  );
}

function InstallApp() {
  const [installed, setInstalled] = useState(isInstalled());
  const [available, setAvailable] = useState(canInstall());
  const [checking, setChecking] = useState(false);

  const handleCheckUpdates = async () => {
    setChecking(true);
    await checkForUpdates();
    // give the browser a moment to fetch and compare the new version
    setTimeout(() => {
      setChecking(false);
      if (!hasPendingUpdate()) {
        toast("You're on the latest version.", 'info');
      }
      // if an update exists, the blue Update banner appears automatically
    }, 2500);
  };

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
      ) : (
        <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="font-semibold text-gray-700 mb-1">How to install in this browser:</p>
          <p>{getInstallSteps()}</p>
          <p className="text-xs text-gray-400 mt-2">Some browsers (Safari, Firefox) don't allow websites to start the install automatically — these are the manual steps for yours.</p>
        </div>
      )}

      <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-xs text-gray-400 sm:flex-1">App version: <span className="font-semibold text-gray-500">{BUILD_VERSION}</span></p>
        <button onClick={handleCheckUpdates} disabled={checking} className="w-full sm:w-auto bg-gray-100 text-gray-700 font-medium py-2.5 px-5 rounded-xl hover:bg-gray-200 transition-colors text-sm disabled:opacity-50">
          {checking ? 'Checking…' : 'Check for Updates'}
        </button>
      </div>
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

  const handleReset = async (range) => {
    const expCount = expenses.filter(e => e.date >= range.start && e.date <= range.end).length;
    const todoCount = todos.filter(t => t.dueDate && t.dueDate >= range.start && t.dueDate <= range.end).length;
    if (expCount + todoCount === 0) {
      toast(`No records found for ${range.label.toLowerCase()}.`, 'info');
      return;
    }
    const confirmed = await confirmDialog({
      title: `Reset ${range.label.toLowerCase()}?`,
      message: `${expCount} expense(s) and ${todoCount} task(s) dated ${range.start} to ${range.end} will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Delete All',
    });
    if (confirmed) {
      onReset(range.start, range.end);
      toast(`Deleted ${expCount + todoCount} record(s)`);
    }
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

function NotificationSettings({ onEnablePush }) {
  const [status, setStatus] = useState(notificationSupport());
  const [checkTime, setCheckTime] = useState(getNotifyTime());

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setStatus(result);
    if (result === 'granted') {
      enableBackgroundCheck();
      if (onEnablePush) await onEnablePush();
      showSystemNotification('DuoHub notifications enabled', "You'll get chat messages and due-task alerts here.");
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
          <p className="text-gray-500 text-xs md:text-sm">Get chat messages and due-task alerts in your phone's notification bar — even when the app is closed.</p>
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

function LocationSharing({ currentUser, partner, onToggleShareLocation, onRefreshLocation }) {
  const [busy, setBusy] = useState(false);
  const supported = !!navigator.geolocation && isCloudEnabled;

  const handleToggle = async () => {
    setBusy(true);
    try {
      await onToggleShareLocation(!currentUser.shareLocation);
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateNow = async () => {
    setBusy(true);
    try {
      const ok = await onRefreshLocation();
      if (ok) toast('Location updated 📍');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
          <MapPin size={20} className="md:w-6 md:h-6" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold">Location Sharing 💕</h2>
          <p className="text-gray-500 text-xs md:text-sm">Share your GPS location so {partner.name} can see where you are.</p>
        </div>
      </div>

      {!supported ? (
        <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
          {isCloudEnabled ? 'Location sharing is not supported in this browser.' : 'Location sharing needs the database to be connected.'}
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggle}
              disabled={busy}
              className={`w-12 h-7 rounded-full transition-colors relative shrink-0 active:scale-95 disabled:opacity-50 ${currentUser.shareLocation ? 'bg-rose-500' : 'bg-gray-200'}`}
              title={currentUser.shareLocation ? 'Turn off location sharing' : 'Turn on location sharing'}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${currentUser.shareLocation ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm font-medium text-gray-700">Share my location with {partner.name}</span>
          </div>

          {currentUser.shareLocation && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 sm:flex-1">
                Last updated {timeAgo(currentUser.locationUpdatedAt)}
                {currentUser.locationAccuracy != null && ` · ±${Math.round(currentUser.locationAccuracy)} m`}
              </p>
              <button
                onClick={handleUpdateNow}
                disabled={busy}
                className="w-full sm:w-auto bg-rose-50 text-rose-600 border border-rose-200 font-bold py-2.5 px-5 rounded-xl hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-colors text-sm disabled:opacity-50"
              >
                Update now 📍
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            {partner.name} is {partner.shareLocation ? 'sharing ✓' : 'not sharing yet'}
          </p>
        </>
      )}
    </div>
  );
}

export default function Profile({ users, currentUser, partner, onUpdateProfile, monthlyPlans, onUpdatePlan, availableMonths, currentMonthStr, expenses, todos, onReset, incomes, onAddIncome, onDeleteIncome, onToggleShareLocation, onRefreshLocation, onUpdateAvatar, onEnablePush }) {
  const [u1Name, setU1Name] = useState(users[0].name);
  const [u2Name, setU2Name] = useState(users[1].name);
  const [u1Currency, setU1Currency] = useState(users[0].currency || 'USD');
  const [u2Currency, setU2Currency] = useState(users[1].currency || 'USD');
  const [u1Timezone, setU1Timezone] = useState(users[0].timezone || 'Asia/Colombo');
  const [u2Timezone, setU2Timezone] = useState(users[1].timezone || 'Asia/Shanghai');

  useEffect(() => {
    setU1Name(users[0].name);
    setU2Name(users[1].name);
    setU1Currency(users[0].currency || 'USD');
    setU2Currency(users[1].currency || 'USD');
    setU1Timezone(users[0].timezone || 'Asia/Colombo');
    setU2Timezone(users[1].timezone || 'Asia/Shanghai');
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
    onUpdateProfile({ name: u1Name, currency: u1Currency, timezone: u1Timezone }, { name: u2Name, currency: u2Currency, timezone: u2Timezone });
    toast('Profiles updated');
  };

  const handlePlanSubmit = (e) => {
    e.preventDefault();
    onUpdatePlan(planMonth, income, targetSavings);
    toast(`Plan saved for ${planMonth}`);
  };

  return (
    <div className="space-y-6">
      <InstallApp />

      <NotificationSettings onEnablePush={onEnablePush} />

      <LocationSharing currentUser={currentUser} partner={partner} onToggleShareLocation={onToggleShareLocation} onRefreshLocation={onRefreshLocation} />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingDown size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold">Monthly Financial Plan — <span className={currentUser.text}>{currentUser.name}</span></h2>
            <p className="text-gray-500 text-xs md:text-sm">Sets {currentUser.name}'s own income and savings target. Switch the person at the top to set the other one.</p>
          </div>
        </div>

        <form onSubmit={handlePlanSubmit} className="space-y-4 md:space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <label className="font-semibold text-gray-700 w-full sm:w-32 shrink-0 text-sm md:text-base">Select Month</label>
            <SelectMenu
              className="w-full sm:flex-1"
              value={planMonth}
              onChange={setPlanMonth}
              options={availableMonths.map(m => ({ value: m, label: m }))}
            />
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

      <ExtraIncome incomes={incomes} onAdd={onAddIncome} onDelete={onDeleteIncome} currentUser={currentUser} />

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
                <AvatarPicker user={users[0]} name={u1Name} colorClass="bg-blue-500" isEditable={currentUser.id === users[0].id} onUpdateAvatar={onUpdateAvatar} />
                <input type="text" value={u1Name} onChange={(e) => setU1Name(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <label className="font-semibold text-gray-700 block text-sm md:text-base pt-2">Person 1 Currency</label>
              <SelectMenu
                value={u1Currency}
                onChange={setU1Currency}
                options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} — ${c.label}` }))}
              />
              <label className="font-semibold text-gray-700 block text-sm md:text-base pt-2">Person 1 Timezone</label>
              <SelectMenu
                value={u1Timezone}
                onChange={setU1Timezone}
                options={TIMEZONES.map(t => ({ value: t.tz, label: t.label }))}
              />
            </div>
            <div className="space-y-2">
              <label className="font-semibold text-gray-700 block text-sm md:text-base">Person 2 Name</label>
              <div className="flex items-center gap-3">
                <AvatarPicker user={users[1]} name={u2Name} colorClass="bg-rose-500" isEditable={currentUser.id === users[1].id} onUpdateAvatar={onUpdateAvatar} />
                <input type="text" value={u2Name} onChange={(e) => setU2Name(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm" />
              </div>
              <label className="font-semibold text-gray-700 block text-sm md:text-base pt-2">Person 2 Currency</label>
              <SelectMenu
                value={u2Currency}
                onChange={setU2Currency}
                options={CURRENCIES.map(c => ({ value: c.code, label: `${c.code} — ${c.label}` }))}
              />
              <label className="font-semibold text-gray-700 block text-sm md:text-base pt-2">Person 2 Timezone</label>
              <SelectMenu
                value={u2Timezone}
                onChange={setU2Timezone}
                options={TIMEZONES.map(t => ({ value: t.tz, label: t.label }))}
              />
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
