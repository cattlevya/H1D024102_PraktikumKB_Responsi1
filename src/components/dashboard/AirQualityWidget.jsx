import React, { useState } from 'react';
import { MapPin, Wind, RefreshCw, AlertCircle, Loader2, Navigation } from 'lucide-react';
import { Card, Button } from '../ui/Widgets';
import { api } from '../../services/api';

const AirQualityWidget = () => {
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [data, setData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const requestLocation = () => {
        setStatus('loading');
        setErrorMsg('');

        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('Browser tidak mendukung Geolocation.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                fetchAQI(latitude, longitude);
            },
            (error) => {
                setStatus('error');
                if (error.code === error.PERMISSION_DENIED) {
                    setErrorMsg('Izin lokasi ditolak.');
                } else {
                    setErrorMsg('Gagal mendeteksi lokasi.');
                }
            }
        );
    };

    const fetchAQI = async (lat, lon) => {
        try {
            // Call our backend proxy
            const result = await api.getAQI(lat, lon);

            if (result.success) {
                setData(result.data);
                setStatus('success');
            } else {
                throw new Error(result.message || 'Gagal mengambil data AQI.');
            }
        } catch (err) {
            setStatus('error');
            setErrorMsg('Gagal terhubung ke satelit.');
        }
    };

    // Helper for Status Color
    const getStatusColor = (aqi) => {
        // OpenWeatherMap AQI: 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor
        if (aqi === 1) return 'text-green-500 bg-green-50 border-green-200';
        if (aqi === 2) return 'text-yellow-500 bg-yellow-50 border-yellow-200';
        if (aqi === 3) return 'text-orange-500 bg-orange-50 border-orange-200';
        if (aqi >= 4) return 'text-red-500 bg-red-50 border-red-200';
        return 'text-slate-500 bg-slate-50 border-slate-200';
    };

    const getStatusLabel = (aqi) => {
        if (aqi === 1) return 'Baik';
        if (aqi === 2) return 'Cukup';
        if (aqi === 3) return 'Sedang';
        if (aqi === 4) return 'Buruk';
        if (aqi === 5) return 'Sangat Buruk';
        return 'Unknown';
    };

    // --- RENDER STATES ---

    if (status === 'idle') {
        return (
            <Card className="h-full p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                    <MapPin size={24} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-700">Data Kualitas Udara</h3>
                    <p className="text-xs text-slate-400 mt-1">Aktifkan lokasi untuk melihat data real-time di area Anda.</p>
                </div>
                <Button
                    onClick={requestLocation}
                    variant="secondary"
                    className="text-xs bg-blue-600 text-white hover:bg-blue-700 border-none"
                >
                    <Navigation size={14} className="mr-2" />
                    Aktifkan Lokasi
                </Button>
            </Card>
        );
    }

    if (status === 'loading') {
        return (
            <Card className="h-full p-6 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 size={32} className="text-teal-500 animate-spin" />
                <p className="text-sm text-slate-500 animate-pulse">Menghubungkan ke Satelit...</p>
            </Card>
        );
    }

    if (status === 'error') {
        return (
            <Card className="h-full p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-full">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-700">Gagal Memuat</h3>
                    <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
                </div>
                <Button
                    onClick={requestLocation}
                    variant="ghost"
                    className="text-xs text-slate-500 hover:text-slate-800"
                >
                    <RefreshCw size={14} className="mr-2" />
                    Coba Lagi
                </Button>
            </Card>
        );
    }

    // SUCCESS STATE
    const colorClass = getStatusColor(data.aqi);

    return (
        <Card className="h-full p-6 flex flex-col justify-between relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start z-10">
                <div>
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Kualitas Udara</h3>
                    <div className="flex items-center gap-1 text-slate-800 font-semibold text-sm">
                        <MapPin size={12} className="text-slate-400" />
                        {data.city}
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-lg border text-xs font-bold ${colorClass}`}>
                    {getStatusLabel(data.aqi)}
                </div>
            </div>

            {/* Main Metric */}
            <div className="flex items-end gap-2 mt-4 z-10">
                <span className="text-4xl font-bold text-slate-800">{data.aqi * 20}</span>
                <span className="text-xs text-slate-400 mb-1 font-medium">AQI Index</span>
            </div>

            {/* Details */}
            <div className="mt-4 space-y-2 z-10">
                <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-slate-500">PM2.5</span>
                    <span className="font-mono text-slate-700">{data.pm25} µg/m³</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-slate-500">CO</span>
                    <span className="font-mono text-slate-700">{data.co} µg/m³</span>
                </div>
            </div>

            {/* Background Decor */}
            <Wind className="absolute -bottom-4 -right-4 text-slate-100 w-32 h-32 z-0" />
        </Card>
    );
};

export default AirQualityWidget;
