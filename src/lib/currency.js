export const CURRENCIES = [
  { code: 'LKR', label: 'Sri Lankan Rupee (Rs)' },
  { code: 'CNY', label: 'Chinese Yuan (¥)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'SGD', label: 'Singapore Dollar (S$)' },
  { code: 'AED', label: 'UAE Dirham (د.إ)' },
];

export const TIMEZONES = [
  { tz: 'Asia/Colombo', label: 'Sri Lanka (Colombo)' },
  { tz: 'Asia/Shanghai', label: 'China (Shanghai)' },
  { tz: 'Asia/Kolkata', label: 'India (Kolkata)' },
  { tz: 'Asia/Dubai', label: 'UAE (Dubai)' },
  { tz: 'Asia/Singapore', label: 'Singapore' },
  { tz: 'Asia/Tokyo', label: 'Japan (Tokyo)' },
  { tz: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { tz: 'Europe/London', label: 'United Kingdom (London)' },
  { tz: 'Europe/Paris', label: 'France (Paris)' },
  { tz: 'Europe/Berlin', label: 'Germany (Berlin)' },
  { tz: 'America/New_York', label: 'US Eastern (New York)' },
  { tz: 'America/Los_Angeles', label: 'US Pacific (Los Angeles)' },
  { tz: 'America/Chicago', label: 'US Central (Chicago)' },
  { tz: 'Australia/Sydney', label: 'Australia (Sydney)' },
  { tz: 'Pacific/Auckland', label: 'New Zealand (Auckland)' },
  { tz: 'UTC', label: 'UTC' },
];

export function formatMoney(amount, currency = 'USD') {
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}
