import { useState, useMemo } from 'react';
import {
  MapPin,
  Users,
  Calendar,
  Building2,
  ChevronLeft,
  Edit2,
  Search,
  Wrench,
  KanbanSquare,
  DollarSign,
  Eye,
} from 'lucide-react';
import { Activity, ExpansionPlan } from './types';
import { loadExpansionPlans } from './utils/custeioMigration';
import { loadCatalogosCusteio, obterPeriodoExpansaoYM } from './utils/custeioCalculator';
import { extrairEscolasDoPlano, EscolaPlanoResumo } from './utils/planLogic';
import { getActivities } from './Kanban';
import KanbanBoard from './KanbanBoard';

interface SchoolsProps {
  planId: string;
  onNavigate: (view: string, payload?: any) => void;
  onBack: () => void;
}

const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return 'A definir';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  const dt = new Date(dateStr);
  return Number.isNaN(dt.getTime()) ? dateStr : dt.toLocaleDateString('pt-BR');
};

const formatCurrencyBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
    value || 0
  );

export default function Schools({ planId, onNavigate, onBack }: SchoolsProps) {
  const [plans, setPlans] = useState<ExpansionPlan[]>(() => loadExpansionPlans());
  const [catalogos] = useState(() => loadCatalogosCusteio());
  const [activities, setActivities] = useState<Activity[]>(() => getActivities());
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'obra' | 'acao-unidade'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKanbanItem, setSelectedKanbanItem] = useState<EscolaPlanoResumo | null>(null);

  const plan = useMemo(
    () => plans.find(p => p.id === planId),
    [plans, planId]
  );

  const escolas = useMemo(() => {
    if (!plan) return [];
    return extrairEscolasDoPlano(plan, catalogos.modelos, catalogos.ambientes, activities);
  }, [plan, catalogos.modelos, catalogos.ambientes, activities]);

  const handleCloseKanban = () => {
    setSelectedKanbanItem(null);
    setActivities(getActivities());
    setPlans(loadExpansionPlans());
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center">
          <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Plano de expansão não encontrado</h2>
          <p className="text-slate-500 text-sm mb-6">
            O plano selecionado não foi localizado nos registros salvos.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar aos Planos
          </button>
        </div>
      </div>
    );
  }

  if (selectedKanbanItem) {
    return (
      <KanbanBoard
        planId={plan.id}
        itemId={selectedKanbanItem.id}
        itemType={selectedKanbanItem.itemType}
        itemData={selectedKanbanItem.itemData}
        onBack={handleCloseKanban}
      />
    );
  }

  const obrasCount = escolas.filter(e => e.itemType === 'obra').length;
  const acoesCount = escolas.filter(e => e.itemType === 'acao-unidade').length;
  const totalVagas = escolas.reduce((s, e) => s + e.vagas, 0);
  const totalSalas = escolas.reduce((s, e) => s + e.salas, 0);
  const totalInvestimento = escolas.reduce((s, e) => s + e.investimentoTotal, 0);
  const progressoMedio =
    escolas.length > 0
      ? Math.round(escolas.reduce((s, e) => s + e.progressoKanban.percentual, 0) / escolas.length)
      : 0;

  const filteredEscolas = escolas.filter(escola => {
    const matchesTipo = filtroTipo === 'todas' || escola.itemType === filtroTipo;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      escola.nome.toLowerCase().includes(term) ||
      escola.bairro.toLowerCase().includes(term) ||
      escola.codigo.toLowerCase().includes(term) ||
      escola.subtituloDescricao.toLowerCase().includes(term);
    return matchesTipo && matchesSearch;
  });

  const getStatusBadgeClass = (tone: EscolaPlanoResumo['statusTone']) => {
    switch (tone) {
      case 'execucao':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'licitacao':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'concluida':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'planejamento':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoriaHeaderClass = (itemType: EscolaPlanoResumo['itemType'], subtipo: string) => {
    if (itemType === 'obra') {
      return subtipo === 'retomada'
        ? 'bg-gradient-to-r from-amber-600 to-orange-600'
        : 'bg-gradient-to-r from-purple-600 to-indigo-600';
    }
    return subtipo === 'ampliacao'
      ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
      : 'bg-gradient-to-r from-teal-600 to-emerald-600';
  };

  const getProgressColor = (progress: number, totalTasks: number) => {
    if (totalTasks === 0) return 'bg-slate-300';
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-orange-500';
  };

  const periodo = obterPeriodoExpansaoYM(plan);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 mb-3 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar aos Planos
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="text-3xl font-bold text-slate-800">Escolas do Plano</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  {periodo.label}
                </span>
              </div>
              <p className="text-slate-600 text-sm">
                <span className="font-semibold text-slate-800">{plan.nome || plan.name}</span> — acompanhe obras,
                retomadas, ampliações e adaptações vinculadas
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('edit-plano', plan.id)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs shrink-0"
            >
              <Edit2 className="w-4 h-4" />
              Gerenciar Obras e Ações
            </button>
          </div>
        </div>

        {/* KPIs Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Total Vinculado</p>
            <p className="text-2xl font-bold text-slate-800">{escolas.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {obrasCount} obras · {acoesCount} ações
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Novas Vagas</p>
            <p className="text-2xl font-bold text-emerald-700">+{totalVagas}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Capacidade planejada</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Salas Previstas</p>
            <p className="text-2xl font-bold text-blue-700">{totalSalas}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Salas de atividades/berçário</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-medium mb-1">Investimento Previsto</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrencyBRL(totalInvestimento)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Obras + ampliações</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-500 font-medium mb-1">Progresso Kanban</p>
            <p className="text-2xl font-bold text-purple-700">{progressoMedio}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Média das atividades</p>
          </div>
        </div>

        {/* Filtros e Busca */}
        {escolas.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltroTipo('todas')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtroTipo === 'todas'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas ({escolas.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('obra')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtroTipo === 'obra'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Obras / Novas Unidades ({obrasCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroTipo('acao-unidade')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtroTipo === 'acao-unidade'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Ampliações / Adaptações ({acoesCount})
              </button>
            </div>

            <div className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar escola, bairro ou código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        )}

        {/* Lista de Cards / Estados Vazios */}
        {escolas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center">
            <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              Nenhuma escola ou intervenção cadastrada neste plano
            </h3>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mb-6">
              Adicione novas construções, retomadas de obras ou ações de ampliação e adaptação na edição do plano para
              acompanhá-las aqui e gerenciar seus quadros Kanban.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('edit-plano', plan.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Adicionar Obras e Ações no Plano
            </button>
          </div>
        ) : filteredEscolas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-slate-600 font-semibold mb-2">Nenhuma escola corresponde aos filtros aplicados.</p>
            <button
              type="button"
              onClick={() => {
                setFiltroTipo('todas');
                setSearchTerm('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEscolas.map(escola => {
              const { total, concluidas, percentual } = escola.progressoKanban;

              return (
                <div
                  key={`${escola.itemType}-${escola.id}`}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {/* Cabeçalho colorido do Card */}
                  <div
                    className={`${getCategoriaHeaderClass(escola.itemType, escola.subtipo)} p-5 text-white cursor-pointer`}
                    onClick={() => setSelectedKanbanItem(escola)}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                        {escola.categoriaLabel}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                          escola.statusTone
                        )}`}
                      >
                        {escola.statusLabel}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold leading-snug mb-1">{escola.nome}</h3>
                    <p className="text-xs text-white/85 font-mono">{escola.codigo}</p>
                  </div>

                  {/* Corpo */}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs text-slate-600 mb-4 line-clamp-2">{escola.subtituloDescricao}</p>

                    <div className="space-y-2.5 text-sm text-slate-600 mb-5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-xs leading-relaxed">
                          {escola.endereco} · <span className="font-medium text-slate-700">{escola.bairro}</span> ({escola.setor})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs">
                          <strong className="text-slate-800">+{escola.vagas} vagas</strong> · {escola.salas}{' '}
                          {escola.salas === 1 ? 'sala' : 'salas'}
                          {escola.etapas.length > 0 && ` · ${escola.etapas.join(', ')}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs">
                          Previsão de entrega:{' '}
                          <strong className="text-slate-800">{formatDateBR(escola.previsaoConclusao)}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs">
                          Investimento:{' '}
                          <strong className="text-slate-800">{formatCurrencyBRL(escola.investimentoTotal)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Progresso Kanban */}
                    <div className="border-t border-slate-200 pt-4 mt-auto">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-600 font-semibold">Progresso no Kanban</span>
                        <span className="text-lg font-bold text-slate-800">{percentual}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(percentual, total)} transition-all duration-500 rounded-full`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                        <span>
                          {total > 0
                            ? `${concluidas} de ${total} atividades concluídas`
                            : 'Nenhuma atividade criada no Kanban'}
                        </span>
                        {escola.percentualFisico != null && (
                          <span className="font-semibold text-blue-600">
                            Físico: {escola.percentualFisico}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setSelectedKanbanItem(escola)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        <KanbanSquare className="w-3.5 h-3.5" />
                        Abrir Kanban
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('view-school', {
                            schoolId: escola.id,
                            planId: plan.id,
                            from: 'schools',
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        title="Ver detalhes da escola/intervenção"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
