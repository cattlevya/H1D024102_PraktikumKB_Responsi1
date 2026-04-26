import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, Calendar, User } from 'lucide-react';
import { api } from '../services/api';
import clsx from 'clsx';

const ConsultationHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        try {
            const allLogs = api.getAllDiagnosisLogs();
            const allUsers = api.getAllUsers();
            // Gabungkan log dengan nama user
            const mapped = allLogs
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((log) => {
                    const u = allUsers.find((u) => u.id === log.userId);
                    return {
                        id: log.id,
                        date: log.createdAt ? log.createdAt.split('T')[0] : '-',
                        patient: u ? u.name : 'Pengguna',
                        diagnosis: log.finalResult || '-',
                        score: log.confidenceScore || 0,
                        status: log.riskLevel ? `Risiko ${log.riskLevel}` : 'Selesai',
                    };
                });
            setHistory(mapped);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const filteredHistory = history.filter(item =>
        item.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Riwayat Konsultasi Global</h1>
                    <p className="text-slate-500">Audit log semua diagnosa pasien dalam sistem.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari pasien atau diagnosa..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Tanggal</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Pasien</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Diagnosa Akhir</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Skor Keparahan</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Tidak ada data ditemukan.</td></tr>
                            ) : (
                                filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                                            {item.date}
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 font-medium">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                                                    {item.patient.substring(0, 2).toUpperCase()}
                                                </div>
                                                {item.patient}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">{item.diagnosis}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded-full text-xs font-medium",
                                                item.score > 80 ? "bg-red-100 text-red-700" :
                                                    item.score > 50 ? "bg-orange-100 text-orange-700" :
                                                        "bg-green-100 text-green-700"
                                            )}>
                                                {item.score}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{item.status}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center justify-end ml-auto">
                                                <Eye className="w-4 h-4 mr-1" /> Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


export default ConsultationHistory;
