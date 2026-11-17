import {
  ExpansionPlan,
  ObraConstrucao,
  AcaoUnidade,
  ModeloCreche,
  ModeloAmbiente,
  ServicoAnual,
  AquisicaoAnual,
  CargoReferencia,
  PlanoCusteio,
  IntervencaoCusteioVinculada,
  ItemCusteioBase,
  ItemCusteioMobiliario,
  ItemCusteioServico,
  ItemCusteioAquisicao,
  ItemCusteioPessoal,
  ParametrosSimulacaoCusteio,
  ResumoFinanceiroCusteio,
  CriterioProporcionalidade,
  ConfiguracaoSala,
} from '../types';
import { mockUnidades } from '../mockData';
import {
  mockModelosCreche,
  mockModelosAmbiente,
  mockServicosReferencia,
  mockAquisicoesReferencia,
  mockCargosReferencia,
  calcularCustoAmbiente,
  calcularCustoAnualCargo,
} from '../mockDataCusto';

export interface CatalogosCusteio {
  modelos: ModeloCreche[];
  ambientes: ModeloAmbiente[];
  servicosRef: ServicoAnual[];
  aquisicoesRef: AquisicaoAnual[];
  cargosRef: CargoReferencia[];
}

export interface LinhaCronogramaMensal {
  competencia: string; // YYYY-MM
  ano: number;
  mes: number;
  servicos: number;
  aquisicoesPontuais: number;
  aquisicoesRecorrentes: number;
  pessoal: number;
  total: number;
  porIntervencao: Record<string, number>;
}

export interface LinhaCronogramaAnual {
  ano: number;
  mesesNoPlano: number;
  servicos: number;
  aquisicoesPontuais: number;
  aquisicoesRecorrentes: number;
  pessoal: number;
  total: number;
  porIntervencao: Record<string, number>;
}

export interface ResumoPorIntervencao {
  intervencaoId: string;
  nome: string;
  escopo: 'unidade_completa' | 'incremental';
  subtipo: string;
  dataInicioOperacao: string;
  mesesOperacaoNoPeriodo: number;
  salas: number;
  vagas: number;
  turmas: number;
  mobiliario: number;
  custoBaseMobiliario: number;
  servicos: number;
  aquisicoesPontuais: number;
  aquisicoesRecorrentes: number;
  pessoal: number;
  totalPeriodo: number;
  custoAnualServicos: number;
  custoAnualAquisicoes: number;
  custoAnualPessoal: number;
  custoAnualizadoRegime: number;
  custoPorVagaAno: number;
}

export const CRITERIO_LABELS: Record<CriterioProporcionalidade, string> = {
  por_ambiente: 'Por Ambiente / Sala',
  por_vaga: 'Por Estudante / Vaga Adicional',
  por_turma: 'Por Turma em Operação',
  por_profissional: 'Por Profissional',
  por_unidade: 'Por Unidade Escolar (100%)',
  percentual_utilizacao: 'Rateio / Aditivo Contratual (%)',
  valor_fixo_incremental: 'Valor Fixo Incremental',
  manual: 'Definido Manualmente',
};

export const CRITERIO_DESCRIPTIONS: Record<CriterioProporcionalidade, string> = {
  por_ambiente:
    'Calcula na razão exata entre as salas adicionadas na intervenção e o total de salas do modelo de referência.',
  por_vaga:
    'Calcula na razão exata entre as novas vagas geradas e a capacidade total de alunos do modelo de referência.',
  por_turma:
    'Calcula proporcionalmente ao número de turmas previstas em operação na intervenção.',
  por_profissional:
    'Acompanha dinamicamente o número de profissionais dimensionados na aba Pessoal em relação ao quadro do modelo base.',
  por_unidade:
    'Aplica 100% do contrato anual de referência (1 por Unidade Escolar), indicado para contratos indivisíveis de novas creches.',
  percentual_utilizacao:
    'Aplica um percentual de rateio/aditivo (0% a 100%+) sobre o contrato anual. Em ampliações, inicia em 0% para não duplicar contratos já pagos pela escola.',
  valor_fixo_incremental:
    'Aplica 100% do valor informado diretamente no campo Valor de Referência (sem fração redutora).',
  manual:
    'Valor e quantidade livres definidos manualmente pelo usuário (protegido contra sobrescrita automática).',
};

export function loadCatalogosCusteio(): CatalogosCusteio {
  const safeParse = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    modelos: safeParse<ModeloCreche[]>('exp_creches_modelos', mockModelosCreche),
    ambientes: safeParse<ModeloAmbiente[]>('exp_creches_ambientes', mockModelosAmbiente),
    servicosRef: safeParse<ServicoAnual[]>('exp_creches_servicos_ref', mockServicosReferencia),
    aquisicoesRef: safeParse<AquisicaoAnual[]>('exp_creches_aquisicoes_ref', mockAquisicoesReferencia),
    cargosRef: safeParse<CargoReferencia[]>('exp_creches_cargos_ref', mockCargosReferencia),
  };
}

// ─── Helpers Compartilhados de Capacidade Física (Vagas e Salas) ───────────

export function calcularVagasObraPadrao(
  obra: ObraConstrucao,
  modelos: ModeloCreche[] = mockModelosCreche
): number {
  if (obra.capacidadeAlunos && obra.capacidadeAlunos > 0) {
    return obra.capacidadeAlunos;
  }
  const isProprio = obra.tipoProjetoFNDE === 'proprio' && !obra.modeloCrecheId;
  if (!isProprio) {
    const mod =
      modelos.find(m => m.id === obra.modeloCrecheId) ||
      modelos.find(m => m.tipoBase === obra.tipoProjetoFNDE);
    if (mod && mod.capacidadeAlunos > 0) {
      return mod.capacidadeAlunos;
    }
  }
  if (obra.tipoProjetoFNDE === 'tipo1') return 228;
  if (obra.tipoProjetoFNDE === 'tipo2') return 120;
  return (obra.numeroDeSalas || 4) * 20;
}

export function parseSalasFromAcao(
  descricao: string,
  capacidadeAnterior: number,
  novaCapacidade: number,
  quantidadeSalasExplicita?: number
): number {
  if (typeof quantidadeSalasExplicita === 'number' && quantidadeSalasExplicita > 0) {
    return quantidadeSalasExplicita;
  }
  const match = (descricao || '').match(/(\d+)\s*(?:novas?\s+)?salas?/i);
  if (match && Number(match[1]) > 0) {
    return Number(match[1]);
  }
  const mapaExtenso: Record<string, number> = {
    uma: 1,
    duas: 2,
    tres: 3,
    três: 3,
    quatro: 4,
    cinco: 5,
    seis: 6,
  };
  const matchExtenso = (descricao || '')
    .toLowerCase()
    .match(/\b(uma|duas|tr[eê]s|quatro|cinco|seis)\s+(?:novas?\s+)?salas?\b/i);
  if (matchExtenso && mapaExtenso[matchExtenso[1].toLowerCase()]) {
    return mapaExtenso[matchExtenso[1].toLowerCase()];
  }
  const deltaVagas = Math.max(0, (novaCapacidade || 0) - (capacidadeAnterior || 0));
  if (deltaVagas > 25) {
    return Math.max(1, Math.round(deltaVagas / 20));
  }
  return 1;
}

export function calcularVagasAcaoPadrao(acao: AcaoUnidade): number {
  const deltaVagas = Math.max(0, (acao.novaCapacidade || 0) - (acao.capacidadeAnterior || 0));
  return deltaVagas > 0 ? deltaVagas : acao.novaCapacidade || 0;
}

// ─── Helpers de Datas (YYYY-MM) ────────────────────────────────────────────

export function parseYM(ym: string): { year: number; month: number } {
  const [y, m] = (ym || '2027-01').split('-').map(Number);
  return {
    year: Number.isFinite(y) ? y : 2027,
    month: Number.isFinite(m) && m >= 1 && m <= 12 ? m : 1,
  };
}

export function formatYM(year: number, month: number): string {
  const y = Math.max(2000, Math.min(2100, year));
  const m = Math.max(1, Math.min(12, month));
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function formatYMDisplay(ym: string): string {
  if (!ym) return '—';
  const { year, month } = parseYM(ym);
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[month - 1]}/${year}`;
}

export function nextMonthAfterDate(dateStr?: string, fallbackYM: string = '2027-01'): string {
  if (!dateStr) return fallbackYM;
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return fallbackYM;
  }
  let year = parts[0];
  let month = parts[1] + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return formatYM(year, month);
}

export function maxYM(...values: (string | undefined)[]): string {
  const valid = values.filter((v): v is string => Boolean(v && /^\d{4}-\d{2}$/.test(v)));
  if (valid.length === 0) return '2027-01';
  return valid.reduce((a, b) => (a > b ? a : b));
}

export function minYM(...values: (string | undefined)[]): string {
  const valid = values.filter((v): v is string => Boolean(v && /^\d{4}-\d{2}$/.test(v)));
  if (valid.length === 0) return '2030-12';
  return valid.reduce((a, b) => (a < b ? a : b));
}

export function listMonthsBetween(startYM: string, endYM: string): string[] {
  if (!startYM || !endYM || startYM > endYM) return [];
  const start = parseYM(startYM);
  const end = parseYM(endYM);
  const result: string[] = [];
  let y = start.year;
  let m = start.month;
  let guard = 0;
  while ((y < end.year || (y === end.year && m <= end.month)) && guard < 240) {
    result.push(formatYM(y, m));
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    guard += 1;
  }
  return result;
}

export function obterPeriodoExpansaoYM(plan?: ExpansionPlan): {
  dataInicio: string;
  dataFim: string;
  meses: number;
  label: string;
  labelComMeses: string;
} {
  const anoIni = plan?.periodoInicio || plan?.year || 2026;
  const anoFim = plan?.periodoFim || anoIni + 3;
  const dataInicio =
    plan?.dataInicio && /^\d{4}-\d{2}$/.test(plan.dataInicio)
      ? plan.dataInicio
      : plan?.startDate && /^\d{4}-\d{2}/.test(plan.startDate)
        ? plan.startDate.slice(0, 7)
        : `${anoIni}-01`;
  const dataFim =
    plan?.dataFim && /^\d{4}-\d{2}$/.test(plan.dataFim)
      ? plan.dataFim
      : plan?.expectedEndDate && /^\d{4}-\d{2}/.test(plan.expectedEndDate)
        ? plan.expectedEndDate.slice(0, 7)
        : `${anoFim}-12`;
  const meses = listMonthsBetween(dataInicio, dataFim).length;
  const label = `${formatYMDisplay(dataInicio)} a ${formatYMDisplay(dataFim)}`;
  return {
    dataInicio,
    dataFim,
    meses,
    label,
    labelComMeses: meses > 0 ? `${label} (${meses} meses)` : label,
  };
}

// ─── Extração de Intervenções do Plano de Expansão ─────────────────────────

export function countModelClassrooms(modelo: ModeloCreche, ambientes: ModeloAmbiente[]): number {
  const count = modelo.ambientes.reduce((acc, ma) => {
    const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
    if (amb && (amb.categoria === 'sala-atividades' || amb.categoria === 'bercario')) {
      return acc + ma.quantidade;
    }
    return acc;
  }, 0);
  return count > 0 ? count : 5;
}

export function formatProporcaoResumo(item: Pick<
  ItemCusteioBase,
  | 'criterioCalculo'
  | 'fatorProporcional'
  | 'percentualRateio'
  | 'numeradorProporcao'
  | 'denominadorProporcao'
  | 'unidadeProporcao'
>): string {
  if (item.criterioCalculo === 'percentual_utilizacao') {
    const pct = item.percentualRateio ?? 0;
    return `Rateio: ${pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  }
  if (item.criterioCalculo === 'por_unidade') {
    return '1 Unidade (100%)';
  }
  if (item.criterioCalculo === 'valor_fixo_incremental' || item.criterioCalculo === 'manual') {
    return 'Valor Direto (100%)';
  }
  const pct = (item.fatorProporcional ?? 1) * 100;
  const pctFmt = pct.toLocaleString('pt-BR', { minimumFractionDigits: pct % 1 === 0 ? 0 : 1, maximumFractionDigits: 2 });
  if (
    item.numeradorProporcao !== undefined &&
    item.denominadorProporcao !== undefined &&
    item.unidadeProporcao
  ) {
    return `${item.numeradorProporcao}/${item.denominadorProporcao} ${item.unidadeProporcao} (${pctFmt}%)`;
  }
  return `${pctFmt}%`;
}

