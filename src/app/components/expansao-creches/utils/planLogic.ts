import {
  ObraConstrucao,
  AcaoUnidade,
  FonteFinanciamento,
  ModeloCreche,
  ModeloAmbiente,
  ExpansionPlan,
  Activity,
} from '../types';
import { calcularCustoCreche, mockModelosCreche, mockModelosAmbiente } from '../mockDataCusto';
import { mockUnidades, mockActivities } from '../mockData';
import { calcularVagasObraPadrao, calcularVagasAcaoPadrao } from './custeioCalculator';

export const obterQuantidadeSalasAcao = (acao: AcaoUnidade): number => {
  if (typeof acao.quantidadeSalas === 'number' && acao.quantidadeSalas > 0) {
    return acao.quantidadeSalas;
  }
  if (acao.tipo === 'adaptacao') return 1;
  const match = (acao.descricao || '').match(/(\d+)\s*(?:novas?\s+)?salas?/i);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n > 0) return n;
  }
  const deltaVagas = Math.max(0, (acao.novaCapacidade || 0) - (acao.capacidadeAnterior || 0));
  if (deltaVagas > 0) {
    return Math.max(1, Math.round(deltaVagas / 20));
  }
  return 1;
};

export const calcularCustoObraTotal = (obra: ObraConstrucao, modelos: ModeloCreche[], ambientes: ModeloAmbiente[]) => {
  let costPerSala = 0;
  let total = 0;
  const modelo =
    modelos.find(m => m.id === obra.modeloCrecheId) ||
    modelos.find(m => m.tipoBase === obra.tipoProjetoFNDE) ||
    modelos.find(m => m.tipoBase === 'proprio') ||
    modelos[0];
  
  if (modelo) {
    const c = calcularCustoCreche(modelo, ambientes);
    const baseInvestimento =
      obra.incluiMobiliarioNoCapex === false
        ? c.obras * (1 + (modelo.reservaPct || 0) / 100)
        : c.investimento;

    const modelSalaCount = modelo.ambientes.reduce((s, a) => {
      const ma = ambientes.find(x => x.id === a.modeloAmbienteId);
      if (ma && (ma.categoria === 'sala-atividades' || ma.categoria === 'bercario')) {
        return s + (a.quantidade || 0);
      }
      return s;
    }, 0);
      
    const salasModel = modelSalaCount || modelo.ambientes.reduce((s, a) => s + (a.quantidade || 0), 0);
    const numSalasObra = obra.numeroDeSalas || salasModel || 1;

    // Para Tipo 1 padrão (10 salas de creche ou 12 salas totais), preserva o investimento integral do modelo
    const isPadraoFechado =
      (modelo.tipoBase === 'tipo1' && (numSalasObra === 10 || numSalasObra === salasModel)) ||
      (modelo.tipoBase === 'tipo2' && (numSalasObra === 5 || numSalasObra === salasModel)) ||
      numSalasObra === salasModel;

    if (isPadraoFechado) {
      total = baseInvestimento;
      costPerSala = numSalasObra > 0 ? total / numSalasObra : 0;
    } else {
      costPerSala = salasModel > 0 ? baseInvestimento / salasModel : 0;
      total = costPerSala * numSalasObra;
    }

    // Se for retomada de obra com percentual já executado, considera o saldo remanescente a executar
    if (
      obra.tipo === 'retomada' &&
      typeof obra.percentualConclusaoAtual === 'number' &&
      obra.percentualConclusaoAtual > 0 &&
      obra.percentualConclusaoAtual < 100
    ) {
      const fatorRemanescente = (100 - obra.percentualConclusaoAtual) / 100;
      total = total * fatorRemanescente;
      costPerSala = numSalasObra > 0 ? total / numSalasObra : costPerSala;
    }
  }
  return { costPerSala, total };
};

export const calcularCustoAcaoTotal = (acao: AcaoUnidade) => {
  const salas = obterQuantidadeSalasAcao(acao);
  const costPerSala = acao.custoPorSala || 0;
  const total = acao.tipo === 'ampliacao' ? costPerSala * salas : costPerSala * salas;
  return { costPerSala, total, salas };
};

