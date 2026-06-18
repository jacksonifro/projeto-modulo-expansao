import { useState, useEffect } from 'react';
import {
  ChevronLeft, Save, X, Plus, Trash2, UserPlus,
  Building2, AlertCircle, CheckCircle2, BarChart3, Users,
  TrendingUp, MapPin, BookOpen, Wrench, ClipboardList, DollarSign,
} from 'lucide-react';
import { mockServidores, mockUnidades, mockDemandaBairro, mockDemandaEtapa, mockProjecaoVagas, mockPlans, mockActivities, mockCadUnicoUnidade } from './mockData';
import { mockModelosCreche, mockModelosAmbiente, calcularCustoCreche, calcularCustoAmbiente, mockCargosReferencia } from './mockDataCusto';
import {
  ExpansionPlan, EstrategiaExpansao, AcaoUnidade, ObraConstrucao,
  MembroEquipe, FonteFinanciamento, EtapaEI, Prioridade,
  ModeloCreche, ModeloAmbiente, DesembolsoAnual, CargoReferencia,
  ConfiguracaoSala, ItemPessoal
} from './types';
import { calcularCustoObraTotal, calcularCustoAcaoTotal, calcularAutoDistribuicao } from './utils/planLogic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, ComposedChart, Line
} from 'recharts';

interface PlanoFormProps {
  onBack: () => void;
  isEdit?: boolean;
  planId?: string;
}

type TabGroup = 'planejamento' | 'diagnostico' | 'resultado';
type TabId =
  | 'dados' | 'equipe' | 'estrategias' | 'acoes-unidades' | 'obras' | 'desembolso' | 'pessoal' | 'projecao-orcamentaria'
  | 'vagas-turma' | 'demanda-etapa' | 'demanda-bairro' | 'demanda-unidade'
  | 'resultado';

const BRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const PCT = (v: number) => `${v.toFixed(1)}%`;

const FONTES_OPCOES = ['FNDE — Proinfância', 'Recurso Próprio', 'Emenda Parlamentar', 'Convênio MD Calha Norte', 'Convênio Estadual', 'Outros'];
const ETAPAS: EtapaEI[] = ['Maternal', 'Jardim I', 'Jardim II', 'Pré-Escola'];
const ESTRATEGIAS_PADRAO = [
  'Remanejamento de turmas', 'Ampliação de unidades existentes',
  'Construção FNDE', 'Construção Outras Fontes', 'Construção Recurso Próprios',
  'Convênio/Credenciamento', 'Parceria público-privada',
];
const VANTAGENS_OPCOES = ['Custo', 'Escala', 'Prazo', 'Complexidade', 'Qualidade', 'Flexibilidade', 'Esforço'];


interface TabDef { id: TabId; label: string; group: TabGroup; icon: React.ReactNode; desc: string }

const TABS: TabDef[] = [
  { id: 'dados', label: 'Dados Gerais', group: 'planejamento', icon: <ClipboardList className="w-4 h-4" />, desc: 'Nome, período, fontes' },
  { id: 'equipe', label: 'Equipe', group: 'planejamento', icon: <Users className="w-4 h-4" />, desc: 'Responsáveis e papéis' },
  { id: 'estrategias', label: 'Estratégias', group: 'planejamento', icon: <TrendingUp className="w-4 h-4" />, desc: 'Prioridades e viabilidade' },
  { id: 'acoes-unidades', label: 'Ações em Unidades', group: 'planejamento', icon: <Building2 className="w-4 h-4" />, desc: 'Adaptação e ampliação' },
  { id: 'obras', label: 'Obras', group: 'planejamento', icon: <Wrench className="w-4 h-4" />, desc: 'Novas e retomadas' },
  { id: 'desembolso', label: 'Desembolso', group: 'planejamento', icon: <DollarSign className="w-4 h-4" />, desc: 'Plano de desembolso anual' },
  { id: 'pessoal', label: 'Pessoal', group: 'planejamento', icon: <UserPlus className="w-4 h-4" />, desc: 'Contratações previstas' },
  { id: 'projecao-orcamentaria', label: 'Projeção Orçamentária', group: 'planejamento', icon: <DollarSign className="w-4 h-4" />, desc: 'Distribuição de investimento' },
  { id: 'vagas-turma', label: 'Vagas por Turma', group: 'diagnostico', icon: <BookOpen className="w-4 h-4" />, desc: 'Ocupação por unidade' },
  { id: 'demanda-etapa', label: 'Demanda por Etapa', group: 'diagnostico', icon: <BarChart3 className="w-4 h-4" />, desc: 'Déficit por faixa etária' },
  { id: 'demanda-bairro', label: 'Demanda por Bairro', group: 'diagnostico', icon: <MapPin className="w-4 h-4" />, desc: 'Demanda por região' },
  { id: 'demanda-unidade', label: 'CadÚnico / Unidade', group: 'diagnostico', icon: <Users className="w-4 h-4" />, desc: 'Crianças por raio' },
  { id: 'resultado', label: 'Resultado', group: 'resultado', icon: <CheckCircle2 className="w-4 h-4" />, desc: 'Consolidado e projeções' },
];

const GROUP_META: Record<TabGroup, { label: string; short: string; accent: string; bg: string; border: string; dot: string }> = {
  planejamento: { label: 'A — Planejamento', short: 'A', accent: 'text-blue-700', bg: 'bg-blue-600', border: 'border-blue-200', dot: 'bg-blue-600' },
  diagnostico: { label: 'B — Diagnóstico', short: 'B', accent: 'text-amber-700', bg: 'bg-amber-500', border: 'border-amber-200', dot: 'bg-amber-500' },
  resultado: { label: 'C — Resultado', short: 'C', accent: 'text-green-700', bg: 'bg-green-600', border: 'border-green-200', dot: 'bg-green-600' },
};

// Currency input with R$ mask
function CurrencyInput({ value, onChange, className, placeholder }: {
  value: number; onChange: (v: number) => void; className?: string; placeholder?: string;
}) {
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const [display, setDisplay] = useState(() => value > 0 ? fmt(value) : '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = raw === '' ? 0 : Number(raw) / 100;
    setDisplay(raw === '' ? '' : fmt(num));
    onChange(num);
  };
  const handleBlur = () => { setDisplay(value > 0 ? fmt(value) : ''); };
  const handleFocus = () => { if (value === 0) setDisplay(''); };

  useEffect(() => {
    setDisplay(value > 0 ? fmt(value) : '');
  }, [value]);

  return (
    <input
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
      placeholder={placeholder ?? 'R$ 0,00'}
    />
  );
}

