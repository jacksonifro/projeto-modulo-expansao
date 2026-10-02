import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Calculator,
  ChevronLeft,
  Building2,
  TrendingUp,
  Users,
  DollarSign,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ModeloCreche, ModeloAmbiente, CargoReferencia } from './types';
import {
  mockModelosCreche,
  mockModelosAmbiente,
  mockCargosReferencia,
  calcularCustoCreche,
} from './mockDataCusto';

interface CusteioSimulacaoProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v);

export default function CusteioSimulacao({ onBack, onNavigate }: CusteioSimulacaoProps) {
  const [modelos] = useState<ModeloCreche[]>(() => {
    const cached = localStorage.getItem('exp_creches_modelos');
    if (!cached) return mockModelosCreche;
    try {
      const parsed: ModeloCreche[] = JSON.parse(cached);
      return parsed.map((m) => {
        if (!m.pessoal) {
          const match = mockModelosCreche.find((x) => x.id === m.id);
          return { ...m, pessoal: match?.pessoal || [] };
        }
        return m;
      });
    } catch {
      return mockModelosCreche;
    }
  });

  const [ambientes] = useState<ModeloAmbiente[]>(() => {
    try {
      const cached = localStorage.getItem('exp_creches_ambientes');
      if (!cached) return mockModelosAmbiente;
      const parsed: ModeloAmbiente[] = JSON.parse(cached);
      const hasLegacy = parsed.some((a) =>
        a.itens.some((i) => i.bibliotecaId?.startsWith('b0') || i.bibliotecaId?.startsWith('b1'))
      );
      const hasNewItems = parsed.some((a) =>
        a.itens.some((i) => i.bibliotecaId?.startsWith('it-'))
      );
      if (hasLegacy || !hasNewItems) {
        localStorage.setItem('exp_creches_ambientes', JSON.stringify(mockModelosAmbiente));
        return mockModelosAmbiente;
      }
      return parsed;
    } catch {
      return mockModelosAmbiente;
    }
  });

  const [cargosRef] = useState<CargoReferencia[]>(() => {
    const cached = localStorage.getItem('exp_creches_cargos_ref');
    try {
      return cached ? JSON.parse(cached) : mockCargosReferencia;
    } catch {
      return mockCargosReferencia;
    }
  });

  const [quantidades, setQuantidades] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    modelos.forEach((m, idx) => {
      init[m.id] = idx === 0 ? 1 : 0;
    });
    return init;
  });

  const [inflacao, setInflacao] = useState(4.5);

  const handleIncrement = (id: string) => {
    setQuantidades((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: string) => {
    setQuantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1),
    }));
  };

  const handleResetCenario = () => {
    const reset: Record<string, number> = {};
    modelos.forEach((m, idx) => {
      reset[m.id] = idx === 0 ? 1 : 0;
    });
    setQuantidades(reset);
    setInflacao(4.5);
  };

  const rows = modelos.map((m) => {
    const c = calcularCustoCreche(m, ambientes, cargosRef);
    return {
      modelo: m,
      custos: c,
    };
  });

  // Totais do cenário consolidado
  let cenarioInvestimento = 0;
  let cenarioCusteio = 0;
  let cenarioPessoal = 0;
  let cenarioServicos = 0;
  let cenarioAquisicoes = 0;
  let cenarioVagas = 0;
  let cenarioSalas = 0;
  let cenarioUnidades = 0;

  rows.forEach(({ modelo, custos }) => {
    const qty = quantidades[modelo.id] || 0;
    cenarioInvestimento += custos.investimento * qty;
    cenarioCusteio += custos.custeioAnual * qty;
    cenarioPessoal += (custos.detalheCusteio?.pessoal || 0) * qty;
    cenarioServicos += (custos.detalheCusteio?.servicos || 0) * qty;
    cenarioAquisicoes += (custos.detalheCusteio?.aquisicoes || 0) * qty;
    cenarioVagas += (modelo.capacidadeAlunos || 120) * qty;

    const salasPorCreche = modelo.ambientes
      .filter((ma) => {
        const amb = ambientes.find((a) => a.id === ma.modeloAmbienteId);
        return amb && (amb.categoria === 'sala-atividades' || amb.categoria === 'bercario');
      })
      .reduce((sum, ma) => sum + ma.quantidade, 0);

    cenarioSalas += salasPorCreche * qty;
    cenarioUnidades += qty;
  });

  const custoAlunoAno = cenarioVagas > 0 ? cenarioCusteio / cenarioVagas : 0;
  const custoAlunoMes = custoAlunoAno / 12;

  // Gerar dados para a projeção de 5 anos (PPA)
  const projData = [];
  let acumulado = 0;
  for (let i = 1; i <= 5; i++) {
    const custoAnualAjustado = cenarioCusteio * Math.pow(1 + inflacao / 100, i - 1);
    acumulado += custoAnualAjustado;
    projData.push({
      ano: `Ano ${i}`,
      'Custo Anual': Math.round(custoAnualAjustado),
      Acumulado: Math.round(acumulado),
    });
  }

  const pctPessoal = cenarioCusteio > 0 ? (cenarioPessoal / cenarioCusteio) * 100 : 0;
  const pctServicos = cenarioCusteio > 0 ? (cenarioServicos / cenarioCusteio) * 100 : 0;
  const pctAquisicoes = cenarioCusteio > 0 ? (cenarioAquisicoes / cenarioCusteio) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-3 font-semibold"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                  Custeio e Simulação de Rede
                </h1>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-orange-200">
                  Planejamento Plurianual
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-1 font-medium">
                Simule o impacto financeiro de investimento e despesa corrente a partir dos modelos de creche configurados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetCenario}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-semibold hover:bg-white transition-colors shadow-sm bg-white/70"
          >
            <RotateCcw className="w-4 h-4" /> Resetar Cenário
          </button>
          {onNavigate && (
            <button
              onClick={() => onNavigate('configuracoes-custo')}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors shadow-sm"
            >
              <Building2 className="w-4 h-4" /> Ver Modelos de Creche
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Consolidado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600">
              Investimento Total
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-800 mt-2">
            {BRL(cenarioInvestimento)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 font-semibold">
            <span>{cenarioUnidades} unidades no cenário</span>
            <span>·</span>
            <span>{cenarioSalas} salas novas</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600">
              Custeio Anual Consolidado
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-orange-800 mt-2">
            {BRL(cenarioCusteio)}
          </p>
          <p className="text-xs text-orange-600 font-semibold mt-2">
            Folha + Serviços continuados + Insumos
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600">
              Novas Vagas de EI
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-800 mt-2">
            +{cenarioVagas} crianças
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">
            Atendimento em creche e pré-escola
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600">
              Custo por Aluno / Mês
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-800 mt-2">
            {BRL(custoAlunoMes)}
          </p>
          <p className="text-xs text-purple-600 font-semibold mt-2">
            Média ponderada anual: {BRL(custoAlunoAno)}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* Seção 1: Seleção de Unidades por Modelo */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-500" />
              1. Composição do Cenário de Rede (Modelos de Creche)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina a quantidade de unidades de cada modelo planejado para expansão municipal.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Total de creches: <strong className="text-slate-800">{cenarioUnidades} unidades</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modelos.map((modelo) => {
            const qty = quantidades[modelo.id] || 0;
            const singleC = rows.find((r) => r.modelo.id === modelo.id)?.custos;
            const tipoLabel =
              modelo.tipoBase === 'tipo1'
                ? 'FNDE Tipo 1 (Proinfância B)'
                : modelo.tipoBase === 'tipo2'
                ? 'FNDE Tipo 2 (Proinfância C)'
                : 'Projeto Próprio';

            return (
              <div
                key={modelo.id}
                className={`border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                  qty > 0
                    ? 'border-orange-300 bg-orange-50/20 shadow-md ring-1 ring-orange-200'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        {tipoLabel}
                      </span>
                      <h3 className="font-bold text-slate-800 text-base mt-1.5 leading-snug">
                        {modelo.nome}
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {modelo.descricao || 'Modelo padrão de atendimento para educação infantil.'}
                  </p>

                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Capacidade:</span>
                      <strong className="text-slate-800">{modelo.capacidadeAlunos || 120} alunos</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Ambientes:</span>
                      <strong className="text-slate-800">{modelo.ambientes.length} espaços</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Investimento Unitário:</span>
                      <strong className="text-blue-700">{BRL(singleC?.investimento || 0)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Custeio Unitário/Ano:</span>
                      <strong className="text-orange-600">{BRL(singleC?.custeioAnual || 0)}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-4">
                  <span className="text-xs text-slate-600 font-semibold">Qtd. a Implantar</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDecrement(modelo.id)}
                      disabled={qty === 0}
                      className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-extrabold text-slate-900 text-base">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleIncrement(modelo.id)}
                      className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600 transition-colors shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção 2: Simulador de Reajustes e Projeção Plurianual (PPA 5 Anos) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Parametrização & Distribuição */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Parâmetros de Custeio
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simule a taxa inflacionária para cálculo da projeção plurianual (PPA).
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>Inflação Operacional Anual</span>
              <span className="text-orange-600 font-extrabold text-base">{inflacao.toFixed(1)}% a.a.</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={inflacao}
              onChange={(e) => setInflacao(Number(e.target.value))}
              className="w-full accent-orange-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              Impacta os custos anuais de pessoal docente/técnico, alimentação escolar, insumos e concessionárias.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 tracking-wider mb-3">
              Composição do Custeio Anual da Rede
            </h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                    Folha de Pagamento
                  </span>
                  <span className="font-bold text-indigo-700">{pctPessoal.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${pctPessoal}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1 text-right">
                  {BRL(cenarioPessoal)} / ano
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Serviços Continuados
                  </span>
                  <span className="font-bold text-blue-700">{pctServicos.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${pctServicos}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1 text-right">
                  {BRL(cenarioServicos)} / ano
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                    Aquisições e Consumo
                  </span>
                  <span className="font-bold text-teal-700">{pctAquisicoes.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-teal-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${pctAquisicoes}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1 text-right">
                  {BRL(cenarioAquisicoes)} / ano
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Projeção Plurianual (5 anos) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                Projeção Plurianual de Custeio (PPA - 5 Anos)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estimativa de despesa anual e custo acumulado com reajuste de {inflacao.toFixed(1)}% ao ano.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-semibold">Total em 5 Anos</span>
              <p className="text-lg font-extrabold text-orange-600">
                {BRL(projData[projData.length - 1]?.Acumulado || 0)}
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projData} margin={{ top: 10, right: 15, left: 15, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCusteioSim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${v / 1e3}k`)}
                />
                <Tooltip
                  formatter={(value: any) => [BRL(value), '']}
                  labelStyle={{ fontSize: 12, fontWeight: 'bold', color: '#1e293b' }}
                  contentStyle={{ borderRadius: 12, fontSize: 12, borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="Acumulado"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCusteioSim)"
                  name="Custeio Acumulado"
                />
                <Area
                  type="monotone"
                  dataKey="Custo Anual"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="none"
                  name="Despesa no Ano"
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
