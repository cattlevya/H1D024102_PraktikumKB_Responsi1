/**
 * jsonStore.js — Lapisan penyimpanan tunggal berbasis localStorage
 * Menggantikan semua koneksi ke backend Express + database.
 *
 * Keys yang digunakan:
 *   respira_users          — semua pengguna terdaftar
 *   respira_current_user   — sesi pengguna aktif
 *   respira_diagnosis_logs — semua log diagnosis
 *   respira_checkins       — semua data check-in harian
 */

// ─── Kode lisensi valid untuk role expert ───────────────────────────────────
const VALID_LICENSE_CODES = ['DOKTER123', 'SPESIALIS456', 'RESIDEN789'];

// ─── Seed data awal (dari db.json) ──────────────────────────────────────────
const SEED_USERS = [
  {
    id: '1',
    email: 'admin@respira.id',
    password: 'admin',
    name: 'Dr. Sarah Sp.P',
    role: 'expert',
    licenseCode: 'DOKTER123',
    institution: 'RSUP Dr. Hasan Sadikin',
    title_degree: 'Sp.P',
    sip_number: 'SIP-001/2024',
  },
  {
    id: '2',
    email: 'user@gmail.com',
    password: 'user123',
    name: 'Budi Santoso',
    role: 'patient',
    licenseCode: null,
    height: null,
    weight: null,
    blood_type: null,
    birth_date: null,
    emergency_contact: null,
  },
];

// ─── Helper: baca dari localStorage ─────────────────────────────────────────
function readKey(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// ─── Helper: tulis ke localStorage ──────────────────────────────────────────
function writeKey(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`[jsonStore] Gagal menulis key "${key}":`, e);
    return false;
  }
}

