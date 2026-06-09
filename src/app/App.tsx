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
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, num: '1', section: 'expansao' },
  { id: 'configuracoes-custo', label: 'Config. de Custo', icon: <Settings className="w-5 h-5" />, num: '2', section: 'expansao' },
  { id: 'planos', label: 'Planos de Expansão', icon: <FolderKanban className="w-5 h-5" />, num: '3', section: 'expansao' },
  { id: 'all-schools', label: 'Quadro Kanban', icon: <BarChart3 className="w-5 h-5" />, num: '4', section: 'expansao' },
  { id: 'reports', label: 'Relatórios', icon: <FileText className="w-5 h-5" />, num: '5', section: 'expansao' },
];

export default function App() {
  const [activeView, setActiveView] = useState<SidebarView>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const expansaoItems = NAV_ITEMS.filter(i => i.section === 'expansao');

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#379dff] transition-all duration-200 shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Logo / título */}
        <div className={`flex flex-col items-center px-4 pt-3 pb-5 border-b border-white/10 ${collapsed ? 'px-2' : ''}`}>
          {!collapsed ? (
            <>
              <img
                src={logoBranca}
                alt="Logo Central de Vagas"
                className="w-44 h-auto object-contain"
              />
              <p className="text-white font-bold text-sm leading-tight text-center px-2 mt-2">
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
        {activeView === 'cadastro-servidores' && (
          <CadastroServidores />
        )}

        {activeView !== 'cadastro-servidores' && (
          <ExpansaoCreches
            key={activeView}
            initialView={activeView as any}
          />
        )}
      </main>
    </div>
  );
}
