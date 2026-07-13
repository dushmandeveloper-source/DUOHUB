// Open-Meteo current weather — free, no API key.
// Cached in-memory for 30 minutes so tab switches don't refetch.

const CACHE_TTL_MS = 30 * 60 * 1000;
let cache = null; // { key, data, fetchedAt }

// WMO weather_code -> { emoji, label }. is_day picks a moon for clear/partly
// clear nights instead of the sun.
function codeToWeather(code, isDay) {
  if (code === 0) return isDay ? { emoji: '☀️', label: 'clear' } : { emoji: '🌙', label: 'clear' };
  if (code === 1 || code === 2) return isDay ? { emoji: '⛅', label: 'partly cloudy' } : { emoji: '🌙', label: 'partly cloudy' };
  if (code === 3) return { emoji: '☁️', label: 'overcast' };
  if (code >= 45 && code <= 48) return { emoji: '🌫️', label: 'foggy' };
  if (code >= 51 && code <= 57) return { emoji: '🌦️', label: 'drizzling' };
  if (code >= 61 && code <= 67) return { emoji: '🌧️', label: 'raining' };
  if (code >= 71 && code <= 77) return { emoji: '❄️', label: 'snowing' };
  if (code >= 80 && code <= 82) return { emoji: '🌧️', label: 'raining' };
  if (code >= 85 && code <= 86) return { emoji: '❄️', label: 'snowing' };
  if (code >= 95 && code <= 99) return { emoji: '⛈️', label: 'thundering' };
  return { emoji: '🌤️', label: 'mild' };
}

export async function fetchWeather(lat, lng) {
  const key = `${lat},${lng}`;
  if (cache && cache.key === key && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('weather request failed');
    const json = await res.json();
    const current = json.current;
    if (!current) throw new Error('no current weather in response');
    const { emoji, label } = codeToWeather(current.weather_code, current.is_day === 1);
    const data = { temperature: Math.round(current.temperature_2m), emoji, label };
    cache = { key, data, fetchedAt: Date.now() };
    return data;
  } catch {
    return null;
  }
}
