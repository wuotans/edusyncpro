import { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';

export function useUserRole() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.auth.me();
        setUser(me);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const isSchoolAdmin = user?.role === 'school_admin';
  const isTeacher = user?.role === 'teacher';

  return { user, loading, isSuperAdmin, isSchoolAdmin, isTeacher };
}