import React from 'react';
import { MapPin, BadgeCheck } from 'lucide-react';

export default function BusinessCard({ business, onClick }) {
    return (
        <div
            className="mb-4 bg-white rounded-xl border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all cursor-pointer group flex flex-col overflow-hidden"
            onClick={() => onClick && onClick(business)}
        >
            <div className="h-40 bg-slate-200 relative overflow-hidden">
                <img
                    src={business.imageUrl}
                    alt={business.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-brand-600">
                    {business.category}
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors flex items-center gap-1 text-lg">
                        {business.name}
                        {business.verified && <BadgeCheck className="w-4 h-4 text-emerald-500" title="Verified by Locals" />}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-700 bg-amber-50 px-2 py-1 rounded-md items-center shadow-sm">
                        {business.rating > 0 ? `⭐ ${business.rating.toFixed(1)}` : '⭐ New'}
                    </div>
                </div>
                <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {business.location}
                    {business.distance !== undefined && (
                        <span className="ml-2 text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                            {business.distance < 1 ? '< 1' : business.distance.toFixed(1)} km
                        </span>
                    )}
                </div>
                <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                    {business.description}
                </p>
            </div>
        </div>
    );
}
