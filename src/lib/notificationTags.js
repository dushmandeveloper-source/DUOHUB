// Shared by the app (notifications.js) and the service worker (sw.js).
// The send-message-push Edge Function (supabase/functions/send-message-push)
// runs in Deno and can't import this — its 'duohub-chat' literal must match.
// The OS collapses same-tag notifications, so the in-app notifier and a real
// push for the same message never stack as duplicates.
export const CHAT_NOTIFICATION_TAG = 'duohub-chat';
