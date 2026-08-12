import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { School, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

export default function SuperAdminDashboard() {
  const { user } = useUserRole();
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u] = await Promise.all([api.entities.School.list(), api.entities.User.list()]);
        setSchools(s); setUsers(u);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const activeSchools = schools.filter(s => s.status === 'active');
  const adminCount = users.filter(u => u.role === 'school_admin').length;
  const teacherCount = users.filter(u => u.role === 'teacher').length;
  const stats = [
    { label: 'Escolas Ativas', value: activeSchools.length, icon: School, color: 'cyan' },
    { label: 'Admins de Escola', value: adminCount, icon: Users, color: 'purple' },
    { label: 'Professores', value: teacherCount, icon: Users, color: 'amber' },
  ];

  return <div className="space-y-8">
    <div><h1 className="text-2xl font-bold text-slate-900">Bem-vindo, {user?.full_name || 'Admin'}</h1><p className="text-sm text-slate-500 mt-1">Painel geral do sistema</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{stats.map(s => <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"><div className="flex items-center justify-between mb-3"><span className={`p-2.5 rounded-xl ${s.color==='cyan'?'bg-cyan-50 text-cyan-600':s.color==='purple'?'bg-purple-50 text-purple-600':'bg-amber-50 text-amber-600'}`}><s.icon className="w-5 h-5" /></span><TrendingUp className="w-4 h-4 text-emerald-400" /></div><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-xs text-slate-400 mt-1">{s.label}</p></div>)}</div>
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><div className="p-5 border-b border-slate-50 flex items-center justify-between"><h2 className="text-base font-semibold text-slate-900">Escolas Recentes</h2><Link to="/schools" className="text-xs font-medium text-cyan-600 hover:text-cyan-700">Ver todas →</Link></div>{schools.length===0?<div className="p-12 text-center"><School className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Nenhuma escola cadastrada</p><Link to="/schools" className="text-xs text-cyan-600 mt-2 inline-block">Adicionar escola</Link></div>:<div className="divide-y divide-slate-50">{schools.slice(0,5).map(school=><div key={school.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center"><School className="w-4 h-4 text-cyan-600" /></div><div><p className="text-sm font-medium text-slate-700">{school.name}</p><p className="text-xs text-slate-400">{school.email||'Sem email'}</p></div></div><span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${school.status==='active'?'bg-emerald-50 text-emerald-600':'bg-slate-100 text-slate-400'}`}>{school.status==='active'?'Ativa':'Inativa'}</span></div>)}</div>}</div>
  </div>;
}

function DashboardSkeleton() {
  return <div className="space-y-8 animate-pulse"><div><div className="h-7 bg-slate-100 rounded-lg w-48" /><div className="h-4 bg-slate-100 rounded w-32 mt-2" /></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="bg-white rounded-2xl p-5 h-28 border border-slate-100" />)}</div><div className="bg-white rounded-2xl h-64 border border-slate-100" /></div>;
}
