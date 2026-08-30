'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AdminSidebar from '@/components/AdminSidebar';
import AdminDashboardContent from '@/app/admin-dashboard/components/AdminDashboardContent';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const supabase = createClient();
        
        // 1. Get current Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();

        // 2. Check both Supabase Session and Local Storage flags
        const adminProfile = typeof window !== 'undefined' ? localStorage.getItem('adminProfile') : null;
        const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;

        if (error || !session || (!session.user && !adminProfile && userRole !== 'admin')) {
          setIsAuthenticated(false);
          router.replace('/sign-up-login-screen');
          return;
        }

        setIsAuthenticated(true);
      } catch (err) {
        console.error('Auth verification error:', err);
        router.replace('/sign-up-login-screen');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAuth();
  }, [router]);

  // Block rendering completely until auth check finishes
  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#1b110e]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70 text-sm font-medium">Verifying admin access...</p>
        </div>
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