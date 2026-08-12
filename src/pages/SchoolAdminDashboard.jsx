import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useUserRole } from '@/hooks/useUserRole';
import { Layers, BookOpen, Users, GraduationCap, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SchoolAdminDashboard() {
  const { user } = useUserRole();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.school_id) return;
    const load = async () => {
      try {
        const [c, s, st, t] = await Promise.all([
          api.entities.SchoolClass.filter({ school_id: user.school_id }),
          api.entities.Subject.filter({ school_id: user.school_id }),
          api.entities.Student.filter({ school_id: user.school_id }),
          api.entities.User.filter({ role: 'teacher', school_id: user.school_id }),
        ]);
        setClasses(c); setSubjects(s); setStudents(st); setTeachers(t);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user?.school_id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  const stats = [
    { label: 'Turmas', value: classes.length, icon: Layers, color: 'cyan', link: '/classes' },
    { label: 'Matérias', value: subjects.length, icon: BookOpen, color: 'purple', link: '/subjects' },
    { label: 'Professores', value: teachers.length, icon: Users, color: 'amber', link: '/teachers' },
    { label: 'Alunos', value: students.length, icon: GraduationCap, color: 'emerald', link: '/students' },
  ];

  return <div className="space-y-8">
    <div><h1 className="text-2xl font-bold text-slate-900">Olá, {user?.full_name || 'Admin'}</h1><p className="text-sm text-slate-500 mt-1">Painel da escola</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map(s => <Link to={s.link} key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"><div className="flex items-center justify-between mb-3"><span className={`p-2.5 rounded-xl ${s.color==='cyan'?'bg-cyan-50 text-cyan-600':s.color==='purple'?'bg-purple-50 text-purple-600':s.color==='amber'?'bg-amber-50 text-amber-600':'bg-emerald-50 text-emerald-600'}`}><s.icon className="w-5 h-5" /></span><TrendingUp className="w-4 h-4 text-slate-200 group-hover:text-emerald-400 transition-colors" /></div><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-xs text-slate-400 mt-1">{s.label}</p></Link>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><div className="p-5 border-b border-slate-50"><h2 className="text-base font-semibold text-slate-900">Turmas</h2></div>{classes.length===0?<div className="p-8 text-center"><p className="text-sm text-slate-400">Nenhuma turma cadastrada</p></div>:<div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">{classes.map(c=><div key={c.id} className="px-5 py-3 flex items-center justify-between"><p className="text-sm font-medium text-slate-700">{c.name}</p><span className="text-[11px] text-slate-400">{c.shift==='morning'?'Manhã':c.shift==='afternoon'?'Tarde':'Noite'}</span></div>)}</div>}</div><div className="bg-white rounded-2xl border border-slate-100 shadow-sm"><div className="p-5 border-b border-slate-50"><h2 className="text-base font-semibold text-slate-900">Professores</h2></div>{teachers.length===0?<div className="p-8 text-center"><p className="text-sm text-slate-400">Nenhum professor cadastrado</p></div>:<div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">{teachers.map(t=><div key={t.id} className="px-5 py-3 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-xs font-bold text-cyan-600">{(t.full_name||'P')[0]}</div><div><p className="text-sm font-medium text-slate-700">{t.full_name||t.email}</p><p className="text-xs text-slate-400">{t.email}</p></div></div>)}</div>}</div></div>
  </div>;
}
