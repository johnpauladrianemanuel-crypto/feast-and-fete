'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminSidebar from '@/components/AdminSidebar';
import AdminDashboardContent from '@/app/admin-dashboard/components/AdminDashboardContent';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function checkAdminAuth() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/sign-up-login-screen');
      } else {
        setLoading(false);
      }
    }

    checkAdminAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: 'var(--admin-bg)' }}>
        <p className="text-white text-sm animate-pulse">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminDashboardContent />
      </main>
    </div>
  );
}