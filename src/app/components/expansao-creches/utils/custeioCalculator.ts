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
  servicos: number;
  aquisicoesPontuais: number;
  aquisicoesRecorrentes: number;
  pessoal: number;
  totalPeriodo: number;
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
  novaCapacidade: number
): number {
  const match = (descricao || '').match(/(\d+)\s*(?:novas?\s+)?salas?/i);
  if (match && Number(match[1]) > 0) {
    return Number(match[1]);
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
  existingIntervencoes?: IntervencaoCusteioVinculada[]
): IntervencaoCusteioVinculada[] {
  const { modelos, ambientes } = catalogos;
  const mapExisting = new Map((existingIntervencoes || []).map(i => [`${i.origemTipo}:${i.origemId}`, i]));
  const configSalasPlano = plan.configSalas || [];
  const result: IntervencaoCusteioVinculada[] = [];

  // 1. Obras (Construção de nova unidade / Retomada de creche completa)
  (plan.obras || []).forEach(obra => {
    const prev = mapExisting.get(`obra:${obra.id}`);
    const isProjetoProprio = obra.tipoProjetoFNDE === 'proprio' && !obra.modeloCrecheId;

    const modelo =
      modelos.find(m => m.id === obra.modeloCrecheId) ||
      (obra.tipoProjetoFNDE === 'tipo1'
        ? modelos.find(m => m.tipoBase === 'tipo1')
        : obra.tipoProjetoFNDE === 'tipo2'
        ? modelos.find(m => m.tipoBase === 'tipo2')
        : modelos.find(m => m.tipoBase === 'tipo2')) ||
      modelos[0];

    const salasModeloTotal = modelo ? countModelClassrooms(modelo, ambientes) : 5;
    const salasAdicionais = isProjetoProprio
      ? obra.numeroDeSalas || 4
      : obra.numeroDeSalas || salasModeloTotal;
    const vagasAdicionais = calcularVagasObraPadrao(obra, modelos);

    const turmasConfiguradas = configSalasPlano
      .filter(cs => cs.origem === 'obra' && cs.origemId === obra.id)
      .reduce((s, cs) => s + (cs.numeroTurmas || 1), 0);

    const turmasPadraoModelo = turmasConfiguradas > 0 ? turmasConfiguradas : salasAdicionais;
    const turmasPrevistas = prev ? prev.turmasPrevistas : turmasPadraoModelo;

    const ambientesPrevistos: { ambienteId: string; nome: string; quantidade: number }[] = [];
    if (modelo && !isProjetoProprio) {
      modelo.ambientes.forEach(ma => {
        const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
        if (!amb) return;
        ambientesPrevistos.push({
          ambienteId: amb.id,
          nome: amb.nome,
          quantidade: ma.quantidade,
        });
      });
    } else {
      // Projeto próprio: salas previstas + estrutura básica de creche completa
      const salaRef = ambientes.find(a => a.id === 'ma01') || ambientes[0];
      if (salaRef) {
        ambientesPrevistos.push({ ambienteId: salaRef.id, nome: salaRef.nome, quantidade: salasAdicionais });
      }
      ['ma04', 'ma06', 'ma07', 'ma10', 'ma15'].forEach(idAmb => {
        const amb = ambientes.find(a => a.id === idAmb);
        if (amb) {
          ambientesPrevistos.push({
            ambienteId: amb.id,
            nome: amb.nome,
            quantidade: idAmb === 'ma04' ? Math.max(1, Math.ceil(salasAdicionais / 2)) : 1,
          });
        }
      });
    }

    const suggestedStart = nextMonthAfterDate(obra.previsaoConclusao, defaultStartYM);

    result.push({
      id: prev?.id || `int-obra-${obra.id}`,
      origemTipo: 'obra',
      origemId: obra.id,
      nomeUnidadeOuObra: obra.nome || (obra.tipo === 'retomada' ? 'Obra de Retomada' : 'Nova Creche'),
      localizacaoResumo: [obra.bairro, obra.setor].filter(Boolean).join(' · ') || obra.localizacao || 'Localização definida no plano',
      escopo: 'unidade_completa',
      subtipoIntervencao: obra.tipo === 'retomada' ? 'retomada' : 'nova_construcao',
      modeloCrecheId: modelo?.id,
      modeloCrecheNome: isProjetoProprio
        ? `Projeto Próprio (${salasAdicionais} salas)`
        : (modelo?.nome || 'Modelo Padrão'),
      projetoProprio: isProjetoProprio,
      salasAdicionais,
      vagasAdicionais,
      turmasPrevistas,
      turmasPadraoModelo,
      etapasAtendidas: obra.etapasAtendidas || [],
      ambientesPrevistos,
      dataConclusaoObra: obra.previsaoConclusao,
      dataInicioOperacao: prev?.dataInicioOperacao || suggestedStart,
      dataFimOperacao: prev?.dataFimOperacao,
      ativoNoCusteio: prev ? prev.ativoNoCusteio : true,
    });
  });

  // 2. Ações em Unidades Existentes (Ampliação ou Adaptação — escopo incremental)
  (plan.acoesUnidades || []).forEach(acao => {
    const prev = mapExisting.get(`acao:${acao.id}`);
    const ue = mockUnidades.find(u => u.id === acao.unidadeId);
    const salasAdicionais = parseSalasFromAcao(
      acao.descricao,
      acao.capacidadeAnterior,
      acao.novaCapacidade
    );
    const vagasAdicionais = calcularVagasAcaoPadrao(acao) || salasAdicionais * 20;

    const turmasConfiguradas = configSalasPlano
      .filter(cs => cs.origem === 'acao' && cs.origemId === acao.id)
      .reduce((s, cs) => s + (cs.numeroTurmas || 1), 0);

    const turmasPadraoModelo = turmasConfiguradas > 0 ? turmasConfiguradas : salasAdicionais;
    const turmasPrevistas = prev ? prev.turmasPrevistas : turmasPadraoModelo;

    // Se acao.salaId apontar para um ModeloAmbiente cadastrado, usá-lo diretamente; caso contrário, inferir por etapa
    const ambEspecifico = ambientes.find(a => a.id === acao.salaId);
    const fallbackSalaId = acao.etapaDestino === 'Pré-Escola' ? 'ma02' : 'ma01';
    const ambSala = ambEspecifico || ambientes.find(a => a.id === fallbackSalaId) || ambientes[0];
    const ambientesPrevistos = ambSala
      ? [{ ambienteId: ambSala.id, nome: ambSala.nome, quantidade: salasAdicionais }]
      : [];

    const suggestedStart = nextMonthAfterDate(acao.previsaoConclusao, defaultStartYM);

    result.push({
      id: prev?.id || `int-acao-${acao.id}`,
      origemTipo: 'acao',
      origemId: acao.id,
      unidadeId: acao.unidadeId,
      nomeUnidadeOuObra: `${acao.tipo === 'ampliacao' ? 'Ampliação' : 'Adaptação'} — ${ue?.nome || acao.unidadeId}`,
      localizacaoResumo: [ue?.bairro, ue?.setor].filter(Boolean).join(' · ') || acao.descricao,
      escopo: 'incremental',
      subtipoIntervencao: acao.tipo,
      modeloCrecheId: acao.modeloCrecheId || 'mc02',
      modeloCrecheNome: acao.tipo === 'ampliacao'
        ? `Expansão Incremental (+${salasAdicionais} sala${salasAdicionais > 1 ? 's' : ''})`
        : `Adaptação de Ambiente (${salasAdicionais} sala)`,
      projetoProprio: false,
      salasAdicionais,
      vagasAdicionais,
      turmasPrevistas,
      turmasPadraoModelo,
      etapasAtendidas: acao.etapaDestino ? [acao.etapaDestino] : [],
      ambientesPrevistos,
      dataConclusaoObra: acao.previsaoConclusao,
      dataInicioOperacao: prev?.dataInicioOperacao || suggestedStart,
      dataFimOperacao: prev?.dataFimOperacao,
      ativoNoCusteio: prev ? prev.ativoNoCusteio : true,
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
    servicos?: ItemCusteioServico[];
    aquisicoes?: ItemCusteioAquisicao[];
    pessoal?: ItemCusteioPessoal[];
  },
  preserveManual: boolean = true
): {
  servicos: ItemCusteioServico[];
  aquisicoes: ItemCusteioAquisicao[];
  pessoal: ItemCusteioPessoal[];
} {
  const { modelos, ambientes, servicosRef, aquisicoesRef, cargosRef } = catalogos;

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

  const servicos: ItemCusteioServico[] = [
    ...manualServicos.filter(i => i.origemCalculo === 'incluido_manualmente'),
  ];
  const aquisicoes: ItemCusteioAquisicao[] = [
    ...manualAquisicoes.filter(i => i.origemCalculo === 'incluido_manualmente'),
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
    const startItemYM = maxYM(planStartYM, interv.dataInicioOperacao);
    const modeloAssociado =
      modelos.find(m => m.id === interv.modeloCrecheId) || modeloRefIncremental;

    const isProjetoProprio =
      Boolean(interv.projetoProprio) ||
      Boolean(interv.modeloCrecheNome?.startsWith('Projeto Próprio'));

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

    if (isCompleta && !isProjetoProprio && modeloAssociado?.pessoal?.length) {
      // Paridade 100% com o quadro cadastrado em "Consultar Modelos de Creches"
      specsPessoal = modeloAssociado.pessoal.map(mp => {
        const cargo =
          cargosRef.find(c => c.id === mp.cargoId) || findCargo(mp.cargoId, mp.cargoId);
        const catCargo = classifyCategoriaCargo(cargo.descricao);
        const d = cargo.descricao.toLowerCase();
        const isRegenciaSala = d.includes('professor') || d.includes('monitor');
        const escalaTurmas = tPadrao > 0 && t !== tPadrao ? t / tPadrao : 1;
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
              : `Ajustado proporcionalmente para ${t} turmas a partir do modelo ${modeloAssociado.nome}`,
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
          const criterio: CriterioProporcionalidade = isAdaptacao ? 'por_vaga' : 'por_ambiente';
          const num = isAdaptacao ? interv.vagasAdicionais : interv.salasAdicionais;
          const den = isAdaptacao ? Math.max(1, vagasBaseRefIncremental) : Math.max(1, salasBaseRefIncremental);
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
              ? `Proporcional ao consumo de +${num} de ${den} vagas do modelo ref. (${pctFmt}%)`
              : `Proporcional a +${num} de ${den} salas do modelo ref. (${pctFmt}%)`,
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

    // ── B. AQUISIÇÕES (1. Pontuais de Implantação + 2. Recorrentes Anuais) ───
    // B.1. Pontuais de Implantação: considera TODOS os ambientes pedagógicos previstos (ma01, ma02, berçário...)
    const ambientesSalasPrevistos = interv.ambientesPrevistos.filter(ap => {
      const amb = ambientes.find(a => a.id === ap.ambienteId);
      return amb && (amb.categoria === 'sala-atividades' || amb.categoria === 'bercario');
    });

    if (ambientesSalasPrevistos.length > 0) {
      ambientesSalasPrevistos.forEach(ap => {
        const amb = ambientes.find(a => a.id === ap.ambienteId);
        if (!amb) return;
        const c = calcularCustoAmbiente(amb);
        const custoUnitAmb = Number((c.mobiliario + c.equipamentos).toFixed(2));
        if (custoUnitAmb <= 0) return;

        // Compatibilidade com refKey legado quando há apenas 1 tipo de sala
        const refKeySala =
          ambientesSalasPrevistos.length === 1
            ? 'aq-pontual:KIT_SALAS'
            : `aq-pontual:KIT_SALA_${amb.id}`;
        const manualKit =
          hasManualOverride(manualAquisicoes, interv.id, refKeySala) ||
          (amb.id === 'ma01' ? hasManualOverride(manualAquisicoes, interv.id, 'aq-pontual:KIT_SALAS') : undefined);

        if (manualKit) {
          if (!aquisicoes.some(existingAq => existingAq.id === manualKit.id)) {
            aquisicoes.push({ ...manualKit });
          }
          return;
        }

        aquisicoes.push({
          id:
            ambientesSalasPrevistos.length === 1
              ? `aq-kit-salas-${interv.id}`
              : `aq-kit-salas-${interv.id}-${amb.id}`,
          categoria: 'aquisicao',
          tipoAquisicao: 'pontual_implantacao',
          subcategoriaAquisicao: 'mobiliario_equipamento',
          intervencaoCusteioId: interv.id,
          catalogoRefId: refKeySala,
          descricao: `MOBILIÁRIO E EQUIPAMENTOS — ${amb.nome} (${ap.quantidade} SALA${ap.quantidade > 1 ? 'S' : ''})`,
          criterioCalculo: 'por_ambiente',
          fatorProporcional: 1,
          numeradorProporcao: ap.quantidade,
          denominadorProporcao: 1,
          unidadeProporcao: 'salas',
          memoriaCalculo: `${ap.quantidade} kit(s) completo(s) de ${amb.nome} (despesa única de implantação)`,
          naturezaCusto: 'exclusivo_intervencao',
          periodicidade: 'unica',
          unidadeMedida: 'KIT',
          quantidade: ap.quantidade,
          valorUnitario: custoUnitAmb,
          dataInicio: startItemYM,
          dataFim: startItemYM,
          ocorrenciasNoPeriodo: 0,
          valorAnualizado: Number((ap.quantidade * custoUnitAmb).toFixed(2)),
          valorTotalProjetado: 0,
          origemCalculo: 'automatico',
          quantidadeOriginal: ap.quantidade,
          valorUnitarioOriginal: custoUnitAmb,
        });
      });
    } else {
      // Fallback caso não haja ambientes mapeados
      const ambPadrao = ambientes[0];
      const custoSala = ambPadrao
        ? (() => {
            const c = calcularCustoAmbiente(ambPadrao);
            return Number((c.mobiliario + c.equipamentos).toFixed(2));
          })()
        : 10678.5;
      const refKeyKitSalas = 'aq-pontual:KIT_SALAS';
      const manualKitSalas = hasManualOverride(manualAquisicoes, interv.id, refKeyKitSalas);
      if (manualKitSalas) {
        aquisicoes.push({ ...manualKitSalas });
      } else {
        aquisicoes.push({
          id: `aq-kit-salas-${interv.id}`,
          categoria: 'aquisicao',
          tipoAquisicao: 'pontual_implantacao',
          subcategoriaAquisicao: 'mobiliario_equipamento',
          intervencaoCusteioId: interv.id,
          catalogoRefId: refKeyKitSalas,
          descricao: `MOBILIÁRIO E EQUIPAMENTOS — SALAS DE ATIVIDADES (${interv.salasAdicionais} SALA${interv.salasAdicionais > 1 ? 'S' : ''})`,
          criterioCalculo: 'por_ambiente',
          fatorProporcional: 1,
          numeradorProporcao: interv.salasAdicionais,
          denominadorProporcao: 1,
          unidadeProporcao: 'salas',
          memoriaCalculo: `${interv.salasAdicionais} kit(s) completo(s) de sala infantil (despesa única de implantação)`,
          naturezaCusto: 'exclusivo_intervencao',
          periodicidade: 'unica',
          unidadeMedida: 'KIT',
          quantidade: interv.salasAdicionais,
          valorUnitario: custoSala,
          dataInicio: startItemYM,
          dataFim: startItemYM,
          ocorrenciasNoPeriodo: 0,
          valorAnualizado: Number((interv.salasAdicionais * custoSala).toFixed(2)),
          valorTotalProjetado: 0,
          origemCalculo: 'automatico',
          quantidadeOriginal: interv.salasAdicionais,
          valorUnitarioOriginal: custoSala,
        });
      }
    }

    if (interv.escopo === 'unidade_completa') {
      // Áreas comuns da creche nova (Copa, Refeitório, Fraldário, Playground, Administração)
      let custoDemaisAmbientes = 0;
      interv.ambientesPrevistos.forEach(ap => {
        const amb = ambientes.find(a => a.id === ap.ambienteId);
        if (!amb || amb.categoria === 'sala-atividades' || amb.categoria === 'bercario') return;
        const c = calcularCustoAmbiente(amb);
        custoDemaisAmbientes += (c.mobiliario + c.equipamentos) * ap.quantidade;
      });

      if (custoDemaisAmbientes > 0) {
        const refKeyKitComum = 'aq-pontual:KIT_AREAS_COMUNS';
        const manualKitComum = hasManualOverride(manualAquisicoes, interv.id, refKeyKitComum);
        if (manualKitComum) {
          aquisicoes.push({ ...manualKitComum });
        } else {
          const valComum = Number(custoDemaisAmbientes.toFixed(2));
          aquisicoes.push({
            id: `aq-kit-comuns-${interv.id}`,
            categoria: 'aquisicao',
            tipoAquisicao: 'pontual_implantacao',
            subcategoriaAquisicao: 'mobiliario_equipamento',
            intervencaoCusteioId: interv.id,
            catalogoRefId: refKeyKitComum,
            descricao: 'MOBILIÁRIO E EQUIPAMENTOS — COPA, REFEITÓRIO, FRALDÁRIOS E PLAYGROUND',
            criterioCalculo: 'por_unidade',
            fatorProporcional: 1,
            numeradorProporcao: 1,
            denominadorProporcao: 1,
            unidadeProporcao: 'unid.',
            memoriaCalculo: 'Implantação única dos ambientes coletivos e administrativos da nova unidade',
            naturezaCusto: 'exclusivo_intervencao',
            periodicidade: 'unica',
            unidadeMedida: 'KIT',
            quantidade: 1,
            valorUnitario: valComum,
            dataInicio: startItemYM,
            dataFim: startItemYM,
            ocorrenciasNoPeriodo: 0,
            valorAnualizado: valComum,
            valorTotalProjetado: 0,
            origemCalculo: 'automatico',
            quantidadeOriginal: 1,
            valorUnitarioOriginal: valComum,
          });
        }
      }
    }

    // B.2. Aquisições Recorrentes Anuais (Merenda, Material Pedagógico, Higiene, EPI, Gás)
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

  return { servicos, aquisicoes, pessoal };
}

// ─── Projeção Temporal e Financeira (Mês a Mês / Ano a Ano) ────────────────

export interface ResultadoProjecaoCusteio {
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
    0 // evita recursão
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
  totalInicialAutomaticoRef?: number
): ResultadoProjecaoCusteio {
  const mesesPlano = listMonthsBetween(dataInicio, dataFim);
  const { year: anoBase } = parseYM(dataInicio);
  const mapInterv = new Map(intervencoes.map(i => [i.id, i]));

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

  const getEffectiveWindow = (intervencaoId: string, itemInicio: string, itemFim?: string) => {
    const interv = mapInterv.get(intervencaoId);
    if (interv && !interv.ativoNoCusteio) {
      return { active: false, start: dataInicio, end: dataInicio, opStart: dataInicio };
    }
    const opStart = interv ? interv.dataInicioOperacao : dataInicio;
    const opEnd = interv?.dataFimOperacao || dataFim;
    const effStart = maxYM(dataInicio, opStart, itemInicio || dataInicio);
    const effEnd = minYM(dataFim, opEnd, itemFim || dataFim);
    return {
      active: effStart <= effEnd,
      start: effStart,
      end: effEnd,
      opStart,
    };
  };

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

  // 2. Processar Aquisições (Pontuais vs Recorrentes)
  const aquisicoes = aquisicoesIn.map(item => {
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
    const srv = servicos
      .filter(s => s.intervencaoCusteioId === interv.id)
      .reduce((acc, s) => acc + s.valorTotalProjetado, 0);
    const aqPont = aquisicoes
      .filter(a => a.intervencaoCusteioId === interv.id && a.tipoAquisicao === 'pontual_implantacao')
      .reduce((acc, a) => acc + a.valorTotalProjetado, 0);
    const aqRec = aquisicoes
      .filter(a => a.intervencaoCusteioId === interv.id && a.tipoAquisicao === 'recorrente_manutencao')
      .reduce((acc, a) => acc + a.valorTotalProjetado, 0);
    const pes = pessoal
      .filter(p => p.intervencaoCusteioId === interv.id)
      .reduce((acc, p) => acc + p.valorTotalProjetado, 0);

    const custoAnualizadoRegime =
      servicos
        .filter(s => s.intervencaoCusteioId === interv.id && s.periodicidade !== 'unica')
        .reduce((acc, s) => acc + s.valorAnualizado, 0) +
      aquisicoes
        .filter(a => a.intervencaoCusteioId === interv.id && a.tipoAquisicao === 'recorrente_manutencao')
        .reduce((acc, a) => acc + a.valorAnualizado, 0) +
      pessoal
        .filter(p => p.intervencaoCusteioId === interv.id)
        .reduce((acc, p) => acc + p.valorAnualizado, 0);

    const effStart = maxYM(dataInicio, interv.dataInicioOperacao);
    const effEnd = minYM(dataFim, interv.dataFimOperacao || dataFim);
    const mesesOp =
      interv.ativoNoCusteio && effStart <= effEnd ? listMonthsBetween(effStart, effEnd).length : 0;
    const totalPeriodo = srv + aqPont + aqRec + pes;

    return {
      intervencaoId: interv.id,
      nome: interv.nomeUnidadeOuObra,
      escopo: interv.escopo,
      subtipo: interv.subtipoIntervencao,
      dataInicioOperacao: interv.dataInicioOperacao,
      mesesOperacaoNoPeriodo: mesesOp,
      salas: interv.ativoNoCusteio ? interv.salasAdicionais : 0,
      vagas: interv.ativoNoCusteio ? interv.vagasAdicionais : 0,
      turmas: interv.ativoNoCusteio ? interv.turmasPrevistas : 0,
      servicos: srv,
      aquisicoesPontuais: aqPont,
      aquisicoesRecorrentes: aqRec,
      pessoal: pes,
      totalPeriodo,
      custoAnualizadoRegime: interv.ativoNoCusteio ? custoAnualizadoRegime : 0,
      custoPorVagaAno:
        interv.ativoNoCusteio && interv.vagasAdicionais > 0
          ? custoAnualizadoRegime / interv.vagasAdicionais
          : 0,
    };
  });

  // Totais consolidados
  const totalServicosPeriodo = servicos.reduce((s, i) => s + i.valorTotalProjetado, 0);
  const totalAquisicoesPontuaisPeriodo = aquisicoes
    .filter(a => a.tipoAquisicao === 'pontual_implantacao')
    .reduce((s, i) => s + i.valorTotalProjetado, 0);
  const totalAquisicoesRecorrentesPeriodo = aquisicoes
    .filter(a => a.tipoAquisicao === 'recorrente_manutencao')
    .reduce((s, i) => s + i.valorTotalProjetado, 0);
  const totalPessoalPeriodo = pessoal.reduce((s, i) => s + i.valorTotalProjetado, 0);
  const totalGeralPeriodo =
    totalServicosPeriodo +
    totalAquisicoesPontuaisPeriodo +
    totalAquisicoesRecorrentesPeriodo +
    totalPessoalPeriodo;

  const numMesesPlano = Math.max(1, mesesPlano.length);
  const custoMedioMensal = totalGeralPeriodo / numMesesPlano;
  const custoMedioAnual = custoMedioMensal * 12; // Sempre consistente p/ qualquer duração (< ou >= 12 meses)

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
  };

  const projecao = calcularProjecaoPlanoCusteio(
    params.dataInicio,
    params.dataFim,
    intervencoes,
    gerados.servicos,
    gerados.aquisicoes,
    gerados.pessoal,
    parametrosSimulacao,
    0
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
    servicos: projecao.servicos,
    aquisicoes: projecao.aquisicoes,
    pessoal: projecao.pessoal,
    parametrosSimulacao,
    resumoFinanceiro: projecao.resumoFinanceiro,
  };
}
