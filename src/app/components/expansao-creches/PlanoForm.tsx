import { useState, useEffect } from 'react';
import {
  ChevronLeft, Save, X, Plus, Trash2, UserPlus,
  Building2, AlertCircle, CheckCircle2, BarChart3, Users,
  TrendingUp, MapPin, BookOpen, Wrench, ClipboardList, DollarSign,
  Edit3, Copy, RotateCcw, Clock, Layers, Sparkles, PlusCircle, Check, ArrowRight, HardHat, Calendar, School, Filter, CheckCircle
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

type TabGroup = 'planejamento';
type TabId =
  | 'dados' | 'equipe' | 'estrategias' | 'acoes-unidades' | 'obras' | 'desembolso' | 'pessoal' | 'projecao-orcamentaria';

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
  { id: 'projecao-orcamentaria', label: 'Projeção Orçamentária', group: 'planejamento', icon: <DollarSign className="w-4 h-4" />, desc: 'Distribuição e consolidação' },
];

const GROUP_META: Record<TabGroup, { label: string; short: string; accent: string; bg: string; border: string; dot: string }> = {
  planejamento: { label: 'Planejamento da Expansão', short: 'P', accent: 'text-blue-700', bg: 'bg-blue-600', border: 'border-blue-200', dot: 'bg-blue-600' },
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

// ═══════════════════════════════════════════════════════════════
// MODAL: Ação em Unidade (Adaptação ou Ampliação)
// ═══════════════════════════════════════════════════════════════
interface ModalAcaoProps {
  isOpen: boolean;
  acao: AcaoUnidade | null;
  onClose: () => void;
  onSave: (acao: AcaoUnidade) => void;
  onDelete?: () => void;
  modelos: ModeloCreche[];
  ambientes: ModeloAmbiente[];
}

function ModalAcao({ isOpen, acao, onClose, onSave, onDelete, modelos, ambientes }: ModalAcaoProps) {
  const [draft, setDraft] = useState<AcaoUnidade | null>(acao);

  useEffect(() => {
    setDraft(acao ? { ...acao } : null);
  }, [acao, isOpen]);

  if (!isOpen || !draft) return null;

  const isAdapt = draft.tipo === 'adaptacao';
  const unidade = mockUnidades.find(u => u.id === draft.unidadeId);
  const salas = unidade?.salas ?? [];
  const temCreche = salas.some(s => s.tipoAtual === 'Creche');
  const temEF = salas.some(s => s.tipoAtual === 'Ensino Fundamental');
  const tipoUnidade = !unidade ? null
    : unidade.totalVagas === 0 && !temCreche ? 'EMEF (sem EI)'
      : temCreche && temEF ? 'EMEI/EMEF (mista)'
        : temCreche ? 'Creche / EMEI'
          : 'EMEF';

  const modeloAmpliacao = modelos.find(m => m.id === draft.modeloCrecheId);
  const ambientesAmpliacao: ModeloAmbiente[] = modeloAmpliacao
    ? modeloAmpliacao.ambientes
      .map(mca => ambientes.find(ma => ma.id === mca.modeloAmbienteId))
      .filter((ma): ma is NonNullable<typeof ma> => !!ma)
    : [];
  const ambienteSelecionado = ambientesAmpliacao.find(ma => ma.id === draft.salaId);
  const custoCalculado = ambienteSelecionado ? calcularCustoAmbiente(ambienteSelecionado) : null;
  const salasDaUnidade = salas;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.unidadeId) {
      alert("Por favor, selecione a unidade escolar.");
      return;
    }
    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 my-auto">
        {/* Header temático com gradiente */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isAdapt
            ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700'
            : 'bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              {isAdapt ? <Layers className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isAdapt ? 'Ação de Adaptação (Reordenamento)' : 'Ação de Ampliação de Salas'}
              </h3>
              <p className="text-xs text-white/80">
                {isAdapt
                  ? 'Readequação de espaços existentes em unidade escolar para novas turmas de creche'
                  : 'Construção de novas salas de atendimento em unidade escolar existente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Seletor de Tipo (com destaque de cor imediato) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDraft(prev => prev ? { ...prev, tipo: 'adaptacao', salaId: '', custoPorSala: 0 } : prev)}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                isAdapt
                  ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isAdapt ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-sm font-bold ${isAdapt ? 'text-purple-900' : 'text-slate-800'}`}>
                  Adaptação
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  Reordenamento de espaço existente
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDraft(prev => prev ? { ...prev, tipo: 'ampliacao', salaId: '', custoPorSala: 0 } : prev)}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                !isAdapt
                  ? 'border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                !isAdapt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-sm font-bold ${!isAdapt ? 'text-blue-900' : 'text-slate-800'}`}>
                  Ampliação
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  Construção de novas salas
                </div>
              </div>
            </button>
          </div>

          {/* Unidade Escolar */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Unidade Escolar *
            </label>
            <select
              value={draft.unidadeId}
              onChange={e => setDraft(prev => prev ? {
                ...prev,
                unidadeId: e.target.value,
                salaId: '',
                custoPorSala: 0
              } : prev)}
              className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Selecione a unidade escolar...</option>
              {mockUnidades.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.bairro})
                </option>
              ))}
            </select>

            {tipoUnidade && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
                  {tipoUnidade}
                </span>
                {unidade && (
                  <span className="text-slate-500">
                    {unidade.totalVagas} vagas atuais · {unidade.totalListaEspera} em fila de espera
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Seleção de Ambiente e Custo (Com container destacado na cor do tipo) */}
          <div className={`p-4 rounded-2xl border-2 space-y-3 ${
            isAdapt ? 'border-purple-200 bg-purple-50/30' : 'border-blue-200 bg-blue-50/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-black uppercase tracking-wider ${
                isAdapt ? 'text-purple-800' : 'text-blue-800'
              }`}>
                {isAdapt ? 'Seleção do Ambiente a Adaptar' : 'Seleção do Ambiente a Ampliar'}
              </span>
              <span className="text-[11px] text-slate-400">
                Preenchimento e cálculo automático
              </span>
            </div>

            {isAdapt && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Sala Existente a Ser Reordenada
                </label>
                <select
                  value={draft.salaId}
                  onChange={e => {
                    const sala = salasDaUnidade.find(s => s.id === e.target.value);
                    setDraft(prev => prev ? {
                      ...prev,
                      salaId: e.target.value,
                      capacidadeAnterior: sala?.capacidadeAtual || 0
                    } : prev);
                  }}
                  className="w-full text-sm px-3.5 py-2 border border-purple-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-300 outline-none"
                >
                  <option value="">Selecione a sala da escola...</option>
                  {salasDaUnidade.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({s.tipoAtual} — {s.capacidadeAtual} vagas)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  1. Modelo de Creche (Referência)
                </label>
                <select
                  value={draft.modeloCrecheId || ''}
                  onChange={e => setDraft(prev => prev ? {
                    ...prev,
                    modeloCrecheId: e.target.value,
                    salaId: isAdapt ? prev.salaId : '',
                    custoPorSala: 0
                  } : prev)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecione o modelo...</option>
                  {modelos.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              {!isAdapt && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    2. Ambiente de Referência
                  </label>
                  <select
                    value={draft.salaId}
                    onChange={e => {
                      const selId = e.target.value;
                      const ma = ambientesAmpliacao.find(a => a.id === selId);
                      const custo = ma ? calcularCustoAmbiente(ma).total : 0;
                      const cap = ma?.capacidadeAlunos || 20;
                      setDraft(prev => prev ? {
                        ...prev,
                        salaId: selId,
                        custoPorSala: custo,
                        novaCapacidade: cap
                      } : prev);
                    }}
                    disabled={!draft.modeloCrecheId}
                    className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {!draft.modeloCrecheId ? 'Selecione o modelo primeiro...' : 'Selecione o ambiente...'}
                    </option>
                    {ambientesAmpliacao.map(ma => (
                      <option key={ma.id} value={ma.id}>
                        {ma.nome} — {ma.areaMq} m² — {BRL(calcularCustoAmbiente(ma).total)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Caixa de Custo Dinâmico */}
            {draft.custoPorSala > 0 && custoCalculado && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="space-x-3 text-emerald-800">
                  <span><strong>Obras:</strong> {BRL(custoCalculado.obras)}</span>
                  <span><strong>Mobiliário:</strong> {BRL(custoCalculado.mobiliario)}</span>
                  <span><strong>Equipamentos:</strong> {BRL(custoCalculado.equipamentos)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-600 font-bold block">CUSTO POR SALA</span>
                  <span className="text-base font-black text-emerald-800">{BRL(draft.custoPorSala)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição da Ação *
            </label>
            <input
              type="text"
              value={draft.descricao}
              onChange={e => setDraft(prev => prev ? { ...prev, descricao: e.target.value } : prev)}
              placeholder={isAdapt ? 'Ex: Transformar Sala Multiuso em sala de Jardim I' : 'Ex: Construção de 1 nova sala de Maternal'}
              className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Vagas e Capacidade */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Planejamento de Vagas da Sala
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Capacidade Anterior
                </label>
                <input
                  type="number"
                  min={0}
                  value={draft.capacidadeAnterior}
                  onChange={e => setDraft(prev => prev ? { ...prev, capacidadeAnterior: Number(e.target.value) } : prev)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nova Capacidade da Sala *
                </label>
                <input
                  type="number"
                  min={1}
                  value={draft.novaCapacidade}
                  onChange={e => setDraft(prev => prev ? { ...prev, novaCapacidade: Number(e.target.value) } : prev)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-bold"
                  required
                />
              </div>

              <div className="h-[38px] px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                +{Math.max(0, draft.novaCapacidade - draft.capacidadeAnterior)} novas vagas
              </div>
            </div>
          </div>

          {/* Etapa e Prazo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Etapa Destino
              </label>
              <select
                value={draft.etapaDestino}
                onChange={e => setDraft(prev => prev ? { ...prev, etapaDestino: e.target.value as EtapaEI } : prev)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {ETAPAS.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Previsão de Conclusão
              </label>
              <input
                type="date"
                value={draft.previsaoConclusao}
                onChange={e => setDraft(prev => prev ? { ...prev, previsaoConclusao: e.target.value } : prev)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Footer do Modal */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Ação
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                  isAdapt
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Salvar Ação
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODAL: Obra de Construção (Retomada ou Nova Construção)
// ═══════════════════════════════════════════════════════════════
interface ModalObraProps {
  isOpen: boolean;
  obra: ObraConstrucao | null;
  onClose: () => void;
  onSave: (obra: ObraConstrucao) => void;
  onDelete?: () => void;
  modelos: ModeloCreche[];
  ambientes: ModeloAmbiente[];
  fontes: FonteFinanciamento[];
  periodoInicio: number;
}

function ModalObra({ isOpen, obra, onClose, onSave, onDelete, modelos, ambientes, fontes, periodoInicio }: ModalObraProps) {
  const [draft, setDraft] = useState<ObraConstrucao | null>(obra);

  useEffect(() => {
    setDraft(obra ? { ...obra } : null);
  }, [obra, isOpen]);

  if (!isOpen || !draft) return null;

  const isRetomada = draft.tipo === 'retomada';
  const cc = calcularCustoObraTotal(draft, modelos, ambientes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.nome.trim()) {
      alert("Por favor, informe o nome da obra.");
      return;
    }
    onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 my-auto">
        {/* Header temático com gradiente */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isRetomada
            ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700'
            : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              {isRetomada ? <RotateCcw className="w-5 h-5" /> : <HardHat className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isRetomada ? 'Obra de Retomada' : 'Nova Construção de Creche'}
              </h3>
              <p className="text-xs text-white/80">
                {isRetomada
                  ? 'Continuidade e finalização de obra paralisada ou em andamento'
                  : 'Implantação de nova edificação escolar do zero (FNDE ou Recurso Próprio)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Seletor de Tipo com destaque */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDraft(prev => prev ? { ...prev, tipo: 'retomada', statusObra: 'em_execucao' } : prev)}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                isRetomada
                  ? 'border-orange-500 bg-orange-50/70 text-orange-950 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isRetomada ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-sm font-bold ${isRetomada ? 'text-orange-900' : 'text-slate-800'}`}>
                  Retomada de Obra
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  Obra paralisada ou em andamento
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDraft(prev => prev ? { ...prev, tipo: 'nova', statusObra: 'planejada' } : prev)}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                !isRetomada
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                !isRetomada ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                <HardHat className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-sm font-bold ${!isRetomada ? 'text-emerald-900' : 'text-slate-800'}`}>
                  Nova Construção
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  Construção nova do zero
                </div>
              </div>
            </button>
          </div>

          {/* Identificação e Localização */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
              Identificação & Localização
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome da Obra *</label>
                <input
                  type="text"
                  value={draft.nome}
                  onChange={e => setDraft(prev => prev ? { ...prev, nome: e.target.value } : prev)}
                  placeholder="Ex: Creche Municipal — Bairro Esperança"
                  className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bairro / Setor *</label>
                <input
                  type="text"
                  value={draft.bairro}
                  onChange={e => setDraft(prev => prev ? { ...prev, bairro: e.target.value, localizacao: e.target.value } : prev)}
                  placeholder="Ex: Bairro Liberdade"
                  className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={draft.coordenadas?.lat || ''}
                  onChange={e => setDraft(prev => prev ? {
                    ...prev,
                    coordenadas: { ...prev.coordenadas!, lat: parseFloat(e.target.value) || 0 }
                  } : prev)}
                  placeholder="-11.4500"
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={draft.coordenadas?.lng || ''}
                  onChange={e => setDraft(prev => prev ? {
                    ...prev,
                    coordenadas: { ...prev.coordenadas!, lng: parseFloat(e.target.value) || 0 }
                  } : prev)}
                  placeholder="-61.4500"
                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Modelo de Custo (com destaque de cor no tema) */}
          <div className={`p-4 rounded-2xl border-2 space-y-3 ${
            isRetomada ? 'border-orange-200 bg-orange-50/30' : 'border-emerald-200 bg-emerald-50/30'
          }`}>
            <span className={`text-xs font-black uppercase tracking-wider block ${
              isRetomada ? 'text-orange-900' : 'text-emerald-900'
            }`}>
              Modelo de Referência & Custo Estimado
            </span>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Modelo de Creche (FNDE / Próprio)
              </label>
              <select
                value={draft.modeloCrecheId || ''}
                onChange={e => {
                  const m = modelos.find(mc => mc.id === e.target.value);
                  if (!m) return;
                  const c = calcularCustoCreche(m, ambientes);
                  const salasTotal = m.ambientes
                    .filter(a => {
                      const amb = ambientes.find(ma => ma.id === a.modeloAmbienteId);
                      return amb?.categoria === 'sala-atividades';
                    })
                    .reduce((s, a) => s + a.quantidade, 0) || draft.numeroDeSalas || 4;

                  setDraft(prev => prev ? {
                    ...prev,
                    modeloCrecheId: m.id,
                    tipoProjetoFNDE: m.tipoBase as ObraConstrucao['tipoProjetoFNDE'],
                    numeroDeSalas: salasTotal,
                    capacidadeAlunos: m.capacidadeAlunos || 0,
                    desembolsoPorAno: prev.desembolsoPorAno.length > 0 ? prev.desembolsoPorAno : [
                      { ano: periodoInicio, valor: c.investimento, fonte: fontes[0]?.fonte || 'Recurso Próprio' }
                    ]
                  } : prev);
                }}
                className="w-full text-sm px-3.5 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Selecione o modelo de referência...</option>
                {modelos.map(m => {
                  const c = calcularCustoCreche(m, ambientes);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.nome} — Investimento Ref. {BRL(c.investimento)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Resumo de Custo */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Custo Médio por Sala</span>
                <span className="font-bold text-slate-800 text-sm">
                  {cc.costPerSala > 0 ? BRL(Math.round(cc.costPerSala)) : '—'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Custo Total da Obra</span>
                <span className="font-black text-blue-700 text-base">
                  {cc.total > 0 ? BRL(Math.round(cc.total)) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Dimensionamento & Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nº de Salas *</label>
              <input
                type="number"
                min={1}
                value={draft.numeroDeSalas}
                onChange={e => setDraft(prev => prev ? { ...prev, numeroDeSalas: Number(e.target.value) } : prev)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Vagas Previstas *</label>
              <input
                type="number"
                min={1}
                value={draft.capacidadeAlunos || 0}
                onChange={e => setDraft(prev => prev ? { ...prev, capacidadeAlunos: Number(e.target.value) } : prev)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none font-bold text-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={draft.statusObra || 'planejada'}
                onChange={e => setDraft(prev => prev ? { ...prev, statusObra: e.target.value as ObraConstrucao['statusObra'] } : prev)}
                className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white outline-none"
              >
                <option value="planejada">Planejada</option>
                <option value="licitacao">Em Licitação</option>
                <option value="em_execucao">Em Execução</option>
                <option value="concluida">Concluída</option>
                <option value="paralisada">Paralisada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nº Convênio</label>
              <input
                type="text"
                value={draft.numeroConvenio || ''}
                onChange={e => setDraft(prev => prev ? { ...prev, numeroConvenio: e.target.value } : prev)}
                placeholder="Ex: FNDE/2023"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white outline-none"
              />
            </div>
          </div>

          {/* Campo de Conclusão para Retomada com Slider interativo */}
          {isRetomada && (
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-orange-950 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                  Percentual de Conclusão Atual
                </span>
                <span className="font-black text-orange-700 text-sm">
                  {draft.percentualConclusaoAtual || 0}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={draft.percentualConclusaoAtual || 0}
                onChange={e => setDraft(prev => prev ? { ...prev, percentualConclusaoAtual: Number(e.target.value) } : prev)}
                className="w-full accent-orange-500 cursor-pointer"
              />

              <div className="w-full bg-orange-200/60 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${draft.percentualConclusaoAtual || 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Cronograma */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Previsão de Conclusão
            </label>
            <input
              type="date"
              value={draft.previsaoConclusao}
              onChange={e => setDraft(prev => prev ? { ...prev, previsaoConclusao: e.target.value } : prev)}
              className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Footer do Modal */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Obra
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                  isRetomada
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Salvar Obra
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
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

  // Estados dos Modais de Ação e Obra
  const [isAcaoModalOpen, setIsAcaoModalOpen] = useState(false);
  const [editingAcao, setEditingAcao] = useState<AcaoUnidade | null>(null);

  const [isObraModalOpen, setIsObraModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<ObraConstrucao | null>(null);

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

  // ─── Handlers de Modal: Ações em Unidades ─────────────────────
  const openNewAcaoModal = (tipo: 'adaptacao' | 'ampliacao' = 'adaptacao') => {
    const firstUnit = mockUnidades[0];
    const initialSala = tipo === 'adaptacao' && firstUnit?.salas?.[0] ? firstUnit.salas[0].id : '';
    setEditingAcao({
      id: `au${Date.now()}`,
      tipo,
      unidadeId: firstUnit?.id || '',
      salaId: initialSala,
      modeloCrecheId: modelos[0]?.id || '',
      descricao: tipo === 'adaptacao' ? 'Reordenamento de espaço para creche' : 'Construção de nova sala de atendimento',
      etapaDestino: 'Jardim I',
      capacidadeAnterior: 0,
      novaCapacidade: 16,
      fonteFinanciamento: 'Recurso Próprio',
      custoPorSala: 0,
      previsaoConclusao: '2026-12-31',
      desembolsoPorAno: [{ ano: periodoInicio, valor: 0, fonte: 'Recurso Próprio' }],
    });
    setIsAcaoModalOpen(true);
  };

  const openEditAcaoModal = (acao: AcaoUnidade) => {
    setEditingAcao({ ...acao });
    setIsAcaoModalOpen(true);
  };

  const duplicateAcao = (acao: AcaoUnidade) => {
    const nova: AcaoUnidade = {
      ...acao,
      id: `au${Date.now()}`,
      descricao: acao.descricao ? `${acao.descricao} (Cópia)` : '',
    };
    setAcoes(prev => [...prev, nova]);
  };

  const removeAcao = (id: string) => setAcoes(a => a.filter(x => x.id !== id));
  const addAcao = () => openNewAcaoModal('adaptacao');

  const saveAcaoModal = (saved?: AcaoUnidade) => {
    const item = saved || editingAcao;
    if (!item) return;
    if (!item.unidadeId) {
      alert("Por favor, selecione a unidade escolar.");
      return;
    }
    setAcoes(prev => {
      const exists = prev.some(a => a.id === item.id);
      if (exists) {
        return prev.map(a => a.id === item.id ? item : a);
      }
      return [...prev, item];
    });
    setIsAcaoModalOpen(false);
    setEditingAcao(null);
  };

  // ─── Handlers de Modal: Obras de Construção ────────────────────
  const openNewObraModal = (tipo: 'retomada' | 'nova' = 'retomada') => {
    const defaultModel = modelos[0];
    const custoObj = defaultModel ? calcularCustoCreche(defaultModel, ambientes) : null;
    const inv = custoObj?.investimento || 0;
    setEditingObra({
      id: `ob${Date.now()}`,
      tipo,
      nome: '',
      localizacao: '',
      bairro: '',
      setor: 'Região Central',
      modeloCrecheId: defaultModel?.id || '',
      tipoProjetoFNDE: defaultModel ? (defaultModel.tipoBase as ObraConstrucao['tipoProjetoFNDE']) : 'tipo1',
      numeroDeSalas: 4,
      capacidadeAlunos: 80,
      etapasAtendidas: ['Jardim I', 'Jardim II'],
      desembolsoPorAno: [{ ano: periodoInicio, valor: inv, fonte: fontes[0]?.fonte || 'Recurso Próprio' }],
      previsaoConclusao: '2027-12-31',
      statusObra: tipo === 'retomada' ? 'em_execucao' : 'planejada',
      percentualConclusaoAtual: tipo === 'retomada' ? 50 : 0,
      numeroConvenio: tipo === 'retomada' ? 'MD Calha Norte/2023' : '',
      coordenadas: { lat: -11.4343, lng: -61.4484 }
    });
    setIsObraModalOpen(true);
  };

  const openEditObraModal = (obra: ObraConstrucao) => {
    setEditingObra({ ...obra });
    setIsObraModalOpen(true);
  };

  const duplicateObra = (obra: ObraConstrucao) => {
    const nova: ObraConstrucao = {
      ...obra,
      id: `ob${Date.now()}`,
      nome: obra.nome ? `${obra.nome} (Cópia)` : '',
    };
    setObras(prev => [...prev, nova]);
  };

  const removeObra = (id: string) => setObras(o => o.filter(x => x.id !== id));
  const addObra = () => openNewObraModal('retomada');

  const saveObraModal = (saved?: ObraConstrucao) => {
    const item = saved || editingObra;
    if (!item) return;
    if (!item.nome.trim()) {
      alert("Por favor, preencha o nome da obra.");
      return;
    }
    setObras(prev => {
      const exists = prev.some(o => o.id === item.id);
      if (exists) {
        return prev.map(o => o.id === item.id ? item : o);
      }
      return [...prev, item];
    });
    setIsObraModalOpen(false);
    setEditingObra(null);
  };



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

  const checarValidacaoAbas = () => {
    const etapasValidacao = [
      {
        id: 'dados' as TabId,
        nome: 'Dados Gerais',
        valido: nome.trim().length > 0 && fontes.length > 0,
        detalhes: !nome.trim() ? 'Nome do plano obrigatório' : fontes.length === 0 ? 'Pelo menos 1 fonte de financiamento' : 'Preenchido',
      },
      {
        id: 'equipe' as TabId,
        nome: 'Equipe',
        valido: equipe.length > 0,
        detalhes: equipe.length === 0 ? 'Adicione ao menos 1 membro na equipe' : `${equipe.length} membro(s) cadastrado(s)`,
      },
      {
        id: 'estrategias' as TabId,
        nome: 'Estratégias',
        valido: estrategias.length > 0 && estrategias.some(e => e.viabilidadeTecnica !== null),
        detalhes: !estrategias.some(e => e.viabilidadeTecnica !== null) ? 'Defina a viabilidade de ao menos 1 estratégia' : 'Estratégias avaliadas',
      },
      {
        id: 'acoes-unidades' as TabId,
        nome: 'Ações ou Obras',
        valido: obras.length > 0 || acoes.length > 0,
        detalhes: (obras.length === 0 && acoes.length === 0) ? 'Cadastre ao menos 1 obra ou ação em unidade' : `${obras.length} obra(s) e ${acoes.length} ação(ões)`,
      },
      {
        id: 'desembolso' as TabId,
        nome: 'Desembolso Anual',
        valido: totalDemanda > 0 || (obras.length === 0 && acoes.length === 0),
        detalhes: totalDemanda === 0 && (obras.length > 0 || acoes.length > 0) ? 'Defina valores de desembolso para os anos' : 'Desembolso configurado',
      },
      {
        id: 'pessoal' as TabId,
        nome: 'Quadro de Pessoal',
        valido: pessoal.length > 0,
        detalhes: pessoal.length === 0 ? 'Configure o quadro de pessoal para o plano' : `${pessoal.length} função(ões) adicionada(s)`,
      },
    ];

    const todasValidas = etapasValidacao.every(e => e.valido);
    const pendencias = etapasValidacao.filter(e => !e.valido);

    return { etapasValidacao, todasValidas, pendencias };
  };

  const handleSalvarRascunho = () => {
    if (!nome.trim()) {
      alert("Por favor, preencha ao menos o Nome do Plano para salvá-lo como rascunho.");
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
      status: 'Rascunho',
      descricao: descricao.trim(),
      objetivoEstrategico: objetivo.trim(),
      fontesFinanciamento: fontes,
      responsavelId: equipe.find(e => e.papel === 'aprovador')?.servidorId || equipe[0]?.servidorId || '',
      dataElaboracao: planParaEditar?.dataElaboracao || new Date().toISOString().split('T')[0],
      dataRevisao: new Date().toISOString().split('T')[0],
      dataAprovacao: undefined,
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
    alert("Plano salvo com sucesso como RASCUNHO! Você pode continuar o preenchimento a qualquer momento.");
    onBack();
  };

  const handleSalvarPlano = () => {
    if (!nome.trim()) {
      alert("Por favor, preencha o nome do plano.");
      return;
    }

    const { todasValidas, pendencias } = checarValidacaoAbas();
    if (!todasValidas) {
      alert(`Para criar o plano oficialmente, é necessário preencher todas as etapas obrigatórias:\n- ${pendencias.map(p => p.nome + ': ' + p.detalhes).join('\n- ')}\n\nVocê também pode optar por "Salvar como Rascunho" e finalizar depois.`);
      return;
    }

    const responsavelServidor = mockServidores.find(s => s.id === (equipe.find(e => e.papel === 'aprovador')?.servidorId || equipe[0]?.servidorId));
    const responsavelNome = responsavelServidor ? responsavelServidor.nome : 'Responsável não definido';
    const fontePrincipal = fontes.length > 0 ? fontes[0].fonte : 'Recurso Próprio';

    // Status final quando criado a partir do preenchimento completo
    const statusFinal: ExpansionPlan['status'] = (isEdit && planParaEditar && planParaEditar.status !== 'Rascunho')
      ? planParaEditar.status
      : 'Planejamento';

    const planData: ExpansionPlan = {
      id: isEdit && planId ? planId : `p-${Date.now()}`,
      nome: nome.trim(),
      periodoInicio,
      periodoFim,
      status: statusFinal,
      descricao: descricao.trim(),
      objetivoEstrategico: objetivo.trim(),
      fontesFinanciamento: fontes,
      responsavelId: equipe.find(e => e.papel === 'aprovador')?.servidorId || equipe[0]?.servidorId || '',
      dataElaboracao: planParaEditar?.dataElaboracao || new Date().toISOString().split('T')[0],
      dataRevisao: new Date().toISOString().split('T')[0],
      dataAprovacao: statusFinal === 'Concluído' ? new Date().toISOString().split('T')[0] : planParaEditar?.dataAprovacao,
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
    alert(isEdit && planParaEditar?.status !== 'Rascunho' 
      ? "Plano atualizado com sucesso!" 
      : "Plano CRIADO com sucesso! O plano agora está em Planejamento e pronto para iniciar sua execução.");
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
  const groups: TabGroup[] = ['planejamento'];

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
              <p className="text-blue-200 text-xs mt-0.5">8 etapas do planejamento</p>
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
                        {gm.label}
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
                            ? 'bg-blue-600 text-white shadow-md'
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

                    {(group as string) !== 'resultado' && <div className="border-b border-slate-100 mt-2 mb-1" />}
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
            {activeTab === 'projecao-orcamentaria' && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-2 text-emerald-800 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className='font-semibold'>Etapa Final:</span> Projeção orçamentária consolidada e validação para criação do plano.
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
                        {(() => {
                          const statusExibido = (isEdit && planParaEditar && planParaEditar.status !== 'Rascunho')
                            ? (planParaEditar.status || statusCalculado)
                            : 'Rascunho';
                          return (
                            <span className={`px-3 py-1.5 rounded-full text-sm font-bold border ${
                              statusExibido === 'Rascunho' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                              statusExibido === 'Em execução' ? 'bg-green-100 text-green-700 border-green-200' :
                              statusExibido === 'Planejamento' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              statusExibido === 'Paralisado' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-purple-100 text-purple-700 border-purple-200'
                            }`}>
                              {statusExibido}
                            </span>
                          );
                        })()}
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
                  {/* Cabeçalho */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                          <Layers className="w-5 h-5" />
                        </span>
                        <h2 className="text-2xl font-bold text-slate-800">Ações em Unidades Existentes</h2>
                      </div>
                      <p className="text-slate-500 text-sm">
                        Adaptação (reordenamento de espaços existentes) e Ampliação (novas salas em unidades existentes)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openNewAcaoModal('adaptacao')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow"
                      >
                        <Plus className="w-4 h-4" />
                        + Nova Adaptação
                      </button>
                      <button
                        onClick={() => openNewAcaoModal('ampliacao')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm hover:shadow"
                      >
                        <Plus className="w-4 h-4" />
                        + Nova Ampliação
                      </button>
                    </div>
                  </div>

                  {/* Ribbon de Métricas / KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50/40 border border-purple-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-200">
                        <Layers className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">Adaptações</div>
                        <div className="text-2xl font-black text-purple-900">
                          {acoes.filter(a => a.tipo === 'adaptacao').length}
                        </div>
                        <div className="text-[11px] text-purple-600 font-medium">Reordenamento de salas</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50/40 border border-blue-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Ampliações</div>
                        <div className="text-2xl font-black text-blue-900">
                          {acoes.filter(a => a.tipo === 'ampliacao').length}
                        </div>
                        <div className="text-[11px] text-blue-600 font-medium">Novas salas construídas</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-green-50/40 border border-emerald-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Novas Vagas</div>
                        <div className="text-2xl font-black text-emerald-900">
                          +{acoes.reduce((s, a) => s + Math.max(0, a.novaCapacidade - a.capacidadeAnterior), 0)}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium">Capacidade adicional</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-slate-300">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Investimento Previsto</div>
                        <div className="text-xl font-black text-slate-800">
                          {BRL(acoes.reduce((s, a) => s + (a.custoPorSala || 0), 0))}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">Custo total das ações</div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Filtros */}
                  <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg">
                      <button
                        onClick={() => setFiltroTipoAcao('todas')}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                          filtroTipoAcao === 'todas'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Todas as Ações ({acoes.length})
                      </button>
                      <button
                        onClick={() => setFiltroTipoAcao('adaptacao')}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                          filtroTipoAcao === 'adaptacao'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-purple-700 hover:bg-purple-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                        Apenas Adaptações ({acoes.filter(a => a.tipo === 'adaptacao').length})
                      </button>
                      <button
                        onClick={() => setFiltroTipoAcao('ampliacao')}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                          filtroTipoAcao === 'ampliacao'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                        Apenas Ampliações ({acoes.filter(a => a.tipo === 'ampliacao').length})
                      </button>
                    </div>
                  </div>

                  {/* Listagem de Cards das Ações */}
                  {acoes.filter(a => filtroTipoAcao === 'todas' || a.tipo === filtroTipoAcao).length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                        <Layers className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhuma ação cadastrada</h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                        Adicione ações de adaptação de espaços ou construção de novas salas para expandir as vagas das unidades.
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => openNewAcaoModal('adaptacao')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
                        >
                          + Criar Adaptação
                        </button>
                        <button
                          onClick={() => openNewAcaoModal('ampliacao')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          + Criar Ampliação
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {acoes
                        .filter(a => filtroTipoAcao === 'todas' || a.tipo === filtroTipoAcao)
                        .map(acao => {
                          const unidade = mockUnidades.find(u => u.id === acao.unidadeId);
                          const isAdapt = acao.tipo === 'adaptacao';
                          const salas = unidade?.salas ?? [];
                          const temCreche = salas.some(s => s.tipoAtual === 'Creche');
                          const temEF = salas.some(s => s.tipoAtual === 'Ensino Fundamental');
                          const tipoUnidade = !unidade ? null
                            : unidade.totalVagas === 0 && !temCreche ? 'EMEF (sem EI)'
                              : temCreche && temEF ? 'EMEI/EMEF (mista)'
                                : temCreche ? 'Creche / EMEI'
                                  : 'EMEF';

                          // Modelo e ambiente
                          const modeloAmpliacao = modelos.find(m => m.id === acao.modeloCrecheId);
                          const ambientesAmpliacao: ModeloAmbiente[] = modeloAmpliacao
                            ? modeloAmpliacao.ambientes
                              .map(mca => ambientes.find(ma => ma.id === mca.modeloAmbienteId))
                              .filter((ma): ma is NonNullable<typeof ma> => !!ma)
                            : [];
                          const ambienteSelecionado = ambientesAmpliacao.find(ma => ma.id === acao.salaId);
                          const novasVagasLiquidas = Math.max(0, acao.novaCapacidade - (acao.capacidadeAnterior || 0));

                          return (
                            <div
                              key={acao.id}
                              className={`bg-white rounded-2xl border-2 transition-all shadow-sm hover:shadow-md overflow-hidden ${
                                isAdapt
                                  ? 'border-purple-200/90 hover:border-purple-300'
                                  : 'border-blue-200/90 hover:border-blue-300'
                              }`}
                            >
                              {/* Barra de Topo do Card */}
                              <div
                                className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                                  isAdapt
                                    ? 'bg-purple-50/70 border-purple-100'
                                    : 'bg-blue-50/70 border-blue-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                                      isAdapt
                                        ? 'bg-purple-600 text-white border-purple-600'
                                        : 'bg-blue-600 text-white border-blue-600'
                                    }`}
                                  >
                                    {isAdapt ? (
                                      <>
                                        <Layers className="w-3.5 h-3.5" />
                                        Adaptação (Reordenamento)
                                      </>
                                    ) : (
                                      <>
                                        <Building2 className="w-3.5 h-3.5" />
                                        Ampliação de Salas
                                      </>
                                    )}
                                  </span>

                                  {tipoUnidade && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 shadow-xs">
                                      {tipoUnidade}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEditAcaoModal(acao)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                                      isAdapt
                                        ? 'bg-white text-purple-700 border-purple-200 hover:bg-purple-600 hover:text-white'
                                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-600 hover:text-white'
                                    }`}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => duplicateAcao(acao)}
                                    title="Duplicar Ação"
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removeAcao(acao.id)}
                                    title="Excluir Ação"
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Corpo do Card */}
                              <div className="p-5 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <School className="w-4 h-4 text-slate-400" />
                                      <h4 className="text-base font-bold text-slate-900">
                                        {unidade?.nome || 'Unidade não selecionada'}
                                      </h4>
                                    </div>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                      {unidade?.bairro ? `${unidade.bairro} — ${unidade.setor || ''}` : 'Localização a definir'}
                                      {unidade?.totalVagas ? ` · Capacidade atual: ${unidade.totalVagas} vagas` : ''}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                      +{novasVagasLiquidas} novas vagas
                                    </span>
                                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                                      {acao.etapaDestino}
                                    </span>
                                  </div>
                                </div>

                                {/* Descrição da Ação */}
                                <div
                                  className={`p-3.5 rounded-xl border text-sm ${
                                    isAdapt
                                      ? 'bg-purple-50/40 border-purple-200/80 text-purple-950'
                                      : 'bg-blue-50/40 border-blue-200/80 text-blue-950'
                                  }`}
                                >
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    {isAdapt ? 'Descrição do Reordenamento' : 'Especificação da Ampliação'}
                                  </div>
                                  <div className="font-medium">
                                    {acao.descricao || (isAdapt ? 'Reordenamento de espaço existente' : 'Construção de nova sala')}
                                  </div>
                                </div>

                                {/* Metadados em Grade */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Modelo de Creche</span>
                                    <span className="font-bold text-slate-700 truncate block">
                                      {modelos.find(m => m.id === acao.modeloCrecheId)?.nome || 'Padrão / Não definido'}
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Ambiente de Referência</span>
                                    <span className="font-bold text-slate-700 truncate block">
                                      {ambienteSelecionado?.nome || (isAdapt && acao.salaId ? `Sala ${acao.salaId}` : 'Geral')}
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Custo Estimado</span>
                                    <span className="font-black text-emerald-700 block">
                                      {acao.custoPorSala > 0 ? BRL(acao.custoPorSala) : 'Sem custo direto'}
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Previsão Conclusão</span>
                                    <span className="font-bold text-slate-700 flex items-center gap-1 block">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      {acao.previsaoConclusao
                                        ? new Date(acao.previsaoConclusao + 'T00:00:00').toLocaleDateString('pt-BR')
                                        : 'A definir'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ ABA 4 — OBRAS ═══════════════════════════════════════ */}
              {activeTab === 'obras' && (
                <div className="space-y-6">
                  {/* Cabeçalho */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                          <RotateCcw className="w-5 h-5" />
                        </span>
                        <h2 className="text-2xl font-bold text-slate-800">Obras de Construção</h2>
                      </div>
                      <p className="text-slate-500 text-sm">
                        Retomada de obras em andamento/paralisadas e novas construções de creches municipais
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openNewObraModal('retomada')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm hover:shadow"
                      >
                        <Plus className="w-4 h-4" />
                        + Nova Retomada
                      </button>
                      <button
                        onClick={() => openNewObraModal('nova')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm hover:shadow"
                      >
                        <Plus className="w-4 h-4" />
                        + Nova Obra
                      </button>
                    </div>
                  </div>

                  {/* Ribbon de Métricas / KPIs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50/40 border border-orange-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-200">
                        <RotateCcw className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-orange-700 uppercase tracking-wider">Retomadas</div>
                        <div className="text-2xl font-black text-orange-900">
                          {obras.filter(o => o.tipo === 'retomada').length}
                        </div>
                        <div className="text-[11px] text-orange-600 font-medium">Obras em andamento</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-200">
                        <HardHat className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Novas Obras</div>
                        <div className="text-2xl font-black text-emerald-900">
                          {obras.filter(o => o.tipo === 'nova').length}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium">Novas creches projetadas</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-200">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total de Salas</div>
                        <div className="text-2xl font-black text-blue-900">
                          {obras.reduce((s, o) => s + (o.numeroDeSalas || 0), 0)} salas
                        </div>
                        <div className="text-[11px] text-blue-600 font-medium">
                          {obras.reduce((s, o) => s + (o.capacidadeAlunos || 0), 0)} vagas estimadas
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-slate-300">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Investimento Obras</div>
                        <div className="text-xl font-black text-slate-800">
                          {BRL(obras.reduce((s, o) => s + calcularCustoObraTotal(o, modelos, ambientes).total, 0))}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">Orçamento estimado</div>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Filtros */}
                  <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg">
                      <button
                        onClick={() => setFiltroTipoObra('todas')}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                          filtroTipoObra === 'todas'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Todas as Obras ({obras.length})
                      </button>
                      <button
                        onClick={() => setFiltroTipoObra('retomada')}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                          filtroTipoObra === 'retomada'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-orange-700 hover:bg-orange-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                        Apenas Retomadas ({obras.filter(o => o.tipo === 'retomada').length})
                      </button>
                      <button
                        onClick={() => setFiltroTipoObra('nova')}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                          filtroTipoObra === 'nova'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                        Apenas Novas Obras ({obras.filter(o => o.tipo === 'nova').length})
                      </button>
                    </div>
                  </div>

                  {/* Listagem de Cards das Obras */}
                  {obras.filter(o => filtroTipoObra === 'todas' || o.tipo === filtroTipoObra).length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                        <HardHat className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhuma obra cadastrada</h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                        Cadastre obras a serem retomadas ou novas construções de creches para o plano municipal.
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => openNewObraModal('retomada')}
                          className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                        >
                          + Criar Retomada
                        </button>
                        <button
                          onClick={() => openNewObraModal('nova')}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          + Criar Nova Obra
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {obras
                        .filter(o => filtroTipoObra === 'todas' || o.tipo === filtroTipoObra)
                        .map(obra => {
                          const isRetomada = obra.tipo === 'retomada';
                          const cc = calcularCustoObraTotal(obra, modelos, ambientes);
                          const pct = obra.percentualConclusaoAtual || 0;

                          const statusColors: Record<string, string> = {
                            planejada: 'bg-slate-100 text-slate-700 border-slate-200',
                            licitacao: 'bg-blue-50 text-blue-700 border-blue-200',
                            em_execucao: 'bg-amber-50 text-amber-700 border-amber-200',
                            concluida: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            paralisada: 'bg-red-50 text-red-700 border-red-200',
                          };
                          const statusLabels: Record<string, string> = {
                            planejada: 'Planejada',
                            licitacao: 'Em Licitação',
                            em_execucao: 'Em Execução',
                            concluida: 'Concluída',
                            paralisada: 'Paralisada',
                          };

                          return (
                            <div
                              key={obra.id}
                              className={`bg-white rounded-2xl border-2 transition-all shadow-sm hover:shadow-md overflow-hidden ${
                                isRetomada
                                  ? 'border-orange-200/90 hover:border-orange-300'
                                  : 'border-emerald-200/90 hover:border-emerald-300'
                              }`}
                            >
                              {/* Topo do Card */}
                              <div
                                className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b ${
                                  isRetomada
                                    ? 'bg-orange-50/70 border-orange-100'
                                    : 'bg-emerald-50/70 border-emerald-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                                      isRetomada
                                        ? 'bg-orange-500 text-white border-orange-500'
                                        : 'bg-emerald-600 text-white border-emerald-600'
                                    }`}
                                  >
                                    {isRetomada ? (
                                      <>
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Retomada de Obra
                                      </>
                                    ) : (
                                      <>
                                        <HardHat className="w-3.5 h-3.5" />
                                        Nova Construção
                                      </>
                                    )}
                                  </span>

                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${
                                      statusColors[obra.statusObra || 'planejada'] || statusColors.planejada
                                    }`}
                                  >
                                    {statusLabels[obra.statusObra || 'planejada'] || 'Planejada'}
                                  </span>

                                  {obra.numeroConvenio && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white text-slate-600 border border-slate-200 shadow-xs">
                                      Convênio: {obra.numeroConvenio}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEditObraModal(obra)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                                      isRetomada
                                        ? 'bg-white text-orange-600 border-orange-200 hover:bg-orange-500 hover:text-white'
                                        : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                                    }`}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => duplicateObra(obra)}
                                    title="Duplicar Obra"
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removeObra(obra.id)}
                                    title="Excluir Obra"
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Corpo do Card */}
                              <div className="p-5 space-y-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                  <div>
                                    <h4 className="text-base font-bold text-slate-900">
                                      {obra.nome || 'Obra sem nome'}
                                    </h4>
                                    <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                        {obra.bairro || obra.localizacao || 'Localização a definir'}
                                      </span>
                                      {obra.coordenadas?.lat && obra.coordenadas?.lng && (
                                        <span className="text-slate-400 font-mono text-[11px]">
                                          ({obra.coordenadas.lat.toFixed(4)}, {obra.coordenadas.lng.toFixed(4)})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-xs text-slate-400 block">Custo Total Estimado</span>
                                    <span className="text-lg font-black text-blue-700 block">
                                      {cc.total > 0 ? BRL(Math.round(cc.total)) : '—'}
                                    </span>
                                  </div>
                                </div>

                                {/* Barra de Progresso Especial para Retomada */}
                                {isRetomada && (
                                  <div className="bg-orange-50/60 border border-orange-200/80 rounded-xl p-3.5 space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-bold text-orange-900 flex items-center gap-1.5">
                                        <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                                        Progresso Físico da Obra
                                      </span>
                                      <span className="font-black text-orange-700 bg-white px-2 py-0.5 rounded-full border border-orange-200">
                                        {pct}% concluída
                                      </span>
                                    </div>
                                    <div className="w-full bg-orange-200/60 rounded-full h-2.5 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Informações em Grade */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Modelo de Referência</span>
                                    <span className="font-bold text-slate-700 truncate block">
                                      {modelos.find(m => m.id === obra.modeloCrecheId)?.nome || 'Padrão / Próprio'}
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Dimensionamento</span>
                                    <span className="font-bold text-slate-700 block">
                                      {obra.numeroDeSalas || 0} salas · {obra.capacidadeAlunos || 0} vagas
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Custo por Sala</span>
                                    <span className="font-bold text-slate-700 block">
                                      {cc.costPerSala > 0 ? BRL(Math.round(cc.costPerSala)) : '—'}
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-400 block text-[11px]">Previsão Conclusão</span>
                                    <span className="font-bold text-slate-700 flex items-center gap-1 block">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      {obra.previsaoConclusao
                                        ? new Date(obra.previsaoConclusao + 'T00:00:00').toLocaleDateString('pt-BR')
                                        : 'A definir'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
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

              {/* ═══ ABA 7 — PROJEÇÃO ORÇAMENTÁRIA ═════════════════════ */}
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

                      {/* Status de Prontidão e Preenchimento das Abas */}
                      {(() => {
                        const { etapasValidacao, todasValidas, pendencias } = checarValidacaoAbas();
                        return (
                          <div className={`rounded-2xl p-6 border shadow-sm mt-6 ${todasValidas ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-200'}`}>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {todasValidas ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                  )}
                                  <h3 className={`text-lg font-bold ${todasValidas ? 'text-emerald-900' : 'text-amber-900'}`}>
                                    {todasValidas ? 'Todas as Etapas Preenchidas — Pronto para Criação' : 'Etapas Pendentes para Criação Oficial do Plano'}
                                  </h3>
                                </div>
                                <p className={`text-sm ${todasValidas ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {todasValidas 
                                    ? 'Todas as seções do plano foram preenchidas! Clique no botão verde "Salvar Plano" no rodapé para criar oficialmente o plano com status de Planejamento.' 
                                    : 'Para que o plano seja oficialmente CRIADO, todas as etapas de planejamento devem ser preenchidas. Você pode salvar como rascunho agora ou clicar nas etapas pendentes abaixo para completá-las.'}
                                </p>
                              </div>
                              
                              {!todasValidas && (
                                <button
                                  type="button"
                                  onClick={handleSalvarRascunho}
                                  className="self-start md:self-auto flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow transition-colors shrink-0"
                                >
                                  <Save className="w-4 h-4" />
                                  Salvar como Rascunho
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {etapasValidacao.map(item => (
                                <div
                                  key={item.id}
                                  className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                                    item.valido 
                                      ? 'bg-white border-emerald-200 text-slate-700' 
                                      : 'bg-white border-amber-300 text-slate-700 hover:border-amber-400 cursor-pointer shadow-sm'
                                  }`}
                                  onClick={() => { if (!item.valido) setActiveTab(item.id); }}
                                >
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-bold text-sm text-slate-800">{item.nome}</span>
                                      {item.valido ? (
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OK</span>
                                      ) : (
                                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pendente</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 leading-tight truncate">{item.detalhes}</p>
                                  </div>
                                  {!item.valido && (
                                    <span className="text-xs font-semibold text-blue-600 hover:underline shrink-0 self-center">
                                      Ir →
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Alertas e observações */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                        <strong>💡 Observação:</strong> Os valores de vagas e salas são exibidos no ano em que o investimento está previsto. O total considera a capacidade acumulada de todas as metas.
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-7 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors text-sm">
                <X className="w-4 h-4" /> Cancelar
              </button>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Salvar como Rascunho sempre disponível para salvar preenchimentos parciais */}
                <button
                  type="button"
                  onClick={handleSalvarRascunho}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors shadow text-sm"
                  title="Salvar progresso atual como Rascunho"
                >
                  <Save className="w-4 h-4" />
                  Salvar como Rascunho
                </button>

                {currentIdx > 0 && (
                  <button onClick={() => setActiveTab(TABS[currentIdx - 1].id)} className="flex items-center gap-2 px-4 py-2.5 text-slate-700 border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors text-sm">
                    ← Anterior
                  </button>
                )}

                {/* Na última aba (Projeção Orçamentária): Botão Salvar Plano (CRIAR) */}
                {activeTab === 'projecao-orcamentaria' ? (
                  <button
                    type="button"
                    onClick={handleSalvarPlano}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isEdit && planParaEditar?.status !== 'Rascunho' ? 'Salvar Alterações' : 'Salvar Plano'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab(TABS[currentIdx + 1].id)}
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

      {/* ─── MODAL DE AÇÕES (Adaptação / Ampliação) ─── */}
      <ModalAcao
        isOpen={isAcaoModalOpen}
        acao={editingAcao}
        onClose={() => {
          setIsAcaoModalOpen(false);
          setEditingAcao(null);
        }}
        onSave={saveAcaoModal}
        onDelete={editingAcao && acoes.some(a => a.id === editingAcao.id) ? () => {
          if (confirm("Deseja realmente excluir esta ação?")) {
            removeAcao(editingAcao.id);
            setIsAcaoModalOpen(false);
            setEditingAcao(null);
          }
        } : undefined}
        modelos={modelos}
        ambientes={ambientes}
      />

      {/* ─── MODAL DE OBRAS (Retomada / Nova Obra) ─── */}
      <ModalObra
        isOpen={isObraModalOpen}
        obra={editingObra}
        onClose={() => {
          setIsObraModalOpen(false);
          setEditingObra(null);
        }}
        onSave={saveObraModal}
        onDelete={editingObra && obras.some(o => o.id === editingObra.id) ? () => {
          if (confirm("Deseja realmente excluir esta obra?")) {
            removeObra(editingObra.id);
            setIsObraModalOpen(false);
            setEditingObra(null);
          }
        } : undefined}
        modelos={modelos}
        ambientes={ambientes}
        fontes={fontes}
        periodoInicio={periodoInicio}
      />
    </div>
  );
}
