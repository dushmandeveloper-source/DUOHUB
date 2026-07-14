// System (device) notifications — shows in the OS notification bar.
// Permission is requested like any mobile app; on Android an installed PWA
// gets a native-style permission prompt and native-looking notifications.

import { CHAT_NOTIFICATION_TAG } from './lib/notificationTags';

const TIME_KEY = 'duohub:notifyTime';

export { CHAT_NOTIFICATION_TAG };

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

// Web Push: lets the server wake this device with a notification even when
// the app/browser is fully closed. Needs the VAPID public key at build time;
// the resulting subscription is persisted to Supabase by the caller.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  if (Notification.permission !== 'granted') return null;
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) return null;
  // getRegistration(), not .ready — .ready never settles when no service
  // worker is registered (e.g. `npm run dev`, where the PWA plugin is build-only),
  // which would leave callers awaiting forever with no error.
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return null;
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  // A subscription made under an old VAPID key can't be reused — subscribe()
  // rejects on key mismatch — so drop it and re-subscribe with the current key.
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    const oldKey = existing.options?.applicationServerKey
      ? new Uint8Array(existing.options.applicationServerKey)
      : null;
    const sameKey = oldKey && oldKey.length === applicationServerKey.length
      && oldKey.every((b, i) => b === applicationServerKey[i]);
    if (sameKey) return existing.toJSON();
    await existing.unsubscribe();
  }
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
  return sub.toJSON(); // { endpoint, keys: { p256dh, auth } }
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
