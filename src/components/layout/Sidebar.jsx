import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  School, Users, BookOpen, ClipboardList, GraduationCap, 
  FileText, Eye, Menu, X, LogOut, Home, ChevronLeft, ChevronRight,
  Layers
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = {
  super_admin: [
    { label: 'Painel', path: '/', icon: Home },
    { label: 'Escolas', path: '/schools', icon: School },
    { label: 'Usuários', path: '/users', icon: Users },
  ],
  school_admin: [
    { label: 'Painel', path: '/', icon: Home },
    { label: 'Turmas', path: '/classes', icon: Layers },
    { label: 'Matérias', path: '/subjects', icon: BookOpen },
    { label: 'Professores', path: '/teachers', icon: Users },
    { label: 'Alunos', path: '/students', icon: GraduationCap },
  ],
  teacher: [
    { label: 'Minhas Turmas', path: '/', icon: Home },
    { label: 'Aulas', path: '/lesson-plans', icon: BookOpen },
    { label: 'Atividades', path: '/activities', icon: ClipboardList },
    { label: 'Notas', path: '/grades', icon: FileText },
    { label: 'Observações', path: '/observations', icon: Eye },
  ],
};

export default function Sidebar({ role, user }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const effectiveRole = (role === 'admin' || role === 'super_admin') ? 'super_admin' : role;
  const items = navItems[effectiveRole] || navItems.teacher;

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate">EduPlan</h1>
              <p className="text-[11px] text-slate-400 truncate">
                {effectiveRole === 'super_admin' ? 'Super Admin' : effectiveRole === 'school_admin' ? 'Admin Escola' : 'Professor'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-cyan-50 text-cyan-700 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-cyan-600' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-100">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-slate-700 truncate">{user.full_name || user.email}</p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all w-full ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-xl shadow-md p-2.5 border border-slate-100"
      >
        {mobileOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-slate-100 z-40 w-64 transition-transform duration-300 lg:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-white border-r border-slate-100 h-screen sticky top-0 transition-all duration-300
        ${collapsed ? 'w-[72px]' : 'w-60'}
      `}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:shadow-md transition-shadow"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      </aside>
    </>
  );
}