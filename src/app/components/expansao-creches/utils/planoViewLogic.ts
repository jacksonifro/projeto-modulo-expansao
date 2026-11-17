import { ExpansionPlan } from '../types';
import { mockModelosCreche, mockModelosAmbiente } from '../mockDataCusto';
import { mockDemandaEtapa } from '../mockData';
import { calcularCustoObraTotal, calcularCustoAcaoTotal, obterQuantidadeSalasAcao } from './planLogic';
import { getPlanosCusteioByExpansaoId, getPlanoCusteioReferencia } from './custeioMigration';
import {
  calcularProjecaoPlanoCusteio,
  calcularSustentabilidadeFiscalCusteio,
  calcularVagasObraPadrao,
  calcularVagasAcaoPadrao,
} from './custeioCalculator';

function extrairAnoConclusao(
  previsaoConclusao: string | undefined,
  desembolsos: { ano: number; valor: number }[] | undefined,
  periodoInicio: number,
  periodoFim: number
): number {
  if (previsaoConclusao) {
    const m = previsaoConclusao.match(/^(\d{4})/);
    if (m) {
      const y = parseInt(m[1], 10);
      return Math.min(periodoFim, Math.max(periodoInicio, y));
    }
  }
  const anosComDesembolso = (desembolsos || []).filter(d => d.valor > 0).map(d => d.ano);
  if (anosComDesembolso.length > 0) {
    const maxY = Math.max(...anosComDesembolso);
    return Math.min(periodoFim, Math.max(periodoInicio, maxY));
  }
  return periodoInicio;
}

