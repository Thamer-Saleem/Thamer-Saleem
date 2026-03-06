import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { Eye, EyeOff, Shield, Activity, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type Mode = 'login' | 'register' | 'nafath';

export default function Login() {
  const { login, register, loginNafath } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', full_name_en: '',
    phone: '', national_id: '', role: 'patient'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success(t('auth.loginBtn') + ' ✓');
      } else if (mode === 'register') {
        await register({
          email: form.email,
          password: form.password,
          full_name_en: form.full_name_en,
          phone: form.phone,
          role: form.role,
        });
        toast.success(t('auth.registerBtn') + ' ✓');
      } else {
        await loginNafath(form.national_id);
        toast.success(t('auth.nafathLogin') + ' ✓');
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-2xl">م</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">معافاة</h1>
            <p className="text-primary-200 text-sm">Mua'afah</p>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            {t('app.tagline')}
          </h2>
          <p className="text-primary-100 text-lg mb-8">
            {t('app.description')}
          </p>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: <FileText size={20} />, text: 'AI-powered lab report analysis' },
              { icon: <Activity size={20} />, text: 'Personalized health recommendations' },
              { icon: <Shield size={20} />, text: 'NPHIES insurance integration' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="text-primary-200">{item.icon}</div>
                <span className="text-sm text-primary-50">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-200 text-xs">
          © 2024 Mua'afah - معافاة | Powered by Claude AI
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">م</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">معافاة</h1>
          </div>

          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {mode === 'login' ? t('auth.loginTitle') :
               mode === 'register' ? t('auth.registerTitle') :
               t('auth.nafathLogin')}
            </h2>
            <p className="text-gray-500 text-sm mb-6">{t('auth.welcome')}</p>

            {/* Mode Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl">
              {(['login', 'register', 'nafath'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={clsx(
                    'flex-1 py-2 text-xs font-medium rounded-lg transition-all',
                    mode === m
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {m === 'login' ? t('auth.signIn') :
                   m === 'register' ? t('auth.signUp') :
                   'Nafath 🔐'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'nafath' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('auth.nationalId')}
                  </label>
                  <input
                    type="text"
                    name="national_id"
                    value={form.national_id}
                    onChange={handleChange}
                    required
                    placeholder="1XXXXXXXXX"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">{t('auth.nafathDesc')}</p>
                </div>
              ) : (
                <>
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t('auth.fullName')}
                        </label>
                        <input
                          type="text"
                          name="full_name_en"
                          value={form.full_name_en}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {t('auth.phone')}
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                          placeholder="+966 5X XXX XXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Role
                        </label>
                        <select
                          name="role"
                          value={form.role}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                        >
                          <option value="patient">Patient</option>
                          <option value="provider_admin">Provider Admin</option>
                          <option value="insurer_admin">Insurer Admin</option>
                          <option value="system_admin">System Admin</option>
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('auth.email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t('auth.password')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? t('common.loading') :
                 mode === 'login' ? t('auth.loginBtn') :
                 mode === 'register' ? t('auth.registerBtn') :
                 t('auth.nafathLogin')}
              </button>

              {mode !== 'nafath' && (
                <p className="text-center text-xs text-gray-500">
                  {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-primary-600 font-medium hover:underline"
                  >
                    {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
                  </button>
                </p>
              )}
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            🔒 Secured with Nafath | SAMA Compliant | PDPL Protected
          </p>
        </div>
      </div>
    </div>
  );
}
