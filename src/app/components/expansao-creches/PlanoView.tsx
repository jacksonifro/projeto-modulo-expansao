import { useState } from 'react';
import { ChevronLeft, Building2, Users, Wrench, TrendingUp, DollarSign, Calendar, CheckCircle2, Target, AlertCircle, Kanban, Activity, Baby, Info } from 'lucide-react';
import { mockPlans, mockServidores, mockUnidades, mockProjecaoVagas, mockDemandaBairro } from './mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KanbanBoard from './KanbanBoard';
import { ObraConstrucao, AcaoUnidade, ExpansionPlan } from './types';
import { calculateViewMetrics } from './utils/planoViewLogic';

interface PlanoViewProps {
  planId?: string;
  onBack: () => void;
  onEdit?: () => void;
}

type KanbanState = {
  open: boolean;
  itemId: string | null;
  itemType: 'obra' | 'acao-unidade' | null;
  itemData: ObraConstrucao | AcaoUnidade | null;
};

const BRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const statusColor: Record<string, string> = {
  'Planejamento': 'bg-blue-100 text-blue-700 border-blue-200',
  'Em execução': 'bg-green-100 text-green-700 border-green-200',
  'Paralisado': 'bg-red-100 text-red-700 border-red-200',
  'Concluído': 'bg-purple-100 text-purple-700 border-purple-200',
};

const prioridadeColor: Record<string, string> = {
  P1: 'bg-red-100 text-red-700',
  P2: 'bg-amber-100 text-amber-700',
  P3: 'bg-slate-100 text-slate-600',
};

