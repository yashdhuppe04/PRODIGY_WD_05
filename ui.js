import {
  formatLocalDate,
  formatLocalTime,
  mapIconCode,
  pickDailyNoonItems,
  computeDailyMinMax,
  windDegToLabel,
  windPhrase,
  humidityPhrase,
  buildInsight,
  clamp,
} from "./utils.js";

const el = (id) => document.getElementById(id);

const loadingEl = () => el("loading");
const statusPillEl = () => el("status-pill");
const errorMainEl = () => el("error-main");

function setPill(text) {
  const pill = statusPillEl();
  if (pill) pill.textContent = text;
}

export function setLoading(isLoading) {
  const l = loadingEl();
  if (!l) return;
  l.classList.toggle("show", Boolean(isLoading));
  l.setAttribute("aria-hidden", isLoading ? "false" : "true");
  setPill(isLoading ? "Loading" : "Ready");
}

export function setError(message = "") {
  const e = errorMainEl();
  if (!e) return;
  e.textContent = message ? `⚠ ${message}` : "";
  if (message) setPill("Error");
}

function renderAnimatedIcon(iconCode, mountEl) {
  if (!mountEl) return;
  const type = mapIconCode(iconCode);

  const div = document.createElement("div");
  div.className = `wx wx-${type}`;

  mountEl.innerHTML = "";
  mountEl.appendChild(div);
}

export function renderNowCard(current) {
  const name = current?.name ?? "—";
  const country = current?.sys?.country ?? "";
  const weather = current?.weather?.[0];
  const icon = weather?.icon ?? "";
  const desc = weather?.description ?? "—";

  const temp = current?.main?.temp;
  const feels = current?.main?.feels_like;
  const humidity = current?.main?.humidity;
  const pressure = current?.main?.pressure;
  const wind = current?.wind?.speed;
  const clouds = current?.clouds?.all;
  const visibility = current?.visibility;

  const tz = current?.timezone ?? 0;

  el("location-name").textContent = country ? `${name}, ${country}` : name;
  el("condition-text").textContent = desc;
  el("temp-now").textContent =
    typeof temp === "number" ? `${Math.round(temp)}°` : "—°";
  el("now-date").textContent = current?.dt
    ? formatLocalDate(current.dt, tz)
    : "—";

  renderAnimatedIcon(icon, el("now-icon"));

  el("m-feels").textContent =
    typeof feels === "number" ? `${Math.round(feels)}°` : "—";
  el("m-humidity").textContent =
    typeof humidity === "number" ? `${humidity}%` : "—";
  el("m-wind").textContent =
    typeof wind === "number" ? `${wind.toFixed(1)} m/s` : "—";
  el("m-pressure").textContent =
    typeof pressure === "number" ? `${pressure} hPa` : "—";
  el("m-visibility").textContent =
    typeof visibility === "number"
      ? `${Math.round(visibility / 1000)} km`
      : "—";
  el("m-clouds").textContent = typeof clouds === "number" ? `${clouds}%` : "—";
}

export function renderInsight(current) {
  const temp = current?.main?.temp;
  const humidity = current?.main?.humidity;
  const wind = current?.wind?.speed;
  el("insight-text").textContent = buildInsight({ temp, humidity, wind });
}

export function renderWindCard(current) {
  const speed = current?.wind?.speed;
  const deg = current?.wind?.deg ?? 0;
  const dir = windDegToLabel(deg);

  const arrow = el("wind-arrow");
  if (arrow) arrow.style.transform = `rotate(${deg}deg)`;

  el("wind-speed").textContent =
    typeof speed === "number" ? `${speed.toFixed(1)} m/s` : "—";
  el("wind-dir").textContent = `Direction: ${dir} (${Math.round(deg)}°)`;
  el("wind-phrase").textContent =
    typeof speed === "number" ? windPhrase(speed) : "—";
}

