import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  Plus,
  Search,
  Filter,
  Calculator,
  Calendar,
  Building2,
  FileText,
  Copy,
  Trash2,
  Edit3,
  Layers,
  DollarSign,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExpansionPlan, PlanoCusteio, StatusPlanoCusteio } from './types';
import {
  loadExpansionPlans,
  loadPlanosCusteio,
  upsertPlanoCusteio,
  deletePlanoCusteio,
} from './utils/custeioMigration';
import {
  criarNovoPlanoCusteioAutomatico,
  extrairIntervencoesDoPlano,
  loadCatalogosCusteio,
  formatYMDisplay,
  calcularProjecaoPlanoCusteio,
} from './utils/custeioCalculator';
import PlanoCusteioWorkspace, { WorkspaceTabId } from './PlanoCusteioWorkspace';
import { FieldTooltip, CusteioConfirmModal } from './components/FieldTooltip';

export interface PlanoCusteioNavigationOptions {
  planoCusteioId?: string;
  planoExpansaoId?: string;
  initialTab?: WorkspaceTabId;
  openCreateModal?: boolean;
}

interface CusteioSimulacaoProps {
  onBack: () => void;
  onNavigate?: (view: string, payload?: any) => void;
  initialOptions?: PlanoCusteioNavigationOptions;
}

const BRL0 = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v || 0);

const statusBadgeCls: Record<StatusPlanoCusteio, string> = {
  Rascunho: 'bg-amber-100 text-amber-800 border-amber-300',
  'Em Análise': 'bg-blue-100 text-blue-800 border-blue-300',
  Aprovado: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Arquivado: 'bg-slate-200 text-slate-700 border-slate-300',
};

