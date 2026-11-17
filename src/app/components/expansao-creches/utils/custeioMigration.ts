import { ExpansionPlan, PlanoCusteio, ItemCusteioPessoal } from '../types';
import { mockPlans } from '../mockData';
import {
  criarNovoPlanoCusteioAutomatico,
  calcularProjecaoPlanoCusteio,
  gerarEstimativaItensProporcionais,
  extrairIntervencoesDoPlano,
  loadCatalogosCusteio,
} from './custeioCalculator';

export const STORAGE_KEY_CUSTEIO = 'exp_creches_planos_custeio';
const STORAGE_KEY_SEEDED = 'exp_creches_custeio_migrated_v4';

export function loadExpansionPlans(): ExpansionPlan[] {
  try {
    const cached = localStorage.getItem('exp_creches_plans');
    return cached ? JSON.parse(cached) : mockPlans;
  } catch {
    return mockPlans;
  }
}

export function saveExpansionPlans(plans: ExpansionPlan[]): void {
  localStorage.setItem('exp_creches_plans', JSON.stringify(plans));
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
  const catalogos = loadCatalogosCusteio();
  const alreadyMigratedV3 = localStorage.getItem(STORAGE_KEY_SEEDED) === 'true';
  let modified = false;

  // Migração v3: garante que todos os planos existentes tenham a seção de Mobiliário & Equipamentos
  // e intervenções alinhadas ao Modelo de Creche e ao Período do Plano de Custeio
  if (!alreadyMigratedV3 && planosCusteio.length > 0) {
    planosCusteio = planosCusteio.map(pc => {
      const exp = expansionPlans.find(ep => ep.id === pc.planoExpansaoId) || expansionPlans[0];
      const intervBase = exp
        ? extrairIntervencoesDoPlano(exp, catalogos, pc.dataInicio, pc.intervencoes, true).map(iv => ({
            ...iv,
            dataInicioOperacao: pc.dataInicio,
            dataFimOperacao: pc.dataFim,
          }))
        : pc.intervencoes.map(iv => ({
            ...iv,
            dataInicioOperacao: pc.dataInicio,
            dataFimOperacao: pc.dataFim,
          }));

      const gerados = gerarEstimativaItensProporcionais(
        intervBase,
        catalogos,
        pc.dataInicio,
        pc.dataFim,
        {
          mobiliario: pc.mobiliario,
          servicos: pc.servicos,
          aquisicoes: pc.aquisicoes,
          pessoal: pc.pessoal,
        },
        true
      );

      const proj = calcularProjecaoPlanoCusteio(
        pc.dataInicio,
        pc.dataFim,
        intervBase,
        gerados.servicos,
        gerados.aquisicoes,
        gerados.pessoal,
        pc.parametrosSimulacao,
        0,
        gerados.mobiliario
      );

      modified = true;
      return {
        ...pc,
        intervencoes: intervBase,
        mobiliario: proj.mobiliario,
        servicos: proj.servicos,
        aquisicoes: proj.aquisicoes,
        pessoal: proj.pessoal,
        resumoFinanceiro: proj.resumoFinanceiro,
      };
    });
  }

  // 1. Migrar dados legados de Pessoal que existam nos Planos de Expansão sem Plano de Custeio vinculado
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
          novo.resumoFinanceiro.totalInicialAutomatico,
          novo.mobiliario
        );
        novo.mobiliario = recalc.mobiliario;
        novo.pessoal = recalc.pessoal;
        novo.resumoFinanceiro = recalc.resumoFinanceiro;
      }

      planosCusteio.push(novo);
      modified = true;
    }
  }

  // 2. Se ainda não houve inicialização e não há nenhum Plano de Custeio, criar um plano demonstrativo vinculado ao 1º Plano de Expansão
  if (!alreadyMigratedV3 && planosCusteio.length === 0 && expansionPlans.length > 0) {
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

  if (!alreadyMigratedV3 || modified) {
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

  // Se o plano foi Aprovado ou é o único cenário vinculado ao Plano de Expansão, atualizar planoCusteioId
  const expPlans = loadExpansionPlans();
  const vinculados = updated.filter(p => p.planoExpansaoId === plano.planoExpansaoId);
  const expTarget = expPlans.find(ep => ep.id === plano.planoExpansaoId);
  if (expTarget) {
    const shouldSetPrincipal =
      plano.status === 'Aprovado' ||
      !expTarget.planoCusteioId ||
      vinculados.length === 1;
    if (shouldSetPrincipal && expTarget.planoCusteioId !== plano.id) {
      const updatedExp = expPlans.map(ep =>
        ep.id === plano.planoExpansaoId ? { ...ep, planoCusteioId: plano.id } : ep
      );
      saveExpansionPlans(updatedExp);
    }
  }

  return updated;
}

export function deletePlanoCusteio(id: string): PlanoCusteio[] {
  const list = loadPlanosCusteio();
  const deleted = list.find(p => p.id === id);
  const updated = list.filter(p => p.id !== id);
  savePlanosCusteio(updated);

  if (deleted) {
    const expPlans = loadExpansionPlans();
    const expTarget = expPlans.find(ep => ep.id === deleted.planoExpansaoId);
    if (expTarget && expTarget.planoCusteioId === id) {
      const remaining = updated.filter(p => p.planoExpansaoId === deleted.planoExpansaoId);
      const nextPrincipal = remaining.find(p => p.status === 'Aprovado') || remaining[0];
      const updatedExp = expPlans.map(ep =>
        ep.id === deleted.planoExpansaoId ? { ...ep, planoCusteioId: nextPrincipal?.id } : ep
      );
      saveExpansionPlans(updatedExp);
    }
  }

  return updated;
}

export function getPlanosCusteioByExpansaoId(planoExpansaoId: string): PlanoCusteio[] {
  return loadPlanosCusteio().filter(pc => pc.planoExpansaoId === planoExpansaoId);
}

export function getPlanoCusteioReferencia(plan: ExpansionPlan): PlanoCusteio | undefined {
  const vinculados = getPlanosCusteioByExpansaoId(plan.id);
  if (vinculados.length === 0) return undefined;
  if (plan.planoCusteioId) {
    const found = vinculados.find(pc => pc.id === plan.planoCusteioId);
    if (found) return found;
  }
  return vinculados.find(pc => pc.status === 'Aprovado') || vinculados[0];
}

export function setPlanoCusteioPrincipal(planoExpansaoId: string, planoCusteioId: string): ExpansionPlan[] {
  const expPlans = loadExpansionPlans();
  const updated = expPlans.map(ep =>
    ep.id === planoExpansaoId ? { ...ep, planoCusteioId } : ep
  );
  saveExpansionPlans(updated);
  return updated;
}

export function sincronizarCusteioParaExpansao(
  planoCusteio: PlanoCusteio,
  options?: { aplicarDatasCronograma?: boolean }
): ExpansionPlan | undefined {
  const expPlans = loadExpansionPlans();
  const expPlan = expPlans.find(ep => ep.id === planoCusteio.planoExpansaoId);
  if (!expPlan) return undefined;

  const mapIv = new Map(
    planoCusteio.intervencoes.map(iv => [`${iv.origemTipo}:${iv.origemId}`, iv])
  );

  const prevMonthDateStr = (ym: string, currentPrevisao?: string): string => {
    const [y, m] = (ym || '2027-01').split('-').map(Number);
    if (!Number.isFinite(y) || !Number.isFinite(m)) return currentPrevisao || `${ym}-28`;
    let year = y;
    let month = m - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    const lastDay = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  };

  const novasObras = (expPlan.obras || []).map(o => {
    const iv = mapIv.get(`obra:${o.id}`);
    if (!iv) return o;
    const incluiMob = iv.escopoImplantacaoMobiliario === 'contemplado_no_capex_obra';
    const novaPrevisao =
      options?.aplicarDatasCronograma && iv.dataInicioOperacao
        ? prevMonthDateStr(iv.dataInicioOperacao, o.previsaoConclusao)
        : o.previsaoConclusao;
    return {
      ...o,
      incluiMobiliarioNoCapex: incluiMob,
      previsaoConclusao: novaPrevisao,
    };
  });

  const novasAcoes = (expPlan.acoesUnidades || []).map(a => {
    const iv = mapIv.get(`acao:${a.id}`);
    if (!iv) return a;
    const incluiMob = iv.escopoImplantacaoMobiliario === 'contemplado_no_capex_obra';
    const novaPrevisao =
      options?.aplicarDatasCronograma && iv.dataInicioOperacao
        ? prevMonthDateStr(iv.dataInicioOperacao, a.previsaoConclusao)
        : a.previsaoConclusao;
    return {
      ...a,
      incluiMobiliarioNoCapex: incluiMob,
      previsaoConclusao: novaPrevisao,
    };
  });

  const novasConfigSalas = planoCusteio.intervencoes.map(iv => ({
    id: `cs-${iv.id}`,
    origem: iv.origemTipo,
    origemId: iv.origemId,
    nome: iv.nomeUnidadeOuObra,
    numeroTurmas: iv.turmasPrevistas,
    etapas: iv.etapasAtendidas,
  }));

  const updatedPlan: ExpansionPlan = {
    ...expPlan,
    obras: novasObras,
    acoesUnidades: novasAcoes,
    configSalas: novasConfigSalas,
    dataRevisao: new Date().toISOString().split('T')[0],
  };

  const updatedList = expPlans.map(ep => (ep.id === updatedPlan.id ? updatedPlan : ep));
  saveExpansionPlans(updatedList);
  return updatedPlan;
}
