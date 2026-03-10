import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MapPin, BadgeCheck, Star, Send, Loader2 } from 'lucide-react';

function StarRating({ value, onChange, readOnly = false }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readOnly}
                    onClick={() => !readOnly && onChange && onChange(star)}
                    onMouseEnter={() => !readOnly && setHovered(star)}
                    onMouseLeave={() => !readOnly && setHovered(0)}
                    className={`transition-transform ${!readOnly ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
                >
                    <Star
                        className={`w-6 h-6 transition-colors ${star <= (hovered || value)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

import { toast } from 'react-hot-toast';

export default function BusinessDetailModal({ business, onClose, currentUser, onRequireAuth }) {
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [vibe, setVibe] = useState(null);
    const [loadingVibe, setLoadingVibe] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ author: '', rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        if (!business) return;
        setLoadingReviews(true);
        setLoadingVibe(true);

        const fetchReviews = axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/businesses/${business.id}/reviews`);
        const fetchVibe = axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/businesses/${business.id}/vibe`);

        Promise.all([fetchReviews, fetchVibe])
            .then(([reviewsRes, vibeRes]) => {
                setReviews(reviewsRes.data);
                setVibe(vibeRes.data.vibe);
            })
            .catch(() => {
                setReviews([]);
                setVibe("Unable to load community vibe.");
            })
            .finally(() => {
                setLoadingReviews(false);
                setLoadingVibe(false);
            });
    }, [business]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            onRequireAuth();
            return;
        }

        if (!reviewForm.comment.trim()) return;
        setSubmitting(true);
        try {
            const payload = { ...reviewForm, author: currentUser.username };
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/businesses/${business.id}/reviews`,
                payload
            );
            setReviews(prev => [...prev, res.data]);
            setSubmitSuccess(true);
            toast.success("Review submitted! Thank you.");
            setReviewForm({ author: '', rating: 5, comment: '' });
            setTimeout(() => {
                setSubmitSuccess(false);
                setShowReviewForm(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to submit review', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!business) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal Panel */}
            <div
                className="relative bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Hero Image */}
                <div className="relative h-52 flex-shrink-0">
                    <img
                        src={business.imageUrl}
                        alt={business.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors backdrop-blur-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-brand-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                {business.category}
                            </span>
                            {business.verified && (
                                <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                    <BadgeCheck className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>
                        <h2 className="text-white text-xl font-bold leading-tight">
                            {business.name}
                        </h2>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Location & Rating */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            {business.location}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <StarRating value={Math.round(business.rating)} readOnly />
                            <span className="font-bold text-slate-800 text-sm">{business.rating > 0 ? business.rating.toFixed(1) : 'New'}</span>
                            <span className="text-slate-400 text-xs">({business.reviewCount})</span>
                        </div>
                    </div>

                    {/* Description & Vibe Check */}
                    <p className="text-slate-600 leading-relaxed text-sm">{business.description}</p>

                    <div className="bg-gradient-to-r from-brand-50 to-indigo-50 rounded-xl p-4 border border-brand-100 shadow-sm relative overflow-hidden mt-4">
                        <div className="flex items-start gap-3 relative z-10">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                <span className="text-lg">✨</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm mb-1">Community Vibe</h4>
                                {loadingVibe ? (
                                    <div className="flex items-center gap-2 text-brand-500 py-1">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span className="text-xs font-medium">Analyzing reviews...</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-700 italic">"{vibe}"</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100 mt-4" />

                    {/* Reviews Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-800">Reviews</h3>
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="text-brand-600 hover:text-brand-700 text-sm font-medium transition-colors"
                            >
                                {showReviewForm ? 'Cancel' : '+ Leave a Review'}
                            </button>
                        </div>

                        {/* Review Form */}
                        {showReviewForm && (
                            <form
                                onSubmit={handleSubmitReview}
                                className="mb-4 bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200"
                            >
                                {submitSuccess ? (
                                    <div className="text-center py-3">
                                        <p className="text-emerald-600 font-semibold">✅ Review submitted! Thank you.</p>
                                    </div>
                                ) : (
                                    <>
                                        {!currentUser && (
                                            <div>
                                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Your Name</label>
                                                <input
                                                    type="text"
                                                    value={reviewForm.author}
                                                    onChange={e => setReviewForm(p => ({ ...p, author: e.target.value }))}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-100 text-slate-400 cursor-not-allowed"
                                                    placeholder="Sign in to post as your username"
                                                    disabled
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Rating</label>
                                            <StarRating
                                                value={reviewForm.rating}
                                                onChange={v => setReviewForm(p => ({ ...p, rating: v }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Your Review</label>
                                            <textarea
                                                value={reviewForm.comment}
                                                onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white resize-none"
                                                rows={3}
                                                placeholder="Share your experience..."
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            {submitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </>
                                )}
                            </form>
                        )}

                        {/* Reviews List */}
                        {loadingReviews ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <p className="text-slate-400 text-sm text-center py-4">No reviews yet. Be the first!</p>
                        ) : (
                            <div className="space-y-3">
                                {reviews.map(review => (
                                    <div key={review.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-slate-800 text-sm">{review.author}</span>
                                            <span className="text-xs text-slate-400">{review.date}</span>
                                        </div>
                                        <div className="flex gap-0.5 mb-2">
                                            {[1, 2, 3, 4, 5].map(s => (
                                                <Star
                                                    key={s}
                                                    className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
