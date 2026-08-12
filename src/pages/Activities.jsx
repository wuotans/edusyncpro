import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useUserRole } from '@/hooks/useUserRole';
import { ClipboardList, Plus, Edit, Trash2, Search, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const typeLabels = { homework: 'Tarefa', classwork: 'Trabalho em Sala', project: 'Projeto', presentation: 'Apresentação', other: 'Outro' };
const statusConfig = {
  pending: { label: 'Pendente', cls: 'bg-amber-50 text-amber-600', icon: Clock },
  in_progress: { label: 'Em Andamento', cls: 'bg-cyan-50 text-cyan-600', icon: AlertCircle },
  completed: { label: 'Concluída', cls: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
};

export default function Activities() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [activities, setActivities] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'classwork', class_id: '', subject_id: '', due_date: '', max_score: '', status: 'pending' });

  const load = async () => {
    if (!user?.id) return;
    try {
      const [acts, a, c, s] = await Promise.all([
        api.entities.Activity.filter({ teacher_id: user.id }),
        api.entities.TeacherAssignment.filter({ teacher_id: user.id }),
        api.entities.SchoolClass.list(),
        api.entities.Subject.list(),
      ]);
      setActivities(acts);
      setAssignments(a);
      const classIds = [...new Set(a.map(x => x.class_id))];
      const subjectIds = [...new Set(a.map(x => x.subject_id))];
      setClasses(c.filter(x => classIds.includes(x.id)));
      setSubjects(s.filter(x => subjectIds.includes(x.id)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  const getSubjectsForClass = (classId) => {
    const sIds = assignments.filter(a => a.class_id === classId).map(a => a.subject_id);
    return subjects.filter(s => sIds.includes(s.id));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', type: 'classwork', class_id: classes[0]?.id || '', subject_id: '', due_date: '', max_score: '', status: 'pending' });
    setDialogOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ title: a.title, description: a.description || '', type: a.type || 'classwork', class_id: a.class_id, subject_id: a.subject_id, due_date: a.due_date || '', max_score: a.max_score?.toString() || '', status: a.status || 'pending' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.class_id || !form.subject_id) return;
    const schoolId = assignments.find(a => a.class_id === form.class_id)?.school_id;
    const data = { ...form, max_score: form.max_score ? parseFloat(form.max_score) : null };
    try {
      if (editing) {
        await api.entities.Activity.update(editing.id, data);
        toast({ title: 'Atividade atualizada' });
      } else {
        await api.entities.Activity.create({ ...data, teacher_id: user.id, school_id: schoolId });
        toast({ title: 'Atividade criada' });
      }
      setDialogOpen(false);
      load();
    } catch (e) { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta atividade?')) return;
    try {
      await api.entities.Activity.delete(id);
      toast({ title: 'Atividade excluída' });
      load();
    } catch (e) { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const getClassName = (id) => classes.find(c => c.id === id)?.name || '';
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || '';

  const filtered = activities.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || a.class_id === filterClass;
    return matchSearch && matchClass;
  }).sort((a, b) => (b.due_date || '').localeCompare(a.due_date || ''));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-900">Atividades</h1><p className="text-sm text-slate-500 mt-1">{activities.length} atividades</p></div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" /> Nova Atividade</Button>
      </div>
      <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar atividade..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-slate-200" /></div><Select value={filterClass} onValueChange={setFilterClass}><SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Turma" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
      {filtered.length === 0 ? <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Nenhuma atividade encontrada</p></div> : <div className="space-y-3">{filtered.map(a => { const sc = statusConfig[a.status] || statusConfig.pending; const StatusIcon = sc.icon; return <div key={a.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center gap-2 mb-1.5 flex-wrap"><span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{getClassName(a.class_id)}</span><span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">{getSubjectName(a.subject_id)}</span><span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{typeLabels[a.type] || a.type}</span></div><h3 className="text-sm font-semibold text-slate-900">{a.title}</h3>{a.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.description}</p>}<div className="flex items-center gap-4 mt-3"><span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${sc.cls}`}><StatusIcon className="w-3 h-3" /> {sc.label}</span>{a.due_date && <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(a.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>}{a.max_score && <span className="text-xs text-slate-400">Nota máx: {a.max_score}</span>}</div></div><div className="flex items-center gap-1 ml-3"><button onClick={() => openEdit(a)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div></div></div>; })}</div>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Turma *</label><Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v, subject_id: '' })}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Matéria *</label><Select value={form.subject_id} onValueChange={v => setForm({ ...form, subject_id: v })}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{(form.class_id ? getSubjectsForClass(form.class_id) : subjects).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Título *</label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Descrição</label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="rounded-xl resize-none" /></div><div className="grid grid-cols-3 gap-3"><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Tipo</label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Entrega</label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="rounded-xl" /></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Nota Máx</label><Input type="number" value={form.max_score} onChange={e => setForm({ ...form, max_score: e.target.value })} className="rounded-xl" /></div></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Status</label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div><Button onClick={handleSave} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl">{editing ? 'Salvar' : 'Criar Atividade'}</Button></div></DialogContent></Dialog>
    </div>
  );
}
