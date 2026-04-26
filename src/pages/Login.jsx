import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, User, Stethoscope, Lock, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

const Login = () => {
    const [role, setRole] = useState('user'); // 'user' or 'pakar'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Simple validation mock
        if (!username || !password) {
            setError('Mohon isi username dan password');
            return;
        }

        if (role === 'pakar' && password !== 'admin') {
            setError('Password salah untuk akses Pakar (Hint: admin)');
            return;
        }

        login(username, password, role);
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Activity className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">RESPIRA.ID</h1>
                    <p className="text-blue-100">Sistem Pakar Penyakit Pernapasan</p>
                </div>

                {/* Role Switcher */}
                <div className="flex border-b border-slate-100">
                    <button
                        className={clsx(
                            "flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors",
                            role === 'user' ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50"
                        )}
                        onClick={() => setRole('user')}
                    >
                        <User className="w-4 h-4 mr-2" />
                        Pasien / Umum
                    </button>
                    <button
                        className={clsx(
                            "flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors",
                            role === 'pakar' ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/50" : "text-slate-500 hover:bg-slate-50"
                        )}
                        onClick={() => setRole('pakar')}
                    >
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Dokter / Pakar
                    </button>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Masukkan username Anda"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Masukkan password Anda"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={clsx(
                                "w-full py-3 px-4 rounded-xl text-white font-medium shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all hover:scale-[1.02]",
                                role === 'user' ? "bg-blue-600 hover:bg-blue-700" : "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
                            )}
                        >
                            {role === 'user' ? 'Masuk Sekarang' : 'Akses Dashboard Pakar'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-400">
                            {role === 'user'
                                ? 'Belum punya akun? Masuk sebagai tamu untuk diagnosa awal.'
                                : 'Area terbatas khusus tenaga medis terdaftar.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* DEBUG INFO REMOVED */}
        </div>
        </div >
    );
};

export default Login;
