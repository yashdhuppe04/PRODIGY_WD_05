import {
  fetchCurrentByCity,
  fetchForecastByCity,
  fetchCurrentByCoords,
  fetchForecastByCoords,
  API_KEY,
} from "./api.js";

import {
  setLoading,
  setError,
  renderNowCard,
  render5DayForecast,
  renderHourlyTrend,
  renderWindCard,
  renderHumidityCard,
  renderInsight,
  renderHiLoFromForecast,
} from "./ui.js";

import { initGlobe } from "./globe.js";

const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const geoBtn = document.getElementById("geo-btn");

let lastRequestAt = 0;

function guardRapidRequests() {
  const now = Date.now();
  if (now - lastRequestAt < 800) return false;
  lastRequestAt = now;
  return true;
}

function requireApiKey() {
  if (!API_KEY || API_KEY.includes("PASTE_YOUR_OPENWEATHER_KEY_HERE")) {
    setError('Add your OpenWeather API key in "api.js" (API_KEY).');
    return false;
  }
  return true;
}

async function loadByCity(city) {
  if (!requireApiKey()) return;
  if (!city || !city.trim()) {
    setError("Type a city name.");
    return;
  }
  if (!guardRapidRequests()) return;

  setError("");
  setLoading(true);

  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentByCity(city),
      fetchForecastByCity(city),
    ]);

    renderNowCard(current);
    render5DayForecast(forecast);
    renderHourlyTrend(forecast);
    renderHiLoFromForecast(forecast);
    renderWindCard(current);
    renderHumidityCard(current);
    renderInsight(current);
  } catch (e) {
    setError(e?.message || "Something went wrong.");
  } finally {
    setLoading(false);
  }
}

async function loadByCoords(lat, lon) {
  if (!requireApiKey()) return;
  if (!guardRapidRequests()) return;

  setError("");
  setLoading(true);

  try {
    const [current, forecast] = await Promise.all([
      fetchCurrentByCoords(lat, lon),
      fetchForecastByCoords(lat, lon),
    ]);

    renderNowCard(current);
    render5DayForecast(forecast);
    renderHourlyTrend(forecast);
    renderHiLoFromForecast(forecast);
    renderWindCard(current);
    renderHumidityCard(current);
    renderInsight(current);
  } catch (e) {
    setError(e?.message || "Unable to fetch by location.");
  } finally {
    setLoading(false);
  }
}

function wireEvents() {
  searchBtn.addEventListener("click", () => loadByCity(cityInput.value));

  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadByCity(cityInput.value);
  });

  geoBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        loadByCoords(latitude, longitude);
      },
      () =>
        setError(
          "Unable to access your location. Allow permission or search by city.",
        ),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

function initTheme() {
  const themeBtn = document.getElementById("theme-btn");
  const themes = ["ocean", "sunset", "midnight"];

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("skycast-theme", theme);
    if (themeBtn)
      themeBtn.textContent = theme[0].toUpperCase() + theme.slice(1);
  }

  const saved = localStorage.getItem("skycast-theme");
  applyTheme(saved && themes.includes(saved) ? saved : "ocean");

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current =
        document.documentElement.getAttribute("data-theme") || "ocean";
      const next = themes[(themes.indexOf(current) + 1) % themes.length];
      applyTheme(next);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initGlobe();
  wireEvents();

  // Theme must be initialized after DOM exists
  initTheme();

  // Default load
  loadByCity("Pune");
});
