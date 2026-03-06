import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FlaskConical, CheckCircle, AlertTriangle,
  Loader, ChevronRight, Stethoscope, Activity, ArrowLeft, Bot
} from 'lucide-react';
import { labsApi } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import type { LabReport, LabResult } from '../types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STATUS_CONFIG = {
  pending: { color: 'bg-gray-100 text-gray-700', icon: <Loader size={14} className="animate-spin" /> },
  processing: { color: 'bg-blue-100 text-blue-700', icon: <Loader size={14} className="animate-spin" /> },
  analyzed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14} /> },
  action_required: { color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={14} /> },
  error: { color: 'bg-gray-100 text-gray-500', icon: null },
};

const RESULT_CONFIG = {
  normal: { color: 'bg-green-100 text-green-800', dot: 'bg-green-500', label: 'Normal' },
  borderline: { color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500', label: 'Borderline' },
  abnormal: { color: 'bg-red-100 text-red-800', dot: 'bg-red-500', label: 'Abnormal' },
};

const RISK_CONFIG = {
  low: { color: 'text-green-700 bg-green-50 border-green-200', label: '' },
  medium: { color: 'text-yellow-700 bg-yellow-50 border-yellow-200', label: '' },
  high: { color: 'text-red-700 bg-red-50 border-red-200', label: '' },
  critical: { color: 'text-red-900 bg-red-100 border-red-300', label: '' },
};

export default function LabReports() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      const res = await labsApi.getAll();
      setReports(res.data);
      if (id) {
        const report = res.data.find((r: LabReport) => r.id === id);
        if (report) fetchFullReport(report.id);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const fetchFullReport = async (reportId: string) => {
    try {
      const res = await labsApi.getOne(reportId);
      setSelectedReport(res.data);
      // Poll while processing
      if (['pending', 'processing'].includes(res.data.status)) {
        setPolling(true);
        setTimeout(() => fetchFullReport(reportId), 3000);
      } else {
        setPolling(false);
      }
    } catch (err) {
      setPolling(false);
    }
  };

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', files[0]);
      const res = await labsApi.upload(formData);
      toast.success(t('labs.analyzing'));
      setSelectedReport(res.data);
      setReports(prev => [res.data, ...prev]);
      fetchFullReport(res.data.id);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setUploading(false);
    }
  }, [t]);

  const handleDemo = async () => {
    setUploading(true);
    try {
      const res = await labsApi.uploadDemo();
      toast.success(t('labs.analyzing'));
      setSelectedReport(res.data);
      setReports(prev => [res.data, ...prev]);
      fetchFullReport(res.data.id);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': [], 'image/*': [] }, maxFiles: 1
  });

  const getResultLabel = (result: LabResult) => {
    const name = language === 'ar' && result.biomarker_ar ? result.biomarker_ar : result.biomarker_en;
    const interp = language === 'ar' ? result.interpretation_ar : result.interpretation_en;
    return { name, interp };
  };

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
        <h1 className="text-2xl font-bold text-gray-900">{t('labs.title')}</h1>
        {selectedReport && (
          <button
            onClick={() => setSelectedReport(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
          >
            <ArrowLeft size={16} /> {t('common.back')}
          </button>
        )}
      </div>

      {!selectedReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">{t('labs.uploadTitle')}</h2>
              <div
                {...getRootProps()}
                className={clsx(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                  isDragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                )}
              >
                <input {...getInputProps()} />
                <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">{t('labs.dragDrop')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('labs.or')}</p>
                <span className="text-primary-600 text-sm font-medium">{t('labs.browse')}</span>
                <p className="text-xs text-gray-400 mt-2">{t('labs.supportedFormats')}</p>
              </div>

              {uploading && (
                <div className="mt-4 flex items-center gap-3 text-primary-600">
                  <Loader size={18} className="animate-spin" />
                  <span className="text-sm">{t('labs.analyzing')}</span>
                </div>
              )}

              <div className="mt-4 border-t pt-4">
                <button
                  onClick={handleDemo}
                  disabled={uploading}
                  className="w-full py-2.5 border border-dashed border-primary-300 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-50 transition-all flex items-center justify-center gap-2"
                >
                  <Bot size={16} />
                  {t('labs.useDemo')}
                </button>
              </div>
            </div>

            {/* AI Badge */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-4 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={18} className="text-primary-600" />
                <span className="text-sm font-semibold text-primary-800">{t('labs.aiPowered')}</span>
              </div>
              <p className="text-xs text-gray-600">{t('labs.disclaimer')}</p>
            </div>
          </div>

          {/* Reports List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-50">
                <h2 className="font-semibold text-gray-900">{t('labs.title')}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {reports.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FlaskConical size={48} className="mx-auto mb-3 opacity-20" />
                    <p>{t('dashboard.noReports')}</p>
                  </div>
                ) : (
                  reports.map(report => {
                    const statusConf = STATUS_CONFIG[report.status];
                    return (
                      <button
                        key={report.id}
                        onClick={() => fetchFullReport(report.id)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                          <FlaskConical size={22} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{report.file_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {report.lab_name || ''} • {report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}
                          </p>
                          {report.status === 'analyzed' || report.status === 'action_required' ? (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {language === 'ar' ? report.summary_ar : report.summary_en}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={clsx('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', statusConf.color)}>
                            {statusConf.icon}
                            {t(`labs.status.${report.status}`)}
                          </span>
                          <ChevronRight size={16} className="text-gray-300" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Report Detail View */
        <div className="space-y-6">
          {/* Processing State */}
          {['pending', 'processing'].includes(selectedReport.status) && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-center gap-4">
              <Loader size={32} className="animate-spin text-blue-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">{t('labs.analyzing')}</h3>
                <p className="text-blue-700 text-sm mt-0.5">{t('labs.aiPowered')}</p>
              </div>
            </div>
          )}

          {/* Analysis Complete */}
          {['analyzed', 'action_required'].includes(selectedReport.status) && (
            <>
              {/* Summary Card */}
              <div className={clsx(
                'rounded-2xl p-6 border',
                selectedReport.status === 'action_required'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              )}>
                <div className="flex items-start gap-3 mb-3">
                  {selectedReport.status === 'action_required'
                    ? <AlertTriangle size={24} className="text-red-500 shrink-0" />
                    : <CheckCircle size={24} className="text-green-600 shrink-0" />
                  }
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{t('labs.analysisComplete')}</h3>
                    {selectedReport.ai_analysis && (
                      <span className={clsx(
                        'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border mt-1',
                        RISK_CONFIG[selectedReport.ai_analysis.overall_risk]?.color || 'bg-gray-100 text-gray-700'
                      )}>
                        <Activity size={12} />
                        {t(`labs.risk.${selectedReport.ai_analysis.overall_risk}`)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {language === 'ar' ? selectedReport.summary_ar : selectedReport.summary_en}
                </p>
                <p className="text-xs text-gray-400 mt-3 italic">{t('labs.disclaimer')}</p>
              </div>

              {/* Test Results Table */}
              {selectedReport.results && selectedReport.results.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-5 border-b border-gray-50">
                    <h3 className="font-semibold text-gray-900">{t('labs.results')}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('labs.biomarker')}</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('labs.value')}</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('labs.normalRange')}</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('labs.status_label')}</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('labs.interpretation')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedReport.results.map((result, i) => {
                          const { name, interp } = getResultLabel(result);
                          const conf = RESULT_CONFIG[result.status];
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{name}</td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {result.value_text || result.value} {result.unit}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{result.normal_range_text}</td>
                              <td className="px-4 py-3">
                                <span className={clsx('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium w-fit', conf.color)}>
                                  <span className={clsx('w-1.5 h-1.5 rounded-full', conf.dot)}></span>
                                  {t(`labs.result_status.${result.status}`)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">{interp}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Stethoscope size={18} className="text-primary-600" />
                    {t('labs.recommendations')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.recommendations.map((rec, i) => {
                      const urgencyColors = {
                        routine: 'border-gray-200 bg-gray-50',
                        priority: 'border-yellow-200 bg-yellow-50',
                        urgent: 'border-red-200 bg-red-50',
                      };
                      return (
                        <div key={i} className={clsx('rounded-xl p-4 border', urgencyColors[rec.urgency])}>
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {language === 'ar' ? rec.specialty_ar : rec.specialty_en}
                            </h4>
                            <span className={clsx(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              rec.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                              rec.urgency === 'priority' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            )}>
                              {t(`labs.urgency.${rec.urgency}`)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            {language === 'ar' ? rec.reason_ar : rec.reason_en}
                          </p>
                          {rec.suggested_tests_en.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1">{t('labs.tests')}:</p>
                              <div className="flex flex-wrap gap-1">
                                {(language === 'ar' ? rec.suggested_tests_ar : rec.suggested_tests_en)
                                  .map((test, j) => (
                                    <span key={j} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-600">
                                      {test}
                                    </span>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => navigate(`/providers?specialty=${rec.specialty_en}`)}
                            className="mt-3 w-full py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-all flex items-center justify-center gap-1"
                          >
                            {t('labs.bookAppointment')} <ChevronRight size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
