import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useUserRole } from '@/hooks/useUserRole';
import { Users, Plus, Settings, Search, Layers, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';

export default function Teachers() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedAssignments, setSelectedAssignments] = useState([]);

  const load = async () => {
    if (!user?.school_id) return;
    try {
      const [t, c, s, a] = await Promise.all([
        api.entities.User.filter({ role: 'teacher', school_id: user.school_id }),
        api.entities.SchoolClass.filter({ school_id: user.school_id }),
        api.entities.Subject.filter({ school_id: user.school_id }),
        api.entities.TeacherAssignment.filter({ school_id: user.school_id }),
      ]);
      setTeachers(t); setClasses(c); setSubjects(s); setAssignments(a);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.school_id) load(); }, [user?.school_id]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await api.users.inviteUser(inviteEmail, 'teacher', user.school_id);
      toast({ title: 'Convite enviado para ' + inviteEmail });
      setInviteOpen(false); setInviteEmail(''); setTimeout(load, 2000);
    } catch (e) { toast({ title: 'Erro: ' + (e.message || 'Tente novamente'), variant: 'destructive' }); }
  };

  const openAssign = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedAssignments(assignments.filter(a => a.teacher_id === teacher.id).map(a => `${a.class_id}__${a.subject_id}`));
    setAssignOpen(true);
  };

  const toggleAssignment = (key) => setSelectedAssignments(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const handleSaveAssignments = async () => {
    if (!selectedTeacher) return;
    try {
      const currentAssigns = assignments.filter(a => a.teacher_id === selectedTeacher.id);
      for (const a of currentAssigns) await api.entities.TeacherAssignment.delete(a.id);
      for (const key of selectedAssignments) {
        const [class_id, subject_id] = key.split('__');
        await api.entities.TeacherAssignment.create({ school_id: user.school_id, teacher_id: selectedTeacher.id, class_id, subject_id });
      }
      toast({ title: 'Atribuições salvas' }); setAssignOpen(false); load();
    } catch { toast({ title: 'Erro ao salvar', variant: 'destructive' }); }
  };

  const filtered = teachers.filter(t => (t.full_name || t.email || '').toLowerCase().includes(search.toLowerCase()));
  const getTeacherAssignments = (teacherId) => assignments.filter(a => a.teacher_id === teacherId);
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Professores</h1><p className="text-sm text-slate-500 mt-1">{teachers.length} professores</p></div><Button onClick={() => setInviteOpen(true)} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" /> Convidar Professor</Button></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar professor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-slate-200" /></div>
    {filtered.length === 0 ? <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><Users className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Nenhum professor encontrado</p></div> : <div className="space-y-3">{filtered.map(t => { const tAssigns = getTeacherAssignments(t.id); return <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"><div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center text-sm font-bold text-cyan-600">{(t.full_name || t.email || 'P')[0].toUpperCase()}</div><div><p className="text-sm font-medium text-slate-700">{t.full_name || 'Sem nome'}</p><p className="text-xs text-slate-400">{t.email}</p></div></div><Button variant="outline" size="sm" onClick={() => openAssign(t)} className="rounded-xl text-xs"><Settings className="w-3.5 h-3.5 mr-1.5" /> Atribuir Turmas</Button></div>{tAssigns.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{tAssigns.map(a => { const cls=classes.find(c=>c.id===a.class_id); const sub=subjects.find(s=>s.id===a.subject_id); return <span key={a.id} className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-700"><Layers className="w-3 h-3" /> {cls?.name || '?'} — {sub?.name || '?'}</span>; })}</div>}</div>; })}</div>}
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}><DialogContent className="rounded-2xl max-w-sm"><DialogHeader><DialogTitle>Convidar Professor</DialogTitle></DialogHeader><div className="space-y-4 mt-4"><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Email *</label><Input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="email@exemplo.com" className="rounded-xl" /></div><Button onClick={handleInvite} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl"><Mail className="w-4 h-4 mr-2" /> Enviar Convite</Button></div></DialogContent></Dialog>
    <Dialog open={assignOpen} onOpenChange={setAssignOpen}><DialogContent className="rounded-2xl max-w-lg max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>Atribuir Turmas e Matérias</DialogTitle><p className="text-sm text-slate-500">{selectedTeacher?.full_name || selectedTeacher?.email}</p></DialogHeader><div className="space-y-4 mt-4">{classes.length === 0 || subjects.length === 0 ? <p className="text-sm text-slate-400 text-center py-4">Cadastre turmas e matérias primeiro.</p> : <div className="space-y-4">{classes.map(cls => <div key={cls.id} className="border border-slate-100 rounded-xl p-4"><p className="text-sm font-semibold text-slate-700 mb-3">{cls.name}</p><div className="space-y-2">{subjects.map(sub => { const key=`${cls.id}__${sub.id}`; return <label key={key} className="flex items-center gap-3 cursor-pointer group"><Checkbox checked={selectedAssignments.includes(key)} onCheckedChange={() => toggleAssignment(key)} /><span className="text-sm text-slate-600 group-hover:text-slate-800">{sub.name}</span></label>; })}</div></div>)}</div>}<Button onClick={handleSaveAssignments} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl">Salvar Atribuições</Button></div></DialogContent></Dialog>
  </div>;
}
