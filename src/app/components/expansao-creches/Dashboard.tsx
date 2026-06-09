import { useState } from 'react';
import { Building2, TrendingUp, Users, AlertCircle, DollarSign, Baby, Settings, BarChart3, MapPin, ArrowRight, Target, School, Map } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockProjecaoVagas, mockPlans, mockDemandaEtapa, mockCadUnicoUnidade, mockUnidades } from './mockData';
import { ExpansionPlan } from './types';

const demandaEtapa = mockDemandaEtapa.map(d => {
  const filaReal = mockUnidades.reduce((acc, u) => {
    const v = u.vagasPorEtapa.find(ve => ve.etapa === d.etapa);
    return acc + (v ? v.listaEspera : 0);
  }, 0);

  const deficitTotal = d.criancasResidentes - d.vagasAtuais;
  const cadUnico = deficitTotal > filaReal ? deficitTotal - filaReal : 0;

  return {
    name: d.etapa,
    cadUnico: cadUnico,
    fila: filaReal,
    vagas: d.vagasAtuais
  };
});

const topUnidadesCriticas = mockCadUnicoUnidade.map(d => {
  const uni = mockUnidades.find(u => u.id === d.unidadeId);
  const maxRaio = d.raios[d.raios.length - 1]; // Maior raio disponível
  const demandaTotal = maxRaio.maternal + maxRaio.jardimI + maxRaio.jardimII;
  const vagasAtuais = uni?.vagasPorEtapa.reduce((sum, v) => sum + v.vagas, 0) || 0;
  const filaEspera = uni?.vagasPorEtapa.reduce((sum, v) => sum + v.listaEspera, 0) || 0;
  const deficit = demandaTotal - vagasAtuais;
  return {
    id: d.unidadeId,
    nome: uni?.nome || 'Unidade',
    deficit: deficit > 0 ? deficit : 0,
    demanda: demandaTotal,
    vagas: vagasAtuais,
    filaEspera
  };
}).sort((a, b) => b.deficit - a.deficit).slice(0, 5);

