// PWA install handling. Chrome/Edge (Android + desktop) fire
// `beforeinstallprompt`, which we capture so a button can trigger the
// install dialog later. iOS never fires it — installing there is only
// possible manually via Share -> Add to Home Screen.

let deferredPrompt = null;
const listeners = new Set();

const notify = () => listeners.forEach((fn) => fn());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // stop the mini-infobar; we trigger it from our button
  deferredPrompt = e;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  notify();
});

export const canInstall = () => Boolean(deferredPrompt);

export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true; // iOS home-screen app

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') deferredPrompt = null;
  notify();
  return outcome; // 'accepted' | 'dismissed'
}

export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
