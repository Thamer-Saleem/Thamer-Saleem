import React, { useState } from 'react';
import { User, Shield, Bell, Globe, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [form, setForm] = useState({
    full_name_en: user?.full_name_en || '',
    full_name_ar: user?.full_name_ar || '',
    phone: user?.phone || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/me', form);
      toast.success(t('profile.saved'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {user?.full_name_en?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.full_name_en}</h2>
            {user?.full_name_ar && <p className="text-primary-200">{user.full_name_ar}</p>}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-primary-100 text-sm capitalize">{user?.role?.replace('_', ' ')}</span>
              {user?.nafath_verified && (
                <div className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  <CheckCircle size={10} /> Nafath Verified
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User size={18} className="text-primary-600" />
          {t('profile.personalInfo')}
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name (English)
              </label>
              <input
                type="text"
                value={form.full_name_en}
                onChange={e => setForm(p => ({ ...p, full_name_en: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                الاسم الكامل (عربي)
              </label>
              <input
                type="text"
                value={form.full_name_ar}
                onChange={e => setForm(p => ({ ...p, full_name_ar: e.target.value }))}
                dir="rtl"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.phone')}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.dateOfBirth')}</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.gender')}</label>
              <select
                value={form.gender}
                onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="">Select...</option>
                <option value="male">{t('auth.male')}</option>
                <option value="female">{t('auth.female')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('profile.save')}
          </button>
        </form>
      </div>

      {/* Language Preference */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={18} className="text-primary-600" />
          {t('profile.language')}
        </h3>
        <div className="flex gap-3">
          {[
            { value: 'en', label: '🇬🇧 English', desc: 'Left-to-right (LTR)' },
            { value: 'ar', label: '🇸🇦 العربية', desc: 'يمين لليسار (RTL)' },
          ].map(lang => (
            <button
              key={lang.value}
              onClick={() => setLanguage(lang.value as 'en' | 'ar')}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                language === lang.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{lang.label}</div>
              <div className="text-xs text-gray-500 mt-1">{lang.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={18} className="text-primary-600" />
          {t('profile.security')}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-700">Nafath Identity Verification</span>
            {user?.nafath_verified
              ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> Verified</span>
              : <span className="text-gray-400">Not verified</span>
            }
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-700">Data Encryption</span>
            <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> AES-256</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-700">PDPL Compliance</span>
            <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle size={14} /> Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
