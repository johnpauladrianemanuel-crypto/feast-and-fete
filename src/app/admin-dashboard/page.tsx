import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import AdminDashboardContent from '@/app/admin-dashboard/components/AdminDashboardContent';

export default function AdminDashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <AdminDashboardContent />
      </main>
    </div>
  );
}