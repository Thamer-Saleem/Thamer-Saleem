import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, Plus, X } from 'lucide-react';
import { insuranceApi } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import type { InsurancePolicy } from '../types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Insurance() {
  const { t, language } = useLanguage();
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [form, setForm] = useState({
    insurer_name_en: '',
    policy_number: '',
    member_id: '',
    plan_name: '',
    effective_date: '',
    expiry_date: '',
  });

  useEffect(() => {
    insuranceApi.getPolicies()
      .then(r => setPolicies(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await insuranceApi.addPolicy(form);
      setPolicies(prev => [...prev, res.data]);
      setShowAdd(false);
      setForm({ insurer_name_en: '', policy_number: '', member_id: '', plan_name: '', effective_date: '', expiry_date: '' });
      toast.success('Policy added successfully');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleVerify = async (id: string) => {
    setVerifying(id);
    try {
      await insuranceApi.verify(id);
      const res = await insuranceApi.getPolicies();
      setPolicies(res.data);
      toast.success(t('insurance.verified') + ' ✓');
    } catch {
      toast.error(t('common.error'));
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('insurance.title')}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-all"
        >
          <Plus size={16} /> {t('insurance.addNew')}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      ) : policies.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Shield size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400">No insurance policies added yet</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
          >
            {t('insurance.addPolicy')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map(policy => (
            <div key={policy.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{policy.insurer_name_en}</h3>
                  <p className="text-sm text-gray-500">{policy.plan_name}</p>
                </div>
                {policy.nphies_verified ? (
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-medium border border-green-200">
                    <CheckCircle size={12} /> {t('insurance.nphiesVerified')}
                  </div>
                ) : (
                  <div className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full text-xs font-medium">
                    {t('insurance.notVerified')}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('insurance.policyNumber')}</span>
                  <span className="font-medium text-gray-900">{policy.policy_number}</span>
                </div>
                {policy.member_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('insurance.memberId')}</span>
                    <span className="font-medium text-gray-900">{policy.member_id}</span>
                  </div>
                )}
                {policy.effective_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('insurance.effectiveDate')}</span>
                    <span className="font-medium text-gray-900">{policy.effective_date}</span>
                  </div>
                )}
                {policy.expiry_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('insurance.expiryDate')}</span>
                    <span className="font-medium text-gray-900">{policy.expiry_date}</span>
                  </div>
                )}
              </div>

              {policy.network_providers && policy.network_providers.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">{t('insurance.network')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {policy.network_providers.map((h, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {policy.coverage_details && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                  {(policy.coverage_details as Record<string, unknown>).co_payment_percentage !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('insurance.copayment')}</span>
                      <span className="font-medium">{String((policy.coverage_details as Record<string, unknown>).co_payment_percentage)}%</span>
                    </div>
                  )}
                  {(policy.coverage_details as Record<string, unknown>).pre_auth_required !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('insurance.preAuth')}</span>
                      <span className="font-medium">{(policy.coverage_details as Record<string, unknown>).pre_auth_required ? t('common.yes') : t('common.no')}</span>
                    </div>
                  )}
                </div>
              )}

              {!policy.nphies_verified && (
                <button
                  onClick={() => handleVerify(policy.id)}
                  disabled={verifying === policy.id}
                  className="mt-4 w-full py-2 border border-primary-300 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-50 disabled:opacity-50"
                >
                  {verifying === policy.id ? t('common.loading') : t('insurance.verify')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Policy Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{t('insurance.addPolicy')}</h3>
              <button onClick={() => setShowAdd(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              {[
                { field: 'insurer_name_en', label: t('insurance.insurer'), required: true, type: 'text' },
                { field: 'policy_number', label: t('insurance.policyNumber'), required: true, type: 'text' },
                { field: 'member_id', label: t('insurance.memberId'), required: false, type: 'text' },
                { field: 'plan_name', label: t('insurance.planName'), required: false, type: 'text' },
                { field: 'effective_date', label: t('insurance.effectiveDate'), required: false, type: 'date' },
                { field: 'expiry_date', label: t('insurance.expiryDate'), required: false, type: 'date' },
              ].map(({ field, label, required, type }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    required={required}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700">
                  {t('common.cancel')}
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
