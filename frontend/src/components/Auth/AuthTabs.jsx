import React, { useState } from 'react';
import axios from 'axios';
import { X, Lock, Mail, User, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AuthTabs({ onClose, onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                // OAuth2 expects form data for login
                const formData = new URLSearchParams();
                formData.append('username', form.username);
                formData.append('password', form.password);

                const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/login`, formData, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                toast.success('Successfully logged in!');
                onLoginSuccess(res.data);
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/auth/register`, {
                    username: form.username,
                    email: form.email,
                    password: form.password
                });
                toast.success('Registration successful! You are now logged in.');
                onLoginSuccess(res.data);
            }
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-slide-up">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex gap-4 mb-6 border-b border-slate-100">
                    <button
                        className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${isLogin ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        onClick={() => setIsLogin(true)}
                    >
                        Login
                    </button>
                    <button
                        className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${!isLogin ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        onClick={() => setIsLogin(false)}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Username
                        </label>
                        <input
                            type="text"
                            required
                            value={form.username}
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> Email
                            </label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" /> Password
                        </label>
                        <input
                            type="password"
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold py-3 rounded-xl transition-colors mt-6"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLogin ? 'Login' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
