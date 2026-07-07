// System (device) notifications — shows in the OS notification bar.
// Permission is requested like any mobile app; on Android an installed PWA
// gets a native-style permission prompt and native-looking notifications.

const TIME_KEY = 'duohub:notifyTime';

// Daily check time, 'HH:MM' 24h format. Per device (each phone has its own).
export const getNotifyTime = () => localStorage.getItem(TIME_KEY) || '08:00';
export const setNotifyTime = (time) => localStorage.setItem(TIME_KEY, time);

export function notificationSupport() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export async function showSystemNotification(title, body, tag = 'duohub') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  const options = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag, // same tag replaces the previous notification instead of stacking
  };
  // Prefer the service worker (required on Android/installed PWAs)
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {
    // fall through to the plain Notification constructor
  }
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

// Registers a periodic background check so due-task alerts can fire even when
// the app is closed. Supported on Android Chrome when the app is installed to
// the home screen; the browser decides the exact timing (roughly daily).
export async function enableBackgroundCheck() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg && 'periodicSync' in reg) {
      await reg.periodicSync.register('duohub-due-check', {
        minInterval: 6 * 60 * 60 * 1000, // at most every ~6h, browser-controlled
      });
      return true;
    }
  } catch {
    // not supported or permission missing — in-app daily check still works
  }
  return false;
}
