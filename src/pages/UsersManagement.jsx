import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useUserRole } from '@/hooks/useUserRole';
import { Users, Plus, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function UsersManagement() {
  const { toast } = useToast();
  const { user: currentUser, isSuperAdmin } = useUserRole();
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ email: '', role: 'school_admin', school_id: '' });

  const load = async () => {
    try {
      const [u, s] = await Promise.all([
        api.entities.User.list(),
        isSuperAdmin ? api.entities.School.list() : Promise.resolve([]),
      ]);
      setUsers(u); setSchools(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [isSuperAdmin]);

  const openInvite = () => {
    setEditingUser(null);
    setForm({ email: '', role: isSuperAdmin ? 'school_admin' : 'teacher', school_id: currentUser?.school_id || '' });
    setDialogOpen(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ email: u.email, role: u.role, school_id: u.school_id || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        await api.entities.User.update(editingUser.id, { role: form.role, school_id: form.school_id || null });
        toast({ title: 'Usuário atualizado' });
      } else {
        if (!form.email.trim()) return;
        await api.users.inviteUser(form.email, form.role, form.school_id || currentUser?.school_id || null);
        toast({ title: 'Convite enviado para ' + form.email });
      }
      setDialogOpen(false); load();
    } catch (e) { toast({ title: 'Erro: ' + (e.message || 'Tente novamente'), variant: 'destructive' }); }
  };

  const filtered = users.filter(u => {
    const matchSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase());
    if (isSuperAdmin) return matchSearch;
    return matchSearch && u.school_id === currentUser?.school_id;
  });

  const getRoleBadge = (role) => {
    const map = {
      super_admin: { label: 'Super Admin', cls: 'bg-red-50 text-red-600' },
      admin: { label: 'Super Admin', cls: 'bg-red-50 text-red-600' },
      school_admin: { label: 'Admin Escola', cls: 'bg-purple-50 text-purple-600' },
      teacher: { label: 'Professor', cls: 'bg-cyan-50 text-cyan-600' },
    };
    const r = map[role] || { label: role, cls: 'bg-slate-100 text-slate-500' };
    return <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${r.cls}`}>{r.label}</span>;
  };

  const getSchoolName = (id) => schools.find(s => s.id === id)?.name || '';
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Usuários</h1><p className="text-sm text-slate-500 mt-1">{filtered.length} usuários</p></div><Button onClick={openInvite} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" /> Convidar Usuário</Button></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl border-slate-200" /></div>
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">{filtered.length === 0 ? <div className="p-12 text-center"><Users className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Nenhum usuário encontrado</p></div> : <div className="divide-y divide-slate-50">{filtered.map(u => <div key={u.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center text-sm font-bold text-cyan-600 flex-shrink-0">{(u.full_name || u.email || 'U')[0].toUpperCase()}</div><div className="min-w-0"><p className="text-sm font-medium text-slate-700 truncate">{u.full_name || 'Sem nome'}</p><p className="text-xs text-slate-400 truncate">{u.email}</p>{isSuperAdmin && u.school_id && <p className="text-[11px] text-cyan-500 mt-0.5">{getSchoolName(u.school_id)}</p>}</div></div><div className="flex items-center gap-3">{getRoleBadge(u.role)}<button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Edit className="w-4 h-4" /></button></div></div>)}</div>}</div>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="rounded-2xl max-w-md"><DialogHeader><DialogTitle>{editingUser ? 'Editar Usuário' : 'Convidar Usuário'}</DialogTitle></DialogHeader><div className="space-y-4 mt-4">{!editingUser && <div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Email *</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="rounded-xl" /></div>}<div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Papel</label><Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{isSuperAdmin && <SelectItem value="school_admin">Admin Escola</SelectItem>}<SelectItem value="teacher">Professor</SelectItem></SelectContent></Select></div>{isSuperAdmin && <div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Escola</label><Select value={form.school_id} onValueChange={v => setForm({ ...form, school_id: v })}><SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione a escola" /></SelectTrigger><SelectContent>{schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>}<Button onClick={handleSave} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl">{editingUser ? 'Salvar' : 'Enviar Convite'}</Button></div></DialogContent></Dialog>
  </div>;
}
