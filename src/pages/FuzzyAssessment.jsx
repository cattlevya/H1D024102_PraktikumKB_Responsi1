import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wind, Activity, Droplets, History, AlertTriangle,
  CheckCircle, Info, TrendingUp, Stethoscope, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { fuzzyEngine } from '../services/fuzzyEngine';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

// ─── Gauge Visual ─────────────────────────────────────────────────────────────
const RiskGauge = ({ score, riskLevel, size = 'md' }) => {
  const colors = fuzzyEngine.getRiskColor(riskLevel);
  const isLg = size === 'lg';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${isLg ? 'w-32 h-16' : 'w-20 h-10'} overflow-hidden`}>
        <div
          className="absolute rounded-full border-[12px] border-slate-100"
          style={{
            width: isLg ? 128 : 80,
            height: isLg ? 128 : 80,
            bottom: 0,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: isLg ? 128 : 80,
            height: isLg ? 128 : 80,
            bottom: 0,
            background: `conic-gradient(${colors.hex} ${score * 1.8}deg, transparent 0deg)`,
            clipPath: 'inset(50% 0 0 0)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
          <span className={`font-black text-slate-800 ${isLg ? 'text-2xl' : 'text-base'}`}>{score}</span>
        </div>
      </div>
      <span className={`px-3 py-0.5 rounded-full font-bold ${colors.bg} ${colors.text} ${isLg ? 'text-sm' : 'text-xs'}`}>
        {riskLevel}
      </span>
    </div>
  );
};

// ─── Membership Chart ─────────────────────────────────────────────────────────
const MembershipChart = ({ membershipDegrees }) => {
  if (!membershipDegrees) return null;
  const COLORS = ['#22c55e', '#eab308', '#ef4444'];

  const charts = [
    {
      title: 'Batuk',
      data: [
        { name: 'Rendah', value: Math.round(membershipDegrees.cough.rendah * 100) },
        { name: 'Sedang', value: Math.round(membershipDegrees.cough.sedang * 100) },
        { name: 'Tinggi', value: Math.round(membershipDegrees.cough.tinggi * 100) },
      ],
    },
    {
      title: 'Sesak',
      data: [
        { name: 'Ringan', value: Math.round(membershipDegrees.breathlessness.ringan * 100) },
        { name: 'Sedang', value: Math.round(membershipDegrees.breathlessness.sedang * 100) },
        { name: 'Berat', value: Math.round(membershipDegrees.breathlessness.berat * 100) },
      ],
    },
    {
      title: 'SpO2',
      data: [
        { name: 'Normal', value: Math.round(membershipDegrees.spo2.normal * 100) },
        { name: 'Rendah', value: Math.round(membershipDegrees.spo2.rendah * 100) },
        { name: 'Sangat Rendah', value: Math.round(membershipDegrees.spo2.sangat_rendah * 100) },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {charts.map(({ title, data }) => (
        <div key={title}>
          <p className="text-xs font-semibold text-slate-500 mb-1 text-center">{title}</p>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 8 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

// ─── Halaman Utama ────────────────────────────────────────────────────────────
const FuzzyAssessment = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);

  // State simulator manual (opsional)
  const [simInputs, setSimInputs] = useState({ coughFrequency: 5, breathlessnessLevel: 3, spo2Level: 95 });
  const [simResult, setSimResult] = useState(null);

  // Muat riwayat dari diagnosis
  useEffect(() => {
    if (user?.id) {
      const logs = api.getHistory(user.id).data
        .filter((l) => l.riskScore !== null && l.riskScore !== undefined)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setHistory(logs);
      if (logs.length > 0) setSelectedLog(logs[0]);
    }
  }, [user]);

  // Kalkulasi simulator real-time
  useEffect(() => {
    if (showSimulator) {
      const res = fuzzyEngine.assess(simInputs);
      if (res.success) setSimResult(res);
    }
  }, [simInputs, showSimulator]);

  // Data tren untuk chart
  const trendData = history.slice(0, 10).reverse().map((log, i) => ({
    name: `D${i + 1}`,
    skor: log.riskScore,
    date: new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
  }));

  const latestLog = history[0];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-xl">
              <Wind className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Riwayat Risiko Pernapasan</h1>
              <p className="text-slate-500">Hasil penilaian Fuzzy Logic dari setiap sesi diagnosis Anda</p>
            </div>
          </div>
        </div>

        {/* Jika belum ada riwayat */}
        {history.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Stethoscope className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">Belum Ada Data Risiko</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Penilaian risiko pernapasan dihitung otomatis dari jawaban Anda saat menjalani diagnosis.
              Mulai diagnosis untuk mendapatkan skor risiko pertama Anda.
            </p>
            <Link
              to="/diagnosa"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-teal-500/20"
            >
              <Stethoscope className="w-5 h-5" />
              Mulai Diagnosis Sekarang
            </Link>
          </div>
        )}

        {history.length > 0 && (
          <>
            {/* ── Kartu Hasil Terbaru ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-4">
                <p className="text-sm font-semibold text-slate-500">Skor Risiko Terbaru</p>
                <RiskGauge score={latestLog.riskScore} riskLevel={latestLog.riskLevel} size="lg" />
                <p className="text-xs text-slate-400 text-center">
                  {new Date(latestLog.created_at).toLocaleDateString('id-ID', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
                <p className={`text-xs text-center px-3 py-2 rounded-xl ${fuzzyEngine.getRiskColor(latestLog.riskLevel).bg} ${fuzzyEngine.getRiskColor(latestLog.riskLevel).text}`}>
                  {fuzzyEngine.getRiskDescription(latestLog.riskLevel)}
                </p>
              </div>

              {/* Tren skor */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Tren Skor Risiko
                </h2>
                {trendData.length > 1 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v) => [`${v}`, 'Skor Risiko']} />
                      <Line
                        type="monotone"
                        dataKey="skor"
                        stroke="#14b8a6"
                        strokeWidth={2}
                        dot={{ fill: '#14b8a6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                    <Info className="w-4 h-4 mr-2" />
                    Butuh minimal 2 diagnosis untuk menampilkan tren
                  </div>
                )}
              </div>
            </div>

            {/* ── Riwayat Detail ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-teal-600" />
                Riwayat Penilaian
              </h2>
              <div className="space-y-3">
                {history.map((log) => {
                  const c = fuzzyEngine.getRiskColor(log.riskLevel);
                  const isSelected = selectedLog?.id === log.id;
                  const symptoms = log.symptomsSummary || {};
                  return (
                    <motion.div
                      key={log.id}
                      className={`border rounded-xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'border-teal-300 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                      onClick={() => setSelectedLog(isSelected ? null : log)}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <RiskGauge score={log.riskScore} riskLevel={log.riskLevel} size="sm" />
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{log.final_result}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(log.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {isSelected ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>

                      {/* Detail panel */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-t border-slate-100 p-4 bg-slate-50 space-y-4"
                        >
                          {/* Input yang digunakan */}
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'Batuk', icon: Wind, value: `${symptoms.coughFrequency ?? '-'} kali/hari`, color: 'text-blue-600' },
                              { label: 'Sesak', icon: Activity, value: `${symptoms.breathlessnessLevel ?? '-'}/10`, color: 'text-purple-600' },
                              { label: 'SpO2', icon: Droplets, value: `${symptoms.spo2Level ?? '-'}%`, color: 'text-red-500' },
                            ].map(({ label, icon: Icon, value, color }) => (
                              <div key={label} className="bg-white rounded-xl p-3 border border-slate-100 text-center">
                                <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="font-bold text-slate-800 text-sm">{value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Membership chart */}
                          {(() => {
                            const res = fuzzyEngine.assess({
                              coughFrequency: symptoms.coughFrequency ?? 5,
                              breathlessnessLevel: symptoms.breathlessnessLevel ?? 3,
                              spo2Level: symptoms.spo2Level ?? 95,
                            });
                            return res.success ? <MembershipChart membershipDegrees={res.membershipDegrees} /> : null;
                          })()}

                          <p className={`text-xs p-3 rounded-xl ${c.bg} ${c.text}`}>
                            {fuzzyEngine.getRiskDescription(log.riskLevel)}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Simulator Manual (opsional, collapsible) ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-500" />
              <div className="text-left">
                <p className="font-semibold text-slate-700">Simulator Fuzzy Manual</p>
                <p className="text-xs text-slate-400">Coba hitung skor risiko dengan nilai kustom</p>
              </div>
            </div>
            {showSimulator ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showSimulator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-t border-slate-100 p-6 space-y-6"
            >
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700 flex gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Simulator ini untuk eksplorasi. Hasil diagnosis otomatis (di atas) lebih akurat karena berdasarkan jawaban klinis Anda.
              </div>

              {/* Sliders */}
              {[
                { key: 'coughFrequency', label: 'Frekuensi Batuk', min: 0, max: 20, unit: 'kali/hari', color: 'slider-blue', fillColor: '#3b82f6' },
                { key: 'breathlessnessLevel', label: 'Tingkat Sesak', min: 0, max: 10, step: 0.5, unit: '/10', color: 'slider-purple', fillColor: '#a855f7' },
                { key: 'spo2Level', label: 'Kadar SpO2', min: 70, max: 100, unit: '%', color: 'slider-red', fillColor: '#ef4444' },
              ].map(({ key, label, min, max, step = 1, unit, color, fillColor }) => {
                const pct = ((simInputs[key] - min) / (max - min)) * 100;
                return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="font-bold text-slate-800">{simInputs[key]} {unit}</span>
                  </div>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={simInputs[key]}
                    onChange={(e) => setSimInputs(p => ({ ...p, [key]: Number(e.target.value) }))}
                    className={`w-full ${color}`}
                    style={{
                      background: `linear-gradient(to right, ${fillColor} ${pct}%, #e2e8f0 ${pct}%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{min}</span><span>{max}</span>
                  </div>
                </div>
                );
              })}

              {simResult && (
                <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <RiskGauge score={simResult.riskScore} riskLevel={simResult.riskLevel} size="lg" />
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Aturan aktif: {simResult.appliedRules.length}</p>
                    <p className={`text-xs p-2 rounded-lg ${fuzzyEngine.getRiskColor(simResult.riskLevel).bg} ${fuzzyEngine.getRiskColor(simResult.riskLevel).text}`}>
                      {fuzzyEngine.getRiskDescription(simResult.riskLevel)}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* CTA ke diagnosis */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg">Perbarui Penilaian Risiko Anda</h3>
            <p className="text-teal-100 text-sm">Jalankan diagnosis baru untuk mendapatkan skor risiko terkini berdasarkan gejala Anda hari ini.</p>
          </div>
          <Link
            to="/diagnosa"
            className="flex-shrink-0 flex items-center gap-2 bg-white text-teal-700 font-bold px-6 py-3 rounded-xl hover:bg-teal-50 transition-colors shadow-lg"
          >
            <Stethoscope className="w-5 h-5" />
            Mulai Diagnosis
          </Link>
        </div>

      </div>
    </div>
  );
};

export default FuzzyAssessment;