// ─── Helper: cek ketersediaan localStorage ───────────────────────────────────
function isLocalStorageAvailable() {
  try {
    const test = '__respira_test__';
    localStorage.setItem(test, '1');
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// ─── Helper: generate UUID v4 ────────────────────────────────────────────────
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback sederhana
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Helper: format tanggal YYYY-MM-DD ───────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── Seed data jika belum ada ────────────────────────────────────────────────
function seedInitialData() {
  if (localStorage.getItem('respira_users') === null) {
    writeKey('respira_users', SEED_USERS);
  }
  if (localStorage.getItem('respira_diagnosis_logs') === null) {
    writeKey('respira_diagnosis_logs', []);
  }
  if (localStorage.getItem('respira_checkins') === null) {
    writeKey('respira_checkins', []);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════════════════════════════════

function getUsers() {
  seedInitialData();
  return readKey('respira_users', []);
}

function saveUsers(users) {
  writeKey('respira_users', users);
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════

function registerUser(userData) {
  try {
    if (!isLocalStorageAvailable()) {
      return { success: false, message: 'localStorage tidak tersedia di browser ini.' };
    }

    const { name, email, password, role, licenseCode } = userData;

    // Validasi kode lisensi untuk expert
    if (role === 'expert') {
      if (!licenseCode || !VALID_LICENSE_CODES.includes(licenseCode)) {
        return { success: false, message: 'Kode lisensi tidak valid.' };
      }
    }

    const users = getUsers();

    // Cek duplikasi email
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'Email sudah terdaftar.' };
    }

    const newUser = {
      id: generateId(),
      email,
      password,
      name,
      role: role || 'patient',
      licenseCode: licenseCode || null,
      height: null,
      weight: null,
      blood_type: null,
      birth_date: null,
      emergency_contact: null,
      institution: null,
      title_degree: null,
      sip_number: null,
    };

    users.push(newUser);
    saveUsers(users);

    // Simpan sesi
    const { password: _pw, ...userWithoutPassword } = newUser;
    writeKey('respira_current_user', userWithoutPassword);

    return { success: true, user: userWithoutPassword };
  } catch (e) {
    return { success: false, message: `Registrasi gagal: ${e.message}` };
  }
}

function loginUser(email, password) {
  try {
    if (!isLocalStorageAvailable()) {
      return { success: false, message: 'localStorage tidak tersedia di browser ini.' };
    }

    const users = getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!found) {
      return { success: false, message: 'Email atau password salah.' };
    }

    const { password: _pw, ...userWithoutPassword } = found;
    writeKey('respira_current_user', userWithoutPassword);

    return { success: true, user: userWithoutPassword };
  } catch (e) {
    return { success: false, message: `Login gagal: ${e.message}` };
  }
}

function logoutUser() {
  try {
    localStorage.removeItem('respira_current_user');
    // Hapus key lama juga (kompatibilitas)
    localStorage.removeItem('user');
  } catch {
    // silent
  }
}

function getCurrentUser() {
  try {
    // Coba key baru dulu, lalu key lama untuk kompatibilitas
    const fromNew = readKey('respira_current_user', null);
    if (fromNew) return fromNew;
    const fromOld = readKey('user', null);
    return fromOld;
  } catch {
    return null;
  }
}

function updateCurrentUser(user) {
  try {
    writeKey('respira_current_user', user);
  } catch {
    // silent
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DIAGNOSIS LOGS
// ════════════════════════════════════════════════════════════════════════════

function getAllDiagnosisLogs() {
  seedInitialData();
  return readKey('respira_diagnosis_logs', []);
}

function getDiagnosisLogs(userId) {
  const all = getAllDiagnosisLogs();
  return all
    .filter((log) => log.userId === String(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function saveDiagnosisLog(payload) {
  try {
    if (!isLocalStorageAvailable()) {
      return { success: false, message: 'localStorage tidak tersedia.' };
    }

    const all = getAllDiagnosisLogs();

    const newLog = {
      id: generateId(),
      userId: String(payload.userId),
      finalResult: payload.finalResult || payload.final_result || 'Tidak Diketahui',
      confidenceScore: payload.confidenceScore ?? payload.confidence_score ?? 0,
      symptomsSummary: payload.symptomsSummary || payload.symptoms_summary || {},
      riskScore: payload.riskScore ?? null,
      riskLevel: payload.riskLevel ?? null,
      severity: payload.severity || 'low',
      createdAt: new Date().toISOString(),
    };

    all.push(newLog);

    // Terapkan batas 100 entri per user
    const userLogs = all.filter((l) => l.userId === newLog.userId);
    if (userLogs.length > 100) {
      // Urutkan terlama dulu, hapus yang paling lama
      userLogs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const toRemoveId = userLogs[0].id;
      const filtered = all.filter((l) => l.id !== toRemoveId);
      writeKey('respira_diagnosis_logs', filtered);
    } else {
      writeKey('respira_diagnosis_logs', all);
    }

    return { success: true, data: newLog };
  } catch (e) {
    return { success: false, message: `Gagal menyimpan log: ${e.message}` };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CHECK-IN HARIAN
// ════════════════════════════════════════════════════════════════════════════

function getAllCheckins() {
  seedInitialData();
  return readKey('respira_checkins', []);
}

function getTodayCheckin(userId) {
  const all = getAllCheckins();
  const today = todayStr();
  return all.find((c) => c.userId === String(userId) && c.checkDate === today) || null;
}

function saveCheckin(userId, score) {
  try {
    if (!isLocalStorageAvailable()) {
      return { success: false, message: 'localStorage tidak tersedia.' };
    }

    const all = getAllCheckins();
    const today = todayStr();
    const existingIdx = all.findIndex(
      (c) => c.userId === String(userId) && c.checkDate === today
    );

    if (existingIdx >= 0) {
      // Update yang sudah ada
      all[existingIdx].score = score;
    } else {
      // Buat baru
      all.push({
        id: generateId(),
        userId: String(userId),
        score,
        checkDate: today,
      });
    }

    writeKey('respira_checkins', all);
    return { success: true };
  } catch (e) {
    return { success: false, message: `Gagal menyimpan check-in: ${e.message}` };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PROFIL PENGGUNA
// ════════════════════════════════════════════════════════════════════════════

function getProfile(userId) {
  const users = getUsers();
  const user = users.find((u) => u.id === String(userId));
  if (!user) return null;
  const { password: _pw, ...profile } = user;
  return profile;
}

function updateProfile(userId, profileData) {
  try {
    if (!isLocalStorageAvailable()) {
      return { success: false, message: 'localStorage tidak tersedia.' };
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === String(userId));
    if (idx < 0) return { success: false, message: 'Pengguna tidak ditemukan.' };

    // Merge field yang diizinkan
    const allowedFields = [
      'height', 'weight', 'blood_type', 'birth_date', 'emergency_contact',
      'institution', 'title_degree', 'sip_number',
    ];
    allowedFields.forEach((field) => {
      if (profileData[field] !== undefined) {
        users[idx][field] = profileData[field];
      }
    });

    saveUsers(users);

    // Update sesi jika user yang sedang login
    const currentUser = getCurrentUser();
    if (currentUser && String(currentUser.id) === String(userId)) {
      const { password: _pw, ...updated } = users[idx];
      updateCurrentUser(updated);
    }

    const { password: _pw, ...result } = users[idx];
    return { success: true, data: result };
  } catch (e) {
    return { success: false, message: `Gagal memperbarui profil: ${e.message}` };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN STATS
// ════════════════════════════════════════════════════════════════════════════

function getAdminStats() {
  try {
    const allLogs = getAllDiagnosisLogs();
    const allUsers = getUsers();
    const today = todayStr();

    const totalToday = allLogs.filter(
      (l) => l.createdAt && l.createdAt.startsWith(today)
    ).length;

    const criticalCount = allLogs.filter(
      (l) => l.severity === 'critical' || l.severity === 'high' || l.riskLevel === 'Kritis'
    ).length;

    const totalUsers = allUsers.length;
    const totalDiagnoses = allLogs.length;

    // Distribusi penyakit
    const diseaseMap = {};
    allLogs.forEach((l) => {
      const name = l.finalResult || 'Tidak Diketahui';
      diseaseMap[name] = (diseaseMap[name] || 0) + 1;
    });
    const diseaseDistribution = Object.entries(diseaseMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Aktivitas 7 hari terakhir
    const activityLog = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = allLogs.filter((l) => l.createdAt && l.createdAt.startsWith(dateStr)).length;
      activityLog.push({ date: dateStr, count });
    }

    // recent_activity: 10 log terbaru dengan nama user
    const recent_activity = allLogs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((log) => {
        const u = allUsers.find((u) => u.id === log.userId);
        return {
          ...log,
          user_name: u ? u.name : 'Pengguna',
          // Alias untuk kompatibilitas UI lama
          final_result: log.finalResult,
          created_at: log.createdAt,
          confidence_score: log.confidenceScore,
        };
      });

    return {
      success: true,
      totalToday,
      criticalCount,
      totalUsers,
      totalDiagnoses,
      diseaseDistribution,
      activityLog,
      // Alias untuk kompatibilitas DashboardExpert
      total_users: totalUsers,
      total_diagnoses: totalDiagnoses,
      emergency_count: criticalCount,
      recent_activity,
    };
  } catch (e) {
    return {
      success: false,
      totalToday: 0,
      criticalCount: 0,
      totalUsers: 0,
      totalDiagnoses: 0,
      diseaseDistribution: [],
      activityLog: [],
      total_users: 0,
      total_diagnoses: 0,
      emergency_count: 0,
      recent_activity: [],
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════════════════

export const jsonStore = {
  // Seed
  seedInitialData,
  isLocalStorageAvailable,

  // Users
  getUsers,
  saveUsers,

  // Auth
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateCurrentUser,

  // Diagnosis logs
  getAllDiagnosisLogs,
  getDiagnosisLogs,
  saveDiagnosisLog,

  // Check-in
  getTodayCheckin,
  saveCheckin,

  // Profile
  getProfile,
  updateProfile,

  // Admin
  getAdminStats,
};

export default jsonStore;
