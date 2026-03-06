import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, MapPin, Star, Globe, Phone, Clock, CheckCircle,
  Filter, Stethoscope, ChevronRight
} from 'lucide-react';
import { providersApi, appointmentsApi } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import type { Provider, ProviderSlot } from '../types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const SPECIALTIES = [
  'Endocrinologist', 'Cardiologist', 'Nephrologist',
  'Hepatologist', 'Hematologist', 'Internal Medicine'
];

const INSURERS = ['Bupa', 'Tawuniya', 'MedGulf', 'AXA Cooperative'];
const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah'];

export default function Providers() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [insurance, setInsurance] = useState('');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ProviderSlot | null>(null);
  const [bookingReason, setBookingReason] = useState('');
  const [booking, setBooking] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await providersApi.search({
        specialty: specialty || undefined,
        insurance: insurance || undefined,
        city: city || undefined,
      });
      setProviders(res.data);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [specialty, insurance, city, t]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const filtered = providers.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.doctor_name_en.toLowerCase().includes(q) ||
      p.doctor_name_ar?.toLowerCase().includes(q) ||
      p.specialty_en.toLowerCase().includes(q) ||
      p.organization_name_en.toLowerCase().includes(q)
    );
  });

  const handleBook = async () => {
    if (!bookingProvider || !selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    setBooking(true);
    try {
      await appointmentsApi.book({
        provider_id: bookingProvider.id,
        scheduled_date: selectedSlot.date,
        scheduled_time: selectedSlot.start_time,
        slot_id: selectedSlot.id,
        reason: bookingReason,
      });
      toast.success(t('appointments.bookedSuccess'));
      setBookingProvider(null);
      setSelectedSlot(null);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBooking(false);
    }
  };

  const pName = (p: Provider) => language === 'ar' && p.doctor_name_ar ? p.doctor_name_ar : p.doctor_name_en;
  const pOrg = (p: Provider) => language === 'ar' && p.organization_name_ar ? p.organization_name_ar : p.organization_name_en;
  const pSpecialty = (p: Provider) => language === 'ar' && p.specialty_ar ? p.specialty_ar : p.specialty_en;
  const pAddress = (p: Provider) => language === 'ar' && p.address_ar ? p.address_ar : p.address_en;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('providers.title')}</h1>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('providers.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <select
            value={specialty}
            onChange={e => setSpecialty(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">{t('providers.allSpecialties')}</option>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={insurance}
            onChange={e => setInsurance(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">{t('providers.filterInsurance')}</option>
            {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="">{t('providers.allCities')}</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Provider Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Stethoscope size={48} className="mx-auto mb-3 opacity-20" />
          <p>{t('providers.noProviders')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(provider => (
            <div key={provider.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <img
                  src={provider.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.id}`}
                  alt={pName(provider)}
                  className="w-16 h-16 rounded-2xl object-cover bg-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{pName(provider)}</h3>
                  <p className="text-primary-600 text-sm font-medium">{pSpecialty(provider)}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{pOrg(provider)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium text-gray-700">{provider.rating}</span>
                      <span className="text-xs text-gray-400">({provider.review_count})</span>
                    </div>
                    {provider.city && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={10} /> {provider.city}
                      </div>
                    )}
                    {provider.consultation_fee && (
                      <span className="text-xs text-gray-500">
                        {provider.consultation_fee} {t('common.saudi_riyal')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Insurance Networks */}
              {provider.insurance_networks && provider.insurance_networks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {provider.insurance_networks.slice(0, 3).map((net, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle size={10} /> {net}
                    </span>
                  ))}
                  {provider.insurance_networks.length > 3 && (
                    <span className="text-xs text-gray-400">+{provider.insurance_networks.length - 3} more</span>
                  )}
                </div>
              )}

              {/* Address */}
              {pAddress(provider) && (
                <p className="mt-3 text-xs text-gray-500 flex items-start gap-1.5">
                  <MapPin size={12} className="shrink-0 mt-0.5" />
                  {pAddress(provider)}
                </p>
              )}

              {/* Available Slots Preview */}
              {provider.available_slots && provider.available_slots.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    <Clock size={12} className="inline mr-1" />
                    {t('providers.available')}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {provider.available_slots.slice(0, 3).map(slot => (
                      <span key={slot.id} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-lg border border-primary-100 font-medium">
                        {slot.date} {slot.start_time}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={() => setBookingProvider(provider)}
                className="mt-4 w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
              >
                {t('providers.book')} <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t('appointments.book')}</h3>
            <p className="text-gray-500 text-sm mb-5">{pName(bookingProvider)} • {pSpecialty(bookingProvider)}</p>

            {/* Slot Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('providers.available')}</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {bookingProvider.available_slots?.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={clsx(
                      'p-2.5 rounded-xl border text-xs font-medium transition-all',
                      selectedSlot?.id === slot.id
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-primary-300 text-gray-700'
                    )}
                  >
                    <div className="font-semibold">{slot.date}</div>
                    <div>{slot.start_time} - {slot.end_time}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('appointments.reason')}</label>
              <textarea
                value={bookingReason}
                onChange={e => setBookingReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Reason for visit..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setBookingProvider(null); setSelectedSlot(null); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleBook}
                disabled={!selectedSlot || booking}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {booking ? t('common.loading') : t('appointments.book')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
