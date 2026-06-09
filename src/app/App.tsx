import { useState } from 'react';
import ExpansaoCreches from './components/expansao-creches/ExpansaoCreches';
import CadastroServidores from './components/cadastro-servidores/CadastroServidores';
import logoBranca from '../imports/logo-central-de-vagas-branca.png';
import {
  Home as HomeIcon,
  Building2,
  LayoutDashboard,
  Settings,
  Users,
  School,
  FolderKanban,
  BarChart3,
  FileText,
  Baby,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type SidebarView =
  | 'home'
  | 'dashboard'
  | 'configuracoes-custo'
  | 'cadastro-servidores'
  | 'servidores'
  | 'unidades-escolares'
  | 'planos'
  | 'all-schools'
  | 'reports';

interface NavItem {
  id: SidebarView;
  label: string;
  icon: React.ReactNode;
  num?: string;
  section?: 'top' | 'expansao';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Início', icon: <HomeIcon className="w-5 h-5" />, section: 'top' },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, num: '1', section: 'expansao' },
  { id: 'configuracoes-custo', label: 'Config. de Custo', icon: <Settings className="w-5 h-5" />, num: '2', section: 'expansao' },
  { id: 'planos', label: 'Planos de Expansão', icon: <FolderKanban className="w-5 h-5" />, num: '3', section: 'expansao' },
  { id: 'all-schools', label: 'Quadro Kanban', icon: <BarChart3 className="w-5 h-5" />, num: '4', section: 'expansao' },
  { id: 'reports', label: 'Relatórios', icon: <FileText className="w-5 h-5" />, num: '5', section: 'expansao' },
];

export default function App() {
  const [activeView, setActiveView] = useState<SidebarView>('home');
  const [collapsed, setCollapsed] = useState(false);

  const topItems = NAV_ITEMS.filter(i => i.section === 'top');
  const expansaoItems = NAV_ITEMS.filter(i => i.section === 'expansao');

  const isExpansaoView = activeView !== 'home';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#379dff] transition-all duration-200 shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Logo / título */}
        <div className={`flex flex-col items-center px-4 py-6 border-b border-white/10 ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <>
              <img
                src={logoBranca}
                alt="Logo Central de Vagas"
                className="w-32 h-32 mb-2 object-contain"
              />
              <p className="text-white font-bold text-sm leading-tight text-center px-2">
                Gestão de Vagas em Creches
              </p>
            </>
          ) : (
            <img
              src={logoBranca}
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Início */}
          <div className="px-2 mb-4">
            {topItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  activeView === item.id
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

          {/* Expansão de Creches section */}
          {!collapsed && (
            <div className="px-4 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-white/60" />
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Expansão de Creches</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="px-2 mb-2 flex justify-center">
              <div className="w-8 border-t border-white/20" />
            </div>
          )}

          <div className="px-2 space-y-0.5">
            {expansaoItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                  activeView === item.id
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            ))}
          </div>
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all text-sm ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Recolher</span></>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {activeView === 'home' && (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Bem-vindo(a)!</h1>
              <p className="text-slate-600 text-lg">Sistema de Gestão de Vagas em Creche — Cacoal/RO</p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-700 mb-4">Acesso Rápido</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Agendamentos', icon: '📅' },
                  { label: 'Crianças', icon: '👶' },
                  { label: 'Entrevistas', icon: '📋' },
                  { label: 'Fila de Espera', icon: '📝' },
                ].map(item => (
                  <div key={item.label} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-center border border-slate-100">
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <p className="font-semibold text-slate-700">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Expansão de Creches */}
            <div
              onClick={() => setActiveView('dashboard')}
              className="bg-gradient-to-br from-[#379dff] to-[#2b7dd6] rounded-2xl p-8 text-white cursor-pointer hover:shadow-2xl transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="bg-white/20 p-5 rounded-2xl shrink-0">
                  <Building2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">Expansão de Creches</h3>
                  <p className="text-blue-100">Planejamento e gestão de obras · PPA 2026–2029 · Cacoal/RO</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {['Dashboard', 'Planos', 'Cadastro', 'Custos', 'Kanban', 'Relatórios'].map(tag => (
                      <span key={tag} className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'cadastro-servidores' && (
          <CadastroServidores />
        )}

        {isExpansaoView && activeView !== 'cadastro-servidores' && (
          <ExpansaoCreches
            key={activeView}
            initialView={activeView as any}
          />
        )}
      </main>
    </div>
  );
}
