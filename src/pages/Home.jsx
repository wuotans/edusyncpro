import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import SuperAdminDashboard from './SuperAdminDashboard';
import SchoolAdminDashboard from './SchoolAdminDashboard';
import TeacherDashboard from './TeacherDashboard';

export default function Home() {
  const { user, loading, isSuperAdmin, isSchoolAdmin } = useUserRole();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  if (isSuperAdmin) return <SuperAdminDashboard />;
  if (isSchoolAdmin) return <SchoolAdminDashboard />;
  return <TeacherDashboard />;
}