import { useEffect, useRef, useState } from 'react';
import { supabase, isCloudEnabled } from '../lib/supabase';

// Tracks whether the partner (the other fixed user) is currently active in
// the app, via Supabase Realtime Presence — no database writes involved.
// Backgrounding the tab (visibilitychange -> hidden) counts as "away".
// onPartnerCameOnline fires only on an offline->online transition (never on
// the initial load), so callers can toast it once.
export function usePresence(currentUserId, partnerId, onPartnerCameOnline) {
  const [partnerOnline, setPartnerOnline] = useState(false);
  const wasOnlineRef = useRef(false);
  const knownRef = useRef(false); // becomes true after the first sync, to skip the initial transition
  const onPartnerCameOnlineRef = useRef(onPartnerCameOnline);
  onPartnerCameOnlineRef.current = onPartnerCameOnline;

  useEffect(() => {
    if (!isCloudEnabled) return;
    wasOnlineRef.current = false;
    knownRef.current = false;

    const channel = supabase.channel('duohub-presence', {
      config: { presence: { key: currentUserId } },
    });

    const syncPresence = () => {
      const state = channel.presenceState();
      const online = Object.keys(state).includes(partnerId);
      setPartnerOnline(online);
      if (online && !wasOnlineRef.current && knownRef.current) {
        onPartnerCameOnlineRef.current?.();
      }
      wasOnlineRef.current = online;
      knownRef.current = true;
    };

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ userId: currentUserId });
        }
      });

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        channel.untrack();
      } else {
        channel.track({ userId: currentUserId });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [currentUserId, partnerId]);

  return partnerOnline;
}
