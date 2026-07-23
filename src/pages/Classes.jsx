import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/hooks/useUserRole';
import { Layers, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function Classes() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', year: new Date().getFullYear().toString(), shift: 'morning' });

  const load = async () => {
    if (!user?.school_id) return;
    try {
      const data = await base44.entities.SchoolClass.filter({ school_id: user.school_id });
      setClasses(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.school_id) load(); }, [user?.school_id]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', year: new Date().getFullYear().toString(), shift: 'morning' });
    setDialogOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, year: c.year || '', shift: c.shift || 'morning' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editing) {
        await base44.entities.SchoolClass.update(editing.id, form);
        toast({ title: 'Turma atualizada' });
      } else {
        await base44.entities.SchoolClass.create({ ...form, school_id: user.school_id });
        toast({ title: 'Turma criada' });
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir esta turma?')) return;
    try {
      await base44.entities.SchoolClass.delete(id);
      toast({ title: 'Turma excluída' });
      load();
    } catch (e) { toast({ title: 'Erro ao excluir', variant: 'destructive' }); }
  };

  const shiftLabel = { morning: 'Manhã', afternoon: 'Tarde', evening: 'Noite' };
  const filtered = classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turmas</h1>
          <p className="text-sm text-slate-500 mt-1">{classes.length} turmas</p>
        </div>
        <Button onClick={openCreate} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Nova Turma
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Buscar turma..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-slate-200" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <Layers className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nenhuma turma encontrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{c.name}</p>
                    <p className="text-xs text-slate-400">{shiftLabel[c.shift] || c.shift} • {c.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar Turma' : 'Nova Turma'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Nome *</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: 1º Ano A" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Ano Letivo</label>
                <Input value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">Turno</label>
                <Select value={form.shift} onValueChange={v => setForm({ ...form, shift: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Manhã</SelectItem>
                    <SelectItem value="afternoon">Tarde</SelectItem>
                    <SelectItem value="evening">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl">
              {editing ? 'Salvar' : 'Criar Turma'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}