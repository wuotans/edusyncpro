import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useUserRole } from '@/hooks/useUserRole';
import { Eye, Plus, Edit, Trash2, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const typeLabels = { behavior: 'Comportamento', academic: 'Acadêmico', attendance: 'Frequência', health: 'Saúde', other: 'Outro' };
const typeColors = { behavior: 'bg-amber-50 text-amber-600', academic: 'bg-cyan-50 text-cyan-600', attendance: 'bg-purple-50 text-purple-600', health: 'bg-red-50 text-red-600', other: 'bg-slate-100 text-slate-500' };

export default function Observations() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [observations, setObservations] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ student_id: '', class_id: '', subject_id: '', content: '', type: 'academic', date: '' });

  const load = async () => {
    if (!user?.id) return;
    try {
      const [obs, a, c, s, st] = await Promise.all([
        api.entities.Observation.filter({ teacher_id: user.id }),
        api.entities.TeacherAssignment.filter({ teacher_id: user.id }),
        api.entities.SchoolClass.list(), api.entities.Subject.list(), api.entities.Student.list(),
      ]);
      setObservations(obs); setAssignments(a);
      const classIds = [...new Set(a.map(x => x.class_id))];
      const subjectIds = [...new Set(a.map(x => x.subject_id))];
      setClasses(c.filter(x => classIds.includes(x.id)));
      setSubjects(s.filter(x => subjectIds.includes(x.id)));
      setStudents(st.filter(x => classIds.includes(x.class_id)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);

  const openCreate = () => { setEditing(null); setForm({ student_id: '', class_id: classes[0]?.id || '', subject_id: '', content: '', type: 'academic', date: new Date().toISOString().split('T')[0] }); setDialogOpen(true); };
  const openEdit = (o) => { setEditing(o); setForm({ student_id: o.student_id, class_id: o.class_id || '', subject_id: o.subject_id || '', content: o.content, type: o.type || 'academic', date: o.date || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.content.trim() || !form.student_id) return;
    const schoolId = assignments.find(a => a.class_id === form.class_id)?.school_id;
    try {
      if (editing) { await api.entities.Observation.update(editing.id, form); toast({ title: 'Observação atualizada' }); }
      else { await api.entities.Observation.create({ ...form, teacher_id: user.id, school_id: schoolId }); toast({ title: 'Observação registrada' }); }
      setDialogOpen(false); load();
    } catch { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const handleDelete = async (id) => { if (!confirm('Excluir esta observação?')) return; try { await api.entities.Observation.delete(id); toast({ title: 'Observação excluída' }); load(); } catch { toast({ title: 'Erro', variant: 'destructive' }); } };
  const getStudentName = id => students.find(s => s.id === id)?.name || 'Aluno';
  const getClassName = id => classes.find(c => c.id === id)?.name || '';
  const classStudents = form.class_id ? students.filter(s => s.class_id === form.class_id) : students;
  const filtered = observations.filter(o => { const student=students.find(s=>s.id===o.student_id); return ((student?.name||'').toLowerCase().includes(search.toLowerCase()) || o.content.toLowerCase().includes(search.toLowerCase())) && (filterClass==='all'||o.class_id===filterClass); }).sort((a,b)=>(b.date||b.created_date||'').localeCompare(a.date||a.created_date||''));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Observações</h1><p className="text-sm text-slate-500 mt-1">{observations.length} observações</p></div><Button onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" /> Nova Observação</Button></div>
    <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar por aluno ou conteúdo..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-10 rounded-xl border-slate-200" /></div><Select value={filterClass} onValueChange={setFilterClass}><SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Turma" /></SelectTrigger><SelectContent><SelectItem value="all">Todas</SelectItem>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
    {filtered.length===0?<div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Eye className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Nenhuma observação encontrada</p></div>:<div className="space-y-3">{filtered.map(o=><div key={o.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow"><div className="flex items-start justify-between"><div className="flex-1"><div className="flex items-center gap-2 mb-2 flex-wrap"><span className="text-sm font-semibold text-slate-900">{getStudentName(o.student_id)}</span>{o.class_id&&<span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">{getClassName(o.class_id)}</span>}<span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${typeColors[o.type]||typeColors.other}`}>{typeLabels[o.type]||o.type}</span></div><p className="text-sm text-slate-600 whitespace-pre-wrap">{o.content}</p>{o.date&&<div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400"><Calendar className="w-3.5 h-3.5" />{new Date(o.date+'T00:00:00').toLocaleDateString('pt-BR')}</div>}</div><div className="flex items-center gap-1 ml-3"><button onClick={()=>openEdit(o)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></button><button onClick={()=>handleDelete(o.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div></div></div>)}</div>}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="rounded-2xl max-w-lg"><DialogHeader><DialogTitle>{editing?'Editar Observação':'Nova Observação'}</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Turma</label><Select value={form.class_id} onValueChange={v=>setForm({...form,class_id:v,student_id:''})}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{classes.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Aluno *</label><Select value={form.student_id} onValueChange={v=>setForm({...form,student_id:v})}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{classStudents.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div></div><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Tipo</label><Select value={form.type} onValueChange={v=>setForm({...form,type:v})}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([k,v])=><SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Data</label><Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="rounded-xl" /></div></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Observação *</label><Textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={4} className="rounded-xl resize-none" placeholder="Descreva a observação sobre o aluno..." /></div><Button onClick={handleSave} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl">{editing?'Salvar':'Registrar Observação'}</Button></div></DialogContent></Dialog>
  </div>;
}
