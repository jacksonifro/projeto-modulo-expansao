import { useState } from 'react';
import {
  Plus, Search, Filter, Calendar, DollarSign, Users, ChevronLeft,
  Edit2, Trash2, Eye, ArrowRight, Building2, Play, CheckCircle2,
  Pause, RotateCcw, AlertCircle
} from 'lucide-react';
import { mockPlans, mockSchools, mockActivities } from './mockData';
import { ExpansionPlan, PlanStatus } from './types';

interface PlanosListProps {
  onNavigate: (view: string, planId?: string) => void;
  onBack: () => void;
}

export default function PlanosList({ onNavigate, onBack }: PlanosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PlanStatus | 'Todos'>('Todos');

  const [plans, setPlans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

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

  const getSchoolProgress = (schoolId: string) => {
    const activities = mockActivities.filter(a => a.schoolId === schoolId);
    if (activities.length === 0) return 0;
    const completed = activities.filter(a => a.status === 'FEITO').length;
    return Math.round((completed / activities.length) * 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressTextColor = (progress: number) => {
    if (progress >= 75) return 'text-green-700';
    if (progress >= 50) return 'text-blue-700';
    if (progress >= 25) return 'text-yellow-700';
    return 'text-red-700';
  };

  const getPlanSchools = (planId: string) => {
    return mockSchools.filter(s => s.planId === planId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Planos de Expansão</h1>
              <p className="text-slate-600 text-lg">Gerencie todos os planos de expansão de creches</p>
            </div>
            <button
              onClick={() => onNavigate('new-plano')}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Novo Plano
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar planos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as PlanStatus | 'Todos')}
                className="pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white min-w-[200px]"
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

        <div className="grid grid-cols-1 gap-6">
          {filteredPlans.map(plan => {
            const planSchools = getPlanSchools(plan.id);

            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-2xl font-bold text-slate-800">{plan.name || plan.nome}</h3>
                        
                        {/* Status Interativo com Seleção Direta */}
                        <div className="inline-flex items-center gap-1.5">
                          <select
                            value={plan.status}
                            onChange={(e) => {
                              const newSt = e.target.value as PlanStatus;
                              if (confirm(`Deseja alterar o status do plano "${plan.name || plan.nome}" para "${newSt}"?`)) {
                                handleUpdatePlanStatus(plan.id, newSt);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none transition-colors shadow-sm ${getStatusColor(plan.status)}`}
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
                      <p className="text-slate-600">{plan.description || plan.descricao}</p>
                    </div>

                    {/* Barra de Ações Rápidas do Topo */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Botão INICIAR EXECUÇÃO quando em Planejamento */}
                      {plan.status === 'Planejamento' && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja iniciar a execução do plano "${plan.name || plan.nome}"? O status passará para "Em execução".`)) {
                              handleUpdatePlanStatus(plan.id, 'Em execução');
                            }
                          }}
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
                            onClick={() => {
                              if (confirm(`Deseja marcar o plano "${plan.name || plan.nome}" como Concluído?`)) {
                                handleUpdatePlanStatus(plan.id, 'Concluído');
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
                            title="Concluir plano de expansão"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Concluir Plano
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja paralisar temporariamente a execução do plano "${plan.name || plan.nome}"?`)) {
                                handleUpdatePlanStatus(plan.id, 'Paralisado');
                              }
                            }}
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
                          onClick={() => {
                            if (confirm(`Deseja retomar a execução do plano "${plan.name || plan.nome}"?`)) {
                              handleUpdatePlanStatus(plan.id, 'Em execução');
                            }
                          }}
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
                          onClick={() => {
                            if (confirm(`Deseja reabrir a execução do plano "${plan.name || plan.nome}"?`)) {
                              handleUpdatePlanStatus(plan.id, 'Em execução');
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-2 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold border border-purple-200 transition-colors"
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
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o plano "${plan.name || plan.nome}"?`)) {
                            const updated = plans.filter(p => p.id !== plan.id);
                            setPlans(updated);
                            localStorage.setItem("exp_creches_plans", JSON.stringify(updated));
                          }
                        }}
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
                      <span className="text-sm font-semibold">Ano</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{plan.year}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm font-semibold">Valor Estimado</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.estimatedValue)}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-semibold">Responsável</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{plan.responsible}</p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-semibold">Período</span>
                    </div>
                    <p className="text-sm text-slate-800">
                      {new Date(plan.startDate).toLocaleDateString('pt-BR')} - {new Date(plan.expectedEndDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-semibold">Fonte de Recurso:</span>
                  <span>{plan.fundingSource}</span>
                </div>

                {/* Mini Cards das Escolas */}
                {planSchools.length > 0 && (
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Escolas do Plano ({planSchools.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {planSchools.map(school => {
                        const progress = getSchoolProgress(school.id);
                        return (
                          <div
                            key={school.id}
                            className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100 transition-colors cursor-pointer"
                            onClick={() => onNavigate('view-school', school.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-semibold text-slate-800 truncate">
                                  {school.name}
                                </h5>
                                <p className="text-xs text-slate-500 font-mono">{school.code}</p>
                              </div>
                              <span className={`text-xs font-bold ml-2 ${getProgressTextColor(progress)}`}>
                                {progress}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${getProgressColor(progress)} transition-all duration-500 rounded-full`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-600 mt-2">{school.neighborhood}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 mt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4" />
                    <span className="font-semibold">{planSchools.length} escola{planSchools.length !== 1 ? 's' : ''} vinculada{planSchools.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Botão de Ação de Execução Principal no Rodapé */}
                    {plan.status === 'Planejamento' && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja iniciar a execução do plano "${plan.name || plan.nome}"? O status passará para "Em execução".`)) {
                            handleUpdatePlanStatus(plan.id, 'Em execução');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md text-sm"
                        title="Iniciar execução do plano"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Iniciar Execução
                      </button>
                    )}

                    {plan.status === 'Em execução' && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja marcar o plano "${plan.name || plan.nome}" como Concluído?`)) {
                            handleUpdatePlanStatus(plan.id, 'Concluído');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md text-sm"
                        title="Concluir plano de expansão"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Concluir Plano
                      </button>
                    )}

                    {plan.status === 'Paralisado' && (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja retomar a execução do plano "${plan.name || plan.nome}"?`)) {
                            handleUpdatePlanStatus(plan.id, 'Em execução');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md text-sm"
                        title="Retomar execução do plano"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Retomar Execução
                      </button>
                    )}

                    {plan.status === 'Rascunho' && (
                      <button
                        onClick={() => onNavigate('edit-plano', plan.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md text-sm"
                        title="Continuar preenchimento do plano"
                      >
                        <Edit2 className="w-4 h-4" />
                        Continuar Preenchimento
                      </button>
                    )}

                    <button
                      onClick={() => onNavigate('schools', plan.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md text-sm"
                    >
                      Ver Escolas do Plano
                      <ArrowRight className="w-4 h-4" />
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
      </div>
    </div>
  );
}
