import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  MapPin,
  Users,
  Calendar,
  Building2,
  DollarSign,
  Edit2,
  KanbanSquare,
  Layers,
} from 'lucide-react';
import { mockSchools } from './mockData';
import { Activity, ExpansionPlan } from './types';
import { loadExpansionPlans } from './utils/custeioMigration';
import { loadCatalogosCusteio } from './utils/custeioCalculator';
import { extrairEscolasDoPlano, EscolaPlanoResumo } from './utils/planLogic';
import { getActivities } from './Kanban';
import KanbanBoard from './KanbanBoard';

interface SchoolViewProps {
  schoolId: string;
  planId?: string;
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

export default function SchoolView({ schoolId, planId, onNavigate, onBack }: SchoolViewProps) {
  const [plans, setPlans] = useState<ExpansionPlan[]>(() => loadExpansionPlans());
  const [catalogos] = useState(() => loadCatalogosCusteio());
  const [activities, setActivities] = useState<Activity[]>(() => getActivities());
  const [showKanban, setShowKanban] = useState(false);

  const resolved = useMemo<{ plan?: ExpansionPlan; escola?: EscolaPlanoResumo }>(() => {
    const candidates = planId
      ? [plans.find(p => p.id === planId), ...plans.filter(p => p.id !== planId)].filter(
          (p): p is ExpansionPlan => Boolean(p)
        )
      : plans;

    for (const p of candidates) {
      const lista = extrairEscolasDoPlano(p, catalogos.modelos, catalogos.ambientes, activities);
      const found = lista.find(e => e.id === schoolId);
      if (found) {
        return { plan: p, escola: found };
      }
    }
    return {};
  }, [plans, planId, schoolId, catalogos.modelos, catalogos.ambientes, activities]);

  const legacySchool = useMemo(
    () => (!resolved.escola ? mockSchools.find(s => s.id === schoolId) : undefined),
    [resolved.escola, schoolId]
  );

  if (showKanban && resolved.escola) {
    return (
      <KanbanBoard
        planId={resolved.escola.planId}
        itemId={resolved.escola.id}
        itemType={resolved.escola.itemType}
        itemData={resolved.escola.itemData}
        onBack={() => {
          setShowKanban(false);
          setActivities(getActivities());
          setPlans(loadExpansionPlans());
        }}
      />
    );
  }

  if (!resolved.escola && !legacySchool) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-12 text-center">
          <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Escola ou intervenção não encontrada</h2>
          <p className="text-sm text-slate-500 mb-6">
            O registro solicitado não foi encontrado no plano de expansão selecionado.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const escola = resolved.escola;
  const plan = resolved.plan;

  const itemActivities = escola
    ? activities.filter(a => {
        if (a.itemId) {
          const samePlan = !a.planId || a.planId === escola.planId;
          const sameType = !a.itemType || a.itemType === escola.itemType;
          return samePlan && sameType && a.itemId === escola.id;
        }
        return a.schoolId === escola.id;
      })
    : activities.filter(a => a.schoolId === schoolId);

  const completedActivities = itemActivities.filter(a => a.status === 'FEITO').length;
  const inProgressActivities = itemActivities.filter(a => a.status === 'FAZENDO').length;
  const pendingActivities = itemActivities.filter(a => a.status === 'A FAZER').length;
  const overallProgress =
    itemActivities.length > 0 ? Math.round((completedActivities / itemActivities.length) * 100) : 0;

  const displayName = escola ? escola.nome : legacySchool!.name;
  const displayCode = escola ? escola.codigo : legacySchool!.code;
  const displayAddress = escola ? escola.endereco : legacySchool!.address;
  const displayNeighborhood = escola ? `${escola.bairro} (${escola.setor})` : legacySchool!.neighborhood;
  const displayVagas = escola ? escola.vagas : legacySchool!.expectedVacancies;
  const displaySalas = escola ? escola.salas : legacySchool!.classrooms;
  const displayDelivery = escola ? escola.previsaoConclusao : legacySchool!.expectedDelivery;
  const displayStatus = escola ? escola.statusLabel : legacySchool!.status;

  const getStatusColor = (toneOrStatus: string) => {
    switch (toneOrStatus) {
      case 'execucao':
      case 'Em andamento':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'licitacao':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'concluida':
      case 'Concluída':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'planejamento':
      case 'Planejamento':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 mb-3 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                {escola && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    {escola.categoriaLabel}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getStatusColor(
                    escola ? escola.statusTone : displayStatus
                  )}`}
                >
                  {displayStatus}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">{displayName}</h1>
              <p className="text-slate-500 text-sm font-mono">{displayCode}</p>
            </div>

            {escola ? (
              <button
                type="button"
                onClick={() => setShowKanban(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-xs shrink-0"
              >
                <KanbanSquare className="w-4 h-4" />
                Abrir Quadro Kanban
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('kanban', schoolId)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-xs shrink-0"
              >
                <KanbanSquare className="w-4 h-4" />
                Abrir Kanban
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Gerais */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b border-slate-200">
                Informações Gerais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2.5 rounded-lg shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Localização</p>
                    <p className="text-sm font-medium text-slate-800">{displayAddress}</p>
                    <p className="text-xs text-slate-600">{displayNeighborhood}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 p-2.5 rounded-lg shrink-0">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Capacidade Planejada</p>
                    <p className="text-sm font-bold text-slate-800">+{displayVagas} vagas</p>
                    <p className="text-xs text-slate-600">
                      {displaySalas} {displaySalas === 1 ? 'sala' : 'salas'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2.5 rounded-lg shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Previsão de Entrega</p>
                    <p className="text-sm font-bold text-slate-800">{formatDateBR(displayDelivery)}</p>
                  </div>
                </div>

                {escola ? (
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2.5 rounded-lg shrink-0">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Investimento Previsto</p>
                      <p className="text-sm font-bold text-slate-800">
                        {formatCurrencyBRL(escola.investimentoTotal)}
                      </p>
                      {escola.fonteFinanciamento && (
                        <p className="text-xs text-slate-600">Fonte: {escola.fonteFinanciamento}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="bg-orange-100 p-2.5 rounded-lg shrink-0">
                      <Building2 className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Responsável Técnico</p>
                      <p className="text-sm text-slate-800">{legacySchool!.technicalResponsible}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dados do Plano & Execução */}
            {escola && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-5 pb-2 border-b border-slate-200">
                  Vínculo com o Plano de Expansão
                </h2>
                <div className="space-y-3 text-sm">
                  {plan && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-4">
                      <span className="text-slate-500 font-medium">Plano de Expansão</span>
                      <span className="text-slate-800 font-semibold text-right">
                        {plan.nome || plan.name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-4">
                    <span className="text-slate-500 font-medium">Descrição / Modelo</span>
                    <span className="text-slate-800 text-right">{escola.subtituloDescricao}</span>
                  </div>
                  {escola.etapas.length > 0 && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-4">
                      <span className="text-slate-500 font-medium">Etapas Atendidas</span>
                      <span className="text-slate-800 font-medium text-right">
                        {escola.etapas.join(', ')}
                      </span>
                    </div>
                  )}
                  {escola.percentualFisico != null && (
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 gap-4">
                      <span className="text-slate-500 font-medium">Execução Física Registrada</span>
                      <span className="text-blue-700 font-bold">{escola.percentualFisico}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 gap-4">
                    <span className="text-slate-500 font-medium">Código / Convênio</span>
                    <span className="text-slate-800 font-mono">{escola.codigo}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Progresso Geral */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <h2 className="text-base font-bold text-slate-800 mb-4">Progresso no Kanban</h2>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-blue-600 mb-1">{overallProgress}%</div>
                <p className="text-xs text-slate-500">
                  {itemActivities.length > 0
                    ? `${completedActivities} de ${itemActivities.length} atividades concluídas`
                    : 'Nenhuma atividade cadastrada ainda'}
                </p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 mb-5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">A Fazer</span>
                  <span className="font-bold text-slate-800">{pendingActivities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Em Andamento</span>
                  <span className="font-bold text-blue-600">{inProgressActivities}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Concluídas</span>
                  <span className="font-bold text-emerald-600">{completedActivities}</span>
                </div>
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
              <h2 className="text-base font-bold text-slate-800 mb-4">Atividades Recentes</h2>
              {itemActivities.length > 0 ? (
                <div className="space-y-3">
                  {itemActivities.slice(0, 5).map(activity => (
                    <div key={activity.id} className="border-l-4 border-blue-500 pl-3 py-1.5">
                      <p className="text-sm font-semibold text-slate-800">{activity.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            activity.status === 'FEITO'
                              ? 'bg-emerald-100 text-emerald-700'
                              : activity.status === 'FAZENDO'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {activity.status}
                        </span>
                        <span className="text-xs text-slate-500">{activity.responsible}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Abra o Quadro Kanban para gerar tarefas padrão ou adicionar atividades desta intervenção.
                </p>
              )}
              <button
                type="button"
                onClick={() => (escola ? setShowKanban(true) : onNavigate('kanban', schoolId))}
                className="w-full mt-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-semibold transition-colors"
              >
                Abrir Quadro Kanban →
              </button>
            </div>

            {/* Ações Rápidas */}
            {escola && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <h2 className="text-base font-bold text-slate-800 mb-3">Ações Rápidas</h2>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('edit-plano', escola.planId)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="font-semibold">Editar no Plano de Expansão</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('schools', escola.planId)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="font-semibold">Ver Todas as Escolas do Plano</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
