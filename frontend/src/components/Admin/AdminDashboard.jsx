import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, AlertCircle, ShieldCheck, Loader2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDashboard({ onBack }) {
    const [businesses, setBusinesses] = useState([]);
    const [stats, setStats] = useState({ totalUsers: 0, totalBusinesses: 0, totalReviews: 0, averageRating: 0.0 });
    const [loading, setLoading] = useState(true);
    const [expandedBizId, setExpandedBizId] = useState(null);
    const [bizReviews, setBizReviews] = useState({});
    const [loadingReviews, setLoadingReviews] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const [bizRes, statsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/businesses`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setBusinesses(bizRes.data);
            setStats(statsRes.data);
        } catch (err) {
            toast.error('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This will also delete all its reviews.`)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/businesses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Deleted business: ${name}`);
            setBusinesses(businesses.filter(b => b.id !== id));
            fetchData(); // refresh stats
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to delete business');
        }
    };

    const toggleExpand = async (bizId) => {
        if (expandedBizId === bizId) {
            setExpandedBizId(null);
            return;
        }
        setExpandedBizId(bizId);
        if (!bizReviews[bizId]) {
            setLoadingReviews(true);
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/businesses/${bizId}/reviews`);
                setBizReviews(prev => ({ ...prev, [bizId]: res.data }));
            } catch (err) {
                toast.error('Failed to load reviews');
            } finally {
                setLoadingReviews(false);
            }
        }
    };

    const handleDeleteReview = async (reviewId, bizId) => {
        if (!window.confirm('Delete this review permanently?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/reviews/${reviewId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Review deleted');
            // Remove from local state
            setBizReviews(prev => ({
                ...prev,
                [bizId]: prev[bizId].filter(r => r.id !== reviewId)
            }));
            fetchData(); // refresh averages
        } catch (err) {
            toast.error('Failed to delete review');
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-brand-500" /> Admin Dashboard
                        </h2>
                        <p className="text-xs text-slate-500">Manage businesses & community content</p>
                    </div>
                </div>
                <div className="text-sm font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {businesses.length} Total Listings
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                        <div className="text-2xl font-bold text-brand-600">{stats.totalUsers}</div>
                        <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Total Users</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                        <div className="text-2xl font-bold text-brand-600">{stats.totalBusinesses}</div>
                        <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Businesses</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                        <div className="text-2xl font-bold text-brand-600">{stats.totalReviews}</div>
                        <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Reviews</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
                        <div className="text-2xl font-bold text-brand-600">{stats.averageRating.toFixed(1)}</div>
                        <div className="text-xs font-semibold text-slate-500 uppercase mt-1">Avg Rating</div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-3 text-brand-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm font-medium">Loading listings...</span>
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        <p>No businesses found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">Business Name</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3 text-center">Reviews</th>
                                    <th className="px-4 py-3 text-center">Rating</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {businesses.map(biz => (
                                    <React.Fragment key={biz.id}>
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900">#{biz.id}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <img src={biz.imageUrl} alt="" className="w-6 h-6 rounded-md object-cover bg-slate-200" />
                                                    <span className="font-semibold text-slate-700">{biz.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{biz.category}</span></td>
                                            <td className="px-4 py-3 text-center">{biz.reviewCount}</td>
                                            <td className="px-4 py-3 text-center font-bold text-amber-500">{biz.rating > 0 ? biz.rating.toFixed(1) : '-'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => toggleExpand(biz.id)}
                                                    className="text-slate-500 hover:text-brand-600 p-1.5 hover:bg-brand-50 rounded-lg transition-colors inline-block mr-1"
                                                    title="View Reviews"
                                                >
                                                    {expandedBizId === biz.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(biz.id, biz.name)}
                                                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-block"
                                                    title="Delete Business"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedBizId === biz.id && (
                                            <tr className="bg-slate-50">
                                                <td colSpan="6" className="px-6 py-4">
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Community Reviews</h4>
                                                    {loadingReviews && !bizReviews[biz.id] ? (
                                                        <div className="flex items-center gap-2 text-brand-500 py-2">
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            <span className="text-xs">Loading...</span>
                                                        </div>
                                                    ) : bizReviews[biz.id]?.length === 0 ? (
                                                        <p className="text-sm text-slate-500 italic py-2">No reviews yet.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {bizReviews[biz.id]?.map(review => (
                                                                <div key={review.id} className="flex items-start justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-semibold text-sm text-slate-800">{review.author}</span>
                                                                            <span className="text-xs text-amber-500 font-bold">⭐ {review.rating}</span>
                                                                            <span className="text-xs text-slate-400">{review.date}</span>
                                                                        </div>
                                                                        <p className="text-sm text-slate-600">{review.comment}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDeleteReview(review.id, biz.id)}
                                                                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors ml-4"
                                                                        title="Delete Review"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
