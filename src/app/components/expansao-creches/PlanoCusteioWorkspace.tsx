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
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Clock,
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
  ItemCusteioMobiliario,
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
  obterPeriodoExpansaoYM,
  detectarDivergenciasExpansaoCusteio,
  sincronizarPlanoCusteioComExpansao,
  calcularSustentabilidadeFiscalCusteio,
  parseYM,
  formatYM,
  nextMonthAfterDate,
} from './utils/custeioCalculator';
import { sincronizarCusteioParaExpansao } from './utils/custeioMigration';
import { getActivities } from './Kanban';
import PlanoCusteioReportDocument from './PlanoCusteioReportDocument';
import {
  FieldTooltip,
  CusteioCurrencyInput,
  CusteioConfirmModal,
} from './components/FieldTooltip';

export type WorkspaceTabId =
  | 'visao-geral'
  | 'mobiliario'
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
        baselineAutomaticoAtual,
        plano.mobiliario
      ),
    [
      plano.dataInicio,
      plano.dataFim,
      plano.intervencoes,
      plano.mobiliario,
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

  // Detecção reativa de divergências entre o Plano de Expansão atual e o Plano de Custeio
  const divergenciasExpansao = useMemo(
    () => detectarDivergenciasExpansaoCusteio(planoExpansao, plano, catalogos),
    [planoExpansao, plano, catalogos]
  );

  // Sustentabilidade Fiscal (FUNDEB / PNAE / MDE) e Fluxo Consolidado TCO (CAPEX + OPEX)
  const sustentabilidadeFiscal = useMemo(
    () => calcularSustentabilidadeFiscalCusteio(plano, projecao, planoExpansao),
    [plano, projecao, planoExpansao]
  );

  // Cruzamento com progresso físico e prazos do Kanban de obras/ações
  const progressoKanbanPorInterv = useMemo(() => {
    const allActs = getActivities();
    const m = new Map<
      string,
      { total: number; feito: number; pct: number; maxDeadline?: string; suggestedStartYM?: string; atrasoKanban: boolean }
    >();
    plano.intervencoes.forEach(iv => {
      const itemType = iv.origemTipo === 'obra' ? 'obra' : 'acao-unidade';
      const acts = allActs.filter(a => a.itemId === iv.origemId && a.itemType === itemType);
      if (acts.length > 0) {
        const feito = acts.filter(a => a.status === 'FEITO').length;
        const pendentes = acts.filter(a => a.status !== 'FEITO' && a.deadline);
        const maxDeadline =
          pendentes.length > 0
            ? pendentes.map(a => a.deadline).reduce((a, b) => (a > b ? a : b))
            : undefined;
        const suggestedStartYM = maxDeadline
          ? nextMonthAfterDate(maxDeadline, iv.dataInicioOperacao)
          : undefined;
        const atrasoKanban = Boolean(
          suggestedStartYM && suggestedStartYM > iv.dataInicioOperacao
        );
        m.set(iv.id, {
          total: acts.length,
          feito,
          pct: Math.round((feito / acts.length) * 100),
          maxDeadline,
          suggestedStartYM,
          atrasoKanban,
        });
      }
    });
    return m;
  }, [plano.intervencoes]);

  const handleAplicarNoPlanoExpansao = (aplicarDatasCronograma: boolean = false) => {
    const updatedExp = sincronizarCusteioParaExpansao(plano, { aplicarDatasCronograma });
    if (updatedExp) {
      toast.success(
        aplicarDatasCronograma
          ? 'Escopo de enxoval (CAPEX/OPEX), turmas e datas de conclusão foram atualizados no Plano de Expansão!'
          : 'Escopo de enxoval (CAPEX/OPEX) e configuração de turmas sincronizados com o Plano de Expansão!'
      );
    }
  };

  const handleSincronizarComExpansao = (ajustarInicio: boolean = false) => {
    if (!planoExpansao) return;
    const sincronizado = sincronizarPlanoCusteioComExpansao(
      plano,
      planoExpansao,
      catalogos,
      ajustarInicio
    );
    setPlano(sincronizado);
    setIsDirty(true);
    toast.success(
      ajustarInicio
        ? `Plano sincronizado com o Plano de Expansão e início ajustado para ${formatYMDisplay(sincronizado.dataInicio)}!`
        : 'Intervenções e itens automáticos sincronizados com o Plano de Expansão (ajustes manuais preservados)!'
    );
  };

  const postergarInicioIntervencao = (intervId: string, meses: number) => {
    const iv = mapInterv.get(intervId);
    if (!iv) return;
    const { year, month } = parseYM(iv.dataInicioOperacao);
    const totalMonths = year * 12 + (month - 1) + meses;
    const newY = Math.floor(totalMonths / 12);
    const newM = (totalMonths % 12) + 1;
    const novoYM = formatYM(newY, newM);
    updateIntervencao(intervId, { dataInicioOperacao: novoYM }, true);
    toast.info(
      `Início de operação de "${iv.nomeUnidadeOuObra}" simulado para ${formatYMDisplay(novoYM)} (+${meses} meses).`
    );
  };

  const qtdProfPorInterv = useMemo(() => {
    const m = new Map<string, number>();
    projecao.pessoal.forEach(p => {
      m.set(p.intervencaoCusteioId, (m.get(p.intervencaoCusteioId) || 0) + (p.quantidade || 0));
    });
    return m;
  }, [projecao.pessoal]);

  const totalItensManuais = useMemo(() => {
    const m = (plano.mobiliario || []).filter(i => i.origemCalculo !== 'automatico').length;
    const s = plano.servicos.filter(i => i.origemCalculo !== 'automatico').length;
    const a = plano.aquisicoes.filter(i => i.origemCalculo !== 'automatico').length;
    const p = plano.pessoal.filter(i => i.origemCalculo !== 'automatico').length;
    return m + s + a + p;
  }, [plano.mobiliario, plano.servicos, plano.aquisicoes, plano.pessoal]);

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
      mobiliario?: ItemCusteioMobiliario[];
      servicos: ItemCusteioServico[];
      aquisicoes: ItemCusteioAquisicao[];
      pessoal: ItemCusteioPessoal[];
    },
    showFeedback = false
  ) => {
    const intervAlinhadas = overrideIntervencoes.map(iv => ({
      ...iv,
      dataInicioOperacao:
        overrideDataInicio !== plano.dataInicio ||
        iv.dataInicioOperacao < overrideDataInicio ||
        iv.dataInicioOperacao > overrideDataFim
          ? overrideDataInicio
          : iv.dataInicioOperacao,
      dataFimOperacao: overrideDataFim,
    }));

    const baseExisting = overrideExisting || {
      mobiliario: plano.mobiliario,
      servicos: plano.servicos,
      aquisicoes: plano.aquisicoes,
      pessoal: plano.pessoal,
    };

    const regenerados = gerarEstimativaItensProporcionais(
      intervAlinhadas,
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
      intervencoes: intervAlinhadas,
      mobiliario: regenerados.mobiliario,
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
    const intervAlinhadas = plano.intervencoes.map(iv => ({
      ...iv,
      dataInicioOperacao: plano.dataInicio,
      dataFimOperacao: plano.dataFim,
      escopoImplantacaoMobiliario: 'incluido_no_custeio' as const,
    }));

    const regenerados = gerarEstimativaItensProporcionais(
      intervAlinhadas,
      catalogos,
      plano.dataInicio,
      plano.dataFim,
      undefined,
      false
    );

    const novaProj = calcularProjecaoPlanoCusteio(
      plano.dataInicio,
      plano.dataFim,
      intervAlinhadas,
      regenerados.servicos,
      regenerados.aquisicoes,
      regenerados.pessoal,
      {
        taxaReajusteAnualServicos: 0,
        taxaReajusteAnualAquisicoes: 0,
        taxaReajusteAnualPessoal: 0,
        observacoesCenario: plano.parametrosSimulacao.observacoesCenario,
      },
      0,
      regenerados.mobiliario
    );

    mutatePlano(prev => ({
      ...prev,
      intervencoes: intervAlinhadas,
      mobiliario: novaProj.mobiliario,
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
    toast.success('Estimativa automática restaurada com base nos Modelos de Creche oficiais.');
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
      mobiliario: projecao.mobiliario,
      servicos: projecao.servicos,
      aquisicoes: projecao.aquisicoes,
      pessoal: projecao.pessoal,
      resumoFinanceiro: projecao.resumoFinanceiro,
    };

    setPlano(atualizado);
    setIsDirty(false);
    sincronizarCusteioParaExpansao(atualizado, { aplicarDatasCronograma: false });
    onSave(atualizado);
    toast.success(`Plano de Custeio salvo e sincronizado com o Plano de Expansão (Versão ${atualizado.versao})!`);
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
        mobiliario?: ItemCusteioMobiliario[];
        servicos: ItemCusteioServico[];
        aquisicoes: ItemCusteioAquisicao[];
        pessoal: ItemCusteioPessoal[];
      }
      | undefined;

    if (currentIv && patch.dataInicioOperacao && patch.dataInicioOperacao !== currentIv.dataInicioOperacao) {
      const oldOp = currentIv.dataInicioOperacao;
      const newOp = patch.dataInicioOperacao;
      existingOverride = {
        mobiliario: (plano.mobiliario || []).map(m =>
          m.intervencaoCusteioId === intervId
            ? { ...m, dataInicio: newOp, dataFim: newOp }
            : m
        ),
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

  const handleAddMobiliarioManual = (targetIntervId?: string) => {
    const defaultInterv =
      targetIntervId ||
      (filtroIntervencao !== 'todas'
        ? filtroIntervencao
        : plano.intervencoes[0]?.id || 'global');
    const iv = mapInterv.get(defaultInterv);
    const startRef = iv?.dataInicioOperacao || plano.dataInicio;

    const novo: ItemCusteioMobiliario = {
      id: `mob-man-${Date.now()}`,
      categoria: 'mobiliario',
      intervencaoCusteioId: defaultInterv,
      descricao: 'AMBIENTE / KIT DE MOBILIÁRIO COMPLEMENTAR',
      valorMobiliarioUnitario: 8000,
      valorEquipamentosUnitario: 4000,
      resumoItensAmbiente: 'Itens de mobiliário e equipamentos adicionais incluídos manualmente',
      incluidoNoCusteio: true,
      criterioCalculo: 'por_ambiente',
      fatorProporcional: 1,
      numeradorProporcao: 1,
      denominadorProporcao: 1,
      unidadeProporcao: 'amb.',
      memoriaCalculo: 'Ambiente ou kit de mobiliário incluído manualmente (implantação única)',
      naturezaCusto: 'exclusivo_intervencao',
      periodicidade: 'unica',
      unidadeMedida: 'AMB',
      quantidade: 1,
      valorUnitario: 12000,
      dataInicio: startRef,
      dataFim: startRef,
      ocorrenciasNoPeriodo: 1,
      valorAnualizado: 12000,
      valorTotalProjetado: 12000,
      origemCalculo: 'incluido_manualmente',
    };
    mutatePlano(prev => ({
      ...prev,
      mobiliario: [novo, ...(prev.mobiliario || projecao.mobiliario)],
    }));
    toast.info('Ambiente / Mobiliário adicionado ao Plano de Custeio.');
  };

  const handleAddPessoalManual = (
    catCargo: ItemCusteioPessoal['categoriaCargo'] = 'pedagogico',
    targetIntervId?: string
  ) => {
    const defaultInterv =
      targetIntervId ||
      (filtroIntervencao !== 'todas'
        ? filtroIntervencao
        : plano.intervencoes[0]?.id || 'global');
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
  const mobiliarioFiltrado = projecao.mobiliario.filter(
    m => filtroIntervencao === 'todas' || m.intervencaoCusteioId === filtroIntervencao
  );
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

  // Agrupamento por Unidade Escolar / Intervenção para todas as 4 abas (Mobiliário, Serviços, Aquisições, Pessoal)
  const gruposMobiliario = useMemo(() => {
    const grupos: {
      id: string;
      intervencao?: IntervencaoCusteioVinculada;
      itens: ItemCusteioMobiliario[];
    }[] = [];
    const porId = new Map<string, ItemCusteioMobiliario[]>();
    for (const item of mobiliarioFiltrado) {
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
  }, [mobiliarioFiltrado, plano.intervencoes, mapInterv]);

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

  const gruposPessoal = useMemo(() => {
    const grupos: {
      id: string;
      intervencao?: IntervencaoCusteioVinculada;
      itens: ItemCusteioPessoal[];
    }[] = [];
    const porId = new Map<string, ItemCusteioPessoal[]>();
    for (const item of pessoalFiltrado) {
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
  }, [pessoalFiltrado, plano.intervencoes, mapInterv]);

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
        id: 'mobiliario',
        group: 'categorias',
        label: 'Mobiliário & Equip.',
        desc: BRL0(resumoFinanceiro.totalMobiliarioPeriodo),
        icon: <Layers className="w-4 h-4" />,
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
        desc: BRL0(resumoFinanceiro.totalAquisicoesRecorrentesPeriodo),
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
        desc: `${cronogramaMensal.length} meses · Evolução`,
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
  const totalBaseMobFiltrado = mobiliarioFiltrado.reduce((acc, m) => {
    const iv = mapInterv.get(m.intervencaoCusteioId);
    return iv && !iv.ativoNoCusteio ? acc : acc + m.valorAnualizado;
  }, 0);
  const totalPeriodoMobFiltrado = mobiliarioFiltrado.reduce(
    (acc, m) => acc + m.valorTotalProjetado,
    0
  );

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
      <div className="p-6">
        {/* Cabeçalho discreto idêntico ao PlanoForm */}
        <div className="mb-5 print:hidden">
          <button
            type="button"
            onClick={handleBackClick}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar aos Planos de Custeio
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                <h1 className="text-3xl font-bold text-slate-800">{plano.nome}</h1>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {plano.cenarioLabel} · v{plano.versao}
                </span>
                <select
                  value={plano.status}
                  onChange={e =>
                    mutatePlano(prev => ({ ...prev, status: e.target.value as StatusPlanoCusteio }))
                  }
                  aria-label="Status do Plano de Custeio"
                  className="px-2.5 py-0.5 rounded-md text-xs font-semibold border border-slate-300 bg-white text-slate-700 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Rascunho">Rascunho</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Aprovado">Aprovado</option>
                  <option value="Arquivado">Arquivado</option>
                </select>
                {isDirty && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Alterações não salvas
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>
                  Plano de Expansão:{' '}
                  <strong className="text-slate-700">
                    {planoExpansao
                      ? planoExpansao.nome || planoExpansao.name
                      : plano.planoExpansaoId}
                  </strong>
                </span>
                {planoExpansao && (
                  <span>
                    · Período da Expansão: <strong className="text-slate-700">{obterPeriodoExpansaoYM(planoExpansao).label}</strong>
                  </span>
                )}
                <span>
                  · Vigência do Custeio:{' '}
                  <strong className="text-blue-700">
                    {formatYMDisplay(plano.dataInicio)} a {formatYMDisplay(plano.dataFim)} ({cronogramaMensal.length} meses)
                  </strong>
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
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
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                title="Atualiza itens automáticos conforme catálogos e salas/turmas, preservando ajustes manuais"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Recalcular
              </button>

              <button
                type="button"
                onClick={handleRequestRestaurarPadrao}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                title="Desfaz ajustes manuais e restaura 100% do padrão dos catálogos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Padrão
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            LAYOUT IDÊNTICO AO PLANO DE EXPANSÃO: SIDEBAR LATERAL + CARD PRINCIPAL
           ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex gap-5 items-start print:block">
          {/* ── LEFT SIDEBAR NAV (Padrão PlanoForm) ── */}
          <aside className="w-56 shrink-0 bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6 print:hidden">
            <div className="bg-gradient-to-br from-[#1a3a5c] to-[#2563eb] p-4">
              <p className="text-white font-bold text-sm">Seções do Custeio</p>
              <p className="text-blue-200 text-xs mt-0.5">7 etapas do planejamento</p>
            </div>

            <nav className="p-2">
              {navGroups.map(group => {
                const gm = GROUP_META[group];
                const gTabs = TABS.filter(t => t.group === group);
                const isActiveGroup = activeGroup === group;
                return (
                  <div key={group} className="mb-3">
                    <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                      <div
                        className={`w-5 h-5 rounded-full ${gm.bg} flex items-center justify-center shrink-0`}
                      >
                        <span className="text-white text-xs font-black">{gm.short}</span>
                      </div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${isActiveGroup ? gm.accent : 'text-slate-400'
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
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5 group ${isActive
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition-all ${isActive
                                ? 'bg-white/25 text-white'
                                : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                              }`}
                          >
                            {globalIdx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-700'
                                }`}
                            >
                              {tab.label}
                            </div>
                            <div
                              className={`text-xs leading-tight truncate ${isActive ? 'text-white/70' : 'text-slate-400'
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

            {/* Progress */}
            <div className="px-4 pb-4">
              <div className="text-xs text-slate-500 mb-1">Progresso</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((currentTabIdx + 1) / TABS.length) * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {currentTabIdx + 1} de {TABS.length}
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT (Card único branco idêntico ao PlanoForm) ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Faixa Superior Discreta de Resumo Orçamentário (100% reconciliada com Visão Geral e Menu Lateral) */}
            <div className="bg-slate-50 border-b border-slate-200 px-7 py-3 flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                <span>
                  Total no Período ({cronogramaMensal.length}m):{' '}
                  <strong className="text-blue-900 font-black">{BRL0(resumoFinanceiro.totalGeralPeriodo)}</strong>
                </span>
                <span>
                  1. Mobiliário:{' '}
                  <strong className="text-amber-800 font-semibold">{BRL0(resumoFinanceiro.totalMobiliarioPeriodo)}</strong>
                </span>
                <span>
                  2. Serviços:{' '}
                  <strong className="text-slate-800 font-semibold">{BRL0(resumoFinanceiro.totalServicosPeriodo)}</strong>
                </span>
                <span>
                  3. Aquisições:{' '}
                  <strong className="text-emerald-800 font-semibold">{BRL0(resumoFinanceiro.totalAquisicoesRecorrentesPeriodo)}</strong>
                </span>
                <span>
                  4. Pessoal ({resumoFinanceiro.totalProfissionais} prof.):{' '}
                  <strong className="text-purple-800 font-semibold">{BRL0(resumoFinanceiro.totalPessoalPeriodo)}</strong>
                </span>
              </div>
              <div className="text-slate-500">
                Operação (ANO): <strong className="text-emerald-700">{BRL0(resumoFinanceiro.custoAnualRegimePleno)}/ano</strong> · +{resumoFinanceiro.totalVagasContempladas} vagas
              </div>
            </div>

            <div className="p-7 space-y-6">
              {/* Banner Reativo de Sincronização com o Plano de Expansão (Construção) */}
              {divergenciasExpansao.length > 0 && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 print:hidden">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                          Atenção: Divergências Detectadas entre Plano de Expansão (Construção) e Custeio ({divergenciasExpansao.length})
                        </h3>
                        <ul className="mt-1.5 space-y-1 text-xs text-amber-900 list-disc pl-4">
                          {divergenciasExpansao.map((div, idx) => (
                            <li key={idx}>
                              <strong>{div.nome}:</strong> {div.detalhe}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {divergenciasExpansao.some(d => d.tipo === 'operacao_anterior_vigencia') && (
                        <button
                          type="button"
                          onClick={() => handleSincronizarComExpansao(true)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Sincronizar + Ajustar Início p/ 1ª Entrega
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSincronizarComExpansao(false)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-400 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Sincronizar Escopo Físico (Preservar Manuais)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Filtro Rápido por Unidade Escolar / Intervenção (nas abas 2, 3, 4 e 5) */}
              {(activeTab === 'mobiliario' ||
                activeTab === 'servicos' ||
                activeTab === 'aquisicoes' ||
                activeTab === 'pessoal') && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
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
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[280px]"
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
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          Parâmetros Gerais e Período Próprio do Plano de Custeio
                        </h2>
                        <p className="text-xs text-slate-500">
                          O período do Plano de Custeio é independente do cronograma físico de obras do Plano de Expansão.
                        </p>
                      </div>
                    </div>

                    {/* Card informativo do Período do Plano de Expansão Vinculado */}
                    {planoExpansao && (() => {
                      const perExp = obterPeriodoExpansaoYM(planoExpansao);
                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Plano de Expansão Vinculado (Cronograma de Obras/Ações)
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-slate-800 flex flex-wrap items-center gap-2 mt-0.5">
                                <span>{planoExpansao.nome || planoExpansao.name}</span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                                  <Calendar className="w-3 h-3" />
                                  Período da Expansão: {perExp.labelComMeses}
                                </span>
                              </div>
                            </div>
                          </div>
                          {(plano.dataInicio !== perExp.dataInicio || plano.dataFim !== perExp.dataFim) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRecalcularPreservandoManuais(
                                  plano.intervencoes,
                                  perExp.dataInicio,
                                  perExp.dataFim
                                )
                              }
                              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors shrink-0"
                              title="Definir a vigência do Custeio igual ao período de início e fim do Plano de Expansão"
                            >
                              Igualar ao Período da Expansão ({perExp.label})
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
                          <span>Nome do Plano de Custeio</span>
                          <FieldTooltip text="Título oficial utilizado nas listagens e relatórios institucionais." />
                        </label>
                        <input
                          type="text"
                          value={plano.nome}
                          onChange={e => mutatePlano(prev => ({ ...prev, nome: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
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
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
                          <span>Responsável Técnico</span>
                          <FieldTooltip text="Servidor, setor ou equipe responsável pela elaboração e validação orçamentária." />
                        </label>
                        <input
                          type="text"
                          value={plano.responsavelNome}
                          onChange={e =>
                            mutatePlano(prev => ({ ...prev, responsavelNome: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
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
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
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
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="lg:col-span-2">
                        <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
                          <span>Descrição / Premissas Gerais</span>
                          <FieldTooltip text="Resumo executivo do objetivo financeiro deste cenário." />
                        </label>
                        <input
                          type="text"
                          value={plano.descricao}
                          onChange={e =>
                            mutatePlano(prev => ({ ...prev, descricao: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quadro Mestre de Unidades Escolares — 100% Reconciliado com as Abas 2, 3, 4 e 5 */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
                      <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                          <Layers className="w-5 h-5 text-blue-600" />
                          Quadro Consolidado por Unidade Escolar (Modelo de Creche × Período de {cronogramaMensal.length} Meses)
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Cada linha soma exatamente <strong>1. Mobiliário (Ambientes) + 2. Serviços + 3. Aquisições + 4. Pessoal = Total no Período</strong>. Abaixo de cada valor consta o custo anual configurado no <strong>Modelo de Creche</strong> (<code>Valor/Ano ÷ 12 × Meses Ativos</code>).
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAplicarNoPlanoExpansao(false)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                          title="Atualiza as turmas e o escopo de mobiliário no Plano de Expansão"
                        >
                          Sincronizar c/ Plano de Expansão
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[960px] text-xs">
                        <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="text-center px-2.5 py-3 font-bold w-10">
                              <span className="inline-flex items-center gap-1">
                                Ativa
                                <FieldTooltip text="Permite ativar ou desativar uma unidade na simulação orçamentária." />
                              </span>
                            </th>
                            <th className="text-left px-3 py-3 font-bold min-w-[190px]">
                              Unidade Escolar / Modelo de Creche
                            </th>
                            <th className="text-left px-2.5 py-3 font-bold w-[135px]">
                              <span className="inline-flex items-center gap-1">
                                Escopo & Vagas
                                <FieldTooltip
                                  title="Base Fixa do Modelo"
                                  text="Unidade Completa: aplica 100% dos ambientes, serviços, aquisições e pessoal do Modelo de Creche. Incremental: aplica a proporção das novas salas/vagas."
                                />
                              </span>
                            </th>
                            <th className="text-center px-2 py-3 font-bold w-[62px]">
                              <span className="inline-flex items-center gap-1">
                                Turmas
                                <FieldTooltip text="Quantidade de turmas previstas. Alterar o número de turmas ajusta proporcionalmente Professores e Monitores da unidade." />
                              </span>
                            </th>
                            <th className="text-center px-2 py-3 font-bold w-[88px]">
                              <span className="inline-flex items-center gap-1">
                                Período
                                <FieldTooltip
                                  title="Meses no Plano de Custeio"
                                  text="Quantidade de meses considerada no cálculo das despesas mensais/anuais desta unidade dentro do período do Plano de Custeio."
                                />
                              </span>
                            </th>
                            <th className="text-right px-2.5 py-3 font-bold text-amber-800 w-[108px]">
                              <button
                                type="button"
                                onClick={() => setActiveTab('mobiliario')}
                                className="inline-flex items-center gap-1 justify-end hover:underline cursor-pointer"
                                title="Clique para abrir a seção 2. Mobiliário & Equipamentos"
                              >
                                1. Mobiliário
                              </button>
                            </th>
                            <th className="text-right px-2.5 py-3 font-bold text-blue-800 w-[108px]">
                              <button
                                type="button"
                                onClick={() => setActiveTab('servicos')}
                                className="inline-flex items-center gap-1 justify-end hover:underline cursor-pointer"
                                title="Clique para abrir a seção 3. Serviços"
                              >
                                2. Serviços
                              </button>
                            </th>
                            <th className="text-right px-2.5 py-3 font-bold text-emerald-800 w-[108px]">
                              <button
                                type="button"
                                onClick={() => setActiveTab('aquisicoes')}
                                className="inline-flex items-center gap-1 justify-end hover:underline cursor-pointer"
                                title="Clique para abrir a seção 4. Aquisições"
                              >
                                3. Aquisições
                              </button>
                            </th>
                            <th className="text-right px-2.5 py-3 font-bold text-purple-800 w-[114px]">
                              <button
                                type="button"
                                onClick={() => setActiveTab('pessoal')}
                                className="inline-flex items-center gap-1 justify-end hover:underline cursor-pointer"
                                title="Clique para abrir a seção 5. Pessoal e Folha"
                              >
                                4. Pessoal
                              </button>
                            </th>
                            <th className="text-right px-3 py-3 font-bold text-blue-900 bg-blue-50/60 w-[124px] whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 justify-end">
                                Total no Período
                                <FieldTooltip
                                  title="Fechamento da Linha"
                                  text="Soma exata de 1. Mobiliário + 2. Serviços + 3. Aquisições + 4. Pessoal desta unidade no período do Plano de Custeio."
                                  formula="1. Mobiliário + 2. Serviços + 3. Aquisições + 4. Pessoal"
                                />
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {plano.intervencoes.map(iv => {
                            const resumoIv = resumoPorIntervencao.find(
                              r => r.intervencaoId === iv.id
                            );
                            const mesesAtivos = resumoIv?.mesesOperacaoNoPeriodo || 0;
                            const anosEquiv = (mesesAtivos / 12).toLocaleString('pt-BR', {
                              minimumFractionDigits: mesesAtivos % 12 === 0 ? 0 : 1,
                              maximumFractionDigits: 1,
                            });
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
                                <td className="px-3 py-3 min-w-[190px]">
                                  <div className="font-bold text-slate-800 text-xs leading-snug">
                                    {iv.nomeUnidadeOuObra}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {iv.modeloCrecheNome}
                                  </div>
                                  {(() => {
                                    const kb = progressoKanbanPorInterv.get(iv.id);
                                    const isParalisada =
                                      (iv.statusObraOrigem as string) === 'paralisada';
                                    return (
                                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                        {isParalisada && (
                                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold">
                                            Obra Paralisada
                                          </span>
                                        )}
                                        {kb && (
                                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                                            Kanban: {kb.pct}% ({kb.feito}/{kb.total})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="px-2.5 py-3">
                                  <div>
                                    {iv.escopo === 'unidade_completa' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200 whitespace-nowrap">
                                        100% do Modelo
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                        Proporcional (
                                        {iv.subtipoIntervencao === 'adaptacao'
                                          ? 'Adaptação'
                                          : 'Ampliação'}
                                        )
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-semibold text-slate-600 mt-1 whitespace-nowrap">
                                    +{iv.salasAdicionais} salas · +{iv.vagasAdicionais} vagas
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-center">
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
                                <td className="px-2 py-3 text-center whitespace-nowrap">
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[11px]">
                                    {mesesAtivos} meses
                                  </span>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                    ({anosEquiv} {Number(mesesAtivos) === 12 ? 'ano' : 'anos'})
                                  </div>
                                </td>
                                <td className="px-2.5 py-3 text-right whitespace-nowrap">
                                  <div className="font-bold text-amber-800">
                                    {BRL0(resumoIv?.mobiliario || 0)}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {iv.escopoImplantacaoMobiliario === 'contemplado_no_capex_obra'
                                      ? 'No CAPEX da Obra'
                                      : 'Implantação (1×)'}
                                  </div>
                                </td>
                                <td className="px-2.5 py-3 text-right whitespace-nowrap">
                                  <div className="font-bold text-slate-800">
                                    {BRL0(resumoIv?.servicos || 0)}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {BRL0(resumoIv?.custoAnualServicos || 0)}/ano
                                  </div>
                                </td>
                                <td className="px-2.5 py-3 text-right whitespace-nowrap">
                                  <div className="font-bold text-emerald-800">
                                    {BRL0(resumoIv?.aquisicoesRecorrentes || 0)}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {BRL0(resumoIv?.custoAnualAquisicoes || 0)}/ano
                                  </div>
                                </td>
                                <td className="px-2.5 py-3 text-right whitespace-nowrap">
                                  <div className="font-bold text-purple-800">
                                    {BRL0(resumoIv?.pessoal || 0)}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {BRL0(resumoIv?.custoAnualPessoal || 0)}/ano
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-right bg-blue-50/40 whitespace-nowrap">
                                  <div className="font-black text-blue-900">
                                    {BRL0(resumoIv?.totalPeriodo || 0)}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Op.: {BRL0(resumoIv?.custoAnualizadoRegime || 0)}/ano
                                  </div>
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
                              {plano.intervencoes.length} unidades ativas
                            </td>
                            <td className="px-2.5 py-3 whitespace-nowrap">
                              +{resumoFinanceiro.totalSalasContempladas} salas · +
                              {resumoFinanceiro.totalVagasContempladas} vagas
                            </td>
                            <td className="px-2 py-3 text-center">{totalTurmasAtivas} tr</td>
                            <td className="px-2 py-3 text-center whitespace-nowrap">
                              {cronogramaMensal.length} meses
                            </td>
                            <td className="px-2.5 py-3 text-right text-amber-800 whitespace-nowrap">
                              <div>{BRL0(resumoFinanceiro.totalMobiliarioPeriodo)}</div>
                              <div className="text-[10px] font-normal text-slate-500">
                                Implantação (1×)
                              </div>
                            </td>
                            <td className="px-2.5 py-3 text-right text-slate-800 whitespace-nowrap">
                              <div>{BRL0(resumoFinanceiro.totalServicosPeriodo)}</div>
                              <div className="text-[10px] font-normal text-slate-500">
                                {BRL0(
                                  resumoPorIntervencao.reduce((s, r) => s + r.custoAnualServicos, 0)
                                )}
                                /ano
                              </div>
                            </td>
                            <td className="px-2.5 py-3 text-right text-emerald-800 whitespace-nowrap">
                              <div>{BRL0(resumoFinanceiro.totalAquisicoesRecorrentesPeriodo)}</div>
                              <div className="text-[10px] font-normal text-slate-500">
                                {BRL0(
                                  resumoPorIntervencao.reduce(
                                    (s, r) => s + r.custoAnualAquisicoes,
                                    0
                                  )
                                )}
                                /ano
                              </div>
                            </td>
                            <td className="px-2.5 py-3 text-right text-purple-800 whitespace-nowrap">
                              <div>{BRL0(resumoFinanceiro.totalPessoalPeriodo)}</div>
                              <div className="text-[10px] font-normal text-slate-500">
                                {BRL0(
                                  resumoPorIntervencao.reduce((s, r) => s + r.custoAnualPessoal, 0)
                                )}
                                /ano
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right text-blue-900 bg-blue-100/60 font-black whitespace-nowrap">
                              <div>{BRL0(resumoFinanceiro.totalGeralPeriodo)}</div>
                              <div className="text-[10px] font-semibold text-emerald-800">
                                Op.: {BRL0(resumoFinanceiro.custoAnualRegimePleno)}/ano
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════════════
                  ABA 2 — SEÇÃO 1: MOBILIÁRIO & EQUIPAMENTOS DOS AMBIENTES (MODELO)
                 ═══════════════════════════════════════════════════════════════════ */}
              {activeTab === 'mobiliario' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Layers className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        <strong>Mobiliário e Equipamentos por Ambiente do Modelo de Creche (Implantação Única):</strong> Cada unidade carrega automaticamente os ambientes configurados no seu <strong>Modelo de Creche</strong> (Salas de Atividades, Berçário, Copa, Fraldário, Refeitório e Playground) com seus respectivos itens de mobiliário e equipamentos permanentes. Por ser aquisição permanente para equipar a creche construída, o custo é contabilizado <strong>1 única vez (implantação)</strong> e separado das Aquisições de consumo anual.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMobiliarioManual()}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      Incluir Ambiente / Kit
                    </button>
                  </div>

                  {gruposMobiliario.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                      Nenhum ambiente com mobiliário/equipamentos encontrado para o filtro selecionado.
                    </div>
                  ) : (
                    gruposMobiliario.map(grupo => {
                      const iv = grupo.intervencao;
                      const noCapex =
                        iv?.escopoImplantacaoMobiliario === 'contemplado_no_capex_obra';
                      const subtotalBaseGrupo = grupo.itens.reduce(
                        (acc, m) => acc + m.valorAnualizado,
                        0
                      );
                      const subtotalPeriodoGrupo = grupo.itens.reduce(
                        (acc, m) => acc + m.valorTotalProjetado,
                        0
                      );

                      return (
                        <div
                          key={grupo.id}
                          className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${
                            iv && !iv.ativoNoCusteio ? 'opacity-60' : ''
                          }`}
                        >
                          {/* Cabeçalho da Unidade Escolar / Intervenção */}
                          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                              <h3 className="font-bold text-slate-800 text-sm">
                                {iv?.nomeUnidadeOuObra || 'Mobiliário Global'}
                              </h3>
                              {iv && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 whitespace-nowrap">
                                  {iv.modeloCrecheNome}
                                </span>
                              )}
                              {iv && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 whitespace-nowrap">
                                  +{iv.salasAdicionais} salas · +{iv.vagasAdicionais} vagas
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 flex-wrap shrink-0 self-end sm:self-auto">
                              {iv && (
                                <select
                                  value={
                                    iv.escopoImplantacaoMobiliario || 'incluido_no_custeio'
                                  }
                                  onChange={e =>
                                    updateIntervencao(
                                      iv.id,
                                      {
                                        escopoImplantacaoMobiliario: e.target.value as
                                          | 'incluido_no_custeio'
                                          | 'contemplado_no_capex_obra',
                                      },
                                      true
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border outline-none cursor-pointer ${
                                    noCapex
                                      ? 'bg-slate-100 text-slate-600 border-slate-300'
                                      : 'bg-amber-50 text-amber-900 border-amber-300'
                                  }`}
                                >
                                  <option value="incluido_no_custeio">
                                    Orçar Mobiliário neste Plano de Custeio
                                  </option>
                                  <option value="contemplado_no_capex_obra">
                                    Já Contemplado no CAPEX da Obra (R$ 0 aqui)
                                  </option>
                                </select>
                              )}

                              <div className="text-right text-[11px] text-slate-500">
                                <span>Total Mobiliário da Unidade: </span>
                                <strong className="text-amber-800 font-bold">
                                  {BRL(subtotalPeriodoGrupo)}
                                </strong>
                                {noCapex && (
                                  <span className="ml-1 text-slate-400">
                                    (Ref. Modelo: {BRL(subtotalBaseGrupo)})
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleAddMobiliarioManual(
                                    grupo.id !== 'global' ? grupo.id : undefined
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold transition-colors whitespace-nowrap"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Ambiente
                              </button>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[740px] text-xs">
                              <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                                <tr>
                                  <th className="text-left px-3.5 py-2.5 font-bold min-w-[260px]">
                                    Ambiente do Modelo & Composição de Mobiliário/Equipamentos
                                  </th>
                                  <th className="text-center px-2.5 py-2.5 font-bold w-[90px]">
                                    Qtd Ambientes
                                  </th>
                                  <th className="text-right px-2.5 py-2.5 font-bold w-[110px]">
                                    Mobiliário / Amb.
                                  </th>
                                  <th className="text-right px-2.5 py-2.5 font-bold w-[110px]">
                                    Equipamentos / Amb.
                                  </th>
                                  <th className="text-right px-3 py-2.5 font-bold w-[125px]">
                                    Custo Unit. Ambiente
                                  </th>
                                  <th className="text-right px-3 py-2.5 font-bold w-[125px]">
                                    Total Implantação
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
                                      <td className="px-3.5 py-2.5 align-top min-w-[260px]">
                                        <input
                                          type="text"
                                          value={item.descricao}
                                          onChange={e =>
                                            mutatePlano(prev => ({
                                              ...prev,
                                              mobiliario: (
                                                prev.mobiliario || projecao.mobiliario
                                              ).map(m =>
                                                m.id === item.id
                                                  ? {
                                                      ...m,
                                                      descricao: e.target.value,
                                                      origemCalculo:
                                                        m.origemCalculo === 'incluido_manualmente'
                                                          ? 'incluido_manualmente'
                                                          : 'ajustado_manualmente',
                                                    }
                                                  : m
                                              ),
                                            }))
                                          }
                                          className="w-full text-xs font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded-lg px-2 py-1 -ml-2 outline-none transition-colors"
                                        />
                                        <div className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                                          {item.resumoItensAmbiente || item.memoriaCalculo}
                                        </div>
                                      </td>

                                      <td className="px-2.5 py-2.5 align-top text-center w-[90px]">
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.quantidade}
                                          onChange={e =>
                                            mutatePlano(prev => ({
                                              ...prev,
                                              mobiliario: (
                                                prev.mobiliario || projecao.mobiliario
                                              ).map(m =>
                                                m.id === item.id
                                                  ? {
                                                      ...m,
                                                      quantidade: Math.max(
                                                        0,
                                                        Number(e.target.value)
                                                      ),
                                                      origemCalculo:
                                                        m.origemCalculo === 'incluido_manualmente'
                                                          ? 'incluido_manualmente'
                                                          : 'ajustado_manualmente',
                                                    }
                                                  : m
                                              ),
                                            }))
                                          }
                                          className="w-16 px-2 py-1 text-center font-bold border border-slate-300 rounded-lg text-slate-800 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                      </td>

                                      <td className="px-2.5 py-2.5 align-top text-right text-slate-600 w-[110px]">
                                        <div className="py-1">
                                          {BRL(item.valorMobiliarioUnitario)}
                                        </div>
                                      </td>

                                      <td className="px-2.5 py-2.5 align-top text-right text-slate-600 w-[110px]">
                                        <div className="py-1">
                                          {BRL(item.valorEquipamentosUnitario)}
                                        </div>
                                      </td>

                                      <td className="px-3 py-2.5 align-top text-right w-[125px]">
                                        <CusteioCurrencyInput
                                          value={item.valorUnitario}
                                          onChange={val =>
                                            mutatePlano(prev => ({
                                              ...prev,
                                              mobiliario: (
                                                prev.mobiliario || projecao.mobiliario
                                              ).map(m =>
                                                m.id === item.id
                                                  ? {
                                                      ...m,
                                                      valorUnitario: Math.max(0, val),
                                                      origemCalculo:
                                                        m.origemCalculo === 'incluido_manualmente'
                                                          ? 'incluido_manualmente'
                                                          : 'ajustado_manualmente',
                                                    }
                                                  : m
                                              ),
                                            }))
                                          }
                                          className="w-[112px] px-2 py-1 text-right text-xs border border-slate-300 rounded-lg font-semibold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                      </td>

                                      <td className="px-3 py-2.5 align-top text-right font-bold text-amber-800 whitespace-nowrap w-[125px]">
                                        <div className="py-1">{BRL(item.valorTotalProjetado)}</div>
                                      </td>

                                      <td className="px-2 py-2.5 align-top text-center w-[34px]">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            mutatePlano(prev => ({
                                              ...prev,
                                              mobiliario: (
                                                prev.mobiliario || projecao.mobiliario
                                              ).filter(m => m.id !== item.id),
                                            }))
                                          }
                                          className="p-1 mt-0.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                                          title="Remover ambiente"
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

                  {/* Card Totalizador Consolidado de Mobiliário & Equipamentos */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                        Consolidação da Seção 1 — Mobiliário & Equipamentos (Ambientes do Modelo)
                      </div>
                      <div className="text-sm text-slate-600 mt-0.5">
                        Total de{' '}
                        <strong>
                          {mobiliarioFiltrado.reduce((s, m) => s + m.quantidade, 0)} ambientes equipados
                        </strong>{' '}
                        em <strong>{gruposMobiliario.length} unidade(s)</strong> exibida(s)
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-right">
                        <div className="text-[11px] font-bold uppercase text-slate-500">
                          Valor Base nos Modelos
                        </div>
                        <div className="text-lg font-extrabold text-slate-700 whitespace-nowrap">
                          {BRL(totalBaseMobFiltrado)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] font-bold uppercase text-amber-800">
                          Total Incluído no Período
                        </div>
                        <div className="text-xl font-black text-amber-800 whitespace-nowrap">
                          {BRL(totalPeriodoMobFiltrado)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* ═══════════════════════════════════════════════════════════════════
                ABA 2 — CATEGORIA A: SERVIÇOS OPERACIONAIS
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'servicos' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900 leading-relaxed">
                      <strong>Cálculo Fixo pelo Modelo da Creche + Período do Custeio:</strong> Os valores de referência vêm diretamente dos serviços anuais cadastrados no <strong>Modelo da Creche</strong> de cada unidade (100% em Novas Creches; proporcional ao nº de salas em Ampliações). O <strong>Total no Período</strong> multiplica o valor mensal (<code>Custo Anual ÷ 12</code>) pelos meses de operação da unidade dentro deste Plano de Custeio.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddServicoManual()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    Incluir Serviço
                  </button>
                </div>

                {gruposServicos.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
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
                        className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${
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
                            {iv && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
                                {iv.modeloCrecheNome}
                              </span>
                            )}
                            {iv && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 whitespace-nowrap">
                                +{iv.salasAdicionais} salas · +{iv.vagasAdicionais} vagas ·{' '}
                                {resumoIv?.mesesOperacaoNoPeriodo ?? 0}m ativos no período
                              </span>
                            )}
                            {iv && !iv.ativoNoCusteio && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 whitespace-nowrap">
                                Inativa na simulação
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="text-right text-[11px] text-slate-500">
                              <span>Custo Anual: </span>
                              <strong className="text-emerald-700">{BRL(subtotalAnualGrupo)}</strong>
                              <span className="mx-1.5 text-slate-300">|</span>
                              <span>No Período: </span>
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
                                <th className="text-left px-3.5 py-2.5 font-bold min-w-[230px]">
                                  Serviço Operacional (Configurado no Modelo)
                                </th>
                                <th className="text-left px-3 py-2.5 font-bold w-[165px]">
                                  Base Fixa do Modelo
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[125px]">
                                  Valor no Modelo (ANO)
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[120px]">
                                  Custo Anual da Unidade
                                </th>
                                <th className="text-center px-2.5 py-2.5 font-bold w-[90px]">
                                  Meses no Período
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[120px]">
                                  Total no Período
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
                                    <td className="px-3.5 py-2.5 align-top min-w-[230px]">
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
                                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        {isManual && (
                                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold whitespace-nowrap">
                                            {item.origemCalculo === 'incluido_manualmente'
                                              ? 'Incluído Manual'
                                              : 'Valor Ajustado'}
                                          </span>
                                        )}
                                        <span className="text-[11px] text-slate-500 leading-snug">
                                          {item.memoriaCalculo}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 align-top w-[165px]">
                                      <span
                                        className={`inline-block px-2 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${
                                          item.fatorProporcional === 0
                                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                                            : item.fatorProporcional === 1
                                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                                            : 'bg-amber-50 text-amber-900 border-amber-200'
                                        }`}
                                      >
                                        {item.fatorProporcional === 0
                                          ? 'Compartilhado c/ Escola (0%)'
                                          : item.fatorProporcional === 1
                                          ? '100% do Modelo (ANO)'
                                          : formatProporcaoResumo(item)}
                                      </span>
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right w-[125px]">
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

                                    <td className="px-3 py-2.5 align-top text-right w-[120px]">
                                      <div className="font-semibold text-slate-800 whitespace-nowrap py-0.5">
                                        {BRL(item.valorAnualizado)}
                                      </div>
                                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {BRL0(item.valorAnualizado / 12)}/mês
                                      </div>
                                    </td>

                                    <td className="px-2.5 py-2.5 align-top text-center w-[90px]">
                                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] whitespace-nowrap mt-0.5">
                                        {item.ocorrenciasNoPeriodo} meses
                                      </span>
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right w-[120px]">
                                      <div className="font-bold text-blue-700 whitespace-nowrap py-0.5">
                                        {BRL(item.valorTotalProjetado)}
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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                        Custo Anual (Regime)
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
                ABA 3 — CATEGORIA B: AQUISIÇÕES DE CONSUMO ANUAL (MODELO)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'aquisicoes' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <strong>Aquisições de Funcionamento (Separadas do Mobiliário da Obra):</strong> Esta seção contempla exclusivamente os materiais e insumos operacionais anuais configurados no <strong>Modelo da Creche</strong> (<em>Merenda Escolar, Material Pedagógico, Material de Limpeza/Higiene, Uniformes/EPI e Gás de Cozinha</em>). O mobiliário e equipamentos dos ambientes pertencem à implantação física da Obra/Construção.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddAquisicaoManual('recorrente_manutencao')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    Incluir Aquisição
                  </button>
                </div>

                {gruposAquisicoes.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                    Nenhum item de aquisição encontrado para o filtro selecionado.
                  </div>
                ) : (
                  gruposAquisicoes.map(grupo => {
                    const iv = grupo.intervencao;
                    const resumoIv = iv
                      ? resumoPorIntervencao.find(r => r.intervencaoId === iv.id)
                      : undefined;
                    const subtotalAnualGrupo = grupo.itens.reduce(
                      (acc, a) => acc + a.valorAnualizado,
                      0
                    );
                    const subtotalPeriodoGrupo = grupo.itens.reduce(
                      (acc, a) => acc + a.valorTotalProjetado,
                      0
                    );

                    return (
                      <div
                        key={grupo.id}
                        className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${
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
                            {iv && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 whitespace-nowrap">
                                {iv.modeloCrecheNome}
                              </span>
                            )}
                            {iv && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 whitespace-nowrap">
                                +{iv.salasAdicionais} salas · +{iv.vagasAdicionais} vagas ·{' '}
                                {resumoIv?.mesesOperacaoNoPeriodo ?? 0}m ativos no período
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="text-right text-[11px] text-slate-500">
                              <span>Custo Anual: </span>
                              <strong className="text-emerald-700">{BRL(subtotalAnualGrupo)}</strong>
                              <span className="mx-1.5 text-slate-300">|</span>
                              <span>No Período: </span>
                              <strong className="text-blue-700">{BRL(subtotalPeriodoGrupo)}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleAddAquisicaoManual(
                                  'recorrente_manutencao',
                                  grupo.id !== 'global' ? grupo.id : undefined
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors whitespace-nowrap"
                              title="Adicionar aquisição específica nesta unidade"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Aquisição
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px] text-xs">
                            <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                              <tr>
                                <th className="text-left px-3.5 py-2.5 font-bold min-w-[230px]">
                                  Item de Aquisição (Configurado no Modelo)
                                </th>
                                <th className="text-left px-3 py-2.5 font-bold w-[165px]">
                                  Base Fixa do Modelo
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[125px]">
                                  Valor no Modelo (ANO)
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[120px]">
                                  Custo Anual da Unidade
                                </th>
                                <th className="text-center px-2.5 py-2.5 font-bold w-[90px]">
                                  Meses no Período
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[120px]">
                                  Total no Período
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
                                    <td className="px-3.5 py-2.5 align-top min-w-[230px]">
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
                                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        {isManual && (
                                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold whitespace-nowrap">
                                            {item.origemCalculo === 'incluido_manualmente'
                                              ? 'Incluído Manual'
                                              : 'Valor Ajustado'}
                                          </span>
                                        )}
                                        <span className="text-[11px] text-slate-500 leading-snug">
                                          {item.memoriaCalculo}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-3 py-2.5 align-top w-[165px]">
                                      <span
                                        className={`inline-block px-2 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap ${
                                          item.fatorProporcional === 1
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                            : 'bg-amber-50 text-amber-900 border-amber-200'
                                        }`}
                                      >
                                        {item.fatorProporcional === 1
                                          ? '100% do Modelo (ANO)'
                                          : formatProporcaoResumo(item)}
                                      </span>
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right w-[125px]">
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
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right w-[120px]">
                                      <div className="font-semibold text-slate-800 whitespace-nowrap py-0.5">
                                        {BRL(item.valorAnualizado)}
                                      </div>
                                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {BRL0(item.valorAnualizado / 12)}/mês
                                      </div>
                                    </td>

                                    <td className="px-2.5 py-2.5 align-top text-center w-[90px]">
                                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] whitespace-nowrap mt-0.5">
                                        {item.ocorrenciasNoPeriodo} meses
                                      </span>
                                    </td>

                                    <td className="px-3 py-2.5 align-top text-right font-bold text-blue-700 whitespace-nowrap w-[120px]">
                                      <div className="py-0.5">{BRL(item.valorTotalProjetado)}</div>
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
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Consolidação da Categoria B — Aquisições de Funcionamento
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      Total de <strong>{aquisicoesFiltradas.length} itens de consumo anual</strong> em{' '}
                      <strong>{gruposAquisicoes.length} unidade(s)</strong> exibida(s)
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase text-emerald-700">
                        Custo Anual (Regime)
                      </div>
                      <div className="text-lg font-extrabold text-emerald-700 whitespace-nowrap">
                        {BRL(aquisicoesFiltradas.reduce((s, a) => s + a.valorAnualizado, 0))}/ano
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
                ABA 5 — SEÇÃO 4: PESSOAL E FOLHA DE PAGAMENTO (AGRUPADO POR UNIDADE)
               ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'pessoal' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-900 leading-relaxed">
                      <strong>Quadro de Pessoal por Unidade Escolar (Conforme Modelo da Creche + Período do Custeio):</strong> Novas creches carregam exatamente o quadro de servidores configurado no <strong>Modelo de Creche</strong> associado. Ampliações incrementais adicionam Professores e Monitores das novas turmas. O custo anual aplica <strong>13,33 salários/ano</strong> (12 meses + 13º + 1/3 de férias) e o <strong>Total no Período</strong> multiplica <code>Anual ÷ 12</code> pelos meses ativos no Plano de Custeio.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddPessoalManual('pedagogico')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    Incluir Cargo
                  </button>
                </div>

                {gruposPessoal.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
                    Nenhum cargo encontrado para o filtro selecionado.
                  </div>
                ) : (
                  gruposPessoal.map(grupo => {
                    const iv = grupo.intervencao;
                    const resumoIv = iv
                      ? resumoPorIntervencao.find(r => r.intervencaoId === iv.id)
                      : undefined;
                    const qtdProfUnidade = grupo.itens.reduce(
                      (acc, p) => acc + p.quantidade,
                      0
                    );
                    const subtotalAnualGrupo = grupo.itens.reduce(
                      (acc, p) => acc + p.valorAnualizado,
                      0
                    );
                    const subtotalPeriodoGrupo = grupo.itens.reduce(
                      (acc, p) => acc + p.valorTotalProjetado,
                      0
                    );

                    return (
                      <div
                        key={grupo.id}
                        className={`bg-white border border-slate-200 rounded-xl overflow-hidden ${
                          iv && !iv.ativoNoCusteio ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Cabeçalho da Unidade Escolar / Intervenção */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                            <h3 className="font-bold text-slate-800 text-sm">
                              {iv?.nomeUnidadeOuObra || 'Quadro Global'}
                            </h3>
                            {iv && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-900 border border-purple-200 whitespace-nowrap">
                                {iv.modeloCrecheNome}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 whitespace-nowrap">
                              {qtdProfUnidade} prof. · {iv?.turmasPrevistas || 0} turmas ·{' '}
                              {resumoIv?.mesesOperacaoNoPeriodo ?? 0}m ativos no período
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="text-right text-[11px] text-slate-500">
                              <span>Folha Anual: </span>
                              <strong className="text-emerald-700">{BRL(subtotalAnualGrupo)}</strong>
                              <span className="mx-1.5 text-slate-300">|</span>
                              <span>No Período: </span>
                              <strong className="text-purple-800">{BRL(subtotalPeriodoGrupo)}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleAddPessoalManual(
                                  'pedagogico',
                                  grupo.id !== 'global' ? grupo.id : undefined
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-purple-50 text-purple-800 border border-purple-200 text-[11px] font-bold transition-colors whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Cargo
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[780px] text-xs">
                            <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                              <tr>
                                <th className="text-left px-3 py-2.5 font-bold min-w-[205px]">
                                  Cargo / Função (Modelo)
                                </th>
                                <th className="text-center px-2 py-2.5 font-bold w-[60px]">
                                  Qtd
                                </th>
                                <th className="text-right px-2 py-2.5 font-bold w-[98px]">
                                  Rem. Base
                                </th>
                                <th className="text-right px-2 py-2.5 font-bold w-[88px]">
                                  Auxílios
                                </th>
                                <th className="text-right px-2 py-2.5 font-bold w-[90px]">
                                  Encargos
                                </th>
                                <th className="text-right px-2.5 py-2.5 font-bold w-[112px] whitespace-nowrap">
                                  Folha Anual (×13,33)
                                </th>
                                <th className="text-center px-2 py-2.5 font-bold w-[82px]">
                                  Meses
                                </th>
                                <th className="text-right px-3 py-2.5 font-bold w-[116px] whitespace-nowrap">
                                  Total no Período
                                </th>
                                <th className="text-center px-2 py-2.5 w-[32px]"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {grupo.itens.map(item => {
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
                                    <td className="px-3 py-2.5 align-top min-w-[205px]">
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
                                        className="px-2 py-1 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-800 w-full min-w-[180px] outline-none focus:ring-2 focus:ring-purple-500"
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
                                      <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        {isManual && (
                                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                                            {item.origemCalculo === 'incluido_manualmente'
                                              ? 'Incluído Manual'
                                              : 'Ajustado'}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-slate-500">
                                          {item.memoriaCalculo}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-2 py-2.5 align-top text-center w-[60px]">
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
                                    <td className="px-2 py-2.5 align-top text-right w-[98px]">
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
                                        className="w-[90px] px-2 py-1 text-right text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-purple-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2.5 align-top text-right w-[88px]">
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
                                        className="w-[80px] px-2 py-1 text-right text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                      />
                                    </td>
                                    <td className="px-2 py-2.5 align-top text-right w-[90px]">
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
                                        className="w-[82px] px-2 py-1 text-right text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:ring-2 focus:ring-purple-500"
                                      />
                                    </td>
                                    <td className="px-2.5 py-2.5 align-top text-right w-[112px]">
                                      <div className="font-semibold text-slate-800 whitespace-nowrap py-0.5">
                                        {BRL(item.valorAnualizado)}
                                      </div>
                                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                        {BRL0(item.valorAnualizado / 12)}/mês
                                      </div>
                                    </td>
                                    <td className="px-2 py-2.5 align-top text-center w-[82px]">
                                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px] whitespace-nowrap mt-0.5">
                                        {item.ocorrenciasNoPeriodo} meses
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 align-top text-right w-[116px]">
                                      <div className="font-bold text-purple-700 whitespace-nowrap py-0.5">
                                        {BRL(item.valorTotalProjetado)}
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
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Card Totalizador Consolidado de Pessoal */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
                      Consolidação da Seção 4 — Pessoal e Folha de Pagamento
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">
                      Total de{' '}
                      <strong>
                        {pessoalFiltrado.reduce((s, p) => s + p.quantidade, 0)} profissionais
                      </strong>{' '}
                      em <strong>{gruposPessoal.length} unidade(s)</strong> exibida(s)
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
                        /ano
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
                <div className="bg-white border border-slate-200 rounded-xl p-5">
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
                <div className="bg-white border border-slate-200 rounded-xl p-5">
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
                      <Bar dataKey="pessoal" name="4. Pessoal e Folha" stackId="a" fill="#7c3aed" />
                      <Bar
                        dataKey="aquisicoesRecorrentes"
                        name="3. Aquisições (Consumo)"
                        stackId="a"
                        fill="#10b981"
                      />
                      <Bar dataKey="servicos" name="2. Serviços" stackId="a" fill="#2563eb" />
                      <Bar
                        dataKey="aquisicoesPontuais"
                        name="1. Mobiliário (Ambientes)"
                        stackId="a"
                        fill="#d97706"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tabela Cronograma Anual ou Mensal */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Matriz de Desembolso Operacional (
                      {visaoCronograma === 'anual' ? 'Visão Anual por Exercício' : 'Visão Mensal Mês a Mês'})
                    </h3>
                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
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
                    <table className="w-full min-w-[680px] text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-bold whitespace-nowrap">
                            {visaoCronograma === 'anual' ? 'Exercício' : 'Competência'}
                          </th>
                          <th className="text-right px-4 py-3 font-bold text-amber-800 whitespace-nowrap">
                            1. Mobiliário
                          </th>
                          <th className="text-right px-4 py-3 font-bold whitespace-nowrap">
                            2. Serviços
                          </th>
                          <th className="text-right px-4 py-3 font-bold text-emerald-800 whitespace-nowrap">
                            3. Aquisições
                          </th>
                          <th className="text-right px-4 py-3 font-bold text-purple-800 whitespace-nowrap">
                            4. Pessoal e Folha
                          </th>
                          <th className="text-right px-4 py-3 font-bold bg-blue-50 text-blue-900 whitespace-nowrap">
                            Total no Período
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
                                <td className="px-4 py-3 text-right text-amber-800 font-semibold">
                                  {BRL(row.aquisicoesPontuais)}
                                </td>
                                <td className="px-4 py-3 text-right">{BRL(row.servicos)}</td>
                                <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                                  {BRL(row.aquisicoesRecorrentes)}
                                </td>
                                <td className="px-4 py-3 text-right text-purple-800 font-semibold">
                                  {BRL(row.pessoal)}
                                </td>
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
                                <td className="px-4 py-2.5 text-right text-amber-800 font-semibold">
                                  {BRL(row.aquisicoesPontuais)}
                                </td>
                                <td className="px-4 py-2.5 text-right">{BRL(row.servicos)}</td>
                                <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">
                                  {BRL(row.aquisicoesRecorrentes)}
                                </td>
                                <td className="px-4 py-2.5 text-right text-purple-800 font-semibold">
                                  {BRL(row.pessoal)}
                                </td>
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
                          <td className="px-4 py-3 text-right text-amber-800">
                            {BRL(resumoFinanceiro.totalMobiliarioPeriodo)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {BRL(resumoFinanceiro.totalServicosPeriodo)}
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

                {/* Painel de Sustentabilidade Fiscal (FUNDEB / PNAE / MDE) e Visão Consolidada TCO (CAPEX + OPEX) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                          Sustentabilidade Fiscal (FUNDEB / PNAE) & Orçamento Global TCO (CAPEX + OPEX)
                          <FieldTooltip
                            title="Integração Orçamentária Expansão + Custeio"
                            text="Compara o desembolso de obras (CAPEX do Plano de Expansão) e a operação das novas vagas (OPEX do Plano de Custeio) com a receita vinculada incremental gerada pelas novas matrículas no FUNDEB e PNAE."
                          />
                        </h3>
                        <p className="text-xs text-slate-500">
                          Simule o cofinanciamento das novas matrículas pelo FUNDEB/PNAE e o esforço líquido do Tesouro Municipal (MDE).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parâmetros de Receita Vinculada por Aluno/Ano */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-1">
                        FUNDEB Creche Integral (Aluno/Ano)
                        <FieldTooltip text="Valor Aluno-Ano (VAAF/VAAT) estimado para matrícula em Creche Tempo Integral (fator de ponderação 1,30)." />
                      </label>
                      <CusteioCurrencyInput
                        value={sustentabilidadeFiscal.valorAlunoAnoFundebIntegral}
                        onChange={val =>
                          mutatePlano(prev => ({
                            ...prev,
                            parametrosSimulacao: {
                              ...prev.parametrosSimulacao,
                              valorAlunoAnoFundebIntegral: Math.max(0, val),
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-1">
                        FUNDEB Creche Parcial (Aluno/Ano)
                        <FieldTooltip text="Valor Aluno-Ano (VAAF/VAAT) estimado para matrícula em Creche Tempo Parcial." />
                      </label>
                      <CusteioCurrencyInput
                        value={sustentabilidadeFiscal.valorAlunoAnoFundebParcial}
                        onChange={val =>
                          mutatePlano(prev => ({
                            ...prev,
                            parametrosSimulacao: {
                              ...prev.parametrosSimulacao,
                              valorAlunoAnoFundebParcial: Math.max(0, val),
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>% Vagas em Tempo Integral</span>
                        <span className="text-emerald-700">
                          {sustentabilidadeFiscal.percentualMatriculasTempoIntegral}%
                        </span>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={sustentabilidadeFiscal.percentualMatriculasTempoIntegral}
                        onChange={e =>
                          mutatePlano(prev => ({
                            ...prev,
                            parametrosSimulacao: {
                              ...prev.parametrosSimulacao,
                              percentualMatriculasTempoIntegral: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-emerald-600 cursor-pointer mt-1.5"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mb-1">
                        Repasse PNAE Creche (Aluno/Ano)
                        <FieldTooltip text="Repasse federal per capita anual do PNAE para alimentação escolar em creches (200 dias letivos)." />
                      </label>
                      <CusteioCurrencyInput
                        value={sustentabilidadeFiscal.repassePerCapitaPnaeAno}
                        onChange={val =>
                          mutatePlano(prev => ({
                            ...prev,
                            parametrosSimulacao: {
                              ...prev.parametrosSimulacao,
                              repassePerCapitaPnaeAno: Math.max(0, val),
                            },
                          }))
                        }
                        className="w-full px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Cards de Indicadores Fiscais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                      <div className="text-[11px] font-bold uppercase text-emerald-800">
                        Receita Incremental FUNDEB + PNAE (Regime)
                      </div>
                      <div className="text-lg font-black text-emerald-900 mt-1">
                        {BRL(sustentabilidadeFiscal.receitaVinculadaAnualRegime)}/ano
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Cobre{' '}
                        <strong>
                          {sustentabilidadeFiscal.coberturaVinculadaRegimePct.toFixed(1)}%
                        </strong>{' '}
                        do custeio anual em regime pleno
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                      <div className="text-[11px] font-bold uppercase text-amber-800">
                        Esforço Líquido Tesouro MDE (Regime)
                      </div>
                      <div className="text-lg font-black text-amber-900 mt-1">
                        {BRL(sustentabilidadeFiscal.esforcoLiquidoTesouroMdeRegime)}/ano
                      </div>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        Complementação municipal necessária além do FUNDEB/PNAE
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
                      <div className="text-[11px] font-bold uppercase text-purple-800">
                        Índice FUNDEB Magistério (Mín. 70%)
                      </div>
                      <div className="text-lg font-black text-purple-900 mt-1">
                        {sustentabilidadeFiscal.indiceMagisterioFundebPct.toFixed(1)}%
                      </div>
                      <div className="text-[11px] text-purple-700 mt-0.5">
                        Folha Pedagógica: {BRL0(sustentabilidadeFiscal.folhaMagisterioAnualRegime)}/ano
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                      <div className="text-[11px] font-bold uppercase text-blue-800">
                        Custo Total de Propriedade (TCO Global)
                      </div>
                      <div className="text-lg font-black text-blue-900 mt-1">
                        {BRL(sustentabilidadeFiscal.totalTcoGlobal)}
                      </div>
                      <div className="text-[11px] text-blue-700 mt-0.5">
                        CAPEX Obras ({BRL0(sustentabilidadeFiscal.totalCapexPlanoExpansao)}) + OPEX (
                        {BRL0(sustentabilidadeFiscal.totalOpexPeriodoCusteio)})
                      </div>
                    </div>
                  </div>

                  {/* Tabela Consolidada TCO Anual (CAPEX Obras + OPEX Custeio + Receitas Vinculadas) */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full min-w-[700px] text-xs">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-3 py-2.5 font-bold">Exercício</th>
                          <th className="text-right px-3 py-2.5 font-bold text-slate-700">
                            Obras e Ampliações (CAPEX)
                          </th>
                          <th className="text-right px-3 py-2.5 font-bold text-purple-800">
                            Custeio Operacional (OPEX)
                          </th>
                          <th className="text-right px-3 py-2.5 font-bold bg-blue-50 text-blue-900">
                            Total TCO (CAPEX + OPEX)
                          </th>
                          <th className="text-right px-3 py-2.5 font-bold text-emerald-800">
                            Repasse Est. FUNDEB+PNAE
                          </th>
                          <th className="text-right px-3 py-2.5 font-bold bg-amber-50/70 text-amber-900">
                            Esforço Líquido MDE (OPEX)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sustentabilidadeFiscal.fluxoIntegradoAnual.map(row => (
                          <tr key={row.ano} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5 font-black text-slate-800">
                              {row.ano}{' '}
                              <span className="text-[10px] font-normal text-slate-500">
                                ({row.vagasEmOperacaoMediaAno} vg méd.)
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-slate-700">
                              {row.capexObrasAcoes > 0 ? BRL(row.capexObrasAcoes) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right text-purple-800 font-medium">
                              {row.totalOpex > 0 ? BRL(row.totalOpex) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-extrabold bg-blue-50/40 text-blue-900">
                              {BRL(row.totalTcoMunicipal)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                              {row.receitaVinculadaTotal > 0
                                ? `+${BRL(row.receitaVinculadaTotal)}`
                                : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold bg-amber-50/30 text-amber-900">
                              {row.esforcoLiquidoTesouroMde > 0
                                ? BRL(row.esforcoLiquidoTesouroMde)
                                : 'R$ 0,00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
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
                  mobiliario: projecao.mobiliario,
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
            </div>

            {/* Footer idêntico ao PlanoForm */}
            <div className="border-t border-slate-200 bg-slate-50 px-7 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={handleBackClick}
                className="flex items-center gap-2 px-5 py-2.5 text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSavePlano}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-xs text-sm"
                  title="Salvar progresso atual do Plano de Custeio"
                >
                  <Save className="w-4 h-4" />
                  Salvar Plano de Custeio
                </button>

                {currentTabIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab(TABS[Math.max(0, currentTabIdx - 1)].id)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors text-sm"
                  >
                    ← Anterior
                  </button>
                )}

                {currentTabIdx < TABS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab(TABS[currentTabIdx + 1].id)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                  >
                    Próxima →
                  </button>
                )}
              </div>
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
