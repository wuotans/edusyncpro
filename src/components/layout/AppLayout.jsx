import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUserRole } from '@/hooks/useUserRole';

export default function AppLayout() {
  const { user, loading } = useUserRole();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const role = user?.role || 'teacher';

  return (
    <div className="flex min-h-screen bg-slate-50/70">
      <Sidebar role={role} user={user} />
      <main className="flex-1 min-w-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}