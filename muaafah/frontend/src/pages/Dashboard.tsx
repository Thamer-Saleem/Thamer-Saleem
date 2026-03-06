import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Calendar, AlertTriangle, CheckCircle,
  ArrowRight, Upload, Stethoscope, TrendingUp, Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { labsApi, appointmentsApi } from '../utils/api';
import type { LabReport, Appointment } from '../types';
import clsx from 'clsx';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  processing: 'bg-blue-100 text-blue-700',
  analyzed: 'bg-green-100 text-green-700',
  action_required: 'bg-red-100 text-red-700',
  error: 'bg-gray-100 text-gray-500',
};

const APPT_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
  no_show: 'bg-gray-100 text-gray-500',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = language === 'ar' && user?.full_name_ar ? user.full_name_ar : user?.full_name_en;

  useEffect(() => {
    Promise.all([
      labsApi.getAll().then(r => setReports(r.data)),
      appointmentsApi.getUpcoming().then(r => setAppointments(r.data)),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const actionRequired = reports.filter(r => r.status === 'action_required').length;
  const totalAppointments = appointments.length;

  const kpis = [
    {
      label: t('labs.title'),
      value: reports.length,
      icon: <FlaskConical size={22} />,
      color: 'bg-blue-50 text-blue-600',
      sub: `${actionRequired} ${t('dashboard.actionRequired')}`,
      subColor: actionRequired > 0 ? 'text-red-500' : 'text-gray-400',
    },
    {
      label: t('appointments.title'),
      value: totalAppointments,
      icon: <Calendar size={22} />,
      color: 'bg-primary-50 text-primary-600',
      sub: t('appointments.upcoming'),
      subColor: 'text-gray-400',
    },
    {
      label: t('dashboard.healthScore'),
      value: actionRequired === 0 ? '98%' : `${Math.max(70, 98 - actionRequired * 8)}%`,
      icon: <Activity size={22} />,
      color: 'bg-emerald-50 text-emerald-600',
      sub: actionRequired === 0 ? t('dashboard.allNormal') : t('dashboard.actionRequired'),
      subColor: actionRequired > 0 ? 'text-orange-500' : 'text-emerald-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.greeting')}, {displayName}! 👋
          </h1>
          <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        {user?.nafath_verified && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-xs font-medium text-green-700">Nafath Verified</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={clsx('p-2.5 rounded-xl', kpi.color)}>
                {kpi.icon}
              </div>
              <TrendingUp size={16} className="text-gray-300" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{kpi.value}</div>
            <div className="text-sm text-gray-600">{kpi.label}</div>
            <div className={clsx('text-xs mt-1', kpi.subColor)}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Action Alerts */}
      {actionRequired > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">
              {actionRequired} {t('labs.status.action_required')}
            </h3>
            <p className="text-red-600 text-sm mt-0.5">{t('labs.disclaimer')}</p>
          </div>
          <button
            onClick={() => navigate('/labs')}
            className="text-red-700 font-medium text-sm hover:underline shrink-0"
          >
            {t('common.viewAll')} →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Lab Reports */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FlaskConical size={18} className="text-primary-600" />
              {t('dashboard.recentReports')}
            </h2>
            <button
              onClick={() => navigate('/labs')}
              className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              {t('common.viewAll')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FlaskConical size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('dashboard.noReports')}</p>
              </div>
            ) : (
              reports.slice(0, 4).map(report => (
                <button
                  key={report.id}
                  onClick={() => navigate(`/labs/${report.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <FlaskConical size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{report.file_name}</p>
                    <p className="text-xs text-gray-400">
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span className={clsx(
                    'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
                    STATUS_COLORS[report.status]
                  )}>
                    {t(`labs.status.${report.status}`)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={18} className="text-primary-600" />
              {t('dashboard.upcomingAppts')}
            </h2>
            <button
              onClick={() => navigate('/appointments')}
              className="text-primary-600 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              {t('common.viewAll')} <ArrowRight size={14} />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t('dashboard.noAppointments')}</p>
              </div>
            ) : (
              appointments.slice(0, 4).map(appt => (
                <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <Stethoscope size={18} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appt.appointment_type}
                    </p>
                    <p className="text-xs text-gray-400">
                      {appt.scheduled_date} • {appt.scheduled_time}
                    </p>
                  </div>
                  <span className={clsx(
                    'text-xs px-2.5 py-1 rounded-full font-medium shrink-0',
                    APPT_COLORS[appt.status]
                  )}>
                    {t(`appointments.status.${appt.status}`)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="font-semibold text-lg mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: t('dashboard.uploadReport'), icon: <Upload size={20} />, path: '/labs', bg: 'bg-white/20' },
            { label: t('dashboard.findDoctor'), icon: <Stethoscope size={20} />, path: '/providers', bg: 'bg-white/20' },
            { label: t('appointments.book'), icon: <Calendar size={20} />, path: '/appointments', bg: 'bg-white/20' },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/30',
                action.bg
              )}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
              <ArrowRight size={14} className="ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
