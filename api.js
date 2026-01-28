export const API_KEY = "43dc72cb3a9aaa11796da51f337eba65";
export const BASE_URL = "https://api.openweathermap.org/data/2.5";

async function requestJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.message) msg = err.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export function fetchCurrentByCity(city) {
  const q = encodeURIComponent(city.trim());
  return requestJson(
    `${BASE_URL}/weather?q=${q}&units=metric&appid=${API_KEY}`,
  );
}

export function fetchForecastByCity(city) {
  const q = encodeURIComponent(city.trim());
  return requestJson(
    `${BASE_URL}/forecast?q=${q}&units=metric&appid=${API_KEY}`,
  );
}

export function fetchCurrentByCoords(lat, lon) {
  return requestJson(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
  );
}

export function fetchForecastByCoords(lat, lon) {
  return requestJson(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
  );
}
