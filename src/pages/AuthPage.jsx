import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Mail, Shield, ArrowRight, Loader2 } from 'lucide-react';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        isExpert: false,
        licenseCode: ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // LOGIN FLOW
                const result = await login(formData.email, formData.password);
                if (result.success) {
                    // Redirect based on role
                    if (result.user.role === 'expert') {
                        navigate('/admin');
                    } else {
                        navigate('/');
                    }
                } else {
                    setError(result.message);
                }
            } else {
                // REGISTER FLOW
                const newUser = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.isExpert ? 'expert' : 'patient',
                    licenseCode: formData.isExpert ? formData.licenseCode : null
                };

                const result = await register(newUser);
                if (result.success) {
                    navigate(result.user.role === 'expert' ? '/admin' : '/');
                } else {
                    setError(result.message);
                }
            }
        } catch (err) {
            setError('Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* Left Side - Visual */}
                <div className="w-full md:w-1/2 bg-slate-900 p-8 flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-900/50 to-slate-900/80 z-10" />
                    {/* Abstract Background Element */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-20">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                                <ActivityIcon />
                            </div>
                            <span className="text-xl font-bold tracking-tight">RESPIRA.ID</span>
                        </div>
                        <p className="text-slate-400 text-sm">Professional Respiratory Expert System</p>
                    </div>

                    <div className="relative z-20">
                        <h2 className="text-3xl font-bold mb-4">
                            {isLogin ? 'Selamat Datang Kembali.' : 'Bergabung dengan Kami.'}
                        </h2>
                        <p className="text-slate-300 leading-relaxed">
                            {isLogin
                                ? 'Akses dashboard kesehatan Anda dan pantau kondisi paru-paru secara real-time dengan teknologi AI.'
                                : 'Daftarkan diri Anda untuk mendapatkan diagnosa dini dan konsultasi dengan pakar kesehatan terpercaya.'}
                        </p>
                    </div>

                    <div className="relative z-20 text-xs text-slate-500">
                        © 2023 Respira ID. Secure Local System.
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">
                            {isLogin ? 'Login Akun' : 'Buat Akun Baru'}
                        </h3>
                        <p className="text-slate-500 text-sm">
                            {isLogin ? 'Masuk untuk melanjutkan sesi Anda.' : 'Isi data diri untuk memulai.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircleIcon />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        name="isExpert"
                                        checked={formData.isExpert}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                                    />
                                    <span className="text-sm text-slate-600">Daftar sebagai Pakar Medis?</span>
                                </label>

                                <AnimatePresence>
                                    {formData.isExpert && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Kode Lisensi</label>
                                                <div className="relative">
                                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
                                                    <input
                                                        type="text"
                                                        name="licenseCode"
                                                        value={formData.licenseCode}
                                                        onChange={handleChange}
                                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                                                        placeholder="Masukkan kode lisensi..."
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2">Gunakan kode "DOKTER123" untuk demo.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {isLogin ? 'Masuk Sekarang' : 'Buat Akun'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                            >
                                {isLogin ? 'Daftar disini' : 'Login disini'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple Icons
const ActivityIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

const AlertCircleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

export default AuthPage;
