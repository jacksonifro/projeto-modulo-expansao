import { useState } from 'react';
import {
  BarChart3, MapPin, Users, BookOpen, CheckCircle2,
  TrendingUp, AlertCircle, Building2, Search, Filter, Baby,
  Sliders, ChevronLeft, ArrowUpRight
} from 'lucide-react';
import {
  mockDemandaEtapa, mockDemandaBairro, mockUnidades,
  mockCadUnicoUnidade, mockPlans, mockProjecaoVagas
} from './mockData';
import { EtapaEI, ExpansionPlan } from './types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';

interface DiagnosticoMunicipioProps {
  onNavigate?: (view: string, id?: string) => void;
  onBack?: () => void;
}

type TabDiagnostico = 'visao-geral' | 'demanda-etapa' | 'demanda-bairro' | 'vagas-unidade' | 'cadunico-raio';

const BRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const PCT = (v: number) => `${v.toFixed(1)}%`;

export default function DiagnosticoMunicipio({ onNavigate, onBack }: DiagnosticoMunicipioProps) {
  const [activeTab, setActiveTab] = useState<TabDiagnostico>('visao-geral');
  const [raioSelecionado, setRaioSelecionado] = useState<number>(1000);
  const [termoBuscaUnidade, setTermoBuscaUnidade] = useState('');
  const [matriculasPorUnidade, setMatriculasPorUnidade] = useState<Record<string, number>>({});

  // Planos salvos ou padrão
  const [plans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

  const planoAtivo = plans.find(p => p.status === 'Em execução') || plans[0];

  // Cálculos macro de demanda
  const demandaGeral = mockDemandaEtapa.reduce((sum, d) => sum + d.criancasResidentes, 0);
  const vagasAtuaisGeral = mockDemandaEtapa.reduce((sum, d) => sum + d.vagasAtuais, 0);
  const vagasCriadasPlano = mockDemandaEtapa.reduce((sum, d) => sum + d.novasVagasPlanejadas, 0);

  const taxaAtual = demandaGeral > 0 ? (vagasAtuaisGeral / demandaGeral) * 100 : 0;
  const taxaProjetada = demandaGeral > 0 ? ((vagasAtuaisGeral + vagasCriadasPlano) / demandaGeral) * 100 : 0;
  const deficitResidual = demandaGeral - (vagasAtuaisGeral + vagasCriadasPlano);

  const totalCadUnicoGeral = mockDemandaBairro.reduce((s, d) => s + d.totalCadUnico, 0);
  const totalFrequentamGeral = mockDemandaBairro.reduce((s, d) => s + d.frequentam, 0);
  const totalNaoFrequentamGeral = mockDemandaBairro.reduce((s, d) => s + d.naoFrequentam, 0);

  const unidadesFiltradas = mockUnidades
    .filter(u => u.totalVagas > 0)
    .filter(u => u.nome.toLowerCase().includes(termoBuscaUnidade.toLowerCase()) || u.bairro.toLowerCase().includes(termoBuscaUnidade.toLowerCase()));

  const tabsConfig = [
    { id: 'visao-geral' as TabDiagnostico, label: 'Raio-X Municipal', icon: <TrendingUp className="w-4 h-4" />, desc: 'Indicadores macro e evolução' },
    { id: 'demanda-etapa' as TabDiagnostico, label: 'Demanda por Etapa', icon: <BarChart3 className="w-4 h-4" />, desc: 'Maternal, Jardim I e II' },
    { id: 'demanda-bairro' as TabDiagnostico, label: 'Demanda por Bairro', icon: <MapPin className="w-4 h-4" />, desc: 'Distribuição territorial' },
    { id: 'vagas-unidade' as TabDiagnostico, label: 'Vagas por Unidade', icon: <Building2 className="w-4 h-4" />, desc: 'Ocupação e lista de espera' },
    { id: 'cadunico-raio' as TabDiagnostico, label: 'CadÚnico por Raio', icon: <Users className="w-4 h-4" />, desc: 'Vulnerabilidade em torno das escolas' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                <ActivityIcon className="w-3.5 h-3.5" />
                Diagnóstico Oficial do Município
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Diagnóstico do Município</h1>
              <p className="text-slate-600 text-base mt-1">
                Levantamento censitário de demanda reprimida, fila do CadÚnico e capacidade instalada da rede municipal de educação infantil
              </p>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('planos')}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md transition-all self-start md:self-auto text-sm"
              >
                <span>Ver Planos de Expansão</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Macro KPIs Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Taxa Atual (Base)</span>
              <span className="p-2 rounded-xl bg-red-50 text-red-600 font-bold text-sm">📉 Atual</span>
            </div>
            <div className="text-3xl font-black text-red-600">{taxaAtual.toFixed(2)}%</div>
            <p className="text-xs text-slate-500 mt-1">Apenas {vagasAtuaisGeral} vagas para {demandaGeral.toLocaleString('pt-BR')} crianças</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">CadÚnico (0–3 anos)</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600 font-bold text-sm">👶 CadÚnico</span>
            </div>
            <div className="text-3xl font-black text-slate-800">{totalCadUnicoGeral.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-amber-700 mt-1 font-semibold">{totalNaoFrequentamGeral.toLocaleString('pt-BR')} fora da creche ({PCT((totalNaoFrequentamGeral / totalCadUnicoGeral) * 100)})</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Meta do Plano (PPA)</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">🏫 +{vagasCriadasPlano} vagas</span>
            </div>
            <div className="text-3xl font-black text-blue-600">{taxaProjetada.toFixed(2)}%</div>
            <p className="text-xs text-slate-500 mt-1">Elevação de +{(taxaProjetada - taxaAtual).toFixed(1)} pontos percentuais</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Déficit Residual Previsto</span>
              <span className="p-2 rounded-xl bg-green-50 text-green-600 font-bold text-sm">🎯 Meta</span>
            </div>
            <div className="text-3xl font-black text-emerald-600">{deficitResidual > 0 ? deficitResidual.toLocaleString('pt-BR') : 0}</div>
            <p className="text-xs text-slate-500 mt-1">Déficit restante após cumprimento de 100% das obras</p>
          </div>
        </div>

        {/* Navegação por Abas do Diagnóstico */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex flex-wrap gap-1.5">
          {tabsConfig.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo da Aba */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-7">
          
          {/* ═══ 1. RAIO-X MUNICIPAL ═══ */}
          {activeTab === 'visao-geral' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Raio-X da Cobertura de Educação Infantil</h2>
                <p className="text-slate-500 text-sm mt-0.5">Visão consolidada da evolução da taxa de atendimento e impacto das metas planejadas</p>
              </div>

              {/* Gráfico de Evolução da Taxa e Vagas */}
              <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800 text-base">Evolução Projetada das Vagas e Taxa de Cobertura (2025–2029)</h3>
                  </div>
                  <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">PPA Cacoal/RO</span>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={mockProjecaoVagas}>
                    <defs>
                      <linearGradient id="vagasGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="ano" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="vagas" stroke="#2563eb" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="taxa" orientation="right" stroke="#16a34a" tick={{ fontSize: 11 }} unit="%" domain={[0, 35]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} />
                    <Legend />
                    <Area key="acumulado" yAxisId="vagas" type="monotone" dataKey="acumulado" name="Vagas Acumuladas" stroke="#2563eb" fill="url(#vagasGrad)" strokeWidth={2.5} />
                    <Area key="taxa" yAxisId="taxa" type="monotone" dataKey="taxaAtendimento" name="Taxa de Atendimento (%)" stroke="#16a34a" fill="none" strokeWidth={2.5} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Síntese comparativa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-1">Capacidade Atual (2026)</h4>
                  <div className="text-2xl font-black text-blue-700">{vagasAtuaisGeral} vagas</div>
                  <p className="text-xs text-blue-600 mt-2 leading-relaxed">
                    Atendimento restrito a unidades polo, com sobrecarga em salas de Jardim II e carência severa de berçários no Maternal.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-1">Demanda CadÚnico Reprimida</h4>
                  <div className="text-2xl font-black text-amber-700">{totalNaoFrequentamGeral} crianças</div>
                  <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                    População de maior vulnerabilidade social sem atendimento regular em creches na primeira infância.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <h4 className="font-bold text-emerald-900 mb-1">Expansão Planejada</h4>
                  <div className="text-2xl font-black text-emerald-700">+{vagasCriadasPlano} novas vagas</div>
                  <p className="text-xs text-emerald-700 mt-2 leading-relaxed">
                    Com a entrega de creches Tipo 1, Tipo 2 e adaptação de salas ociosas da rede municipal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══ 2. DEMANDA POR ETAPA ═══ */}
          {activeTab === 'demanda-etapa' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Demanda e Déficit por Etapa da Educação Infantil</h2>
                <p className="text-slate-500 text-sm mt-0.5">Distribuição do déficit e taxas de atendimento por faixa etária</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockDemandaEtapa.map(d => {
                  const pct = Math.round((d.vagasAtuais / d.criancasResidentes) * 100);
                  const isCritico = pct < 5;
                  return (
                    <div
                      key={d.etapa}
                      className={`rounded-2xl p-5 border shadow-sm ${
                        isCritico ? 'border-red-300 bg-red-50/60' : pct < 20 ? 'border-amber-300 bg-amber-50/60' : 'border-emerald-300 bg-emerald-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-lg">{d.etapa}</span>
                        {isCritico && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-200 text-red-800">Crítico</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mb-3">{d.faixaEtaria}</div>
                      
                      <div className={`text-4xl font-black mb-1 ${isCritico ? 'text-red-600' : pct < 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {pct}%
                      </div>
                      <div className="text-xs text-slate-600 mb-3 font-medium">taxa de atendimento atual</div>

                      <div className="w-full bg-white/80 rounded-full h-2 mb-4 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${isCritico ? 'bg-red-500' : pct < 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                        <div><span className="text-slate-500">Crianças CadÚnico:</span> <br/><strong>{d.criancasResidentes.toLocaleString('pt-BR')}</strong></div>
                        <div><span className="text-slate-500">Vagas Atuais:</span> <br/><strong>{d.vagasAtuais}</strong></div>
                        <div><span className="text-slate-500">Déficit Atual:</span> <br/><strong className="text-red-600">{d.deficitAtual}</strong></div>
                        <div><span className="text-slate-500">Novas Vagas:</span> <br/><strong className="text-blue-600">+{d.novasVagasPlanejadas}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Gráfico comparativo */}
              <div className="bg-slate-50/60 rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-700 text-base mb-4">Comparativo: Vagas Atuais vs. Novas Vagas Planejadas vs. Déficit</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={mockDemandaEtapa.map(d => ({ etapa: d.etapa, 'Vagas Atuais': d.vagasAtuais, 'Novas Vagas': d.novasVagasPlanejadas, Déficit: d.deficitFinal }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="etapa" />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: '10px' }} />
                    <Legend />
                    <Bar dataKey="Vagas Atuais" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Novas Vagas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Déficit" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela Detalhada */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="text-left px-5 py-3.5 font-bold">Etapa</th>
                      <th className="text-left px-4 py-3.5 font-semibold">Faixa Etária</th>
                      <th className="text-right px-4 py-3.5 font-semibold">Crianças CadÚnico</th>
                      <th className="text-right px-4 py-3.5 font-semibold">Vagas Atuais</th>
                      <th className="text-right px-4 py-3.5 font-semibold">Taxa Atual</th>
                      <th className="text-right px-4 py-3.5 font-semibold">Déficit Atual</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-blue-700">+ Novas Vagas</th>
                      <th className="text-right px-5 py-3.5 font-bold">Déficit Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockDemandaEtapa.map(d => (
                      <tr key={d.etapa} className="hover:bg-slate-50/80">
                        <td className="px-5 py-3.5 font-bold text-slate-800">{d.etapa}</td>
                        <td className="px-4 py-3.5 text-slate-500">{d.faixaEtaria}</td>
                        <td className="px-4 py-3.5 text-right font-medium">{d.criancasResidentes.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3.5 text-right font-medium">{d.vagasAtuais}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${d.taxaAtual < 5 ? 'bg-red-100 text-red-700' : d.taxaAtual < 20 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {PCT(d.taxaAtual)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-red-600">{d.deficitAtual.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3.5 text-right font-bold text-blue-600">+{d.novasVagasPlanejadas}</td>
                        <td className="px-5 py-3.5 text-right font-black text-slate-800">{d.deficitFinal.toLocaleString('pt-BR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ 3. DEMANDA POR BAIRRO ═══ */}
          {activeTab === 'demanda-bairro' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Demanda e Carência por Bairro</h2>
                <p className="text-slate-500 text-sm mt-0.5">Identificação das regiões com maior número de crianças de 0 a 3 anos fora da creche</p>
              </div>

              {/* Gráfico Horizontal de Bairros */}
              <div className="bg-slate-50/60 rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-700 text-base mb-4">Ranking de Bairros por Carência (Crianças Não Atendidas)</h3>
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart
                    data={[...mockDemandaBairro].filter(d => d.totalCadUnico >= 10).sort((a, b) => b.naoFrequentam - a.naoFrequentam)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="bairro" width={160} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '10px' }} />
                    <Legend />
                    <Bar dataKey="naoFrequentam" name="Não frequentam creche" fill="#ef4444" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="frequentam" name="Frequentam creche" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabela de Bairros */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 sticky top-0 shadow-sm">
                    <tr>
                      <th className="text-left px-5 py-3.5 font-bold">Bairro</th>
                      <th className="text-left px-4 py-3.5 font-semibold">Setor / Região</th>
                      <th className="text-right px-4 py-3.5 font-semibold">CadÚnico (0-3a)</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-emerald-700">Frequentam</th>
                      <th className="text-right px-4 py-3.5 font-semibold text-red-600">Não Frequentam</th>
                      <th className="text-right px-5 py-3.5 font-bold">% Fora da Creche</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...mockDemandaBairro]
                      .sort((a, b) => b.naoFrequentam - a.naoFrequentam)
                      .map(d => {
                        const pctFora = d.totalCadUnico > 0 ? (d.naoFrequentam / d.totalCadUnico) * 100 : 0;
                        return (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="px-5 py-3 font-bold text-slate-800">{d.bairro}</td>
                            <td className="px-4 py-3 text-slate-500">{d.setor}</td>
                            <td className="px-4 py-3 text-right font-semibold">{d.totalCadUnico}</td>
                            <td className="px-4 py-3 text-right font-semibold text-emerald-600">{d.frequentam}</td>
                            <td className="px-4 py-3 text-right font-black text-red-600">{d.naoFrequentam}</td>
                            <td className="px-5 py-3 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pctFora > 85 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                                {pctFora.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ 4. VAGAS POR UNIDADE ESCOLAR ═══ */}
          {activeTab === 'vagas-unidade' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Ocupação por Unidade Escolar</h2>
                  <p className="text-slate-500 text-sm mt-0.5">Capacidade instalada, matrículas registradas e lista de espera oficial</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar unidade ou bairro..."
                    value={termoBuscaUnidade}
                    onChange={e => setTermoBuscaUnidade(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th colSpan={2} className="text-center px-4 py-2 border-b border-r border-slate-200 font-bold text-slate-700">Identificação</th>
                      <th colSpan={5} className="text-center px-4 py-2 border-b border-r border-slate-200 font-bold text-slate-700 bg-blue-50/60">Vagas e Matrículas</th>
                      <th colSpan={3} className="text-center px-4 py-2 border-b border-slate-200 font-bold text-slate-700 bg-orange-50/60">Fila de Espera</th>
                    </tr>
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-slate-700 border-r border-slate-200">Unidade Escolar</th>
                      <th className="text-center px-3 py-3 font-semibold text-slate-700 border-r border-slate-200">Salas</th>
                      <th className="text-center px-3 py-3 font-semibold text-slate-700 bg-blue-50/30">Maternal</th>
                      <th className="text-center px-3 py-3 font-semibold text-slate-700 bg-blue-50/30">Jardim I</th>
                      <th className="text-center px-3 py-3 font-semibold text-slate-700 bg-blue-50/30">Jardim II</th>
                      <th className="text-right px-4 py-3 font-semibold text-slate-700 bg-blue-50/30">Capacidade</th>
                      <th className="text-center px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 bg-blue-50/30">Ocupação</th>
                      <th className="text-center px-3 py-3 font-semibold text-slate-700 bg-orange-50/30">Jardim I</th>
                      <th className="text-center px-3 py-3 font-semibold text-slate-700 bg-orange-50/30">Jardim II</th>
                      <th className="text-right px-5 py-3 font-bold text-slate-700 bg-orange-50/30">Total Fila</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unidadesFiltradas.map(u => {
                      const mats = matriculasPorUnidade[u.id] ?? u.totalMatriculas;
                      const ocupacao = u.totalVagas > 0 ? Math.round((mats / u.totalVagas) * 100) : 0;
                      const getVagas = (etapa: EtapaEI) => u.vagasPorEtapa.find(v => v.etapa === etapa)?.vagas ?? 0;
                      const getEspera = (etapa: EtapaEI) => u.vagasPorEtapa.find(v => v.etapa === etapa)?.listaEspera ?? 0;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80">
                          <td className="px-5 py-3.5 font-bold text-slate-800 border-r border-slate-100">
                            <div>{u.nome}</div>
                            <div className="text-xs text-slate-400 font-normal">{u.bairro} — {u.codigo}</div>
                          </td>
                          <td className="px-3 py-3.5 text-center font-medium border-r border-slate-100">{u.salas.length}</td>
                          <td className="px-3 py-3.5 text-center">{getVagas('Maternal') > 0 ? getVagas('Maternal') : '—'}</td>
                          <td className="px-3 py-3.5 text-center">{getVagas('Jardim I') > 0 ? getVagas('Jardim I') : '—'}</td>
                          <td className="px-3 py-3.5 text-center">{getVagas('Jardim II') > 0 ? getVagas('Jardim II') : '—'}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-slate-800">{u.totalVagas}</td>
                          <td className="px-4 py-3.5 text-center border-r border-slate-100">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${ocupacao > 150 ? 'bg-red-100 text-red-700' : ocupacao > 100 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {ocupacao}%
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-center text-orange-600 font-medium">{getEspera('Jardim I') > 0 ? getEspera('Jardim I') : '—'}</td>
                          <td className="px-3 py-3.5 text-center text-orange-600 font-medium">{getEspera('Jardim II') > 0 ? getEspera('Jardim II') : '—'}</td>
                          <td className="px-5 py-3.5 text-right font-black text-orange-700">{u.totalListaEspera > 0 ? u.totalListaEspera : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ 5. CADÚNICO POR RAIO DE PROXIMIDADE ═══ */}
          {activeTab === 'cadunico-raio' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">CadÚnico por Raio de Proximidade</h2>
                <p className="text-slate-500 text-sm mt-0.5">Quantitativo de crianças em situação de vulnerabilidade em torno de cada escola</p>
              </div>

              {/* Slider de raio */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-blue-600" />
                      Raio Geográfico de Abrangência
                    </label>
                    <span className="text-xs text-slate-500 font-medium">Ajuste a distância para calcular a demanda local</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="3000"
                    step="500"
                    value={raioSelecionado}
                    onChange={e => setRaioSelecionado(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-2 font-semibold">
                    <span>500m</span>
                    <span>1.000m (Padrão)</span>
                    <span>1.500m</span>
                    <span>2.000m</span>
                    <span>2.500m</span>
                    <span>3.000m</span>
                  </div>
                </div>

                <div className="bg-blue-600 text-white px-7 py-4 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-md">
                  <span className="text-xs font-semibold uppercase text-blue-200">Raio Analisado</span>
                  <span className="text-3xl font-black">{raioSelecionado}m</span>
                </div>
              </div>

              {/* Tabela de Demandas por Raio */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="text-left px-5 py-3.5 font-bold">Unidade Escolar</th>
                      <th className="text-left px-4 py-3.5 font-semibold">Etapa</th>
                      <th className="text-center px-4 py-3.5 font-bold text-blue-700 bg-blue-50/50">Crianças no Raio</th>
                      <th className="text-center px-4 py-3.5 font-semibold">Vagas Atuais</th>
                      <th className="text-center px-4 py-3.5 font-bold text-red-600">Déficit no Raio</th>
                      <th className="text-center px-5 py-3.5 font-bold">Taxa de Atendimento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockCadUnicoUnidade.map((d, unitIndex) => {
                      const uni = mockUnidades.find(u => u.id === d.unidadeId);
                      const distData = d.raios.find(r => r.raioMts >= raioSelecionado) || d.raios[d.raios.length - 1];
                      const etapas: EtapaEI[] = ['Maternal', 'Jardim I', 'Jardim II'];

                      return etapas.map((etapa, idx) => {
                        const demanda = etapa === 'Maternal' ? distData.maternal : (etapa === 'Jardim I' ? distData.jardimI : distData.jardimII);
                        const vagaAtualInfo = uni?.vagasPorEtapa.find(v => v.etapa === etapa);
                        const vagasAtuais = vagaAtualInfo ? vagaAtualInfo.vagas : 0;
                        const deficit = Math.max(0, demanda - vagasAtuais);
                        const taxaAtendimento = demanda > 0 ? Math.min(100, (vagasAtuais / demanda) * 100) : 100;

                        return (
                          <tr key={`${d.unidadeId}-${etapa}`} className={`hover:bg-slate-50 ${idx === 0 && unitIndex !== 0 ? 'border-t-2 border-slate-200' : ''}`}>
                            {idx === 0 && (
                              <td className="px-5 py-3.5 font-bold text-slate-800 border-r border-slate-100" rowSpan={3}>
                                <div>{uni?.nome || 'Unidade'}</div>
                                <div className="text-xs text-slate-400 font-normal">{uni?.bairro}</div>
                              </td>
                            )}
                            <td className="px-4 py-3 text-slate-600 font-medium bg-slate-50/30">{etapa}</td>
                            <td className="px-4 py-3 text-center font-bold text-blue-700 bg-blue-50/30">{demanda}</td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-700">{vagasAtuais}</td>
                            <td className="px-4 py-3 text-center font-black text-red-600">{deficit}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                taxaAtendimento >= 50 ? 'bg-emerald-100 text-emerald-700' : taxaAtendimento > 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {taxaAtendimento.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
