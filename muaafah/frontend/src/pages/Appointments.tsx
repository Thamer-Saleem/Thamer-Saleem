import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Stethoscope, CheckCircle, XCircle, AlertCircle, Ban } from 'lucide-react';
import { appointmentsApi } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import type { Appointment } from '../types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle size={14} /> },
  confirmed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
  cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
  completed: { color: 'bg-gray-100 text-gray-700', icon: <CheckCircle size={14} /> },
  no_show: { color: 'bg-gray-100 text-gray-500', icon: <Ban size={14} /> },
};

export default function Appointments() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'all'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    appointmentsApi.getAll()
      .then(r => setAppointments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm(t('appointments.confirmCancel'))) return;
    try {
      await appointmentsApi.cancel(id, 'Patient requested cancellation');
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a)
      );
      toast.success(t('appointments.cancelledSuccess'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const displayed = tab === 'upcoming' ? upcoming : appointments;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('appointments.title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {[
          { key: 'upcoming', label: `${t('appointments.upcoming')} (${upcoming.length})` },
          { key: 'all', label: `${t('common.viewAll')} (${appointments.length})` },
        ].map(tab_ => (
          <button
            key={tab_.key}
            onClick={() => setTab(tab_.key as 'upcoming' | 'all')}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              tab === tab_.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab_.label}
          </button>
        ))}
      </div>

      {/* Appointment Cards */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Calendar size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">{t('appointments.noAppointments')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(appointment => {
            const statusConf = STATUS_CONFIG[appointment.status];
            const canCancel = ['pending', 'confirmed'].includes(appointment.status);

            return (
              <div key={appointment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center shrink-0">
                    <Stethoscope size={22} className="text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {appointment.appointment_type}
                        </h3>
                        {appointment.reason && (
                          <p className="text-sm text-gray-500 mt-0.5">{appointment.reason}</p>
                        )}
                      </div>
                      <span className={clsx(
                        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
                        statusConf.color
                      )}>
                        {statusConf.icon}
                        {t(`appointments.status.${appointment.status}`)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {appointment.scheduled_date}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Clock size={14} className="text-gray-400" />
                        {appointment.scheduled_time}
                      </div>
                    </div>

                    {appointment.co_payment && (
                      <div className="mt-2 text-xs text-gray-500">
                        {t('appointments.coPayment')}: {appointment.co_payment}
                      </div>
                    )}
                  </div>
                </div>

                {canCancel && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      onClick={() => handleCancel(appointment.id)}
                      className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all font-medium"
                    >
                      {t('appointments.cancel')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