export default function CusteioSimulacao({
  onBack,
  onNavigate,
  initialOptions,
}: CusteioSimulacaoProps) {
  const [expansionPlans] = useState<ExpansionPlan[]>(() => loadExpansionPlans());
  const [planosCusteio, setPlanosCusteio] = useState<PlanoCusteio[]>(() =>
    loadPlanosCusteio()
  );

  const [selectedPlanoId, setSelectedPlanoId] = useState<string | null>(
    initialOptions?.planoCusteioId || null
  );
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTabId>(
    initialOptions?.initialTab || 'visao-geral'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterExpansaoId, setFilterExpansaoId] = useState<string>(
    initialOptions?.planoExpansaoId || 'todos'
  );
  const [filterStatus, setFilterStatus] = useState<StatusPlanoCusteio | 'Todos'>('Todos');

  // Confirmação de exclusão no padrão do sistema
  const [planoParaExcluir, setPlanoParaExcluir] = useState<PlanoCusteio | null>(null);

  // Estado do Modal de Criação de Novo Plano de Custeio
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(
    Boolean(initialOptions?.openCreateModal)
  );
  const defaultExpPlan =
    expansionPlans.find(p => p.id === initialOptions?.planoExpansaoId) ||
    expansionPlans[0];

  const [novoExpansaoId, setNovoExpansaoId] = useState<string>(
    defaultExpPlan?.id || ''
  );
  const [novoNome, setNovoNome] = useState<string>(
    defaultExpPlan
      ? `Plano de Custeio — ${defaultExpPlan.nome || defaultExpPlan.name}`
      : 'Novo Plano de Custeio'
  );
  const [novoCenario, setNovoCenario] = useState<string>('Cenário Base');
  const [novoDescricao, setNovoDescricao] = useState<string>(
    'Planejamento financeiro de funcionamento, manutenção, aquisições e folha de pagamento das intervenções previstas.'
  );
  const [novoDataInicio, setNovoDataInicio] = useState<string>(
    defaultExpPlan ? `${(defaultExpPlan.periodoInicio || 2026) + 1}-01` : '2027-01'
  );
  const [novoDataFim, setNovoDataFim] = useState<string>(
    defaultExpPlan ? `${(defaultExpPlan.periodoFim || 2029) + 1}-12` : '2030-12'
  );
  const [novoResponsavel, setNovoResponsavel] = useState<string>(
    defaultExpPlan?.responsible || 'Equipe Técnica SEMED'
  );

  useEffect(() => {
    if (initialOptions?.planoCusteioId) {
      setSelectedPlanoId(initialOptions.planoCusteioId);
      setWorkspaceTab(initialOptions.initialTab || 'visao-geral');
    }
  }, [initialOptions]);

  const catalogos = useMemo(() => loadCatalogosCusteio(), []);

  // Preview das intervenções ao selecionar Plano de Expansão no modal de criação
  const previewIntervencoes = useMemo(() => {
    const plan = expansionPlans.find(p => p.id === novoExpansaoId);
    if (!plan) return [];
    return extrairIntervencoesDoPlano(plan, catalogos, novoDataInicio);
  }, [expansionPlans, novoExpansaoId, catalogos, novoDataInicio]);

  const handleSelectExpansionInModal = (expId: string) => {
    setNovoExpansaoId(expId);
    const found = expansionPlans.find(p => p.id === expId);
    if (found) {
      const existingCount = planosCusteio.filter(pc => pc.planoExpansaoId === expId).length;
      setNovoNome(
        existingCount === 0
          ? `Plano de Custeio — ${found.nome || found.name}`
          : `Plano de Custeio (${existingCount + 1}) — ${found.nome || found.name}`
      );
      setNovoCenario(existingCount === 0 ? 'Cenário Base' : `Cenário Alternativo ${existingCount + 1}`);
      setNovoDataInicio(`${(found.periodoInicio || 2026) + 1}-01`);
      setNovoDataFim(`${(found.periodoFim || 2029) + 1}-12`);
      setNovoResponsavel(found.responsible || 'Equipe Técnica SEMED');
    }
  };

  const handleConfirmCreate = () => {
    const expPlan = expansionPlans.find(p => p.id === novoExpansaoId);
    if (!expPlan) {
      toast.error('Selecione um Plano de Expansão válido.');
      return;
    }
    if (!novoNome.trim()) {
      toast.error('Informe o nome do Plano de Custeio.');
      return;
    }
    if (novoDataInicio > novoDataFim) {
      toast.error('A data de início deve ser anterior ou igual à data de término.');
      return;
    }

    const criado = criarNovoPlanoCusteioAutomatico({
      planoExpansao: expPlan,
      nome: novoNome.trim(),
      descricao: novoDescricao.trim(),
      cenarioLabel: novoCenario.trim() || 'Cenário Base',
      dataInicio: novoDataInicio,
      dataFim: novoDataFim,
      responsavelNome: novoResponsavel.trim() || 'Equipe Técnica SEMED',
    });

    const updated = upsertPlanoCusteio(criado);
    setPlanosCusteio(updated);
    setIsCreateOpen(false);
    setWorkspaceTab('visao-geral');
    setSelectedPlanoId(criado.id);
    toast.success('Plano de Custeio gerado com estimativa proporcional inicial!');
  };

  const handleDuplicatePlano = (pc: PlanoCusteio) => {
    const copia: PlanoCusteio = {
      ...JSON.parse(JSON.stringify(pc)),
      id: `pc-${Date.now()}`,
      nome: `${pc.nome} (Cópia)`,
      cenarioLabel: `${pc.cenarioLabel} — Simulação`,
      status: 'Rascunho',
      versao: 1,
      dataCriacao: new Date().toISOString().split('T')[0],
      dataAtualizacao: new Date().toISOString().split('T')[0],
    };
    const updated = upsertPlanoCusteio(copia);
    setPlanosCusteio(updated);
    toast.success(`Cenário "${copia.nome}" duplicado com sucesso!`);
  };

  const handleQuickStatusChange = (pc: PlanoCusteio, novoStatus: StatusPlanoCusteio) => {
    if (pc.status === novoStatus) return;
    const atualizado: PlanoCusteio = {
      ...pc,
      status: novoStatus,
      dataAtualizacao: new Date().toISOString().split('T')[0],
    };
    const updated = upsertPlanoCusteio(atualizado);
    setPlanosCusteio(updated);
    toast.success(`Status alterado para "${novoStatus}".`);
  };

  const confirmDelete = () => {
    if (!planoParaExcluir) return;
    const nome = planoParaExcluir.nome;
    const updated = deletePlanoCusteio(planoParaExcluir.id);
    setPlanosCusteio(updated);
    setPlanoParaExcluir(null);
    toast.success(`Plano de Custeio "${nome}" excluído com sucesso.`);
  };

  // Se um Plano de Custeio está aberto no Workspace, renderizá-lo
  const planoAberto = planosCusteio.find(p => p.id === selectedPlanoId);
  if (planoAberto) {
    const expVinculado = expansionPlans.find(e => e.id === planoAberto.planoExpansaoId);
    return (
      <PlanoCusteioWorkspace
        planoInicial={planoAberto}
        planoExpansao={expVinculado}
        initialTab={workspaceTab}
        onSave={atualizado => {
          const updated = upsertPlanoCusteio(atualizado);
          setPlanosCusteio(updated);
        }}
        onBack={() => setSelectedPlanoId(null)}
      />
    );
  }

  // Filtragem da listagem
  const planosFiltrados = planosCusteio.filter(pc => {
    const matchBusca =
      pc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.cenarioLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchExp =
      filterExpansaoId === 'todos' || pc.planoExpansaoId === filterExpansaoId;
    const matchStatus = filterStatus === 'Todos' || pc.status === filterStatus;
    return matchBusca && matchExp && matchStatus;
  });

  const totalAprovados = planosCusteio.filter(p => p.status === 'Aprovado').length;
  const somaRegimeAprovados = planosCusteio
    .filter(p => p.status === 'Aprovado' || planosCusteio.length === 1)
    .reduce((acc, pc) => {
      const proj = calcularProjecaoPlanoCusteio(
        pc.dataInicio,
        pc.dataFim,
        pc.intervencoes,
        pc.servicos,
        pc.aquisicoes,
        pc.pessoal,
        pc.parametrosSimulacao,
        pc.resumoFinanceiro?.totalInicialAutomatico
      );
      return acc + proj.resumoFinanceiro.custoAnualRegimePleno;
    }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-3 text-sm font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a3a5c] to-[#2563eb] text-white flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                  Planos de Custeio
                </h1>
                <p className="text-slate-500 text-sm">
                  Planejamento financeiro de funcionamento, aquisições e folha de pagamento vinculado aos Planos de Expansão
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('configuracoes-custo')}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors shadow-2xs"
                >
                  Catálogos & Modelos Base
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Plano de Custeio
              </button>
            </div>
          </div>
        </div>

        {/* KPIs Consolidados no padrão de cards brancos com ícones coloridos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <span>Cenários de Custeio</span>
                <FieldTooltip
                  title="Planos de Custeio Cadastrados"
                  text="Quantidade total de cenários financeiros criados para planejar o funcionamento das unidades escolares contempladas nos Planos de Expansão."
                />
              </div>
              <div className="text-3xl font-black text-slate-800 mt-1">
                {planosCusteio.length}
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-1">
                {totalAprovados} cenário(s) aprovado(s)
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <span>Vínculo com Expansão</span>
                <FieldTooltip
                  title="Relação 1:N com Planos de Expansão"
                  text="Um mesmo Plano de Expansão físico pode ter múltiplos Planos de Custeio (ex.: Cenário Base, Cenário Otimizado ou horizontes plurianuais distintos)."
                />
              </div>
              <div className="text-3xl font-black text-blue-700 mt-1">
                {new Set(planosCusteio.map(p => p.planoExpansaoId)).size} / {expansionPlans.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Planos de Expansão contemplados
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <span>Custo Anual de Regime</span>
                <FieldTooltip
                  title="Custo Anual em Regime Pleno"
                  text="Soma anualizada (12 meses cheios) de Serviços, Aquisições Recorrentes e Folha de Pessoal das unidades em funcionamento pleno, excluindo despesas únicas de implantação."
                  formula="Serviços Anuais + Aq. Recorrentes + Folha (×13,33)"
                />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {BRL0(somaRegimeAprovados)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Referência anual de operação plena
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500">
                <span>Regra Proporcional</span>
                <FieldTooltip
                  title="Escopo Proporcional às Intervenções"
                  text="Novas creches calculam 100% da estrutura do modelo; ampliações e adaptações calculam apenas o incremento de salas, vagas e profissionais, sem duplicar direção ou contratos existentes."
                />
              </div>
              <div className="text-sm font-bold text-slate-800 mt-2">
                Serviços · Aquisições · Pessoal
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Paridade integral com Modelos Base (ANO)
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3.5">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, cenário ou descrição..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filterExpansaoId}
              onChange={e => setFilterExpansaoId(e.target.value)}
              className="px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os Planos de Expansão</option>
              {expansionPlans.map(ep => (
                <option key={ep.id} value={ep.id}>
                  {ep.nome || ep.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as StatusPlanoCusteio | 'Todos')}
                className="pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Rascunho">Rascunho</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Arquivado">Arquivado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Planos de Custeio */}
        <div className="space-y-4">
          {planosFiltrados.map(pc => {
            const expPlan = expansionPlans.find(ep => ep.id === pc.planoExpansaoId);
            const proj = calcularProjecaoPlanoCusteio(
              pc.dataInicio,
              pc.dataFim,
              pc.intervencoes,
              pc.servicos,
              pc.aquisicoes,
              pc.pessoal,
              pc.parametrosSimulacao,
              pc.resumoFinanceiro?.totalInicialAutomatico
            );
            const rf = proj.resumoFinanceiro;
            const qtdCompletas = pc.intervencoes.filter(
              i => i.ativoNoCusteio && i.escopo === 'unidade_completa'
            ).length;
            const qtdIncrementais = pc.intervencoes.filter(
              i => i.ativoNoCusteio && i.escopo === 'incremental'
            ).length;
            const qtdAjustesManuais =
              pc.servicos.filter(i => i.origemCalculo !== 'automatico').length +
              pc.aquisicoes.filter(i => i.origemCalculo !== 'automatico').length +
              pc.pessoal.filter(i => i.origemCalculo !== 'automatico').length;

            return (
              <div
                key={pc.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-800">{pc.nome}</h3>

                        {/* Seletor Rápido de Status no Card (padrão PlanosList) */}
                        <select
                          value={pc.status}
                          onChange={e =>
                            handleQuickStatusChange(pc, e.target.value as StatusPlanoCusteio)
                          }
                          aria-label={`Status do plano ${pc.nome}`}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border cursor-pointer outline-none ${
                            statusBadgeCls[pc.status]
                          }`}
                        >
                          <option value="Rascunho">Rascunho</option>
                          <option value="Em Análise">Em Análise</option>
                          <option value="Aprovado">Aprovado</option>
                          <option value="Arquivado">Arquivado</option>
                        </select>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {pc.cenarioLabel} · v{pc.versao}
                        </span>

                        {qtdAjustesManuais > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Sliders className="w-3 h-3" />
                            {qtdAjustesManuais} ajuste(s) manual(is)
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600">{pc.descricao}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                          <Building2 className="w-3.5 h-3.5" />
                          Plano de Expansão:{' '}
                          {expPlan ? expPlan.nome || expPlan.name : pc.planoExpansaoId}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          Vigência Custeio: {formatYMDisplay(pc.dataInicio)} a{' '}
                          {formatYMDisplay(pc.dataFim)} ({proj.cronogramaMensal.length}m)
                        </span>
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Layers className="w-3.5 h-3.5 text-purple-600" />
                          {qtdCompletas} nova(s) · {qtdIncrementais} incremental(is) · +{rf.totalVagasContempladas} vagas
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setWorkspaceTab('visao-geral');
                          setSelectedPlanoId(pc.id);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Abrir & Simular
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setWorkspaceTab('relatorio');
                          setSelectedPlanoId(pc.id);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Relatório
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicatePlano(pc)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Duplicar como novo cenário"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlanoParaExcluir(pc)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Excluir Plano de Custeio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Resumo Financeiro por Categoria + Regime Pleno + Total Período */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-slate-500">A. Serviços</div>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                        {BRL0(rf.totalServicosPeriodo)}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-slate-500">
                        B.1 Implantação (Única)
                      </div>
                      <div className="text-sm font-extrabold text-amber-700 mt-0.5">
                        {BRL0(rf.totalAquisicoesPontuaisPeriodo)}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-slate-500">
                        B.2 Aq. Recorrentes
                      </div>
                      <div className="text-sm font-extrabold text-emerald-700 mt-0.5">
                        {BRL0(rf.totalAquisicoesRecorrentesPeriodo)}
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                      <div className="text-[11px] font-bold text-slate-500">
                        C. Pessoal ({rf.totalProfissionais} prof.)
                      </div>
                      <div className="text-sm font-extrabold text-purple-700 mt-0.5">
                        {BRL0(rf.totalPessoalPeriodo)}
                      </div>
                    </div>
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                        <span>Regime Pleno / Ano</span>
                        <FieldTooltip
                          title="Custo Anual em Regime Pleno"
                          text="Custo anual recorrente com todas as unidades ativas operando durante 12 meses completos."
                          formula={`${BRL0(rf.custoPorVagaAdicionalAno)} / vaga / ano`}
                        />
                      </div>
                      <div className="text-sm font-black text-emerald-800 mt-0.5">
                        {BRL0(rf.custoAnualRegimePleno)}
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-800">
                        <span>Total no Período</span>
                        <FieldTooltip
                          title="Total Projetado no Período"
                          text="Soma de todos os desembolsos mensais dentro da vigência do plano, respeitando a data de entrada em operação de cada unidade."
                        />
                      </div>
                      <div className="text-base font-black text-blue-800 mt-0.5">
                        {BRL0(rf.totalGeralPeriodo)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {planosFiltrados.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">
                Nenhum Plano de Custeio encontrado
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                Crie um novo Plano de Custeio selecionando um Plano de Expansão existente e definindo o período de operação.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Plano de Custeio
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <CusteioConfirmModal
        isOpen={Boolean(planoParaExcluir)}
        variant="danger"
        title="Excluir Plano de Custeio"
        description="Tem certeza de que deseja remover permanentemente este Plano de Custeio? O Plano de Expansão físico vinculado não será afetado."
        detailBox={
          planoParaExcluir
            ? `${planoParaExcluir.nome} (${planoParaExcluir.cenarioLabel} · Vigência ${formatYMDisplay(
                planoParaExcluir.dataInicio
              )} a ${formatYMDisplay(planoParaExcluir.dataFim)})`
            : undefined
        }
        confirmLabel="Sim, Excluir Plano"
        onConfirm={confirmDelete}
        onCancel={() => setPlanoParaExcluir(null)}
      />

      {/* ─── MODAL: CRIAR NOVO PLANO DE CUSTEIO ──────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold">Novo Plano de Custeio</h2>
                  <p className="text-xs text-blue-100">
                    Vincule a um Plano de Expansão e gere a estimativa proporcional inicial em base anual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* 1. Seleção do Plano de Expansão */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 mb-1.5">
                  <span>1. Plano de Expansão Vinculado *</span>
                  <FieldTooltip
                    title="Plano de Expansão de Origem"
                    text="O sistema importará automaticamente todas as obras de construção/retomada e ampliações/adaptações previstas neste Plano de Expansão, identificando salas, vagas e modelos FNDE."
                  />
                </label>
                <select
                  value={novoExpansaoId}
                  onChange={e => handleSelectExpansionInModal(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {expansionPlans.map(ep => (
                    <option key={ep.id} value={ep.id}>
                      {ep.nome || ep.name} ({ep.periodoInicio}–{ep.periodoFim} · {ep.obras.length} obras,{' '}
                      {ep.acoesUnidades.length} ações)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Identificação do Plano de Custeio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 mb-1.5">
                    <span>2. Nome do Plano de Custeio *</span>
                    <FieldTooltip
                      title="Identificação Oficial"
                      text="Título exibido na listagem e no cabeçalho do Relatório Consolidado."
                    />
                  </label>
                  <input
                    type="text"
                    value={novoNome}
                    onChange={e => setNovoNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600 mb-1.5">
                    <span>Cenário / Versão</span>
                    <FieldTooltip
                      title="Rótulo do Cenário"
                      text="Permite diferenciar vários cenários para um mesmo Plano de Expansão (ex.: Cenário Base, Cenário Conservador, Operação Gradual)."
                    />
                  </label>
                  <input
                    type="text"
                    value={novoCenario}
                    onChange={e => setNovoCenario(e.target.value)}
                    placeholder="Ex.: Cenário Base"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={novoDescricao}
                  onChange={e => setNovoDescricao(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 3. Período Próprio de Planejamento do Custeio */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-blue-800 mb-2">
                  <span>3. Período Próprio do Plano de Custeio (Independente da Obra)</span>
                  <FieldTooltip
                    title="Vigência Financeira Independente"
                    text="O período do Plano de Custeio representa os meses em que se deseja projetar as despesas de funcionamento (ex.: 2028 a 2030), independentemente do cronograma físico das obras."
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                      <span>Data de Início</span>
                      <FieldTooltip text="Competência inicial (Mês/Ano) da projeção orçamentária." />
                    </label>
                    <input
                      type="month"
                      value={novoDataInicio}
                      onChange={e => setNovoDataInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                      <span>Data de Término</span>
                      <FieldTooltip text="Competência final (Mês/Ano) da projeção orçamentária." />
                    </label>
                    <input
                      type="month"
                      value={novoDataFim}
                      onChange={e => setNovoDataFim(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Responsável
                    </label>
                    <input
                      type="text"
                      value={novoResponsavel}
                      onChange={e => setNovoResponsavel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Prévia das Unidades, Intervenções e Escopo Proporcional */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-600">
                    <span>4. Intervenções e Ambientes Identificados ({previewIntervencoes.length})</span>
                    <FieldTooltip
                      title="Regra Automática de Escopo"
                      text="Obras novas/retomadas entram como 'Creche Completa' (100% de ambientes, serviços, insumos e quadro do modelo). Ampliações/adaptações entram como 'Incremental' (apenas salas, vagas e profissionais adicionais)."
                    />
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Parâmetros de custeio prontos para carga
                  </span>
                </div>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50">
                  {previewIntervencoes.map(iv => (
                    <div
                      key={iv.id}
                      className="px-3.5 py-2.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{iv.nomeUnidadeOuObra}</span>
                        <span className="text-slate-500 ml-2">
                          (+{iv.salasAdicionais} salas · +{iv.vagasAdicionais} vagas · Início op.:{' '}
                          {formatYMDisplay(iv.dataInicioOperacao)})
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          iv.escopo === 'unidade_completa'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {iv.escopo === 'unidade_completa' ? 'Creche Completa' : 'Incremental'}
                      </span>
                    </div>
                  ))}
                  {previewIntervencoes.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Este Plano de Expansão ainda não possui obras ou ações cadastradas.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md"
              >
                Gerar Estimativa Inicial e Revisar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
