/**
 * Vercel Serverless Function — /api/aqi
 * Proxy ke OpenWeatherMap Air Pollution API.
 * Env var yang dibutuhkan: OPENWEATHER_API_KEY
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { lat, lon } = req.body || {};

  // Fallback jika koordinat tidak diberikan (default: Jakarta)
  const latitude = lat || -6.2088;
  const longitude = lon || 106.8456;

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Mode demo — kembalikan data mock
    return res.json({
      success: true,
      data: {
        aqi: 2,
        pm25: 15.5,
        co: 240,
        city: 'Mode Demo (API Key tidak dikonfigurasi)',
      },
    });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenWeatherMap error: ${response.status}`);
    }

    const data = await response.json();
    const components = data.list?.[0]?.components || {};
    const aqiIndex = data.list?.[0]?.main?.aqi || 1;

    // Coba dapatkan nama kota via reverse geocoding
    let cityName = 'Lokasi Anda';
    try {
      const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();
      if (geoData?.[0]?.name) cityName = geoData[0].name;
    } catch {
      // Abaikan error geocoding
    }

    return res.json({
      success: true,
      data: {
        aqi: aqiIndex,
        pm25: components.pm2_5 ?? 0,
        co: components.co ?? 0,
        city: cityName,
      },
    });
  } catch (err) {
    console.error('[api/aqi] Error:', err.message);
    // Fallback data agar UI tetap berfungsi
    return res.json({
      success: true,
      data: {
        aqi: 2,
        pm25: 15.5,
        co: 240,
        city: 'Mode Demo',
      },
    });
  }
}
