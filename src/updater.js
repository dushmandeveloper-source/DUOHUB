// App update handling. The service worker precaches the app for offline use,
// which means new deployments don't show until the worker updates. This
// module checks for updates every minute and exposes a prompt-to-update flow.
import { registerSW } from 'virtual:pwa-register';

const listeners = new Set();
let pending = false;

const updateServiceWorker = registerSW({
  onNeedRefresh() {
    pending = true;
    listeners.forEach((fn) => fn());
  },
  onRegisteredSW(_url, registration) {
    if (registration) {
      // Poll for a new deployment every minute while the app is open
      setInterval(() => registration.update().catch(() => {}), 60 * 1000);
    }
  },
});

export function onUpdateAvailable(fn) {
  listeners.add(fn);
  if (pending) fn();
  return () => listeners.delete(fn);
}

export const hasPendingUpdate = () => pending;

// Activates the new version and reloads the page
export function applyUpdate() {
  updateServiceWorker(true);
}

export async function checkForUpdates() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
  } catch {
    // offline or unsupported — nothing to do
  }
}

export const BUILD_VERSION = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'development';