const anosIntervaloPara = (previsao: string | undefined, periodoInicio: number, periodoFim: number) => {
  const fim = previsao ? new Date(previsao).getFullYear() : periodoFim;
  const start = periodoInicio;
  const end = Math.min(periodoFim, fim);
  const anos = [] as number[];
  for (let y = start; y <= end; y++) anos.push(y);
  return anos.length > 0 ? anos : [periodoInicio];
};

export const calcularAutoDistribuicao = (
  periodoInicio: number,
  periodoFim: number,
  fontes: FonteFinanciamento[],
  obras: ObraConstrucao[],
  acoes: AcaoUnidade[],
  modelos: ModeloCreche[],
  ambientes: ModeloAmbiente[]
) => {
  const anosPlano: number[] = [];
  for (let y = periodoInicio; y <= periodoFim; y++) anosPlano.push(y);

  // disponibilidade total
  const totalFontes = fontes.reduce((s, f) => s + (f.valorPrevisto || 0), 0);

  // gerar alocação desejada
  type AllocItem = { id: string; tipo: 'obra' | 'acao'; arr: { ano: number; valor: number; fonte?: string }[] };
  const desired: AllocItem[] = [];

  // obras
  obras.forEach(o => {
    const total = calcularCustoObraTotal(o, modelos, ambientes).total || 0;
    const years = anosIntervaloPara(o.previsaoConclusao, periodoInicio, periodoFim);
    if (total <= 0 || years.length === 0) {
      desired.push({ id: o.id, tipo: 'obra', arr: [] });
      return;
    }
    const per = Math.floor(total / years.length);
    const arr = years.map((ano) => ({ ano, valor: per, fonte: fontes[0]?.fonte || 'Recurso Próprio' }));
    const soma = arr.reduce((s, it) => s + it.valor, 0);
    if (soma !== total) arr[arr.length - 1].valor += (total - soma);
    desired.push({ id: o.id, tipo: 'obra', arr });
  });

  // acoes
  acoes.forEach(a => {
    const total = calcularCustoAcaoTotal(a).total || 0;
    const years = anosIntervaloPara(a.previsaoConclusao, periodoInicio, periodoFim);
    if (total <= 0 || years.length === 0) {
      desired.push({ id: a.id, tipo: 'acao', arr: [] });
      return;
    }
    const per = Math.floor(total / years.length);
    const arr = years.map((ano) => ({ ano, valor: per, fonte: a.fonteFinanciamento || fontes[0]?.fonte || 'Recurso Próprio' }));
    const soma = arr.reduce((s, it) => s + it.valor, 0);
    if (soma !== total) arr[arr.length - 1].valor += (total - soma);
    desired.push({ id: a.id, tipo: 'acao', arr });
  });

  // sweep cumulativo
  let saldoAtual = totalFontes;
  const newObras = obras.map(o => ({ ...o, desembolsoPorAno: [] as {ano: number; valor: number; fonte: string}[] }));
  const newAcoes = acoes.map(a => ({ ...a, desembolsoPorAno: [] as {ano: number; valor: number; fonte: string}[] }));

  anosPlano.forEach(ano => {
    const allDesiredForYear = desired.map(d => ({
      id: d.id, tipo: d.tipo, req: d.arr.find(x => x.ano === ano)
    })).filter(x => x.req && x.req.valor > 0);

    const totalReqAno = allDesiredForYear.reduce((s, x) => s + x.req!.valor, 0);
    
    // Aprova o máximo que o saldo atual permite
    const approvedTotalForYear = Math.min(saldoAtual, totalReqAno);
    const escala = totalReqAno > 0 ? approvedTotalForYear / totalReqAno : 1;
    
    saldoAtual -= approvedTotalForYear;

    // Distribuir o aprovado
    let approvedSoma = 0;
    allDesiredForYear.forEach((item, idx) => {
      let approvedValor = Math.round(item.req!.valor * escala);
      
      // Corrigir arredondamento no último item
      if (idx === allDesiredForYear.length - 1) {
         approvedValor = approvedTotalForYear - approvedSoma;
      }
      approvedSoma += approvedValor;

      if (approvedValor > 0) {
        if (item.tipo === 'obra') {
          const ob = newObras.find(o => o.id === item.id);
          if (ob) ob.desembolsoPorAno.push({ ano, valor: approvedValor, fonte: item.req!.fonte || '' });
        } else {
          const ac = newAcoes.find(a => a.id === item.id);
          if (ac) ac.desembolsoPorAno.push({ ano, valor: approvedValor, fonte: item.req!.fonte || '' });
        }
      }
    });
  });

  const finalObras = newObras;
  const finalAcoes = newAcoes;

  return {
    finalObras: finalObras as unknown as ObraConstrucao[],
    finalAcoes: finalAcoes as unknown as AcaoUnidade[]
  };
};

