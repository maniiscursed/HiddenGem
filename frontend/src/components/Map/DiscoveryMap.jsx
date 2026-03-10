import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Locate, Loader2 } from 'lucide-react';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';

// Custom dynamic marker based on rating and selected state
const getMarkerIcon = (rating, isSelected) => {
    let color = '#3b82f6'; // Blue for just created (0 rating)
    if (rating > 0) {
        if (rating < 3.0) color = '#ef4444'; // Red for low rating
        else if (rating < 4.5) color = '#f97316'; // Orange for mid rating
        else color = '#22c55e'; // Green for high rating
    }

    const size = isSelected ? 48 : 36;
    const anchor = isSelected ? [24, 48] : [18, 36];
    const shadowColor = isSelected ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)';

    const svg = `
        <div style="filter: drop-shadow(0px 4px 4px ${shadowColor}); transform-origin: bottom center; transition: all 0.3s ease;">
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                <circle cx="12" cy="10" r="3" fill="white" stroke="none"/>
            </svg>
        </div>
    `;

    return L.divIcon({
        className: 'custom-rating-marker',
        html: svg,
        iconSize: [size, size],
        iconAnchor: anchor,
        popupAnchor: [0, -size + 8]
    });
};

// Custom icon for the user's current location
const UserLocationIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#3b82f6; width:16px; height:16px; border-radius:50%; border:3px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

// Helper component to re-center map when selected business changes
function FlyToSelected({ business }) {
    const map = useMap();
    useEffect(() => {
        if (business) {
            map.flyTo([business.lat, business.lng], 15, { duration: 0.8 });
        }
    }, [business, map]);
    return null;
}

// Helper component to fly to user location
function FlyToLocation({ location }) {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo(location, 14, { duration: 0.8 });
        }
    }, [location, map]);
    return null;
}

export default function DiscoveryMap({ businesses, selectedBusiness, onMarkerClick, userLocation, isLocating, onLocateMe }) {
    const center = businesses.length > 0
        ? [businesses[0].lat, businesses[0].lng]
        : [40.7128, -74.0060];

    return (
        <div className="w-full h-full relative z-0">
            {/* Locate Me Button Overlay */}
            <div className="absolute top-4 right-4 z-[1000]">
                <button
                    onClick={onLocateMe}
                    disabled={isLocating}
                    className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200 text-slate-700 hover:text-brand-600 hover:bg-slate-50 transition-colors disabled:opacity-75 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    title="Use My Location"
                >
                    {isLocating ? (
                        <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                    ) : (
                        <Locate className="w-5 h-5" />
                    )}
                </button>
            </div>

            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <FlyToSelected business={selectedBusiness} />
                <FlyToLocation location={userLocation} />

                {/* User Location Marker */}
                {userLocation && (
                    <Marker position={userLocation} icon={UserLocationIcon}>
                        <Popup>
                            <span className="font-semibold text-sm text-slate-800">You are here</span>
                        </Popup>
                    </Marker>
                )}

                {businesses.map((biz) => (
                    <Marker
                        key={biz.id}
                        position={[biz.lat, biz.lng]}
                        icon={getMarkerIcon(biz.rating || 0, selectedBusiness?.id === biz.id)}
                        eventHandlers={{
                            click: () => onMarkerClick && onMarkerClick(biz),
                        }}
                    >
                        <Popup>
                            <div className="text-center font-sans min-w-[120px]">
                                <h3 className="font-bold text-slate-800 text-sm mb-0.5">{biz.name}</h3>
                                <p className="text-xs text-slate-500 mb-2">{biz.category} • ⭐ {biz.rating > 0 ? biz.rating.toFixed(1) : 'New'}</p>
                                <button
                                    onClick={() => onMarkerClick && onMarkerClick(biz)}
                                    className="text-xs bg-brand-500 text-white px-3 py-1.5 rounded-md flex items-center gap-1 mx-auto hover:bg-brand-600 transition-colors"
                                >
                                    <Navigation className="w-3 h-3" /> View Details
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