export function calculateViewMetrics(plan: ExpansionPlan) {
  const periodoInicio = plan.periodoInicio || plan.year || 2026;
  const periodoFim = plan.periodoFim || periodoInicio + 3;
  const anosPlano: number[] = [];
  for (let y = periodoInicio; y <= periodoFim; y++) anosPlano.push(y);

  // Consultar eventual Plano de Custeio vinculado (oficial/principal, aprovado ou mais recente) para exibir indicador real
  const planosCusteio = getPlanosCusteioByExpansaoId(plan.id);
  const custeioReferencia = getPlanoCusteioReferencia(plan);

  const mapaCusteioAnualPorOrigem = new Map<string, number>();
  const mapaCusteioPorAno = new Map<
    number,
    { implantacao: number; operacaoRecorrente: number; totalOpex: number; repasseFundebPnae: number; esforcoLiquidoMde: number }
  >();

  let sustentabilidadeFiscal = undefined;

  if (custeioReferencia) {
    const proj = calcularProjecaoPlanoCusteio(
      custeioReferencia.dataInicio,
      custeioReferencia.dataFim,
      custeioReferencia.intervencoes,
      custeioReferencia.servicos,
      custeioReferencia.aquisicoes,
      custeioReferencia.pessoal,
      custeioReferencia.parametrosSimulacao,
      custeioReferencia.resumoFinanceiro?.totalInicialAutomatico
    );
    sustentabilidadeFiscal = calcularSustentabilidadeFiscalCusteio(
      custeioReferencia,
      proj,
      plan
    );
    const mapFiscalAno = new Map(
      sustentabilidadeFiscal.fluxoIntegradoAnual.map(r => [r.ano, r])
    );
    custeioReferencia.intervencoes.forEach(iv => {
      const resumo = proj.resumoPorIntervencao.find(r => r.intervencaoId === iv.id);
      if (resumo) {
        mapaCusteioAnualPorOrigem.set(
          `${iv.origemTipo}:${iv.origemId}`,
          resumo.custoAnualizadoRegime
        );
      }
    });
    proj.cronogramaAnual.forEach(ca => {
      const fisc = mapFiscalAno.get(ca.ano);
      mapaCusteioPorAno.set(ca.ano, {
        implantacao: ca.aquisicoesPontuais,
        operacaoRecorrente: ca.servicos + ca.aquisicoesRecorrentes + ca.pessoal,
        totalOpex: ca.total,
        repasseFundebPnae: fisc?.receitaVinculadaTotal || 0,
        esforcoLiquidoMde: fisc?.esforcoLiquidoTesouroMde || 0,
      });
    });
  }

  const itens: any[] = [];

  if (plan.obras) {
    plan.obras.forEach(obra => {
      const { total } = calcularCustoObraTotal(obra, mockModelosCreche, mockModelosAmbiente);
      const vagasEstimadas = calcularVagasObraPadrao(obra, mockModelosCreche);
      const somaDesembolso = obra.desembolsoPorAno?.reduce((s, d) => s + d.valor, 0) || 0;
      const totalDesembolso = somaDesembolso > 0 ? somaDesembolso : total;
      const desembolsoConsolidado = anosPlano.map(ano => ({
        ano,
        valor: (obra.desembolsoPorAno || [])
          .filter(d => d.ano === ano)
          .reduce((s, d) => s + d.valor, 0),
      }));
      const anoConclusao = extrairAnoConclusao(
        obra.previsaoConclusao,
        obra.desembolsoPorAno,
        periodoInicio,
        periodoFim
      );

      itens.push({
        id: obra.id,
        tipo: 'obra',
        vagas: vagasEstimadas,
        salas: obra.numeroDeSalas,
        anoConclusao,
        totalInvestimento: totalDesembolso,
        desembolsoPorAno: desembolsoConsolidado,
        custoOperacionalAnual: mapaCusteioAnualPorOrigem.get(`obra:${obra.id}`) ?? null,
      });
    });
  }

  if (plan.acoesUnidades) {
    plan.acoesUnidades.forEach(acao => {
      const { total } = calcularCustoAcaoTotal(acao);
      const somaDesembolso = acao.desembolsoPorAno?.reduce((s, d) => s + d.valor, 0) || 0;
      const totalDesembolso = somaDesembolso > 0 ? somaDesembolso : total;
      const desembolsoConsolidado = anosPlano.map(ano => ({
        ano,
        valor: (acao.desembolsoPorAno || [])
          .filter(d => d.ano === ano)
          .reduce((s, d) => s + d.valor, 0),
      }));

      const salasAcao = obterQuantidadeSalasAcao(acao);
      const anoConclusao = extrairAnoConclusao(
        acao.previsaoConclusao,
        acao.desembolsoPorAno,
        periodoInicio,
        periodoFim
      );

      itens.push({
        id: acao.id,
        tipo: 'acao',
        salas: salasAcao,
        vagas: calcularVagasAcaoPadrao(acao),
        anoConclusao,
        desembolsoPorAno: desembolsoConsolidado,
        totalInvestimento: totalDesembolso,
        custoOperacionalAnual: mapaCusteioAnualPorOrigem.get(`acao:${acao.id}`) ?? null,
      });
    });
  }

  const investimentoPorAno = anosPlano.map(ano => ({
    ano,
    valor: itens.reduce(
      (s, item) => s + (item.desembolsoPorAno.find((d: any) => d.ano === ano)?.valor || 0),
      0
    ),
  }));

  // Alocação física de vagas e salas pelo ano de conclusão da entrega (evita dupla contagem e inclui adaptações a custo zero)
  const vagasPorAno = anosPlano.map(ano => ({
    ano,
    vagas: itens
      .filter(item => item.anoConclusao === ano)
      .reduce((s, item) => s + item.vagas, 0),
  }));

  const salasPorAno = anosPlano.map(ano => ({
    ano,
    salas: itens
      .filter(item => item.anoConclusao === ano)
      .reduce((s, item) => s + item.salas, 0),
  }));

  // Cálculo do fluxo de caixa único com saldo acumulado (consistente com PlanoForm)
  const totalFontes = (plan.fontesFinanciamento || []).reduce(
    (s, f) => s + (f.valorPrevisto || 0),
    0
  );
  let saldoRunning = totalFontes;
  const fluxoCaixaAnual = anosPlano.map(ano => {
    const disponivelNoInicioDoAno = saldoRunning;
    const inv = investimentoPorAno.find(x => x.ano === ano)?.valor || 0;
    saldoRunning = disponivelNoInicioDoAno - inv;
    const opexAno = mapaCusteioPorAno.get(ano) || {
      implantacao: 0,
      operacaoRecorrente: 0,
      totalOpex: 0,
      repasseFundebPnae: 0,
      esforcoLiquidoMde: 0,
    };
    return {
      ano,
      disponivelNoAno: disponivelNoInicioDoAno,
      investimentoCapex: inv,
      saldoCapexFimAno: saldoRunning,
      custeioImplantacao: opexAno.implantacao,
      custeioOperacao: opexAno.operacaoRecorrente,
      custeioTotalAno: opexAno.totalOpex,
      repasseFundebPnae: opexAno.repasseFundebPnae,
      esforcoLiquidoMde: opexAno.esforcoLiquidoMde,
      desembolsoGlobalTco: inv + opexAno.totalOpex,
    };
  });

  // Projeção dinâmica de vagas e taxa de atendimento (base Municipal CadÚnico 0-3 anos)
  const totalCriancasBase =
    mockDemandaEtapa.reduce((s, d) => s + d.criancasResidentes, 0) || 4559;
  const vagasAtuaisBase =
    mockDemandaEtapa.reduce((s, d) => s + d.vagasAtuais, 0) || 699;

  let acumuladoRunning = vagasAtuaisBase;
  const projecaoVagasDinamica = [
    {
      ano: periodoInicio - 1,
      novasVagas: 0,
      acumulado: vagasAtuaisBase,
      taxaAtendimento: Number(((vagasAtuaisBase / totalCriancasBase) * 100).toFixed(2)),
    },
    ...anosPlano.map(ano => {
      const novas = vagasPorAno.find(v => v.ano === ano)?.vagas || 0;
      acumuladoRunning += novas;
      return {
        ano,
        novasVagas: novas,
        acumulado: acumuladoRunning,
        taxaAtendimento: Number(((acumuladoRunning / totalCriancasBase) * 100).toFixed(2)),
      };
    }),
  ];

  return {
    anosPlano,
    investimentoPorAno,
    vagasPorAno,
    salasPorAno,
    fluxoCaixaAnual,
    projecaoVagasDinamica,
    totalInvestimento: itens.reduce((s, item) => s + item.totalInvestimento, 0),
    totalVagas: itens.reduce((s, item) => s + item.vagas, 0),
    totalSalas: itens.reduce((s, item) => s + item.salas, 0),
    itens,
    planosCusteioVinculados: planosCusteio,
    custeioReferencia,
    sustentabilidadeFiscal,
  };
}
