import { ExpansionPlan, PlanoCusteio, ItemCusteioPessoal } from '../types';
import { mockPlans } from '../mockData';
import {
  criarNovoPlanoCusteioAutomatico,
  calcularProjecaoPlanoCusteio,
  loadCatalogosCusteio,
} from './custeioCalculator';

export const STORAGE_KEY_CUSTEIO = 'exp_creches_planos_custeio';
const STORAGE_KEY_SEEDED = 'exp_creches_custeio_migrated_v2';

export function loadExpansionPlans(): ExpansionPlan[] {
  try {
    const cached = localStorage.getItem('exp_creches_plans');
    return cached ? JSON.parse(cached) : mockPlans;
  } catch {
    return mockPlans;
  }
}

export function savePlanosCusteio(planos: PlanoCusteio[]): void {
  localStorage.setItem(STORAGE_KEY_CUSTEIO, JSON.stringify(planos));
}

export function loadPlanosCusteio(): PlanoCusteio[] {
  let planosCusteio: PlanoCusteio[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTEIO);
    if (raw) {
      planosCusteio = JSON.parse(raw);
    }
  } catch {
    planosCusteio = [];
  }

  const expansionPlans = loadExpansionPlans();
  const alreadyMigratedV2 = localStorage.getItem(STORAGE_KEY_SEEDED) === 'true';
  let modified = false;

  // Se houver apenas o seed automático inicial v1 sem nenhuma edição manual, atualizar para a fórmula exata v2
  if (!alreadyMigratedV2 && planosCusteio.length > 0) {
    planosCusteio = planosCusteio.map(pc => {
      const hasAnyManual =
        pc.servicos.some(i => i.origemCalculo !== 'automatico') ||
        pc.aquisicoes.some(i => i.origemCalculo !== 'automatico') ||
        pc.pessoal.some(i => i.origemCalculo !== 'automatico');

      if (!hasAnyManual && pc.versao === 1 && pc.cenarioLabel === 'Cenário Base Referencial') {
        const exp = expansionPlans.find(ep => ep.id === pc.planoExpansaoId);
        if (exp) {
          const refreshed = criarNovoPlanoCusteioAutomatico({
            planoExpansao: exp,
            nome: pc.nome,
            descricao: pc.descricao,
            cenarioLabel: pc.cenarioLabel,
            dataInicio: pc.dataInicio,
            dataFim: pc.dataFim,
            responsavelNome: pc.responsavelNome,
          });
          modified = true;
          return { ...refreshed, id: pc.id, status: pc.status };
        }
      }
      return pc;
    });
  }

  // 1. Migrar dados legados de Pessoal que existam nos Planos de Expansão sem Plano de Custeio vinculado
  const catalogos = loadCatalogosCusteio();
  for (const expPlan of expansionPlans) {
    const hasLinked = planosCusteio.some(pc => pc.planoExpansaoId === expPlan.id);
    if (!hasLinked && expPlan.pessoal && expPlan.pessoal.length > 0) {
      const anoIni = (expPlan.periodoInicio || 2026) + 1;
      const anoFim = Math.max(anoIni + 2, (expPlan.periodoFim || 2029) + 1);
      const dataInicio = `${anoIni}-01`;
      const dataFim = `${anoFim}-12`;

      const novo = criarNovoPlanoCusteioAutomatico({
        planoExpansao: expPlan,
        nome: `Plano de Custeio — ${expPlan.nome || expPlan.name}`,
        descricao: `Plano de custeio gerado automaticamente por migração dos dados de pessoal e intervenções do plano "${expPlan.nome || expPlan.name}".`,
        cenarioLabel: 'Cenário Migrado (Base)',
        dataInicio,
        dataFim,
        responsavelNome: expPlan.responsible || 'Equipe SEMED',
      });

      const itensManuaisLegados: ItemCusteioPessoal[] = (expPlan.pessoal || [])
        .filter(ip => !ip.autoCalculado)
        .map((ip, idx) => {
          const cg = catalogos.cargosRef.find(c => c.descricao === ip.funcao);
          const patronal = cg ? cg.patronal : Math.round((ip.remuneracaoBase || 0) * 0.2);
          const mensal = (ip.remuneracaoBase || 0) + (ip.auxilios || 0) + patronal;
          const anual = mensal * 13.33;
          const firstIntervId = novo.intervencoes[0]?.id || 'global';
          return {
            id: `pes-legado-${expPlan.id}-${idx}`,
            categoria: 'pessoal',
            categoriaCargo: ip.categoria,
            intervencaoCusteioId: firstIntervId,
            cargoRefId: cg?.id,
            funcao: ip.funcao,
            descricao: ip.funcao,
            cargaHoraria: '40h semanais',
            remuneracaoBase: ip.remuneracaoBase,
            auxilios: ip.auxilios,
            patronalUnitario: patronal,
            custoMensalUnitario: mensal,
            custoAnualUnitario: anual,
            criterioCalculo: 'manual',
            fatorProporcional: 1,
            numeradorProporcao: ip.quantidade,
            denominadorProporcao: 1,
            unidadeProporcao: 'prof.',
            memoriaCalculo: ip.observacoes || 'Item migrado do quadro de pessoal original do Plano de Expansão',
            naturezaCusto: 'exclusivo_intervencao',
            periodicidade: 'anual',
            unidadeMedida: 'ANO',
            quantidade: ip.quantidade,
            valorUnitario: anual,
            dataInicio,
            dataFim,
            ocorrenciasNoPeriodo: 0,
            valorAnualizado: anual * ip.quantidade,
            valorTotalProjetado: 0,
            origemCalculo: 'incluido_manualmente',
            justificativaAjuste: 'Migrado da versão anterior do Plano de Expansão',
          };
        });

      if (itensManuaisLegados.length > 0) {
        const mergedPessoal = [...novo.pessoal, ...itensManuaisLegados];
        const recalc = calcularProjecaoPlanoCusteio(
          novo.dataInicio,
          novo.dataFim,
          novo.intervencoes,
          novo.servicos,
          novo.aquisicoes,
          mergedPessoal,
          novo.parametrosSimulacao,
          novo.resumoFinanceiro.totalInicialAutomatico
        );
        novo.pessoal = recalc.pessoal;
        novo.resumoFinanceiro = recalc.resumoFinanceiro;
      }

      planosCusteio.push(novo);
      modified = true;
    }
  }

  // 2. Se ainda não houve inicialização e não há nenhum Plano de Custeio, criar um plano demonstrativo vinculado ao 1º Plano de Expansão
  if (!alreadyMigratedV2 && planosCusteio.length === 0 && expansionPlans.length > 0) {
    const basePlan = expansionPlans[0];
    const seed = criarNovoPlanoCusteioAutomatico({
      planoExpansao: basePlan,
      nome: `Plano de Custeio Operacional 2027–2030`,
      descricao: `Planejamento financeiro de funcionamento, manutenção, aquisições e folha de pagamento das unidades contempladas no ${basePlan.nome || basePlan.name}.`,
      cenarioLabel: 'Cenário Base Referencial',
      dataInicio: '2027-01',
      dataFim: '2030-12',
      responsavelNome: basePlan.responsible || 'SEMED — Cacoal/RO',
    });
    seed.status = 'Aprovado';
    planosCusteio.push(seed);
    modified = true;
  }

  if (!alreadyMigratedV2 || modified) {
    localStorage.setItem(STORAGE_KEY_SEEDED, 'true');
    savePlanosCusteio(planosCusteio);
  }

  return planosCusteio;
}

export function upsertPlanoCusteio(plano: PlanoCusteio): PlanoCusteio[] {
  const list = loadPlanosCusteio();
  const exists = list.some(p => p.id === plano.id);
  const updated = exists
    ? list.map(p => (p.id === plano.id ? { ...plano, dataAtualizacao: new Date().toISOString().split('T')[0] } : p))
    : [{ ...plano, dataAtualizacao: new Date().toISOString().split('T')[0] }, ...list];
  savePlanosCusteio(updated);
  return updated;
}

export function deletePlanoCusteio(id: string): PlanoCusteio[] {
  const list = loadPlanosCusteio();
  const updated = list.filter(p => p.id !== id);
  savePlanosCusteio(updated);
  return updated;
}

export function getPlanosCusteioByExpansaoId(planoExpansaoId: string): PlanoCusteio[] {
  return loadPlanosCusteio().filter(pc => pc.planoExpansaoId === planoExpansaoId);
}
