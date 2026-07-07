// System (device) notifications — shows in the OS notification bar.
// Works while the app is open or installed as a PWA. Notifications while the
// app is fully closed require Web Push from a server (planned with Supabase).

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
