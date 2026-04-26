/**
 * Netlify Function — /api/aqi
 * Proxy ke OpenWeatherMap Air Pollution API.
 * Env var: OPENWEATHER_API_KEY (set di Netlify Dashboard > Site Settings > Environment Variables)
 */
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let lat = -6.2088;
  let lon = 106.8456;

  try {
    const body = JSON.parse(event.body || '{}');
    if (body.lat) lat = body.lat;
    if (body.lon) lon = body.lon;
  } catch { /* gunakan default Jakarta */ }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: { aqi: 2, pm25: 15.5, co: 240, city: 'Mode Demo (API Key tidak dikonfigurasi)' },
      }),
    };
  }

  try {
    const aqiRes = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    if (!aqiRes.ok) throw new Error(`OpenWeatherMap error: ${aqiRes.status}`);

    const aqiData = await aqiRes.json();
    const components = aqiData.list?.[0]?.components || {};
    const aqiIndex = aqiData.list?.[0]?.main?.aqi || 1;

    let cityName = 'Lokasi Anda';
    try {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`
      );
      const geoData = await geoRes.json();
      if (geoData?.[0]?.name) cityName = geoData[0].name;
    } catch { /* abaikan */ }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: { aqi: aqiIndex, pm25: components.pm2_5 ?? 0, co: components.co ?? 0, city: cityName },
      }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: { aqi: 2, pm25: 15.5, co: 240, city: 'Mode Demo' },
      }),
    };
  }
};