export default function Dashboard({ onNavigate }: { onNavigate: (view: string, id?: any) => void }) {
  const [plans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

  const planosAtivos = plans.filter(p => p.status === 'Em execução' || p.status === 'Planejamento');

  // Total de fontes considerando apenas o saldo acumulado (Caixa Único)
  const investimentoTotal = planosAtivos.reduce((total, p) => total + p.fontesFinanciamento.reduce((a, f) => a + f.valorPrevisto, 0), 0);
  const totalObras = planosAtivos.reduce((total, p) => total + p.obras.length, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Expansão de Creches</h1>
              <p className="text-slate-500 font-medium">Município de Cacoal/RO · PPA 2026–2029</p>
            </div>
          </div>
        </div>

        {/* KPIs reais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="bg-red-50 p-2 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fora da Creche</span>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">3.888</p>
            <p className="text-xs text-slate-500 mt-1 font-medium relative z-10">crianças do cadÚnico de 0–3 anos sem vaga</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16 text-amber-500" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="bg-amber-50 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-600" /></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa Atual</span>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">15,33%</p>
            <p className="text-xs text-slate-500 mt-1 font-medium relative z-10">de atendimento em creche</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Building2 className="w-16 h-16 text-blue-500" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="bg-blue-50 p-2 rounded-lg"><Building2 className="w-5 h-5 text-blue-600" /></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Novas Vagas</span>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">672</p>
            <p className="text-xs text-slate-500 mt-1 font-medium relative z-10">previstas até 2029</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="w-16 h-16 text-green-500" />
            </div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="bg-green-50 p-2 rounded-lg"><Target className="w-5 h-5 text-green-600" /></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Meta 2029</span>
            </div>
            <p className="text-4xl font-black text-slate-800 relative z-10">29,97%</p>
            <p className="text-xs text-slate-500 mt-1 font-medium relative z-10">taxa de atendimento</p>
          </div>
        </div>

        {/* Linha 1 de Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Projeção de Vagas (Geral)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
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
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis key="xaxis" dataKey="ano" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis-vagas" yAxisId="vagas" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis-taxa" yAxisId="taxa" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} unit="%" domain={[0, 35]} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Legend key="legend" iconType="circle" />
                <Area key="area-acumulado" yAxisId="vagas" type="monotone" dataKey="acumulado" name="Vagas acumuladas" stroke="#3b82f6" fill="url(#gradVagas)" strokeWidth={3} />
                <Area key="area-taxa" yAxisId="taxa" type="monotone" dataKey="taxaAtendimento" name="Taxa %" stroke="#10b981" fill="url(#gradTaxa)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" /> Demanda Potencial por Etapa
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={demandaEtapa} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis key="xaxis" dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis" stroke="#94a3b8" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip key="tooltip" cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Legend key="legend" iconType="circle" />
                <Bar key="bar-cadunico" dataKey="cadUnico" name="Demanda CadÚnico" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar key="bar-fila" dataKey="fila" name="Fila de Espera" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar key="bar-vagas" dataKey="vagas" name="Vagas Ofertadas" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Linha 2 de Dashboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" /> Top 5 Unidades Críticas (Maior Déficit)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-4 font-bold text-slate-600">Unidade Escolar</th>
                    <th className="text-center py-3 px-4 font-bold text-slate-600">Demanda (Total Raio)</th>
                    <th className="text-center py-3 px-4 font-bold text-slate-600">Vagas Atuais</th>
                    <th className="text-center py-3 px-4 font-bold text-slate-600">Fila de Espera</th>
                    <th className="text-right py-3 px-4 font-bold text-slate-600">Déficit Absoluto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {topUnidadesCriticas.map((u, i) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-red-100 text-red-600' : i === 1 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                            {i + 1}
                          </div>
                          <span className="font-semibold text-slate-800">{u.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{u.demanda}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{u.vagas}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{u.filaEspera}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {u.deficit}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card Resumo Financeiro */}
          <div className="bg-slate-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-10">
              <DollarSign className="w-32 h-32" />
            </div>
            <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2 relative z-10">
              <DollarSign className="w-5 h-5 text-emerald-400" /> Estimativa de Custo (Planos Ativos)
            </h3>
            <div className="space-y-6 relative z-10">
              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Recursos Necessários</div>
                <div className="text-3xl font-black text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(investimentoTotal)}
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Recursos disponíveis no exercício</div>
                <div className="text-2xl font-bold text-slate-200">
                  R$ 5.350.000
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Planos em Andamento</span>
                  <span className="font-bold">{planosAtivos.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-slate-700 pt-3">
                  <span className="text-slate-300">Obras Projetadas</span>
                  <span className="font-bold">{totalObras}</span>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <button onClick={() => onNavigate('planos')} className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <Settings className="w-4 h-4" /> Gerenciar Planos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Planos resumo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" /> Meus Planos de Expansão
            </h3>
            <button onClick={() => onNavigate('planos')} className="text-sm text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="group border border-slate-100 p-5 rounded-xl hover:border-blue-200 hover:shadow-md transition-all cursor-pointer bg-slate-50 hover:bg-white"
                onClick={() => onNavigate('edit-plano', plan.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{plan.nome}</h4>
                  <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-bold ${plan.status === 'Em execução' ? 'bg-emerald-100 text-emerald-700' :
                    plan.status === 'Planejamento' ? 'bg-blue-100 text-blue-700' :
                      plan.status === 'Paralisado' ? 'bg-red-100 text-red-700' :
                        'bg-slate-200 text-slate-700'
                    }`}>
                    {plan.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5"><School className="w-4 h-4" /> {plan.obras.length} Obras</span>
                  <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {plan.acoesUnidades.length} Ações</span>
                  <span className="flex items-center gap-1.5"><Target className="w-4 h-4" /> {plan.periodoInicio}-{plan.periodoFim}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
