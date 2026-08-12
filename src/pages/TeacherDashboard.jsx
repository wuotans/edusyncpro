import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useUserRole } from '@/hooks/useUserRole';
import { BookOpen, ClipboardList, FileText, GraduationCap, ChevronRight, Calendar, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const TABS = [
  { key: 'plans', label: 'Planos de Aula', icon: FileText },
  { key: 'activities', label: 'Atividades', icon: ClipboardList },
  { key: 'grades', label: 'Notas', icon: GraduationCap },
];
const statusLabels = { pending: 'Pendente', in_progress: 'Em andamento', completed: 'Concluída' };
const statusColors = { pending: 'bg-amber-100 text-amber-700', in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700' };
const periodLabels = { '1_bimestre': '1º Bimestre', '2_bimestre': '2º Bimestre', '3_bimestre': '3º Bimestre', '4_bimestre': '4º Bimestre' };

export default function TeacherDashboard() {
  const { user } = useUserRole();
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [activities, setActivities] = useState([]);
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const a = await api.entities.TeacherAssignment.filter({ teacher_id: user.id });
        setAssignments(a);
        if (a.length > 0) {
          const classIds = [...new Set(a.map(x => x.class_id))];
          const subjectIds = [...new Set(a.map(x => x.subject_id))];
          const [cls, subs, lp, acts, grds, studs] = await Promise.all([
            api.entities.SchoolClass.list(), api.entities.Subject.list(),
            api.entities.LessonPlan.filter({ teacher_id: user.id }), api.entities.Activity.filter({ teacher_id: user.id }),
            api.entities.Grade.filter({ teacher_id: user.id }), api.entities.Student.list(),
          ]);
          setClasses(cls.filter(c => classIds.includes(c.id)));
          setSubjects(subs.filter(s => subjectIds.includes(s.id)));
          setLessonPlans(lp); setActivities(acts); setGrades(grds); setStudents(studs);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  const classMap = {};
  assignments.forEach(a => { if (!classMap[a.class_id]) classMap[a.class_id] = []; classMap[a.class_id].push(a.subject_id); });
  const getClassName = id => classes.find(c => c.id === id)?.name || 'Turma';
  const getSubjectName = id => subjects.find(s => s.id === id)?.name || 'Matéria';
  const getStudentName = id => students.find(s => s.id === id)?.name || 'Aluno';
  const quickStats = [
    { label: 'Turmas', value: Object.keys(classMap).length, icon: BookOpen, color: 'cyan' },
    { label: 'Planos de Aula', value: lessonPlans.length, icon: FileText, color: 'purple' },
    { label: 'Atividades', value: activities.length, icon: ClipboardList, color: 'amber' },
  ];

  return <div className="space-y-8">
    <div><h1 className="text-2xl font-bold text-slate-900">Bom dia, {user?.full_name || 'Professor(a)'}</h1><p className="text-sm text-slate-500 mt-1">Você tem {lessonPlans.length} planos de aula e {activities.filter(a => a.status === 'pending').length} atividades pendentes.</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{quickStats.map(s => <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"><span className={`inline-flex p-2.5 rounded-xl mb-3 ${s.color==='cyan'?'bg-cyan-50 text-cyan-600':s.color==='purple'?'bg-purple-50 text-purple-600':'bg-amber-50 text-amber-600'}`}><s.icon className="w-5 h-5" /></span><p className="text-2xl font-bold text-slate-900">{s.value}</p><p className="text-xs text-slate-400 mt-1">{s.label}</p></div>)}</div>
    <div><div className="flex border-b border-slate-200 gap-0 mb-6">{TABS.map(tab => <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab===tab.key?'border-cyan-500 text-cyan-600':'border-transparent text-slate-500 hover:text-slate-700'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>)}</div>
      {activeTab==='plans' && <div className="space-y-3">{lessonPlans.length===0?<Empty icon={FileText} text="Nenhum plano de aula criado ainda." />:lessonPlans.map(plan=><div key={plan.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"><div className="flex items-start justify-between"><div className="flex-1"><h3 className="text-base font-semibold text-slate-900">{plan.title}</h3><div className="flex items-center gap-3 mt-2 text-xs text-slate-500"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{plan.date}</span><span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600">{getClassName(plan.class_id)}</span><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{getSubjectName(plan.subject_id)}</span></div>{plan.objectives&&<p className="text-sm text-slate-600 mt-3 line-clamp-2">{plan.objectives}</p>}</div><Link to={`/lesson-plans?class_id=${plan.class_id}`} className="text-xs text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1 shrink-0">Ver <ChevronRight className="w-3 h-3" /></Link></div></div>)}</div>}
      {activeTab==='activities' && <div className="space-y-3">{activities.length===0?<Empty icon={ClipboardList} text="Nenhuma atividade criada ainda." />:activities.map(act=><div key={act.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"><div className="flex items-start justify-between"><div className="flex-1"><h3 className="text-base font-semibold text-slate-900">{act.title}</h3><div className="flex flex-wrap items-center gap-2 mt-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[act.status]||'bg-slate-100 text-slate-600'}`}>{statusLabels[act.status]||act.status}</span><span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 text-xs">{getClassName(act.class_id)}</span><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{getSubjectName(act.subject_id)}</span>{act.due_date&&<span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" />{act.due_date}</span>}</div>{act.description&&<p className="text-sm text-slate-600 mt-3 line-clamp-2">{act.description}</p>}</div><div className="text-right shrink-0"><p className="text-lg font-bold text-slate-900">{act.max_score}</p><p className="text-xs text-slate-400">pontos</p></div></div></div>)}</div>}
      {activeTab==='grades' && <div className="space-y-3">{grades.length===0?<Empty icon={GraduationCap} text="Nenhuma nota registrada ainda." />:grades.map(grade=><div key={grade.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"><div className="flex items-start justify-between"><div className="flex-1"><h3 className="text-base font-semibold text-slate-900">{getStudentName(grade.student_id)}</h3><p className="text-sm text-slate-500">{grade.label}</p><div className="flex flex-wrap items-center gap-2 mt-2"><span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600 text-xs">{getClassName(grade.class_id)}</span><span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{getSubjectName(grade.subject_id)}</span><span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-xs">{periodLabels[grade.period]||grade.period}</span>{grade.date&&<span className="text-xs text-slate-400">{grade.date}</span>}</div></div><div className="text-right shrink-0 flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /><span className="text-lg font-bold text-slate-900">{grade.score}</span><span className="text-sm text-slate-400">/{grade.max_score}</span></div></div></div>)}</div>}
    </div>
  </div>;
}

function Empty({ icon: Icon, text }) {
  return <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Icon className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">{text}</p></div>;
}
