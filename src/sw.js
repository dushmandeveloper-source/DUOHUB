/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';
import { CHAT_NOTIFICATION_TAG } from './lib/notificationTags';

// Waits for the user to confirm the update (the app shows an Update banner),
// then the SKIP_WAITING message activates the new version.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Background due-task check — fires periodically (Android installed PWA).
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'duohub-due-check') {
    event.waitUntil(notifyDueTasks());
  }
});

// The app writes this device's person into the cache so background alerts
// only fire for their own and shared tasks.
async function getDeviceUser() {
  try {
    const cache = await caches.open('duohub-config');
    const res = await cache.match('/device-user');
    if (res) return (await res.json()).userId;
  } catch {
    // fall through
  }
  return null;
}

async function notifyDueTasks() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/todos?select=text,due_date,assignee&completed=eq.false&due_date=lte.${today}`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return;
    let tasks = await res.json();
    const userId = await getDeviceUser();
    if (userId) tasks = tasks.filter(t => t.assignee === 'shared' || t.assignee === userId);
    if (!tasks.length) return;
    await self.registration.showNotification('DuoHub — tasks need attention', {
      body: `Due/Overdue: ${tasks.map(t => t.text).join(', ')}`,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'duohub-due',
    });
  } catch {
    // offline or fetch failed — try again on the next sync
  }
}

// Web Push from the send-message-push Edge Function — wakes this device with
// a chat notification even when the app is fully closed.
self.addEventListener('push', (event) => {
  let payload = { title: 'DuoHub', body: 'New message 💬', tag: CHAT_NOTIFICATION_TAG };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    // non-JSON payload — fall back to the generic message
  }
  event.waitUntil((async () => {
    // If the app is focused, the in-app toast already covers it — don't pop
    // an OS banner on top of the conversation being read.
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clientList.some((c) => c.focused)) return;
    await self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag,
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    // Focus the already-open app if there is one; only open a new window otherwise.
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (clientList.length > 0) {
      await clientList[0].focus();
    } else {
      await self.clients.openWindow('/');
    }
  })());
});
