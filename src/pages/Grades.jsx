import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useUserRole } from '@/hooks/useUserRole';
import { FileText, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const periodLabels = { '1_bimestre': '1º Bimestre', '2_bimestre': '2º Bimestre', '3_bimestre': '3º Bimestre', '4_bimestre': '4º Bimestre' };

export default function Grades() {
  const { toast } = useToast();
  const { user } = useUserRole();
  const [grades, setGrades] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('1_bimestre');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkGrades, setBulkGrades] = useState({});
  const [gradeLabel, setGradeLabel] = useState('Prova 1');
  const [maxScore, setMaxScore] = useState('10');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    try {
      const [g, a, c, s, st] = await Promise.all([
        api.entities.Grade.filter({ teacher_id: user.id }),
        api.entities.TeacherAssignment.filter({ teacher_id: user.id }),
        api.entities.SchoolClass.list(),
        api.entities.Subject.list(),
        api.entities.Student.list(),
      ]);
      setGrades(g);
      setAssignments(a);
      const classIds = [...new Set(a.map(x => x.class_id))];
      const subjectIds = [...new Set(a.map(x => x.subject_id))];
      setClasses(c.filter(x => classIds.includes(x.id)));
      setSubjects(s.filter(x => subjectIds.includes(x.id)));
      setStudents(st);
      if (!selectedClass && classIds.length > 0) setSelectedClass(classIds[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.id) load(); }, [user?.id]);
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get('class_id')) setSelectedClass(params.get('class_id')); }, []);

  const getSubjectsForClass = (classId) => {
    const sIds = assignments.filter(a => a.class_id === classId).map(a => a.subject_id);
    return subjects.filter(s => sIds.includes(s.id));
  };

  useEffect(() => {
    if (selectedClass) {
      const avail = getSubjectsForClass(selectedClass);
      if (avail.length > 0 && !avail.find(s => s.id === selectedSubject)) setSelectedSubject(avail[0].id);
    }
  }, [selectedClass]);

  const classStudents = students.filter(s => s.class_id === selectedClass && s.status === 'active');
  const filteredGrades = grades.filter(g => g.class_id === selectedClass && g.subject_id === selectedSubject && g.period === selectedPeriod);
  const gradeLabels = [...new Set(filteredGrades.map(g => g.label))];
  const getGrade = (studentId, label) => filteredGrades.find(g => g.student_id === studentId && g.label === label);
  const getAverage = (studentId) => {
    const sg = filteredGrades.filter(g => g.student_id === studentId);
    if (sg.length === 0) return '-';
    return (sg.reduce((sum, g) => sum + (g.score / (g.max_score || 10)) * 10, 0) / sg.length).toFixed(1);
  };

  const openBulkGrade = () => {
    const init = {}; classStudents.forEach(s => { init[s.id] = ''; }); setBulkGrades(init); setGradeLabel('Prova 1'); setMaxScore('10'); setDialogOpen(true);
  };

  const handleBulkSave = async () => {
    if (!selectedClass || !selectedSubject || !gradeLabel.trim()) return;
    setSaving(true);
    const schoolId = assignments.find(a => a.class_id === selectedClass)?.school_id;
    try {
      const toCreate = [];
      for (const [studentId, score] of Object.entries(bulkGrades)) {
        if (score === '' || score === null || score === undefined) continue;
        const existing = filteredGrades.find(g => g.student_id === studentId && g.label === gradeLabel);
        if (existing) await api.entities.Grade.update(existing.id, { score: parseFloat(score), max_score: parseFloat(maxScore) });
        else toCreate.push({ school_id: schoolId, teacher_id: user.id, class_id: selectedClass, subject_id: selectedSubject, student_id: studentId, label: gradeLabel, score: parseFloat(score), max_score: parseFloat(maxScore), period: selectedPeriod, date: new Date().toISOString().split('T')[0] });
      }
      if (toCreate.length > 0) await api.entities.Grade.bulkCreate(toCreate);
      toast({ title: 'Notas salvas' }); setDialogOpen(false); load();
    } catch (e) { toast({ title: 'Erro ao salvar', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const getClassName = (id) => classes.find(c => c.id === id)?.name || '';
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || '';
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin" /></div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Notas</h1><p className="text-sm text-slate-500 mt-1">Lançamento de notas por turma e matéria</p></div>{selectedClass && selectedSubject && <Button onClick={openBulkGrade} className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-sm"><Plus className="w-4 h-4 mr-2" /> Lançar Notas</Button>}</div>
    <div className="flex flex-wrap gap-3"><Select value={selectedClass} onValueChange={setSelectedClass}><SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Turma" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>{selectedClass && <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Matéria" /></SelectTrigger><SelectContent>{getSubjectsForClass(selectedClass).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select>}<Select value={selectedPeriod} onValueChange={setSelectedPeriod}><SelectTrigger className="w-48 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(periodLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
    {!selectedClass || !selectedSubject ? <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400">Selecione uma turma e matéria para ver as notas</p></div> : classStudents.length === 0 ? <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><p className="text-sm text-slate-400">Nenhum aluno nesta turma</p></div> : <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-100"><th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-white">Aluno</th>{gradeLabels.map(label => <th key={label} className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</th>)}<th className="text-center px-4 py-3 text-xs font-semibold text-cyan-600 uppercase tracking-wider">Média</th></tr></thead><tbody className="divide-y divide-slate-50">{classStudents.map(s => <tr key={s.id} className="hover:bg-slate-50/50 transition-colors"><td className="px-5 py-3 font-medium text-slate-700 sticky left-0 bg-white">{s.name}</td>{gradeLabels.map(label => { const g=getGrade(s.id,label); return <td key={label} className="text-center px-4 py-3">{g ? <div className="inline-flex items-center gap-1"><span className={`font-medium ${g.score/(g.max_score||10)>=0.6?'text-emerald-600':'text-red-500'}`}>{g.score}</span><span className="text-slate-300 text-xs">/{g.max_score||10}</span></div> : <span className="text-slate-300">-</span>}</td>; })}<td className="text-center px-4 py-3"><span className={`font-bold ${parseFloat(getAverage(s.id))>=6?'text-emerald-600':getAverage(s.id)==='-'?'text-slate-300':'text-red-500'}`}>{getAverage(s.id)}</span></td></tr>)}</tbody></table></div>}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Lançar Notas</DialogTitle><p className="text-sm text-slate-500">{getClassName(selectedClass)} — {getSubjectName(selectedSubject)} — {periodLabels[selectedPeriod]}</p></DialogHeader><div className="space-y-4 mt-4"><div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Descrição da Nota *</label><Input value={gradeLabel} onChange={e=>setGradeLabel(e.target.value)} placeholder="Ex: Prova 1" className="rounded-xl" /></div><div><label className="text-xs font-medium text-slate-600 mb-1.5 block">Nota Máxima</label><Input type="number" value={maxScore} onChange={e=>setMaxScore(e.target.value)} className="rounded-xl" /></div></div><div className="space-y-2"><label className="text-xs font-medium text-slate-600 block">Notas dos Alunos</label>{classStudents.map(s => <div key={s.id} className="flex items-center gap-3 py-1"><span className="text-sm text-slate-700 flex-1 truncate">{s.name}</span><Input type="number" step="0.1" min="0" max={maxScore} value={bulkGrades[s.id]||''} onChange={e=>setBulkGrades({...bulkGrades,[s.id]:e.target.value})} className="w-24 rounded-xl text-center" placeholder="—" /></div>)}</div><Button onClick={handleBulkSave} disabled={saving} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl"><Save className="w-4 h-4 mr-2" />{saving?'Salvando...':'Salvar Notas'}</Button></div></DialogContent></Dialog>
  </div>;
}
