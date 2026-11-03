import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
  Sparkles,
  Wrench,
  Package,
  Users,
  Calendar,
  FileText,
  LayoutDashboard,
  Plus,
  Trash2,
  Building2,
  Sliders,
  Info,
  Layers,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import {
  ExpansionPlan,
  PlanoCusteio,
  StatusPlanoCusteio,
  CriterioProporcionalidade,
  IntervencaoCusteioVinculada,
  ItemCusteioServico,
  ItemCusteioAquisicao,
  ItemCusteioPessoal,
} from './types';
import {
  loadCatalogosCusteio,
  gerarEstimativaItensProporcionais,
  calcularProjecaoPlanoCusteio,
  calcularProporcaoPorCriterio,
  calcularBaselineAutomaticoPeriodo,
  formatProporcaoResumo,
  CRITERIO_LABELS,
  CRITERIO_DESCRIPTIONS,
  formatYMDisplay,
} from './utils/custeioCalculator';
import PlanoCusteioReportDocument from './PlanoCusteioReportDocument';
import {
  FieldTooltip,
  CusteioCurrencyInput,
  CusteioConfirmModal,
} from './components/FieldTooltip';

export type WorkspaceTabId =
  | 'visao-geral'
  | 'servicos'
  | 'aquisicoes'
  | 'pessoal'
  | 'cronograma'
  | 'relatorio';

interface PlanoCusteioWorkspaceProps {
  planoInicial: PlanoCusteio;
  planoExpansao?: ExpansionPlan;
  initialTab?: WorkspaceTabId;
  onSave: (planoAtualizado: PlanoCusteio) => void;
  onBack: () => void;
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v || 0);

const BRL0 = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v || 0);

type NavGroupKey = 'estrutura' | 'categorias' | 'analise';

const GROUP_META: Record<
  NavGroupKey,
  { short: string; label: string; bg: string; accent: string }
> = {
  estrutura: {
    short: 'A',
    label: 'Estrutura & Escopo',
    bg: 'bg-blue-600',
    accent: 'text-blue-700',
  },
  categorias: {
    short: 'B',
    label: 'Categorias (ANO)',
    bg: 'bg-emerald-600',
    accent: 'text-emerald-700',
  },
  analise: {
    short: 'C',
    label: 'Projeção & Emissão',
    bg: 'bg-purple-600',
    accent: 'text-purple-700',
  },
};