export default function PlanoView({ planId, onBack, onEdit }: PlanoViewProps) {
  const [plans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

  const plan = plans.find(p => p.id === planId) ?? plans[0] ?? mockPlans[0];
  const metrics = calculateViewMetrics(plan as any);

  const [kanbanState, setKanbanState] = useState<KanbanState>({
    open: false,
    itemId: null,
    itemType: null,
    itemData: null,
  });

  const getServidor = (id: string) => mockServidores.find(s => s.id === id);
  const getUnidade = (id: string) => mockUnidades.find(u => u.id === id);

  const abrirKanban = (itemId: string, itemType: 'obra' | 'acao-unidade', itemData: ObraConstrucao | AcaoUnidade) => {
    setKanbanState({ open: true, itemId, itemType, itemData });
  };

  const fecharKanban = () => {
    setKanbanState({ open: false, itemId: null, itemType: null, itemData: null });
  };

  // Se Kanban estiver aberto, mostrar ele ao invés do PlanoView
  if (kanbanState.open && kanbanState.itemId && kanbanState.itemType && kanbanState.itemData) {
    return (
      <KanbanBoard
        planId={plan.id}
        itemId={kanbanState.itemId}
        itemType={kanbanState.itemType}
        itemData={kanbanState.itemData}
        onBack={fecharKanban}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Voltar aos Planos
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${statusColor[plan.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {plan.status}
                </span>
                <span className="text-slate-400 text-sm">{plan.periodoInicio}–{plan.periodoFim}</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-1">{plan.nome}</h1>
              {plan.descricao && <p className="text-slate-600">{plan.descricao}</p>}
            </div>
            {onEdit && (
              <button onClick={onEdit} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow">
                Editar Plano
              </button>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Investimento Total', value: BRL(metrics.totalInvestimento), icon: <DollarSign className="w-5 h-5 text-blue-600" />, color: 'border-blue-400' },
            { label: 'Vagas Criadas', value: String(metrics.totalVagas), icon: <Baby className="w-5 h-5 text-purple-600" />, color: 'border-purple-400' },
            { label: 'Salas Criadas', value: String(metrics.totalSalas), icon: <Building2 className="w-5 h-5 text-amber-600" />, color: 'border-amber-400' },
            { label: 'Membros da equipe', value: String(plan.equipe.length), icon: <Users className="w-5 h-5 text-green-600" />, color: 'border-green-400' },
          ].map(k => (
            <div key={k.label} className={`bg-white rounded-2xl shadow-lg p-5 border-l-4 ${k.color}`}>
              <div className="flex items-center gap-2 mb-2">{k.icon}<span className="text-xs font-semibold text-slate-500 uppercase">{k.label}</span></div>
              <p className="text-2xl font-bold text-slate-800">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Objetivo estratégico */}
        {plan.objetivoEstrategico && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-3"><Target className="w-5 h-5 text-blue-500" /><h2 className="font-bold text-slate-800">Objetivo Estratégico</h2></div>
            <p className="text-slate-600 leading-relaxed">{plan.objetivoEstrategico}</p>
          </div>
        )}

        {/* Projeção de vagas */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-green-500" /><h2 className="font-bold text-slate-800">Projeção de Vagas 2025–2029</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mockProjecaoVagas}>
              <defs>
                <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ano" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="vagas" stroke="#3b82f6" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="taxa" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} unit="%" domain={[0, 35]} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Area key="acumulado" yAxisId="vagas" type="monotone" dataKey="acumulado" name="Vagas Acumuladas" stroke="#3b82f6" fill="url(#pvGrad)" strokeWidth={2} />
              <Area key="taxa" yAxisId="taxa" type="monotone" dataKey="taxaAtendimento" name="Taxa %" stroke="#10b981" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Fontes de financiamento */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4"><DollarSign className="w-5 h-5 text-blue-500" /><h2 className="font-bold text-slate-800">Fontes de Financiamento</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Fonte</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Valor Previsto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plan.fontesFinanciamento.map(f => (
                  <tr key={f.id}>
                    <td className="px-4 py-3 font-semibold text-slate-700">{f.fonte}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">{BRL(f.valorPrevisto)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-slate-800">Total</td>
                  <td className="px-4 py-3 text-right text-blue-700">{BRL(plan.fontesFinanciamento.reduce((s,f) => s + f.valorPrevisto, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Plano de Desembolso Anual */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4"><DollarSign className="w-5 h-5 text-blue-500" /><h2 className="font-bold text-slate-800">Plano de Desembolso Anual</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Ano</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Disponível (fontes)</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Desembolso (planejado)</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.anosPlano.map(ano => {
                  const dispon = plan.fontesFinanciamento.reduce((s,f) => s + f.valorPrevisto, 0) / metrics.anosPlano.length;
                  const inv = metrics.investimentoPorAno.find(d => d.ano === ano)?.valor || 0;
                  const saldo = dispon - inv;
                  return (
                    <tr key={ano}>
                      <td className="px-4 py-3 text-slate-700">{ano}</td>
                      <td className="px-4 py-3 text-right text-green-700 font-semibold">{BRL(dispon)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{BRL(inv)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${saldo < 0 ? 'text-red-600' : 'text-slate-800'}`}>{BRL(saldo)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-bold">
                  <td className="px-4 py-3 text-slate-800">Total</td>
                  <td className="px-4 py-3 text-right text-blue-700">{BRL(plan.fontesFinanciamento.reduce((s,f)=>s+f.valorPrevisto,0))}</td>
                  <td className="px-4 py-3 text-right text-blue-700">{BRL(metrics.totalInvestimento)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Estratégias */}
        {plan.estrategias.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-amber-500" /><h2 className="font-bold text-slate-800">Estratégias de Expansão</h2></div>
            <div className="space-y-3">
              {plan.estrategias.map(e => (
                <div key={e.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-slate-800">{e.estrategia}</p>
                    {e.vantagens.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {e.vantagens.map(v => <span key={v} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{v}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {e.prioridade && <span className={`text-xs font-bold px-2 py-1 rounded-full ${prioridadeColor[e.prioridade]}`}>{e.prioridade}</span>}
                    {e.viabilidadeTecnica === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {e.viabilidadeTecnica === false && <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações em Unidades */}
        {plan.acoesUnidades.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4"><Wrench className="w-5 h-5 text-amber-500" /><h2 className="font-bold text-slate-800">Ações em Unidades Existentes</h2></div>
            <div className="space-y-3">
              {plan.acoesUnidades.map(a => {
                const ue = getUnidade(a.unidadeId);
                return (
                  <div key={a.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${a.tipo === 'adaptacao' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {a.tipo === 'adaptacao' ? 'Adaptação' : 'Ampliação'}
                        </span>
                        <span className="font-semibold text-slate-800">{ue?.nome ?? a.unidadeId}</span>
                      </div>
                      <span className="text-sm text-slate-500 shrink-0 ml-2">{a.previsaoConclusao}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 mb-3">{a.descricao}</p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                        <span>Etapa destino: <strong className="text-slate-700">{a.etapaDestino}</strong></span>
                        <span>Cap. {a.capacidadeAnterior} → <strong className="text-green-700">{a.novaCapacidade}</strong></span>
                        {(() => { const it = metrics.itens.find((i:any) => i.id === a.id); return it ? <><span>Investimento: <strong className="text-blue-700">{BRL(it.totalInvestimento)}</strong></span><span>Custeio Anual: <strong className="text-blue-700">{BRL(it.custoPessoalAnual)}</strong></span></> : null; })()}
                      </div>
                      <button
                        onClick={() => abrirKanban(a.id, 'acao-unidade', a)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0"
                      >
                        <Kanban className="w-3.5 h-3.5" />
                        Gerenciar Kanban
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Obras */}
        {plan.obras.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-purple-500" /><h2 className="font-bold text-slate-800">Obras de Construção</h2></div>
            <div className="space-y-3">
              {plan.obras.map(o => (
                <div key={o.id} className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${o.tipo === 'nova' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {o.tipo === 'nova' ? 'Nova construção' : 'Retomada de obra'}
                      </span>
                      <span className="font-semibold text-slate-800">{o.nome}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                      o.statusObra === 'em_execucao' ? 'bg-green-100 text-green-700' :
                      o.statusObra === 'em_licitacao' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {o.statusObra === 'em_execucao' ? 'Em execução' : o.statusObra === 'em_licitacao' ? 'Em licitação' : 'Planejada'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                      <span><strong className="text-slate-700">{o.bairro}</strong> · {o.setor}</span>
                      <span>{o.numeroDeSalas} sala{o.numeroDeSalas !== 1 ? 's' : ''}</span>
                      <span>Etapas: {o.etapasAtendidas.join(', ')}</span>
                      {(() => { const it = metrics.itens.find((i:any) => i.id === o.id); return it ? <><span>Investimento: <strong className="text-purple-700">{BRL(it.totalInvestimento)}</strong></span><span>Custeio Anual: <strong className="text-purple-700">{BRL(it.custoPessoalAnual)}</strong></span></> : null; })()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
                      <span>Conclusão: <strong className="text-slate-700">{o.previsaoConclusao}</strong></span>
                      {o.numeroConvenio && <span>Convênio: {o.numeroConvenio}</span>}
                      {o.percentualConclusaoAtual != null && <span>Conclusão atual: <strong>{o.percentualConclusaoAtual}%</strong></span>}
                    </div>
                    <button
                      onClick={() => abrirKanban(o.id, 'obra', o)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors shrink-0"
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      Gerenciar Kanban
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Equipe */}
        {plan.equipe.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-teal-500" /><h2 className="font-bold text-slate-800">Equipe Responsável</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plan.equipe.map(m => {
                const s = getServidor(m.servidorId);
                if (!s) return null;
                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                      {s.nome.split(' ').slice(0, 2).map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{s.nome}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{s.cargo}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">{m.papel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RESULTADOS / DASHBOARD */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-blue-500">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-800">Resultados Esperados (Dashboard)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><Baby className="w-5 h-5" /> Novas Vagas vs Déficit</div>
              <div className="text-3xl font-black text-blue-800 mb-1">{metrics.totalVagas} <span className="text-base font-normal text-blue-600">vagas criadas</span></div>
              <p className="text-sm text-blue-600">Atendendo {((metrics.totalVagas / Math.max(1, mockDemandaBairro.reduce((s,d) => s + d.naoFrequentam, 0))) * 100).toFixed(1)}% da demanda reprimida atual do CadÚnico.</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl border border-amber-200">
              <div className="flex items-center gap-2 mb-2 text-amber-700 font-semibold"><DollarSign className="w-5 h-5" /> Custo Médio por Vaga</div>
              <div className="text-3xl font-black text-amber-800 mb-1">{metrics.totalVagas > 0 ? BRL(metrics.totalInvestimento / metrics.totalVagas) : '—'}</div>
              <p className="text-sm text-amber-600">Investimento médio estimado por criança atendida.</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2 text-purple-700 font-semibold"><Building2 className="w-5 h-5" /> Custo Médio por Sala</div>
              <div className="text-3xl font-black text-purple-800 mb-1">{metrics.totalSalas > 0 ? BRL(metrics.totalInvestimento / metrics.totalSalas) : '—'}</div>
              <p className="text-sm text-purple-600">Considerando as {metrics.totalSalas} salas planejadas.</p>
            </div>
          </div>
          
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-3">Evolução do Plano de Expansão</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-200/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 rounded-l-lg">Ano</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">Investimento Previsto</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">Vagas Entregues</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700 rounded-r-lg">Salas Concluídas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {metrics.anosPlano.map(ano => (
                    <tr key={ano}>
                      <td className="px-4 py-3 font-medium text-slate-800">{ano}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{BRL(metrics.investimentoPorAno.find(d => d.ano === ano)?.valor || 0)}</td>
                      <td className="px-4 py-3 text-right text-blue-600 font-bold">+{metrics.vagasPorAno.find(d => d.ano === ano)?.vagas || 0}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{metrics.salasPorAno.find(d => d.ano === ano)?.salas || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4"><Calendar className="w-5 h-5 text-slate-500" /><h2 className="font-bold text-slate-800">Datas do Plano</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-slate-500">Elaboração:</span> <strong className="text-slate-800 ml-1">{plan.dataElaboracao || '—'}</strong></div>
            <div><span className="text-slate-500">Revisão:</span> <strong className="text-slate-800 ml-1">{plan.dataRevisao || '—'}</strong></div>
            <div><span className="text-slate-500">Aprovação:</span> <strong className="text-slate-800 ml-1">{plan.dataAprovacao || '—'}</strong></div>
          </div>
        </div>

      </div>
    </div>
  );
}