export function renderHumidityCard(current) {
  const rh = current?.main?.humidity;

  const wrap = el("humidity-bars");
  if (wrap) {
    wrap.innerHTML = "";
    const total = 8;
    const onCount =
      typeof rh === "number"
        ? clamp(Math.round((rh / 100) * total), 0, total)
        : 0;
    for (let i = 0; i < total; i++) {
      const seg = document.createElement("div");
      seg.className = `h-seg ${i < onCount ? "on" : ""}`;
      wrap.appendChild(seg);
    }
  }

  el("humidity-value").textContent = typeof rh === "number" ? `${rh}%` : "—";
  el("humidity-phrase").textContent =
    typeof rh === "number" ? humidityPhrase(rh) : "—";
}

export function render5DayForecast(forecastData) {
  const strip = el("forecast-strip");
  if (!strip) return;
  strip.innerHTML = "";

  const tz = forecastData?.city?.timezone ?? 0;
  const list = forecastData?.list ?? [];

  const noonItems = pickDailyNoonItems(list, tz);
  const minMax = computeDailyMinMax(list, tz);
  const mmMap = new Map(minMax.map((x) => [x.dateKey, x]));

  for (const item of noonItems) {
    const dt = item.dt;
    const dayLabel = formatLocalDate(dt, tz).split(",")[0]; // "Mon"
    const icon = item?.weather?.[0]?.icon ?? "";
    const desc = item?.weather?.[0]?.main ?? "—";

    const k = (() => {
      const ms = (dt + tz) * 1000;
      const d = new Date(ms);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    })();

    const mm = mmMap.get(k);
    const hi = mm
      ? Math.round(mm.max)
      : Math.round(item?.main?.temp_max ?? item?.main?.temp ?? 0);
    const lo = mm
      ? Math.round(mm.min)
      : Math.round(item?.main?.temp_min ?? item?.main?.temp ?? 0);

    const card = document.createElement("div");
    card.className = "f-card";

    const iconType = mapIconCode(icon);
    card.innerHTML = `
      <div class="f-day">${dayLabel}</div>
      <div class="f-mini">${desc}</div>
      <div class="f-row">
        <div class="wx wx-${iconType}" style="width:34px;height:34px;transform:scale(0.8);opacity:0.95"></div>
        <div class="f-mini">${hi}° / ${lo}°</div>
      </div>
    `;

    strip.appendChild(card);
  }
}

export function renderHourlyTrend(forecastData) {
  const wrap = el("hourly-trend");
  if (!wrap) return;
  wrap.innerHTML = "";

  const tz = forecastData?.city?.timezone ?? 0;
  const list = forecastData?.list ?? [];

  const subset = list.slice(0, 10);
  const temps = subset
    .map((x) => x?.main?.temp)
    .filter((t) => typeof t === "number");
  const max = temps.length ? Math.max(...temps) : 1;
  const min = temps.length ? Math.min(...temps) : 0;
  const span = Math.max(1, max - min);

  for (const item of subset) {
    const t = item?.main?.temp;
    const time = formatLocalTime(item.dt, tz);
    const pct = typeof t === "number" ? (t - min) / span : 0;
    const h = 16 + Math.round(pct * 52);

    const node = document.createElement("div");
    node.className = "h-item";
    node.innerHTML = `
      <div class="h-time">${time}</div>
      <div class="h-barwrap">
        <div class="h-bar" style="height:${h}px"></div>
      </div>
      <div class="h-temp">${typeof t === "number" ? Math.round(t) + "°" : "—"}</div>
    `;
    wrap.appendChild(node);
  }
}
export function renderHiLoFromForecast(forecastData) {
  const hiLoEl = document.getElementById("hi-lo");
  if (!hiLoEl) return;

  const tz = forecastData?.city?.timezone ?? 0;
  const list = forecastData?.list ?? [];
  if (!list.length) return;

  // Find min/max for the first day in forecast list
  const firstDayKey = (() => {
    const ms = (list[0].dt + tz) * 1000;
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  let min = Infinity,
    max = -Infinity;
  for (const item of list) {
    const ms = (item.dt + tz) * 1000;
    const d = new Date(ms);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    if (key !== firstDayKey) break;

    const t = item?.main?.temp;
    if (typeof t === "number") {
      min = Math.min(min, t);
      max = Math.max(max, t);
    }
  }

  if (min !== Infinity && max !== -Infinity) {
    hiLoEl.textContent = `H: ${Math.round(max)}° • L: ${Math.round(min)}°`;
  }
}
