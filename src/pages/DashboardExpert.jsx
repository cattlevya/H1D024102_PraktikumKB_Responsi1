import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    Brain,
    AlertCircle,
    Search,
    FileText,
    Stethoscope,
    Plus,
    Edit,
    Archive,
    Database,
    Bell
} from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/Widgets';
import BioNetwork from '../components/visuals/BioNetwork';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import clsx from 'clsx';

const DashboardExpert = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total_users: 0,
        total_diagnoses: 0,
        recent_activity: [],
        emergency_count: 0
    });

    // Helper to determine severity from diagnosis string
    const getSeverity = (diagnosisResult) => {
        if (!diagnosisResult) return 'low';
        const lower = diagnosisResult.toLowerCase();
        if (lower.includes('gawat') || lower.includes('darurat') || lower.includes('bahaya') || lower.includes('kritis') || lower.includes('segera')) return 'critical';
        if (lower.includes('perlu') || lower.includes('waspada') || lower.includes('sedang')) return 'moderate';
        return 'low';
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const result = api.getAdminStats();
                setStats(result);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // Mock Data for specific medical KPIs
    const emergencyCount = 3; // Mock
    const validationDrafts = 5; // Mock

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* --- ROW 1: HERO SECTION (FULL WIDTH) --- */}
                <Card className="relative min-h-[350px] bg-slate-900 border-none text-white overflow-hidden flex flex-col justify-center p-10 col-span-1 lg:col-span-12 shadow-2xl shadow-slate-900/20">
                    <BioNetwork />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <Badge variant="teal" className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm px-4 py-1.5 text-sm">
                                EXPERT ADMIN PANEL
                            </Badge>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                                    Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Dr. {user?.name || 'User'}</span>
                                </h1>
                                <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
                                    Anda memiliki <strong className="text-white">{stats.emergency_count} Pasien Kritis</strong> yang membutuhkan tinjauan klinis hari ini. Sistem AI telah menyiapkan analisis awal.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    onClick={() => navigate('/expert/knowledge')}
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-none px-6 py-3 text-lg shadow-lg shadow-cyan-500/25 rounded-xl"
                                >
                                    <Search className="w-5 h-5 mr-2" />
                                    Mulai Riset AI
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* --- ROW 2: KEY METRICS (3 CARDS) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Pasien Gawat Darurat */}
                    <Card className="p-6 bg-red-50 border-red-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600 mb-1">Pasien Gawat Darurat</p>
                            <h3 className="text-3xl font-bold text-red-900">{stats.emergency_count}</h3>
                            <Badge className="mt-2 bg-red-200 text-red-800 border-none text-xs">Butuh Penanganan Segera</Badge>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </Card>

                    {/* Card 2: Total Diagnosa Minggu Ini */}
                    <Card className="p-6 bg-blue-50 border-blue-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 mb-1">Total Diagnosa</p>
                            <h3 className="text-3xl font-bold text-blue-900">{stats.total_diagnoses}</h3>
                            <Badge className="mt-2 bg-blue-200 text-blue-800 border-none text-xs">Tren Kenaikan +12%</Badge>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Activity className="w-6 h-6" />
                        </div>
                    </Card>

                    {/* Card 3: Validasi Logika AI */}
                    <Card className="p-6 bg-purple-50 border-purple-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600 mb-1">Validasi Logika AI</p>
                            <h3 className="text-3xl font-bold text-purple-900">{validationDrafts} Draft</h3>
                            <Badge className="mt-2 bg-purple-200 text-purple-800 border-none text-xs">Menunggu Persetujuan</Badge>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Brain className="w-6 h-6" />
                        </div>
                    </Card>
                </div>

                {/* --- ROW 3: MAIN CONTENT AREA --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* --- LEFT COLUMN (8): RIWAYAT KONSULTASI TERKINI --- */}
                    <div className="lg:col-span-8">
                        <Card className="p-6 h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-slate-500" />
                                    Riwayat Konsultasi Terkini
                                </h3>
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => navigate('/expert/history')}>Lihat Semua</Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Waktu</th>
                                            <th className="px-4 py-3 font-medium">Nama Pasien</th>
                                            <th className="px-4 py-3 font-medium">Hasil Diagnosa</th>
                                            <th className="px-4 py-3 font-medium">Tingkat Keparahan</th>
                                            <th className="px-4 py-3 font-medium text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {stats.recent_activity.length > 0 ? (
                                            stats.recent_activity.map((log, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-slate-500">
                                                        {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-slate-900">{log.user_name}</td>
                                                    <td className="px-4 py-3 font-bold text-slate-700">{log.final_result}</td>
                                                    <td className="px-4 py-3">
                                                        {(() => {
                                                            const severity = getSeverity(log.final_result);
                                                            return (
                                                                <Badge
                                                                    className={clsx(
                                                                        "border-none",
                                                                        severity === 'critical' ? "bg-red-100 text-red-700" :
                                                                            severity === 'moderate' ? "bg-amber-100 text-amber-700" :
                                                                                "bg-emerald-100 text-emerald-700"
                                                                    )}
                                                                >
                                                                    {severity === 'critical' ? 'Tinggi' : severity === 'moderate' ? 'Sedang' : 'Rendah'}
                                                                </Badge>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button size="sm" variant="outline" className="h-8 text-xs">Detail</Button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-slate-400">Belum ada data konsultasi hari ini.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* --- RIGHT COLUMN (4): QUICK ACTIONS & ALERTS --- */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Quick Actions */}
                        <Card className="p-6">
                            <h3 className="font-bold text-slate-800 mb-4">Manajemen Pengetahuan</h3>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:border-blue-200">
                                    <Plus className="w-4 h-4 mr-3" />
                                    Tambah Gejala Baru
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:border-blue-200">
                                    <Edit className="w-4 h-4 mr-3" />
                                    Edit Rule PPOK
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-slate-600 hover:text-blue-600 hover:border-blue-200">
                                    <Archive className="w-4 h-4 mr-3" />
                                    Arsip Jurnal Medis
                                </Button>
                            </div>
                        </Card>

                        {/* System Notifications */}
                        <Card className="p-6 bg-slate-800 text-white border-none">
                            <div className="flex items-center gap-3 mb-4">
                                <Bell className="w-5 h-5 text-yellow-400" />
                                <h3 className="font-bold">Notifikasi Sistem</h3>
                            </div>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats.alerts && stats.alerts.length > 0 ? (
                                    stats.alerts.map((alert, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border text-sm ${alert.type === 'critical' ? 'bg-red-900/30 border-red-800 text-red-200' :
                                            alert.type === 'discovery' ? 'bg-teal-900/30 border-teal-800 text-teal-200' :
                                                alert.type === 'warning' ? 'bg-amber-900/30 border-amber-800 text-amber-200' :
                                                    'bg-slate-700/50 border-slate-600 text-slate-200'
                                            }`}>
                                            <p className="mb-1 font-medium">
                                                {alert.type === 'critical' ? 'BAHAYA: ' :
                                                    alert.type === 'discovery' ? 'POLA BARU: ' :
                                                        alert.type === 'warning' ? 'PERINGATAN: ' : ''}
                                                {alert.message}
                                            </p>
                                            <span className="text-xs opacity-70">Baru saja</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 text-sm">
                                        <p className="text-slate-200 mb-1">Sistem berjalan normal. Tidak ada anomali terdeteksi.</p>
                                        <span className="text-xs text-slate-400">Updated just now</span>
                                    </div>
                                )}
                            </div>
                        </Card>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardExpert;
