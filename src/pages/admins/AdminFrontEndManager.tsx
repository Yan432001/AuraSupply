import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { 
  Palette, 
  Layout, 
  Sparkles, 
  QrCode, 
  Globe2, 
  Megaphone, 
  ShieldCheck, 
  Layers, 
  ArrowRight,
  Save,
  Check
} from 'lucide-react';

interface AdminFrontEndManagerProps {
  onNavigateToStoreManagement?: () => void;
}

export const AdminFrontEndManager: React.FC<AdminFrontEndManagerProps> = ({ onNavigateToStoreManagement }) => {
  const { activeStore } = useERP();

  const [heroHeading, setHeroHeading] = useState('Experience Elevated Gastronomy & Mixology');
  const [heroSubheading, setHeroSubheading] = useState('Order seamlessly from your table or via our Telegram Mini App.');
  const [accentColor, setAccentColor] = useState('indigo');
  const [announcementBanner, setAnnouncementBanner] = useState('Autumn Truffle & Rare Vintage Reserve Tasting Menu Available This Week.');
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ERP Architecture Clarity Notice */}
      <div className="bg-slate-900 border border-indigo-900/40 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Palette className="w-3.5 h-3.5" />
                Storefront Presentation &amp; Branding
              </span>
              <span className="text-xs text-slate-400">Store: {activeStore.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Front-End &amp; Guest Experience Settings
            </h1>
            <p className="text-xs text-slate-300">
              Manage visual branding, hospitality themes, welcome copy, and promotional announcements for the guest-facing E-Menu and Telegram Mini App.
            </p>
          </div>

          {onNavigateToStoreManagement && (
            <button
              onClick={onNavigateToStoreManagement}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition shrink-0"
            >
              <Layers className="w-4 h-4" />
              Manage Products in Store Manager
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Explicit separation notice */}
        <div className="mt-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-white font-semibold">ERP Architectural Separation Enforced:</strong> Products, menu pricing, stock availability, and low-stock warning thresholds are strictly controlled by the <strong className="text-indigo-400">Inventory Module</strong> via the Store Management view. The Front-End module controls presentation aesthetics only.
          </div>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual Brand & Slogan */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
            <Layout className="w-4 h-4 text-indigo-400" />
            Hero Slogan &amp; Welcome Message
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                E-Menu Headline
              </label>
              <input
                type="text"
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subheading / Hospitality Greeting
              </label>
              <textarea
                rows={2}
                value={heroSubheading}
                onChange={(e) => setHeroSubheading(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Brand Accent Palette
              </label>
              <div className="flex items-center gap-3">
                {[
                  { id: 'indigo', label: 'Aura Royal Indigo', bg: 'bg-indigo-600' },
                  { id: 'emerald', label: 'Jade Emerald', bg: 'bg-emerald-600' },
                  { id: 'amber', label: 'Gold Amber', bg: 'bg-amber-600' },
                  { id: 'rose', label: 'Ruby Velvet', bg: 'bg-rose-600' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setAccentColor(c.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      accentColor === c.id
                        ? 'border-white text-white bg-slate-800'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                    {c.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Promotional Announcements */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Megaphone className="w-4 h-4 text-amber-400" />
              Storefront Banner &amp; Announcements
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Announcement Text (Guest View Top Bar)
              </label>
              <textarea
                rows={3}
                value={announcementBanner}
                onChange={(e) => setAnnouncementBanner(e.target.value)}
                disabled={!announcementActive}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 disabled:opacity-50 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                Active Multi-Language Support:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['English (Default)', 'Japanese (日本語)', 'French (Français)', 'Arabic (العربية)'].map((lang) => (
                  <span key={lang} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end items-center gap-3 pt-2">
        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <Check className="w-4 h-4" />
            Front-End branding preferences updated!
          </span>
        )}
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Save className="w-4 h-4" />
          Save Front-End Settings
        </button>
      </div>
    </div>
  );
};
