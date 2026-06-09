import { useState } from 'react';
import { Building2, Wrench, Kanban as KanbanIcon, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { mockPlans, mockUnidades } from './mockData';
import { ObraConstrucao, AcaoUnidade, ExpansionPlan } from './types';
import KanbanBoard from './KanbanBoard';
import { getActivities } from './Kanban';

export default function QuadroKanbanGlobal() {
  const [plans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

  const [planoSelecionado, setPlanoSelecionado] = useState<string>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    const list: ExpansionPlan[] = cached ? JSON.parse(cached) : mockPlans;
    return list[0]?.id ?? '';
  });
  const [abaAtiva, setAbaAtiva] = useState<'obras' | 'acoes'>('obras');
  const [kanbanAberto, setKanbanAberto] = useState<{
    itemId: string;
    itemType: 'obra' | 'acao-unidade';
    itemData: ObraConstrucao | AcaoUnidade;
  } | null>(null);

  const plano = plans.find(p => p.id === planoSelecionado) ?? plans[0] ?? mockPlans[0];

  const calcularProgresso = (itemId: string, itemType: 'obra' | 'acao-unidade'): number => {
    const atividades = getActivities().filter(
      a => a.itemId === itemId && a.itemType === itemType
    );
    if (atividades.length === 0) return 0;
    const concluidas = atividades.filter(a => a.status === 'FEITO').length;
    return Math.round((concluidas / atividades.length) * 100);
  };

  const contarAtividades = (itemId: string, itemType: 'obra' | 'acao-unidade') => {
    const atividades = getActivities().filter(
      a => a.itemId === itemId && a.itemType === itemType
    );
    return {
      total: atividades.length,
      aFazer: atividades.filter(a => a.status === 'A FAZER').length,
      fazendo: atividades.filter(a => a.status === 'FAZENDO').length,
      feito: atividades.filter(a => a.status === 'FEITO').length,
    };
  };

  const abrirKanban = (itemId: string, itemType: 'obra' | 'acao-unidade', itemData: ObraConstrucao | AcaoUnidade) => {
    setKanbanAberto({ itemId, itemType, itemData });
  };

  const fecharKanban = () => {
    setKanbanAberto(null);
  };

  // Se um Kanban está aberto, mostrar ele
  if (kanbanAberto) {
    return (
      <KanbanBoard
        planId={plano.id}
        itemId={kanbanAberto.itemId}
        itemType={kanbanAberto.itemType}
        itemData={kanbanAberto.itemData}
        onBack={fecharKanban}
      />
    );
  }

  // Vista principal do Quadro Kanban Global
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Quadro Kanban Global</h1>
        <p className="text-slate-600">Gerencie todas as obras e ações em andamento</p>
      </div>

      {/* Seletor de Plano */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Plano de Expansão</label>
        <select
          value={planoSelecionado}
          onChange={(e) => setPlanoSelecionado(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        >
          {plans.map(p => (
            <option key={p.id} value={p.id}>
              {p.nome} ({p.periodoInicio}–{p.periodoFim})
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAbaAtiva('obras')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            abaAtiva === 'obras'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-5 h-5" />
          Obras ({plano.obras.length})
        </button>
        <button
          onClick={() => setAbaAtiva('acoes')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            abaAtiva === 'acoes'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Wrench className="w-5 h-5" />
          Ações em Unidades ({plano.acoesUnidades.length})
        </button>
      </div>

      {/* Grid de Cards - Obras */}
      {abaAtiva === 'obras' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plano.obras.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhuma obra cadastrada</h3>
              <p className="text-slate-500">Cadastre obras no Plano de Expansão para gerenciar seus Kanbans</p>
            </div>
          ) : (
            plano.obras.map(obra => {
              const progresso = calcularProgresso(obra.id, 'obra');
              const atividades = contarAtividades(obra.id, 'obra');
              const temKanban = atividades.total > 0;

              return (
                <div
                  key={obra.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
                  onClick={() => abrirKanban(obra.id, 'obra', obra)}
                >
                  {/* Header do Card */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 text-white">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        obra.tipo === 'nova' ? 'bg-white/20' : 'bg-amber-400/30'
                      }`}>
                        {obra.tipo === 'nova' ? 'Nova' : 'Retomada'}
                      </span>
                      <span className="text-xs opacity-80">{obra.previsaoConclusao}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1 line-clamp-2">{obra.nome}</h3>
                    <p className="text-sm opacity-90">{obra.bairro} · {obra.setor}</p>
                  </div>

                  {/* Body do Card */}
                  <div className="p-4">
                    {/* Informações */}
                    <div className="space-y-2 mb-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{obra.numeroDeSalas} sala{obra.numeroDeSalas !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Etapas:</span>
                        <span className="font-semibold">{obra.etapasAtendidas.join(', ')}</span>
                      </div>
                      {obra.percentualConclusaoAtual != null && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Obra:</span>
                          <span className="font-semibold text-blue-600">{obra.percentualConclusaoAtual}% concluída</span>
                        </div>
                      )}
                    </div>

                    {/* Status do Kanban */}
                    {temKanban ? (
                      <>
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-600">Progresso Kanban</span>
                            <span className="text-xs font-bold text-blue-600">{progresso}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all rounded-full"
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <div className="font-bold text-slate-700">{atividades.aFazer}</div>
                            <div className="text-slate-500">A fazer</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2">
                            <div className="font-bold text-blue-700">{atividades.fazendo}</div>
                            <div className="text-slate-500">Fazendo</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <div className="font-bold text-green-700">{atividades.feito}</div>
                            <div className="text-slate-500">Feito</div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirKanban(obra.id, 'obra', obra);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors group-hover:shadow-lg"
                        >
                          <KanbanIcon className="w-4 h-4" />
                          Abrir Kanban
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirKanban(obra.id, 'obra', obra);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                      >
                        <KanbanIcon className="w-4 h-4" />
                        Criar Kanban
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Grid de Cards - Ações em Unidades */}
      {abaAtiva === 'acoes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plano.acoesUnidades.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl shadow-lg p-12 text-center">
              <Wrench className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhuma ação cadastrada</h3>
              <p className="text-slate-500">Cadastre ações em unidades no Plano de Expansão</p>
            </div>
          ) : (
            plano.acoesUnidades.map(acao => {
              const progresso = calcularProgresso(acao.id, 'acao-unidade');
              const atividades = contarAtividades(acao.id, 'acao-unidade');
              const temKanban = atividades.total > 0;
              const unidade = mockUnidades.find(u => u.id === acao.unidadeId);

              return (
                <div
                  key={acao.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden group cursor-pointer"
                  onClick={() => abrirKanban(acao.id, 'acao-unidade', acao)}
                >
                  {/* Header do Card */}
                  <div className={`bg-gradient-to-br p-4 text-white ${
                    acao.tipo === 'adaptacao'
                      ? 'from-blue-500 to-blue-600'
                      : 'from-indigo-500 to-indigo-600'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20">
                        {acao.tipo === 'adaptacao' ? 'Adaptação' : 'Ampliação'}
                      </span>
                      <span className="text-xs opacity-80">{acao.previsaoConclusao}</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{unidade?.nome ?? 'Unidade'}</h3>
                    <p className="text-sm opacity-90 line-clamp-2">{acao.descricao}</p>
                  </div>

                  {/* Body do Card */}
                  <div className="p-4">
                    {/* Informações */}
                    <div className="space-y-2 mb-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Etapa:</span>
                        <span className="font-semibold">{acao.etapaDestino}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Capacidade:</span>
                        <span>{acao.capacidadeAnterior} → <strong className="text-green-600">{acao.novaCapacidade}</strong></span>
                      </div>
                      {acao.custoPorSala > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Custo:</span>
                          <span className="font-semibold text-blue-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(acao.custoPorSala)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status do Kanban */}
                    {temKanban ? (
                      <>
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-600">Progresso Kanban</span>
                            <span className="text-xs font-bold text-blue-600">{progresso}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all rounded-full"
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <div className="font-bold text-slate-700">{atividades.aFazer}</div>
                            <div className="text-slate-500">A fazer</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2">
                            <div className="font-bold text-blue-700">{atividades.fazendo}</div>
                            <div className="text-slate-500">Fazendo</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2">
                            <div className="font-bold text-green-700">{atividades.feito}</div>
                            <div className="text-slate-500">Feito</div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirKanban(acao.id, 'acao-unidade', acao);
                          }}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors group-hover:shadow-lg text-white ${
                            acao.tipo === 'adaptacao' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          <KanbanIcon className="w-4 h-4" />
                          Abrir Kanban
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirKanban(acao.id, 'acao-unidade', acao);
                        }}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-white ${
                          acao.tipo === 'adaptacao'
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        }`}
                      >
                        <KanbanIcon className="w-4 h-4" />
                        Criar Kanban
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
