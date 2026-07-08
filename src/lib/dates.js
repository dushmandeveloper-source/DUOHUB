const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => toISODate(new Date());

export const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};
