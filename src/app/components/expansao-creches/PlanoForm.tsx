import { useState, useEffect } from 'react';
import {
  ChevronLeft, Save, X, Plus, Trash2, UserPlus,
  Building2, AlertCircle, CheckCircle2, BarChart3, Users,
  TrendingUp, MapPin, BookOpen, Wrench, ClipboardList, DollarSign,
} from 'lucide-react';
import { mockServidores, mockUnidades, mockDemandaBairro, mockDemandaEtapa, mockProjecaoVagas, mockPlans, mockActivities } from './mockData';
import { mockModelosCreche, mockModelosAmbiente, calcularCustoCreche, calcularCustoAmbiente } from './mockDataCusto';
import {
  ExpansionPlan, EstrategiaExpansao, AcaoUnidade, ObraConstrucao,
  MembroEquipe, FonteFinanciamento, EtapaEI, Prioridade,
  ModeloCreche, ModeloAmbiente, DesembolsoAnual
} from './types';
import { calcularCustoObraTotal, calcularCustoAcaoTotal, calcularAutoDistribuicao } from './utils/planLogic';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';

interface PlanoFormProps {
  onBack: () => void;
  isEdit?: boolean;
  planId?: string;
}

type TabGroup = 'planejamento' | 'diagnostico' | 'resultado';
type TabId =
  | 'dados' | 'equipe' | 'estrategias' | 'acoes-unidades' | 'obras' | 'desembolso' | 'pessoal' | 'projecao-orcamentaria'
  | 'vagas-turma' | 'demanda-etapa' | 'demanda-bairro'
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
const FUNCOES_PESSOAL = [
  'Professor',
  'Auxiliar de Sala',
  'Cuidador AEE',
  'Diretor',
  'Vice-Diretor',
  'Secretário Escolar',
  'Auxiliar de Secretaria',
  'Supervisor Escolar',
  'Demais Especialistas',
  'Agente de Limpeza',
  'Merendeira Escolar',
  'Inspetor Escolar',
  'Agente de Vigilância',
];

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
    return cached ? JSON.parse(cached) : mockModelosCreche;
  });

  const [ambientes] = useState<ModeloAmbiente[]>(() => {
    const cached = localStorage.getItem("exp_creches_ambientes");
    return cached ? JSON.parse(cached) : mockModelosAmbiente;
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
    { id: 'ff1', fonte: 'FNDE — Proinfância', valorPrevisto: 12415806, anoDesembolso: 2029 },
    { id: 'ff2', fonte: 'Recurso Próprio', valorPrevisto: 1289758, anoDesembolso: 2028 },
    { id: 'ff3', fonte: 'Convênio MD Calha Norte', valorPrevisto: 1189777, anoDesembolso: 2026 },
    { id: 'ff4', fonte: 'Emenda Parlamentar', valorPrevisto: 321184, anoDesembolso: 2027 },
  ]);

  const [filtroServidor, setFiltroServidor] = useState('');
  const [servidorSelecionadoId, setServidorSelecionadoId] = useState('');
  const [papelSelecionado, setPapelSelecionado] = useState<MembroEquipe['papel']>('membro');

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
  const addFonte = () => setFontes(f => [...f, { id: `ff${Date.now()}`, fonte: 'Recurso Próprio', valorPrevisto: 0, anoDesembolso: periodoInicio }]);
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
  }]);
  const removeObra = (id: string) => setObras(o => o.filter(x => x.id !== id));

  // ═══ ABA 5 — PESSOAL: Estados e Funções ═══════════════════════════════════════

  interface ConfiguracaoSala {
    id: string;
    origem: 'obra' | 'acao';
    origemId: string;
    nome: string;
    numeroTurmas: number;
    etapas: EtapaEI[];
  }

  interface ItemPessoal {
    id: string;
    funcao: string;
    categoria: 'pedagogico' | 'administrativo' | 'apoio';
    quantidade: number;
    remuneracaoBase: number;
    auxilios: number;
    autoCalculado?: boolean;
    observacoes?: string;
  }

  const [configSalas, setConfigSalas] = useState<ConfiguracaoSala[]>([]);
  const [pessoal, setPessoal] = useState<ItemPessoal[]>([
    { id: 'p1', funcao: 'Diretor', categoria: 'administrativo', quantidade: 4, remuneracaoBase: 4967.77, auxilios: 695.49, autoCalculado: false },
    { id: 'p2', funcao: 'Agente de Limpeza', categoria: 'apoio', quantidade: 8, remuneracaoBase: 1606.00, auxilios: 224.84, autoCalculado: false },
    { id: 'p3', funcao: 'Merendeira Escolar', categoria: 'apoio', quantidade: 6, remuneracaoBase: 1606.00, auxilios: 224.84, autoCalculado: false },
    { id: 'p4', funcao: 'Agente de Vigilância', categoria: 'apoio', quantidade: 4, remuneracaoBase: 1800.00, auxilios: 252.00, autoCalculado: false },
    { id: 'p5', funcao: 'Secretário Escolar', categoria: 'administrativo', quantidade: 2, remuneracaoBase: 1800.00, auxilios: 252.00, autoCalculado: false },
  ]);

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
    const totalObras = obras.length;

    // Remover itens auto-calculados antigos
    const pessoalManual = pessoal.filter(p => !p.autoCalculado);

    // Adicionar novos itens auto-calculados
    const novosItens: ItemPessoal[] = [
      {
        id: 'auto-professor',
        funcao: 'Professor',
        categoria: 'pedagogico',
        quantidade: totalTurmas,
        remuneracaoBase: 4867.77,
        auxilios: 681.69,
        autoCalculado: true,
      },
      {
        id: 'auto-auxiliar',
        funcao: 'Auxiliar de Sala',
        categoria: 'pedagogico',
        quantidade: totalTurmas,
        remuneracaoBase: 2700.00,
        auxilios: 378.00,
        autoCalculado: true,
      },
    ];

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
    const patronal = (item.remuneracaoBase + item.auxilios) * 0.14;
    const custoMensal = (item.remuneracaoBase + item.auxilios + patronal) * item.quantidade;
    const custoAnual = custoMensal * 13; // 13º salário
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

  const fontesPorAno = anosPlano.map(ano => ({
    ano,
    valorPrevisto: fontes.filter(f => f.anoDesembolso === ano).reduce((s, f) => s + (f.valorPrevisto || 0), 0),
    itens: fontes.filter(f => f.anoDesembolso === ano),
  }));

  const fontesPorAnoMap = Object.fromEntries(fontesPorAno.map(f => [f.ano, f.valorPrevisto] as [number, number]));

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

  const saldoPorAno = anosPlano.map(ano => ({
    ano,
    disponivel: fontesPorAnoMap[ano] || 0,
    demanda: demandaPorAno.find(d => d.ano === ano)?.valor || 0,
    saldo: (fontesPorAnoMap[ano] || 0) - (demandaPorAno.find(d => d.ano === ano)?.valor || 0),
  }));

  const totalDemanda = demandaPorAno.reduce((s, d) => s + d.valor, 0);
  const totalFonte = fontesPorAno.reduce((s, f) => s + f.valorPrevisto, 0);

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

      // Estimativa de vagas baseada na capacidade real do modelo selecionado
      const modeloRelacionado = modelos.find(m => m.tipoBase === obra.tipoProjetoFNDE);
      const vagasEstimadas = modeloRelacionado ? (modeloRelacionado.capacidadeAlunos || 120) : (obra.numeroDeSalas * 16 * 2);

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
        vagas: Math.max(0, acao.novaCapacidade - acao.capacidadeAnterior),
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

  const inputCls = "w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none";

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
                Painel de leitura — dados diagnósticos de referência que contextualizam o planejamento.
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
                      <label className="block text-sm font-semibold text-slate-700">Fontes de Financiamento</label>
                      <button onClick={addFonte} className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                        <Plus className="w-4 h-4" /> Adicionar Fonte
                      </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-3 shadow-sm">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600">Fonte de Financiamento</th>
                            <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[180px]">Ano Desembolso</th>
                            <th className="text-right px-4 py-3 font-semibold text-slate-600 w-[220px]">Valor Previsto</th>
                            <th className="text-center px-4 py-3 font-semibold text-slate-600 w-[70px]">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fontes.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                Nenhuma fonte de financiamento cadastrada para este plano.
                              </td>
                            </tr>
                          ) : (
                            fontes.map(f => (
                              <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2">
                                  <select value={f.fonte} onChange={e => setFontes(prev => prev.map(x => x.id === f.id ? { ...x, fonte: e.target.value } : x))}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                                    {FONTES_OPCOES.map(o => <option key={o}>{o}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <input type="number" value={f.anoDesembolso}
                                    onChange={e => setFontes(prev => prev.map(x => x.id === f.id ? { ...x, anoDesembolso: Number(e.target.value) } : x))}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Ano" />
                                </td>
                                <td className="px-4 py-2">
                                  <CurrencyInput
                                    value={f.valorPrevisto}
                                    onChange={v => setFontes(prev => prev.map(x => x.id === f.id ? { ...x, valorPrevisto: v } : x))}
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm text-right font-semibold text-slate-800"
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button onClick={() => removeFonte(f.id)} className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
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
                      <div className="mb-3 text-slate-700 font-semibold">Fontes de financiamento por ano</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="text-left px-4 py-2 font-semibold text-slate-700">Ano</th>
                              <th className="text-left px-4 py-2 font-semibold text-slate-700">Fonte</th>
                              <th className="text-right px-4 py-2 font-semibold text-slate-700">Valor previsto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {fontes.slice().sort((a, b) => a.anoDesembolso - b.anoDesembolso || a.fonte.localeCompare(b.fonte)).map(fonte => (
                              <tr key={`${fonte.id}-${fonte.anoDesembolso}`}>
                                <td className="px-4 py-2 text-slate-700">{fonte.anoDesembolso}</td>
                                <td className="px-4 py-2 text-slate-700">{fonte.fonte || 'Fonte não definida'}</td>
                                <td className="px-4 py-2 text-right text-slate-800 font-semibold">{BRL(fonte.valorPrevisto)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold text-slate-800">
                            <tr>
                              <td colSpan={2} className="px-4 py-2">Total disponível</td>
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
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800">Equipe Responsável</h2>
                      <p className="text-slate-600 text-sm">Gerencie o vínculo e os papéis dos servidores neste plano. (Total na equipe: {equipe.length})</p>
                    </div>
                    {/* Filtro de Busca */}
                    <div className="w-full md:w-80">
                      <input
                        type="text"
                        value={filtroServidor}
                        onChange={e => setFiltroServidor(e.target.value)}
                        placeholder="Buscar servidor por nome ou secretaria..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-center px-4 py-3 font-semibold text-slate-600 w-[70px]">Vínculo</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Servidor</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[240px]">Cargo</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[150px]">Secretaria</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 w-[200px]">Papel no Plano</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mockServidores
                          .filter(s =>
                            s.nome.toLowerCase().includes(filtroServidor.toLowerCase()) ||
                            s.secretaria.toLowerCase().includes(filtroServidor.toLowerCase()) ||
                            s.cargo.toLowerCase().includes(filtroServidor.toLowerCase())
                          )
                          .map(servidor => {
                            const membro = equipe.find(e => e.servidorId === servidor.id);
                            const isLinked = !!membro;

                            return (
                              <tr key={servidor.id} className={`hover:bg-slate-50 transition-colors ${isLinked ? 'bg-blue-50/20' : ''}`}>
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isLinked}
                                    onChange={() => toggleMembro(servidor.id)}
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${isLinked
                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                        : 'bg-gradient-to-br from-slate-300 to-slate-400'
                                      }`}>
                                      {servidor.nome.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                    </div>
                                    <span className={`font-semibold ${isLinked ? 'text-slate-800' : 'text-slate-600'}`}>
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
                                    value={membro?.papel || 'membro'}
                                    disabled={!isLinked}
                                    onChange={e => updatePapelMembro(servidor.id, e.target.value as MembroEquipe['papel'])}
                                    className={`text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white outline-none w-full ${!isLinked ? 'opacity-40 cursor-not-allowed bg-slate-50' : 'focus:ring-2 focus:ring-blue-500'
                                      }`}
                                  >
                                    <option value="elaborador">Elaborador</option>
                                    <option value="revisor">Revisor</option>
                                    <option value="aprovador">Aprovador</option>
                                    <option value="membro">Membro</option>
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

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

                  {acoes.map(acao => {
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
                                  const capAnterior = acao.tipo === 'adaptacao' ? (ambientesAdaptacao.find(a => a.salaId === selectedId)?.capacidadeAtual ?? 0) : 0;
                                  setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, salaId: selectedId, capacidadeAnterior: capAnterior, custoPorSala: custo } : x));
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


                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Etapa Destino</label>
                            <select value={acao.etapaDestino} onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, etapaDestino: e.target.value as EtapaEI } : x))} className={inputCls}>{ETAPAS.map(e => <option key={e}>{e}</option>)}</select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Nova Capacidade</label>
                            <input type="number" value={acao.novaCapacidade} onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, novaCapacidade: Number(e.target.value) } : x))} className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Fonte Financiamento</label>
                            <select value={acao.fonteFinanciamento} onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, fonteFinanciamento: e.target.value } : x))} className={inputCls}>{FONTES_OPCOES.map(f => <option key={f}>{f}</option>)}</select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Previsão de Conclusão</label>
                            <input type="date" value={acao.previsaoConclusao}
                              onChange={e => setAcoes(prev => prev.map(x => x.id === acao.id ? { ...x, previsaoConclusao: e.target.value } : x))}
                              className={inputCls} />
                          </div>
                        </div>

                        {/* Badge de vagas */}
                        <div className="flex items-center gap-3">
                          <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${acao.novaCapacidade > acao.capacidadeAnterior ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {acao.novaCapacidade > acao.capacidadeAnterior
                              ? `+${acao.novaCapacidade - acao.capacidadeAnterior} novas vagas`
                              : `Reordenamento: ${acao.novaCapacidade} vagas`}
                          </div>
                          {acao.custoPorSala === 0 && acao.salaId && (
                            <span className="text-xs text-amber-600 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              Selecione um modelo de creche para calcular o custo
                            </span>
                          )}
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

                  {obras.map(obra => (
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

                      {/* Modelo de custo */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <label className="block text-xs font-semibold text-blue-700 mb-2">Modelo de Custo (auto-preenchimento)</label>
                        <div className="flex gap-3 items-end flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <select
                              defaultValue=""
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
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Projeto</label>
                          <select value={obra.tipoProjetoFNDE ?? 'proprio'}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, tipoProjetoFNDE: e.target.value as ObraConstrucao['tipoProjetoFNDE'] } : x))}
                            className={inputCls}>
                            <option value="tipo1">Creche Tipo 1 (FNDE)</option>
                            <option value="tipo2">Creche Tipo 2 (FNDE)</option>
                            <option value="proprio">Projeto Próprio</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Nº de Salas</label>
                          <input type="number" value={obra.numeroDeSalas}
                            onChange={e => setObras(prev => prev.map(x => x.id === obra.id ? { ...x, numeroDeSalas: Number(e.target.value) } : x))}
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
                                    <div className="text-sm font-semibold text-slate-800 truncate">{sala.nome}</div>
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
                                              onChange={e => setPessoal(prev => prev.map(p => p.id === item.id ? { ...p, funcao: e.target.value } : p))}
                                              className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                              disabled={item.autoCalculado}
                                            >
                                              <option value="">Selecione a função...</option>
                                              {FUNCOES_PESSOAL.map(funcao => (
                                                <option key={funcao} value={funcao}>{funcao}</option>
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
                                            <CurrencyInput
                                              value={item.remuneracaoBase}
                                              onChange={v => setPessoal(prev => prev.map(p => p.id === item.id ? { ...p, remuneracaoBase: v } : p))}
                                              className="w-full px-2 py-1 text-sm text-right border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <CurrencyInput
                                              value={item.auxilios}
                                              onChange={v => setPessoal(prev => prev.map(p => p.id === item.id ? { ...p, auxilios: v } : p))}
                                              className="w-full px-2 py-1 text-sm text-right border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
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
                  <p className="text-slate-500 text-sm">Dados de matrículas e ocupação por unidade — ano base 2025</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Unidade</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700">Salas</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700">Maternal</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700">Jardim I</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700">Jardim II</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-700">Vagas</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-700">Matrículas</th>
                          <th className="text-center px-4 py-3 font-semibold text-slate-700">Ocupação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {mockUnidades.filter(u => u.totalVagas > 0).map(u => {
                          const mats = matriculasPorUnidade[u.id] ?? u.totalMatriculas;
                          const ocupacao = u.totalVagas > 0 ? Math.round((mats / u.totalVagas) * 100) : 0;
                          const getVagas = (etapa: EtapaEI) => u.vagasPorEtapa.find(v => v.etapa === etapa)?.vagas ?? 0;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs">
                                <div className="truncate">{u.nome}</div>
                                <div className="text-xs text-slate-400 font-normal">{u.bairro}</div>
                              </td>
                              <td className="px-4 py-3 text-center">{u.salas.filter(s => s.etapaAtendida).length}</td>
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
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ocupacao > 200 ? 'bg-red-100 text-red-700' : ocupacao > 100 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                  {ocupacao}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                        {(() => {
                          const totalVagas = mockUnidades.reduce((s, u) => s + u.totalVagas, 0);
                          const totalMats = mockUnidades.reduce((s, u) => s + (matriculasPorUnidade[u.id] ?? u.totalMatriculas), 0);
                          const ocupacaoGeral = totalVagas > 0 ? Math.round((totalMats / totalVagas) * 100) : 0;
                          return (
                            <tr>
                              <td className="px-4 py-3 font-bold" colSpan={5}>Totais da Rede</td>
                              <td className="px-4 py-3 text-right font-bold">{totalVagas}</td>
                              <td className="px-4 py-3 text-right font-bold">{totalMats}</td>
                              <td className={`px-4 py-3 text-center font-bold ${ocupacaoGeral > 100 ? 'text-red-700' : 'text-green-700'}`}>{ocupacaoGeral}%</td>
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
                            <div><span className="text-slate-500">Residentes:</span> <strong>{d.criancasResidentes.toLocaleString('pt-BR')}</strong></div>
                            <div><span className="text-slate-500">Vagas:</span> <strong>{d.vagasAtuais}</strong></div>
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
                            <th className="text-right px-4 py-3 font-semibold text-slate-700">Crianças Residentes</th>
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
              {activeTab === 'resultado' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-slate-800">Demandas vs. Planejamento de Expansão</h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Taxa atual (2025)', value: '15,33%', sub: 'crianças 0-3 atendidas', color: 'bg-red-500', icon: '📉' },
                      { label: 'Taxa projetada (2029)', value: '29,97%', sub: 'com o plano concluído', color: 'bg-blue-500', icon: '📈' },
                      { label: 'Novas vagas planejadas', value: '672', sub: 'entre 2026 e 2029', color: 'bg-green-500', icon: '🏫' },
                      { label: 'Déficit residual (2029)', value: '939', sub: 'vagas ainda faltantes', color: 'bg-amber-500', icon: '⚠️' },
                    ].map(kpi => (
                      <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5">
                        <div className="text-2xl mb-2">{kpi.icon}</div>
                        <div className={`text-3xl font-black text-white ${kpi.color} px-3 py-1 rounded-lg inline-block mb-2`}>{kpi.value}</div>
                        <div className="font-semibold text-slate-700 text-sm">{kpi.label}</div>
                        <div className="text-xs text-slate-500">{kpi.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-700 mb-4">Evolução das Vagas Criadas (2026–2029)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={mockProjecaoVagas.filter(p => p.ano > 2025)}>
                        <defs>
                          <linearGradient id="colorVagas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis key="xaxis" dataKey="ano" />
                        <YAxis key="yaxis-left" yAxisId="left" />
                        <YAxis key="yaxis-right" yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} />
                        <Tooltip key="tooltip" formatter={(v, name) => [name === 'taxaAtendimento' ? `${v}%` : v, name === 'taxaAtendimento' ? 'Taxa Atendimento' : 'Vagas Acumuladas']} />
                        <Area key="acumulado" yAxisId="left" type="monotone" dataKey="acumulado" name="Vagas Acumuladas" stroke="#3b82f6" fill="url(#colorVagas)" strokeWidth={2} />
                        <Area key="taxa" yAxisId="right" type="monotone" dataKey="taxaAtendimento" name="Taxa Atendimento %" stroke="#10b981" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                        <Legend key="legend" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Ano</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-700">Novas Vagas</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-700">Acumulado</th>
                          <th className="text-right px-4 py-3 font-semibold text-slate-700">Taxa Atendimento</th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-700">Ação Principal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { ano: 2026, vagas: 160, acum: 160, taxa: '18,81%', acao: 'Adaptação Balão Mágico + Retomada Obra Liberdade' },
                          { ano: 2027, vagas: 64, acum: 224, taxa: '20,17%', acao: 'Ampliação Pedro Kemper (2 salas)' },
                          { ano: 2028, vagas: 96, acum: 320, taxa: '22,24%', acao: 'Ampliação Luiz Lenzi (3 salas)' },
                          { ano: 2029, vagas: 352, acum: 672, taxa: '29,97%', acao: '3 novas creches (FNDE Tipo 1, Tipo 2 + Calha Norte)' },
                        ].map(row => (
                          <tr key={row.ano} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-bold text-slate-800">{row.ano}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-700">+{row.vagas}</td>
                            <td className="px-4 py-3 text-right font-bold text-blue-700">{row.acum}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{row.taxa}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{row.acao}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                    <h3 className="font-bold text-xl mb-4">Resumo do Investimento Total</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {fontes.map(f => (
                        <div key={f.id}>
                          <div className="text-blue-200 text-xs mb-1">{f.fonte}</div>
                          <div className="font-bold text-xl">{BRL(f.valorPrevisto)}</div>
                          <div className="text-blue-200 text-xs">em {f.anoDesembolso}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-500 flex justify-between items-center">
                      <span className="font-bold text-lg">TOTAL INVESTIMENTO</span>
                      <span className="font-black text-2xl">{BRL(totalFontes)}</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-600 to-amber-700 rounded-xl p-6 text-white">
                    <h3 className="font-bold text-xl mb-4">Resumo do Custeio Operacional Anual Estimado (Pós-Implantação)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-orange-200 text-xs mb-1">Pessoal (Contratações do Plano)</div>
                        <div className="font-bold text-xl">{BRL(totalCustoAnualPessoal)}</div>
                        <div className="text-orange-200 text-xs">Inclui encargos patronais (14%) e 13º</div>
                      </div>
                      <div>
                        <div className="text-orange-200 text-xs mb-1">Serviços e Contratos Operacionais</div>
                        <div className="font-bold text-xl">
                          {BRL(obras.reduce((acc, obra) => {
                            const model = modelos.find(m => m.tipoBase === obra.tipoProjetoFNDE);
                            return acc + (model ? (model.servicos || []).reduce((s, sv) => s + sv.valorAnual, 0) : 0);
                          }, 0))}
                        </div>
                        <div className="text-orange-200 text-xs">Energia, segurança, manutenção e limpeza</div>
                      </div>
                      <div>
                        <div className="text-orange-200 text-xs mb-1">Aquisições e Consumo de Referência</div>
                        <div className="font-bold text-xl">
                          {BRL(obras.reduce((acc, obra) => {
                            const model = modelos.find(m => m.tipoBase === obra.tipoProjetoFNDE);
                            return acc + (model ? (model.aquisicoes || []).reduce((s, aq) => s + aq.quantidadeAnual * aq.valorUnitario, 0) : 0);
                          }, 0))}
                        </div>
                        <div className="text-orange-200 text-xs">Merenda escolar, material pedagógico e uniforme</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-orange-500 flex justify-between items-center">
                      <span className="font-bold text-lg">CUSTEIO TOTAL OPERACIONAL ANUAL</span>
                      <span className="font-black text-2xl">{BRL(totalCustoAnualPessoal + totalCusteioModelos)}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                    <h3 className="font-bold text-amber-800 mb-2">Crianças em Situação de Vulnerabilidade</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div><div className="text-3xl font-black text-amber-700">1.231</div><div className="text-sm text-amber-600">Crianças 0-3a no CadÚnico</div></div>
                      <div><div className="text-3xl font-black text-red-600">1.215</div><div className="text-sm text-red-500">Não frequentam creche</div></div>
                      <div><div className="text-3xl font-black text-red-700">1,30%</div><div className="text-sm text-red-500">Taxa de atendimento (CadÚnico)</div></div>
                    </div>
                  </div>
                </div>
              )}
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