export default function PlanoCusteioWorkspace({
  planoInicial,
  planoExpansao,
  initialTab = 'visao-geral',
  onSave,
  onBack,
}: PlanoCusteioWorkspaceProps) {
  const catalogos = useMemo(() => loadCatalogosCusteio(), []);

  const [activeTab, setActiveTab] = useState<WorkspaceTabId>(initialTab);
  const [plano, setPlano] = useState<PlanoCusteio>(() => ({ ...planoInicial }));
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const [filtroIntervencao, setFiltroIntervencao] = useState<string>('todas');
  const [visaoCronograma, setVisaoCronograma] = useState<'anual' | 'mensal'>('anual');
  const [filtroTipoAquisicao, setFiltroTipoAquisicao] = useState<
    'todas' | 'pontual_implantacao' | 'recorrente_manutencao'
  >('todas');

  // Modais de confirmação no padrão visual do sistema
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState<boolean>(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState<boolean>(false);

  // Baseline automático dinâmico para o período e intervenções ativos
  const baselineAutomaticoAtual = useMemo(
    () =>
      calcularBaselineAutomaticoPeriodo(
        plano.dataInicio,
        plano.dataFim,
        plano.intervencoes,
        catalogos
      ),
    [plano.dataInicio, plano.dataFim, plano.intervencoes, catalogos]
  );

  // Projeção reativa em tempo real
  const projecao = useMemo(
    () =>
      calcularProjecaoPlanoCusteio(
        plano.dataInicio,
        plano.dataFim,
        plano.intervencoes,
        plano.servicos,
        plano.aquisicoes,
        plano.pessoal,
        plano.parametrosSimulacao,
        baselineAutomaticoAtual
      ),
    [
      plano.dataInicio,
      plano.dataFim,
      plano.intervencoes,
      plano.servicos,
      plano.aquisicoes,
      plano.pessoal,
      plano.parametrosSimulacao,
      baselineAutomaticoAtual,
    ]
  );

  const { resumoFinanceiro, cronogramaAnual, cronogramaMensal, resumoPorIntervencao } = projecao;
  const mapInterv = useMemo(
    () => new Map(plano.intervencoes.map(i => [i.id, i])),
    [plano.intervencoes]
  );

  const qtdProfPorInterv = useMemo(() => {
    const m = new Map<string, number>();
    projecao.pessoal.forEach(p => {
      m.set(p.intervencaoCusteioId, (m.get(p.intervencaoCusteioId) || 0) + (p.quantidade || 0));
    });
    return m;
  }, [projecao.pessoal]);

  const totalItensManuais = useMemo(() => {
    const s = plano.servicos.filter(i => i.origemCalculo !== 'automatico').length;
    const a = plano.aquisicoes.filter(i => i.origemCalculo !== 'automatico').length;
    const p = plano.pessoal.filter(i => i.origemCalculo !== 'automatico').length;
    return s + a + p;
  }, [plano.servicos, plano.aquisicoes, plano.pessoal]);

  const mutatePlano = (updater: (prev: PlanoCusteio) => PlanoCusteio) => {
    setPlano(updater);
    setIsDirty(true);
  };

  // ─── Ações de Recálculo (Preservando ou Restaurando Ajustes Manuais) ───────

  const handleRecalcularPreservandoManuais = (
    overrideIntervencoes = plano.intervencoes,
    overrideDataInicio = plano.dataInicio,
    overrideDataFim = plano.dataFim,
    overrideExisting?: {
      servicos: ItemCusteioServico[];
      aquisicoes: ItemCusteioAquisicao[];
      pessoal: ItemCusteioPessoal[];
    },
    showFeedback = false
  ) => {
    const baseExisting = overrideExisting || {
      servicos: plano.servicos,
      aquisicoes: plano.aquisicoes,
      pessoal: plano.pessoal,
    };

    const regenerados = gerarEstimativaItensProporcionais(
      overrideIntervencoes,
      catalogos,
      overrideDataInicio,
      overrideDataFim,
      baseExisting,
      true // preserva ajustes manuais!
    );

    mutatePlano(prev => ({
      ...prev,
      dataInicio: overrideDataInicio,
      dataFim: overrideDataFim,
      anoInicio: Number(overrideDataInicio.split('-')[0]) || prev.anoInicio,
      anoFim: Number(overrideDataFim.split('-')[0]) || prev.anoFim,
      intervencoes: overrideIntervencoes,
      servicos: regenerados.servicos,
      aquisicoes: regenerados.aquisicoes,
      pessoal: regenerados.pessoal,
    }));

    if (showFeedback) {
      toast.success(
        totalItensManuais > 0
          ? `Itens automáticos recalculados preservando ${totalItensManuais} ajuste(s) manual(is).`
          : 'Estimativa proporcional recalculada com sucesso.'
      );
    }
  };

  const executeRestaurarPadraoAutomatico = () => {
    const regenerados = gerarEstimativaItensProporcionais(
      plano.intervencoes,
      catalogos,
      plano.dataInicio,
      plano.dataFim,
      undefined,
      false
    );

    const novaProj = calcularProjecaoPlanoCusteio(
      plano.dataInicio,
      plano.dataFim,
      plano.intervencoes,
      regenerados.servicos,
      regenerados.aquisicoes,
      regenerados.pessoal,
      {
        taxaReajusteAnualServicos: 0,
        taxaReajusteAnualAquisicoes: 0,
        taxaReajusteAnualPessoal: 0,
        observacoesCenario: plano.parametrosSimulacao.observacoesCenario,
      },
      0
    );

    mutatePlano(prev => ({
      ...prev,
      servicos: novaProj.servicos,
      aquisicoes: novaProj.aquisicoes,
      pessoal: novaProj.pessoal,
      parametrosSimulacao: {
        taxaReajusteAnualServicos: 0,
        taxaReajusteAnualAquisicoes: 0,
        taxaReajusteAnualPessoal: 0,
        observacoesCenario: prev.parametrosSimulacao.observacoesCenario,
      },
      resumoFinanceiro: novaProj.resumoFinanceiro,
    }));
    setIsRestoreModalOpen(false);
    toast.success('Estimativa automática restaurada com base nos catálogos oficiais.');
  };

  const handleRequestRestaurarPadrao = () => {
    const hasSliders =
      (plano.parametrosSimulacao.taxaReajusteAnualServicos || 0) > 0 ||
      (plano.parametrosSimulacao.taxaReajusteAnualAquisicoes || 0) > 0 ||
      (plano.parametrosSimulacao.taxaReajusteAnualPessoal || 0) > 0;
    if (totalItensManuais > 0 || hasSliders) {
      setIsRestoreModalOpen(true);
    } else {
      executeRestaurarPadraoAutomatico();
    }
  };

  const handleSavePlano = () => {
    if (!plano.nome.trim()) {
      toast.error('Informe o nome do Plano de Custeio.');
      return;
    }
    if (plano.dataInicio > plano.dataFim) {
      toast.error('A data de início do Plano de Custeio não pode ser posterior à data de término.');
      return;
    }

    const atualizado: PlanoCusteio = {
      ...plano,
      versao: (plano.versao || 1) + 1,
      dataAtualizacao: new Date().toISOString().split('T')[0],
      anoInicio: Number(plano.dataInicio.split('-')[0]),
      anoFim: Number(plano.dataFim.split('-')[0]),
      servicos: projecao.servicos,
      aquisicoes: projecao.aquisicoes,
      pessoal: projecao.pessoal,
      resumoFinanceiro: projecao.resumoFinanceiro,
    };

    setPlano(atualizado);
    setIsDirty(false);
    onSave(atualizado);
    toast.success(`Plano de Custeio salvo com sucesso (Versão ${atualizado.versao})!`);
  };

  const handleBackClick = () => {
    if (isDirty) {
      setIsExitModalOpen(true);
    } else {
      onBack();
    }
  };

  // ─── Atualizadores de Intervenções ─────────────────────────────────────────

  const updateIntervencao = (
    intervId: string,
    patch: Partial<PlanoCusteio['intervencoes'][number]>,
    recalcAutomatic: boolean = true
  ) => {
    const currentIv = plano.intervencoes.find(iv => iv.id === intervId);
    const novasInterv = plano.intervencoes.map(iv =>
      iv.id === intervId ? { ...iv, ...patch } : iv
    );

    // Sincronizar dataInicio dos itens vinculados (inclusive manuais) ao alterar dataInicioOperacao
    let existingOverride:
      | {
          servicos: ItemCusteioServico[];
          aquisicoes: ItemCusteioAquisicao[];
          pessoal: ItemCusteioPessoal[];
        }
      | undefined;

    if (currentIv && patch.dataInicioOperacao && patch.dataInicioOperacao !== currentIv.dataInicioOperacao) {
      const oldOp = currentIv.dataInicioOperacao;
      const newOp = patch.dataInicioOperacao;
      existingOverride = {
        servicos: plano.servicos.map(s =>
          s.intervencaoCusteioId === intervId && (s.dataInicio === oldOp || s.dataInicio < newOp)
            ? { ...s, dataInicio: newOp }
            : s
        ),
        aquisicoes: plano.aquisicoes.map(a =>
          a.intervencaoCusteioId === intervId && (a.dataInicio === oldOp || a.dataInicio < newOp)
            ? {
                ...a,
                dataInicio: newOp,
                dataFim: a.tipoAquisicao === 'pontual_implantacao' ? newOp : a.dataFim,
              }
            : a
        ),
        pessoal: plano.pessoal.map(p =>
          p.intervencaoCusteioId === intervId && (p.dataInicio === oldOp || p.dataInicio < newOp)
            ? { ...p, dataInicio: newOp }
            : p
        ),
      };
    }

    if (recalcAutomatic) {
      handleRecalcularPreservandoManuais(
        novasInterv,
        plano.dataInicio,
        plano.dataFim,
        existingOverride
      );
    } else {
      mutatePlano(prev => ({ ...prev, intervencoes: novasInterv }));
    }
  };

  // ─── Inclusão de Novos Itens Manuais ───────────────────────────────────────

  const handleAddServicoManual = (targetIntervId?: string) => {
    const defaultInterv =
      targetIntervId ||
      (filtroIntervencao !== 'todas'
        ? filtroIntervencao
        : plano.intervencoes[0]?.id || 'global');
    const iv = mapInterv.get(defaultInterv);
    const ref = catalogos.servicosRef.find(s => !s.descricao.toLowerCase().includes('pessoal'));

    const novo: ItemCusteioServico = {
      id: `srv-man-${Date.now()}`,
      categoria: 'servico',
      intervencaoCusteioId: defaultInterv,
      descricao: ref ? `${ref.descricao} (Adicional)` : 'NOVO SERVIÇO OPERACIONAL',
      tipoServico: 'outros',
      criterioCalculo: 'valor_fixo_incremental',
      fatorProporcional: 1,
      numeradorProporcao: 1,
      denominadorProporcao: 1,
      unidadeProporcao: 'fixo',
      memoriaCalculo: 'Serviço específico incluído manualmente pelo usuário (100%)',
      naturezaCusto: 'exclusivo_intervencao',
      periodicidade: 'anual',
      unidadeMedida: 'ANO',
      quantidade: 1,
      valorUnitario: ref ? ref.valorAnual : 12000,
      dataInicio: iv?.dataInicioOperacao || plano.dataInicio,
      dataFim: plano.dataFim,
      ocorrenciasNoPeriodo: 0,
      valorAnualizado: ref ? ref.valorAnual : 12000,
      valorTotalProjetado: 0,
      origemCalculo: 'incluido_manualmente',
    };
    mutatePlano(prev => ({ ...prev, servicos: [novo, ...prev.servicos] }));
    toast.info('Serviço específico adicionado ao Plano de Custeio.');
  };

  const handleAddAquisicaoManual = (
    tipo: 'pontual_implantacao' | 'recorrente_manutencao',
    targetIntervId?: string
  ) => {
    const defaultInterv =
      targetIntervId ||
      (filtroIntervencao !== 'todas'
        ? filtroIntervencao
        : plano.intervencoes[0]?.id || 'global');
    const iv = mapInterv.get(defaultInterv);
    const startRef =
      iv && iv.dataInicioOperacao > plano.dataInicio ? iv.dataInicioOperacao : plano.dataInicio;

    const novo: ItemCusteioAquisicao = {
      id: `aq-man-${Date.now()}`,
      categoria: 'aquisicao',
      tipoAquisicao: tipo,
      subcategoriaAquisicao: tipo === 'pontual_implantacao' ? 'mobiliario_equipamento' : 'outros',
      intervencaoCusteioId: defaultInterv,
      descricao:
        tipo === 'pontual_implantacao'
          ? 'AQUISIÇÃO PONTUAL COMPLEMENTAR (EQUIPAMENTO / MOBILIÁRIO)'
          : 'INSUMO RECORRENTE ANUAL COMPLEMENTAR',
      criterioCalculo: tipo === 'pontual_implantacao' ? 'manual' : 'valor_fixo_incremental',
      fatorProporcional: 1,
      numeradorProporcao: 1,
      denominadorProporcao: 1,
      unidadeProporcao: tipo === 'pontual_implantacao' ? 'UN' : 'fixo',
      memoriaCalculo:
        tipo === 'pontual_implantacao'
          ? 'Despesa única de implantação incluída manualmente'
          : 'Despesa anual recorrente incluída manualmente (100%)',
      naturezaCusto: 'exclusivo_intervencao',
      periodicidade: tipo === 'pontual_implantacao' ? 'unica' : 'anual',
      unidadeMedida: tipo === 'pontual_implantacao' ? 'UN' : 'ANO',
      quantidade: 1,
      valorUnitario: 10000,
      dataInicio: startRef,
      dataFim: tipo === 'pontual_implantacao' ? startRef : plano.dataFim,
      ocorrenciasNoPeriodo: 0,
      valorAnualizado: 10000,
      valorTotalProjetado: 0,
      origemCalculo: 'incluido_manualmente',
    };
    mutatePlano(prev => ({ ...prev, aquisicoes: [novo, ...prev.aquisicoes] }));
    toast.info('Item de aquisição adicionado ao Plano de Custeio.');
  };

  const handleAddPessoalManual = (catCargo: ItemCusteioPessoal['categoriaCargo']) => {
    const defaultInterv =
      filtroIntervencao !== 'todas'
        ? filtroIntervencao
        : plano.intervencoes[0]?.id || 'global';
    const iv = mapInterv.get(defaultInterv);
    const cg = catalogos.cargosRef[0];
    const mensal = (cg?.remuneracaoBase || 3000) + (cg?.auxilios || 400) + (cg?.patronal || 600);
    const anual = mensal * 13.33;

    const novo: ItemCusteioPessoal = {
      id: `pes-man-${Date.now()}`,
      categoria: 'pessoal',
      categoriaCargo: catCargo,
      intervencaoCusteioId: defaultInterv,
      cargoRefId: cg?.id,
      funcao: cg?.descricao || 'PROFISSIONAL COMPLEMENTAR',
      descricao: cg?.descricao || 'PROFISSIONAL COMPLEMENTAR',
      cargaHoraria: '40h semanais',
      remuneracaoBase: cg?.remuneracaoBase || 3000,
      auxilios: cg?.auxilios || 400,
      patronalUnitario: cg?.patronal || 600,
      custoMensalUnitario: mensal,
      custoAnualUnitario: anual,
      criterioCalculo: 'manual',
      fatorProporcional: 1,
      numeradorProporcao: 1,
      denominadorProporcao: 1,
      unidadeProporcao: 'prof.',
      memoriaCalculo: 'Cargo incluído manualmente no dimensionamento',
      naturezaCusto: 'exclusivo_intervencao',
      periodicidade: 'anual',
      unidadeMedida: 'ANO',
      quantidade: 1,
      valorUnitario: anual,
      dataInicio: iv?.dataInicioOperacao || plano.dataInicio,
      dataFim: plano.dataFim,
      ocorrenciasNoPeriodo: 0,
      valorAnualizado: anual,
      valorTotalProjetado: 0,
      origemCalculo: 'incluido_manualmente',
    };
    mutatePlano(prev => ({ ...prev, pessoal: [novo, ...prev.pessoal] }));
    toast.info('Profissional adicionado ao dimensionamento.');
  };

  // Listas filtradas por unidade/intervenção selecionada
  const servicosFiltrados = projecao.servicos.filter(
    s => filtroIntervencao === 'todas' || s.intervencaoCusteioId === filtroIntervencao
  );
  const aquisicoesFiltradas = projecao.aquisicoes.filter(
    a =>
      (filtroIntervencao === 'todas' || a.intervencaoCusteioId === filtroIntervencao) &&
      (filtroTipoAquisicao === 'todas' || a.tipoAquisicao === filtroTipoAquisicao)
  );
  const pessoalFiltrado = projecao.pessoal.filter(
    p => filtroIntervencao === 'todas' || p.intervencaoCusteioId === filtroIntervencao
  );

  // Agrupamento por Unidade Escolar / Intervenção para visualização limpa e sem corte horizontal
  const gruposServicos = useMemo(() => {
    const grupos: {
      id: string;
      intervencao?: IntervencaoCusteioVinculada;
      itens: ItemCusteioServico[];
    }[] = [];
    const porId = new Map<string, ItemCusteioServico[]>();
    for (const item of servicosFiltrados) {
      const key = item.intervencaoCusteioId || 'global';
      const arr = porId.get(key) || [];
      arr.push(item);
      porId.set(key, arr);
    }
    for (const iv of plano.intervencoes) {
      const itens = porId.get(iv.id);
      if (itens && itens.length > 0) {
        grupos.push({ id: iv.id, intervencao: iv, itens });
        porId.delete(iv.id);
      }
    }
    for (const [key, itens] of porId.entries()) {
      grupos.push({ id: key, intervencao: mapInterv.get(key), itens });
    }
    return grupos;
  }, [servicosFiltrados, plano.intervencoes, mapInterv]);

  const gruposAquisicoes = useMemo(() => {
    const grupos: {
      id: string;
      intervencao?: IntervencaoCusteioVinculada;
      itens: ItemCusteioAquisicao[];
    }[] = [];
    const porId = new Map<string, ItemCusteioAquisicao[]>();
    for (const item of aquisicoesFiltradas) {
      const key = item.intervencaoCusteioId || 'global';
      const arr = porId.get(key) || [];
      arr.push(item);
      porId.set(key, arr);
    }
    for (const iv of plano.intervencoes) {
      const itens = porId.get(iv.id);
      if (itens && itens.length > 0) {
        grupos.push({ id: iv.id, intervencao: iv, itens });
        porId.delete(iv.id);
      }
    }
    for (const [key, itens] of porId.entries()) {
      grupos.push({ id: key, intervencao: mapInterv.get(key), itens });
    }
    return grupos;
  }, [aquisicoesFiltradas, plano.intervencoes, mapInterv]);

  const TABS: {
    id: WorkspaceTabId;
    group: NavGroupKey;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'visao-geral',
      group: 'estrutura',
      label: 'Visão Geral',
      desc: `${plano.intervencoes.filter(i => i.ativoNoCusteio).length} unid. · +${resumoFinanceiro.totalVagasContempladas} vagas`,
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'servicos',
      group: 'categorias',
      label: 'Serviços',
      desc: BRL0(resumoFinanceiro.totalServicosPeriodo),
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'aquisicoes',
      group: 'categorias',
      label: 'Aquisições',
      desc: BRL0(
        resumoFinanceiro.totalAquisicoesPontuaisPeriodo +
          resumoFinanceiro.totalAquisicoesRecorrentesPeriodo
      ),
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'pessoal',
      group: 'categorias',
      label: 'Pessoal e Folha',
      desc: `${BRL0(resumoFinanceiro.totalPessoalPeriodo)} (${resumoFinanceiro.totalProfissionais} prof.)`,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'cronograma',
      group: 'analise',
      label: 'Cronograma & Simulação',
      desc: `${cronogramaMensal.length} meses · Reajustes`,
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'relatorio',
      group: 'analise',
      label: 'Relatório Oficial',
      desc: 'Demonstrativo e PDF',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const currentTabIdx = Math.max(
    0,
    TABS.findIndex(t => t.id === activeTab)
  );
  const activeGroup = TABS[currentTabIdx]?.group || 'estrutura';
  const navGroups: NavGroupKey[] = ['estrutura', 'categorias', 'analise'];

  const deltaSimulacao = resumoFinanceiro.totalGeralPeriodo - baselineAutomaticoAtual;

  // Subtotais filtrados para rodapés das tabelas
  const totalAnualServicosFiltrados = servicosFiltrados.reduce((acc, s) => {
    const iv = mapInterv.get(s.intervencaoCusteioId);
    return iv && !iv.ativoNoCusteio ? acc : acc + s.valorAnualizado;
  }, 0);
  const totalPeriodoServicosFiltrados = servicosFiltrados.reduce(
    (acc, s) => acc + s.valorTotalProjetado,
    0
  );

  const totalPontualAqFiltradas = aquisicoesFiltradas
    .filter(a => a.tipoAquisicao === 'pontual_implantacao')
    .reduce((acc, a) => acc + a.valorTotalProjetado, 0);
  const totalRecorrenteAqFiltradas = aquisicoesFiltradas
    .filter(a => a.tipoAquisicao === 'recorrente_manutencao')
    .reduce((acc, a) => acc + a.valorTotalProjetado, 0);
  const totalPeriodoAqFiltradas = totalPontualAqFiltradas + totalRecorrenteAqFiltradas;

  const totalTurmasAtivas = plano.intervencoes
    .filter(i => i.ativoNoCusteio)
    .reduce((acc, i) => acc + i.turmasPrevistas, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-5">
        {/* Topo / Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
          <div>
            <button
              type="button"
              onClick={handleBackClick}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar aos Planos de Custeio
            </button>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{plano.nome}</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                {plano.cenarioLabel} · v{plano.versao}
              </span>
              <select
                value={plano.status}
                onChange={e =>
                  mutatePlano(prev => ({ ...prev, status: e.target.value as StatusPlanoCusteio }))
                }
                aria-label="Status do Plano de Custeio"
                className="px-3 py-1 rounded-full text-xs font-bold border border-slate-300 bg-white text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Rascunho">Rascunho</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Arquivado">Arquivado</option>
              </select>
              {isDirty && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Alterações não salvas
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Vinculado ao Plano de Expansão:{' '}
              <strong className="text-slate-700">
                {planoExpansao
                  ? `${planoExpansao.nome || planoExpansao.name} (${planoExpansao.periodoInicio}–${planoExpansao.periodoFim})`
                  : plano.planoExpansaoId}
              </strong>{' '}
              · Vigência do Custeio:{' '}
              <strong className="text-blue-700">
                {formatYMDisplay(plano.dataInicio)} a {formatYMDisplay(plano.dataFim)} ({cronogramaMensal.length} meses)
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  handleRecalcularPreservandoManuais(
                    plano.intervencoes,
                    plano.dataInicio,
                    plano.dataFim,
                    undefined,
                    true
                  )
                }
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                Recalcular (Preservar Manuais)
              </button>
              <FieldTooltip
                title="Recálculo Inteligente com Proteção"
                text="Atualiza todos os itens automáticos conforme os catálogos de referência e o número atual de salas/turmas, mas NÃO sobrescreve nenhum item editado ou adicionado manualmente por você."
              />
            </div>

            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={handleRequestRestaurarPadrao}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-amber-50 text-slate-600 hover:text-amber-800 rounded-xl text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Padrão
              </button>
              <FieldTooltip
                title="Restaurar Padrão dos Catálogos"
                text="Desfaz ajustes manuais e reajustes inflacionários, restaurando 100% da estimativa proporcional padrão dos Modelos de Creche."
              />
            </div>

            <button
              type="button"
              onClick={handleSavePlano}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              Salvar Plano de Custeio
            </button>
          </div>
        </div>

        {/* Barra de KPIs Padronizada (Cards brancos com ícones coloridos + Tooltips) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5 print:hidden">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
                <span>Total no Período ({cronogramaMensal.length}m)</span>
                <FieldTooltip
                  title="Desembolso Total Projetado"
                  text="Soma efetiva de Serviços, Aquisições (Únicas + Recorrentes) e Folha de Pessoal ao longo dos meses ativos de operação dentro da vigência do plano."
                  formula="Σ Desembolsos Mensais (Mês Início até Mês Fim)"
                />
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {BRL0(resumoFinanceiro.totalGeralPeriodo)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Média no período: {BRL0(resumoFinanceiro.custoMedioAnual)}/ano
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                <span>Regime Pleno (ANO)</span>
                <FieldTooltip
                  title="Custo Anual em Regime Pleno"
                  text="Custo anual recorrente quando todas as intervenções ativas estão operando simultaneamente por 12 meses completos (sem contar aquisições únicas de obra/implantação)."
                  formula={`Custo/Vaga/Ano = Regime Pleno ÷ ${resumoFinanceiro.totalVagasContempladas} vagas`}
                />
              </div>
              <div className="text-xl font-black text-emerald-700 mt-1">
                {BRL0(resumoFinanceiro.custoAnualRegimePleno)}
              </div>
              <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                {BRL0(resumoFinanceiro.custoPorVagaAdicionalAno)} / vaga / ano
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                <span>Serviços + Aquisições</span>
                <FieldTooltip
                  title="Manutenção, Contratos e Kits"
                  text="Reúne os Serviços operacionais anuais, as Aquisições Pontuais de Implantação (pagas uma única vez na abertura) e as Aquisições Recorrentes de consumo anual."
                />
              </div>
              <div className="text-xl font-black text-slate-800 mt-1">
                {BRL0(
                  resumoFinanceiro.totalServicosPeriodo +
                    resumoFinanceiro.totalAquisicoesPontuaisPeriodo +
                    resumoFinanceiro.totalAquisicoesRecorrentesPeriodo
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Serv.: {BRL0(resumoFinanceiro.totalServicosPeriodo)} · Únicas:{' '}
                {BRL0(resumoFinanceiro.totalAquisicoesPontuaisPeriodo)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-purple-700">
                <span>Pessoal e Folha</span>
                <FieldTooltip
                  title="Folha de Pagamento Anualizada"
                  text="Inclui Remuneração Base + Auxílios + Encargos Patronais multiplicados por 13,33 salários/ano (12 meses + 13º salário + 1/3 constitucional de férias)."
                  formula="(Base + Auxílios + Encargos) × 13,33 × Qtd"
                />
              </div>
              <div className="text-xl font-black text-purple-800 mt-1">
                {BRL0(resumoFinanceiro.totalPessoalPeriodo)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {resumoFinanceiro.totalProfissionais} prof. · +{resumoFinanceiro.totalVagasContempladas} vagas
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span>Variação Simulada</span>
                <FieldTooltip
                  title="Comparativo vs. Base Automática"
                  text="Diferença financeira entre o cenário simulado atual (com seus ajustes manuais e taxas de reajuste) e a estimativa 100% automática dos catálogos para o mesmo período."
                  formula={`Base Automática: ${BRL0(baselineAutomaticoAtual)}`}
                />
              </div>
              <div
                className={`text-xl font-black mt-1 ${
                  Math.abs(deltaSimulacao) < 1
                    ? 'text-slate-700'
                    : deltaSimulacao > 0
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {deltaSimulacao >= 0 ? '+' : ''}
                {BRL0(deltaSimulacao)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {totalItensManuais} ajuste(s) manual(is) protegido(s)
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            LAYOUT PADRÃO DO SISTEMA: SIDEBAR LATERAL NUMERADA + CONTEÚDO
           ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-4 items-start print:block">
          {/* ── LEFT STICKY SIDEBAR NAV (Padrão PlanoForm / ConfiguracoesCusto) ── */}
          <aside className="w-full lg:w-56 shrink-0 bg-white rounded-2xl shadow-lg overflow-hidden lg:sticky lg:top-6 print:hidden">
            <div className="bg-gradient-to-br from-[#1a3a5c] to-[#2563eb] p-4">
              <p className="text-white font-bold text-sm">Seções do Custeio</p>
              <p className="text-blue-200 text-xs mt-0.5">6 etapas do planejamento</p>
            </div>

            <nav className="p-2.5">
              {navGroups.map(group => {
                const gm = GROUP_META[group];
                const gTabs = TABS.filter(t => t.group === group);
                const isActiveGroup = activeGroup === group;
                return (
                  <div key={group} className="mb-3 last:mb-1">
                    <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                      <div
                        className={`w-5 h-5 rounded-full ${gm.bg} flex items-center justify-center shrink-0`}
                      >
                        <span className="text-white text-[11px] font-black">{gm.short}</span>
                      </div>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide ${
                          isActiveGroup ? gm.accent : 'text-slate-400'
                        }`}
                      >
                        {gm.label}
                      </span>
                    </div>

                    {gTabs.map(tab => {
                      const globalIdx = TABS.findIndex(t => t.id === tab.id);
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5 group ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition-all ${
                              isActive
                                ? 'bg-white/25 text-white'
                                : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                            }`}
                          >
                            {globalIdx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-xs font-semibold leading-tight truncate ${
                                isActive ? 'text-white' : 'text-slate-700'
                              }`}
                            >
                              {tab.label}
                            </div>
                            <div
                              className={`text-[11px] leading-tight truncate mt-0.5 ${
                                isActive ? 'text-white/80' : 'text-slate-400'
                              }`}
                            >
                              {tab.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {group !== 'analise' && <div className="border-b border-slate-100 mt-2 mb-1" />}
                  </div>
                );
              })}
            </nav>

            {/* Barra de Progresso */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Progresso da revisão</span>
                <span className="font-bold text-slate-700">
                  {currentTabIdx + 1} / {TABS.length}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] rounded-full transition-all duration-300"
                  style={{ width: `${((currentTabIdx + 1) / TABS.length) * 100}%` }}
                />
              </div>
            </div>
          </aside>

          {/* ── PAINEL PRINCIPAL DA ETAPA ATIVA ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Filtro Rápido por Unidade Escolar / Intervenção (nas abas operacionais 2, 3 e 4) */}
            {(activeTab === 'servicos' || activeTab === 'aquisicoes' || activeTab === 'pessoal') && (
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm print:hidden">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Filtrar itens por Unidade Escolar / Intervenção:</span>
                  <FieldTooltip
                    title="Filtro por Intervenção"
                    text="Permite inspecionar ou incluir despesas para uma creche ou ampliação específica. Novos itens adicionados manualmente herdam a unidade selecionada aqui."
                  />
                </div>
                <select
                  value={filtroIntervencao}
                  onChange={e => setFiltroIntervencao(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 min-w-[280px]"
                >
                  <option value="todas">
                    Todas as unidades / intervenções ({plano.intervencoes.length})
                  </option>
                  {plano.intervencoes.map(iv => (
                    <option key={iv.id} value={iv.id}>
                      [{iv.escopo === 'unidade_completa' ? 'Creche Completa' : 'Incremental'}] {iv.nomeUnidadeOuObra}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                ABA 1 — VISÃO GERAL & INTERVENÇÕES VINCULADAS
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'visao-geral' && (
              <div className="space-y-6">
                {/* Dados de Cadastro e Período Independente */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">
                        1. Parâmetros Gerais e Período Próprio do Plano de Custeio
                      </h2>
                      <p className="text-xs text-slate-500">
                        O período do Plano de Custeio é independente do cronograma físico de obras do Plano de Expansão.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <span>Nome do Plano de Custeio</span>
                        <FieldTooltip text="Título oficial utilizado nas listagens e relatórios institucionais." />
                      </label>
                      <input
                        type="text"
                        value={plano.nome}
                        onChange={e => mutatePlano(prev => ({ ...prev, nome: e.target.value }))}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <span>Identificação do Cenário</span>
                        <FieldTooltip text="Diferencia simulações alternativas de um mesmo Plano de Expansão (ex.: Cenário Base, Turno Integral, Operação Gradual)." />
                      </label>
                      <input
                        type="text"
                        value={plano.cenarioLabel}
                        onChange={e =>
                          mutatePlano(prev => ({ ...prev, cenarioLabel: e.target.value }))
                        }
                        placeholder="Ex.: Cenário Base"
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <span>Responsável Técnico</span>
                        <FieldTooltip text="Servidor, setor ou equipe responsável pela elaboração e validação orçamentária." />
                      </label>
                      <input
                        type="text"
                        value={plano.responsavelNome}
                        onChange={e =>
                          mutatePlano(prev => ({ ...prev, responsavelNome: e.target.value }))
                        }
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <span>Início do Custeio (Mês/Ano)</span>
                        <FieldTooltip
                          title="Competência Inicial do Horizonte"
                          text="Primeiro mês do horizonte financeiro. Nenhuma despesa anterior a este mês será contabilizada."
                        />
                      </label>
                      <input
                        type="month"
                        value={plano.dataInicio}
                        onChange={e =>
                          handleRecalcularPreservandoManuais(
                            plano.intervencoes,
                            e.target.value,
                            plano.dataFim
                          )
                        }
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <span>Término do Custeio (Mês/Ano)</span>
                        <FieldTooltip
                          title="Competência Final do Horizonte"
                          text="Último mês projetado no cronograma financeiro do Plano de Custeio."
                        />
                      </label>
                      <input
                        type="month"
                        value={plano.dataFim}
                        onChange={e =>
                          handleRecalcularPreservandoManuais(
                            plano.intervencoes,
                            plano.dataInicio,
                            e.target.value
                          )
                        }
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <span>Descrição / Premissas Gerais</span>
                        <FieldTooltip text="Resumo executivo do objetivo financeiro deste cenário." />
                      </label>
                      <input
                        type="text"
                        value={plano.descricao}
                        onChange={e =>
                          mutatePlano(prev => ({ ...prev, descricao: e.target.value }))
                        }
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Quadro de Intervenções, Escopo Proporcional e Entrada em Funcionamento */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
                    <div>
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-blue-600" />
                        Unidades Escolares, Escopo Proporcional e Entrada em Operação
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Custos recorrentes iniciam apenas a partir do mês de <strong>Início de Operação</strong> de cada intervenção.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-xs">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="text-center px-2.5 py-3 font-bold w-12">
                            <span className="inline-flex items-center gap-1">
                              Ativa
                              <FieldTooltip text="Permite simular a ativação ou postergação de uma obra específica sem excluí-la do plano." />
                            </span>
                          </th>
                          <th className="text-left px-3 py-3 font-bold min-w-[200px]">
                            Unidade Escolar / Intervenção
                          </th>
                          <th className="text-left px-3 py-3 font-bold w-[170px]">
                            <span className="inline-flex items-center gap-1">
                              Escopo & Capacidade
                              <FieldTooltip
                                title="Creche Completa vs. Incremental"
                                text="Creche Completa: custeia 100% dos ambientes, contratos e equipe do modelo. Incremental: custeia apenas as novas salas, vagas e professores da ampliação, evitando duplicar direção ou contratos existentes."
                              />
                            </span>
                          </th>
                          <th className="text-center px-2.5 py-3 font-bold w-[72px]">
                            <span className="inline-flex items-center gap-1">
                              Turmas
                              <FieldTooltip text="Quantidade de turmas em funcionamento. Alterar o número de turmas redimensiona automaticamente o quadro pedagógico da unidade." />
                            </span>
                          </th>
                          <th className="text-center px-3 py-3 font-bold w-[150px]">
                            <span className="inline-flex items-center gap-1">
                              Início Operação
                              <FieldTooltip
                                title="Entrada em Funcionamento"
                                text="Mês em que a escola ou ampliação efetivamente recebe alunos. Kits únicos ocorrem neste mês e despesas anuais contam pro rata (1/12 por mês ativo) a partir daqui."
                              />
                            </span>
                          </th>
                          <th className="text-right px-3 py-3 font-bold w-[112px]">
                            <span className="inline-flex items-center gap-1 justify-end">
                              Regime / Ano
                              <FieldTooltip text="Custo anual recorrente da unidade operando por 12 meses cheios." />
                            </span>
                          </th>
                          <th className="text-right px-3 py-3 font-bold w-[118px] whitespace-nowrap">
                            Total no Período
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {plano.intervencoes.map(iv => {
                          const resumoIv = resumoPorIntervencao.find(
                            r => r.intervencaoId === iv.id
                          );
                          return (
                            <tr
                              key={iv.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                !iv.ativoNoCusteio ? 'opacity-50 bg-slate-50' : ''
                              }`}
                            >
                              <td className="px-2.5 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={iv.ativoNoCusteio}
                                  onChange={e =>
                                    updateIntervencao(
                                      iv.id,
                                      { ativoNoCusteio: e.target.checked },
                                      false
                                    )
                                  }
                                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-3 min-w-[200px]">
                                <div className="font-bold text-slate-800 text-sm leading-snug">
                                  {iv.nomeUnidadeOuObra}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {iv.modeloCrecheNome} · {iv.localizacaoResumo}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div>
                                  {iv.escopo === 'unidade_completa' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
                                      Creche Completa (100%)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                      Incremental ({iv.subtipoIntervencao === 'adaptacao' ? 'Adaptação' : 'Ampliação'})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-600 mt-1 whitespace-nowrap">
                                  +{iv.salasAdicionais} salas · +{iv.vagasAdicionais} vagas
                                </div>
                              </td>
                              <td className="px-2.5 py-3 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  max={40}
                                  value={iv.turmasPrevistas}
                                  onChange={e =>
                                    updateIntervencao(iv.id, {
                                      turmasPrevistas: Math.max(1, Number(e.target.value)),
                                    })
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-bold border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </td>
                              <td className="px-3 py-3 text-center">
                                <input
                                  type="month"
                                  value={iv.dataInicioOperacao}
                                  onChange={e =>
                                    updateIntervencao(iv.id, {
                                      dataInicioOperacao: e.target.value,
                                    })
                                  }
                                  className="w-[126px] px-2 py-1 border border-blue-300 bg-blue-50/40 rounded-lg text-xs font-bold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                                  {resumoIv?.mesesOperacaoNoPeriodo || 0}m ativos
                                  {iv.dataConclusaoObra ? ` · Obra: ${iv.dataConclusaoObra}` : ''}
                                </div>
                              </td>
                              <td className="px-3 py-3 text-right font-semibold text-emerald-800 whitespace-nowrap">
                                {BRL(resumoIv?.custoAnualizadoRegime || 0)}
                              </td>
                              <td className="px-3 py-3 text-right font-extrabold text-slate-900 text-xs whitespace-nowrap">
                                {BRL(resumoIv?.totalPeriodo || 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-slate-800 font-bold">
                        <tr>
                          <td className="px-2.5 py-3 text-center text-[11px] uppercase text-slate-500">
                            Total
                          </td>
                          <td className="px-3 py-3">
                            {plano.intervencoes.filter(i => i.ativoNoCusteio).length} de{' '}
                            {plano.intervencoes.length} intervenções ativas no cenário
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            +{resumoFinanceiro.totalSalasContempladas} salas · +
                            {resumoFinanceiro.totalVagasContempladas} vagas
                          </td>
                          <td className="px-2.5 py-3 text-center">{totalTurmasAtivas} tr</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            Vigência: {cronogramaMensal.length} meses
                          </td>
                          <td className="px-3 py-3 text-right text-emerald-800 whitespace-nowrap">
                            {BRL(resumoFinanceiro.custoAnualRegimePleno)}
                          </td>
                          <td className="px-3 py-3 text-right text-blue-800 font-black whitespace-nowrap">
                            {BRL(resumoFinanceiro.totalGeralPeriodo)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                ABA 2 — CATEGORIA A: SERVIÇOS OPERACIONAIS
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'servicos' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 leading-relaxed">
                      <strong>Regra Proporcional em Serviços (Base Anual Fixa):</strong> Em{' '}
                      <em>Novas Creches</em>, contratos indivisíveis são aplicados em <strong>100%</strong>. Em{' '}
                      <em>Ampliações/Adaptações</em>, contratos já suportados pela escola iniciam em{' '}
                      <strong>Rateio 0%</strong> (Compartilhado) e contratos de área/limpeza usam a{' '}
                      <strong>fração exata de salas</strong> (ex.: 2/5 salas = 40%), sem arredondamentos que distorçam centavos.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddServicoManual()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    Incluir Serviço
                  </button>
                </div>

                {gruposServicos.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500 shadow-sm">
                    Nenhum item de serviço operacional encontrado para o filtro selecionado.
                  </div>
                ) : (
                  gruposServicos.map(grupo => {
                    const iv = grupo.intervencao;
                    const resumoIv = iv
                      ? resumoPorIntervencao.find(r => r.intervencaoId === iv.id)
                      : undefined;
                    const subtotalAnualGrupo = grupo.itens.reduce(
                      (acc, s) => acc + s.valorAnualizado,
                      0
                    );
                    const subtotalPeriodoGrupo = grupo.itens.reduce(
                      (acc, s) => acc + s.valorTotalProjetado,
                      0
                    );

                    return (
                      <div
                        key={grupo.id}
                        className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${
                          iv && !iv.ativoNoCusteio ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Cabeçalho da Unidade Escolar / Intervenção */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                            <h3 className="font-bold text-slate-800 text-sm">
                              {iv?.nomeUnidadeOuObra || 'Despesas Operacionais Globais'}
                            </h3>
                            {iv &&
                              (iv.escopo === 'unidade_completa' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
                                  Creche Completa (100%)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                  Incremental ({iv.subtipoIntervencao === 'adaptacao' ? 'Adaptação' : 'Ampliação'})
                                </span>
                              ))}
                            {iv && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 whitespace-nowrap">
                                +{iv.salasAdicionais} salas · +{iv.vagasAdicionais} vagas ·{' '}
                                {resumoIv?.mesesOperacaoNoPeriodo ?? 0}m ativos
                              </span>
                            )}
                            {iv && !iv.ativoNoCusteio && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 whitespace-nowrap">
                                Inativa na simulação
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="text-right text-[11px] text-slate-500">
                              <span>Anual: </span>
                              <strong className="text-emerald-700">{BRL(subtotalAnualGrupo)}</strong>
                              <span className="mx-1.5 text-slate-300">|</span>
                              <span>Período: </span>
                              <strong className="text-blue-700">{BRL(subtotalPeriodoGrupo)}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleAddServicoManual(grupo.id !== 'global' ? grupo.id : undefined)
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold transition-colors whitespace-nowrap"
                              title="Adicionar serviço específico para esta unidade"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Serviço
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px] text-xs">
                            <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                              <tr>
                                <th className="text-left px-3.5 py-2.5 font-bold min-w-[215px]">
                                  <span className="inline-flex items-center gap-1">
                                    Serviço Operacional & Natureza
                                    <FieldTooltip
                                      title="Serviço & Natureza da Despesa"
                                      text="Clique no nome do serviço para editar a descrição. A etiqueta indica se a despesa é Exclusiva da Intervenção ou Compartilhada com a escola existente."
                                    />
                                  </span>
                                </th>
                                <th className="text-left px-3 py-2.5 font-bold w-[195px]">
                                  <span className="inline-flex items-center gap-1">
                                    Critério & Proporção
                                    <FieldTooltip
                                      title="Critério Proporcional & Fração Exata"
                                      text="Selecione o critério de dimensionamento (Por Sala, Por Vaga, Por Unidade, Rateio % ou Valor Fixo). A fração física exata aplicada ao contrato é exibida logo abaixo."
                                    />
                                  </span>
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[122px]">
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    Ref. Anual (ANO)
                                    <FieldTooltip
                                      title="Valor Anual de Referência"
                                      text="Valor anual integral (12 meses) do contrato para uma unidade padrão, conforme cadastrado em Configurações de Custo."
                                    />
                                  </span>
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[108px]">
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    Anual Aplicado
                                    <FieldTooltip
                                      title="Custo Anual Efetivo"
                                      text="Resultado de Ref. Anual × Proporção exata da intervenção."
                                      formula="Anual Aplicado = Ref. Anual × Proporção"
                                    />
                                  </span>
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[118px]">
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    Total no Período
                                    <FieldTooltip
                                      title="Total Projetado no Período"
                                      text="Soma mensal pro rata (Anual Aplicado ÷ 12) nos meses ativos da unidade dentro do plano, acrescida de eventual reajuste anual simulado."
                                    />
                                  </span>
                                </th>
                                <th className="text-center px-2 py-2.5 font-bold w-[34px]"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {grupo.itens.map(item => {
                                const isManual = item.origemCalculo !== 'automatico';
                                return (
                                  <tr
                                    key={item.id}
                                    className={`hover:bg-slate-50/80 transition-colors ${
                                      isManual ? 'bg-amber-50/30' : ''
                                    }`}
                                  >
                                    <td className="px-3.5 py-2.5 align-top min-w-[215px]">
                                      <input
                                        type="text"
                                        value={item.descricao}
                                        onChange={e =>
                                          mutatePlano(prev => ({
                                            ...prev,
                                            servicos: prev.servicos.map(s =>
                                              s.id === item.id
                                                ? {
                                                    ...s,
                                                    descricao: e.target.value,
                                                    origemCalculo:
                                                      s.origemCalculo === 'incluido_manualmente'
                                                        ? 'incluido_manualmente'
                                                        : 'ajustado_manualmente',
                                                  }
                                                : s
                                            ),
                                          }))
                                        }
                                        className="w-full min-w-[185px] text-xs font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg px-2 py-1 -ml-2 outline-none transition-colors"
                                      />
                                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                                            item.naturezaCusto === 'compartilhado_rede'
                                              ? 'bg-slate-100 text-slate-600'
                                              : 'bg-blue-50 text-blue-700'
                                          }`}
                                        >
                                          {item.naturezaCusto === 'compartilhado_rede'
                                            ? 'Compartilhado c/ Escola'
                                            : 'Exclusivo da Intervenção'}
                                        </span>
                                        {isManual && (
                                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold whitespace-nowrap">
                                            {item.origemCalculo === 'incluido_manualmente'
                                              ? 'Incluído Manual'
                                              : 'Ajuste Manual'}
                                          </span>
                                        )}
                                        <span className="text-[11px] text-slate-500 leading-snug">
                                          {item.memoriaCalculo}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 align-top w-[195px]">
                                      <div className="flex items-center gap-1">
                                        <select
                                          value={item.criterioCalculo}
                                          onChange={e => {
                                            const novoCrit = e.target
                                              .value as CriterioProporcionalidade;
                                            const qtdProf =
                                              qtdProfPorInterv.get(item.intervencaoCusteioId) || 0;
                                            const calcProp = calcularProporcaoPorCriterio(
                                              novoCrit,
                                              iv,
                                              catalogos,
                                              qtdProf,
                                              novoCrit === 'percentual_utilizacao'
                                                ? item.percentualRateio ?? 20
                                                : item.percentualRateio
                                            );
                                            mutatePlano(prev => ({
                                              ...prev,
                                              servicos: prev.servicos.map(s =>
                                                s.id === item.id
                                                  ? {
                                                      ...s,
                                                      criterioCalculo: novoCrit,
                                                      fatorProporcional: calcProp.fatorProporcional,
                                                      numeradorProporcao:
                                                        calcProp.numeradorProporcao,
                                                      denominadorProporcao:
                                                        calcProp.denominadorProporcao,
                                                      unidadeProporcao: calcProp.unidadeProporcao,
                                                      percentualRateio: calcProp.percentualRateio,
                                                      naturezaCusto: calcProp.naturezaCusto,
                                                      memoriaCalculo: calcProp.memoriaCalculo,
                                                      origemCalculo:
                                                        s.origemCalculo === 'incluido_manualmente'
                                                          ? 'incluido_manualmente'
                                                          : 'ajustado_manualmente',
                                                    }
                                                  : s
                                              ),
                                            }));
                                          }}
                                          className="w-full min-w-0 px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          {Object.entries(CRITERIO_LABELS).map(([k, lbl]) => (
                                            <option key={k} value={k}>
                                              {lbl}
                                            </option>
                                          ))}
                                        </select>
                                        <FieldTooltip
                                          title={CRITERIO_LABELS[item.criterioCalculo]}
                                          text={CRITERIO_DESCRIPTIONS[item.criterioCalculo]}
                                        />
                                      </div>

                                      <div className="mt-1.5 flex items-center justify-between gap-1.5">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                          Fator:
                                        </span>
                                        {item.criterioCalculo === 'percentual_utilizacao' ? (
                                          <div className="inline-flex items-center gap-1">
                                            <input
                                              type="number"
                                              min={0}
                                              max={200}
                                              step={5}
                                              value={item.percentualRateio ?? 0}
                                              onChange={e => {
                                                const pct = Math.max(0, Number(e.target.value));
                                                mutatePlano(prev => ({
                                                  ...prev,
                                                  servicos: prev.servicos.map(s =>
                                                    s.id === item.id
                                                      ? {
                                                          ...s,
                                                          percentualRateio: pct,
                                                          fatorProporcional: pct / 100,
                                                          naturezaCusto:
                                                            pct === 0
                                                              ? 'compartilhado_rede'
                                                              : 'exclusivo_intervencao',
                                                          memoriaCalculo:
                                                            pct === 0
                                                              ? 'Despesa compartilhada suportada pela escola existente (0% incremental)'
                                                              : `Aditivo/rateio contratual de ${pct}% sobre a referência anual`,
                                                          origemCalculo:
                                                            s.origemCalculo ===
                                                            'incluido_manualmente'
                                                              ? 'incluido_manualmente'
                                                              : 'ajustado_manualmente',
                                                        }
                                                      : s
                                                  ),
                                                }));
                                              }}
                                              className="w-16 px-2 py-0.5 text-right border border-blue-300 bg-blue-50/40 rounded-md text-xs font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="font-bold text-slate-600">%</span>
                                          </div>
                                        ) : (
                                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                                            {formatProporcaoResumo(item)}
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right w-[122px]">
                                      <CusteioCurrencyInput
                                        value={item.valorUnitario}
                                        onChange={val =>
                                          mutatePlano(prev => ({
                                            ...prev,
                                            servicos: prev.servicos.map(s =>
                                              s.id === item.id
                                                ? {
                                                    ...s,
                                                    valorUnitario: Math.max(0, val),
                                                    origemCalculo:
                                                      s.origemCalculo === 'incluido_manualmente'
                                                        ? 'incluido_manualmente'
                                                        : 'ajustado_manualmente',
                                                  }
                                                : s
                                            ),
                                          }))
                                        }
                                        className="w-[112px] px-2 py-1 text-right text-xs border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right w-[108px]">
                                      <div className="font-semibold text-slate-800 whitespace-nowrap py-1">
                                        {BRL(item.valorAnualizado)}
                                      </div>
                                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {BRL0(item.valorAnualizado / 12)}/mês
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right w-[118px]">
                                      <div className="font-bold text-blue-700 whitespace-nowrap py-1">
                                        {BRL(item.valorTotalProjetado)}
                                      </div>
                                      <div className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                                        {item.ocorrenciasNoPeriodo}m ativos
                                      </div>
                                    </td>

                                    <td className="px-2 py-2.5 align-top text-center w-[34px]">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          mutatePlano(prev => ({
                                            ...prev,
                                            servicos: prev.servicos.filter(s => s.id !== item.id),
                                          }))
                                        }
                                        className="p-1 mt-0.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                        title="Remover item"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Card Totalizador Consolidado de Serviços */}
                <div className="bg-white border-2 border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Consolidação da Categoria A — Serviços Operacionais
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      Total de <strong>{servicosFiltrados.length} contratos/serviços</strong> em{' '}
                      <strong>{gruposServicos.length} unidade(s)</strong> exibida(s)
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-slate-500">
                        Anual Aplicado (Regime)
                      </div>
                      <div className="text-lg font-extrabold text-emerald-700 whitespace-nowrap">
                        {BRL(totalAnualServicosFiltrados)}/ano
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-blue-700">
                        Total Projetado no Período
                      </div>
                      <div className="text-xl font-black text-blue-800 whitespace-nowrap">
                        {BRL(totalPeriodoServicosFiltrados)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                ABA 3 — CATEGORIA B: AQUISIÇÕES (PONTUAIS VS. RECORRENTES)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'aquisicoes' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFiltroTipoAquisicao('todas')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        filtroTipoAquisicao === 'todas'
                          ? 'bg-amber-700 text-white'
                          : 'bg-white text-amber-900 border border-amber-200'
                      }`}
                    >
                      Todas ({projecao.aquisicoes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroTipoAquisicao('pontual_implantacao')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        filtroTipoAquisicao === 'pontual_implantacao'
                          ? 'bg-amber-700 text-white'
                          : 'bg-white text-amber-900 border border-amber-200'
                      }`}
                    >
                      Pontuais de Implantação (Despesa Única)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroTipoAquisicao('recorrente_manutencao')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        filtroTipoAquisicao === 'recorrente_manutencao'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      Recorrentes de Manutenção (ANO)
                    </button>
                    <FieldTooltip
                      title="Pontual (Única) vs. Recorrente (ANO)"
                      text="Aquisições Pontuais (mobiliário e equipamentos iniciais) são contabilizadas UMA ÚNICA VEZ no mês de abertura (Qtd × Valor Unitário). Aquisições Recorrentes (merenda, material pedagógico, higiene, EPI) têm base ANUAL e são rateadas nos meses ativos."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddAquisicaoManual('pontual_implantacao')}
                      className="flex items-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Aq. Pontual (Única)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddAquisicaoManual('recorrente_manutencao')}
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Aq. Recorrente (ANO)
                    </button>
                  </div>
                </div>

                {gruposAquisicoes.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-500 shadow-sm">
                    Nenhum item de aquisição encontrado para o filtro selecionado.
                  </div>
                ) : (
                  gruposAquisicoes.map(grupo => {
                    const iv = grupo.intervencao;
                    const subtotalPontualGrupo = grupo.itens
                      .filter(a => a.tipoAquisicao === 'pontual_implantacao')
                      .reduce((acc, a) => acc + a.valorTotalProjetado, 0);
                    const subtotalRecorrenteGrupo = grupo.itens
                      .filter(a => a.tipoAquisicao === 'recorrente_manutencao')
                      .reduce((acc, a) => acc + a.valorTotalProjetado, 0);
                    const subtotalTotalGrupo = subtotalPontualGrupo + subtotalRecorrenteGrupo;

                    return (
                      <div
                        key={grupo.id}
                        className={`bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${
                          iv && !iv.ativoNoCusteio ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Cabeçalho da Unidade Escolar / Intervenção */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                            <h3 className="font-bold text-slate-800 text-sm">
                              {iv?.nomeUnidadeOuObra || 'Aquisições Globais da Rede'}
                            </h3>
                            {iv &&
                              (iv.escopo === 'unidade_completa' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
                                  Creche Completa (100%)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                                  Incremental ({iv.subtipoIntervencao === 'adaptacao' ? 'Adaptação' : 'Ampliação'})
                                </span>
                              ))}
                            {iv && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 whitespace-nowrap">
                                +{iv.salasAdicionais} salas · +{iv.vagasAdicionais} vagas
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-end sm:self-auto">
                            <div className="text-right text-[11px] text-slate-500">
                              <span>Únicas: </span>
                              <strong className="text-amber-700">{BRL(subtotalPontualGrupo)}</strong>
                              <span className="mx-1.5 text-slate-300">|</span>
                              <span>Recorr.: </span>
                              <strong className="text-emerald-700">
                                {BRL(subtotalRecorrenteGrupo)}
                              </strong>
                              <span className="mx-1.5 text-slate-300">|</span>
                              <span>Total: </span>
                              <strong className="text-slate-900">{BRL(subtotalTotalGrupo)}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleAddAquisicaoManual(
                                  'pontual_implantacao',
                                  grupo.id !== 'global' ? grupo.id : undefined
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold transition-colors whitespace-nowrap"
                              title="Adicionar aquisição pontual nesta unidade"
                            >
                              <Plus className="w-3 h-3" />
                              Pontual
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleAddAquisicaoManual(
                                  'recorrente_manutencao',
                                  grupo.id !== 'global' ? grupo.id : undefined
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors whitespace-nowrap"
                              title="Adicionar aquisição recorrente nesta unidade"
                            >
                              <Plus className="w-3 h-3" />
                              Recorrente
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[730px] text-xs">
                            <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                              <tr>
                                <th className="text-left px-3.5 py-2.5 font-bold min-w-[210px]">
                                  Item de Aquisição & Finalidade
                                </th>
                                <th className="text-left px-3 py-2.5 font-bold w-[200px]">
                                  <span className="inline-flex items-center gap-1">
                                    Recorrência & Critério
                                    <FieldTooltip
                                      title="Multiplicador Unificado"
                                      text="Itens Pontuais (Única): informe a quantidade física de kits/salas. Itens Recorrentes (ANO): selecione o critério proporcional (Por Vaga, Por Profissional, Por Unidade, Rateio % ou Valor Fixo) aplicado sobre o catálogo anual."
                                    />
                                  </span>
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[120px]">
                                  <span className="inline-flex items-center gap-1 justify-end">
                                    Valor Ref.
                                    <FieldTooltip text="Valor unitário do Kit (para itens Pontuais) ou valor anual de referência do Modelo (para itens Recorrentes)." />
                                  </span>
                                </th>
                                <th className="text-center px-3 py-2.5 font-bold w-[132px]">
                                  <span className="inline-flex items-center gap-1">
                                    Competência
                                    <FieldTooltip text="Mês do desembolso único (para itens Pontuais) ou mês de início da despesa recorrente." />
                                  </span>
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[114px] whitespace-nowrap">
                                  Total no Período
                                </th>
                                <th className="text-center px-2 py-2.5 font-bold w-[34px]"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {grupo.itens.map(item => {
                                const isPontual = item.tipoAquisicao === 'pontual_implantacao';
                                const isManual = item.origemCalculo !== 'automatico';
                                return (
                                  <tr
                                    key={item.id}
                                    className={`hover:bg-slate-50/80 transition-colors ${
                                      isManual ? 'bg-amber-50/30' : ''
                                    }`}
                                  >
                                    <td className="px-3.5 py-2.5 align-top min-w-[210px]">
                                      <input
                                        type="text"
                                        value={item.descricao}
                                        onChange={e =>
                                          mutatePlano(prev => ({
                                            ...prev,
                                            aquisicoes: prev.aquisicoes.map(a =>
                                              a.id === item.id
                                                ? {
                                                    ...a,
                                                    descricao: e.target.value,
                                                    origemCalculo:
                                                      a.origemCalculo === 'incluido_manualmente'
                                                        ? 'incluido_manualmente'
                                                        : 'ajustado_manualmente',
                                                  }
                                                : a
                                            ),
                                          }))
                                        }
                                        className="w-full min-w-[185px] text-xs font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded-lg px-2 py-1 -ml-2 outline-none transition-colors"
                                      />
                                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                        <span
                                          className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                                            isPontual
                                              ? 'bg-amber-50 text-amber-800'
                                              : 'bg-emerald-50 text-emerald-800'
                                          }`}
                                        >
                                          {isPontual ? 'Implantação Física' : 'Consumo Operacional'}
                                        </span>
                                        {isManual && (
                                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold whitespace-nowrap">
                                            {item.origemCalculo === 'incluido_manualmente'
                                              ? 'Incluído Manual'
                                              : 'Ajuste Manual'}
                                          </span>
                                        )}
                                        <span className="text-[11px] text-slate-500 leading-snug">
                                          {item.memoriaCalculo}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 align-top w-[200px] space-y-1.5">
                                      <select
                                        value={item.tipoAquisicao}
                                        onChange={e => {
                                          const novoTipo = e.target
                                            .value as ItemCusteioAquisicao['tipoAquisicao'];
                                          mutatePlano(prev => ({
                                            ...prev,
                                            aquisicoes: prev.aquisicoes.map(a =>
                                              a.id === item.id
                                                ? {
                                                    ...a,
                                                    tipoAquisicao: novoTipo,
                                                    periodicidade:
                                                      novoTipo === 'pontual_implantacao'
                                                        ? 'unica'
                                                        : 'anual',
                                                    unidadeMedida:
                                                      novoTipo === 'pontual_implantacao'
                                                        ? 'KIT'
                                                        : 'ANO',
                                                    fatorProporcional:
                                                      novoTipo === 'pontual_implantacao'
                                                        ? 1
                                                        : a.fatorProporcional,
                                                    quantidade:
                                                      novoTipo === 'recorrente_manutencao'
                                                        ? 1
                                                        : a.quantidade,
                                                    dataFim:
                                                      novoTipo === 'pontual_implantacao'
                                                        ? a.dataInicio
                                                        : plano.dataFim,
                                                    origemCalculo:
                                                      a.origemCalculo === 'incluido_manualmente'
                                                        ? 'incluido_manualmente'
                                                        : 'ajustado_manualmente',
                                                  }
                                                : a
                                            ),
                                          }));
                                        }}
                                        className={`w-full px-2.5 py-1 rounded-lg text-[11px] font-bold border outline-none cursor-pointer ${
                                          isPontual
                                            ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                                            : 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                                        }`}
                                      >
                                        <option value="pontual_implantacao">
                                          Pontual (Despesa Única)
                                        </option>
                                        <option value="recorrente_manutencao">
                                          Recorrente (Base ANO)
                                        </option>
                                      </select>

                                      {isPontual ? (
                                        <div className="flex items-center justify-between gap-1.5">
                                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                            Qtd Física:
                                          </span>
                                          <div className="inline-flex items-center gap-1">
                                            <input
                                              type="number"
                                              min={0}
                                              value={item.quantidade}
                                              onChange={e =>
                                                mutatePlano(prev => ({
                                                  ...prev,
                                                  aquisicoes: prev.aquisicoes.map(a =>
                                                    a.id === item.id
                                                      ? {
                                                          ...a,
                                                          quantidade: Math.max(
                                                            0,
                                                            Number(e.target.value)
                                                          ),
                                                          fatorProporcional: 1,
                                                          origemCalculo:
                                                            a.origemCalculo ===
                                                            'incluido_manualmente'
                                                              ? 'incluido_manualmente'
                                                              : 'ajustado_manualmente',
                                                        }
                                                      : a
                                                  ),
                                                }))
                                              }
                                              className="w-16 px-2 py-0.5 text-right border border-slate-300 rounded-md font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className="text-[10px] font-bold uppercase text-slate-500">
                                              {item.unidadeMedida || 'KIT'}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <select
                                            value={item.criterioCalculo}
                                            onChange={e => {
                                              const novoCrit = e.target
                                                .value as CriterioProporcionalidade;
                                              const qtdProf =
                                                qtdProfPorInterv.get(item.intervencaoCusteioId) ||
                                                0;
                                              const calcProp = calcularProporcaoPorCriterio(
                                                novoCrit,
                                                iv,
                                                catalogos,
                                                qtdProf,
                                                novoCrit === 'percentual_utilizacao'
                                                  ? item.percentualRateio ?? 25
                                                  : item.percentualRateio
                                              );
                                              mutatePlano(prev => ({
                                                ...prev,
                                                aquisicoes: prev.aquisicoes.map(a =>
                                                  a.id === item.id
                                                    ? {
                                                        ...a,
                                                        criterioCalculo: novoCrit,
                                                        quantidade: 1,
                                                        fatorProporcional:
                                                          calcProp.fatorProporcional,
                                                        numeradorProporcao:
                                                          calcProp.numeradorProporcao,
                                                        denominadorProporcao:
                                                          calcProp.denominadorProporcao,
                                                        unidadeProporcao:
                                                          calcProp.unidadeProporcao,
                                                        percentualRateio:
                                                          calcProp.percentualRateio,
                                                        naturezaCusto: calcProp.naturezaCusto,
                                                        memoriaCalculo: calcProp.memoriaCalculo,
                                                        origemCalculo:
                                                          a.origemCalculo ===
                                                          'incluido_manualmente'
                                                            ? 'incluido_manualmente'
                                                            : 'ajustado_manualmente',
                                                      }
                                                    : a
                                                ),
                                              }));
                                            }}
                                            className="w-full min-w-0 px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                          >
                                            {Object.entries(CRITERIO_LABELS).map(([k, lbl]) => (
                                              <option key={k} value={k}>
                                                {lbl}
                                              </option>
                                            ))}
                                          </select>
                                          <div className="flex items-center justify-between gap-1.5">
                                            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                              Fator:
                                            </span>
                                            {item.criterioCalculo === 'percentual_utilizacao' ? (
                                              <div className="inline-flex items-center gap-1">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={200}
                                                  step={5}
                                                  value={item.percentualRateio ?? 0}
                                                  onChange={e => {
                                                    const pct = Math.max(
                                                      0,
                                                      Number(e.target.value)
                                                    );
                                                    mutatePlano(prev => ({
                                                      ...prev,
                                                      aquisicoes: prev.aquisicoes.map(a =>
                                                        a.id === item.id
                                                          ? {
                                                              ...a,
                                                              quantidade: 1,
                                                              percentualRateio: pct,
                                                              fatorProporcional: pct / 100,
                                                              origemCalculo:
                                                                a.origemCalculo ===
                                                                'incluido_manualmente'
                                                                  ? 'incluido_manualmente'
                                                                  : 'ajustado_manualmente',
                                                            }
                                                          : a
                                                      ),
                                                    }));
                                                  }}
                                                  className="w-16 px-2 py-0.5 text-right border border-emerald-300 bg-emerald-50/40 rounded-md text-xs font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <span className="font-bold text-slate-600">%</span>
                                              </div>
                                            ) : (
                                              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 whitespace-nowrap">
                                                {formatProporcaoResumo(item)}
                                              </span>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right w-[120px]">
                                      <CusteioCurrencyInput
                                        value={item.valorUnitario}
                                        onChange={val =>
                                          mutatePlano(prev => ({
                                            ...prev,
                                            aquisicoes: prev.aquisicoes.map(a =>
                                              a.id === item.id
                                                ? {
                                                    ...a,
                                                    valorUnitario: Math.max(0, val),
                                                    origemCalculo:
                                                      a.origemCalculo === 'incluido_manualmente'
                                                        ? 'incluido_manualmente'
                                                        : 'ajustado_manualmente',
                                                  }
                                                : a
                                            ),
                                          }))
                                        }
                                        className="w-[112px] px-2 py-1 text-right text-xs border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                                        {isPontual ? 'por kit / unid.' : 'ref. anual (ANO)'}
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-center w-[132px]">
                                      <input
                                        type="month"
                                        value={item.dataInicio}
                                        onChange={e =>
                                          mutatePlano(prev => ({
                                            ...prev,
                                            aquisicoes: prev.aquisicoes.map(a =>
                                              a.id === item.id
                                                ? {
                                                    ...a,
                                                    dataInicio: e.target.value,
                                                    dataFim:
                                                      a.tipoAquisicao === 'pontual_implantacao'
                                                        ? e.target.value
                                                        : a.dataFim,
                                                    origemCalculo:
                                                      a.origemCalculo === 'incluido_manualmente'
                                                        ? 'incluido_manualmente'
                                                        : 'ajustado_manualmente',
                                                  }
                                                : a
                                            ),
                                          }))
                                        }
                                        className="w-[122px] px-2 py-1 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                                        {isPontual
                                          ? `${item.ocorrenciasNoPeriodo}× despesa única`
                                          : `${item.ocorrenciasNoPeriodo}m (${BRL0(
                                              item.valorAnualizado
                                            )}/ano)`}
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right font-bold text-slate-900 whitespace-nowrap w-[114px]">
                                      <div className="py-1">{BRL(item.valorTotalProjetado)}</div>
                                    </td>

                                    <td className="px-2 py-2.5 align-top text-center w-[34px]">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          mutatePlano(prev => ({
                                            ...prev,
                                            aquisicoes: prev.aquisicoes.filter(
                                              a => a.id !== item.id
                                            ),
                                          }))
                                        }
                                        className="p-1 mt-0.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                        title="Remover item"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Card Totalizador Consolidado de Aquisições */}
                <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Consolidação da Categoria B — Aquisições
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      Total de <strong>{aquisicoesFiltradas.length} itens</strong> em{' '}
                      <strong>{gruposAquisicoes.length} unidade(s)</strong> exibida(s)
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-amber-700">
                        Pontuais (Despesa Única)
                      </div>
                      <div className="text-base font-extrabold text-amber-800 whitespace-nowrap">
                        {BRL(totalPontualAqFiltradas)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-emerald-700">
                        Recorrentes (No Período)
                      </div>
                      <div className="text-base font-extrabold text-emerald-800 whitespace-nowrap">
                        {BRL(totalRecorrenteAqFiltradas)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-blue-700">
                        Total Projetado no Período
                      </div>
                      <div className="text-xl font-black text-blue-800 whitespace-nowrap">
                        {BRL(totalPeriodoAqFiltradas)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                ABA 4 — CATEGORIA C: PESSOAL E FOLHA DE PAGAMENTO
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'pessoal' && (
              <div className="space-y-5">
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-purple-900 leading-relaxed">
                    <strong>Dimensionamento de Pessoal em Paridade com os Modelos:</strong> Novas creches carregam exatamente o quadro de servidores do Modelo FNDE associado. Ampliações incrementais adicionam Professores e Monitores das novas turmas, mantendo Direção e Coordenação como <em>Compartilhadas (Qtd 0)</em> salvo necessidade específica ajustada abaixo. O custo anual aplica <strong>13,33 salários/ano</strong> (12 meses + 13º + 1/3 de férias).
                  </div>
                </div>

                {(['pedagogico', 'administrativo', 'apoio'] as const).map(catCargo => {
                  const lista = pessoalFiltrado.filter(p => p.categoriaCargo === catCargo);
                  const titulo =
                    catCargo === 'pedagogico'
                      ? 'Quadro Pedagógico (Professores, Monitores e Coordenação)'
                      : catCargo === 'administrativo'
                      ? 'Quadro Administrativo e Gestão Escolar'
                      : 'Quadro de Apoio Operacional (Nutrição e Limpeza)';

                  const qtdProfGrupo = lista.reduce((acc, p) => {
                    const iv = mapInterv.get(p.intervencaoCusteioId);
                    return iv && !iv.ativoNoCusteio ? acc : acc + p.quantidade;
                  }, 0);
                  const anualGrupo = lista.reduce((acc, p) => {
                    const iv = mapInterv.get(p.intervencaoCusteioId);
                    return iv && !iv.ativoNoCusteio ? acc : acc + p.valorAnualizado;
                  }, 0);
                  const totalPeriodoGrupo = lista.reduce(
                    (acc, p) => acc + p.valorTotalProjetado,
                    0
                  );

                  return (
                    <div
                      key={catCargo}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                    >
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-800 text-sm">{titulo}</h3>
                        <button
                          type="button"
                          onClick={() => handleAddPessoalManual(catCargo)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-2xs shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Adicionar Cargo
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-xs">
                          <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                            <tr>
                              <th className="text-left px-3 py-2.5 font-bold min-w-[215px]">
                                Cargo / Função & Unidade Escolar
                              </th>
                              <th className="text-center px-2 py-2.5 font-bold w-[62px]">
                                <span className="inline-flex items-center gap-1">
                                  Qtd
                                  <FieldTooltip text="Número de profissionais deste cargo na intervenção. Alterar este número também atualiza automaticamente o cálculo de Uniformes/EPIs na aba Aquisições." />
                                </span>
                              </th>
                              <th className="text-right px-2 py-2.5 font-bold w-[102px]">
                                <span className="inline-flex items-center gap-1 justify-end">
                                  Rem. Base
                                  <FieldTooltip text="Vencimento mensal base do servidor conforme tabela salarial de referência." />
                                </span>
                              </th>
                              <th className="text-right px-2 py-2.5 font-bold w-[90px]">
                                <span className="inline-flex items-center gap-1 justify-end">
                                  Auxílios
                                  <FieldTooltip text="Benefícios mensais (auxílio-alimentação, transporte, etc.) por servidor." />
                                </span>
                              </th>
                              <th className="text-right px-2 py-2.5 font-bold w-[94px]">
                                <span className="inline-flex items-center gap-1 justify-end">
                                  Encargos
                                  <FieldTooltip text="Encargos previdenciários e patronais mensais incidentes sobre o cargo." />
                                </span>
                              </th>
                              <th className="text-right px-2.5 py-2.5 font-bold w-[112px] whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 justify-end">
                                  Anual (×13,33)
                                  <FieldTooltip
                                    title="Folha Anualizada da Linha"
                                    text="Considera os 12 meses salariais + 13º salário integral + 1/3 constitucional de férias (fator 13,33), multiplicados pela Qtd de profissionais."
                                    formula="(Base + Auxílios + Encargos) × 13,33 × Qtd"
                                  />
                                </span>
                              </th>
                              <th className="text-right px-3 py-2.5 font-bold w-[116px] whitespace-nowrap">
                                Total no Período
                              </th>
                              <th className="text-center px-2 py-2.5 w-[32px]"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lista.map(item => {
                              const iv = mapInterv.get(item.intervencaoCusteioId);
                              const isManual = item.origemCalculo !== 'automatico';
                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50 ${
                                    isManual
                                      ? 'bg-amber-50/30'
                                      : item.quantidade === 0
                                      ? 'bg-slate-50/70 text-slate-400'
                                      : ''
                                  }`}
                                >
                                  <td className="px-3 py-2.5 align-top min-w-[215px]">
                                    <select
                                      value={item.funcao}
                                      onChange={e => {
                                        const cg = catalogos.cargosRef.find(
                                          c => c.descricao === e.target.value
                                        );
                                        mutatePlano(prev => ({
                                          ...prev,
                                          pessoal: prev.pessoal.map(p =>
                                            p.id === item.id
                                              ? {
                                                  ...p,
                                                  funcao: e.target.value,
                                                  descricao: e.target.value,
                                                  remuneracaoBase: cg
                                                    ? cg.remuneracaoBase
                                                    : p.remuneracaoBase,
                                                  auxilios: cg ? cg.auxilios : p.auxilios,
                                                  patronalUnitario: cg
                                                    ? cg.patronal
                                                    : p.patronalUnitario,
                                                  origemCalculo:
                                                    p.origemCalculo === 'incluido_manualmente'
                                                      ? 'incluido_manualmente'
                                                      : 'ajustado_manualmente',
                                                }
                                              : p
                                          ),
                                        }));
                                      }}
                                      className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-800 w-full min-w-[185px] outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                      {!catalogos.cargosRef.some(
                                        c => c.descricao === item.funcao
                                      ) && <option value={item.funcao}>{item.funcao}</option>}
                                      {catalogos.cargosRef.map(cg => (
                                        <option key={cg.id} value={cg.descricao}>
                                          {cg.descricao}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-100 text-[10px] font-semibold">
                                        {iv?.nomeUnidadeOuObra || 'Global'}
                                      </span>
                                      {isManual && (
                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                                          {item.origemCalculo === 'incluido_manualmente'
                                            ? 'Incluído Manual'
                                            : 'Ajuste Manual'}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-500">
                                        {item.cargaHoraria} · {item.memoriaCalculo}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-2 py-2.5 align-top text-center w-[62px]">
                                    <input
                                      type="number"
                                      min={0}
                                      value={item.quantidade}
                                      onChange={e =>
                                        mutatePlano(prev => ({
                                          ...prev,
                                          pessoal: prev.pessoal.map(p =>
                                            p.id === item.id
                                              ? {
                                                  ...p,
                                                  quantidade: Math.max(0, Number(e.target.value)),
                                                  numeradorProporcao: Math.max(
                                                    0,
                                                    Number(e.target.value)
                                                  ),
                                                  naturezaCusto:
                                                    Number(e.target.value) > 0
                                                      ? 'exclusivo_intervencao'
                                                      : 'compartilhado_rede',
                                                  origemCalculo:
                                                    p.origemCalculo === 'incluido_manualmente'
                                                      ? 'incluido_manualmente'
                                                      : 'ajustado_manualmente',
                                                }
                                              : p
                                          ),
                                        }))
                                      }
                                      className="w-14 px-1.5 py-1 text-center font-black border border-slate-300 rounded-lg text-slate-800 bg-white outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="px-2 py-2.5 align-top text-right w-[102px]">
                                    <CusteioCurrencyInput
                                      value={item.remuneracaoBase}
                                      onChange={val =>
                                        mutatePlano(prev => ({
                                          ...prev,
                                          pessoal: prev.pessoal.map(p =>
                                            p.id === item.id
                                              ? {
                                                  ...p,
                                                  remuneracaoBase: Math.max(0, val),
                                                  origemCalculo:
                                                    p.origemCalculo === 'incluido_manualmente'
                                                      ? 'incluido_manualmente'
                                                      : 'ajustado_manualmente',
                                                }
                                              : p
                                          ),
                                        }))
                                      }
                                      className="w-[94px] px-2 py-1 text-right text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="px-2 py-2.5 align-top text-right w-[90px]">
                                    <CusteioCurrencyInput
                                      value={item.auxilios}
                                      onChange={val =>
                                        mutatePlano(prev => ({
                                          ...prev,
                                          pessoal: prev.pessoal.map(p =>
                                            p.id === item.id
                                              ? {
                                                  ...p,
                                                  auxilios: Math.max(0, val),
                                                  origemCalculo:
                                                    p.origemCalculo === 'incluido_manualmente'
                                                      ? 'incluido_manualmente'
                                                      : 'ajustado_manualmente',
                                                }
                                              : p
                                          ),
                                        }))
                                      }
                                      className="w-[82px] px-2 py-1 text-right text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="px-2 py-2.5 align-top text-right w-[94px]">
                                    <CusteioCurrencyInput
                                      value={item.patronalUnitario}
                                      onChange={val =>
                                        mutatePlano(prev => ({
                                          ...prev,
                                          pessoal: prev.pessoal.map(p =>
                                            p.id === item.id
                                              ? {
                                                  ...p,
                                                  patronalUnitario: Math.max(0, val),
                                                  origemCalculo:
                                                    p.origemCalculo === 'incluido_manualmente'
                                                      ? 'incluido_manualmente'
                                                      : 'ajustado_manualmente',
                                                }
                                              : p
                                          ),
                                        }))
                                      }
                                      className="w-[86px] px-2 py-1 text-right text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                  </td>
                                  <td className="px-2.5 py-2.5 align-top text-right w-[112px]">
                                    <div className="font-semibold text-slate-800 whitespace-nowrap py-1">
                                      {BRL(item.valorAnualizado)}
                                    </div>
                                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                      Unit.: {BRL(item.custoMensalUnitario)}/m
                                    </div>
                                  </td>
                                  <td className="px-3 py-2.5 align-top text-right w-[116px]">
                                    <div className="font-bold text-purple-700 whitespace-nowrap py-1">
                                      {BRL(item.valorTotalProjetado)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 whitespace-nowrap">
                                      {item.ocorrenciasNoPeriodo}m ativos
                                    </div>
                                  </td>
                                  <td className="px-2 py-2.5 align-top text-center w-[32px]">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        mutatePlano(prev => ({
                                          ...prev,
                                          pessoal: prev.pessoal.filter(p => p.id !== item.id),
                                        }))
                                      }
                                      className="p-1 mt-0.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                      title="Remover cargo"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-slate-800 font-bold">
                            <tr>
                              <td className="px-3 py-2.5">
                                Subtotal — {titulo.split(' (')[0]}
                              </td>
                              <td className="px-2 py-2.5 text-center whitespace-nowrap">
                                {qtdProfGrupo} prof.
                              </td>
                              <td colSpan={3}></td>
                              <td className="px-2.5 py-2.5 text-right text-emerald-800 whitespace-nowrap">
                                {BRL(anualGrupo)}/ano
                              </td>
                              <td className="px-3 py-2.5 text-right text-purple-800 font-black whitespace-nowrap">
                                {BRL(totalPeriodoGrupo)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  );
                })}

                {/* Card Totalizador Consolidado de Pessoal */}
                <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
                      Consolidação da Categoria C — Pessoal e Folha de Pagamento
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      Total de{' '}
                      <strong>
                        {pessoalFiltrado.reduce((s, p) => s + p.quantidade, 0)} profissionais
                      </strong>{' '}
                      nas unidades exibidas
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-slate-500">
                        Folha Anual (Regime)
                      </div>
                      <div className="text-lg font-extrabold text-emerald-700">
                        {BRL(
                          pessoalFiltrado.reduce((acc, p) => {
                            const iv = mapInterv.get(p.intervencaoCusteioId);
                            return iv && !iv.ativoNoCusteio ? acc : acc + p.valorAnualizado;
                          }, 0)
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-purple-700">
                        Total Projetado no Período
                      </div>
                      <div className="text-xl font-black text-purple-800">
                        {BRL(pessoalFiltrado.reduce((s, p) => s + p.valorTotalProjetado, 0))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                ABA 5 — CRONOGRAMA FINANCEIRO & SIMULAÇÃO INTEGRADA
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'cronograma' && (
              <div className="space-y-6">
                {/* Painel de Simulação Integrada */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-blue-600" />
                      <h2 className="text-base font-bold text-slate-800">
                        Simulador Integrado de Reajuste Anual Composto
                      </h2>
                      <FieldTooltip
                        title="Cálculo de Correção Anual Composta"
                        text="Aplica correção inflacionária composta a partir do 2º exercício do plano sobre o ano-base inicial."
                        formula="Valor no Ano = Base Mensal × (1 + Taxa)^(Ano − AnoInicial)"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        Base Automática Sem Reajuste:{' '}
                        <strong className="text-slate-800">{BRL0(baselineAutomaticoAtual)}</strong>
                      </span>
                      {((plano.parametrosSimulacao.taxaReajusteAnualServicos || 0) > 0 ||
                        (plano.parametrosSimulacao.taxaReajusteAnualAquisicoes || 0) > 0 ||
                        (plano.parametrosSimulacao.taxaReajusteAnualPessoal || 0) > 0) && (
                        <button
                          type="button"
                          onClick={() =>
                            mutatePlano(prev => ({
                              ...prev,
                              parametrosSimulacao: {
                                ...prev.parametrosSimulacao,
                                taxaReajusteAnualServicos: 0,
                                taxaReajusteAnualAquisicoes: 0,
                                taxaReajusteAnualPessoal: 0,
                              },
                            }))
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                        >
                          Zerar Reajustes
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                        <span className="inline-flex items-center gap-1">
                          Reajuste Anual — Serviços
                          <FieldTooltip text="Simula correção contratual anual (ex.: IPCA/IGP-M) sobre os contratos de limpeza, vigilância, internet e manutenção." />
                        </span>
                        <span className="text-blue-700">
                          {plano.parametrosSimulacao.taxaReajusteAnualServicos}% a.a.
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={15}
                        step={0.5}
                        value={plano.parametrosSimulacao.taxaReajusteAnualServicos}
                        onChange={e =>
                          mutatePlano(prev => ({
                            ...prev,
                            parametrosSimulacao: {
                              ...prev.parametrosSimulacao,
                              taxaReajusteAnualServicos: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                        <span className="inline-flex items-center gap-1">
                          Reajuste Anual — Aquisições
                          <FieldTooltip text="Simula variação anual de preços sobre insumos recorrentes e kits previstos em anos subsequentes ao ano-base." />
                        </span>
                        <span className="text-amber-700">
                          {plano.parametrosSimulacao.taxaReajusteAnualAquisicoes}% a.a.
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={15}
                        step={0.5}
                        value={plano.parametrosSimulacao.taxaReajusteAnualAquisicoes}
                        onChange={e =>
                          mutatePlano(prev => ({
                            ...prev,
                            parametrosSimulacao: {
                              ...prev.parametrosSimulacao,
                              taxaReajusteAnualAquisicoes: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                        <span className="inline-flex items-center gap-1">
                          Reajuste Anual — Folha / Pessoal
                          <FieldTooltip text="Simula revisão geral anual ou reajuste do Piso Nacional do Magistério nos exercícios seguintes." />
                        </span>
                        <span className="text-purple-700">
                          {plano.parametrosSimulacao.taxaReajusteAnualPessoal}% a.a.
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={15}
                        step={0.5}
                        value={plano.parametrosSimulacao.taxaReajusteAnualPessoal}
                        onChange={e =>
                          mutatePlano(prev => ({
                            ...prev,
                            parametrosSimulacao: {
                              ...prev.parametrosSimulacao,
                              taxaReajusteAnualPessoal: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Gráfico de Evolução Anual por Categoria */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-base mb-4">
                    Projeção Anual de Desembolso por Categoria
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={cronogramaAnual}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="ano" stroke="#64748b" tick={{ fontSize: 12 }} />
                      <YAxis
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        tickFormatter={v => `R$ ${(v / 1000000).toFixed(1)}M`}
                      />
                      <RechartsTooltip formatter={(val: number) => BRL(val)} />
                      <Legend />
                      <Bar dataKey="pessoal" name="Pessoal e Folha" stackId="a" fill="#7c3aed" />
                      <Bar
                        dataKey="aquisicoesRecorrentes"
                        name="Aquisições Recorrentes"
                        stackId="a"
                        fill="#10b981"
                      />
                      <Bar dataKey="servicos" name="Serviços" stackId="a" fill="#2563eb" />
                      <Bar
                        dataKey="aquisicoesPontuais"
                        name="Aquisições Pontuais (Implantação)"
                        stackId="a"
                        fill="#f59e0b"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabela Cronograma Anual ou Mensal */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Matriz de Desembolso Operacional (
                      {visaoCronograma === 'anual' ? 'Visão Anual por Exercício' : 'Visão Mensal Mês a Mês'})
                    </h3>
                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setVisaoCronograma('anual')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          visaoCronograma === 'anual'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Por Ano
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisaoCronograma('mensal')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          visaoCronograma === 'mensal'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Por Mês
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[520px]">
                    <table className="w-full min-w-[660px] text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-bold whitespace-nowrap">
                            {visaoCronograma === 'anual' ? 'Exercício' : 'Competência'}
                          </th>
                          <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Serviços</th>
                          <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Aq. Pontuais (Única)</th>
                          <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Aq. Recorrentes</th>
                          <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Pessoal e Folha</th>
                          <th className="text-right px-4 py-3 font-bold bg-blue-50 text-blue-900 whitespace-nowrap">
                            Total do Período
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visaoCronograma === 'anual'
                          ? cronogramaAnual.map(row => (
                              <tr key={row.ano} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-black text-slate-800">
                                  {row.ano}{' '}
                                  <span className="text-[10px] font-normal text-slate-500">
                                    ({row.mesesNoPlano} meses)
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">{BRL(row.servicos)}</td>
                                <td className="px-4 py-3 text-right text-amber-700 font-semibold">
                                  {BRL(row.aquisicoesPontuais)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {BRL(row.aquisicoesRecorrentes)}
                                </td>
                                <td className="px-4 py-3 text-right">{BRL(row.pessoal)}</td>
                                <td className="px-4 py-3 text-right font-extrabold bg-blue-50/40 text-blue-900">
                                  {BRL(row.total)}
                                </td>
                              </tr>
                            ))
                          : cronogramaMensal.map(row => (
                              <tr key={row.competencia} className="hover:bg-slate-50">
                                <td className="px-4 py-2.5 font-bold text-slate-800">
                                  {formatYMDisplay(row.competencia)}
                                </td>
                                <td className="px-4 py-2.5 text-right">{BRL(row.servicos)}</td>
                                <td className="px-4 py-2.5 text-right text-amber-700 font-semibold">
                                  {row.aquisicoesPontuais > 0 ? BRL(row.aquisicoesPontuais) : '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  {BRL(row.aquisicoesRecorrentes)}
                                </td>
                                <td className="px-4 py-2.5 text-right">{BRL(row.pessoal)}</td>
                                <td className="px-4 py-2.5 text-right font-bold bg-blue-50/40 text-blue-900">
                                  {BRL(row.total)}
                                </td>
                              </tr>
                            ))}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-slate-900 font-bold sticky bottom-0">
                        <tr>
                          <td className="px-4 py-3 font-black">
                            TOTAL ACUMULADO ({cronogramaMensal.length} meses)
                          </td>
                          <td className="px-4 py-3 text-right">
                            {BRL(resumoFinanceiro.totalServicosPeriodo)}
                          </td>
                          <td className="px-4 py-3 text-right text-amber-800">
                            {BRL(resumoFinanceiro.totalAquisicoesPontuaisPeriodo)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-800">
                            {BRL(resumoFinanceiro.totalAquisicoesRecorrentesPeriodo)}
                          </td>
                          <td className="px-4 py-3 text-right text-purple-800">
                            {BRL(resumoFinanceiro.totalPessoalPeriodo)}
                          </td>
                          <td className="px-4 py-3 text-right font-black bg-blue-100/70 text-blue-900">
                            {BRL(resumoFinanceiro.totalGeralPeriodo)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                ABA 6 — RELATÓRIO CONSOLIDADO
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'relatorio' && (
              <PlanoCusteioReportDocument
                planoCusteio={{
                  ...plano,
                  servicos: projecao.servicos,
                  aquisicoes: projecao.aquisicoes,
                  pessoal: projecao.pessoal,
                  resumoFinanceiro: {
                    ...projecao.resumoFinanceiro,
                    totalInicialAutomatico: baselineAutomaticoAtual,
                  },
                }}
                planoExpansao={planoExpansao}
                showToolbar={true}
              />
            )}

            {/* Navegação Inferior entre Etapas (Padrão PlanoForm) */}
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm print:hidden">
              <button
                type="button"
                disabled={currentTabIdx === 0}
                onClick={() => setActiveTab(TABS[Math.max(0, currentTabIdx - 1)].id)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Etapa Anterior
              </button>

              <span className="text-xs text-slate-500 font-semibold">
                Etapa {currentTabIdx + 1} de {TABS.length}:{' '}
                <strong className="text-slate-800">{TABS[currentTabIdx]?.label}</strong>
              </span>

              {currentTabIdx < TABS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(TABS[currentTabIdx + 1].id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  Próxima Etapa
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSavePlano}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar Versão
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Confirmar Restauração de Padrão */}
      <CusteioConfirmModal
        isOpen={isRestoreModalOpen}
        variant="warning"
        title="Restaurar Estimativa Automática Padrão?"
        description="Esta ação redefinirá todos os itens de Serviços, Aquisições e Pessoal para os valores proporcionais originais dos catálogos e zerará as taxas de reajuste anual."
        detailBox={`${totalItensManuais} item(ns) ajustado(s) ou incluído(s) manualmente serão substituídos pelos parâmetros oficiais dos Modelos de Creche.`}
        confirmLabel="Sim, Restaurar Padrão"
        onConfirm={executeRestaurarPadraoAutomatico}
        onCancel={() => setIsRestoreModalOpen(false)}
      />

      {/* Modal: Confirmar Saída com Alterações Não Salvas */}
      <CusteioConfirmModal
        isOpen={isExitModalOpen}
        variant="warning"
        title="Sair sem salvar alterações?"
        description="Você realizou edições ou simulações neste Plano de Custeio que ainda não foram gravadas. Deseja descartar as alterações não salvas?"
        detailBox={plano.nome}
        confirmLabel="Descartar e Voltar"
        cancelLabel="Continuar Editando"
        onConfirm={() => {
          setIsExitModalOpen(false);
          onBack();
        }}
        onCancel={() => setIsExitModalOpen(false)}
      />
    </div>
  );
}