// ─── Consolidação de Escolas / Intervenções do Plano ──────────────────────────

export interface ProgressoKanbanResumo {
  total: number;
  aFazer: number;
  emAndamento: number;
  concluidas: number;
  percentual: number;
}

export interface EscolaPlanoResumo {
  id: string;
  planId: string;
  itemType: 'obra' | 'acao-unidade';
  itemData: ObraConstrucao | AcaoUnidade;
  nome: string;
  codigo: string;
  categoriaLabel: 'Nova Creche' | 'Retomada de Obra' | 'Ampliação' | 'Adaptação';
  subtipo: ObraConstrucao['tipo'] | AcaoUnidade['tipo'];
  statusLabel: string;
  statusTone: 'planejamento' | 'licitacao' | 'execucao' | 'concluida';
  endereco: string;
  bairro: string;
  setor: string;
  subtituloDescricao: string;
  salas: number;
  vagas: number;
  etapas: string[];
  previsaoConclusao: string;
  investimentoTotal: number;
  percentualFisico?: number;
  fonteFinanciamento?: string;
  progressoKanban: ProgressoKanbanResumo;
}

const KANBAN_STORAGE_KEY = 'exp_creches_activities_v2';

const lerAtividadesKanbanStorage = (): Activity[] => {
  try {
    const cached = localStorage.getItem(KANBAN_STORAGE_KEY);
    return cached ? JSON.parse(cached) : mockActivities;
  } catch {
    return mockActivities;
  }
};

export const calcularProgressoKanbanItem = (
  planId: string,
  itemId: string,
  itemType: 'obra' | 'acao-unidade',
  activities?: Activity[]
): ProgressoKanbanResumo => {
  const lista = activities ?? lerAtividadesKanbanStorage();
  const matching = lista.filter(a => {
    if (a.itemId) {
      const samePlan = !a.planId || a.planId === planId;
      const sameType = !a.itemType || a.itemType === itemType;
      return samePlan && sameType && a.itemId === itemId;
    }
    return a.schoolId === itemId;
  });

  const total = matching.length;
  const aFazer = matching.filter(a => a.status === 'A FAZER').length;
  const emAndamento = matching.filter(a => a.status === 'FAZENDO').length;
  const concluidas = matching.filter(a => a.status === 'FEITO').length;
  const percentual = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return { total, aFazer, emAndamento, concluidas, percentual };
};

const statusObraParaResumo = (
  statusObra?: ObraConstrucao['statusObra']
): { label: string; tone: EscolaPlanoResumo['statusTone'] } => {
  switch (statusObra) {
    case 'em_execucao':
      return { label: 'Em Execução', tone: 'execucao' };
    case 'em_licitacao':
      return { label: 'Em Licitação', tone: 'licitacao' };
    case 'planejada':
    default:
      return { label: 'Planejada', tone: 'planejamento' };
  }
};

