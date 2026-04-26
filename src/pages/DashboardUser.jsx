import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Activity, Calendar, AlertTriangle, Phone, User as UserIcon, Droplet, Edit, Wind, History as HistoryIcon } from 'lucide-react';
import { Card, Badge, Button } from '../components/ui/Widgets';
import BioNetwork from '../components/visuals/BioNetwork';
import AirQualityWidget from '../components/dashboard/AirQualityWidget';
import LungTestWidget from '../components/dashboard/LungTestWidget';
import DailyTestModal from '../components/modals/DailyTestModal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import clsx from 'clsx';

const DashboardUser = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        userName: '',
        userProfile: {},
        latestScore: null,
        history: []
    });

    const [showTestModal, setShowTestModal] = useState(false);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (user?.id) {
                try {
                    const [profileRes, scoreRes, historyRes] = await Promise.all([
                        api.getProfile(user.id),
                        api.getScore(user.id),
                        api.getHistory(user.id),
                    ]);

                    const latestScore = scoreRes.success ? scoreRes.score : null;

                    setDashboardData({
                        userName: user.name || '',
                        userProfile: profileRes.success ? profileRes.data : {},
                        latestScore,
                        history: historyRes.success ? historyRes.data : [],
                    });

                    if (latestScore === null) {
                        setShowTestModal(true);
                    }
                } catch (error) {
                    console.error("Failed to fetch dashboard", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [user]);

    const handleTestComplete = async (score) => {
        // Save score
        await api.saveScore(user.id, score);
        // Update local state
        setDashboardData(prev => ({ ...prev, latestScore: score }));
        setShowTestModal(false);
    };

    // Gauge Config
    const score = dashboardData.latestScore || 0;
    const gaugeData = [
        { name: 'Score', value: score },
        { name: 'Remaining', value: 100 - score },
    ];
    const gaugeColors = score >= 80 ? ['#10b981', '#e2e8f0'] : score >= 50 ? ['#f59e0b', '#e2e8f0'] : ['#ef4444', '#e2e8f0'];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const { userProfile } = dashboardData;
    const hasProfile = userProfile.height && userProfile.weight && userProfile.blood_type;

    return (
        <div className="min-h-screen bg-slate-50 pb-24">

            <DailyTestModal
                isOpen={showTestModal}
                onClose={() => setShowTestModal(false)}
                onComplete={handleTestComplete}
            />

            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* --- ROW 1: HERO SECTION (FULL WIDTH) --- */}
                <Card className="relative min-h-[400px] bg-slate-900 border-none text-white overflow-hidden flex flex-col justify-center p-10 col-span-1 lg:col-span-12 shadow-2xl shadow-slate-900/20">
                    <BioNetwork />
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <Badge variant="teal" className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm px-4 py-1.5 text-sm">
                                Sistem Aktif
                            </Badge>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                                    Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{dashboardData.userName}</span>
                                </h1>
                                <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
                                    Sistem RESPIRA siap membantu. Pantau kesehatan paru Anda. Lakukan diagnosa lengkap jika merasakan <strong className="text-white">nyeri dada, batuk persisten, atau keluhan fisik lainnya.</strong>
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate('/diagnosa')}
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-none px-8 py-4 text-lg shadow-lg shadow-cyan-500/25 rounded-xl"
                            >
                                <Activity className="w-5 h-5 mr-3" />
                                Mulai Diagnosa Gejala
                            </Button>
                        </div>
                        {/* Right side is empty to let the Lungs animation shine */}
                    </div >
                </Card >

                {/* --- ROW 2: 3-COLUMN GRID --- */}
                < div className="grid grid-cols-1 lg:grid-cols-12 gap-6" >

                    {/* --- LEFT COLUMN (3): PROFILE & EMERGENCY --- */}
                    < div className="lg:col-span-3 space-y-6" >
                        {/* User Info Card */}
                        < Card className="p-6 h-full" >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-2xl font-bold text-blue-600 uppercase shadow-inner">
                                    {dashboardData.userName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{dashboardData.userName}</h3>
                                    <p className="text-xs text-slate-500">Pasien Terdaftar</p>
                                </div>
                            </div>

                            {
                                hasProfile ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <Droplet className="text-red-500 w-5 h-5" />
                                                <span className="text-sm text-slate-600">Gol. Darah</span>
                                            </div>
                                            <span className="font-bold text-slate-800">{userProfile.blood_type}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <UserIcon className="text-blue-500 w-5 h-5" />
                                                <span className="text-sm text-slate-600">Tinggi/Berat</span>
                                            </div>
                                            <span className="font-bold text-slate-800">{userProfile.height}cm / {userProfile.weight}kg</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <p className="text-sm text-slate-500 mb-4">Data profil belum lengkap.</p>
                                        <Button onClick={() => navigate('/profile')} variant="secondary" className="w-full text-xs">
                                            <Edit size={14} className="mr-2" />
                                            Lengkapi Biodata
                                        </Button>
                                    </div>
                                )
                            }
                        </Card >

                    </div >

                    {/* --- MIDDLE COLUMN (6): LUNG HEALTH & BREATH TEST --- */}
                    < div className="lg:col-span-6 space-y-6" >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            {/* Lung Score Gauge */}
                            <Card className="p-6 flex flex-col items-center justify-center text-center">
                                <h3 className="font-semibold text-slate-700 mb-1">Skor Kesehatan Paru</h3>
                                <p className="text-xs text-slate-500 mb-4">Update Harian</p>

                                <div className="w-40 h-40 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={gaugeData}
                                                cx="50%"
                                                cy="50%"
                                                startAngle={180}
                                                endAngle={0}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={0}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {gaugeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={gaugeColors[index]} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                                        <span className="text-4xl font-bold text-slate-800">{score}</span>
                                        <span className="text-xs font-medium text-slate-400 uppercase">Poin</span>
                                    </div>
                                </div>

                                <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-bold ${score >= 80 ? 'bg-green-100 text-green-700' :
                                    score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {score > 0 ? (score >= 80 ? 'Kondisi Optimal' : score >= 50 ? 'Cukup Baik' : 'Perlu Perhatian') : 'Belum Tes'}
                                </div>
                            </Card>

                            {/* Breath Test Widget */}
                            <div className="h-full min-h-[300px]">
                                <LungTestWidget onComplete={handleTestComplete} />
                            </div>
                        </div>
                    </div >

                    {/* --- RIGHT COLUMN (3): AQI & HISTORY --- */}
                    < div className="lg:col-span-3 space-y-6" >
                        {/* AQI Widget */}
                        < div className="h-[200px]" >
                            <AirQualityWidget />
                        </div >

                        {/* Mini History List */}
                        < div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6" >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-800 flex items-center">
                                    <HistoryIcon className="w-5 h-5 mr-2 text-blue-600" />
                                    Riwayat Terakhir
                                </h3>
                                <Link to="/riwayat" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Lihat Semua
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {dashboardData.history.slice(0, 2).map((log) => (
                                    <div key={log.id} className="flex items-start p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mr-3",
                                            log.confidence_score >= 75 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                        )}>
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 line-clamp-1">{log.final_result}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {new Date(log.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {dashboardData.history.length === 0 && (
                                    <p className="text-sm text-slate-400 text-center py-4">Belum ada riwayat diagnosa.</p>
                                )}
                            </div>
                        </div >
                    </div >

                </div >

                {/* --- ROW 3: EMERGENCY BANNER (FULL WIDTH) --- */}
                < Card className="p-6 bg-red-50 border-red-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6" >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-800 text-lg">Butuh Bantuan Darurat?</h3>
                            <p className="text-sm text-red-600">
                                Jika Anda mengalami sesak napas berat atau nyeri dada hebat, segera hubungi layanan medis.
                                {userProfile.emergency_contact && <span className="font-bold ml-1">Kontak: {userProfile.emergency_contact}</span>}
                            </p>
                        </div>
                    </div>
                    <Button className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-500/30 px-8 py-3 text-lg">
                        <Phone className="w-5 h-5 mr-2" />
                        Panggil Ambulans
                    </Button>
                </Card >
            </div >
        </div >
    );
};

export default DashboardUser;
