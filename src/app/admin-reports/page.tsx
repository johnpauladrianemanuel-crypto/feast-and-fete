'use client';

import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import ReportsContent from './ReportsContent';
import AdminTopbar from '@/app/admin-dashboard/components/AdminTopbar';

export default function AdminReportsPage() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--admin-bg)' }}>
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <AdminTopbar />
        <ReportsContent />
      </main>
    </div>
  );
}
