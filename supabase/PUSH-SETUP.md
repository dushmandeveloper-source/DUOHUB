# Web Push setup (one-time)

Chat messages appear in the phone's notification bar even when the app is
fully closed. The code is in the repo; these infra steps wire it up.

## 1. Run the migration

Supabase Dashboard → SQL Editor → paste and run `migration-17.sql`
(creates the `push_subscriptions` table).

## 2. Deploy the Edge Function

Requires the Supabase CLI (`npm i -g supabase`, then `supabase login`):

```sh
supabase link --project-ref uliwrlfrnkdaakhdoimg
supabase functions deploy send-message-push
```

## 3. Set the function secrets

The VAPID keypair was generated with `npx web-push generate-vapid-keys`.
The public key is already in `.env.local` as `VITE_VAPID_PUBLIC_KEY`.

```sh
supabase secrets set VAPID_PUBLIC_KEY=<the public key from .env.local>
supabase secrets set VAPID_PRIVATE_KEY=<the private key>
supabase secrets set VAPID_SUBJECT=mailto:you@example.com
```

(The private key must never be committed or added to Vercel.)

## 4. Create the Database Webhook

Supabase Dashboard → Database → Webhooks → Create:

- Table: `messages`, Events: **INSERT** only
- Type: Supabase Edge Function → `send-message-push`
- Add HTTP header `Authorization: Bearer <your anon key>` so the function's
  JWT check accepts the call.

## 5. Add the env var to Vercel

Vercel → project `duohub-vu56` → Settings → Environment Variables:
`VITE_VAPID_PUBLIC_KEY` = the same public key, for Production + Preview.
Redeploy so the client build picks it up.

## 6. On each phone

Open DuoHub → Profile → Device Notifications → Enable Notifications
(devices that already granted permission re-subscribe automatically on the
next app open). On iPhone, the app must be added to the Home Screen first
(iOS 16.4+); Web Push does not work in plain Safari tabs.