export function extrairIntervencoesDoPlano(
  plan: ExpansionPlan,
  catalogos: CatalogosCusteio,
  defaultStartYM: string,
  existingIntervencoes?: IntervencaoCusteioVinculada[],
  syncFromExpansion: boolean = false
): IntervencaoCusteioVinculada[] {
  const { modelos, ambientes } = catalogos;
  const mapExisting = new Map((existingIntervencoes || []).map(i => [`${i.origemTipo}:${i.origemId}`, i]));
  const configSalasPlano = plan.configSalas || [];
  const result: IntervencaoCusteioVinculada[] = [];

  // 1. Obras (Construção de nova unidade / Retomada de creche completa)
  (plan.obras || []).forEach(obra => {
    const prev = mapExisting.get(`obra:${obra.id}`);

    const modelo =
      modelos.find(m => m.id === obra.modeloCrecheId) ||
      (obra.tipoProjetoFNDE === 'tipo1'
        ? modelos.find(m => m.tipoBase === 'tipo1')
        : obra.tipoProjetoFNDE === 'tipo2'
          ? modelos.find(m => m.tipoBase === 'tipo2')
          : obra.tipoProjetoFNDE === 'proprio'
            ? modelos.find(m => m.tipoBase === 'proprio') || modelos.find(m => m.tipoBase === 'tipo2')
            : modelos.find(m => m.tipoBase === 'tipo2')) ||
      modelos[0];

    const salasModeloTotal = modelo ? countModelClassrooms(modelo, ambientes) : 5;
    const salasAdicionais = obra.numeroDeSalas || salasModeloTotal;
    const isProjetoProprio = obra.tipoProjetoFNDE === 'proprio' && salasAdicionais !== salasModeloTotal;
    const vagasAdicionais =
      obra.capacidadeAlunos && obra.capacidadeAlunos > 0
        ? obra.capacidadeAlunos
        : modelo && salasAdicionais === salasModeloTotal
          ? modelo.capacidadeAlunos
          : Math.round(((modelo?.capacidadeAlunos || 80) * salasAdicionais) / Math.max(1, salasModeloTotal));

    const turmasConfiguradas = configSalasPlano
      .filter(cs => cs.origem === 'obra' && cs.origemId === obra.id)
      .reduce((s, cs) => s + (cs.numeroTurmas || 1), 0);

    const turmasPadraoModelo = turmasConfiguradas > 0 ? turmasConfiguradas : salasAdicionais;
    const mudouPorteSala = prev && prev.salasAdicionais !== salasAdicionais;
    const turmasPrevistas =
      prev && !(syncFromExpansion && mudouPorteSala) ? prev.turmasPrevistas : turmasPadraoModelo;

    const ambientesPrevistos: { ambienteId: string; nome: string; quantidade: number }[] = [];
    if (modelo) {
      modelo.ambientes.forEach(ma => {
        const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
        if (!amb) return;
        const isClassroom = amb.categoria === 'sala-atividades' || amb.categoria === 'bercario';
        const qtd =
          isClassroom && salasAdicionais !== salasModeloTotal && modelo.ambientes.filter(x => {
            const a = ambientes.find(y => y.id === x.modeloAmbienteId);
            return a && (a.categoria === 'sala-atividades' || a.categoria === 'bercario');
          }).length === 1
            ? salasAdicionais
            : ma.quantidade;
        ambientesPrevistos.push({
          ambienteId: amb.id,
          nome: amb.nome,
          quantidade: qtd,
        });
      });
    } else {
      const salaRef = ambientes.find(a => a.id === 'ma01') || ambientes[0];
      if (salaRef) {
        ambientesPrevistos.push({ ambienteId: salaRef.id, nome: salaRef.nome, quantidade: salasAdicionais });
      }
    }

    // No Plano de Custeio a creche já foi construída e opera durante o Período do Plano de Custeio
    const dataInicioOperacao = prev?.dataInicioOperacao || defaultStartYM;

    const escopoImplantacaoMobiliario =
      obra.incluiMobiliarioNoCapex !== undefined
        ? obra.incluiMobiliarioNoCapex
          ? 'contemplado_no_capex_obra'
          : 'incluido_no_custeio'
        : prev?.escopoImplantacaoMobiliario || 'incluido_no_custeio';

    result.push({
      id: prev?.id || `int-obra-${obra.id}`,
      origemTipo: 'obra',
      origemId: obra.id,
      nomeUnidadeOuObra: obra.nome || (obra.tipo === 'retomada' ? 'Obra de Retomada' : 'Nova Creche'),
      localizacaoResumo: [obra.bairro, obra.setor].filter(Boolean).join(' · ') || obra.localizacao || 'Localização definida no plano',
      escopo: 'unidade_completa',
      subtipoIntervencao: obra.tipo === 'retomada' ? 'retomada' : 'nova_construcao',
      modeloCrecheId: modelo?.id,
      modeloCrecheNome: modelo?.nome || 'Modelo Padrão',
      projetoProprio: isProjetoProprio,
      salasAdicionais,
      vagasAdicionais,
      turmasPrevistas,
      turmasPadraoModelo,
      etapasAtendidas: obra.etapasAtendidas || [],
      ambientesPrevistos,
      dataConclusaoObra: obra.previsaoConclusao,
      dataInicioOperacao,
      dataFimOperacao: prev?.dataFimOperacao,
      ativoNoCusteio: prev ? prev.ativoNoCusteio : true,
      escopoImplantacaoMobiliario,
      statusObraOrigem: obra.statusObra,
      percentualConclusaoObra: obra.percentualConclusaoAtual,
    });
  });

  // 2. Ações em Unidades Existentes (Ampliação ou Adaptação — escopo incremental)
  (plan.acoesUnidades || []).forEach(acao => {
    const prev = mapExisting.get(`acao:${acao.id}`);
    const ue = mockUnidades.find(u => u.id === acao.unidadeId);
    const salasAdicionais = parseSalasFromAcao(
      acao.descricao,
      acao.capacidadeAnterior,
      acao.novaCapacidade,
      acao.quantidadeSalas
    );
    const vagasAdicionais = calcularVagasAcaoPadrao(acao) || salasAdicionais * 20;

    const turmasConfiguradas = configSalasPlano
      .filter(cs => cs.origem === 'acao' && cs.origemId === acao.id)
      .reduce((s, cs) => s + (cs.numeroTurmas || 1), 0);

    const turmasPadraoModelo = turmasConfiguradas > 0 ? turmasConfiguradas : salasAdicionais;
    const mudouPorteSala = prev && prev.salasAdicionais !== salasAdicionais;
    const turmasPrevistas =
      prev && !(syncFromExpansion && mudouPorteSala) ? prev.turmasPrevistas : turmasPadraoModelo;

    // Se acao.ambienteModeloId ou acao.salaId apontar para um ModeloAmbiente cadastrado, usá-lo diretamente; caso contrário, inferir por etapa
    const ambEspecifico =
      ambientes.find(a => a.id === acao.ambienteModeloId) ||
      ambientes.find(a => a.id === acao.salaId);
    const fallbackSalaId = acao.etapaDestino === 'Pré-Escola' ? 'ma02' : 'ma01';
    const ambSala = ambEspecifico || ambientes.find(a => a.id === fallbackSalaId) || ambientes[0];
    const ambientesPrevistos = ambSala
      ? [{ ambienteId: ambSala.id, nome: ambSala.nome, quantidade: salasAdicionais }]
      : [];

    // No Plano de Custeio a ampliação/adaptação opera durante o Período do Plano de Custeio
    const dataInicioOperacao = prev?.dataInicioOperacao || defaultStartYM;

    const escopoImplantacaoMobiliario =
      acao.incluiMobiliarioNoCapex !== undefined
        ? acao.incluiMobiliarioNoCapex
          ? 'contemplado_no_capex_obra'
          : 'incluido_no_custeio'
        : prev?.escopoImplantacaoMobiliario || 'incluido_no_custeio';

    const modAcao = modelos.find(m => m.id === (acao.modeloCrecheId || 'mc02')) || modelos[0];

    result.push({
      id: prev?.id || `int-acao-${acao.id}`,
      origemTipo: 'acao',
      origemId: acao.id,
      unidadeId: acao.unidadeId,
      nomeUnidadeOuObra: `${acao.tipo === 'ampliacao' ? 'Ampliação' : 'Adaptação'} — ${ue?.nome || acao.unidadeId}`,
      localizacaoResumo: [ue?.bairro, ue?.setor].filter(Boolean).join(' · ') || acao.descricao,
      escopo: 'incremental',
      subtipoIntervencao: acao.tipo,
      modeloCrecheId: modAcao?.id || 'mc02',
      modeloCrecheNome: modAcao?.nome || 'CRECHE FNDE TIPO 2 (PROINFÂNCIA C)',
      projetoProprio: false,
      salasAdicionais,
      vagasAdicionais,
      turmasPrevistas,
      turmasPadraoModelo,
      etapasAtendidas: acao.etapaDestino ? [acao.etapaDestino] : [],
      ambientesPrevistos,
      dataConclusaoObra: acao.previsaoConclusao,
      dataInicioOperacao,
      dataFimOperacao: prev?.dataFimOperacao,
      ativoNoCusteio: prev ? prev.ativoNoCusteio : true,
      escopoImplantacaoMobiliario,
    });
  });

  return result;
}

// ─── Classificadores auxiliares de Catálogo ────────────────────────────────

function classifyTipoServico(descricao: string): ItemCusteioServico['tipoServico'] {
  const d = descricao.toLowerCase();
  if (d.includes('vigil') || d.includes('seguran')) return 'seguranca';
  if (d.includes('limpeza') || d.includes('higiene')) return 'limpeza';
  if (d.includes('internet') || d.includes('telefon') || d.includes('link')) return 'conectividade';
  if (d.includes('manuten')) return 'manutencao';
  if (d.includes('energia') || d.includes('água') || d.includes('agua') || d.includes('esgoto')) return 'utilidades';
  return 'outros';
}

function isFixedUnitService(descricao: string): boolean {
  const d = descricao.toLowerCase();
  return d.includes('vigil') || d.includes('seguran') || d.includes('internet') || d.includes('telefon');
}

function isAreaPredialService(descricao: string): boolean {
  const d = descricao.toLowerCase();
  return d.includes('manuten') || d.includes('limpeza') || d.includes('terceirizad');
}

function classifySubcategoriaAquisicao(descricao: string): ItemCusteioAquisicao['subcategoriaAquisicao'] {
  const d = descricao.toLowerCase();
  if (d.includes('merenda') || d.includes('alimenta') || d.includes('gás') || d.includes('gas')) return 'alimentacao';
  if (d.includes('pedag') || d.includes('brinquedo') || d.includes('didát')) return 'material_pedagogico';
  if (d.includes('limpeza') || d.includes('higiene')) return 'insumos_higiene';
  if (d.includes('uniforme') || d.includes('epi')) return 'uniformes_epi';
  return 'outros';
}

function classifyCategoriaCargo(descricao: string): ItemCusteioPessoal['categoriaCargo'] {
  const d = descricao.toLowerCase();
  if (d.includes('diretor') || d.includes('secret')) return 'administrativo';
  if (d.includes('professor') || d.includes('monitor') || d.includes('auxiliar de creche') || d.includes('coordenador') || d.includes('pedagog')) {
    return 'pedagogico';
  }
  return 'apoio';
}

// ─── Cálculo Reativo de Proporção ao Trocar Critério ──────────────────────

