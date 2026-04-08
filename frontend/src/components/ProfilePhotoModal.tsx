import React, { useState, useRef } from 'react';
import { X, Check, Upload } from 'lucide-react';

interface ProfilePhotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (photoUrl: string) => void;
    currentPhoto: string;
}

const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Bob', 'Jack', 'Midnight', 'Molly',
    'Coco', 'Buddy', 'Bella', 'Simba', 'Angel', 'Garfield',
    'Luna', 'Oreo', 'Pepper', 'Sadie', 'Sophie', 'Toby'
];

export default function ProfilePhotoModal({ isOpen, onClose, onSelect, currentPhoto }: ProfilePhotoModalProps) {
    const [activeTab, setActiveTab] = useState<'avatars' | 'upload'>('avatars');
    const [customUrl, setCustomUrl] = useState('');
    const [uploadPreview, setUploadPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) {
        return null;
    }

    const handleAvatarSelect = (seed: string) => {
        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        onSelect(url);
        onClose();
    };

    const handleCustomUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customUrl) {
            onSelect(customUrl);
            setCustomUrl('');
            onClose();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setUploadPreview(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadSubmit = () => {
        if (uploadPreview) {
            onSelect(uploadPreview);
            setUploadPreview('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8">

                {/* Header */}
                <div className="p-6 border-b-2 border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-gray-900">Update Profile Photo</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-2 border-gray-200 bg-gray-50 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('avatars')}
                        className={`flex-1 px-6 py-4 font-bold text-sm uppercase tracking-wide transition-all ${
                            activeTab === 'avatars'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        Professional Avatars
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 px-6 py-4 font-bold text-sm uppercase tracking-wide transition-all ${
                            activeTab === 'upload'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        Upload From Laptop
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 max-h-[calc(90vh-200px)]">

                    {/* Professional Avatars Tab */}
                    {activeTab === 'avatars' && (
                        <div>
                            <p className="text-slate-600 mb-6 text-sm font-medium">Choose from our collection of professional avatars.</p>

                            {/* Grid */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-8">
                                {AVATAR_SEEDS.map((seed) => {
                                    const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                                    const isSelected = currentPhoto === url;

                                    return (
                                        <button
                                            key={seed}
                                            onClick={() => handleAvatarSelect(seed)}
                                            className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 hover:scale-110 flex-shrink-0 ${
                                                isSelected
                                                    ? 'border-blue-600 ring-4 ring-blue-200 shadow-lg'
                                                    : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                                            }`}
                                            type="button"
                                        >
                                            <img
                                                src={url}
                                                alt={`Avatar ${seed}`}
                                                className="w-full h-full object-cover bg-blue-50"
                                                loading="eager"
                                                onError={(e) => {
                                                    const img = e.target as HTMLImageElement;
                                                    img.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E';
                                                }}
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                                    <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
                                                        <Check className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Upload Photo Tab */}
                    {activeTab === 'upload' && (
                        <div>
                            <p className="text-slate-600 mb-6 text-sm font-medium">Upload a portrait photo from your laptop (max 5MB)</p>

                            {uploadPreview ? (
                                <div>
                                    <div className="mb-6">
                                        <label className="text-sm font-bold text-gray-900 mb-3 block uppercase tracking-wide">Preview</label>
                                        <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-blue-200 bg-slate-100 flex items-center justify-center mx-auto shadow-md">
                                            <img
                                                src={uploadPreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setUploadPreview('')}
                                            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-300 text-gray-700 font-bold hover:bg-slate-50 transition-colors text-sm uppercase"
                                        >
                                            Choose Another
                                        </button>
                                        <button
                                            onClick={handleUploadSubmit}
                                            className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors text-sm uppercase shadow-lg"
                                        >
                                            Use This Photo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full p-8 border-2 border-dashed border-slate-400 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center justify-center cursor-pointer group"
                                    >
                                        <div className="text-slate-400 group-hover:text-blue-600 transition-colors mb-3">
                                            <Upload className="w-16 h-16" />
                                        </div>
                                        <p className="font-bold text-gray-900 text-center text-lg">Click to upload photo</p>
                                        <p className="text-sm text-gray-500 text-center mt-2">or drag and drop</p>
                                        <p className="text-xs text-gray-400 text-center mt-2">PNG, JPG, GIF up to 5MB</p>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}
