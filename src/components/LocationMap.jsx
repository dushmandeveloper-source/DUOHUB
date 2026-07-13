import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { haversineKm, timeAgo } from '../lib/geo';

const EMOJI = { u1: '💙', u2: '💖' };

function makeIcon(user) {
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:40px;height:40px;border-radius:9999px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;">
        ${EMOJI[user.id] || '📍'}
      </div>
      <span style="background:#fff;border-radius:9999px;padding:1px 8px;font-size:10px;font-weight:700;color:#374151;box-shadow:0 1px 4px rgba(0,0,0,0.2);white-space:nowrap;">
        ${user.name}
      </span>
    </div>
  `;
  return L.divIcon({ html, className: '', iconSize: [40, 58], iconAnchor: [20, 46] });
}

function popupHtml(user) {
  let localTime = '';
  try {
    localTime = new Date(user.locationUpdatedAt).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: user.timezone,
    });
  } catch {
    localTime = '';
  }
  return `${user.name} · ${timeAgo(user.locationUpdatedAt)}${localTime ? ` · local time ${localTime}` : ''}`;
}

// Full-screen map modal showing both partners' shared GPS locations.
export default function LocationMap({ users, currentUser, live, onClose, onRefresh }) {
  const mapDivRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const lineRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  const partner = users.find(u => u.id !== currentUser.id) || users[1];

  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const map = L.map(mapDivRef.current, { zoomControl: true, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.setView([20, 90], 3);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};
    if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }

    const located = users.filter(u => u.lat != null && u.lng != null);
    located.forEach(u => {
      const marker = L.marker([u.lat, u.lng], { icon: makeIcon(u) }).addTo(map);
      marker.bindPopup(popupHtml(u));
      markersRef.current[u.id] = marker;
    });

    if (located.length === 2) {
      lineRef.current = L.polyline(
        located.map(u => [u.lat, u.lng]),
        { color: '#f43f5e', dashArray: '8 8', weight: 2 }
      ).addTo(map);
      map.fitBounds(L.latLngBounds(located.map(u => [u.lat, u.lng])), { padding: [48, 48] });
    } else if (located.length === 1) {
      map.setView([located[0].lat, located[0].lng], 10);
    } else {
      map.setView([20, 90], 3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.map(u => `${u.id}:${u.lat}:${u.lng}:${u.shareLocation}:${u.locationUpdatedAt}`).join('|')]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const located = users.filter(u => u.lat != null && u.lng != null);
  const bothLocated = located.length === 2;
  const missing = users.find(u => u.lat == null || u.lng == null);
  const distanceKm = bothLocated ? Math.round(haversineKm(located[0], located[1])) : null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-[popIn_0.15s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold text-gray-800">Where is {partner.name}? 💕</h2>
            {live && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {currentUser.shareLocation && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors p-2 rounded-full disabled:opacity-50"
                title="Refresh my location"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors p-2 rounded-full" title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-3 md:p-4">
          <div className="relative z-0 rounded-2xl overflow-hidden h-[55vh] min-h-[320px]">
            <div ref={mapDivRef} className="w-full h-full" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 shrink-0 text-sm">
          {bothLocated ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="font-bold text-rose-500">💞 {distanceKm.toLocaleString()} km apart</span>
              <span className="text-gray-400 text-xs">
                {users.map(u => `${u.name} updated ${timeAgo(u.locationUpdatedAt)}`).join(' · ')}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 text-xs md:text-sm">
              {missing?.name} hasn't shared a location yet 🥺 — ask them to turn on GPS in Profile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
