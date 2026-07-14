// Sends a Web Push notification to the message recipient's devices.
// Triggered by a Supabase Database Webhook on INSERT into `messages`.
//
// Secrets required (supabase secrets set ...):
//   VAPID_PUBLIC_KEY  — same key the client uses (VITE_VAPID_PUBLIC_KEY)
//   VAPID_PRIVATE_KEY — never leaves Supabase
//   VAPID_SUBJECT     — mailto: contact, e.g. mailto:you@example.com
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:duohub@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

// Same preview logic as the in-app notifier, so foreground and push match.
function preview(record: { kind: string; body: string | null }) {
  if (record.kind === 'image') return '📷 Photo';
  if (record.kind === 'video') return '🎥 Video';
  return record.body ?? '';
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const payload = await req.json();
  if (payload.type !== 'INSERT' || payload.table !== 'messages' || !payload.record) {
    return new Response('Ignored', { status: 200 });
  }
  const record = payload.record;

  // The recipient is the one profile that isn't the sender (two-person app).
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name');
  if (profilesError) {
    return new Response(`profiles lookup failed: ${profilesError.message}`, { status: 500 });
  }
  const sender = profiles.find((p) => p.id === record.sender);
  const recipient = profiles.find((p) => p.id !== record.sender);
  if (!recipient) return new Response('No recipient', { status: 200 });

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', recipient.id);
  if (subsError) {
    return new Response(`subscriptions lookup failed: ${subsError.message}`, { status: 500 });
  }
  if (!subs?.length) return new Response('No subscriptions', { status: 200 });

  const notification = JSON.stringify({
    title: `💬 ${sender?.name ?? 'New message'}`,
    body: preview(record),
    tag: 'duohub-chat', // must match CHAT_NOTIFICATION_TAG in src/lib/notificationTags.js
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        )
        .catch(async (err: { statusCode?: number }) => {
          // 404/410 = subscription expired or revoked — drop the stale row.
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
          throw err;
        }),
    ),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return new Response(JSON.stringify({ sent, total: subs.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