export const extrairEscolasDoPlano = (
  plan: ExpansionPlan,
  modelos: ModeloCreche[] = mockModelosCreche,
  ambientes: ModeloAmbiente[] = mockModelosAmbiente,
  activities?: Activity[]
): EscolaPlanoResumo[] => {
  const baseActivities = activities ?? lerAtividadesKanbanStorage();
  const lista: EscolaPlanoResumo[] = [];

  (plan.obras || []).forEach(obra => {
    const progressoKanban = calcularProgressoKanbanItem(plan.id, obra.id, 'obra', baseActivities);
    const desembolsoTotal = (obra.desembolsoPorAno || []).reduce((s, d) => s + (d.valor || 0), 0);
    const custoCalculado = calcularCustoObraTotal(obra, modelos, ambientes).total;
    const investimentoTotal = desembolsoTotal > 0 ? desembolsoTotal : custoCalculado;
    const vagas = calcularVagasObraPadrao(obra, modelos);

    const statusInfo =
      progressoKanban.total > 0 && progressoKanban.percentual === 100
        ? { label: 'Concluída', tone: 'concluida' as const }
        : statusObraParaResumo(obra.statusObra);

    lista.push({
      id: obra.id,
      planId: plan.id,
      itemType: 'obra',
      itemData: obra,
      nome: obra.nome || 'Nova Unidade Escolar',
      codigo: obra.numeroConvenio ? obra.numeroConvenio : `OBR-${obra.id.slice(0, 6).toUpperCase()}`,
      categoriaLabel: obra.tipo === 'retomada' ? 'Retomada de Obra' : 'Nova Creche',
      subtipo: obra.tipo,
      statusLabel: statusInfo.label,
      statusTone: statusInfo.tone,
      endereco: obra.localizacao || 'Localização a definir',
      bairro: obra.bairro || 'Bairro não informado',
      setor: obra.setor || 'Municipal',
      subtituloDescricao: obra.tipoProjetoFNDE === 'tipo1'
        ? 'Projeto Tipo 1 FNDE'
        : obra.tipoProjetoFNDE === 'tipo2'
          ? 'Projeto Tipo 2 FNDE'
          : 'Projeto Próprio / Modelo Customizado',
      salas: obra.numeroDeSalas || 0,
      vagas,
      etapas: obra.etapasAtendidas || [],
      previsaoConclusao: obra.previsaoConclusao || '',
      investimentoTotal,
      percentualFisico: obra.percentualConclusaoAtual,
      fonteFinanciamento: obra.desembolsoPorAno?.[0]?.fonte || plan.fontesFinanciamento?.[0]?.fonte,
      progressoKanban,
    });
  });

  (plan.acoesUnidades || []).forEach(acao => {
    const progressoKanban = calcularProgressoKanbanItem(plan.id, acao.id, 'acao-unidade', baseActivities);
    const unidade = mockUnidades.find(u => u.id === acao.unidadeId);
    const desembolsoTotal = (acao.desembolsoPorAno || []).reduce((s, d) => s + (d.valor || 0), 0);
    const custoCalculado = calcularCustoAcaoTotal(acao).total;
    const investimentoTotal = desembolsoTotal > 0 ? desembolsoTotal : custoCalculado;
    const salas = obterQuantidadeSalasAcao(acao);
    const vagas = calcularVagasAcaoPadrao(acao);

    const statusInfo =
      progressoKanban.total > 0 && progressoKanban.percentual === 100
        ? { label: 'Concluída', tone: 'concluida' as const }
        : progressoKanban.total > 0 && (progressoKanban.emAndamento > 0 || progressoKanban.concluidas > 0)
          ? { label: 'Em Andamento', tone: 'execucao' as const }
          : { label: 'Planejada', tone: 'planejamento' as const };

    lista.push({
      id: acao.id,
      planId: plan.id,
      itemType: 'acao-unidade',
      itemData: acao,
      nome: unidade?.nome || acao.descricao || 'Unidade Existente',
      codigo: unidade?.codigo || unidade?.inep || `ACA-${acao.id.slice(0, 6).toUpperCase()}`,
      categoriaLabel: acao.tipo === 'ampliacao' ? 'Ampliação' : 'Adaptação',
      subtipo: acao.tipo,
      statusLabel: statusInfo.label,
      statusTone: statusInfo.tone,
      endereco: unidade?.endereco || acao.descricao || 'Unidade da rede municipal',
      bairro: unidade?.bairro || 'Rede Municipal',
      setor: unidade?.setor || 'Urbano',
      subtituloDescricao: acao.descricao || `${acao.tipo === 'ampliacao' ? 'Ampliação' : 'Adaptação'} de salas`,
      salas,
      vagas,
      etapas: acao.etapaDestino ? [acao.etapaDestino] : [],
      previsaoConclusao: acao.previsaoConclusao || '',
      investimentoTotal,
      fonteFinanciamento: acao.fonteFinanciamento || plan.fontesFinanciamento?.[0]?.fonte,
      progressoKanban,
    });
  });

  return lista;
};
