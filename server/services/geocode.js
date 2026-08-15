// Geocoding Service
// ---------------------------------------------------
// Converts a free-text address/location into latitude & longitude using the
// free OpenStreetMap Nominatim API. Coordinates are stored ONCE on the User
// document and reused for every listing, so the same address is never
// re-geocoded during searches.
//
// This is a best-effort helper: failures (offline, rate-limited, no match)
// resolve to { latitude: 0, longitude: 0 } instead of throwing.

const GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REQUEST_TIMEOUT_MS = 4000;

const geocodeAddress = async (address) => {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return { latitude: 0, longitude: 0 };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const url = new URL(GEOCODE_URL);
    url.searchParams.set('q', address.trim());
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'HomeChef-SE-Project/1.0' }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { latitude: 0, longitude: 0 };
    }

    const results = await response.json();
    const match = Array.isArray(results) ? results[0] : null;

    if (!match) {
      return { latitude: 0, longitude: 0 };
    }

    return {
      latitude: Number(match.lat) || 0,
      longitude: Number(match.lon) || 0
    };
  } catch (error) {
    // Best-effort geocoding: fall back to zero coordinates on any failure.
    return { latitude: 0, longitude: 0 };
  }
};

// Converts GPS coordinates (from a device's location) into a human-readable
// address using Nominatim reverse geocoding. Best-effort like geocodeAddress.
const reverseGeocode = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!lat || !lon) {
    return { address: '', latitude: lat || 0, longitude: lon || 0 };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const url = new URL(REVERSE_URL);
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'HomeChef-SE-Project/1.0' }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { address: '', latitude: lat, longitude: lon };
    }

    const result = await response.json();

    return {
      address: result.display_name || '',
      latitude: Number(result.lat) || lat,
      longitude: Number(result.lon) || lon
    };
  } catch (error) {
    return { address: '', latitude: lat, longitude: lon };
  }
};

module.exports = { geocodeAddress, reverseGeocode };