export function calcularProporcaoPorCriterio(
  criterio: CriterioProporcionalidade,
  interv: IntervencaoCusteioVinculada | undefined,
  catalogos: CatalogosCusteio,
  qtdProfissionaisInterv: number = 0,
  currentRateioPct?: number
): {
  fatorProporcional: number;
  numeradorProporcao?: number;
  denominadorProporcao?: number;
  unidadeProporcao?: string;
  percentualRateio?: number;
  naturezaCusto: 'exclusivo_intervencao' | 'compartilhado_rede';
  memoriaCalculo: string;
} {
  const { modelos, ambientes } = catalogos;
  const modFallback = modelos.find(m => m.tipoBase === 'tipo2') || modelos[0];
  const mod = (interv && modelos.find(m => m.id === interv.modeloCrecheId)) || modFallback;

  const salasRef = mod ? countModelClassrooms(mod, ambientes) : 5;
  const vagasRef = mod?.capacidadeAlunos || 120;
  const turmasRef = salasRef;
  const profRef = (mod?.pessoal || []).reduce((s, p) => s + p.quantidade, 0) || 21;

  if (!interv) {
    return {
      fatorProporcional: 1,
      numeradorProporcao: 1,
      denominadorProporcao: 1,
      unidadeProporcao: 'unid.',
      naturezaCusto: 'exclusivo_intervencao',
      memoriaCalculo: 'Aplicação integral (100%)',
    };
  }

  switch (criterio) {
    case 'por_unidade':
      return {
        fatorProporcional: 1,
        numeradorProporcao: 1,
        denominadorProporcao: 1,
        unidadeProporcao: 'unid.',
        naturezaCusto: 'exclusivo_intervencao',
        memoriaCalculo: 'Aplicação integral para a unidade escolar (100%)',
      };

    case 'por_ambiente': {
      const num = interv.salasAdicionais;
      const den = Math.max(1, salasRef);
      const fator = num / den;
      const pct = (fator * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
      return {
        fatorProporcional: fator,
        numeradorProporcao: num,
        denominadorProporcao: den,
        unidadeProporcao: 'salas',
        naturezaCusto: 'exclusivo_intervencao',
        memoriaCalculo: `Proporcional a ${num} de ${den} salas do modelo base (${pct}%)`,
      };
    }

    case 'por_vaga': {
      const num = interv.vagasAdicionais;
      const den = Math.max(1, vagasRef);
      const fator = num / den;
      const pct = (fator * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
      return {
        fatorProporcional: fator,
        numeradorProporcao: num,
        denominadorProporcao: den,
        unidadeProporcao: 'vagas',
        naturezaCusto: 'exclusivo_intervencao',
        memoriaCalculo: `Proporcional a ${num} de ${den} vagas do modelo base (${pct}%)`,
      };
    }

    case 'por_turma': {
      const num = interv.turmasPrevistas;
      const den = Math.max(1, turmasRef);
      const fator = num / den;
      const pct = (fator * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
      return {
        fatorProporcional: fator,
        numeradorProporcao: num,
        denominadorProporcao: den,
        unidadeProporcao: 'turmas',
        naturezaCusto: 'exclusivo_intervencao',
        memoriaCalculo: `Proporcional a ${num} de ${den} turmas do modelo base (${pct}%)`,
      };
    }

    case 'por_profissional': {
      const num = Math.max(0, qtdProfissionaisInterv);
      const den = Math.max(1, profRef);
      const fator = num / den;
      const pct = (fator * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
      return {
        fatorProporcional: fator,
        numeradorProporcao: num,
        denominadorProporcao: den,
        unidadeProporcao: 'prof.',
        naturezaCusto: num > 0 ? 'exclusivo_intervencao' : 'compartilhado_rede',
        memoriaCalculo: `Proporcional a ${num} de ${den} profissionais do modelo base (${pct}%)`,
      };
    }

    case 'percentual_utilizacao': {
      const pct = currentRateioPct ?? 0;
      return {
        fatorProporcional: pct / 100,
        percentualRateio: pct,
        naturezaCusto: 'compartilhado_rede',
        memoriaCalculo:
          pct === 0
            ? 'Despesa compartilhada suportada pela escola existente (0% incremental)'
            : `Rateio/aditivo contratual de ${pct}% atribuído à intervenção`,
      };
    }

    case 'valor_fixo_incremental':
      return {
        fatorProporcional: 1,
        numeradorProporcao: 1,
        denominadorProporcao: 1,
        unidadeProporcao: 'fixo',
        naturezaCusto: 'exclusivo_intervencao',
        memoriaCalculo: 'Valor fixo incremental integral definido para a intervenção (100%)',
      };

    case 'manual':
    default:
      return {
        fatorProporcional: 1,
        numeradorProporcao: 1,
        denominadorProporcao: 1,
        unidadeProporcao: 'manual',
        naturezaCusto: 'exclusivo_intervencao',
        memoriaCalculo: 'Dimensionado manualmente pelo usuário (100% do valor informado)',
      };
  }
}

// ─── Motor de Geração Proporcional de Itens ────────────────────────────────

export function gerarEstimativaItensProporcionais(
  intervencoes: IntervencaoCusteioVinculada[],
  catalogos: CatalogosCusteio,
  planStartYM: string,
  planEndYM: string,
  existing?: {
    mobiliario?: ItemCusteioMobiliario[];
    servicos?: ItemCusteioServico[];
    aquisicoes?: ItemCusteioAquisicao[];
    pessoal?: ItemCusteioPessoal[];
  },
  preserveManual: boolean = true
): {
  mobiliario: ItemCusteioMobiliario[];
  servicos: ItemCusteioServico[];
  aquisicoes: ItemCusteioAquisicao[];
  pessoal: ItemCusteioPessoal[];
} {
  const { modelos, ambientes, servicosRef, aquisicoesRef, cargosRef } = catalogos;

  const manualMobiliario = preserveManual
    ? (existing?.mobiliario || []).filter(i => i.origemCalculo !== 'automatico')
    : [];
  const manualServicos = preserveManual
    ? (existing?.servicos || []).filter(i => i.origemCalculo !== 'automatico')
    : [];
  const manualAquisicoes = preserveManual
    ? (existing?.aquisicoes || []).filter(i => i.origemCalculo !== 'automatico')
    : [];
  const manualPessoal = preserveManual
    ? (existing?.pessoal || []).filter(i => i.origemCalculo !== 'automatico')
    : [];

  const hasManualOverride = <
    T extends { intervencaoCusteioId: string; catalogoRefId?: string; origemCalculo: string }
  >(
    list: T[],
    intervencaoId: string,
    refKey: string
  ): T | undefined =>
    list.find(
      item =>
        item.origemCalculo === 'ajustado_manualmente' &&
        item.intervencaoCusteioId === intervencaoId &&
        item.catalogoRefId === refKey
    );

  const mobiliario: ItemCusteioMobiliario[] = [
    ...manualMobiliario.filter(i => i.origemCalculo === 'incluido_manualmente'),
  ];
  const servicos: ItemCusteioServico[] = [
    ...manualServicos.filter(i => i.origemCalculo === 'incluido_manualmente'),
  ];
  const aquisicoes: ItemCusteioAquisicao[] = [
    ...manualAquisicoes.filter(
      i => i.origemCalculo === 'incluido_manualmente' && i.subcategoriaAquisicao !== 'mobiliario_equipamento'
    ),
  ];
  const pessoal: ItemCusteioPessoal[] = [
    ...manualPessoal.filter(i => i.origemCalculo === 'incluido_manualmente'),
  ];

  const modeloRefIncremental = modelos.find(m => m.tipoBase === 'tipo2') || modelos[0];
  const salasBaseRefIncremental = modeloRefIncremental
    ? countModelClassrooms(modeloRefIncremental, ambientes)
    : 5;
  const vagasBaseRefIncremental = modeloRefIncremental?.capacidadeAlunos || 120;

  for (const interv of intervencoes) {
    const startItemYM =
      interv.dataInicioOperacao >= planStartYM && interv.dataInicioOperacao <= planEndYM
        ? interv.dataInicioOperacao
        : planStartYM;
    const modeloAssociado =
      modelos.find(m => m.id === interv.modeloCrecheId) || modeloRefIncremental;

    const salasModeloAssociado = modeloAssociado
      ? countModelClassrooms(modeloAssociado, ambientes)
      : interv.salasAdicionais;
    const isProjetoProprio =
      interv.escopo === 'unidade_completa' && interv.salasAdicionais !== salasModeloAssociado;

    // ── 1. MOBILIÁRIO & EQUIPAMENTOS DOS AMBIENTES (conforme configurado no Modelo da Creche) ──
    const listaAmbientesInterv =
      interv.ambientesPrevistos && interv.ambientesPrevistos.length > 0
        ? interv.ambientesPrevistos
        : (modeloAssociado?.ambientes || []).map(ma => {
            const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
            return {
              ambienteId: ma.modeloAmbienteId,
              nome: amb?.nome || ma.modeloAmbienteId,
              quantidade: ma.quantidade,
            };
          });

    listaAmbientesInterv.forEach(ambPrev => {
      const amb = ambientes.find(a => a.id === ambPrev.ambienteId);
      if (!amb) return;
      const cAmb = calcularCustoAmbiente(amb);
      const valorMobEqUnit = cAmb.mobiliario + cAmb.equipamentos;
      if (valorMobEqUnit <= 0) return;

      const refKey = `mob:${amb.id}`;
      const manual = hasManualOverride(manualMobiliario, interv.id, refKey);
      if (manual) {
        mobiliario.push({ ...manual });
        return;
      }

      const resumoItens = (amb.itens || [])
        .map(it => `${it.quantidade}× ${it.descricao}`)
        .join(' · ');

      const incluido = interv.escopoImplantacaoMobiliario !== 'contemplado_no_capex_obra';
      const totalAmb = valorMobEqUnit * ambPrev.quantidade;

      mobiliario.push({
        id: `mob-${interv.id}-${amb.id}`,
        categoria: 'mobiliario',
        intervencaoCusteioId: interv.id,
        catalogoRefId: refKey,
        ambienteId: amb.id,
        categoriaAmbiente: amb.categoria,
        descricao: amb.nome,
        valorMobiliarioUnitario: cAmb.mobiliario,
        valorEquipamentosUnitario: cAmb.equipamentos,
        resumoItensAmbiente: resumoItens,
        incluidoNoCusteio: incluido,
        criterioCalculo: 'por_ambiente',
        fatorProporcional: 1,
        numeradorProporcao: ambPrev.quantidade,
        denominadorProporcao: 1,
        unidadeProporcao: 'amb.',
        memoriaCalculo: `${ambPrev.quantidade}× ${amb.nome} (${(amb.itens || []).length} itens configurados no ambiente do modelo)`,
        naturezaCusto: 'exclusivo_intervencao',
        periodicidade: 'unica',
        unidadeMedida: 'AMB',
        quantidade: ambPrev.quantidade,
        valorUnitario: valorMobEqUnit,
        dataInicio: startItemYM,
        dataFim: startItemYM,
        ocorrenciasNoPeriodo: incluido ? 1 : 0,
        valorAnualizado: totalAmb,
        valorTotalProjetado: incluido ? totalAmb : 0,
        origemCalculo: 'automatico',
        quantidadeOriginal: ambPrev.quantidade,
        valorUnitarioOriginal: valorMobEqUnit,
      });
    });

    const baseServicosList = (modeloAssociado?.servicos?.length
      ? modeloAssociado.servicos
      : servicosRef
    ).filter(sv => !sv.descricao.toLowerCase().includes('pessoal'));

    const baseAquisicoesList = modeloAssociado?.aquisicoes?.length
      ? modeloAssociado.aquisicoes
      : aquisicoesRef;

    // ── C. PESSOAL E FOLHA DE PAGAMENTO (gerado primeiro p/ alimentar Uniformes/EPI) ──
    const findCargo = (id: string, keyword: string): CargoReferencia => {
      return (
        cargosRef.find(c => c.id === id) ||
        cargosRef.find(c => c.descricao.toLowerCase().includes(keyword)) || {
          id,
          descricao: keyword.toUpperCase(),
          unidade: 'ANO',
          remuneracaoBase: 3000,
          auxilios: 400,
          patronal: 600,
        }
      );
    };

    const isCompleta = interv.escopo === 'unidade_completa';
    const t = interv.turmasPrevistas;
    const tPadrao = interv.turmasPadraoModelo || interv.salasAdicionais || t;

    type SpecPessoal = {
      cargo: CargoReferencia;
      catCargo: ItemCusteioPessoal['categoriaCargo'];
      qtd: number;
      criterio: CriterioProporcionalidade;
      natureza: 'exclusivo_intervencao' | 'compartilhado_rede';
      jornada: string;
      memoria: string;
    };

    let specsPessoal: SpecPessoal[] = [];

    if (isCompleta && modeloAssociado?.pessoal?.length) {
      // Paridade 100% com o quadro cadastrado em "Consultar Modelos de Creches"
      const baseTurmasModelo = Math.max(1, salasModeloAssociado || tPadrao);
      specsPessoal = modeloAssociado.pessoal.map(mp => {
        const cargo =
          cargosRef.find(c => c.id === mp.cargoId) || findCargo(mp.cargoId, mp.cargoId);
        const catCargo = classifyCategoriaCargo(cargo.descricao);
        const d = cargo.descricao.toLowerCase();
        const isRegenciaSala = d.includes('professor') || d.includes('monitor');
        const escalaTurmas = baseTurmasModelo > 0 && t !== baseTurmasModelo ? t / baseTurmasModelo : 1;
        const qtdCalculada = isRegenciaSala
          ? Math.max(1, Math.round(mp.quantidade * escalaTurmas))
          : mp.quantidade;

        return {
          cargo,
          catCargo,
          qtd: qtdCalculada,
          criterio: isRegenciaSala ? 'por_turma' : 'por_unidade',
          natureza: 'exclusivo_intervencao',
          jornada: d.includes('diretor') ? '40h — Dedicação' : '40h semanais',
          memoria:
            escalaTurmas === 1
              ? `Quadro oficial do modelo ${modeloAssociado.nome} (${mp.quantidade} prof.)`
              : `Ajustado proporcionalmente para ${t} turmas a partir do modelo ${modeloAssociado.nome} (${baseTurmasModelo} salas base)`,
        };
      });
    } else {
      // Projeto Próprio ou Expansão Incremental (Ampliação / Adaptação)
      const cgDiretor = findCargo('cg01', 'diretor');
      const cgCoord = findCargo('cg02', 'coordenador');
      const cgProf = findCargo('cg03', 'professor');
      const cgMonitor = findCargo('cg04', 'monitor');
      const cgMerendeira = findCargo('cg05', 'merendeira');
      const cgLimpeza = findCargo('cg06', 'limpeza');

      specsPessoal = [
        {
          cargo: cgProf,
          catCargo: 'pedagogico',
          qtd: t,
          criterio: 'por_turma',
          natureza: 'exclusivo_intervencao',
          jornada: '40h semanais',
          memoria: `1 Professor regente por turma planejada (${t} turma${t !== 1 ? 's' : ''})`,
        },
        {
          cargo: cgMonitor,
          catCargo: 'pedagogico',
          qtd: t,
          criterio: 'por_turma',
          natureza: 'exclusivo_intervencao',
          jornada: '40h semanais',
          memoria: `1 Monitor/Auxiliar por turma planejada (${t} turma${t !== 1 ? 's' : ''})`,
        },
        {
          cargo: cgDiretor,
          catCargo: 'administrativo',
          qtd: isCompleta ? 1 : 0,
          criterio: 'por_unidade',
          natureza: isCompleta ? 'exclusivo_intervencao' : 'compartilhado_rede',
          jornada: '40h — Dedicação',
          memoria: isCompleta
            ? '1 Diretor Escolar para gestão da nova unidade'
            : 'Direção existente na unidade escolar comporta a expansão (sem duplicação)',
        },
        {
          cargo: cgCoord,
          catCargo: 'pedagogico',
          qtd: isCompleta ? (t >= 8 ? 2 : 1) : 0,
          criterio: 'por_unidade',
          natureza: isCompleta ? 'exclusivo_intervencao' : 'compartilhado_rede',
          jornada: '40h semanais',
          memoria: isCompleta
            ? `${t >= 8 ? 2 : 1} Coordenador(es) conforme porte da nova unidade (${t} turmas)`
            : 'Coordenação pedagógica compartilhada com a unidade escolar existente',
        },
        {
          cargo: cgMerendeira,
          catCargo: 'apoio',
          qtd: isCompleta ? (t <= 4 ? 1 : t <= 8 ? 2 : 3) : Math.floor(t / 4),
          criterio: 'por_ambiente',
          natureza: isCompleta || t >= 4 ? 'exclusivo_intervencao' : 'compartilhado_rede',
          jornada: '40h semanais',
          memoria: isCompleta
            ? `Dimensionamento de cozinha para ${t} turmas`
            : t >= 4
              ? `+${Math.floor(t / 4)} profissional pelo porte incremental (${t} novas turmas)`
              : 'Equipe de cozinha atual absorve a demanda incremental (< 4 novas turmas)',
        },
        {
          cargo: cgLimpeza,
          catCargo: 'apoio',
          qtd: isCompleta
            ? t <= 4
              ? 1
              : t <= 8
                ? 2
                : 3
            : interv.subtipoIntervencao === 'ampliacao' && interv.salasAdicionais >= 3
              ? 1
              : Math.floor(t / 4),
          criterio: 'por_ambiente',
          natureza:
            isCompleta ||
              (interv.subtipoIntervencao === 'ampliacao' && interv.salasAdicionais >= 3) ||
              t >= 4
              ? 'exclusivo_intervencao'
              : 'compartilhado_rede',
          jornada: '40h semanais',
          memoria: isCompleta
            ? `Dimensionamento de higienização predial para ${t} turmas`
            : interv.subtipoIntervencao === 'ampliacao' && interv.salasAdicionais >= 3
              ? '+1 Auxiliar de Limpeza para atender o novo bloco de salas'
              : 'Equipe de apoio atual absorve a demanda incremental',
        },
      ];
    }

    specsPessoal.forEach(spec => {
      const refKey = `ps:${spec.cargo.id}`;
      const manual = hasManualOverride(manualPessoal, interv.id, refKey);
      if (manual) {
        pessoal.push({ ...manual });
        return;
      }

      const mensalUnit =
        (spec.cargo.remuneracaoBase || 0) +
        (spec.cargo.auxilios || 0) +
        (spec.cargo.patronal || 0);
      const anualUnit = calcularCustoAnualCargo(spec.cargo);

      pessoal.push({
        id: `pes-${interv.id}-${spec.cargo.id}`,
        categoria: 'pessoal',
        categoriaCargo: spec.catCargo,
        intervencaoCusteioId: interv.id,
        catalogoRefId: refKey,
        cargoRefId: spec.cargo.id,
        funcao: spec.cargo.descricao,
        descricao: spec.cargo.descricao,
        cargaHoraria: spec.jornada,
        remuneracaoBase: spec.cargo.remuneracaoBase,
        auxilios: spec.cargo.auxilios,
        patronalUnitario: spec.cargo.patronal,
        custoMensalUnitario: mensalUnit,
        custoAnualUnitario: anualUnit,
        criterioCalculo: spec.criterio,
        fatorProporcional: 1,
        numeradorProporcao: spec.qtd,
        denominadorProporcao: 1,
        unidadeProporcao: 'prof.',
        memoriaCalculo: spec.memoria,
        naturezaCusto: spec.natureza,
        periodicidade: 'anual',
        unidadeMedida: 'ANO',
        quantidade: spec.qtd,
        valorUnitario: anualUnit,
        dataInicio: startItemYM,
        dataFim: interv.dataFimOperacao || planEndYM,
        ocorrenciasNoPeriodo: 0,
        valorAnualizado: anualUnit * spec.qtd,
        valorTotalProjetado: 0,
        origemCalculo: 'automatico',
        quantidadeOriginal: spec.qtd,
        valorUnitarioOriginal: anualUnit,
      });
    });

    const qtdProfissionaisDaInterv = pessoal
      .filter(p => p.intervencaoCusteioId === interv.id)
      .reduce((acc, p) => acc + (p.quantidade || 0), 0);

    // ── A. SERVIÇOS ──────────────────────────────────────────────────────────
    if (interv.escopo === 'unidade_completa') {
      const salasModelo = modeloAssociado
        ? countModelClassrooms(modeloAssociado, ambientes)
        : interv.salasAdicionais;

      baseServicosList.forEach(sv => {
        const refKey = `sv:${sv.descricao.toUpperCase()}`;
        const manual = hasManualOverride(manualServicos, interv.id, refKey);
        if (manual) {
          servicos.push({ ...manual });
          return;
        }

        // Contratos indivisíveis (Internet e Vigilância) em unidade nova autônoma são sempre 100% (1 por unidade)
        const fixedUnitContract = isFixedUnitService(sv.descricao);
        const escalarPorPorte = isProjetoProprio && !fixedUnitContract && salasModelo > 0;
        const fatorExato = escalarPorPorte ? interv.salasAdicionais / salasModelo : 1;
        const pctFmt = (fatorExato * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

        servicos.push({
          id: `srv-${interv.id}-${sv.id}`,
          categoria: 'servico',
          intervencaoCusteioId: interv.id,
          catalogoRefId: refKey,
          descricao: sv.descricao,
          tipoServico: classifyTipoServico(sv.descricao),
          criterioCalculo: escalarPorPorte ? 'por_ambiente' : 'por_unidade',
          fatorProporcional: fatorExato,
          numeradorProporcao: escalarPorPorte ? interv.salasAdicionais : 1,
          denominadorProporcao: escalarPorPorte ? salasModelo : 1,
          unidadeProporcao: escalarPorPorte ? 'salas' : 'unid.',
          memoriaCalculo: escalarPorPorte
            ? `Unidade nova de projeto próprio: ${interv.salasAdicionais} de ${salasModelo} salas do modelo base (${pctFmt}%)`
            : fixedUnitContract && isProjetoProprio
              ? 'Contrato indivisível da nova unidade escolar autônoma (100%)'
              : `Implantação integral de nova creche (100% do modelo ${modeloAssociado?.tipoBase?.toUpperCase() || ''})`,
          naturezaCusto: 'exclusivo_intervencao',
          periodicidade: 'anual',
          unidadeMedida: 'ANO',
          quantidade: 1,
          valorUnitario: sv.valorAnual,
          dataInicio: startItemYM,
          dataFim: interv.dataFimOperacao || planEndYM,
          ocorrenciasNoPeriodo: 0,
          valorAnualizado: sv.valorAnual * fatorExato,
          valorTotalProjetado: 0,
          origemCalculo: 'automatico',
          quantidadeOriginal: 1,
          valorUnitarioOriginal: sv.valorAnual,
        });
      });
    } else {
      // Escopo INCREMENTAL (Ampliação / Adaptação)
      const isAdaptacao = interv.subtipoIntervencao === 'adaptacao';
      baseServicosList.forEach(sv => {
        const refKey = `sv:${sv.descricao.toUpperCase()}`;
        const manual = hasManualOverride(manualServicos, interv.id, refKey);
        if (manual) {
          servicos.push({ ...manual });
          return;
        }

        // Em Adaptação (sem obra de ampliação de m²), contratos de área predial iniciam compartilhados (0%)
        const sharedByDefault =
          isFixedUnitService(sv.descricao) || (isAdaptacao && isAreaPredialService(sv.descricao));

        if (sharedByDefault) {
          servicos.push({
            id: `srv-${interv.id}-${sv.id}`,
            categoria: 'servico',
            intervencaoCusteioId: interv.id,
            catalogoRefId: refKey,
            descricao: sv.descricao,
            tipoServico: classifyTipoServico(sv.descricao),
            criterioCalculo: 'percentual_utilizacao',
            fatorProporcional: 0,
            percentualRateio: 0,
            memoriaCalculo: isFixedUnitService(sv.descricao)
              ? 'Contrato fixo já suportado pela unidade existente (0% incremental por padrão)'
              : 'Adaptação em espaço já construído sem acréscimo de área predial (0% incremental por padrão)',
            naturezaCusto: 'compartilhado_rede',
            periodicidade: 'anual',
            unidadeMedida: 'ANO',
            quantidade: 1,
            valorUnitario: sv.valorAnual,
            dataInicio: startItemYM,
            dataFim: interv.dataFimOperacao || planEndYM,
            ocorrenciasNoPeriodo: 0,
            valorAnualizado: 0,
            valorTotalProjetado: 0,
            origemCalculo: 'automatico',
            quantidadeOriginal: 1,
            valorUnitarioOriginal: sv.valorAnual,
          });
        } else {
          const vagasModeloRef = Math.max(1, modeloAssociado?.capacidadeAlunos || vagasBaseRefIncremental);
          const salasModeloRef = Math.max(1, salasModeloAssociado || salasBaseRefIncremental);
          const criterio: CriterioProporcionalidade = isAdaptacao ? 'por_vaga' : 'por_ambiente';
          const num = isAdaptacao ? interv.vagasAdicionais : interv.salasAdicionais;
          const den = isAdaptacao ? vagasModeloRef : salasModeloRef;
          const fatorExato = num / den; // Sem truncamento .toFixed(3)!
          const pctFmt = (fatorExato * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

          servicos.push({
            id: `srv-${interv.id}-${sv.id}`,
            categoria: 'servico',
            intervencaoCusteioId: interv.id,
            catalogoRefId: refKey,
            descricao: sv.descricao,
            tipoServico: classifyTipoServico(sv.descricao),
            criterioCalculo: criterio,
            fatorProporcional: fatorExato,
            numeradorProporcao: num,
            denominadorProporcao: den,
            unidadeProporcao: isAdaptacao ? 'vagas' : 'salas',
            memoriaCalculo: isAdaptacao
              ? `Proporcional ao consumo de +${num} de ${den} vagas do modelo ${modeloAssociado?.nome || 'ref.'} (${pctFmt}%)`
              : `Proporcional a +${num} de ${den} salas do modelo ${modeloAssociado?.nome || 'ref.'} (${pctFmt}%)`,
            naturezaCusto: 'exclusivo_intervencao',
            periodicidade: 'anual',
            unidadeMedida: 'ANO',
            quantidade: 1,
            valorUnitario: sv.valorAnual,
            dataInicio: startItemYM,
            dataFim: interv.dataFimOperacao || planEndYM,
            ocorrenciasNoPeriodo: 0,
            valorAnualizado: sv.valorAnual * fatorExato,
            valorTotalProjetado: 0,
            origemCalculo: 'automatico',
            quantidadeOriginal: 1,
            valorUnitarioOriginal: sv.valorAnual,
          });
        }
      });
    }

    // ── B. AQUISIÇÕES ANUAIS DE CONSUMO (conforme configurado no Modelo da Creche) ──
    // Nota: Mobiliário e Equipamentos dos Ambientes pertencem à implantação física da Obra/Construção (CAPEX)
    // e ficam separados em Ambientes do Modelo / Plano de Expansão, não sendo misturados aqui em Aquisições.
    const capBaseModelo = Math.max(1, modeloAssociado?.capacidadeAlunos || vagasBaseRefIncremental);
    const profBaseModelo = Math.max(
      1,
      (modeloAssociado?.pessoal || []).reduce((s, p) => s + p.quantidade, 0) || 21
    );

    baseAquisicoesList.forEach(aq => {
      const refKey = `aq-rec:${aq.descricao.toUpperCase()}`;
      const manual = hasManualOverride(manualAquisicoes, interv.id, refKey);
      if (manual) {
        aquisicoes.push({ ...manual });
        return;
      }

      const isUniforme =
        aq.descricao.toLowerCase().includes('uniforme') ||
        aq.descricao.toLowerCase().includes('epi');

      let criterio: CriterioProporcionalidade = 'por_vaga';
      let fatorExato = 1;
      let numProp = interv.vagasAdicionais;
      let denProp = capBaseModelo;
      let unidProp = 'vagas';
      let memoria = '';

      if (isUniforme) {
        criterio = 'por_profissional';
        numProp = qtdProfissionaisDaInterv;
        denProp = profBaseModelo;
        unidProp = 'prof.';
        fatorExato = numProp / denProp;
        const pctFmt = (fatorExato * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        memoria =
          fatorExato === 1
            ? `Custeio anual integral para os ${numProp} profissionais do quadro`
            : `Proporcional aos ${numProp} de ${denProp} profissionais do modelo base (${pctFmt}%)`;
      } else {
        numProp = interv.vagasAdicionais;
        denProp = capBaseModelo;
        unidProp = 'vagas';
        fatorExato = numProp / denProp; // Exato, sem .toFixed(3)!
        criterio = interv.escopo === 'unidade_completa' && fatorExato === 1 ? 'por_unidade' : 'por_vaga';
        const pctFmt = (fatorExato * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        const valorPorVaga = (aq.valorUnitario / denProp).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });
        memoria =
          fatorExato === 1
            ? `Custeio anual integral para ${numProp} vagas (${valorPorVaga}/vaga/ano)`
            : `${numProp} de ${denProp} vagas (${pctFmt}% · ${valorPorVaga}/vaga/ano)`;
      }

      aquisicoes.push({
        id: `aq-rec-${interv.id}-${aq.id}`,
        categoria: 'aquisicao',
        tipoAquisicao: 'recorrente_manutencao',
        subcategoriaAquisicao: classifySubcategoriaAquisicao(aq.descricao),
        intervencaoCusteioId: interv.id,
        catalogoRefId: refKey,
        descricao: aq.descricao,
        criterioCalculo: criterio,
        fatorProporcional: fatorExato,
        numeradorProporcao: criterio === 'por_unidade' ? 1 : numProp,
        denominadorProporcao: criterio === 'por_unidade' ? 1 : denProp,
        unidadeProporcao: criterio === 'por_unidade' ? 'unid.' : unidProp,
        memoriaCalculo: memoria,
        naturezaCusto: 'exclusivo_intervencao',
        periodicidade: 'anual',
        unidadeMedida: 'ANO',
        quantidade: 1,
        valorUnitario: aq.valorUnitario,
        dataInicio: startItemYM,
        dataFim: interv.dataFimOperacao || planEndYM,
        ocorrenciasNoPeriodo: 0,
        valorAnualizado: aq.valorUnitario * fatorExato,
        valorTotalProjetado: 0,
        origemCalculo: 'automatico',
        quantidadeOriginal: 1,
        valorUnitarioOriginal: aq.valorUnitario,
      });
    });
  }

  return { mobiliario, servicos, aquisicoes, pessoal };
}

// ─── Projeção Temporal e Financeira (Mês a Mês / Ano a Ano) ────────────────

export interface ResultadoProjecaoCusteio {
  mobiliario: ItemCusteioMobiliario[];
  servicos: ItemCusteioServico[];
  aquisicoes: ItemCusteioAquisicao[];
  pessoal: ItemCusteioPessoal[];
  cronogramaMensal: LinhaCronogramaMensal[];
  cronogramaAnual: LinhaCronogramaAnual[];
  resumoPorIntervencao: ResumoPorIntervencao[];
  resumoFinanceiro: ResumoFinanceiroCusteio;
}

export function calcularBaselineAutomaticoPeriodo(
  dataInicio: string,
  dataFim: string,
  intervencoes: IntervencaoCusteioVinculada[],
  catalogos?: CatalogosCusteio
): number {
  const cats = catalogos || loadCatalogosCusteio();
  const autoGerados = gerarEstimativaItensProporcionais(
    intervencoes,
    cats,
    dataInicio,
    dataFim,
    undefined,
    false
  );
  const projBase = calcularProjecaoPlanoCusteio(
    dataInicio,
    dataFim,
    intervencoes,
    autoGerados.servicos,
    autoGerados.aquisicoes,
    autoGerados.pessoal,
    {
      taxaReajusteAnualServicos: 0,
      taxaReajusteAnualAquisicoes: 0,
      taxaReajusteAnualPessoal: 0,
    },
    0, // evita recursão
    autoGerados.mobiliario
  );
  return projBase.resumoFinanceiro.totalGeralPeriodo;
}

export function calcularProjecaoPlanoCusteio(
  dataInicio: string,
  dataFim: string,
  intervencoes: IntervencaoCusteioVinculada[],
  servicosIn: ItemCusteioServico[],
  aquisicoesIn: ItemCusteioAquisicao[],
  pessoalIn: ItemCusteioPessoal[],
  parametros: ParametrosSimulacaoCusteio,
  totalInicialAutomaticoRef?: number,
  mobiliarioIn?: ItemCusteioMobiliario[]
): ResultadoProjecaoCusteio {
  const mesesPlano = listMonthsBetween(dataInicio, dataFim);
  const { year: anoBase } = parseYM(dataInicio);
  const mapInterv = new Map(intervencoes.map(i => [i.id, i]));

  // Garantir que todo plano tenha os itens de Mobiliário & Equipamentos dos Ambientes do Modelo
  const baseMobiliarioIn: ItemCusteioMobiliario[] =
    mobiliarioIn && mobiliarioIn.length > 0
      ? mobiliarioIn
      : gerarEstimativaItensProporcionais(
          intervencoes,
          loadCatalogosCusteio(),
          dataInicio,
          dataFim,
          undefined,
          false
        ).mobiliario;

  // Contagem real de profissionais por intervenção para atualizar itens automáticos "por_profissional"
  const profPorIntervMap = new Map<string, number>();
  pessoalIn.forEach(p => {
    profPorIntervMap.set(
      p.intervencaoCusteioId,
      (profPorIntervMap.get(p.intervencaoCusteioId) || 0) + (p.quantidade || 0)
    );
  });

  const cronogramaMap = new Map<string, LinhaCronogramaMensal>();
  mesesPlano.forEach(ym => {
    const { year, month } = parseYM(ym);
    cronogramaMap.set(ym, {
      competencia: ym,
      ano: year,
      mes: month,
      servicos: 0,
      aquisicoesPontuais: 0,
      aquisicoesRecorrentes: 0,
      pessoal: 0,
      total: 0,
      porIntervencao: {},
    });
  });

  const addToMonth = (
    ym: string,
    intervencaoId: string,
    bucket: 'servicos' | 'aquisicoesPontuais' | 'aquisicoesRecorrentes' | 'pessoal',
    amount: number
  ) => {
    const row = cronogramaMap.get(ym);
    if (!row || amount === 0) return;
    row[bucket] += amount;
    row.total += amount;
    row.porIntervencao[intervencaoId] = (row.porIntervencao[intervencaoId] || 0) + amount;
  };

  // No Plano de Custeio a unidade ativa opera dentro do Período do Plano de Custeio.
  // Se uma data legada estiver fora da vigência (ex.: 2030-01 num plano até 2029-12), alinha ao início do plano.
  const getEffectiveWindow = (intervencaoId: string, _itemInicio?: string, _itemFim?: string) => {
    const interv = mapInterv.get(intervencaoId);
    if (interv && !interv.ativoNoCusteio) {
      return { active: false, start: dataInicio, end: dataInicio, opStart: dataInicio };
    }
    const rawOpStart = interv?.dataInicioOperacao || dataInicio;
    const opStart =
      rawOpStart >= dataInicio && rawOpStart <= dataFim ? rawOpStart : dataInicio;
    const rawOpEnd = interv?.dataFimOperacao || dataFim;
    const opEnd =
      rawOpEnd >= opStart && rawOpEnd <= dataFim ? rawOpEnd : dataFim;
    return {
      active: opStart <= opEnd,
      start: opStart,
      end: opEnd,
      opStart,
    };
  };

  // 0. Processar Mobiliário & Equipamentos dos Ambientes (Implantação Única)
  const mobiliario: ItemCusteioMobiliario[] = baseMobiliarioIn.map(item => {
    const interv = mapInterv.get(item.intervencaoCusteioId);
    const isAtivo = !interv || interv.ativoNoCusteio;
    const incluidoPorInterv =
      !interv || interv.escopoImplantacaoMobiliario !== 'contemplado_no_capex_obra';
    const incluidoEfetivo = Boolean(isAtivo && incluidoPorInterv && item.incluidoNoCusteio !== false);

    const valorBase = item.valorUnitario * item.quantidade;
    const win = getEffectiveWindow(item.intervencaoCusteioId, item.dataInicio, item.dataFim);
    const mesImplantacao = win.start;

    if (!incluidoEfetivo || !win.active || valorBase <= 0) {
      return {
        ...item,
        incluidoNoCusteio: incluidoPorInterv && item.incluidoNoCusteio !== false,
        ocorrenciasNoPeriodo: 0,
        valorAnualizado: valorBase,
        valorTotalProjetado: 0,
      };
    }

    addToMonth(mesImplantacao, item.intervencaoCusteioId, 'aquisicoesPontuais', valorBase);

    return {
      ...item,
      incluidoNoCusteio: true,
      dataInicio: mesImplantacao,
      dataFim: mesImplantacao,
      ocorrenciasNoPeriodo: 1,
      valorAnualizado: valorBase,
      valorTotalProjetado: valorBase,
    };
  });

  const resolveFatorEfetivo = (item: ItemCusteioBase): {
    fator: number;
    numerador?: number;
  } => {
    if (item.criterioCalculo === 'percentual_utilizacao') {
      return { fator: (item.percentualRateio ?? 0) / 100 };
    }
    if (
      item.criterioCalculo === 'valor_fixo_incremental' ||
      item.criterioCalculo === 'manual' ||
      item.criterioCalculo === 'por_unidade'
    ) {
      return { fator: 1 };
    }
    if (item.criterioCalculo === 'por_profissional') {
      const den = Math.max(1, item.denominadorProporcao || 21);
      const qtdReal = profPorIntervMap.get(item.intervencaoCusteioId) ?? (item.numeradorProporcao || 0);
      return { fator: qtdReal / den, numerador: qtdReal };
    }
    // Se possui numerador/denominador salvos e não foi sobrescrito manualmente no fator, usa razão exata!
    if (
      item.origemCalculo === 'automatico' &&
      item.numeradorProporcao !== undefined &&
      item.denominadorProporcao &&
      item.denominadorProporcao > 0
    ) {
      return { fator: item.numeradorProporcao / item.denominadorProporcao };
    }
    return { fator: item.fatorProporcional ?? 1 };
  };

  // 1. Processar Serviços
  const servicos = servicosIn.map(item => {
    const { fator: fatorEfetivo, numerador } = resolveFatorEfetivo(item);
    const updatedItem =
      numerador !== undefined
        ? { ...item, fatorProporcional: fatorEfetivo, numeradorProporcao: numerador }
        : item;

    const baseAnual =
      updatedItem.periodicidade === 'mensal'
        ? updatedItem.valorUnitario * updatedItem.quantidade * fatorEfetivo * 12
        : updatedItem.valorUnitario * updatedItem.quantidade * fatorEfetivo;

    const win = getEffectiveWindow(
      updatedItem.intervencaoCusteioId,
      updatedItem.dataInicio,
      updatedItem.dataFim
    );
    if (!win.active || baseAnual <= 0) {
      return {
        ...updatedItem,
        ocorrenciasNoPeriodo: 0,
        valorAnualizado: baseAnual,
        valorTotalProjetado: 0,
      };
    }

    if (updatedItem.periodicidade === 'unica') {
      const targetYM = win.start;
      const { year } = parseYM(targetYM);
      const inflFactor = Math.pow(
        1 + (parametros.taxaReajusteAnualServicos || 0) / 100,
        Math.max(0, year - anoBase)
      );
      const val = cronogramaMap.has(targetYM)
        ? updatedItem.valorUnitario * updatedItem.quantidade * fatorEfetivo * inflFactor
        : 0;
      addToMonth(targetYM, updatedItem.intervencaoCusteioId, 'servicos', val);
      return {
        ...updatedItem,
        ocorrenciasNoPeriodo: val > 0 ? 1 : 0,
        valorAnualizado: val,
        valorTotalProjetado: val,
      };
    }

    const activeMonths = listMonthsBetween(win.start, win.end);
    let totalItem = 0;
    activeMonths.forEach(ym => {
      const { year } = parseYM(ym);
      const inflFactor = Math.pow(
        1 + (parametros.taxaReajusteAnualServicos || 0) / 100,
        Math.max(0, year - anoBase)
      );
      const valMes = (baseAnual / 12) * inflFactor;
      totalItem += valMes;
      addToMonth(ym, updatedItem.intervencaoCusteioId, 'servicos', valMes);
    });

    return {
      ...updatedItem,
      ocorrenciasNoPeriodo: activeMonths.length,
      valorAnualizado: baseAnual,
      valorTotalProjetado: totalItem,
    };
  });

    // 2. Processar Aquisições (Consumo Anual do Modelo; filtra eventuais itens legados de mobiliário de ambientes)
    const aquisicoes = aquisicoesIn
      .filter(item => item.subcategoriaAquisicao !== 'mobiliario_equipamento' && item.tipoAquisicao !== 'pontual_implantacao')
      .map(item => {
        const win = getEffectiveWindow(item.intervencaoCusteioId, item.dataInicio, item.dataFim);

        if (item.periodicidade === 'unica' || item.tipoAquisicao === 'pontual_implantacao') {
          // Aquisições pontuais usam diretamente Quantidade Física × Valor Unitário (100%, sem fator redutor)
          const valorUnicoBase = item.valorUnitario * item.quantidade;
          const mesOcorrencia = maxYM(win.opStart, item.dataInicio || win.opStart);
          const interv = mapInterv.get(item.intervencaoCusteioId);
          const isAtivo = !interv || interv.ativoNoCusteio;
          const dentroDoPeriodo = isAtivo && mesOcorrencia >= dataInicio && mesOcorrencia <= dataFim;

          if (!dentroDoPeriodo || valorUnicoBase <= 0) {
            return {
              ...item,
              fatorProporcional: 1,
              periodicidade: 'unica' as const,
              ocorrenciasNoPeriodo: 0,
              valorAnualizado: valorUnicoBase,
              valorTotalProjetado: 0,
            };
          }

          const { year } = parseYM(mesOcorrencia);
          const inflFactor = Math.pow(
            1 + (parametros.taxaReajusteAnualAquisicoes || 0) / 100,
            Math.max(0, year - anoBase)
          );
          const totalUnico = valorUnicoBase * inflFactor;
          addToMonth(mesOcorrencia, item.intervencaoCusteioId, 'aquisicoesPontuais', totalUnico);

          return {
            ...item,
            fatorProporcional: 1,
            periodicidade: 'unica' as const,
            ocorrenciasNoPeriodo: 1,
            valorAnualizado: valorUnicoBase,
            valorTotalProjetado: totalUnico,
          };
        }

        // Recorrente (anual / mensal)
        const { fator: fatorEfetivo, numerador } = resolveFatorEfetivo(item);
        const updatedItem =
          numerador !== undefined
            ? { ...item, fatorProporcional: fatorEfetivo, numeradorProporcao: numerador }
            : item;

        const baseAnual =
          updatedItem.periodicidade === 'mensal'
            ? updatedItem.valorUnitario * updatedItem.quantidade * fatorEfetivo * 12
            : updatedItem.valorUnitario * updatedItem.quantidade * fatorEfetivo;

        if (!win.active || baseAnual <= 0) {
          return {
            ...updatedItem,
            ocorrenciasNoPeriodo: 0,
            valorAnualizado: baseAnual,
            valorTotalProjetado: 0,
          };
        }

        const activeMonths = listMonthsBetween(win.start, win.end);
        let totalItem = 0;
        activeMonths.forEach(ym => {
          const { year } = parseYM(ym);
          const inflFactor = Math.pow(
            1 + (parametros.taxaReajusteAnualAquisicoes || 0) / 100,
            Math.max(0, year - anoBase)
          );
          const valMes = (baseAnual / 12) * inflFactor;
          totalItem += valMes;
          addToMonth(ym, updatedItem.intervencaoCusteioId, 'aquisicoesRecorrentes', valMes);
        });

        return {
          ...updatedItem,
          ocorrenciasNoPeriodo: activeMonths.length,
          valorAnualizado: baseAnual,
          valorTotalProjetado: totalItem,
        };
      });

    // 3. Processar Pessoal e Folha de Pagamento
    const pessoal = pessoalIn.map(item => {
      const mensalUnit =
        (item.remuneracaoBase || 0) + (item.auxilios || 0) + (item.patronalUnitario || 0);
      const anualUnit = mensalUnit * 13.33; // 12 salários + 13º + 1/3 constitucional de férias
      const fatorEfetivo =
        item.criterioCalculo === 'percentual_utilizacao'
          ? (item.percentualRateio ?? 0) / 100
          : item.fatorProporcional ?? 1;

      const baseAnual = anualUnit * item.quantidade * fatorEfetivo;
      const win = getEffectiveWindow(item.intervencaoCusteioId, item.dataInicio, item.dataFim);

      if (!win.active || baseAnual <= 0 || item.quantidade <= 0) {
        return {
          ...item,
          custoMensalUnitario: mensalUnit,
          custoAnualUnitario: anualUnit,
          valorUnitario: anualUnit,
          ocorrenciasNoPeriodo: 0,
          valorAnualizado: baseAnual,
          valorTotalProjetado: 0,
        };
      }

      const activeMonths = listMonthsBetween(win.start, win.end);
      let totalItem = 0;
      activeMonths.forEach(ym => {
        const { year } = parseYM(ym);
        const inflFactor = Math.pow(
          1 + (parametros.taxaReajusteAnualPessoal || 0) / 100,
          Math.max(0, year - anoBase)
        );
        const valMes = (baseAnual / 12) * inflFactor;
        totalItem += valMes;
        addToMonth(ym, item.intervencaoCusteioId, 'pessoal', valMes);
      });

      return {
        ...item,
        custoMensalUnitario: mensalUnit,
        custoAnualUnitario: anualUnit,
        valorUnitario: anualUnit,
        ocorrenciasNoPeriodo: activeMonths.length,
        valorAnualizado: baseAnual,
        valorTotalProjetado: totalItem,
      };
    });

    const cronogramaMensal = Array.from(cronogramaMap.values());

    // Agrupar Cronograma Anual
    const anosMap = new Map<number, LinhaCronogramaAnual>();
    cronogramaMensal.forEach(m => {
      let row = anosMap.get(m.ano);
      if (!row) {
        row = {
          ano: m.ano,
          mesesNoPlano: 0,
          servicos: 0,
          aquisicoesPontuais: 0,
          aquisicoesRecorrentes: 0,
          pessoal: 0,
          total: 0,
          porIntervencao: {},
        };
        anosMap.set(m.ano, row);
      }
      row.mesesNoPlano += 1;
      row.servicos += m.servicos;
      row.aquisicoesPontuais += m.aquisicoesPontuais;
      row.aquisicoesRecorrentes += m.aquisicoesRecorrentes;
      row.pessoal += m.pessoal;
      row.total += m.total;
      Object.entries(m.porIntervencao).forEach(([intId, val]) => {
        row!.porIntervencao[intId] = (row!.porIntervencao[intId] || 0) + val;
      });
    });
    const cronogramaAnual = Array.from(anosMap.values()).sort((a, b) => a.ano - b.ano);

    // Resumo por Intervenção / Unidade Escolar
    const resumoPorIntervencao: ResumoPorIntervencao[] = intervencoes.map(interv => {
      const mob = mobiliario
        .filter(m => m.intervencaoCusteioId === interv.id)
        .reduce((acc, m) => acc + m.valorTotalProjetado, 0);
      const custoBaseMobiliario = mobiliario
        .filter(m => m.intervencaoCusteioId === interv.id)
        .reduce((acc, m) => acc + m.valorAnualizado, 0);
      const srv = servicos
        .filter(s => s.intervencaoCusteioId === interv.id)
        .reduce((acc, s) => acc + s.valorTotalProjetado, 0);
      const aqRec = aquisicoes
        .filter(a => a.intervencaoCusteioId === interv.id && a.tipoAquisicao === 'recorrente_manutencao')
        .reduce((acc, a) => acc + a.valorTotalProjetado, 0);
      const pes = pessoal
        .filter(p => p.intervencaoCusteioId === interv.id)
        .reduce((acc, p) => acc + p.valorTotalProjetado, 0);

      const custoAnualServicos = servicos
        .filter(s => s.intervencaoCusteioId === interv.id && s.periodicidade !== 'unica')
        .reduce((acc, s) => acc + s.valorAnualizado, 0);
      const custoAnualAquisicoes = aquisicoes
        .filter(a => a.intervencaoCusteioId === interv.id && a.tipoAquisicao === 'recorrente_manutencao')
        .reduce((acc, a) => acc + a.valorAnualizado, 0);
      const custoAnualPessoal = pessoal
        .filter(p => p.intervencaoCusteioId === interv.id)
        .reduce((acc, p) => acc + p.valorAnualizado, 0);

      const custoAnualizadoRegime =
        custoAnualServicos + custoAnualAquisicoes + custoAnualPessoal;

      const win = getEffectiveWindow(interv.id);
      const mesesOp =
        interv.ativoNoCusteio && win.active ? listMonthsBetween(win.start, win.end).length : 0;
      const totalPeriodo = mob + srv + aqRec + pes;

      return {
        intervencaoId: interv.id,
        nome: interv.nomeUnidadeOuObra,
        escopo: interv.escopo,
        subtipo: interv.subtipoIntervencao,
        dataInicioOperacao: win.opStart,
        mesesOperacaoNoPeriodo: mesesOp,
        salas: interv.ativoNoCusteio ? interv.salasAdicionais : 0,
        vagas: interv.ativoNoCusteio ? interv.vagasAdicionais : 0,
        turmas: interv.ativoNoCusteio ? interv.turmasPrevistas : 0,
        mobiliario: mob,
        custoBaseMobiliario,
        servicos: srv,
        aquisicoesPontuais: mob,
        aquisicoesRecorrentes: aqRec,
        pessoal: pes,
        totalPeriodo,
        custoAnualServicos: interv.ativoNoCusteio ? custoAnualServicos : 0,
        custoAnualAquisicoes: interv.ativoNoCusteio ? custoAnualAquisicoes : 0,
        custoAnualPessoal: interv.ativoNoCusteio ? custoAnualPessoal : 0,
        custoAnualizadoRegime: interv.ativoNoCusteio ? custoAnualizadoRegime : 0,
        custoPorVagaAno:
          interv.ativoNoCusteio && interv.vagasAdicionais > 0
            ? custoAnualizadoRegime / interv.vagasAdicionais
            : 0,
      };
    });

    // Totais consolidados (100% idênticos à soma das linhas de resumoPorIntervencao)
    const totalMobiliarioPeriodo = mobiliario.reduce((s, i) => s + i.valorTotalProjetado, 0);
    const totalServicosPeriodo = servicos.reduce((s, i) => s + i.valorTotalProjetado, 0);
    const totalAquisicoesPontuaisPeriodo = totalMobiliarioPeriodo;
    const totalAquisicoesRecorrentesPeriodo = aquisicoes
      .filter(a => a.tipoAquisicao === 'recorrente_manutencao')
      .reduce((s, i) => s + i.valorTotalProjetado, 0);
    const totalPessoalPeriodo = pessoal.reduce((s, i) => s + i.valorTotalProjetado, 0);
    const totalGeralPeriodo =
      totalMobiliarioPeriodo +
      totalServicosPeriodo +
      totalAquisicoesRecorrentesPeriodo +
      totalPessoalPeriodo;

    const numMesesPlano = Math.max(1, mesesPlano.length);
    const custoMedioMensal = totalGeralPeriodo / numMesesPlano;
    const custoMedioAnual = custoMedioMensal * 12;

    const intervAtivas = intervencoes.filter(i => i.ativoNoCusteio);
    const totalVagasContempladas = intervAtivas.reduce((s, i) => s + i.vagasAdicionais, 0);
    const totalSalasContempladas = intervAtivas.reduce((s, i) => s + i.salasAdicionais, 0);
    const totalProfissionais = pessoal
      .filter(p => {
        const iv = mapInterv.get(p.intervencaoCusteioId);
        return !iv || iv.ativoNoCusteio;
      })
      .reduce((s, p) => s + p.quantidade, 0);

    const custoAnualRegimePleno = resumoPorIntervencao.reduce(
      (s, r) => s + r.custoAnualizadoRegime,
      0
    );
    const custoPorVagaAdicionalAno =
      totalVagasContempladas > 0 ? custoAnualRegimePleno / totalVagasContempladas : 0;

    const baselineCalculado =
      totalInicialAutomaticoRef !== undefined
        ? totalInicialAutomaticoRef === 0
          ? totalGeralPeriodo
          : totalInicialAutomaticoRef
        : calcularBaselineAutomaticoPeriodo(dataInicio, dataFim, intervencoes);

    const resumoFinanceiro: ResumoFinanceiroCusteio = {
      totalMobiliarioPeriodo,
      totalServicosPeriodo,
      totalAquisicoesPontuaisPeriodo,
      totalAquisicoesRecorrentesPeriodo,
      totalPessoalPeriodo,
      totalGeralPeriodo,
      custoAnualRegimePleno,
      custoMedioAnual,
      custoMedioMensal,
      custoPorVagaAdicionalAno,
      totalVagasContempladas,
      totalSalasContempladas,
      totalProfissionais,
      totalInicialAutomatico: baselineCalculado,
    };

    return {
      mobiliario,
      servicos,
      aquisicoes,
      pessoal,
      cronogramaMensal,
      cronogramaAnual,
      resumoPorIntervencao,
      resumoFinanceiro,
    };
  }

export function criarNovoPlanoCusteioAutomatico(params: {
    planoExpansao: ExpansionPlan;
    nome: string;
    descricao: string;
    cenarioLabel?: string;
    dataInicio: string; // YYYY-MM
    dataFim: string;    // YYYY-MM
    responsavelNome?: string;
  }): PlanoCusteio {
    const catalogos = loadCatalogosCusteio();
    const { year: anoInicio } = parseYM(params.dataInicio);
    const { year: anoFim } = parseYM(params.dataFim);

    const intervencoes = extrairIntervencoesDoPlano(
      params.planoExpansao,
      catalogos,
      params.dataInicio
    );

    const configSalas: ConfiguracaoSala[] = intervencoes.map(iv => ({
      id: `cs-${iv.id}`,
      origem: iv.origemTipo,
      origemId: iv.origemId,
      nome: iv.nomeUnidadeOuObra,
      numeroTurmas: iv.turmasPrevistas,
      etapas: iv.etapasAtendidas,
    }));

    const gerados = gerarEstimativaItensProporcionais(
      intervencoes,
      catalogos,
      params.dataInicio,
      params.dataFim,
      undefined,
      false
    );

    const parametrosSimulacao: ParametrosSimulacaoCusteio = {
      taxaReajusteAnualServicos: 0,
      taxaReajusteAnualAquisicoes: 0,
      taxaReajusteAnualPessoal: 0,
      observacoesCenario: '',
      valorAlunoAnoFundebIntegral: 10250,
      valorAlunoAnoFundebParcial: 6300,
      percentualMatriculasTempoIntegral: 80,
      repassePerCapitaPnaeAno: 540,
    };

    const projecao = calcularProjecaoPlanoCusteio(
      params.dataInicio,
      params.dataFim,
      intervencoes,
      gerados.servicos,
      gerados.aquisicoes,
      gerados.pessoal,
      parametrosSimulacao,
      0,
      gerados.mobiliario
    );

    const hoje = new Date().toISOString().split('T')[0];

    return {
      id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      planoExpansaoId: params.planoExpansao.id,
      nome: params.nome,
      descricao: params.descricao,
      cenarioLabel: params.cenarioLabel || 'Cenário Base',
      versao: 1,
      status: 'Em Análise',
      dataInicio: params.dataInicio,
      dataFim: params.dataFim,
      anoInicio,
      anoFim,
      responsavelNome:
        params.responsavelNome || params.planoExpansao.responsible || 'Equipe Técnica SEMED',
      dataCriacao: hoje,
      dataAtualizacao: hoje,
      intervencoes,
      configSalas,
      mobiliario: projecao.mobiliario,
      servicos: projecao.servicos,
      aquisicoes: projecao.aquisicoes,
      pessoal: projecao.pessoal,
      parametrosSimulacao,
      resumoFinanceiro: projecao.resumoFinanceiro,
    };
  }

  // ─── Sincronização Reativa Expansão ↔ Custeio e Sustentabilidade Fiscal ────

  export interface DivergenciaExpansaoCusteio {
    tipo:
    | 'nova_intervencao'
    | 'intervencao_removida'
    | 'mudanca_fisica'
    | 'mudanca_cronograma'
    | 'operacao_anterior_vigencia';
    origemId: string;
    nome: string;
    detalhe: string;
    dataSugeridaInicioCusteio?: string;
  }

  export function detectarDivergenciasExpansaoCusteio(
    planExpansao: ExpansionPlan | undefined,
    planoCusteio: PlanoCusteio,
    catalogos?: CatalogosCusteio
  ): DivergenciaExpansaoCusteio[] {
    if (!planExpansao) return [];
    const cats = catalogos || loadCatalogosCusteio();
    const extraidas = extrairIntervencoesDoPlano(
      planExpansao,
      cats,
      planoCusteio.dataInicio,
      planoCusteio.intervencoes,
      true
    );

    const divergencias: DivergenciaExpansaoCusteio[] = [];
    const mapAtuais = new Map(
      planoCusteio.intervencoes.map(iv => [`${iv.origemTipo}:${iv.origemId}`, iv])
    );
    const mapNovas = new Map(extraidas.map(iv => [`${iv.origemTipo}:${iv.origemId}`, iv]));

    // 1. Novas intervenções ou mudanças nas existentes
    extraidas.forEach(nova => {
      const key = `${nova.origemTipo}:${nova.origemId}`;
      const atual = mapAtuais.get(key);
      if (!atual) {
        divergencias.push({
          tipo: 'nova_intervencao',
          origemId: nova.origemId,
          nome: nova.nomeUnidadeOuObra,
          detalhe: `Nova intervenção cadastrada no Plano de Expansão (+${nova.salasAdicionais} salas, +${nova.vagasAdicionais} vagas).`,
        });
        return;
      }

      if (
        atual.salasAdicionais !== nova.salasAdicionais ||
        atual.vagasAdicionais !== nova.vagasAdicionais ||
        atual.modeloCrecheId !== nova.modeloCrecheId
      ) {
        divergencias.push({
          tipo: 'mudanca_fisica',
          origemId: nova.origemId,
          nome: nova.nomeUnidadeOuObra,
          detalhe: `Escopo físico alterado no Plano de Expansão: de ${atual.salasAdicionais} salas / ${atual.vagasAdicionais} vagas para ${nova.salasAdicionais} salas / ${nova.vagasAdicionais} vagas.`,
        });
      }
    });

    // 2. Intervenções removidas do Plano de Expansão
    planoCusteio.intervencoes.forEach(atual => {
      const key = `${atual.origemTipo}:${atual.origemId}`;
      if (!mapNovas.has(key)) {
        divergencias.push({
          tipo: 'intervencao_removida',
          origemId: atual.origemId,
          nome: atual.nomeUnidadeOuObra,
          detalhe: `Esta obra/ação foi removida do Plano de Expansão, mas ainda consta no Plano de Custeio.`,
        });
      }
    });

    return divergencias;
  }

  export function sincronizarPlanoCusteioComExpansao(
    planoCusteio: PlanoCusteio,
    planExpansao: ExpansionPlan,
    catalogos?: CatalogosCusteio,
    ajustarDataInicioCusteio: boolean = false
  ): PlanoCusteio {
    const cats = catalogos || loadCatalogosCusteio();
    const novasIntervencoes = extrairIntervencoesDoPlano(
      planExpansao,
      cats,
      planoCusteio.dataInicio,
      planoCusteio.intervencoes,
      true
    );

    let dataInicio = planoCusteio.dataInicio;
    if (ajustarDataInicioCusteio) {
      const ativas = novasIntervencoes.filter(i => i.ativoNoCusteio);
      if (ativas.length > 0) {
        const menorOp = minYM(...ativas.map(i => i.dataInicioOperacao));
        if (menorOp < dataInicio) {
          dataInicio = menorOp;
        }
      }
    }

    const validIds = new Set(novasIntervencoes.map(i => i.id));
    validIds.add('global');

    const gerados = gerarEstimativaItensProporcionais(
      novasIntervencoes,
      cats,
      dataInicio,
      planoCusteio.dataFim,
      {
        mobiliario: (planoCusteio.mobiliario || []).filter(m => validIds.has(m.intervencaoCusteioId)),
        servicos: planoCusteio.servicos.filter(s => validIds.has(s.intervencaoCusteioId)),
        aquisicoes: planoCusteio.aquisicoes.filter(a => validIds.has(a.intervencaoCusteioId)),
        pessoal: planoCusteio.pessoal.filter(p => validIds.has(p.intervencaoCusteioId)),
      },
      true
    );

    const baselineNovo = calcularBaselineAutomaticoPeriodo(
      dataInicio,
      planoCusteio.dataFim,
      novasIntervencoes,
      cats
    );

    const projecao = calcularProjecaoPlanoCusteio(
      dataInicio,
      planoCusteio.dataFim,
      novasIntervencoes,
      gerados.servicos,
      gerados.aquisicoes,
      gerados.pessoal,
      planoCusteio.parametrosSimulacao,
      baselineNovo,
      gerados.mobiliario
    );

    const { year: anoInicio } = parseYM(dataInicio);
    const { year: anoFim } = parseYM(planoCusteio.dataFim);

    return {
      ...planoCusteio,
      dataInicio,
      anoInicio,
      anoFim,
      dataAtualizacao: new Date().toISOString().split('T')[0],
      intervencoes: novasIntervencoes,
      configSalas: novasIntervencoes.map(iv => ({
        id: `cs-${iv.id}`,
        origem: iv.origemTipo,
        origemId: iv.origemId,
        nome: iv.nomeUnidadeOuObra,
        numeroTurmas: iv.turmasPrevistas,
        etapas: iv.etapasAtendidas,
      })),
      mobiliario: projecao.mobiliario,
      servicos: projecao.servicos,
      aquisicoes: projecao.aquisicoes,
      pessoal: projecao.pessoal,
      resumoFinanceiro: projecao.resumoFinanceiro,
    };
  }

  export interface LinhaFluxoIntegradoTco {
    ano: number;
    capexObrasAcoes: number;
    opexImplantacao: number;
    opexServicos: number;
    opexAquisicoesRecorrentes: number;
    opexPessoal: number;
    totalOpex: number;
    totalTcoMunicipal: number;
    vagasEmOperacaoMediaAno: number;
    receitaIncrementalFundeb: number;
    receitaIncrementalPnae: number;
    receitaVinculadaTotal: number;
    esforcoLiquidoTesouroMde: number;
  }

  export interface ResumoSustentabilidadeFiscal {
    valorAlunoAnoFundebIntegral: number;
    valorAlunoAnoFundebParcial: number;
    percentualMatriculasTempoIntegral: number;
    repassePerCapitaPnaeAno: number;
    valorMedioAlunoAnoFundeb: number;
    repasseAnualFundebRegime: number;
    repasseAnualPnaeRegime: number;
    receitaVinculadaAnualRegime: number;
    custoAnualRegimePleno: number;
    esforcoLiquidoTesouroMdeRegime: number;
    coberturaVinculadaRegimePct: number;
    folhaMagisterioAnualRegime: number;
    indiceMagisterioFundebPct: number;
    totalCapexPlanoExpansao: number;
    totalOpexPeriodoCusteio: number;
    totalTcoGlobal: number;
    fluxoIntegradoAnual: LinhaFluxoIntegradoTco[];
  }

  export function calcularSustentabilidadeFiscalCusteio(
    planoCusteio: PlanoCusteio,
    projecao: ResultadoProjecaoCusteio,
    planExpansao?: ExpansionPlan
  ): ResumoSustentabilidadeFiscal {
    const params = planoCusteio.parametrosSimulacao;
    const valorAlunoAnoFundebIntegral = params.valorAlunoAnoFundebIntegral ?? 10250;
    const valorAlunoAnoFundebParcial = params.valorAlunoAnoFundebParcial ?? 6300;
    const percentualMatriculasTempoIntegral = params.percentualMatriculasTempoIntegral ?? 80;
    const repassePerCapitaPnaeAno = params.repassePerCapitaPnaeAno ?? 540;

    const fracIntegral = Math.max(0, Math.min(100, percentualMatriculasTempoIntegral)) / 100;
    const valorMedioAlunoAnoFundeb =
      valorAlunoAnoFundebIntegral * fracIntegral +
      valorAlunoAnoFundebParcial * (1 - fracIntegral);

    const totalVagasAtivas = projecao.resumoFinanceiro.totalVagasContempladas;
    const repasseAnualFundebRegime = totalVagasAtivas * valorMedioAlunoAnoFundeb;
    const repasseAnualPnaeRegime = totalVagasAtivas * repassePerCapitaPnaeAno;
    const receitaVinculadaAnualRegime = repasseAnualFundebRegime + repasseAnualPnaeRegime;

    const custoAnualRegimePleno = projecao.resumoFinanceiro.custoAnualRegimePleno;
    const esforcoLiquidoTesouroMdeRegime = Math.max(
      0,
      custoAnualRegimePleno - receitaVinculadaAnualRegime
    );
    const coberturaVinculadaRegimePct =
      custoAnualRegimePleno > 0
        ? (receitaVinculadaAnualRegime / custoAnualRegimePleno) * 100
        : 0;

    const mapInterv = new Map(planoCusteio.intervencoes.map(i => [i.id, i]));
    const folhaMagisterioAnualRegime = projecao.pessoal.reduce((acc, p) => {
      const iv = mapInterv.get(p.intervencaoCusteioId);
      if (iv && !iv.ativoNoCusteio) return acc;
      if (p.categoriaCargo === 'pedagogico') {
        return acc + p.valorAnualizado;
      }
      return acc;
    }, 0);

    const indiceMagisterioFundebPct =
      repasseAnualFundebRegime > 0
        ? (folhaMagisterioAnualRegime / repasseAnualFundebRegime) * 100
        : 0;

    // Mapear CAPEX por ano do Plano de Expansão
    const capexPorAno = new Map<number, number>();
    let totalCapexPlanoExpansao = 0;
    if (planExpansao) {
      (planExpansao.obras || []).forEach(o => {
        (o.desembolsoPorAno || []).forEach(d => {
          capexPorAno.set(d.ano, (capexPorAno.get(d.ano) || 0) + (d.valor || 0));
          totalCapexPlanoExpansao += d.valor || 0;
        });
      });
      (planExpansao.acoesUnidades || []).forEach(a => {
        (a.desembolsoPorAno || []).forEach(d => {
          capexPorAno.set(d.ano, (capexPorAno.get(d.ano) || 0) + (d.valor || 0));
          totalCapexPlanoExpansao += d.valor || 0;
        });
      });
    }

    const anoMin = Math.min(
      planExpansao?.periodoInicio || planoCusteio.anoInicio,
      planoCusteio.anoInicio
    );
    const anoMax = Math.max(
      planExpansao?.periodoFim || planoCusteio.anoFim,
      planoCusteio.anoFim
    );

    const opexPorAno = new Map(projecao.cronogramaAnual.map(ca => [ca.ano, ca]));
    const fluxoIntegradoAnual: LinhaFluxoIntegradoTco[] = [];

    for (let ano = anoMin; ano <= anoMax; ano++) {
      const capex = capexPorAno.get(ano) || 0;
      const opex = opexPorAno.get(ano);
      const opexImplantacao = opex?.aquisicoesPontuais || 0;
      const opexServicos = opex?.servicos || 0;
      const opexAquisicoesRecorrentes = opex?.aquisicoesRecorrentes || 0;
      const opexPessoal = opex?.pessoal || 0;
      const totalOpex = opex?.total || 0;

      // Calcular vagas-mês ativas neste ano para estimar o repasse proporcional de FUNDEB/PNAE no exercício
      let vagasMesNoAno = 0;
      planoCusteio.intervencoes.forEach(iv => {
        if (!iv.ativoNoCusteio) return;
        const rawOpStart = iv.dataInicioOperacao || planoCusteio.dataInicio;
        const effOpStart =
          rawOpStart >= planoCusteio.dataInicio && rawOpStart <= planoCusteio.dataFim
            ? rawOpStart
            : planoCusteio.dataInicio;
        const rawOpEnd = iv.dataFimOperacao || planoCusteio.dataFim;
        const effOpEnd =
          rawOpEnd >= effOpStart && rawOpEnd <= planoCusteio.dataFim
            ? rawOpEnd
            : planoCusteio.dataFim;
        const startYM = maxYM(effOpStart, `${ano}-01`);
        const endYM = minYM(effOpEnd, `${ano}-12`);
        if (startYM <= endYM) {
          const mesesAtivos = listMonthsBetween(startYM, endYM).length;
          vagasMesNoAno += iv.vagasAdicionais * (mesesAtivos / 12);
        }
      });

      const receitaIncrementalFundeb = vagasMesNoAno * valorMedioAlunoAnoFundeb;
      const receitaIncrementalPnae = vagasMesNoAno * repassePerCapitaPnaeAno;
      const receitaVinculadaTotal = receitaIncrementalFundeb + receitaIncrementalPnae;
      const totalTcoMunicipal = capex + totalOpex;
      const esforcoLiquidoTesouroMde = Math.max(0, totalOpex - receitaVinculadaTotal);

      fluxoIntegradoAnual.push({
        ano,
        capexObrasAcoes: capex,
        opexImplantacao,
        opexServicos,
        opexAquisicoesRecorrentes,
        opexPessoal,
        totalOpex,
        totalTcoMunicipal,
        vagasEmOperacaoMediaAno: Math.round(vagasMesNoAno),
        receitaIncrementalFundeb,
        receitaIncrementalPnae,
        receitaVinculadaTotal,
        esforcoLiquidoTesouroMde,
      });
    }

    return {
      valorAlunoAnoFundebIntegral,
      valorAlunoAnoFundebParcial,
      percentualMatriculasTempoIntegral,
      repassePerCapitaPnaeAno,
      valorMedioAlunoAnoFundeb,
      repasseAnualFundebRegime,
      repasseAnualPnaeRegime,
      receitaVinculadaAnualRegime,
      custoAnualRegimePleno,
      esforcoLiquidoTesouroMdeRegime,
      coberturaVinculadaRegimePct,
      folhaMagisterioAnualRegime,
      indiceMagisterioFundebPct,
      totalCapexPlanoExpansao,
      totalOpexPeriodoCusteio: projecao.resumoFinanceiro.totalGeralPeriodo,
      totalTcoGlobal: totalCapexPlanoExpansao + projecao.resumoFinanceiro.totalGeralPeriodo,
      fluxoIntegradoAnual,
    };
  }
