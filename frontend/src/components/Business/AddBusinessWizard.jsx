import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ChevronRight, ChevronLeft, MapPin, Image, CheckCircle2, Loader2, Gem, Locate
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import icon2x from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: icon2x,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const CATEGORIES = ['Food', 'Services', 'Retail', 'Health', 'Education', 'Entertainment', 'Other'];

const STEPS = [
    { label: 'Info', icon: '📝' },
    { label: 'Location', icon: '📍' },
    { label: 'Photo', icon: '📷' },
    { label: 'Confirm', icon: '✅' },
];

function StepIndicator({ current }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((step, i) => (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${i < current
                                ? 'bg-brand-500 border-brand-500 text-white'
                                : i === current
                                    ? 'bg-white border-brand-500 text-brand-600 shadow-md shadow-brand-100'
                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}
                        >
                            {i < current ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs font-medium ${i === current ? 'text-brand-600' : 'text-slate-400'}`}>
                            {step.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`w-10 h-0.5 mb-5 mx-1 transition-all duration-500 ${i < current ? 'bg-brand-500' : 'bg-slate-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

function InputField({ label, ...props }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {label}
            </label>
            <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-white transition-shadow shadow-sm"
                {...props}
            />
        </div>
    );
}

function LocationSelector({ position, setPosition }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position ? <Marker position={position} /> : null;
}

import { toast } from 'react-hot-toast';

export default function AddBusinessWizard({ onSuccess }) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        name: '', category: 'Food', description: '',
        location: '', lat: '', lng: '',
        imageUrl: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (res.data && res.data.display_name) {
                const parts = res.data.display_name.split(', ');
                return parts.slice(0, 3).join(', ');
            }
        } catch (err) {
            console.error("Reverse geocoding failed", err);
        }
        return '';
    };

    const handleMapClick = async (latlng) => {
        const lat = latlng.lat.toFixed(6);
        const lng = latlng.lng.toFixed(6);
        setForm(p => ({ ...p, lat, lng }));

        const address = await reverseGeocode(lat, lng);
        if (address) {
            setForm(p => ({ ...p, location: address }));
        }
    };

    const handleLocateMe = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            setIsLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);

                setForm(p => ({ ...p, lat, lng }));
                setIsLocating(false);
                toast.success('Location found!');

                const address = await reverseGeocode(lat, lng);
                if (address) {
                    setForm(p => ({ ...p, location: address }));
                }
            },
            () => {
                toast.error('Unable to retrieve your location');
                setIsLocating(false);
            }
        );
    };

    const canProceed = [
        form.name.trim() && form.description.trim(),
        form.location.trim() && form.lat && form.lng,
        form.imageUrl.trim() && !uploadingImage,
        true,
    ][step];

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Need to make sure token is sent, axios interceptor should handle it if set globally
            const res = await axios.post('http://localhost:8000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setForm(p => ({ ...p, imageUrl: res.data.imageUrl }));
            toast.success('Image uploaded successfully!');
        } catch (err) {
            toast.error('Failed to upload image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8000/api/businesses', {
                name: form.name,
                category: form.category,
                description: form.description,
                location: form.location,
                lat: parseFloat(form.lat),
                lng: parseFloat(form.lng),
                imageUrl: form.imageUrl,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setDone(true);
            toast.success("Hidden Gem added! Redirecting...");
            setTimeout(() => onSuccess && onSuccess(), 2500);
        } catch (err) {
            console.error("Submission error:", err.response?.data || err.message);
            setError(err.response?.data?.detail || 'Something went wrong. Please check your inputs and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">You're on the map! 🎉</h2>
                    <p className="text-slate-500 max-w-xs mx-auto">
                        <strong className="text-slate-700">{form.name}</strong> has been added to Hidden Gem. Redirecting to Discover…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-start justify-center p-4 pt-8">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Gem className="w-7 h-7 text-brand-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Add a Hidden Gem</h2>
                    <p className="text-slate-500 text-sm mt-1">Put your local business on the map in minutes.</p>
                </div>

                <StepIndicator current={step} />

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-4">
                    {/* Step 1 – Info */}
                    {step === 0 && (
                        <>
                            <h3 className="font-bold text-slate-700 text-lg">Business Info</h3>
                            <InputField
                                label="Business Name"
                                placeholder="e.g. Mama's Tacos"
                                value={form.name}
                                onChange={update('name')}
                                required
                            />
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                                <select
                                    value={form.category}
                                    onChange={update('category')}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white shadow-sm"
                                >
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Short Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={update('description')}
                                    rows={3}
                                    placeholder="What makes this place special?"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white resize-none shadow-sm"
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Step 2 – Location */}
                    {step === 1 && (
                        <>
                            <h3 className="font-bold text-slate-700 text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-500" /> Location</span>
                                <button
                                    onClick={handleLocateMe}
                                    disabled={isLocating}
                                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors disabled:opacity-50"
                                >
                                    {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" /> : <Locate className="w-3.5 h-3.5" />}
                                    {isLocating ? 'Locating...' : 'Use My Location'}
                                </button>
                            </h3>
                            <InputField
                                label="Location Label"
                                placeholder="e.g. Downtown Square, 5th Ave"
                                value={form.location}
                                onChange={update('location')}
                                required
                            />

                            <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-200 relative z-0">
                                <MapContainer
                                    center={form.lat && form.lng ? [form.lat, form.lng] : [40.7128, -74.0060]}
                                    zoom={14}
                                    scrollWheelZoom={true}
                                    className="w-full h-full"
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <LocationSelector
                                        position={form.lat && form.lng ? [parseFloat(form.lat), parseFloat(form.lng)] : null}
                                        setPosition={handleMapClick}
                                    />
                                </MapContainer>
                            </div>

                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                💡 Tip: Click on the map to pinpoint your exact location or use the button above.
                            </p>
                        </>
                    )}

                    {/* Step 3 – Photo */}
                    {step === 2 && (
                        <>
                            <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                                <Image className="w-5 h-5 text-brand-500" /> Business Photo
                            </h3>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 relative group hover:bg-slate-100 transition-colors">
                                {uploadingImage ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                                        <span className="text-sm font-medium text-slate-500">Uploading photo...</span>
                                    </div>
                                ) : form.imageUrl ? (
                                    <div className="relative w-full h-44 rounded-lg overflow-hidden shrink-0 group">
                                        <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-white text-sm font-semibold flex items-center gap-2">
                                                <Image className="w-4 h-4" /> Change Photo
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-slate-400">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            <Image className="w-6 h-6 text-brand-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-semibold text-slate-700">Click to upload photo</p>
                                            <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <p className="text-xs text-slate-400">
                                💡 Tip: Use a URL from Unsplash, Google Images or anywhere publicly accessible.
                            </p>
                        </>
                    )}

                    {/* Step 4 – Confirm */}
                    {step === 3 && (
                        <>
                            <h3 className="font-bold text-slate-700 text-lg">Review & Submit</h3>
                            <div className="rounded-xl overflow-hidden border border-slate-200">
                                {form.imageUrl && (
                                    <img src={form.imageUrl} alt={form.name} className="w-full h-36 object-cover" />
                                )}
                                <div className="p-4 space-y-2 bg-slate-50">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-slate-900 text-base">{form.name}</h4>
                                        <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-0.5 rounded-full">{form.category}</span>
                                    </div>
                                    <p className="flex items-center gap-1 text-sm text-slate-500">
                                        <MapPin className="w-3.5 h-3.5" /> {form.location}
                                    </p>
                                    <p className="text-sm text-slate-600 line-clamp-2">{form.description}</p>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        </>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 mt-4">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            className="flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            disabled={!canProceed}
                            onClick={() => setStep(s => s + 1)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                        >
                            Continue <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            {submitting ? 'Adding...' : 'Add to Hidden Gem'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
