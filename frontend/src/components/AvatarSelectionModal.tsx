import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface AvatarSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (avatarUrl: string) => void;
    currentAvatar: string;
}

const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Bob', 'Jack', 'Midnight', 'Molly',
    'Coco', 'Buddy', 'Bella', 'Simba', 'Angel', 'Garfield',
    'Luna', 'Oreo', 'Pepper', 'Sadie', 'Sophie', 'Toby'
];

export default function AvatarSelectionModal({ isOpen, onClose, onSelect, currentAvatar }: AvatarSelectionModalProps) {
    const [customUrl, setCustomUrl] = useState('');

    if (!isOpen) return null;

    const handleSelect = (seed: string) => {
        const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        onSelect(url);
        onClose();
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customUrl) {
            onSelect(customUrl);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Choose an Avatar</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-slate-600 mb-6">Select a style or enter a custom URL.</p>

                    {/* Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-8">
                        {AVATAR_SEEDS.map((seed) => {
                            const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                            const isSelected = currentAvatar === url;

                            return (
                                <button
                                    key={seed}
                                    onClick={() => handleSelect(seed)}
                                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${isSelected
                                            ? 'border-blue-600 ring-4 ring-blue-100'
                                            : 'border-slate-200 hover:border-blue-400 hover:shadow-md'
                                        }`}
                                >
                                    <img
                                        src={url}
                                        alt={`Avatar ${seed}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                            <div className="bg-blue-600 text-white p-1 rounded-full">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom URL */}
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Or use a custom image URL</h3>
                        <form onSubmit={handleCustomSubmit} className="flex gap-3">
                            <input
                                type="url"
                                value={customUrl}
                                onChange={(e) => setCustomUrl(e.target.value)}
                                placeholder="https://example.com/my-avatar.png"
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!customUrl}
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Set
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
