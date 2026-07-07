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

// Per-browser manual install steps, for browsers that don't allow websites
// to trigger the install dialog (Safari and Firefox forbid it by policy;
// Chrome, Edge, Samsung Internet and Opera support the automatic button).
export function getInstallSteps() {
  const ua = navigator.userAgent.toLowerCase();
  if (isIOS()) {
    return 'Open this site in Safari, tap the Share button (square with arrow), then choose "Add to Home Screen".';
  }
  if (ua.includes('firefox')) {
    return 'Tap the menu (⋮ or ≡), then choose "Add to Home screen" (Android). Firefox on computer does not support installing apps — use Chrome or Edge there.';
  }
  if (ua.includes('samsungbrowser')) {
    return 'Tap the menu (≡), then "Add page to" → "Home screen". Or wait a moment — the Install button usually appears here in Samsung Internet.';
  }
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return 'In Safari on Mac: File menu → "Add to Dock". On iPhone: Share button → "Add to Home Screen".';
  }
  return 'Open the browser menu (⋮) and choose "Install app" or "Add to Home screen". If you just opened the page, wait a few seconds — the Install button appears here once the browser allows it.';
}
