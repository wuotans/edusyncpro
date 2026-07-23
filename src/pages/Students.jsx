import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/hooks/useUserRole';
import { GraduationCap, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function Students() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', registration_number: '', class_id: '', status: 'active' });

  const load = async () => {
    if (!user?.school_id) return;
    try {
      const [s, c] = await Promise.all([
        base44.entities.Student.filter({ school_id: user.school_id }),
        base44.entities.SchoolClass.filter({ school_id: user.school_id }),
      ]);
      setStudents(s);
      setClasses(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.school_id) load(); }, [user?.school_id]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', registration_number: '', class_id: classes[0]?.id || '', status: 'active' });
    setDialogOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, registration_number: s.registration_number || '', class_id: s.class_id, status: s.status || 'active' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.class_id) return;
    try {
      if (editing) {
        await base44.entities.Student.update(editing.id, form);
        toast({ title: 'Aluno atualizado' });
      } else {
        await base44.entities.Student.create({ ...form, school_id: user.school_id });
        toast({ title: 'Aluno cadastrado' });
      }
      setDialogOpen(false);
      load();
    } catch (e) { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este aluno?')) return;
    try {
      await base44.entities.Student.delete(id);
      toast({ title: 'Aluno excluído' });
      load();
    } catch (e) { toast({ title: 'Erro', variant: 'destructive' }); }
  };

  const getClassName = (id) => classes.find(c => c.id === id)?.name || '';

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || s.class_id === filterClass;
    return matchSearch && matchClass;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alunos</h1>
          <p className="text-sm text-slate-500 mt-1">{students.length} alunos</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Novo Aluno
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-slate-200" />
        </div>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Turma" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <GraduationCap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nenhum aluno encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          {filtered.map(s => (
            <div key={s.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-sm font-bold text-emerald-600">
                  {s.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{s.name}</p>
                  <p className="text-xs text-slate-400">{getClassName(s.class_id)} {s.registration_number ? `• Matrícula: ${s.registration_number}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                  s.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                  s.status === 'transferred' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {s.status === 'active' ? 'Ativo' : s.status === 'transferred' ? 'Transferido' : 'Inativo'}
                </span>
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Nome *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Matrícula</label>
                <Input value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Turma *</label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Status</label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="transferred">Transferido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl">
              {editing ? 'Salvar' : 'Cadastrar Aluno'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}