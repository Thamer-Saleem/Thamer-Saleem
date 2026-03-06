import React, { useEffect, useState } from 'react';
import { Users, Activity, BarChart3, ClipboardList, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { adminApi } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import clsx from 'clsx';

interface AdminDashboardData {
  kpis: Record<string, number | string>;
  recent_alerts: Array<{type: string; message: string; timestamp: string}>;
  platform_health: string;
}

interface AnalyticsData {
  user_growth: Array<{month: string; users: number}>;
  top_specialties_requested: Array<{specialty: string; count: number}>;
  lab_report_statuses: Record<string, number>;
  avg_time_to_appointment_hours: number;
  patient_nps: number;
}

export default function AdminPortal() {
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'analytics' | 'clinical'>('dashboard');

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard().then(r => setDashboard(r.data)),
      adminApi.getAnalytics().then(r => setAnalytics(r.data)),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'dashboard', label: t('portal.admin.dashboard'), icon: <Activity size={16} /> },
    { key: 'analytics', label: t('nav.analytics'), icon: <BarChart3 size={16} /> },
    { key: 'clinical', label: t('nav.clinicalRules'), icon: <ClipboardList size={16} /> },
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('portal.admin.title')}</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
          <CheckCircle size={14} className="text-green-600" />
          <span className="text-xs font-medium text-green-700">System {dashboard?.platform_health}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
              activeTab === tab.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboard.kpis).map(([key, value]) => (
              <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</div>
                <div className="text-xs text-gray-500 mt-1 capitalize">{key.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              Recent Alerts
            </h3>
            {dashboard.recent_alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                <CheckCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-blue-900">{alert.message}</p>
                  <p className="text-xs text-blue-500 mt-0.5">{alert.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-primary-600">{analytics.patient_nps}</div>
              <div className="text-sm text-gray-600 mt-1">Patient NPS Score</div>
              <div className="text-xs text-green-600 mt-1">Target: &gt;50 ✓</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-secondary-600">{analytics.avg_time_to_appointment_hours}h</div>
              <div className="text-sm text-gray-600 mt-1">Avg. Time to Appointment</div>
              <div className="text-xs text-green-600 mt-1">Target: &lt;24h ✓</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-emerald-600">
                {Object.values(analytics.lab_report_statuses).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Lab Reports</div>
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-600" />
              User Growth
            </h3>
            <div className="flex items-end gap-2 h-32">
              {analytics.user_growth.map((item, i) => {
                const max = Math.max(...analytics.user_growth.map(g => g.users));
                const height = Math.max(20, (item.users / max) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500">{item.users}</span>
                    <div
                      className="w-full bg-primary-500 rounded-t-lg"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-400 truncate w-full text-center">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Specialties */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Top Requested Specialties</h3>
            <div className="space-y-3">
              {analytics.top_specialties_requested.map((item, i) => {
                const max = analytics.top_specialties_requested[0].count;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-40 shrink-0">{item.specialty}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: `${(item.count / max) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-10 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clinical' && (
        <ClinicalRules />
      )}
    </div>
  );
}

function ClinicalRules() {
  const [rules, setRules] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getClinicalRules()
      .then(r => setRules(r.data.rules))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Clinical Pathways & Rules</h3>
        <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">v1.0.0</span>
      </div>
      <div className="divide-y divide-gray-50">
        {rules.map((rule, i) => (
          <div key={i} className="p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-semibold text-gray-900 capitalize">{String(rule.biomarker)}</span>
                <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{String(rule.pathway)}</span>
              </div>
              <span className="text-xs text-gray-500">{String(rule.normal_range)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(rule.specialists_en as string[])?.map((s, j) => (
                <span key={j} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
