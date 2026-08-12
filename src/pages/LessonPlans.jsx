import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useUserRole } from '@/hooks/useUserRole';
import { BookOpen, Plus, Edit, Trash2, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function LessonPlans() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [plans, setPlans] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', class_id: '', subject_id: '', objectives: '', content: '', methodology: '', resources: '', evaluation: '', notes: '' });

  const load = async () => {
    if (!user?.id) return;
    try {
      const [p, a, c, s] = await Promise.all([
        api.entities.LessonPlan.filter({ teacher_id: user.id }),
        api.entities.TeacherAssignment.filter({ teacher_id: user.id }),
        api.entities.SchoolClass.list(),
        api.entities.Subject.list(),
      ]);
      setPlans(p); setAssignments(a);
      const classIds = [...new Set(a.map(x => x.class_id))];
      const subjectIds = [...new Set(a.map(x => x.subject_id))];
      setClasses(c.filter(x => classIds.includes(x.id)));
      setSubjects(s.filter(x => subjectIds.includes(x.id)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get('class_id')) setFilterClass(params.get('class_id')); }, []);

  const getSubjectsForClass = (classId) => {
    const sIds = assignments.filter(a => a.class_id === classId).map(a => a.subject_id);
    return subjects.filter(s => sIds.includes(s.id));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', date: new Date().toISOString().split('T')[0], class_id: classes[0]?.id || '', subject_id: '', objectives: '', content: '', methodology: '', resources: '', evaluation: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ title: p.title, date: p.date || '', class_id: p.class_id, subject_id: p.subject_id, objectives: p.objectives || '', content: p.content || '', methodology: p.methodology || '', resources: p.resources || '', evaluation: p.evaluation || '', notes: p.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.class_id || !form.subject_id) return;
    const schoolId = assignments.find(a => a.class_id === form.class_id)?.school_id;
    try {
      if (editing) { await api.entities.LessonPlan.update(editing.id, form); toast({ title: 'Plano atualizado' }); }
      else { await api.entities.LessonPlan.create({ ...form, teacher_id: user.id, school_id: schoolId }); toast({ title: 'Plano criado' }); }
      setDialogOpen(false); load();
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este plano?')) return;
    try { await api.entities.LessonPlan.delete(id); toast({ title: 'Plano excluído' }); load(); }
    catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const getClassName = id => classes.find(c => c.id === id)?.name || '';
  const getSubjectName = id => subjects.find(s => s.id === id)?.name || '';
  const filtered = plans.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) && (filterClass === 'all' || p.class_id === filterClass)).sort((a,b)=>(b.date||'').localeCompare(a.date||''));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Planos de Aula</h1><p className="text-sm text-slate-500 mt-1">{plans.length} planos</p></div><Button onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" /> Novo Plano</Button></div>
    <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar plano..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-10 rounded-xl border-slate-200" /></div><Select value={filterClass} onValueChange={setFilterClass}><SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Turma" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as turmas</SelectItem>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
    {filtered.length === 0 ? <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Nenhum plano de aula encontrado</p></div> : <div className="space-y-3">{filtered.map(p=><div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={()=>{setDetailPlan(p);setDetailOpen(true)}}><div className="p-5"><div className="flex items-start justify-between"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{getClassName(p.class_id)}</span><span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">{getSubjectName(p.subject_id)}</span></div><h3 className="text-sm font-semibold text-slate-900 mt-2">{p.title}</h3>{p.objectives&&<p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.objectives}</p>}</div><div className="flex items-center gap-1 ml-4" onClick={e=>e.stopPropagation()}><button onClick={()=>openEdit(p)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></button><button onClick={()=>handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div></div>{p.date&&<div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400"><Calendar className="w-3.5 h-3.5" />{new Date(p.date+'T00:00:00').toLocaleDateString('pt-BR')}</div>}</div></div>)}</div>}
    <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto">{detailPlan&&<><DialogHeader><div className="flex items-center gap-2 mb-2"><span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{getClassName(detailPlan.class_id)}</span><span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">{getSubjectName(detailPlan.subject_id)}</span></div><DialogTitle className="text-lg">{detailPlan.title}</DialogTitle>{detailPlan.date&&<p className="text-xs text-slate-400">{new Date(detailPlan.date+'T00:00:00').toLocaleDateString('pt-BR')}</p>}</DialogHeader><div className="space-y-4 mt-4">{[{label:'Objetivos',value:detailPlan.objectives},{label:'Conteúdo',value:detailPlan.content},{label:'Metodologia',value:detailPlan.methodology},{label:'Recursos',value:detailPlan.resources},{label:'Avaliação',value:detailPlan.evaluation},{label:'Observações',value:detailPlan.notes}].filter(x=>x.value).map(x=><div key={x.label}><h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{x.label}</h4><p className="text-sm text-slate-700 whitespace-pre-wrap">{x.value}</p></div>)}</div></>}</DialogContent></Dialog>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing?'Editar Plano':'Novo Plano de Aula'}</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Turma *</label><Select value={form.class_id} onValueChange={v=>setForm({...form,class_id:v,subject_id:''})}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Matéria *</label><Select value={form.subject_id} onValueChange={v=>setForm({...form,subject_id:v})}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{(form.class_id?getSubjectsForClass(form.class_id):subjects).map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Título *</label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="rounded-xl" /></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Data</label><Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="rounded-xl" /></div></div>{['objectives','content','methodology','resources','evaluation','notes'].map(field=><div key={field}><label className="text-xs font-medium text-slate-600 mb-1.5 block">{{objectives:'Objetivos',content:'Conteúdo',methodology:'Metodologia',resources:'Recursos',evaluation:'Avaliação',notes:'Observações'}[field]}</label><Textarea value={form[field]} onChange={e=>setForm({...form,[field]:e.target.value})} rows={3} className="rounded-xl resize-none" /></div>)}<Button onClick={handleSave} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl">{editing?'Salvar':'Criar Plano'}</Button></div></DialogContent></Dialog>
  </div>;
}
