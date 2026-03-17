'use client';

import AdminLayout from '@/components/layout/AdminLayout';
import SubscriptionGuard from '@/components/guards/SubscriptionGuard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Referral {
  id: string;
  referredEmail: string;
  status: string;
  createdAt: string;
  reward?: string;
}

export default function AdminReferralsPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/superadmin/referrals', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setReferrals(data.referrals ?? []);
        }
      } catch { /* */ } finally { setLoading(false); }
    }
    load();
  }, [user]);

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${user?.uid}` : '';

  return (
    <AdminLayout>
      <SubscriptionGuard feature="reviews">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referencias</h1>
          <p className="mt-1 text-sm text-gray-500">Invitá colegas y obtené recompensas</p>

          <div className="mt-6 rounded-xl bg-gradient-to-r from-[#4dbad9]/5 to-[#e8ad0f]/5 p-6 ring-1 ring-gray-100">
            <h3 className="font-semibold text-gray-900">Tu link de referencia</h3>
            <div className="mt-2 flex items-center gap-2">
              <input readOnly value={referralLink} className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600" />
              <button onClick={() => navigator.clipboard.writeText(referralLink)}
                className="rounded-lg bg-[#4dbad9] px-4 py-2 text-sm font-medium text-white hover:bg-[#3da8c5]">
                Copiar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#4dbad9]" /></div>
          ) : referrals.length === 0 ? (
            <div className="mt-12 text-center text-gray-500">Aún no tenés referencias</div>
          ) : (
            <div className="mt-6 space-y-3">
              {referrals.map((ref) => (
                <div key={ref.id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8ad0f]/10 text-sm font-bold text-[#e8ad0f]">
                    {ref.referredEmail?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{ref.referredEmail}</p>
                    <p className="text-xs text-gray-500">{new Date(ref.createdAt).toLocaleDateString('es-AR')}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${ref.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {ref.status === 'completed' ? 'Completada' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SubscriptionGuard>
    </AdminLayout>
  );
}