export default function PlanoForm({ onBack, isEdit = false, planId }: PlanoFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dados');

  // Carregar planos e dados de custo do localStorage
  const [plans, setPlans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

  const [modelos] = useState<ModeloCreche[]>(() => {
    const cached = localStorage.getItem("exp_creches_modelos");
    if (!cached) return mockModelosCreche;
    const parsed: ModeloCreche[] = JSON.parse(cached);
    return parsed.map(m => {
      if (!m.pessoal) {
        const mockMatch = mockModelosCreche.find(x => x.id === m.id);
        return { ...m, pessoal: mockMatch?.pessoal || [] };
      }
      return m;
    });
  });

  const [ambientes] = useState<ModeloAmbiente[]>(() => {
    const cached = localStorage.getItem("exp_creches_ambientes");
    return cached ? JSON.parse(cached) : mockModelosAmbiente;
  });

  const [cargosRef] = useState<CargoReferencia[]>(() => {
    const cached = localStorage.getItem("exp_creches_cargos_ref");
    return cached ? JSON.parse(cached) : mockCargosReferencia;
  });

  // Localizar plano se for edição
  const planParaEditar = isEdit && planId ? plans.find(p => p.id === planId) : null;

  // Aba 0 — Dados
  const [nome, setNome] = useState(() => planParaEditar ? planParaEditar.nome : 'Plano de Expansão de Creches 2026–2029');
  const [periodoInicio, setPeriodoInicio] = useState(() => planParaEditar ? planParaEditar.periodoInicio : 2026);
  const [periodoFim, setPeriodoFim] = useState(() => planParaEditar ? planParaEditar.periodoFim : 2029);
  const [status, setStatus] = useState<ExpansionPlan['status']>(() => planParaEditar ? planParaEditar.status : 'Planejamento');
  const [descricao, setDescricao] = useState(() => planParaEditar ? planParaEditar.descricao : '');
  const [objetivo, setObjetivo] = useState(() => planParaEditar ? (planParaEditar.objetivoEstrategico || planParaEditar.description || '') : 'Ampliar o acesso à educação pública de qualidade para a primeira infância, gerando oportunidades e reduzindo desigualdades.');
  const [fontes, setFontes] = useState<FonteFinanciamento[]>(() => planParaEditar ? (planParaEditar.fontesFinanciamento || []) : [
    { id: 'ff1', fonte: 'FNDE — Proinfância', valorPrevisto: 12415806 },
    { id: 'ff2', fonte: 'Recurso Próprio', valorPrevisto: 1289758 },
    { id: 'ff3', fonte: 'Convênio MD Calha Norte', valorPrevisto: 1189777 },
    { id: 'ff4', fonte: 'Emenda Parlamentar', valorPrevisto: 321184 },
  ]);

  const [novaFonteSelecionada, setNovaFonteSelecionada] = useState(FONTES_OPCOES[0]);
  const [novoValorFonte, setNovoValorFonte] = useState(0);

  const [filtroServidor, setFiltroServidor] = useState('');
  const [servidorSelecionadoId, setServidorSelecionadoId] = useState('');
  const [papelSelecionado, setPapelSelecionado] = useState<MembroEquipe['papel']>('membro');
  const [raioSelecionado, setRaioSelecionado] = useState<number>(1000);

  const [filtroTipoObra, setFiltroTipoObra] = useState<'todas' | 'nova' | 'retomada'>('todas');
  const [filtroTipoAcao, setFiltroTipoAcao] = useState<'todas' | 'ampliacao' | 'adaptacao'>('todas');

  // Aba 1 — Equipe
  const [equipe, setEquipe] = useState<MembroEquipe[]>(() => planParaEditar ? (planParaEditar.equipe || []) : [
    { id: 'eq1', servidorId: 's1', papel: 'aprovador' },
    { id: 'eq2', servidorId: 's2', papel: 'elaborador' },
    { id: 'eq3', servidorId: 's3', papel: 'elaborador' },
    { id: 'eq7', servidorId: 's7', papel: 'revisor' },
  ]);

  // Aba 2 — Estratégias
  const [estrategias, setEstrategias] = useState<EstrategiaExpansao[]>(() => planParaEditar ? (planParaEditar.estrategias || []) : [
    { id: 'e1', estrategia: 'Remanejamento de turmas', vantagens: ['Custo', 'Prazo', 'Flexibilidade'], desvantagens: [], viabilidadeTecnica: true, prioridade: 'P1', responsavelId: 's2', observacoes: '' },
    { id: 'e2', estrategia: 'Ampliação de unidades existentes', vantagens: ['Prazo', 'Flexibilidade'], desvantagens: [], viabilidadeTecnica: true, prioridade: 'P2', responsavelId: 's2', observacoes: '' },
    { id: 'e3', estrategia: 'Construção FNDE', vantagens: ['Custo', 'Escala', 'Qualidade'], desvantagens: ['Esforço'], viabilidadeTecnica: true, prioridade: 'P3', responsavelId: 's1', observacoes: '' },
    { id: 'e4', estrategia: 'Construção Recurso Próprios', vantagens: [], desvantagens: [], viabilidadeTecnica: false, prioridade: null, responsavelId: '', observacoes: '' },
    { id: 'e5', estrategia: 'Convênio/Credenciamento', vantagens: [], desvantagens: [], viabilidadeTecnica: false, prioridade: null, responsavelId: '', observacoes: '' },
  ]);

  // Aba 3 — Ações em Unidades
  const [acoes, setAcoes] = useState<AcaoUnidade[]>(() => planParaEditar ? (planParaEditar.acoesUnidades || []) : [
    {
      id: 'au1', tipo: 'adaptacao', unidadeId: 'ue3', salaId: 'sl11',
      descricao: 'Transformar Sala Multiuso em sala de Jardim I',
      etapaDestino: 'Jardim I', capacidadeAnterior: 30, novaCapacidade: 16,
      fonteFinanciamento: 'Recurso Próprio', custoPorSala: 0,
      previsaoConclusao: '2026-06-30',
      desembolsoPorAno: [{ ano: 2026, valor: 0, fonte: 'Recurso Próprio' }],
    },
  ]);

  // Aba 4 — Obras
  const [obras, setObras] = useState<ObraConstrucao[]>(() => planParaEditar ? (planParaEditar.obras || []) : [
    {
      id: 'ob1', tipo: 'retomada', nome: 'Creche Projeto Próprio — Liberdade',
      localizacao: 'Bairro Liberdade', bairro: 'Liberdade', setor: 'Região Sul',
      numeroConvenio: 'MD Calha Norte/2023', percentualConclusaoAtual: 60,
      tipoProjetoFNDE: 'proprio', numeroDeSalas: 4, etapasAtendidas: ['Jardim I', 'Jardim II'],
      desembolsoPorAno: [
        { ano: 2026, valor: 800000, fonte: 'Recurso Próprio' },
        { ano: 2026, valor: 708000, fonte: 'Convênio MD Calha Norte' },
      ],
      contrapartidaMunicipal: 53, previsaoConclusao: '2026-12-31', statusObra: 'em_execucao',
      coordenadas: { lat: -11.4500, lng: -61.4500 }
    },
  ]);

  // Aba 6 — Vagas por Turma (Matrículas Customizadas)
  const [matriculasPorUnidade, setMatriculasPorUnidade] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    mockUnidades.forEach(u => initial[u.id] = u.totalMatriculas);
    return initial;
  });

  // Atualizar estados dinamicamente se o plano selecionado para edição mudar
  useEffect(() => {
    if (isEdit && planId) {
      const target = plans.find(p => p.id === planId);
      if (target) {
        setNome(target.nome);
        setPeriodoInicio(target.periodoInicio);
        setPeriodoFim(target.periodoFim);
        setStatus(target.status);
        setDescricao(target.descricao);
        setObjetivo(target.objetivoEstrategico || target.description || '');
        setFontes(target.fontesFinanciamento || []);
        setEquipe(target.equipe || []);
        setEstrategias(target.estrategias || []);
        setAcoes(target.acoesUnidades || []);
        setObras(target.obras || []);
      }
    }
  }, [isEdit, planId, plans]);

  const currentIdx = TABS.findIndex(t => t.id === activeTab);
  const activeGroup = TABS[currentIdx]?.group ?? 'planejamento';

  // Helpers
  const addFonte = () => {
    if (novoValorFonte <= 0) {
      alert("Por favor, insira um valor válido para a fonte de financiamento.");
      return;
    }
    setFontes(f => [...f, { id: `ff${Date.now()}`, fonte: novaFonteSelecionada, valorPrevisto: novoValorFonte }]);
    setNovoValorFonte(0);
  };
  const removeFonte = (id: string) => setFontes(f => f.filter(x => x.id !== id));
  const totalFontes = fontes.reduce((s, f) => s + f.valorPrevisto, 0);

  const addMembro = (servidorId: string) => {
    if (equipe.some(e => e.servidorId === servidorId)) return;
    setEquipe(e => [...e, { id: `eq${Date.now()}`, servidorId, papel: 'membro' }]);
  };
  const removeMembro = (id: string) => setEquipe(e => e.filter(x => x.id !== id));

  const toggleMembro = (servidorId: string) => {
    setEquipe(prev => {
      const exists = prev.some(e => e.servidorId === servidorId);
      if (exists) {
        return prev.filter(e => e.servidorId !== servidorId);
      } else {
        return [...prev, { id: `eq-${Date.now()}`, servidorId, papel: 'membro' }];
      }
    });
  };

  const updatePapelMembro = (servidorId: string, papel: MembroEquipe['papel']) => {
    setEquipe(prev => prev.map(e => e.servidorId === servidorId ? { ...e, papel } : e));
  };

  const toggleVantagem = (eId: string, tag: string, field: 'vantagens' | 'desvantagens') => {
    setEstrategias(prev => prev.map(e => {
      if (e.id !== eId) return e;
      const arr = e[field];
      return { ...e, [field]: arr.includes(tag) ? arr.filter(t => t !== tag) : [...arr, tag] };
    }));
  };

  const addAcao = () => setAcoes(a => [...a, {
    id: `au${Date.now()}`, tipo: 'adaptacao', unidadeId: '', salaId: '',
    modeloCrecheId: '',
    descricao: '', etapaDestino: 'Jardim I', capacidadeAnterior: 0, novaCapacidade: 16,
    fonteFinanciamento: 'Recurso Próprio', custoPorSala: 0,
    previsaoConclusao: '2026-12-31', desembolsoPorAno: [],
  }]);
  const removeAcao = (id: string) => setAcoes(a => a.filter(x => x.id !== id));

  const addObra = () => setObras(o => [...o, {
    id: `ob${Date.now()}`, tipo: 'nova', nome: '', localizacao: '', bairro: '', setor: '',
    modeloCrecheId: '', numeroDeSalas: 0, etapasAtendidas: [], desembolsoPorAno: [],
    previsaoConclusao: '2029-12-31', statusObra: 'planejada',
    coordenadas: { lat: -11.4343, lng: -61.4484 }
  }]);
  const removeObra = (id: string) => setObras(o => o.filter(x => x.id !== id));



  // ═══ ABA 5 — PESSOAL: Estados e Funções ═══════════════════════════════════════

  const [configSalas, setConfigSalas] = useState<ConfiguracaoSala[]>(() => planParaEditar ? (planParaEditar.configSalas || []) : []);
  const [pessoal, setPessoal] = useState<ItemPessoal[]>(() => planParaEditar && planParaEditar.pessoal ? planParaEditar.pessoal : []);

  // Extrair salas de obras e ações
  const extrairSalasPlanejadas = (): ConfiguracaoSala[] => {
    const salas: ConfiguracaoSala[] = [];

    // Das obras
    obras.forEach(obra => {
      for (let i = 1; i <= obra.numeroDeSalas; i++) {
        salas.push({
          id: `obra-${obra.id}-sala-${i}`,
          origem: 'obra',
          origemId: obra.id,
          nome: `${obra.nome || 'Obra sem nome'} — Sala ${i}`,
          numeroTurmas: 2,
          etapas: obra.etapasAtendidas ?? [],
        });
      }
    });

    // Das ações (ampliações)
    acoes.filter(a => a.tipo === 'ampliacao').forEach(acao => {
      const unidade = mockUnidades.find(u => u.id === acao.unidadeId);
      salas.push({
        id: `acao-${acao.id}`,
        origem: 'acao',
        origemId: acao.id,
        nome: `Ampliação ${unidade?.nome || 'Unidade'} — ${acao.descricao || 'Nova sala'}`,
        numeroTurmas: 1,
        etapas: [acao.etapaDestino],
      });
    });

    return salas;
  };

  // Inicializar configuração de salas se não existir
  const inicializarConfigSalas = () => {
    const salasExtraidas = extrairSalasPlanejadas();
    // Manter as configurações existentes e adicionar apenas novas
    const idsExistentes = new Set(configSalas.map(s => s.id));
    const novasSalas = salasExtraidas.filter(s => !idsExistentes.has(s.id));
    if (novasSalas.length > 0) {
      setConfigSalas([...configSalas, ...novasSalas]);
    }
  };

  // Calcular necessidade automática de pessoal
  const calcularNecessidadePessoal = () => {
    const salasAtualizadas = configSalas.length === 0 ? extrairSalasPlanejadas() : configSalas;
    const totalTurmas = salasAtualizadas.reduce((s, sala) => s + sala.numeroTurmas, 0);

    const cargoMap = new Map<string, number>();

    // Encontrar os IDs dinamicamente pelo catálogo (fallback para os mocks conhecidos)
    const idProfessor = cargosRef.find(c => c.descricao.toLowerCase().includes('professor'))?.id || 'cg03';
    const idMonitor = cargosRef.find(c => c.descricao.toLowerCase().includes('monitor') || c.descricao.toLowerCase().includes('auxiliar de creche'))?.id || 'cg04';

    // 1. Pessoal dos Modelos Base das Obras (Pacote Fechado)
    obras.forEach(obra => {
      const model = modelos.find(m => m.tipoBase === obra.tipoProjetoFNDE);
      if (model && model.pessoal) {
        model.pessoal.forEach(mp => {
          cargoMap.set(mp.cargoId, (cargoMap.get(mp.cargoId) || 0) + mp.quantidade);
        });
      }
    });

    // 2. Pessoal das Ações (Adaptação/Ampliação - Cálculo Dinâmico por Turma)
    const turmasDeAcoes = salasAtualizadas.filter(s => s.origem === 'acao').reduce((s, sala) => s + sala.numeroTurmas, 0);
    if (turmasDeAcoes > 0) {
      cargoMap.set(idProfessor, (cargoMap.get(idProfessor) || 0) + turmasDeAcoes); // 1 prof por turma nova
      cargoMap.set(idMonitor, (cargoMap.get(idMonitor) || 0) + turmasDeAcoes); // 1 monitor por turma nova
    }

    const novosItens: ItemPessoal[] = [];
    cargoMap.forEach((quantidade, cargoId) => {
      const cg = cargosRef.find(c => c.id === cargoId);
      if (cg) {
        const desc = cg.descricao.toLowerCase();
        const isApoio = desc.includes('limpeza') || desc.includes('merendeira') || desc.includes('cozinheira') || desc.includes('vigil');
        const isAdmin = desc.includes('diretor') || desc.includes('coordenador') || desc.includes('secret');
        const categoria = isAdmin ? 'administrativo' : isApoio ? 'apoio' : 'pedagogico';

        novosItens.push({
          id: `auto-${cargoId}-${Date.now()}`,
          funcao: cg.descricao,
          categoria,
          quantidade,
          remuneracaoBase: cg.remuneracaoBase,
          auxilios: cg.auxilios,
          autoCalculado: true,
        });
      }
    });

    const pessoalManual = pessoal.filter(p => !p.autoCalculado);
    setPessoal([...novosItens, ...pessoalManual]);
    if (configSalas.length === 0) {
      setConfigSalas(salasAtualizadas);
    }
  };

  const addItemPessoal = (categoria: ItemPessoal['categoria']) => {
    setPessoal(p => [...p, {
      id: `p${Date.now()}`,
      funcao: '',
      categoria,
      quantidade: 1,
      remuneracaoBase: 0,
      auxilios: 0,
      autoCalculado: false,
    }]);
  };

  const removeItemPessoal = (id: string) => setPessoal(p => p.filter(x => x.id !== id));

  const calcularCustoPessoal = (item: ItemPessoal) => {
    const cargoConf = cargosRef.find(c => c.descricao === item.funcao);
    const patronal = cargoConf ? cargoConf.patronal : 0;
    const custoMensal = (item.remuneracaoBase + item.auxilios + patronal) * item.quantidade;
    const custoAnual = custoMensal * 13.3; // 13º salário e 1/3 de férias
    return { patronal, custoMensal, custoAnual };
  };

  const calcularStatusPlano = (): ExpansionPlan['status'] => {
    if (obras.length === 0 && acoes.length === 0) return 'Planejamento';

    // Buscar todas as atividades associadas às obras e ações deste plano
    const idsObrasEAcoes = new Set([...obras.map(o => o.id), ...acoes.map(a => a.id)]);
    const atividadesPlano = mockActivities.filter(a =>
      (a.planId === planId) ||
      (a.itemId && idsObrasEAcoes.has(a.itemId))
    );

    if (atividadesPlano.length === 0) {
      const todosObrasPlanejadas = obras.every(o => o.statusObra === 'planejada');
      const todasAcoesSemPrevisao = acoes.every(a => !a.previsaoConclusao);
      if (todosObrasPlanejadas && todasAcoesSemPrevisao) return 'Planejamento';

      const temObraEmExecucao = obras.some(o => o.statusObra === 'em_execucao' || o.statusObra === 'em_licitacao');
      return temObraEmExecucao ? 'Em execução' : 'Planejamento';
    }

    const totalAtividades = atividadesPlano.length;
    const concluidas = atividadesPlano.filter(a => a.status === 'FEITO').length;
    const aFazer = atividadesPlano.filter(a => a.status === 'A FAZER').length;

    if (concluidas === totalAtividades) return 'Concluído';
    if (aFazer === totalAtividades) return 'Planejamento';
    return 'Em execução';
  };

  const statusCalculado = calcularStatusPlano();

  const totalSalasPlanejadas = obras.reduce((s, o) => s + o.numeroDeSalas, 0) + acoes.filter(a => a.tipo === 'ampliacao').length;
  const totalTurmasPlanejadas = configSalas.reduce((s, sala) => s + sala.numeroTurmas, 0);
  const totalCustoAnualPessoal = pessoal.reduce((s, p) => s + calcularCustoPessoal(p).custoAnual, 0);

  const calcularCusteioOperacionalPlano = () => {
    let totalCusteio = 0;
    obras.forEach(obra => {
      const model = modelos.find(m => m.tipoBase === obra.tipoProjetoFNDE);
      if (model) {
        // Calcular custeio unitário do modelo
        const custeioUnitario =
          (model.servicos || []).reduce((s, sv) => s + sv.valorAnual, 0) +
          (model.aquisicoes || []).reduce((s, aq) => s + aq.quantidadeAnual * aq.valorUnitario, 0);
        totalCusteio += custeioUnitario;
      }
    });
    return totalCusteio;
  };
  const totalCusteioModelos = calcularCusteioOperacionalPlano();

  // Helpers para custos por obra / ação
  const autoDistribuirDesembolso = () => {
    const { finalObras, finalAcoes } = calcularAutoDistribuicao(periodoInicio, periodoFim, fontes, obras, acoes, modelos, ambientes);
    setObras(finalObras);
    setAcoes(finalAcoes);
    alert('Auto-distribuição concluída (respeitando montantes por ano nas fontes).');
  };

  const updateDesembolsoFonte = (itemType: 'obra' | 'acao', itemId: string, entryIndex: number, changes: Partial<Pick<DesembolsoAnual, 'valor' | 'fonte'>>) => {
    const applyChanges = (entries: DesembolsoAnual[]) => entries.map((entry, idx) => idx === entryIndex ? { ...entry, ...changes } : entry);

    if (itemType === 'obra') {
      setObras(prev => prev.map(o => o.id === itemId ? { ...o, desembolsoPorAno: applyChanges(o.desembolsoPorAno || []) } : o));
    } else {
      setAcoes(prev => prev.map(a => a.id === itemId ? { ...a, desembolsoPorAno: applyChanges(a.desembolsoPorAno || []) } : a));
    }
  };

  const addDesembolsoFonte = (itemType: 'obra' | 'acao', itemId: string, ano: number) => {
    const novaFonte: DesembolsoAnual = { ano, valor: 0, fonte: fontes[0]?.fonte || 'Recurso Próprio' };
    if (itemType === 'obra') {
      setObras(prev => prev.map(o => o.id === itemId ? { ...o, desembolsoPorAno: [...(o.desembolsoPorAno || []), novaFonte] } : o));
    } else {
      setAcoes(prev => prev.map(a => a.id === itemId ? { ...a, desembolsoPorAno: [...(a.desembolsoPorAno || []), novaFonte] } : a));
    }
  };

  const removeDesembolsoFonte = (itemType: 'obra' | 'acao', itemId: string, entryIndex: number) => {
    const removeEntry = (entries: DesembolsoAnual[]) => entries.filter((_, idx) => idx !== entryIndex);
    if (itemType === 'obra') {
      setObras(prev => prev.map(o => o.id === itemId ? { ...o, desembolsoPorAno: removeEntry(o.desembolsoPorAno || []) } : o));
    } else {
      setAcoes(prev => prev.map(a => a.id === itemId ? { ...a, desembolsoPorAno: removeEntry(a.desembolsoPorAno || []) } : a));
    }
  };

  const fontesDisponiveis = Array.from(new Set([...fontes.map(f => f.fonte), ...FONTES_OPCOES]));

  const anosPlano = Array.from({ length: periodoFim - periodoInicio + 1 }, (_, i) => periodoInicio + i);



  const itensDesembolso = [
    ...obras.map(o => ({
      id: o.id,
      tipoKey: 'obra' as const,
      tipo: 'Obra',
      nome: o.nome || 'Obra sem nome',
      descricao: o.bairro || o.localizacao || 'Sem local',
      totalInvestimento: calcularCustoObraTotal(o, modelos, ambientes).total,
      desembolsoByAno: anosPlano.map(ano => {
        const entries = (o.desembolsoPorAno || []).map((entry, index) => ({ entry, index })).filter(item => item.entry.ano === ano);
        return {
          ano,
          valor: entries.reduce((s, item) => s + item.entry.valor, 0),
          entries,
        };
      }),
    })),
    ...acoes.map(a => ({
      id: a.id,
      tipoKey: 'acao' as const,
      tipo: a.tipo === 'ampliacao' ? 'Ação - Ampliação' : 'Ação - Adaptação',
      nome: a.tipo === 'ampliacao' ? `Ampliação — ${a.descricao || 'Sala extra'}` : `Adaptação — ${a.descricao || 'Ajuste de sala'}`,
      descricao: a.fonteFinanciamento || '',
      totalInvestimento: calcularCustoAcaoTotal(a).total,
      desembolsoByAno: anosPlano.map(ano => {
        const entries = (a.desembolsoPorAno || []).map((entry, index) => ({ entry, index })).filter(item => item.entry.ano === ano);
        return {
          ano,
          valor: entries.reduce((s, item) => s + item.entry.valor, 0),
          entries,
        };
      }),
    })),
  ];

  const demandaPorAno = anosPlano.map(ano => ({
    ano,
    valor: itensDesembolso.reduce((s, item) => s + (item.desembolsoByAno.find(d => d.ano === ano)?.valor || 0), 0),
  }));

  const saldoPorAno = [] as { ano: number, disponivel: number, demanda: number, saldo: number }[];
  let saldoAcumulado = fontes.reduce((s, f) => s + f.valorPrevisto, 0);
  for (const ano of anosPlano) {
    const demandaAno = demandaPorAno.find(d => d.ano === ano)?.valor || 0;
    const disponivelAno = saldoAcumulado;
    const saldoFinalAno = disponivelAno - demandaAno;
    saldoPorAno.push({ ano, disponivel: disponivelAno, demanda: demandaAno, saldo: saldoFinalAno });
    saldoAcumulado = saldoFinalAno;
  }

  const totalDemanda = demandaPorAno.reduce((s, d) => s + d.valor, 0);
  const totalFonte = fontes.reduce((s, f) => s + f.valorPrevisto, 0);

  const handleSalvarPlano = () => {
    if (!nome.trim()) {
      alert("Por favor, preencha o nome do plano.");
      return;
    }

    const responsavelServidor = mockServidores.find(s => s.id === (equipe.find(e => e.papel === 'aprovador')?.servidorId || equipe[0]?.servidorId));
    const responsavelNome = responsavelServidor ? responsavelServidor.nome : 'Responsável não definido';
    const fontePrincipal = fontes.length > 0 ? fontes[0].fonte : 'Recurso Próprio';

    const planData: ExpansionPlan = {
      id: isEdit && planId ? planId : `p-${Date.now()}`,
      nome: nome.trim(),
      periodoInicio,
      periodoFim,
      status: statusCalculado,
      descricao: descricao.trim(),
      objetivoEstrategico: objetivo.trim(),
      fontesFinanciamento: fontes,
      responsavelId: equipe.find(e => e.papel === 'aprovador')?.servidorId || equipe[0]?.servidorId || '',
      dataElaboracao: planParaEditar?.dataElaboracao || new Date().toISOString().split('T')[0],
      dataRevisao: new Date().toISOString().split('T')[0],
      dataAprovacao: statusCalculado === 'Concluído' ? new Date().toISOString().split('T')[0] : planParaEditar?.dataAprovacao,
      equipe,
      estrategias,
      acoesUnidades: acoes,
      obras,
      pessoal,
      configSalas,
      name: nome.trim(),
      year: periodoInicio,
      description: descricao.trim(),
      responsible: responsavelNome,
      fundingSource: fontePrincipal,
      estimatedValue: totalFontes,
      startDate: `${periodoInicio}-01-01`,
      expectedEndDate: `${periodoFim}-12-31`,
    };

    let updatedPlansList: ExpansionPlan[];
    if (isEdit && planId) {
      updatedPlansList = plans.map(p => p.id === planId ? planData : p);
    } else {
      updatedPlansList = [...plans, planData];
    }

    localStorage.setItem("exp_creches_plans", JSON.stringify(updatedPlansList));
    alert(isEdit ? "Plano atualizado com sucesso!" : "Plano criado com sucesso!");
    onBack();
  };

  // ═══ PROJEÇÃO ORÇAMENTÁRIA ═══════════════════════════════════════════════════

  interface ItemOrcamentario {
    id: string;
    tipo: 'obra' | 'acao';
    nome: string;
    descricao: string;
    salas: number;
    vagas: number;
    desembolsoPorAno: { ano: number; valor: number }[];
    totalInvestimento: number;
    custoPessoalAnual: number;
    anoConclusao: number | null;
  }

  const consolidarProjecaoOrcamentaria = (): ItemOrcamentario[] => {
    const itens: ItemOrcamentario[] = [];
    const anosPlano = [periodoInicio, periodoInicio + 1, periodoInicio + 2, periodoInicio + 3];

    // Obras
    obras.forEach(obra => {
      const totalDesembolso = obra.desembolsoPorAno.reduce((s, d) => s + d.valor, 0);
      const desembolsoConsolidado = anosPlano.map(ano => ({
        ano,
        valor: obra.desembolsoPorAno
          .filter(d => d.ano === ano)
          .reduce((s, d) => s + d.valor, 0)
      }));

      const vagasEstimadas = obra.capacidadeAlunos || 0;

      const turmas = configSalas.find(c => c.id === obra.id)?.numeroTurmas || 0;
      const custoPessoalAnual = totalTurmasPlanejadas > 0 ? (turmas / totalTurmasPlanejadas) * totalCustoAnualPessoal : 0;
      const anoConclusao = obra.previsaoConclusao ? new Date(obra.previsaoConclusao).getFullYear() : null;

      itens.push({
        id: obra.id,
        tipo: 'obra',
        nome: obra.nome || 'Obra sem nome',
        descricao: `${obra.tipo === 'retomada' ? 'Retomada de obra' : 'Obra nova'} — ${obra.bairro || 'localização não definida'}`,
        salas: obra.numeroDeSalas,
        vagas: vagasEstimadas,
        desembolsoPorAno: desembolsoConsolidado,
        totalInvestimento: totalDesembolso,
        custoPessoalAnual,
        anoConclusao,
      });
    });

    // Ações
    acoes.forEach(acao => {
      const unidade = mockUnidades.find(u => u.id === acao.unidadeId);
      const totalDesembolso = acao.desembolsoPorAno?.reduce((s, d) => s + d.valor, 0) || acao.custoPorSala;
      const desembolsoConsolidado = anosPlano.map(ano => ({
        ano,
        valor: (acao.desembolsoPorAno || [])
          .filter(d => d.ano === ano)
          .reduce((s, d) => s + d.valor, 0)
      }));

      // Se não há desembolso por ano, usar o ano de conclusão
      if (totalDesembolso > 0 && desembolsoConsolidado.every(d => d.valor === 0) && acao.previsaoConclusao) {
        const anoConclusao = new Date(acao.previsaoConclusao).getFullYear();
        const idx = desembolsoConsolidado.findIndex(d => d.ano === anoConclusao);
        if (idx >= 0) {
          desembolsoConsolidado[idx].valor = totalDesembolso;
        }
      }

      const turmas = configSalas.find(c => c.id === acao.id)?.numeroTurmas || 0;
      const custoPessoalAnual = totalTurmasPlanejadas > 0 ? (turmas / totalTurmasPlanejadas) * totalCustoAnualPessoal : 0;
      const anoConclusao = acao.previsaoConclusao ? new Date(acao.previsaoConclusao).getFullYear() : null;

      itens.push({
        id: acao.id,
        tipo: 'acao',
        nome: `${acao.tipo === 'adaptacao' ? 'Adaptação' : 'Ampliação'} — ${unidade?.nome || 'Unidade'}`,
        descricao: acao.descricao || '',
        salas: acao.tipo === 'ampliacao' ? 1 : 0,
        vagas: acao.novaCapacidade || 0,
        desembolsoPorAno: desembolsoConsolidado,
        totalInvestimento: totalDesembolso,
        custoPessoalAnual,
        anoConclusao,
      });
    });

    return itens;
  };

  const itensOrcamentarios = consolidarProjecaoOrcamentaria();
  const anosProjecao = [periodoInicio, periodoInicio + 1, periodoInicio + 2, periodoInicio + 3];

  const totaisConsolidados = {
    investimentoPorAno: anosProjecao.map(ano => ({
      ano,
      valor: itensOrcamentarios.reduce((s, item) =>
        s + (item.desembolsoPorAno.find(d => d.ano === ano)?.valor || 0), 0)
    })),
    vagasPorAno: anosProjecao.map(ano => ({
      ano,
      vagas: itensOrcamentarios
        .filter(item => {
          const desembolso = item.desembolsoPorAno.find(d => d.ano === ano);
          return desembolso && desembolso.valor > 0;
        })
        .reduce((s, item) => s + item.vagas, 0)
    })),
    salasPorAno: anosProjecao.map(ano => ({
      ano,
      salas: itensOrcamentarios
        .filter(item => {
          const desembolso = item.desembolsoPorAno.find(d => d.ano === ano);
          return desembolso && desembolso.valor > 0;
        })
        .reduce((s, item) => s + item.salas, 0)
    })),
    totalInvestimento: itensOrcamentarios.reduce((s, item) => s + item.totalInvestimento, 0),
    totalVagas: itensOrcamentarios.reduce((s, item) => s + item.vagas, 0),
    totalSalas: itensOrcamentarios.reduce((s, item) => s + item.salas, 0),
  };

  const PRIORIDADE_COLOR: Record<string, string> = {
    P1: 'bg-red-500 text-white', P2: 'bg-amber-400 text-white', P3: 'bg-slate-300 text-slate-700',
  };

  const inputCls = "w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white";

  // Sidebar navigation groups
  const groups: TabGroup[] = ['planejamento', 'diagnostico', 'resultado'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6">
        {/* Page header */}
        <div className="mb-5">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            Voltar aos Planos
          </button>
          <h1 className="text-3xl font-bold text-slate-800 mb-0.5">
            {isEdit ? 'Editar Plano de Expansão' : 'Novo Plano de Expansão'}
          </h1>
          <p className="text-slate-500 text-sm">{isEdit ? 'Atualize as informações do plano' : 'Preencha os dados para criar um novo plano'}</p>
        </div>

        <div className="flex gap-5 items-start">
          {/* ── LEFT SIDEBAR NAV ── */}
          <aside className="w-56 shrink-0 bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6">
            <div className="bg-gradient-to-br from-[#1a3a5c] to-[#2563eb] p-4">
              <p className="text-white font-bold text-sm">Seções do Plano</p>
              <p className="text-blue-200 text-xs mt-0.5">11 etapas em 3 grupos</p>
            </div>

            <nav className="p-2">
              {groups.map(group => {
                const gm = GROUP_META[group];
                const gTabs = TABS.filter(t => t.group === group);
                const isActiveGroup = activeGroup === group;
                return (
                  <div key={group} className="mb-3">
                    {/* Group label */}
                    <div className={`flex items-center gap-2 px-2 py-1.5 mb-1`}>
                      <div className={`w-5 h-5 rounded-full ${gm.bg} flex items-center justify-center`}>
                        <span className="text-white text-xs font-black">{gm.short}</span>
                      </div>

                      {/* Apenas letra e nome da seção (sumário reduzido) */}

                      <span className={`text-xs font-bold uppercase tracking-wide ${isActiveGroup ? gm.accent : 'text-slate-400'}`}>
                        {group === 'planejamento' ? 'Planejamento' : group === 'diagnostico' ? 'Diagnóstico' : 'Resultado'}
                      </span>
                    </div>

                    {gTabs.map((tab, i) => {
                      const globalIdx = TABS.findIndex(t => t.id === tab.id);
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5 group ${isActive
                            ? group === 'planejamento' ? 'bg-blue-600 text-white shadow-md'
                              : group === 'diagnostico' ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-green-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition-all ${isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-200 text-slate-500 group-hover:bg-slate-300'
                            }`}>
                            {globalIdx + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs font-semibold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>
                              {tab.label}
                            </div>
                            <div className={`text-xs leading-tight truncate ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                              {tab.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {group !== 'resultado' && <div className="border-b border-slate-100 mt-2 mb-1" />}
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
                  style={{ width: `${((currentIdx + 1) / TABS.length) * 100}%` }}
                />
              </div>
              <div className="text-xs text-slate-400 mt-1">{currentIdx + 1} de {TABS.length}</div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Section banner */}
            {activeGroup === 'diagnostico' && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center gap-2 text-amber-800 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className='font-semibold'>Painel de Diagnóstico:</span> Dados extraídos do Central de Vagas em Creches e Base de Dados do cadÚnico.
              </div>
            )}
            {activeGroup === 'resultado' && (
              <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center gap-2 text-green-800 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Painel de resultado — consolida demanda, planejamento e projeção orçamentária.
              </div>
            )}

            {/* Tab content */}
            <div className="p-7">

              {/* ═══ ABA 0 — DADOS GERAIS ════════════════════════════════ */}
              {activeTab === 'dados' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">Dados Gerais do Plano</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Nome do Plano *</label>
                      <input value={nome} onChange={e => setNome(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ex: Plano de Expansão de Creches 2026–2029" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status do Plano</label>
                      <div className="flex items-center h-[46px]">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${statusCalculado === 'Em execução' ? 'bg-green-100 text-green-700 border-green-200' :
                          statusCalculado === 'Planejamento' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            statusCalculado === 'Paralisado' ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-purple-100 text-purple-700 border-purple-200'
                          }`}>
                          {statusCalculado}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Ano Início</label>
                      <input type="number" value={periodoInicio} onChange={e => setPeriodoInicio(Number(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Ano Fim</label>
                      <input type="number" value={periodoFim} onChange={e => setPeriodoFim(Number(e.target.value))}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Objetivo Estratégico</label>
                    <textarea value={objetivo} onChange={e => setObjetivo(e.target.value)} rows={2}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Descreva o objetivo estratégico do plano..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição / Justificativa</label>
                    <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={3}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Justifique a necessidade e contexto do plano..." />
                  </div>

                  {/* Fontes de financiamento */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-slate-700">Fontes de Financiamento Disponíveis</label>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 mb-4 items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Fonte</label>
                        <select value={novaFonteSelecionada} onChange={e => setNovaFonteSelecionada(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                          {FONTES_OPCOES.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="w-full md:w-48">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Valor Previsto (R$)</label>
                        <CurrencyInput
                          value={novoValorFonte}
                          onChange={setNovoValorFonte}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right font-semibold text-slate-800"
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <button onClick={addFonte} className="w-full md:w-auto flex items-center justify-center gap-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors">
                        <Plus className="w-4 h-4" /> Adicionar
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-3 shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600">Fonte de Financiamento</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-600 w-[220px]">Valor Previsto</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-600 w-[70px]">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fontes.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                                Nenhuma fonte de financiamento cadastrada para este plano.
                              </td>
                            </tr>
                          ) : (
                            fontes.map(f => (
                              <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 text-slate-700">{f.fonte}</td>
                                <td className="px-4 py-3 text-right font-semibold text-green-700">{BRL(f.valorPrevisto)}</td>
                                <td className="px-4 py-3 text-center">
                                  <button onClick={() => removeFonte(f.id)} className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors" title="Remover fonte">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center">
                        <span className="font-bold text-slate-700 text-sm">TOTAL INVESTIMENTO PREVISTO</span>
                        <span className="font-black text-xl text-blue-700">{BRL(totalFontes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ABA X — DESEMBOLSO ═════════════════════════════════════ */}
              {activeTab === 'desembolso' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Plano de Desembolso Anual</h2>
                      <p className="text-slate-500 text-sm mt-1">Fontes por ano, obras e ações distribuídas por ano e saldo anual.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={autoDistribuirDesembolso} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Auto-distribuir</button>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 text-slate-700 font-semibold">Fontes de financiamento disponíveis</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left px-4 py-2 font-semibold text-slate-700">Fonte</th>
                              <th className="text-right px-4 py-2 font-semibold text-slate-700">Valor previsto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {fontes.slice().sort((a, b) => a.fonte.localeCompare(b.fonte)).map(fonte => (
                              <tr key={fonte.id}>
                                <td className="px-4 py-2 text-slate-700">{fonte.fonte || 'Fonte não definida'}</td>
                                <td className="px-4 py-2 text-right text-slate-800 font-semibold">{BRL(fonte.valorPrevisto)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold text-slate-800">
                            <tr>
                              <td className="px-4 py-2">Total disponível</td>
                              <td className="px-4 py-2 text-right">{BRL(totalFonte)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 text-slate-700 font-semibold">Saldo anual</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left px-4 py-2 font-semibold text-slate-700">Ano</th>
                              <th className="text-right px-4 py-2 font-semibold text-slate-700">Disponível</th>
                              <th className="text-right px-4 py-2 font-semibold text-slate-700">Desembolso</th>
                              <th className="text-right px-4 py-2 font-semibold text-slate-700">Saldo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {saldoPorAno.map(linha => (
                              <tr key={linha.ano}>
                                <td className="px-4 py-2 text-slate-700">{linha.ano}</td>
                                <td className="px-4 py-2 text-right text-green-700 font-semibold">{BRL(linha.disponivel)}</td>
                                <td className="px-4 py-2 text-right text-slate-700">{BRL(linha.demanda)}</td>
                                <td className={`px-4 py-2 text-right font-semibold ${linha.saldo < 0 ? 'text-red-600' : 'text-slate-800'}`}>{BRL(linha.saldo)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold text-slate-800">
                            <tr>
                              <td className="px-4 py-2">Total</td>
                              <td className="px-4 py-2 text-right">{BRL(totalFonte)}</td>
                              <td className="px-4 py-2 text-right">{BRL(totalDemanda)}</td>
                              <td className="px-4 py-2 text-right">{BRL(totalFonte - totalDemanda)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {itensDesembolso.map(item => (
                      <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-sm text-slate-500">{item.tipo}</div>
                            <h3 className="text-lg font-bold text-slate-900">{item.nome}</h3>
                            {item.descricao && <p className="text-sm text-slate-500 mt-1">{item.descricao}</p>}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Total previsto</div>
                            <div className="font-black text-xl text-slate-900">{BRL(item.totalInvestimento)}</div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-2">
                          {item.desembolsoByAno.map(yearBlock => (
                            <div key={`${item.id}-${yearBlock.ano}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Ano {yearBlock.ano}</div>
                                  <div className="text-sm font-semibold text-slate-700">Total {BRL(yearBlock.valor)}</div>
                                </div>
                                <button onClick={() => addDesembolsoFonte(item.tipoKey, item.id, yearBlock.ano)} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                                  + adicionar fonte
                                </button>
                              </div>

                              <div className="space-y-3">
                                {yearBlock.entries.length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm text-slate-500">
                                    Nenhuma fonte cadastrada para este ano.
                                  </div>
                                ) : yearBlock.entries.map(({ entry, index }) => (
                                  <div key={`${item.id}-${yearBlock.ano}-${index}`} className="grid grid-cols-12 gap-2 items-center rounded-2xl border border-slate-200 bg-white p-2.5">
                                    <div className="col-span-5">
                                      <select
                                        value={entry.fonte}
                                        onChange={e => updateDesembolsoFonte(item.tipoKey, item.id, index, { fonte: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                      >
                                        {fontesDisponiveis.map(fonte => (
                                          <option key={`${item.id}-${yearBlock.ano}-${index}-${fonte}`} value={fonte}>{fonte}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="col-span-5">
                                      <CurrencyInput
                                        value={entry.valor}
                                        onChange={value => updateDesembolsoFonte(item.tipoKey, item.id, index, { valor: value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-right outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="R$ 0,00"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeDesembolsoFonte(item.tipoKey, item.id, index)}
                                      className="col-span-2 rounded-lg border border-slate-200 bg-slate-100 px-2 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ ABA 1 — EQUIPE ══════════════════════════════════════ */}
              {activeTab === 'equipe' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">Equipe Responsável</h2>
                    <p className="text-slate-600 text-sm">Gerencie o vínculo e os papéis dos servidores neste plano. (Total na equipe: {equipe.length})</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col md:flex-row items-end gap-3 w-full">
                      <div className="w-full md:w-64">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Selecionar Servidor</label>
                        <select
                          value={servidorSelecionadoId}
                          onChange={(e) => setServidorSelecionadoId(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Selecione um Servidor --</option>
                          {mockServidores.filter(s => !equipe.find(e => e.servidorId === s.id)).map(s => (
                            <option key={s.id} value={s.id}>{s.nome} ({s.cargo})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full md:w-32">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Papel</label>
                        <select
                          value={papelSelecionado}
                          onChange={(e) => setPapelSelecionado(e.target.value as MembroEquipe['papel'])}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="elaborador">Elaborador</option>
                          <option value="revisor">Revisor</option>
                          <option value="aprovador">Aprovador</option>
                          <option value="membro">Membro</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (servidorSelecionadoId) {
                            setEquipe(prev => [...prev, { id: `m_${Date.now()}`, servidorId: servidorSelecionadoId, papel: papelSelecionado }]);
                            setServidorSelecionadoId('');
                            setPapelSelecionado('membro');
                          }
                        }}
                        disabled={!servidorSelecionadoId}
                        className="w-full md:w-auto px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {equipe.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600">Servidor</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[240px]">Cargo</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[150px]">Secretaria</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[200px]">Papel no Plano</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-600 w-[80px]">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {equipe.map(membro => {
                            const servidor = mockServidores.find(s => s.id === membro.servidorId);
                            if (!servidor) return null;

                            return (
                              <tr key={membro.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
                                      {servidor.nome.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                    </div>
                                    <span className="font-semibold text-slate-800">
                                      {servidor.nome}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[240px]">
                                  {servidor.cargo}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${servidor.secretaria === 'SEMED'
                                    ? 'bg-purple-100 text-purple-700'
                                    : servidor.secretaria === 'SEMFAZ'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {servidor.secretaria}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={membro.papel}
                                    onChange={e => updatePapelMembro(servidor.id, e.target.value as MembroEquipe['papel'])}
                                    className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white outline-none w-full focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="elaborador">Elaborador</option>
                                    <option value="revisor">Revisor</option>
                                    <option value="aprovador">Aprovador</option>
                                    <option value="membro">Membro</option>
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => setEquipe(prev => prev.filter(e => e.servidorId !== servidor.id))}
                                    className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                                    title="Remover Servidor"
                                  >
                                    <X className="w-4 h-4 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                      Nenhum servidor vinculado a este plano ainda. Use os campos acima para adicionar.
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                    <strong>Fluxo de aprovação:</strong> Elaborador → Revisor → Aprovador (Secretário de Educação) → Secretaria de Planejamento → Prefeito
                  </div>
                </div>
              )}

              {/* ═══ ABA 2 — ESTRATÉGIAS ═════════════════════════════════ */}
              {activeTab === 'estrategias' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-800">Estratégias de Expansão</h2>
                    <button
                      onClick={() => setEstrategias(e => [...e, { id: `est${Date.now()}`, estrategia: '', vantagens: [], desvantagens: [], viabilidadeTecnica: null, prioridade: null, responsavelId: '', observacoes: '' }])}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" /> Nova Estratégia
                    </button>
                  </div>

                  <div className="space-y-4">
                    {estrategias.map(est => (
                      <div key={est.id} className={`border rounded-xl p-5 ${est.prioridade === 'P1' ? 'border-red-300 bg-red-50' : est.prioridade === 'P2' ? 'border-amber-300 bg-amber-50' : est.viabilidadeTecnica === false ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-slate-200 bg-white'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Estratégia</label>
                            <select value={est.estrategia}
                              onChange={e => setEstrategias(prev => prev.map(x => x.id === est.id ? { ...x, estrategia: e.target.value } : x))}
                              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                              <option value="">Selecione...</option>
                              {ESTRATEGIAS_PADRAO.map(s => <option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Vantagens</label>
                            <div className="flex flex-wrap gap-1">
                              {VANTAGENS_OPCOES.map(tag => (
                                <button key={tag} onClick={() => toggleVantagem(est.id, tag, 'vantagens')}
                                  className={`text-xs px-2 py-0.5 rounded-full border font-semibold transition-all ${est.vantagens.includes(tag) ? 'bg-green-500 text-white border-green-500' : 'border-slate-300 text-slate-500 hover:border-green-400'}`}>
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Viabilidade</label>
                            <select value={est.viabilidadeTecnica === null ? '' : est.viabilidadeTecnica ? 'sim' : 'nao'}
                              onChange={e => setEstrategias(prev => prev.map(x => x.id === est.id ? { ...x, viabilidadeTecnica: e.target.value === '' ? null : e.target.value === 'sim' } : x))}
                              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                              <option value="">—</option>
                              <option value="sim">Sim</option>
                              <option value="nao">Não</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Prioridade</label>
                            <div className="flex gap-1">
                              {(['P1', 'P2', 'P3'] as Prioridade[]).map(p => (
                                <button key={p} onClick={() => setEstrategias(prev => prev.map(x => x.id === est.id ? { ...x, prioridade: x.prioridade === p ? null : p } : x))}
                                  className={`flex-1 text-xs py-2 rounded-lg font-bold border transition-all ${est.prioridade === p ? PRIORIDADE_COLOR[p] : 'border-slate-300 text-slate-500 hover:border-slate-400'}`}>
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-1 flex items-end justify-end">
                            <button onClick={() => setEstrategias(e => e.filter(x => x.id !== est.id))}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[{ p: 'P1', label: 'Prioridade maior. Inicie imediatamente.', color: 'bg-red-500' },
                    { p: 'P2', label: 'Prioridade menor. Faça assim que possível.', color: 'bg-amber-400' },
                    { p: 'P3', label: 'Não aplicável no momento.', color: 'bg-slate-300' }].map(item => (
                      <div key={item.p} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded ${item.color} shrink-0`} />
                        <span><strong>{item.p}:</strong> {item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ ABA 3 — AÇÕES EM UNIDADES ══════════════════════════ */}
              {activeTab === 'acoes-unidades' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Ações em Unidades Existentes</h2>
                      <p className="text-slate-500 text-sm mt-1">Adaptação (reordenamento) e Ampliação de salas em unidades já existentes</p>
                    </div>
                    <button onClick={addAcao}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" /> Adicionar Ação
                    </button>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                    {(['todas', 'adaptacao', 'ampliacao'] as const).map(tipo => (
                      <button key={tipo}
                        onClick={() => setFiltroTipoAcao(tipo)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filtroTipoAcao === tipo ? (tipo === 'adaptacao' ? 'bg-purple-600 text-white shadow-sm' : tipo === 'ampliacao' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-600 hover:text-slate-900'}`}>
                        {tipo === 'todas' ? 'Todas as Ações' : tipo === 'adaptacao' ? 'Apenas Adaptações' : 'Apenas Ampliações'}
                      </button>
                    ))}
                  </div>

                  {acoes.filter(a => filtroTipoAcao === 'todas' || a.tipo === filtroTipoAcao).map(acao => {
                    const unidade = mockUnidades.find(u => u.id === acao.unidadeId);

                    // Derivar tipo da unidade a partir das salas cadastradas
                    const salas = unidade?.salas ?? [];
                    const temCreche = salas.some(s => s.tipoAtual === 'Creche');
                    const temEF = salas.some(s => s.tipoAtual === 'Ensino Fundamental');
                    const tipoUnidade = !unidade ? null
                      : unidade.totalVagas === 0 && !temCreche ? 'EMEF (sem EI)'
                        : temCreche && temEF ? 'EMEI/EMEF (mista)'
                          : temCreche ? 'Creche / EMEI'
                            : 'EMEF';
                    const tipoCor = !tipoUnidade ? ''
                      : tipoUnidade.includes('mista') ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : tipoUnidade.startsWith('Creche') ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-blue-50 border-blue-200 text-blue-700';

                    // Para adaptação: ambientes mapeados às salas reais da unidade (ref. Tipo 1)
                    const modeloTipo1 = modelos.find(m => m.tipoBase === 'tipo1');
                    const ambientesModeloTipo1 = (modeloTipo1?.ambientes ?? [])
                      .map(mca => ambientes.find(ma => ma.id === mca.modeloAmbienteId))
                      .filter((ma): ma is NonNullable<typeof ma> => !!ma);
                    const ambientesAdaptacao = salas.map(s => ({
                      salaId: s.id,
                      label: s.nome,
                      modeloAmbiente: ambientesModeloTipo1.find(ma =>
                        ma.nome.toLowerCase().includes(s.nome.toLowerCase().split(' ')[0]) ||
                        s.nome.toLowerCase().includes(ma.nome.toLowerCase().split(' ')[0])
                      ) ?? null,
                      capacidadeAtual: s.capacidadeAtual,
                      tipoAtual: s.tipoAtual,
                    }));

                    const modeloAmpliacao = modelos.find(m => m.id === acao.modeloCrecheId);
                    const ambientesAmpliacao: ModeloAmbiente[] = modeloAmpliacao
                      ? modeloAmpliacao.ambientes
                        .map(mca => ambientes.find(ma => ma.id === mca.modeloAmbienteId))
                        .filter((ma): ma is NonNullable<typeof ma> => !!ma)
                      : [];
                    const ambienteSelecionado = ambientesAmpliacao.find(ma => ma.id === acao.salaId);
                    const custoCalculado = ambienteSelecionado ? calcularCustoAmbiente(ambienteSelecionado) : null;
                    return (
                      <div key={acao.id} className="border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {(['adaptacao', 'ampliacao'] as const).map(tipo => (
                              <button key={tipo}
                                onClick={() => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, tipo, salaId: '', modeloCrecheId: '', custoPorSala: 0 } : x))}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${acao.tipo === tipo ? tipo === 'adaptacao' ? 'bg-purple-600 text-white border-purple-600' : 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-slate-400'}`}>
                                {tipo === 'adaptacao' ? 'Adaptação' : 'Ampliação'}
                              </button>
                            ))}
                          </div>
                          <button onClick={() => removeAcao(acao.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-600">Unidade Escolar *</label>
                          <select value={acao.unidadeId}
                            onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, unidadeId: e.target.value, salaId: '', modeloCrecheId: '', custoPorSala: 0 } : x))}
                            className={inputCls}>
                            <option value="">Selecione a unidade...</option>
                            {mockUnidades.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                          </select>
                          {tipoUnidade && (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${tipoCor}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                              {tipoUnidade}
                              {unidade && unidade.totalVagas > 0 && (
                                <span className="opacity-60 font-normal">· {unidade.totalVagas} vagas · {unidade.totalListaEspera} lista espera</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={`rounded-xl border-2 p-4 space-y-3 ${acao.tipo === 'adaptacao' ? 'border-purple-200 bg-purple-50/40' : 'border-blue-200 bg-blue-50/40'}`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${acao.tipo === 'adaptacao' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                            <span className={`text-xs font-bold uppercase tracking-wide ${acao.tipo === 'adaptacao' ? 'text-purple-700' : 'text-blue-700'}`}>
                              {acao.tipo === 'adaptacao' ? 'Seleção do Ambiente a Adaptar' : 'Seleção do Ambiente a Ampliar'}
                            </span>
                          </div>

                          <div className="flex gap-3 items-end">
                            <div className="flex-1">
                              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-black ${acao.tipo === 'adaptacao' ? 'bg-purple-500' : 'bg-blue-500'}`}>1</span>
                                Modelo de Creche
                              </label>
                              <select
                                value={acao.modeloCrecheId || ''}
                                onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, modeloCrecheId: e.target.value, salaId: '', custoPorSala: 0 } : x))}
                                className={`w-full text-sm px-3 py-2 border-2 rounded-lg focus:ring-2 outline-none transition-colors ${acao.tipo === 'adaptacao' ? 'border-purple-300 bg-white focus:ring-purple-300 focus:border-purple-400' : 'border-blue-300 bg-white focus:ring-blue-300 focus:border-blue-400'}`}
                                disabled={!acao.unidadeId}
                              >
                                <option value="">Selecione o modelo...</option>
                                {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                              </select>
                            </div>

                            <div className={`flex-none mb-2 flex items-center justify-center w-7 h-7 rounded-full ${acao.modeloCrecheId ? (acao.tipo === 'adaptacao' ? 'bg-purple-500' : 'bg-blue-500') : 'bg-slate-300'} transition-colors`}>
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>

                            <div className="flex-1">
                              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-black transition-colors ${acao.modeloCrecheId ? (acao.tipo === 'adaptacao' ? 'bg-purple-500' : 'bg-blue-500') : 'bg-slate-400'}`}>2</span>
                                Ambiente de Referência
                              </label>
                              <select
                                value={acao.salaId}
                                onChange={e => {
                                  const selectedId = e.target.value;
                                  const ma = ambientesAmpliacao.find(a => a.id === selectedId);
                                  const custo = ma ? calcularCustoAmbiente(ma).total : 0;
                                  const capNova = ma ? (ma.capacidadeAlunos || 20) : 20;
                                  const capAnterior = acao.tipo === 'adaptacao' ? (ambientesAdaptacao.find(a => a.salaId === selectedId)?.capacidadeAtual ?? 0) : 0;
                                  setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, salaId: selectedId, capacidadeAnterior: capAnterior, custoPorSala: custo, novaCapacidade: capNova } : x));
                                }}
                                className={`w-full text-sm px-3 py-2 border-2 rounded-lg focus:ring-2 outline-none transition-colors ${!acao.modeloCrecheId ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed' : acao.tipo === 'adaptacao' ? 'border-purple-300 bg-white focus:ring-purple-300 focus:border-purple-400' : 'border-blue-300 bg-white focus:ring-blue-300 focus:border-blue-400'}`}
                                disabled={!acao.modeloCrecheId || ambientesAmpliacao.length === 0}
                              >
                                <option value="">{!acao.modeloCrecheId ? 'Selecione o modelo primeiro...' : 'Selecione o ambiente...'}</option>
                                {ambientesAmpliacao.map(ma => (
                                  <option key={ma.id} value={ma.id}>
                                    {ma.nome} &mdash; {ma.areaMq} m&sup2; &mdash; {BRL(calcularCustoAmbiente(ma).total)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {acao.salaId && acao.custoPorSala >= 0 && (
                            <div className={`flex items-center gap-3 rounded-lg px-4 py-2.5 border ${acao.custoPorSala > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-800">
                                {custoCalculado && acao.custoPorSala > 0 && (
                                  <>
                                    <span><strong>Obras:</strong> {BRL(custoCalculado.obras)}</span>
                                    <span><strong>Mobiliário:</strong> {BRL(custoCalculado.mobiliario)}</span>
                                    <span><strong>Equipamentos:</strong> {BRL(custoCalculado.equipamentos)}</span>
                                  </>
                                )}
                                {acao.custoPorSala === 0 && <span className="text-amber-600">Selecione o modelo para calcular o custo automaticamente</span>}
                              </div>
                              <div className="shrink-0 flex flex-col items-end">
                                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Custo por Sala</span>
                                <span className={`text-xl font-black ${acao.custoPorSala > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{acao.custoPorSala > 0 ? BRL(acao.custoPorSala) : '—'}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {acao.tipo === 'adaptacao' && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição da Adaptação *</label>
                            <input type="text" value={acao.descricao} onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, descricao: e.target.value } : x))} className={inputCls} placeholder="Ex: Transformar sala de EF em sala de Jardim I para creche" />
                          </div>
                        )}


                        {/* Painel de Vagas */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Planejamento de Vagas da Sala</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Capacidade Padrão</label>
                              <div className="text-sm font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg h-[38px] flex items-center">
                                {ambienteSelecionado?.capacidadeAlunos || 0} vagas
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Novas Vagas *</label>
                              <input type="number" value={acao.novaCapacidade} onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, novaCapacidade: Number(e.target.value) } : x))} className={inputCls} />
                            </div>
                            <div className="flex flex-col justify-end">
                              <div className="text-sm font-bold text-center px-3 py-1.5 rounded-lg h-[38px] flex flex-col justify-center bg-green-100 text-green-700">
                                <span>+{acao.novaCapacidade || 0} novas vagas</span>
                              </div>
                            </div>
                          </div>
                          
                          {acao.custoPorSala === 0 && acao.salaId && (
                            <div className="mt-3 text-xs text-amber-600 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Selecione um modelo de creche para calcular o custo e preencher as vagas
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Etapa Destino</label>
                            <select value={acao.etapaDestino} onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, etapaDestino: e.target.value as EtapaEI } : x))} className={inputCls}>{ETAPAS.map(e => <option key={e}>{e}</option>)}</select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Previsão de Conclusão</label>
                            <input type="date" value={acao.previsaoConclusao}
                              onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, previsaoConclusao: e.target.value } : x))}
                              className={inputCls} />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-700">{acoes.filter(a => a.tipo === 'adaptacao').length}</div>
                      <div className="text-sm text-blue-600">Adaptações</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">{acoes.filter(a => a.tipo === 'ampliacao').length}</div>
                      <div className="text-sm text-blue-600">Ampliações</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">{acoes.reduce((s, a) => s + Math.max(0, a.novaCapacidade - a.capacidadeAnterior), 0)}</div>
                      <div className="text-sm text-green-600">Novas Vagas (est.)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ABA 4 — OBRAS ═══════════════════════════════════════ */}
              {activeTab === 'obras' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Obras de Construção</h2>
                      <p className="text-slate-500 text-sm mt-1">Retomada de obras em andamento e novas construções de creches</p>
                    </div>
                    <button onClick={addObra}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                      <Plus className="w-4 h-4" /> Adicionar Obra
                    </button>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                    {(['todas', 'nova', 'retomada'] as const).map(tipo => (
                      <button key={tipo}
                        onClick={() => setFiltroTipoObra(tipo)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filtroTipoObra === tipo ? (tipo === 'nova' ? 'bg-green-600 text-white shadow-sm' : tipo === 'retomada' ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-600 hover:text-slate-900'}`}>
                        {tipo === 'todas' ? 'Todas as Obras' : tipo === 'nova' ? 'Apenas Novas' : 'Apenas Retomadas'}
                      </button>
                    ))}
                  </div>

                  {obras.filter(o => filtroTipoObra === 'todas' || o.tipo === filtroTipoObra).map(obra => (
                    <div key={obra.id} className="border border-slate-200 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {(['retomada', 'nova'] as const).map(tipo => (
                            <button key={tipo}
                              onClick={() => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, tipo } : x))}
                              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${obra.tipo === tipo ? tipo === 'retomada' ? 'bg-orange-500 text-white border-orange-500' : 'bg-green-600 text-white border-green-600' : 'border-slate-300 text-slate-600'}`}>
                              {tipo === 'retomada' ? 'Retomada de Obra' : 'Nova Obra'}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => removeObra(obra.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Nome da Obra</label>
                          <input value={obra.nome}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, nome: e.target.value } : x))}
                            className={inputCls}
                            placeholder="Ex: Creche Tipo 1 — Bairro..." />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Bairro / Localização</label>
                          <input value={obra.bairro}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, bairro: e.target.value, localizacao: e.target.value } : x))}
                            className={inputCls}
                            placeholder="Bairro/setor de destino" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Latitude</label>
                          <input type="number" step="any" value={obra.coordenadas?.lat || ''}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, coordenadas: { ...x.coordenadas!, lat: parseFloat(e.target.value) } } : x))}
                            className={inputCls}
                            placeholder="-11.4343" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Longitude</label>
                          <input type="number" step="any" value={obra.coordenadas?.lng || ''}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, coordenadas: { ...x.coordenadas!, lng: parseFloat(e.target.value) } } : x))}
                            className={inputCls}
                            placeholder="-61.4484" />
                        </div>
                      </div>

                      {/* Modelo de custo */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <label className="block text-xs font-semibold text-blue-700 mb-2">Modelo de Custo (auto-preenchimento)</label>
                        <div className="flex gap-3 items-end flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <select
                              value={obra.modeloCrecheId || ''}
                              onChange={e => {
                                const m = modelos.find(mc => mc.id === e.target.value);
                                if (!m) return;
                                const c = calcularCustoCreche(m, ambientes);
                                const totalDesembolso = obra.desembolsoPorAno.reduce((s, d) => s + d.valor, 0);
                                const investimento = c.investimento;
                                setObras(prev => prev.map(x => {
                                  if (x.id !== obra.id) return x;
                                  const updated = {
                                    ...x,
                                    modeloCrecheId: m.id,
                                    tipoProjetoFNDE: m.tipoBase as ObraConstrucao['tipoProjetoFNDE'],
                                    numeroDeSalas: m.ambientes.filter(a => {
                                      const amb = ambientes.find(ma => ma.id === a.modeloAmbienteId);
                                      return amb?.categoria === 'sala-atividades';
                                    }).reduce((s, a) => s + a.quantidade, 0) || x.numeroDeSalas,
                                    capacidadeAlunos: m.capacidadeAlunos || 0,
                                  } as ObraConstrucao;
                                  // if there is no desembolso yet, initialize a single-line total equal to investimento
                                  if (totalDesembolso === 0 && (!updated.desembolsoPorAno || updated.desembolsoPorAno.length === 0)) {
                                    updated.desembolsoPorAno = [{ ano: periodoInicio, valor: investimento, fonte: fontes[0]?.fonte || 'Recurso Próprio' }];
                                  }
                                  return updated;
                                }));
                              }}
                              className="w-full text-sm px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                            >
                              <option value="">Selecionar modelo...</option>
                              {modelos.map(m => {
                                const c = calcularCustoCreche(m, ambientes);
                                return (
                                  <option key={m.id} value={m.id}>
                                    {m.nome} — Invest. {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.investimento)}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <p className="text-xs text-blue-500 pb-2">Preenche tipo, salas e referência de custo automaticamente.</p>
                        </div>
                      </div>

                      {/* Resumo de custo estimado para a obra (por sala e total) */}
                      <div className="mt-3">
                        {(() => {
                          const cc = calcularCustoObraTotal(obra, modelos, ambientes);
                          return (
                            <div className="rounded-lg p-3 border border-slate-200 bg-slate-50 flex items-center justify-between">
                              <div>
                                <div className="text-xs text-slate-600">Custo por Sala (estimado)</div>
                                <div className="font-bold text-lg text-slate-800">{cc.costPerSala > 0 ? BRL(Math.round(cc.costPerSala)) : '—'}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-600">Custo Total (estimado)</div>
                                <div className="font-black text-lg text-blue-700">{cc.total > 0 ? BRL(Math.round(cc.total)) : '—'}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Nº de Salas</label>
                          <input type="number" value={obra.numeroDeSalas}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, numeroDeSalas: Number(e.target.value) } : x))}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Vagas da Obra *</label>
                          <input type="number" value={obra.capacidadeAlunos || 0}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, capacidadeAlunos: Number(e.target.value) } : x))}
                            className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                          <select value={obra.statusObra ?? 'planejada'}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, statusObra: e.target.value as ObraConstrucao['statusObra'] } : x))}
                            className={inputCls}>
                            <option value="planejada">Planejada</option>
                            <option value="licitacao">Em Licitação</option>
                            <option value="em_execucao">Em Execução</option>
                            <option value="concluida">Concluída</option>
                            <option value="paralisada">Paralisada</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Convênio</label>
                          <input value={obra.numeroConvenio ?? ''}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, numeroConvenio: e.target.value } : x))}
                            className={inputCls} />
                        </div>
                      </div>

                      {obra.tipo === 'retomada' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">% Conclusão Atual</label>
                          <input type="number" min={0} max={100} value={obra.percentualConclusaoAtual ?? 0}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, percentualConclusaoAtual: Number(e.target.value) } : x))}
                            className="w-32 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Previsão Conclusão</label>
                        <input type="date" value={obra.previsaoConclusao}
                          onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, previsaoConclusao: e.target.value } : x))}
                          className="w-48 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                  ))}

                  <div className="bg-green-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{obras.filter(o => o.tipo === 'retomada').length}</div>
                      <div className="text-sm text-orange-600">Retomadas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">{obras.filter(o => o.tipo === 'nova').length}</div>
                      <div className="text-sm text-green-600">Novas Obras</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">{obras.reduce((s, o) => s + o.numeroDeSalas, 0)}</div>
                      <div className="text-sm text-blue-600">Novas Salas</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ABA 5 — PESSOAL ════════════════════════════════════ */}
              {activeTab === 'pessoal' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Plano de Contratação de Pessoal</h2>
                    <p className="text-slate-500">Configure turmas por sala e calcule necessidade de professores e auxiliares</p>
                  </div>

                  {/* Resumo de Salas */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Resumo de Salas Planejadas
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xs text-blue-600 mb-1">De Obras (Novas/Retomadas)</div>
                        <div className="text-3xl font-black text-blue-700">{obras.reduce((s, o) => s + o.numeroDeSalas, 0)}</div>
                        <div className="text-xs text-blue-500">salas</div>
                      </div>
                      <div>
                        <div className="text-xs text-blue-600 mb-1">De Ações (Ampliações)</div>
                        <div className="text-3xl font-black text-blue-700">{acoes.filter(a => a.tipo === 'ampliacao').length}</div>
                        <div className="text-xs text-blue-500">salas</div>
                      </div>
                      <div className="bg-blue-600 rounded-lg p-3">
                        <div className="text-xs text-blue-100 mb-1">TOTAL DE SALAS</div>
                        <div className="text-4xl font-black text-white">{totalSalasPlanejadas}</div>
                        <div className="text-xs text-blue-200">salas planejadas</div>
                      </div>
                    </div>
                  </div>

                  {totalSalasPlanejadas === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
                      <strong>Nenhuma sala planejada.</strong> Adicione obras ou ações de ampliação nas abas anteriores para calcular a necessidade de pessoal.
                    </div>
                  )}

                  {totalSalasPlanejadas > 0 && (
                    <>
                      {/* Configuração de Turmas por Sala */}
                      <div className="bg-white rounded-xl border border-slate-200">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                          <h3 className="font-bold text-slate-700">Configuração de Turmas por Sala</h3>
                          <button
                            onClick={inicializarConfigSalas}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                            {configSalas.length === 0 ? 'Carregar Salas' : 'Atualizar Salas'}
                          </button>
                        </div>

                        {configSalas.length > 0 && (
                          <div className="p-5 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                              {configSalas.map(sala => (
                                <div key={sala.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-lg">
                                  <div className="col-span-1 text-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${sala.origem === 'obra' ? 'bg-orange-500' : 'bg-purple-500'}`}>
                                      {sala.origem === 'obra' ? '🏗️' : '📐'}
                                    </div>
                                  </div>
                                  <div className="col-span-6">
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-semibold text-slate-800 truncate">{sala.nome}</div>
                                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md ${sala.origem === 'obra' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {sala.origem === 'obra' ? 'Obra Nova' : 'Ampliação'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {sala.etapas.length > 0 ? sala.etapas.join(', ') : 'Etapas não definidas'}
                                    </div>
                                  </div>
                                  <div className="col-span-3">
                                    <label className="block text-xs text-slate-500 mb-1">Nº de Turmas</label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={4}
                                      value={sala.numeroTurmas}
                                      onChange={e => setConfigSalas(prev => prev.map(s => s.id === sala.id ? { ...s, numeroTurmas: Math.max(1, Number(e.target.value)) } : s))}
                                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                  </div>
                                  <div className="col-span-2 text-center">
                                    <div className="text-xs text-slate-500">Estimativa</div>
                                    <div className="text-sm font-bold text-blue-700">{sala.numeroTurmas * 16} crianças</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-slate-600">Total de turmas planejadas:</span>
                              <span className="font-bold text-slate-800 ml-2">{totalTurmasPlanejadas} turmas</span>
                              <span className="text-slate-400 ml-2">
                                (estimativa: {totalTurmasPlanejadas * 16} crianças)
                              </span>
                            </div>
                            <button
                              onClick={calcularNecessidadePessoal}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm">
                              ✨ Calcular Necessidade de Pessoal
                            </button>
                          </div>
                        </div>
                      </div>

                      {pessoal.filter(p => p.autoCalculado).length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex gap-3">
                          <div className="mt-0.5"><AlertCircle className="w-5 h-5 text-blue-600" /></div>
                          <div>
                            <h4 className="font-bold text-blue-800 text-sm">Resumo do Cálculo Automático</h4>
                            <p className="text-sm text-blue-700 mt-1">
                              <strong>Para Novas Obras:</strong> A equipe foi pré-carregada integralmente com base no padrão definido no Modelo de Creche.
                              <br />
                              <strong>Para Ampliações:</strong> Foi calculada a proporção de 1 Professor e 1 Monitor/Auxiliar para cada turma extra criada.
                            </p>
                            <p className="text-xs text-blue-600 mt-2 italic">
                              Você pode editar as quantidades abaixo ou incluir novos cargos se houver necessidade específica.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Grid de Pessoal por Categoria */}
                      {['pedagogico', 'administrativo', 'apoio'].map(cat => {
                        const categoria = cat as ItemPessoal['categoria'];
                        const itens = pessoal.filter(p => p.categoria === categoria);
                        const labelCat = categoria === 'pedagogico' ? 'PEDAGÓGICO' : categoria === 'administrativo' ? 'ADMINISTRATIVO' : 'APOIO';

                        const headerBg = categoria === 'pedagogico' ? 'bg-blue-50' : categoria === 'administrativo' ? 'bg-purple-50' : 'bg-green-50';
                        const headerBorder = categoria === 'pedagogico' ? 'border-blue-200' : categoria === 'administrativo' ? 'border-purple-200' : 'border-green-200';
                        const headerText = categoria === 'pedagogico' ? 'text-blue-800' : categoria === 'administrativo' ? 'text-purple-800' : 'text-green-800';
                        const btnBg = categoria === 'pedagogico' ? 'bg-blue-600' : categoria === 'administrativo' ? 'bg-purple-600' : 'bg-green-600';
                        const btnHover = categoria === 'pedagogico' ? 'hover:bg-blue-700' : categoria === 'administrativo' ? 'hover:bg-purple-700' : 'hover:bg-green-700';

                        return (
                          <div key={categoria} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className={`${headerBg} px-5 py-3 border-b ${headerBorder} flex items-center justify-between`}>
                              <h3 className={`font-bold ${headerText}`}>{labelCat}</h3>
                              <button
                                onClick={() => addItemPessoal(categoria)}
                                className={`text-xs px-3 py-1.5 ${btnBg} text-white rounded-lg ${btnHover} transition-colors font-semibold flex items-center gap-1`}>
                                <Plus className="w-3 h-3" /> Adicionar
                              </button>
                            </div>

                            {itens.length > 0 && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                      <th className="text-left px-4 py-2.5 w-6"></th>
                                      <th className="text-left px-4 py-2.5">Função</th>
                                      <th className="text-right px-4 py-2.5 w-24">Qtd</th>
                                      <th className="text-right px-4 py-2.5 w-32">Rem. Base</th>
                                      <th className="text-right px-4 py-2.5 w-32">Auxílios</th>
                                      <th className="text-right px-4 py-2.5 w-32">Patronal</th>
                                      <th className="text-right px-4 py-2.5 w-32">Custo/Mês</th>
                                      <th className="text-right px-4 py-2.5 w-36">Custo/Ano</th>
                                      <th className="text-center px-4 py-2.5 w-16"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {itens.map(item => {
                                      const { patronal, custoMensal, custoAnual } = calcularCustoPessoal(item);
                                      return (
                                        <tr key={item.id} className={`hover:bg-slate-50 ${item.autoCalculado ? 'bg-green-50/30' : ''}`}>
                                          <td className="px-4 py-2.5 text-center">
                                            {item.autoCalculado && <span className="text-green-600 text-lg" title="Auto-calculado">✨</span>}
                                          </td>
                                          <td className="px-4 py-2.5">
                                            <select
                                              value={item.funcao}
                                              onChange={e => {
                                                const selectedCargo = cargosRef.find(c => c.descricao === e.target.value);
                                                setPessoal(prev => prev.map(p => p.id === item.id ? { 
                                                  ...p, 
                                                  funcao: e.target.value,
                                                  remuneracaoBase: selectedCargo ? selectedCargo.remuneracaoBase : p.remuneracaoBase,
                                                  auxilios: selectedCargo ? selectedCargo.auxilios : p.auxilios
                                                } : p));
                                              }}
                                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                              disabled={item.autoCalculado}
                                            >
                                              <option value="">Selecione um cargo do catálogo...</option>
                                              {cargosRef.map(cargo => (
                                                <option key={cargo.id} value={cargo.descricao}>
                                                  {cargo.descricao}
                                                </option>
                                              ))}
                                            </select>
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <input
                                              type="number"
                                              min={0}
                                              value={item.quantidade}
                                              onChange={e => setPessoal(prev => prev.map(p => p.id === item.id ? { ...p, quantidade: Math.max(0, Number(e.target.value)) } : p))}
                                              className="w-full px-2 py-1 text-sm text-right border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <div className="w-full px-2 py-1 text-sm text-right border border-slate-200 bg-slate-50 text-slate-500 rounded">
                                              {BRL(item.remuneracaoBase)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <div className="w-full px-2 py-1 text-sm text-right border border-slate-200 bg-slate-50 text-slate-500 rounded">
                                              {BRL(item.auxilios)}
                                            </div>
                                          </td>
                                          <td className="px-4 py-2.5 text-right text-slate-600">{BRL(patronal)}</td>
                                          <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{BRL(custoMensal)}</td>
                                          <td className="px-4 py-2.5 text-right font-bold text-blue-700">{BRL(custoAnual)}</td>
                                          <td className="px-4 py-2.5 text-center">
                                            {!item.autoCalculado && (
                                              <button
                                                onClick={() => removeItemPessoal(item.id)}
                                                className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Resumo Final */}
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                        <h3 className="font-bold text-xl mb-4">Resumo de Contratações</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-blue-200 text-xs mb-1">Professores</div>
                            <div className="font-bold text-3xl">{pessoal.filter(p => p.funcao.toLowerCase().includes('professor')).reduce((s, p) => s + p.quantidade, 0)}</div>
                          </div>
                          <div>
                            <div className="text-blue-200 text-xs mb-1">Auxiliares</div>
                            <div className="font-bold text-3xl">{pessoal.filter(p => p.funcao.toLowerCase().includes('auxiliar') || p.funcao.toLowerCase().includes('cuidador')).reduce((s, p) => s + p.quantidade, 0)}</div>
                          </div>
                          <div>
                            <div className="text-blue-200 text-xs mb-1">Outros Profissionais</div>
                            <div className="font-bold text-3xl">{pessoal.filter(p => !p.funcao.toLowerCase().includes('professor') && !p.funcao.toLowerCase().includes('auxiliar') && !p.funcao.toLowerCase().includes('cuidador')).reduce((s, p) => s + p.quantidade, 0)}</div>
                          </div>
                          <div>
                            <div className="text-blue-200 text-xs mb-1">Total de Profissionais</div>
                            <div className="font-bold text-3xl">{pessoal.reduce((s, p) => s + p.quantidade, 0)}</div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-500 flex justify-between items-center">
                          <span className="font-bold text-lg">CUSTO ANUAL TOTAL (PESSOAL)</span>
                          <span className="font-black text-2xl">{BRL(totalCustoAnualPessoal)}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                        <strong>💡 Dica:</strong> Itens marcados com ✨ foram calculados automaticamente com base no número de turmas. Você pode editar as quantidades manualmente se necessário.
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ═══ ABA 6 — VAGAS POR TURMA ═════════════════════════════ */}
              {activeTab === 'vagas-turma' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">Vagas por Turma e Unidade Escolar</h2>
                  <p className="text-slate-500 text-sm">Dados de matrículas e ocupação por unidade — ano base 2026</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th colSpan={2} className="text-center px-4 py-2 border-b border-r border-slate-200 font-bold text-slate-700">Dados da Unidade</th>
                          <th colSpan={6} className="text-center px-4 py-2 border-b border-r border-slate-200 font-bold text-slate-700 bg-blue-50/50">Vagas Ofertadas e Ocupação</th>
                          <th colSpan={4} className="text-center px-4 py-2 border-b border-slate-200 font-bold text-slate-700 bg-orange-50/50">Fila de Espera</th>
                        </tr>
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700 border-r border-slate-200">Unidade</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700 border-r border-slate-200">Turmas</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700 bg-blue-50/30">Maternal</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700 bg-blue-50/30">Jardim I</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700 bg-blue-50/30">Jardim II</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-700 bg-blue-50/30">Vagas</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-700 bg-blue-50/30">Matrículas</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700 border-r border-slate-200 bg-blue-50/30">Ocupação</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700 bg-orange-50/30">Maternal</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700 bg-orange-50/30">Jardim I</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700 bg-orange-50/30">Jardim II</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-700 bg-orange-50/30">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mockUnidades.filter(u => u.totalVagas > 0).map(u => {
                          const mats = matriculasPorUnidade[u.id] ?? u.totalMatriculas;
                          const ocupacao = u.totalVagas > 0 ? Math.round((mats / u.totalVagas) * 100) : 0;
                          const getVagas = (etapa: EtapaEI) => u.vagasPorEtapa.find(v => v.etapa === etapa)?.vagas ?? 0;
                          const getEspera = (etapa: EtapaEI) => u.vagasPorEtapa.find(v => v.etapa === etapa)?.listaEspera ?? 0;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs border-r border-slate-100">
                                <div className="truncate">{u.nome}</div>
                                <div className="text-xs text-slate-400 font-normal">{u.bairro}</div>
                              </td>
                              <td className="px-4 py-3 text-center border-r border-slate-100">{u.salas.filter(s => s.etapaAtendida).length}</td>
                              <td className="px-4 py-3 text-center">{getVagas('Maternal') > 0 ? getVagas('Maternal') : '—'}</td>
                              <td className="px-4 py-3 text-center">{getVagas('Jardim I') > 0 ? getVagas('Jardim I') : '—'}</td>
                              <td className="px-4 py-3 text-center">{getVagas('Jardim II') > 0 ? getVagas('Jardim II') : '—'}</td>
                              <td className="px-4 py-3 text-right">{u.totalVagas}</td>
                              <td className="px-4 py-3 text-right font-semibold">
                                <input
                                  type="number"
                                  min={0}
                                  value={mats}
                                  onChange={e => setMatriculasPorUnidade(prev => ({ ...prev, [u.id]: Number(e.target.value) }))}
                                  className="w-20 px-2 py-1 text-sm text-right border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </td>
                              <td className="px-4 py-3 text-center border-r border-slate-100">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ocupacao > 200 ? 'bg-red-100 text-red-700' : ocupacao > 100 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                  {ocupacao}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-orange-600 font-medium">{getEspera('Maternal') > 0 ? getEspera('Maternal') : '—'}</td>
                              <td className="px-4 py-3 text-center text-orange-600 font-medium">{getEspera('Jardim I') > 0 ? getEspera('Jardim I') : '—'}</td>
                              <td className="px-4 py-3 text-center text-orange-600 font-medium">{getEspera('Jardim II') > 0 ? getEspera('Jardim II') : '—'}</td>
                              <td className="px-4 py-3 text-right font-bold text-orange-700">{u.totalListaEspera > 0 ? u.totalListaEspera : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        {(() => {
                          const validUnidades = mockUnidades.filter(u => u.totalVagas > 0);
                          const totalVagas = validUnidades.reduce((s, u) => s + u.totalVagas, 0);
                          const totalMats = validUnidades.reduce((s, u) => s + (matriculasPorUnidade[u.id] ?? u.totalMatriculas), 0);
                          const ocupacaoGeral = totalVagas > 0 ? Math.round((totalMats / totalVagas) * 100) : 0;

                          const totalEsperaMaternal = validUnidades.reduce((s, u) => s + (u.vagasPorEtapa.find(v => v.etapa === 'Maternal')?.listaEspera ?? 0), 0);
                          const totalEsperaJardimI = validUnidades.reduce((s, u) => s + (u.vagasPorEtapa.find(v => v.etapa === 'Jardim I')?.listaEspera ?? 0), 0);
                          const totalEsperaJardimII = validUnidades.reduce((s, u) => s + (u.vagasPorEtapa.find(v => v.etapa === 'Jardim II')?.listaEspera ?? 0), 0);
                          const totalEsperaGeral = validUnidades.reduce((s, u) => s + u.totalListaEspera, 0);

                          return (
                            <tr>
                              <td className="px-4 py-3 font-bold text-right border-r border-slate-300" colSpan={2}>Totais da Rede</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-700">{validUnidades.reduce((s, u) => s + (u.vagasPorEtapa.find(v => v.etapa === 'Maternal')?.vagas ?? 0), 0)}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-700">{validUnidades.reduce((s, u) => s + (u.vagasPorEtapa.find(v => v.etapa === 'Jardim I')?.vagas ?? 0), 0)}</td>
                              <td className="px-4 py-3 text-center font-bold text-slate-700">{validUnidades.reduce((s, u) => s + (u.vagasPorEtapa.find(v => v.etapa === 'Jardim II')?.vagas ?? 0), 0)}</td>
                              <td className="px-4 py-3 text-right font-bold text-slate-800">{totalVagas}</td>
                              <td className="px-4 py-3 text-right font-bold text-slate-800">{totalMats}</td>
                              <td className={`px-4 py-3 text-center font-bold border-r border-slate-300 ${ocupacaoGeral > 100 ? 'text-red-700' : 'text-green-700'}`}>{ocupacaoGeral}%</td>
                              <td className="px-4 py-3 text-center font-bold text-orange-700">{totalEsperaMaternal}</td>
                              <td className="px-4 py-3 text-center font-bold text-orange-700">{totalEsperaJardimI}</td>
                              <td className="px-4 py-3 text-center font-bold text-orange-700">{totalEsperaJardimII}</td>
                              <td className="px-4 py-3 text-right font-bold text-orange-700">{totalEsperaGeral}</td>
                            </tr>
                          );
                        })()}
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ═══ ABA 7 — DEMANDA POR ETAPA ═════════════════════════════ */}
              {activeTab === 'demanda-etapa' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">Demanda por Etapa da Educação Infantil</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockDemandaEtapa.map(d => {
                      const pct = Math.round((d.vagasAtuais / d.criancasResidentes) * 100);
                      return (
                        <div key={d.etapa} className={`rounded-xl p-5 border ${pct < 5 ? 'border-red-300 bg-red-50' : pct < 20 ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50'}`}>
                          <div className="font-bold text-slate-800 text-lg mb-1">{d.etapa}</div>
                          <div className="text-xs text-slate-500 mb-3">{d.faixaEtaria}</div>
                          <div className={`text-3xl font-black mb-1 ${pct < 5 ? 'text-red-600' : pct < 20 ? 'text-amber-600' : 'text-green-600'}`}>{pct}%</div>
                          <div className="text-xs text-slate-600 mb-2">taxa de atendimento atual</div>
                          <div className="w-full bg-white rounded-full h-2 mb-3 overflow-hidden">
                            <div className={`h-full rounded-full ${pct < 5 ? 'bg-red-500' : pct < 20 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-slate-500">Crianças cadÚnico:</span> <strong>{d.criancasResidentes.toLocaleString('pt-BR')}</strong></div>
                            <div><span className="text-slate-500">Vagas disponíveis:</span> <strong>{d.vagasAtuais}</strong></div>
                            <div><span className="text-slate-500">Déficit:</span> <strong className="text-red-600">{d.deficitAtual}</strong></div>
                            <div><span className="text-slate-500">Novas vagas:</span> <strong className="text-blue-600">+{d.novasVagasPlanejadas}</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={mockDemandaEtapa.map(d => ({ etapa: d.etapa, 'Vagas Atuais': d.vagasAtuais, 'Novas Vagas': d.novasVagasPlanejadas, Déficit: d.deficitFinal }))}>
                      <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis key="xaxis" dataKey="etapa" />
                      <YAxis key="yaxis" />
                      <Tooltip key="tooltip" />
                      <Bar key="vagas-atuais" dataKey="Vagas Atuais" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar key="novas-vagas" dataKey="Novas Vagas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Legend key="legend" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">Detalhamento Numérico</h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Etapa</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-700">Faixa Etária</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">Crianças cadÚnico</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">Vagas Atuais</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">Taxa Atual</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">Déficit Atual</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">+ Novas Vagas</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">Déficit Final</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {mockDemandaEtapa.map(d => (
                            <tr key={d.etapa} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-bold text-slate-800">{d.etapa}</td>
                              <td className="px-4 py-3 text-slate-500">{d.faixaEtaria}</td>
                              <td className="px-4 py-3 text-right">{d.criancasResidentes.toLocaleString('pt-BR')}</td>
                              <td className="px-4 py-3 text-right">{d.vagasAtuais}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${d.taxaAtual < 5 ? 'bg-red-100 text-red-700' : d.taxaAtual < 20 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                  {PCT(d.taxaAtual)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-red-600">{d.deficitAtual.toLocaleString('pt-BR')}</td>
                              <td className="px-4 py-3 text-right font-semibold text-green-600">+{d.novasVagasPlanejadas}</td>
                              <td className="px-4 py-3 text-right font-bold">
                                <span className={d.deficitFinal <= 0 ? 'text-green-600' : 'text-red-600'}>{d.deficitFinal}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                          <tr>
                            <td className="px-4 py-3 font-bold" colSpan={2}>Totais</td>
                            <td className="px-4 py-3 text-right font-bold">{mockDemandaEtapa.reduce((s, d) => s + d.criancasResidentes, 0).toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-right font-bold">{mockDemandaEtapa.reduce((s, d) => s + d.vagasAtuais, 0)}</td>
                            <td className="px-4 py-3 text-right font-bold">9,3%</td>
                            <td className="px-4 py-3 text-right font-bold text-red-700">{mockDemandaEtapa.reduce((s, d) => s + d.deficitAtual, 0).toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-right font-bold text-green-700">+{mockDemandaEtapa.reduce((s, d) => s + d.novasVagasPlanejadas, 0)}</td>
                            <td className="px-4 py-3 text-right font-bold">{mockDemandaEtapa.reduce((s, d) => s + d.deficitFinal, 0)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 mt-4">
                      <strong>Atenção — Maternal (1a a 1a11m):</strong> Taxa de atendimento de apenas 2%. Das 2.266 crianças nessa faixa em Cacoal, apenas 46 têm vaga. É a etapa mais crítica e prioritária para expansão.
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ ABA 8 — DEMANDA POR BAIRRO ═════════════════════════════ */}
              {activeTab === 'demanda-bairro' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">Demanda por Bairro</h2>
                  <p className="text-slate-500 text-sm">Crianças 0–3 anos cadastradas no CadÚnico vs. matriculadas em creche</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Total CadÚnico (0-3a)', value: mockDemandaBairro.reduce((s, d) => s + d.totalCadUnico, 0), color: 'text-slate-800' },
                      { label: 'Frequentam creche', value: mockDemandaBairro.reduce((s, d) => s + d.frequentam, 0), color: 'text-green-700' },
                      { label: 'Não frequentam', value: mockDemandaBairro.reduce((s, d) => s + d.naoFrequentam, 0), color: 'text-red-700' },
                    ].map(c => (
                      <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                        <div className={`text-3xl font-bold ${c.color}`}>{c.value.toLocaleString('pt-BR')}</div>
                        <div className="text-sm text-slate-500 mt-1">{c.label}</div>
                      </div>
                    ))}
                  </div>

                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={mockDemandaBairro.filter(d => d.totalCadUnico >= 10).sort((a, b) => b.naoFrequentam - a.naoFrequentam)} layout="vertical">
                      <CartesianGrid key="grid" strokeDasharray="3 3" horizontal={false} />
                      <XAxis key="xaxis" type="number" />
                      <YAxis key="yaxis" type="category" dataKey="bairro" width={160} tick={{ fontSize: 12 }} />
                      <Tooltip key="tooltip" />
                      <Bar key="naoFrequentam" dataKey="naoFrequentam" name="Não frequentam" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      <Bar key="frequentam" dataKey="frequentam" name="Frequentam" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      <Legend key="legend" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ═══ ABA 9 — DEMANDA POR UNIDADE (CADUNICO E RAIO) ═════════════════════════════ */}
              {activeTab === 'demanda-unidade' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-800">CadÚnico por Unidade e Raio</h2>
                  <p className="text-slate-500 text-sm">Distribuição das crianças do CadÚnico por etapa e proximidade das escolas</p>

                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Raio de Distância (em metros)</label>
                      <input
                        type="range"
                        min="500"
                        max="3000"
                        step="500"
                        value={raioSelecionado}
                        onChange={e => setRaioSelecionado(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                        <span>500m</span>
                        <span>1000m</span>
                        <span>1500m</span>
                        <span>2000m</span>
                        <span>2500m</span>
                        <span>3000m</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 px-6 py-4 rounded-lg border border-blue-100 flex flex-col items-center justify-center min-w-[150px]">
                      <span className="text-sm font-medium text-blue-700 mb-1">Raio Atual</span>
                      <span className="text-2xl font-black text-blue-900">{raioSelecionado}m</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 font-bold">Unidade Escolar</th>
                          <th className="px-4 py-4 font-bold">Etapa</th>
                          <th className="px-4 py-4 font-bold text-center">Demanda (Raio)</th>
                          <th className="px-4 py-4 font-bold text-center">Vagas Atuais</th>
                          <th className="px-4 py-4 font-bold text-center">Novas Vagas</th>
                          <th className="px-4 py-4 font-bold text-center">Déficit</th>
                          <th className="px-4 py-4 font-bold text-center">Atendimento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mockCadUnicoUnidade.map((d, unitIndex) => {
                          const uni = mockUnidades.find(u => u.id === d.unidadeId);
                          // Encontrar o menor raio >= raioSelecionado
                          const distData = d.raios.find(r => r.raioMts >= raioSelecionado) || d.raios[d.raios.length - 1];
                          const etapas: EtapaEI[] = ['Maternal', 'Jardim I', 'Jardim II'];

                          return etapas.map((etapa, idx) => {
                            const demanda = etapa === 'Maternal' ? distData.maternal : (etapa === 'Jardim I' ? distData.jardimI : distData.jardimII);
                            const vagaAtualInfo = uni?.vagasPorEtapa.find(v => v.etapa === etapa);
                            const vagasAtuais = vagaAtualInfo ? vagaAtualInfo.vagas : 0;

                            // Busca na aba de Ações em Unidades se há expansão planejada para esta unidade e etapa
                            const novasVagas = acoes.filter(a => a.unidadeId === d.unidadeId && a.etapaDestino === etapa).reduce((sum, a) => sum + (a.novaCapacidade - a.capacidadeAnterior), 0);

                            const totalVagas = vagasAtuais + novasVagas;
                            const deficit = demanda - totalVagas;
                            const deficitPositivo = deficit > 0 ? deficit : 0;

                            // Porcentagem
                            const taxaAtendimento = demanda > 0 ? Math.min(100, (totalVagas / demanda) * 100) : 100;

                            // Classes visuais
                            const deficitClass = deficitPositivo > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-medium';
                            const taxaClass = taxaAtendimento >= 100 ? 'text-green-700 bg-green-100' : taxaAtendimento >= 50 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100';

                            return (
                              <tr key={`${d.unidadeId}-${etapa}`} className={`hover:bg-slate-50 transition-colors ${idx === 0 && unitIndex !== 0 ? 'border-t-2 border-slate-200' : ''}`}>
                                {idx === 0 && (
                                  <td className="px-6 py-3 font-semibold text-slate-800 border-r border-slate-100" rowSpan={3}>
                                    {uni?.nome || 'Unidade Desconhecida'}
                                  </td>
                                )}
                                <td className="px-4 py-3 text-slate-600 font-medium bg-slate-50/30">{etapa}</td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700 bg-blue-50/30">{demanda}</td>
                                <td className="px-4 py-3 text-center text-slate-600">{vagasAtuais}</td>
                                <td className="px-4 py-3 text-center text-green-600 font-bold">{novasVagas > 0 ? `+${novasVagas}` : '-'}</td>
                                <td className={`px-4 py-3 text-center ${deficitClass}`}>
                                  {deficitPositivo}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${taxaClass}`}>
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

              {/* ═══ ABA 10 — PROJEÇÃO ORÇAMENTÁRIA ═════════════════════ */}
              {activeTab === 'projecao-orcamentaria' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Projeção Orçamentária</h2>
                    <p className="text-slate-500">Distribuição de investimento por ano e ação planejada</p>
                  </div>

                  {itensOrcamentarios.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                      <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                      <h3 className="font-bold text-amber-800 mb-1">Nenhuma ação planejada</h3>
                      <p className="text-amber-600 text-sm">Adicione obras ou ações nas abas anteriores para visualizar a projeção orçamentária.</p>
                    </div>
                  )}

                  {itensOrcamentarios.length > 0 && (
                    <>
                      {/* Itens por META */}
                      <div className="space-y-4">
                        {itensOrcamentarios.map((item, idx) => (
                          <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            {/* Header da META */}
                            <div className="bg-green-500 text-white px-5 py-3 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-lg">META {idx + 1}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.tipo === 'obra' ? 'bg-orange-400' : 'bg-purple-400'}`}>
                                    {item.tipo === 'obra' ? '🏗️ Obra' : '📐 Ação'}
                                  </span>
                                </div>
                                <h3 className="font-bold text-lg mt-1">{item.nome}</h3>
                                {item.descricao && <p className="text-sm text-green-100 mt-0.5">{item.descricao}</p>}
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-green-100">Total Investimento</div>
                                <div className="font-black text-2xl">{BRL(item.totalInvestimento)}</div>
                              </div>
                            </div>

                            {/* Tabela de projeção */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-green-50">
                                  <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-green-800 w-40">Indicador</th>
                                    {anosProjecao.map(ano => (
                                      <th key={ano} className="text-center px-4 py-3 font-semibold text-green-800 w-32">{ano}</th>
                                    ))}
                                    <th className="text-center px-4 py-3 font-bold text-white bg-green-600 w-36">TOTAL</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {/* Investimento */}
                                  <tr className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-700">Investimento</td>
                                    {item.desembolsoPorAno.map(d => (
                                      <td key={d.ano} className="px-4 py-3 text-center font-semibold text-slate-800">
                                        {d.valor > 0 ? BRL(d.valor) : '—'}
                                      </td>
                                    ))}
                                    <td className="px-4 py-3 text-center font-bold text-green-700 bg-green-50">
                                      {BRL(item.totalInvestimento)}
                                    </td>
                                  </tr>

                                  <tr className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-700">Custeio com Pessoal</td>
                                    {anosProjecao.map(ano => {
                                      const isOperando = item.anoConclusao ? ano >= item.anoConclusao : true;
                                      const valorPessoal = isOperando ? item.custoPessoalAnual : 0;
                                      return (
                                        <td key={ano} className="px-4 py-3 text-center font-semibold text-purple-700">
                                          {valorPessoal > 0 ? BRL(valorPessoal) : '—'}
                                        </td>
                                      );
                                    })}
                                    <td className="px-4 py-3 text-center font-bold text-purple-700 bg-purple-50">
                                      {BRL(anosProjecao.reduce((s, ano) => {
                                        const isOperando = item.anoConclusao ? ano >= item.anoConclusao : true;
                                        return s + (isOperando ? item.custoPessoalAnual : 0);
                                      }, 0))}
                                    </td>
                                  </tr>

                                  {/* Vagas */}
                                  <tr className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-700">Novas Vagas</td>
                                    {item.desembolsoPorAno.map(d => (
                                      <td key={d.ano} className="px-4 py-3 text-center font-semibold text-blue-700">
                                        {d.valor > 0 ? item.vagas : '—'}
                                      </td>
                                    ))}
                                    <td className="px-4 py-3 text-center font-bold text-blue-700 bg-blue-50">
                                      {item.vagas}
                                    </td>
                                  </tr>

                                  {/* Salas */}
                                  <tr className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold text-slate-700">Nº de Salas</td>
                                    {item.desembolsoPorAno.map(d => (
                                      <td key={d.ano} className="px-4 py-3 text-center font-semibold text-purple-700">
                                        {d.valor > 0 ? item.salas : '—'}
                                      </td>
                                    ))}
                                    <td className="px-4 py-3 text-center font-bold text-purple-700 bg-purple-50">
                                      {item.salas}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Consolidado Geral */}
                      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl shadow-xl overflow-hidden">
                        <div className="bg-green-800 px-6 py-4">
                          <h3 className="text-white font-black text-xl flex items-center gap-2">
                            <BarChart3 className="w-6 h-6" />
                            CONSOLIDADO GERAL
                          </h3>
                          <p className="text-green-200 text-sm">Totalização de todas as metas do plano</p>
                        </div>

                        <div className="p-6">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-white">
                              <thead>
                                <tr className="border-b border-green-500">
                                  <th className="text-left px-4 py-3 font-bold w-40">Indicador</th>
                                  {anosProjecao.map(ano => (
                                    <th key={ano} className="text-center px-4 py-3 font-bold w-32">{ano}</th>
                                  ))}
                                  <th className="text-center px-4 py-3 font-black text-lg bg-green-800 w-36">TOTAL</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-green-500">
                                {/* Investimento Total */}
                                <tr>
                                  <td className="px-4 py-4 font-bold text-lg">INVESTIMENTO</td>
                                  {totaisConsolidados.investimentoPorAno.map(d => (
                                    <td key={d.ano} className="px-4 py-4 text-center font-bold text-lg">
                                      {d.valor > 0 ? BRL(d.valor) : '—'}
                                    </td>
                                  ))}
                                  <td className="px-4 py-4 text-center font-black text-2xl bg-green-800">
                                    {BRL(totaisConsolidados.totalInvestimento)}
                                  </td>
                                </tr>

                                {/* Vagas Totais */}
                                <tr>
                                  <td className="px-4 py-4 font-bold">Novas Vagas</td>
                                  {totaisConsolidados.vagasPorAno.map(d => (
                                    <td key={d.ano} className="px-4 py-4 text-center font-bold">
                                      {d.vagas > 0 ? d.vagas : '—'}
                                    </td>
                                  ))}
                                  <td className="px-4 py-4 text-center font-black text-xl bg-green-800">
                                    {totaisConsolidados.totalVagas}
                                  </td>
                                </tr>

                                {/* Salas Totais */}
                                <tr>
                                  <td className="px-4 py-4 font-bold">Nº de Salas</td>
                                  {totaisConsolidados.salasPorAno.map(d => (
                                    <td key={d.ano} className="px-4 py-4 text-center font-bold">
                                      {d.salas > 0 ? d.salas : '—'}
                                    </td>
                                  ))}
                                  <td className="px-4 py-4 text-center font-black text-xl bg-green-800">
                                    {totaisConsolidados.totalSalas}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* KPIs adicionais */}
                          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-green-500">
                            <div className="text-center">
                              <div className="text-green-200 text-xs mb-1">Investimento Médio/Ano</div>
                              <div className="font-black text-xl">{BRL(totaisConsolidados.totalInvestimento / 4)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-200 text-xs mb-1">Custo Médio/Vaga</div>
                              <div className="font-black text-xl">
                                {totaisConsolidados.totalVagas > 0 ? BRL(totaisConsolidados.totalInvestimento / totaisConsolidados.totalVagas) : '—'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-200 text-xs mb-1">Custo Médio/Sala</div>
                              <div className="font-black text-xl">
                                {totaisConsolidados.totalSalas > 0 ? BRL(totaisConsolidados.totalInvestimento / totaisConsolidados.totalSalas) : '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alertas e observações */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                        <strong>💡 Observação:</strong> Os valores de vagas e salas são exibidos no ano em que o investimento está previsto. O total considera a capacidade acumulada de todas as metas.
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ═══ ABA 11 — RESULTADO ══════════════════════════════════ */}
              {activeTab === 'resultado' && (() => {
                const demandaGeral = mockDemandaEtapa.reduce((sum, d) => sum + d.criancasResidentes, 0);
                const vagasAtuaisGeral = mockDemandaEtapa.reduce((sum, d) => sum + d.vagasAtuais, 0);
                const vagasCriadas = totaisConsolidados.totalVagas;

                const taxaAtual = demandaGeral > 0 ? (vagasAtuaisGeral / demandaGeral) * 100 : 100;
                const taxaProjetada = demandaGeral > 0 ? ((vagasAtuaisGeral + vagasCriadas) / demandaGeral) * 100 : 100;
                const deficitResidual = demandaGeral - (vagasAtuaisGeral + vagasCriadas);

                const fontesDisponiveis = totalFontes;
                const fontesComprometidas = totaisConsolidados.totalInvestimento;
                const saldoFinalCaixa = fontesDisponiveis - fontesComprometidas;

                let acumVagas = 0;
                const evolucaoVagas = totaisConsolidados.vagasPorAno.filter(v => v.vagas > 0).map(v => {
                  acumVagas += v.vagas;
                  const taxaAno = demandaGeral > 0 ? ((vagasAtuaisGeral + acumVagas) / demandaGeral) * 100 : 100;
                  return { ano: v.ano, vagas: v.vagas, acum: acumVagas, taxa: taxaAno.toFixed(2) + '%' };
                });

                return (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-slate-800">Raio-X do Plano: Impacto e Projeções</h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Taxa atual (Base)', value: `${taxaAtual.toFixed(2)}%`, sub: 'de atendimento global', color: 'bg-red-500', icon: '📉' },
                        { label: 'Novas vagas do Plano', value: vagasCriadas, sub: 'impacto direto das metas', color: 'bg-blue-500', icon: '🏫' },
                        { label: 'Taxa projetada', value: `${taxaProjetada.toFixed(2)}%`, sub: 'após conclusão do plano', color: 'bg-green-500', icon: '📈' },
                        { label: 'Déficit residual', value: deficitResidual > 0 ? deficitResidual : 0, sub: 'vagas que ainda faltarão', color: 'bg-amber-500', icon: '⚠️' },
                      ].map(kpi => (
                        <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                          <div className="text-2xl mb-2">{kpi.icon}</div>
                          <div className={`text-3xl font-black text-white ${kpi.color} px-3 py-1 rounded-lg inline-block mb-2`}>{kpi.value}</div>
                          <div className="font-semibold text-slate-700 text-sm">{kpi.label}</div>
                          <div className="text-xs text-slate-500">{kpi.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                      <h3 className="font-bold text-slate-700 mb-4">Evolução da Taxa de Atendimento (Por Ano de Conclusão)</h3>
                      {evolucaoVagas.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="text-center px-4 py-3 font-semibold text-slate-700">Ano da Conclusão</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-700">Novas Vagas Entregues</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-700">Acumulado (Plano)</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-700">Taxa de Atendimento Global</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {evolucaoVagas.map(row => (
                                <tr key={row.ano} className="hover:bg-slate-50">
                                  <td className="px-4 py-4 text-center font-bold text-slate-800">{row.ano}</td>
                                  <td className="px-4 py-4 text-center font-semibold text-green-700">+{row.vagas}</td>
                                  <td className="px-4 py-4 text-center font-bold text-blue-700">{row.acum}</td>
                                  <td className="px-4 py-4 text-center">
                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">{row.taxa}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-500">Nenhuma meta com ano de conclusão cadastrada ou vagas geradas.</div>
                      )}

                      {evolucaoVagas.length > 0 && (
                        <div className="mt-6 border-t border-slate-200 pt-6">
                          <h4 className="text-sm font-bold text-slate-600 mb-4 text-center">Impacto Cumulativo vs. Taxa de Atendimento</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={evolucaoVagas}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="ano" />
                              <YAxis yAxisId="left" orientation="left" />
                              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} />
                              <Tooltip formatter={(value, name) => [name === 'Taxa de Atendimento' ? `${value}%` : value, name]} />
                              <Legend />
                              <Bar yAxisId="left" dataKey="vagas" name="Novas Vagas (Ano)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              <Line yAxisId="right" type="monotone" dataKey={row => parseFloat(row.taxa)} name="Taxa de Atendimento" stroke="#10b981" strokeWidth={3} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-md">
                        <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-200" /> Balanço Financeiro (Caixa Único)
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-end border-b border-emerald-500 pb-3">
                            <div>
                              <div className="text-emerald-100 text-sm">Total de Fontes Disponíveis</div>
                            </div>
                            <div className="font-bold text-xl">{BRL(fontesDisponiveis)}</div>
                          </div>
                          <div className="flex justify-between items-end border-b border-emerald-500 pb-3">
                            <div>
                              <div className="text-emerald-100 text-sm">Investimento Comprometido (Metas)</div>
                            </div>
                            <div className="font-bold text-xl text-red-200">-{BRL(fontesComprometidas)}</div>
                          </div>
                          <div className="flex justify-between items-end pt-2">
                            <div>
                              <div className="font-bold text-lg">Saldo Restante</div>
                            </div>
                            <div className={`font-black text-3xl ${saldoFinalCaixa < 0 ? 'text-red-300' : 'text-emerald-100'}`}>
                              {BRL(saldoFinalCaixa)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-orange-600 to-amber-700 rounded-xl p-6 text-white shadow-md">
                        <h3 className="font-bold text-xl mb-4">Custeio Operacional Pós-Plano</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-orange-500 pb-3">
                            <span className="text-orange-100 text-sm">Custo com Pessoal / Ano</span>
                            <span className="font-bold text-lg">{BRL(totalCustoAnualPessoal)}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-orange-500 pb-3">
                            <span className="text-orange-100 text-sm">Custo Médio de Investimento / Vaga</span>
                            <span className="font-bold text-lg">
                              {vagasCriadas > 0 ? BRL(fontesComprometidas / vagasCriadas) : '—'}
                            </span>
                          </div>
                          <div className="pt-2">
                            <p className="text-orange-200 text-xs">
                              O custeio operacional estima os salários e encargos dos novos profissionais que precisarão ser contratados para atender as {vagasCriadas} vagas criadas.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                      <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-700" /> CadÚnico Geral da Rede
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-black text-slate-800">{demandaGeral}</div>
                          <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">Crianças Cadastradas</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-black text-red-600">{demandaGeral - vagasAtuaisGeral}</div>
                          <div className="text-xs font-semibold text-red-500 mt-1 uppercase tracking-wide">Sem Vaga Atual</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-black text-green-600">{deficitResidual > 0 ? deficitResidual : 0}</div>
                          <div className="text-xs font-semibold text-green-600 mt-1 uppercase tracking-wide">Déficit com Plano</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="text-2xl font-black text-blue-600">{vagasCriadas}</div>
                          <div className="text-xs font-semibold text-blue-600 mt-1 uppercase tracking-wide">Vagas do Plano</div>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-7 py-4 flex justify-between items-center">
              <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" /> Cancelar
              </button>
              <div className="flex items-center gap-3">
                {currentIdx > 0 && (
                  <button onClick={() => setActiveTab(TABS[currentIdx - 1].id)} className="flex items-center gap-2 px-4 py-2.5 text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors text-sm">
                    ← Anterior
                  </button>
                )}
                <button onClick={handleSalvarPlano} className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow">
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Salvar Alterações' : 'Salvar Plano'}
                </button>
                {currentIdx < TABS.length - 1 && (
                  <button onClick={() => setActiveTab(TABS[currentIdx + 1].id)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
                    Próxima →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
