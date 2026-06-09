import { useState } from 'react';
import { Building2, TrendingUp, Users, AlertCircle, DollarSign, Baby, Settings, BarChart3, MapPin, ArrowRight, Target, School } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockProjecaoVagas, mockDemandaBairro, mockPlans } from './mockData';
import { ExpansionPlan } from './types';

const demandaTop = mockDemandaBairro
  .sort((a, b) => b.naoFrequentam - a.naoFrequentam)
  .slice(0, 6)
  .map(d => ({ bairro: d.bairro.length > 14 ? d.bairro.slice(0, 13) + '…' : d.bairro, fora: d.naoFrequentam, dentro: d.frequentam }));

export default function Dashboard({ onNavigate }: { onNavigate: (view: string, id?: any) => void }) {
  const [plans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

  const plano = plans[0] || mockPlans[0];
  const investimentoTotal = plano.fontesFinanciamento.reduce((a, f) => a + f.valorPrevisto, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Expansão de Creches</h1>
              <p className="text-slate-500">Município de Cacoal/RO · PPA 2026–2029</p>
            </div>
          </div>
        </div>

        {/* KPIs reais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-red-400">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-2 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fora da Creche</span>
            </div>
            <p className="text-3xl font-bold text-red-600">3.888</p>
            <p className="text-xs text-slate-500 mt-1">crianças 0–5 anos sem vaga</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-amber-400">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-100 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Taxa Atual</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">15,33%</p>
            <p className="text-xs text-slate-500 mt-1">de atendimento em creche</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg"><Building2 className="w-5 h-5 text-blue-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Novas Vagas</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">672</p>
            <p className="text-xs text-slate-500 mt-1">previstas até 2029</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg"><Target className="w-5 h-5 text-green-600" /></div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Meta 2029</span>
            </div>
            <p className="text-3xl font-bold text-green-600">29,97%</p>
            <p className="text-xs text-slate-500 mt-1">taxa de atendimento</p>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-slate-800 mb-4">Projeção de Vagas 2025–2029</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={mockProjecaoVagas}>
                <defs>
                  <linearGradient id="gradVagas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTaxa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis key="xaxis" dataKey="ano" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis key="yaxis-vagas" yAxisId="vagas" stroke="#3b82f6" tick={{ fontSize: 11 }} />
                <YAxis key="yaxis-taxa" yAxisId="taxa" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} unit="%" domain={[0, 35]} />
                <Tooltip key="tooltip" contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend key="legend" />
                <Area key="area-acumulado" yAxisId="vagas" type="monotone" dataKey="acumulado" name="Vagas acumuladas" stroke="#3b82f6" fill="url(#gradVagas)" strokeWidth={2} />
                <Area key="area-taxa" yAxisId="taxa" type="monotone" dataKey="taxaAtendimento" name="Taxa %" stroke="#10b981" fill="url(#gradTaxa)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-slate-800 mb-4">Demanda por Bairro (top 6)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={demandaTop} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis key="xaxis" type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis key="yaxis" type="category" dataKey="bairro" stroke="#94a3b8" tick={{ fontSize: 11 }} width={90} />
                <Tooltip key="tooltip" contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend key="legend" />
                <Bar key="bar-fora" dataKey="fora" name="Fora da creche" fill="#f87171" radius={[0, 4, 4, 0]} stackId="a" />
                <Bar key="bar-dentro" dataKey="dentro" name="Frequentam" fill="#34d399" radius={[0, 4, 4, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Módulos de navegação — numerados conforme menu principal */}
        <div className="mb-3">
          <h2 className="font-bold text-slate-700 text-lg">Menu Principal</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { num: '2', label: 'Configurações de Custo', sub: 'Obra, mobiliário, pessoal e aquisições', view: 'configuracoes-custo', icon: <Settings className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-100', hover: 'hover:border-orange-200', dot: 'text-orange-500' },
            { num: '3', label: 'Servidores Municipais', sub: 'Equipe técnica e responsáveis', view: 'servidores', icon: <Users className="w-6 h-6 text-teal-600" />, bg: 'bg-teal-100', hover: 'hover:border-teal-200', dot: 'text-teal-500' },
            { num: '4', label: 'Unidades Escolares', sub: '13 creches e pré-escolas municipais', view: 'unidades-escolares', icon: <School className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-100', hover: 'hover:border-purple-200', dot: 'text-purple-500' },
            { num: '5', label: 'Planos de Expansão', sub: `${plans.length} plano(s) ativo(s) · PPA 2026–2029`, view: 'planos', icon: <BarChart3 className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-100', hover: 'hover:border-blue-200', dot: 'text-blue-500' },
            { num: '6', label: 'Quadro Kanban', sub: 'Atividades e tarefas por escola', view: 'all-schools', icon: <TrendingUp className="w-6 h-6 text-green-600" />, bg: 'bg-green-100', hover: 'hover:border-green-200', dot: 'text-green-500' },
            { num: '7', label: 'Relatórios', sub: 'Diagnósticos e exportações', view: 'reports', icon: <MapPin className="w-6 h-6 text-slate-600" />, bg: 'bg-slate-100', hover: 'hover:border-slate-300', dot: 'text-slate-500' },
          ].map(item => (
            <button
              key={item.num}
              onClick={() => onNavigate(item.view)}
              className={`group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left border border-transparent ${item.hover}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <span className={`text-2xl font-black ${item.dot} opacity-30`}>{item.num}</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{item.label}</h3>
              <p className="text-sm text-slate-500">{item.sub}</p>
            </button>
          ))}
        </div>

        {/* Card de investimento total */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100 text-sm font-semibold">Investimento Previsto PPA 2026–2029</span>
              </div>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(investimentoTotal)}
              </p>
              <p className="text-blue-200 text-xs mt-1">Proinfância + Municipal + Emendas + Convênios</p>
            </div>
            <div className="text-right">
              <div className="text-blue-200 text-sm mb-1">Meta de atendimento</div>
              <div className="text-4xl font-black">29,97%</div>
              <div className="text-blue-200 text-xs">taxa 2029</div>
            </div>
          </div>
        </div>

        {/* Planos resumo */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Planos Ativos</h3>
            <button onClick={() => onNavigate('planos')} className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => onNavigate('edit-plano', plan.id)}
              >
                <div>
                  <p className="font-semibold text-slate-800">{plan.nome}</p>
                  <p className="text-sm text-slate-500">{plan.periodoInicio}–{plan.periodoFim} · {plan.obras.length} obras · {plan.acoesUnidades.length} ações em unidades</p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                  plan.status === 'Em execução' ? 'bg-green-100 text-green-700' :
                  plan.status === 'Planejamento' ? 'bg-blue-100 text-blue-700' :
                  plan.status === 'Paralisado' ? 'bg-red-100 text-red-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {plan.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
