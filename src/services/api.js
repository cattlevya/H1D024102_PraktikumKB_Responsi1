import { jsonStore } from './jsonStore';

export const api = {
  // AUTH
  login: (email, password) => jsonStore.loginUser(email, password),
  register: (userData) => jsonStore.registerUser(userData),
  logout: () => jsonStore.logoutUser(),
  getCurrentUser: () => jsonStore.getCurrentUser(),

  // HISTORY & DIAGNOSIS
  getHistory: (userId) => {
    const data = jsonStore.getDiagnosisLogs(userId);
    const mapped = data.map((log) => ({
      ...log,
      final_result: log.finalResult,
      confidence_score: log.confidenceScore,
      symptoms_summary:
        typeof log.symptomsSummary === 'object'
          ? JSON.stringify(log.symptomsSummary)
          : log.symptomsSummary,
      created_at: log.createdAt,
    }));
    return { success: true, data: mapped };
  },

  saveDiagnosis: (data) => jsonStore.saveDiagnosisLog(data),
  saveDiagnosisLog: (data) => jsonStore.saveDiagnosisLog(data),

  // SCORE & CHECK-IN
  getScore: (userId) => {
    const checkin = jsonStore.getTodayCheckin(userId);
    return { success: true, score: checkin ? checkin.score : null };
  },
  saveScore: (userId, score) => jsonStore.saveCheckin(userId, score),
  checkTodayStatus: (userId) => {
    const checkin = jsonStore.getTodayCheckin(userId);
    return { success: true, hasCheckedIn: !!checkin };
  },

  // PROFILE
  getProfile: (userId) => {
    const data = jsonStore.getProfile(userId);
    if (!data) return { success: false, message: 'Pengguna tidak ditemukan.' };
    return { success: true, data };
  },
  updateProfile: (userId, data) => jsonStore.updateProfile(userId, data),

  // ADMIN & STATS
  getAdminStats: () => jsonStore.getAdminStats(),
  getAllDiagnosisLogs: () => jsonStore.getAllDiagnosisLogs(),
  getAllUsers: () => jsonStore.getUsers(),

  // AQI
  // Di production: panggil Vercel Serverless Function /api/aqi
  // Di dev lokal: fallback langsung ke OpenWeatherMap jika ada VITE_OPENWEATHER_API_KEY
  getAQI: async (lat, lon) => {
    try {
      const response = await fetch('/api/aqi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      // Fallback: panggil OpenWeatherMap langsung (dev lokal dengan VITE_OPENWEATHER_API_KEY)
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
      if (apiKey) {
        try {
          const latitude = lat || -6.2088;
          const longitude = lon || 106.8456;
          const aqiRes = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${apiKey}`
          );
          const aqiData = await aqiRes.json();
          const components = aqiData.list?.[0]?.components || {};
          const aqiIndex = aqiData.list?.[0]?.main?.aqi || 1;
          let cityName = 'Lokasi Anda';
          try {
            const geoRes = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
            );
            const geoData = await geoRes.json();
            if (geoData?.[0]?.name) cityName = geoData[0].name;
          } catch { /* abaikan error geocoding */ }
          return {
            success: true,
            data: { aqi: aqiIndex, pm25: components.pm2_5 ?? 0, co: components.co ?? 0, city: cityName },
          };
        } catch { /* lanjut ke mode demo */ }
      }
      // Mode demo jika tidak ada API key atau semua request gagal
      return {
        success: true,
        data: { aqi: 2, pm25: 15.5, co: 240, city: 'Mode Demo' },
      };
    }
  },

  // NEWS
  // Di production: panggil Vercel Serverless Function /api/news
  // Di dev lokal: fallback ke Gemini langsung jika ada VITE_GEMINI_API_KEY
  getNews: async () => {
    try {
      const response = await fetch('/api/news', { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return { success: false, data: [] };
    }
  },
};
