import { useState } from 'react';
import {
  Plus, Search, Filter, Calendar, DollarSign, Users, ChevronLeft,
  Edit2, Trash2, Eye, ArrowRight, Building2, Play, CheckCircle2,
  Pause, RotateCcw, Calculator
} from 'lucide-react';
import { ExpansionPlan, PlanStatus, PlanoCusteio, Activity } from './types';
import { loadExpansionPlans, loadPlanosCusteio } from './utils/custeioMigration';
import { loadCatalogosCusteio, obterPeriodoExpansaoYM } from './utils/custeioCalculator';
import { extrairEscolasDoPlano } from './utils/planLogic';
import { getActivities } from './Kanban';
import PlanStatusConfirmModal, { PlanModalConfig, PlanActionType } from './PlanStatusConfirmModal';
import { toast } from 'sonner';

interface PlanosListProps {
  onNavigate: (view: string, planId?: any) => void;
  onBack: () => void;
}

export default function PlanosList({ onNavigate, onBack }: PlanosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PlanStatus | 'Todos'>('Todos');
  const [modalConfig, setModalConfig] = useState<PlanModalConfig | null>(null);

  const [plans, setPlans] = useState<ExpansionPlan[]>(() => loadExpansionPlans());
  const [planosCusteio] = useState<PlanoCusteio[]>(() => loadPlanosCusteio());
  const [catalogos] = useState(() => loadCatalogosCusteio());
  const [activities] = useState<Activity[]>(() => getActivities());

  const handleUpdatePlanStatus = (planId: string, newStatus: PlanStatus) => {
    const updated = plans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          status: newStatus,
          dataAprovacao: newStatus === 'Concluído' ? new Date().toISOString().split('T')[0] : p.dataAprovacao,
        };
      }
      return p;
    });
    setPlans(updated);
    localStorage.setItem("exp_creches_plans", JSON.stringify(updated));
    toast.success(`Status do plano atualizado para "${newStatus}"!`);
  };

  const requestStatusChange = (
    plan: ExpansionPlan,
    targetStatus: PlanStatus,
    actionType: PlanActionType = 'alterar'
  ) => {
    setModalConfig({
      isOpen: true,
      planId: plan.id,
      planName: plan.name || plan.nome,
      actionType,
      currentStatus: plan.status,
      targetStatus,
      onConfirm: () => {
        handleUpdatePlanStatus(plan.id, targetStatus);
      },
    });
  };

  const handleDeletePlan = (plan: ExpansionPlan) => {
    setModalConfig({
      isOpen: true,
      planId: plan.id,
      planName: plan.name || plan.nome,
      actionType: 'excluir',
      currentStatus: plan.status,
      onConfirm: () => {
        const updated = plans.filter(p => p.id !== plan.id);
        setPlans(updated);
        localStorage.setItem("exp_creches_plans", JSON.stringify(updated));
        toast.success(`Plano "${plan.name || plan.nome}" excluído com sucesso.`);
      },
    });
  };

  const filteredPlans = plans.filter(plan => {
    const nome = plan.name || plan.nome || '';
    const desc = plan.description || plan.descricao || '';
    const matchesSearch = nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'Todos' || plan.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: PlanStatus) => {
    switch (status) {
      case 'Rascunho': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Em execução': return 'bg-green-100 text-green-700 border-green-200';
      case 'Planejamento': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Paralisado': return 'bg-red-100 text-red-700 border-red-200';
      case 'Concluído': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getProgressColor = (progress: number, totalTasks: number) => {
    if (totalTasks === 0) return 'bg-slate-300';
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (progress: number, totalTasks: number) => {
    if (totalTasks === 0) return 'text-slate-500';
    if (progress >= 75) return 'text-green-700';
    if (progress >= 50) return 'text-blue-700';
    if (progress >= 25) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getCategoriaBadgeClass = (categoria: string) => {
    switch (categoria) {
      case 'Nova Creche':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Retomada de Obra':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ampliação':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Adaptação':
      default:
        return 'bg-teal-50 text-teal-700 border-teal-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 mb-3 text-sm font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">Planos de Expansão</h1>
              <p className="text-slate-500 text-sm">Gerencie os planos de expansão física, obras e ampliações de creches</p>
            </div>
            <button
              onClick={() => onNavigate('new-plano')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Novo Plano de Expansão
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar planos de expansão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as PlanStatus | 'Todos')}
                className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white min-w-[200px] text-slate-700 font-medium"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Rascunho">Rascunho</option>
                <option value="Planejamento">Planejamento</option>
                <option value="Em execução">Em Execução</option>
                <option value="Paralisado">Paralisado</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredPlans.map(plan => {
            const planSchools = extrairEscolasDoPlano(
              plan,
              catalogos.modelos,
              catalogos.ambientes,
              activities
            );
            const obrasCount = planSchools.filter(s => s.itemType === 'obra').length;
            const acoesCount = planSchools.filter(s => s.itemType === 'acao-unidade').length;
            const totalVagasPlano = planSchools.reduce((s, e) => s + e.vagas, 0);
            const totalSalasPlano = planSchools.reduce((s, e) => s + e.salas, 0);
            const valorEstimado =
              typeof plan.estimatedValue === 'number' && plan.estimatedValue > 0
                ? plan.estimatedValue
                : (plan.fontesFinanciamento || []).reduce((s, f) => s + (f.valorPrevisto || 0), 0);
            const fontesTexto =
              plan.fontesFinanciamento && plan.fontesFinanciamento.length > 0
                ? plan.fontesFinanciamento.map(f => f.fonte).filter(Boolean).join(', ')
                : plan.fundingSource || 'Não definida';

            return (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-800">{plan.name || plan.nome}</h3>
                        
                        {/* Status Interativo com Seleção Direta */}
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={plan.status}
                            onChange={(e) => {
                              const newSt = e.target.value as PlanStatus;
                              if (newSt !== plan.status) {
                                requestStatusChange(plan, newSt, 'alterar');
                              }
                            }}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border cursor-pointer outline-none transition-colors ${getStatusColor(plan.status)}`}
                            title="Clique para alternar o status do plano"
                          >
                            <option value="Rascunho">Rascunho</option>
                            <option value="Planejamento">Planejamento</option>
                            <option value="Em execução">Em execução</option>
                            <option value="Paralisado">Paralisado</option>
                            <option value="Concluído">Concluído</option>
                          </select>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{plan.description || plan.descricao}</p>
                    </div>

                    {/* Barra de Ações Rápidas do Topo */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Botão INICIAR EXECUÇÃO quando em Planejamento */}
                      {plan.status === 'Planejamento' && (
                        <button
                          onClick={() => requestStatusChange(plan, 'Em execução', 'iniciar')}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
                          title="Iniciar execução do plano"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Iniciar Execução
                        </button>
                      )}

                      {/* Botões quando Em execução */}
                      {plan.status === 'Em execução' && (
                        <>
                          <button
                            onClick={() => requestStatusChange(plan, 'Concluído', 'concluir')}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
                            title="Concluir plano de expansão"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Concluir Plano
                          </button>
                          <button
                            onClick={() => requestStatusChange(plan, 'Paralisado', 'paralisar')}
                            className="flex items-center gap-1 px-2.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-300 transition-all"
                            title="Paralisar execução"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Paralisar
                          </button>
                        </>
                      )}

                      {/* Botão quando Paralisado */}
                      {plan.status === 'Paralisado' && (
                        <button
                          onClick={() => requestStatusChange(plan, 'Em execução', 'retomar')}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
                          title="Retomar execução do plano"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Retomar Execução
                        </button>
                      )}

                      {/* Botão quando Rascunho */}
                      {plan.status === 'Rascunho' && (
                        <button
                          onClick={() => onNavigate('edit-plano', plan.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
                          title="Continuar preenchimento do plano"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Continuar Preenchimento
                        </button>
                      )}

                      {/* Botão quando Concluído */}
                      {plan.status === 'Concluído' && (
                        <button
                          onClick={() => requestStatusChange(plan, 'Em execução', 'reabrir')}
                          className="flex items-center gap-1.5 px-2.5 py-2 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-xs font-semibold border border-purple-200 transition-colors shadow-xs"
                          title="Reabrir execução"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reabrir Execução
                        </button>
                      )}

                      <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

                      <button
                        onClick={() => onNavigate('view-plano', plan.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Visualizar Detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onNavigate('edit-plano', plan.id)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar Plano"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Plano"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-semibold">Período de Vigência</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">{obterPeriodoExpansaoYM(plan).label}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-semibold">Valor Estimado</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorEstimado)}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-semibold">Responsável</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{plan.responsible || 'Responsável não definido'}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span className="text-sm font-semibold">Expansão Física</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      +{totalVagasPlano} vagas • {totalSalasPlano} salas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-semibold">Fonte de Recurso:</span>
                  <span>{fontesTexto}</span>
                </div>

                {/* Mini Cards das Escolas / Intervenções do Plano */}
                <div className="border-t border-slate-200 pt-4 mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Escolas do Plano ({planSchools.length})
                    </h4>
                    {planSchools.length > 0 && (
                      <span className="text-xs text-slate-500">
                        {obrasCount} {obrasCount === 1 ? 'obra' : 'obras'} · {acoesCount}{' '}
                        {acoesCount === 1 ? 'ampliação/adaptação' : 'ampliações/adaptações'}
                      </span>
                    )}
                  </div>

                  {planSchools.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {planSchools.map(escola => {
                        const progress = escola.progressoKanban.percentual;
                        const totalTasks = escola.progressoKanban.total;
                        return (
                          <div
                            key={`${escola.itemType}-${escola.id}`}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                            onClick={() =>
                              onNavigate('view-school', {
                                schoolId: escola.id,
                                planId: plan.id,
                                from: 'planos',
                              })
                            }
                          >
                            <div className="flex items-start justify-between mb-1.5 gap-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-slate-800 truncate" title={escola.nome}>
                                  {escola.nome}
                                </h5>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getCategoriaBadgeClass(
                                      escola.categoriaLabel
                                    )}`}
                                  >
                                    {escola.categoriaLabel}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono truncate">
                                    {escola.codigo}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-bold shrink-0 ${getProgressTextColor(progress, totalTasks)}`}
                                title={
                                  totalTasks > 0
                                    ? `${escola.progressoKanban.concluidas} de ${totalTasks} tarefas no Kanban`
                                    : 'Nenhuma tarefa iniciada no Kanban'
                                }
                              >
                                {progress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-2">
                              <div
                                className={`h-full ${getProgressColor(progress, totalTasks)} transition-all duration-500 rounded-full`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-600 mt-2 gap-2">
                              <span className="truncate">{escola.bairro}</span>
                              <span className="text-slate-500 shrink-0 font-medium">
                                +{escola.vagas} vagas · {escola.salas} {escola.salas === 1 ? 'sala' : 'salas'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        Nenhuma escola, obra ou ampliação vinculada a este plano ainda.
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('edit-plano', plan.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        + Adicionar no plano
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 mt-4 -mx-6 -mb-6">
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold">
                        {planSchools.length} {planSchools.length === 1 ? 'escola vinculada' : 'escolas vinculadas'}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md text-xs">
                      <Calculator className="w-3.5 h-3.5" />
                      {planosCusteio.filter(pc => pc.planoExpansaoId === plan.id).length} Plano(s) de Custeio
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        const vinculados = planosCusteio.filter(pc => pc.planoExpansaoId === plan.id);
                        onNavigate('custeio-simulacao', {
                          planoExpansaoId: plan.id,
                          planoCusteioId: vinculados.length === 1 ? vinculados[0].id : undefined,
                          openCreateModal: vinculados.length === 0,
                        });
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold transition-colors text-xs"
                    >
                      <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                      Planos de Custeio
                    </button>

                    {/* Botão de Ação de Execução Principal no Rodapé */}
                    {plan.status === 'Planejamento' && (
                      <button
                        onClick={() => requestStatusChange(plan, 'Em execução', 'iniciar')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors text-xs"
                        title="Iniciar execução do plano"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Iniciar Execução
                      </button>
                    )}

                    {plan.status === 'Em execução' && (
                      <button
                        onClick={() => requestStatusChange(plan, 'Concluído', 'concluir')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors text-xs"
                        title="Concluir plano de expansão"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Concluir Plano
                      </button>
                    )}

                    {plan.status === 'Paralisado' && (
                      <button
                        onClick={() => requestStatusChange(plan, 'Em execução', 'retomar')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors text-xs"
                        title="Retomar execução do plano"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Retomar Execução
                      </button>
                    )}

                    {plan.status === 'Concluído' && (
                      <button
                        onClick={() => requestStatusChange(plan, 'Em execução', 'reabrir')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-semibold transition-colors text-xs"
                        title="Reabrir execução"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reabrir Execução
                      </button>
                    )}

                    {plan.status === 'Rascunho' && (
                      <button
                        onClick={() => onNavigate('edit-plano', plan.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors text-xs"
                        title="Continuar preenchimento do plano"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Continuar Preenchimento
                      </button>
                    )}

                    <button
                      onClick={() => onNavigate('schools', plan.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-xs"
                    >
                      Ver Escolas do Plano
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>

        {filteredPlans.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-slate-400 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhum plano encontrado</h3>
            <p className="text-slate-500">Tente ajustar os filtros ou criar um novo plano</p>
          </div>
        )}

        {/* Modal Moderno de Confirmação e Alerta de Status */}
        <PlanStatusConfirmModal
          config={modalConfig}
          onClose={() => setModalConfig(null)}
        />
      </div>
    </div>
  );
}
