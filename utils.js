export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function formatLocalDate(dtSeconds, tzOffsetSeconds = 0) {
  const ms = (dtSeconds + tzOffsetSeconds) * 1000;
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatLocalTime(dtSeconds, tzOffsetSeconds = 0) {
  const ms = (dtSeconds + tzOffsetSeconds) * 1000;
  const d = new Date(ms);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dateKey(dtSeconds, tzOffsetSeconds = 0) {
  const ms = (dtSeconds + tzOffsetSeconds) * 1000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function windDegToLabel(deg = 0) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round((deg % 360) / 45) % 8;
  return dirs[idx];
}

export function mapIconCode(iconCode = "") {
  const base = String(iconCode).slice(0, 2); // "01", "02", ...
  if (base === "01") return "sun";
  if (base === "02" || base === "03" || base === "04") return "cloud";
  if (base === "09" || base === "10") return "rain";
  if (base === "11") return "thunder";
  if (base === "13") return "snow";
  if (base === "50") return "mist";
  return "cloud";
}

export function pickDailyNoonItems(list = [], tzOffsetSeconds = 0) {
  const byDay = new Map();

  for (const item of list) {
    const k = dateKey(item.dt, tzOffsetSeconds);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(item);
  }

  const days = Array.from(byDay.keys()).sort();
  const targetHour = 12;

  const picked = [];
  for (const k of days) {
    const items = byDay.get(k);
    let best = items[0];
    let bestDiff = Infinity;

    for (const it of items) {
      const ms = (it.dt + tzOffsetSeconds) * 1000;
      const d = new Date(ms);
      const hour = d.getUTCHours();
      const diff = Math.abs(hour - targetHour);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = it;
      }
    }
    picked.push(best);
    if (picked.length >= 5) break;
  }

  return picked;
}

export function computeDailyMinMax(list = [], tzOffsetSeconds = 0) {
  const byDay = new Map();

  for (const item of list) {
    const k = dateKey(item.dt, tzOffsetSeconds);
    const t = item?.main?.temp;
    if (typeof t !== "number") continue;

    if (!byDay.has(k)) byDay.set(k, { min: t, max: t });
    const mm = byDay.get(k);
    mm.min = Math.min(mm.min, t);
    mm.max = Math.max(mm.max, t);
  }

  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([k, v]) => ({ dateKey: k, min: v.min, max: v.max }));
}

export function buildInsight({ temp, humidity, wind }) {
  const parts = [];

  if (typeof temp === "number") {
    if (temp <= 10) parts.push("Cool temperatures today");
    else if (temp <= 22) parts.push("Comfortable temperatures today");
    else if (temp <= 32) parts.push("Warm temperatures today");
    else parts.push("Hot conditions today");
  }

  if (typeof humidity === "number") {
    if (humidity < 35) parts.push("dry air");
    else if (humidity < 60) parts.push("comfortable humidity");
    else parts.push("humid air");
  }

  if (typeof wind === "number") {
    if (wind < 3) parts.push("light winds");
    else if (wind < 8) parts.push("moderate breeze");
    else parts.push("strong winds");
  }

  if (!parts.length) return "Search a location to generate an insight.";
  return parts.join(" with ") + ".";
}

export function windPhrase(speed = 0) {
  if (speed < 2) return "Calm";
  if (speed < 5) return "Light breeze";
  if (speed < 9) return "Moderate wind";
  if (speed < 14) return "Strong wind";
  return "Very strong wind";
}

export function humidityPhrase(rh = 0) {
  if (rh < 35) return "Dry";
  if (rh < 60) return "Comfortable";
  return "Humid";
}
