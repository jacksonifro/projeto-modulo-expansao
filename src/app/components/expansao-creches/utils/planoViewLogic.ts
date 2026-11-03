import { ExpansionPlan } from '../types';
import { mockModelosCreche, mockModelosAmbiente } from '../mockDataCusto';
import { calcularCustoObraTotal, calcularCustoAcaoTotal } from './planLogic';
import { getPlanosCusteioByExpansaoId } from './custeioMigration';
import {
  calcularProjecaoPlanoCusteio,
  calcularVagasObraPadrao,
  calcularVagasAcaoPadrao,
  parseSalasFromAcao,
} from './custeioCalculator';

export function calculateViewMetrics(plan: ExpansionPlan) {
  const periodoInicio = plan.periodoInicio || plan.year || 2026;
  const periodoFim = plan.periodoFim || periodoInicio + 3;
  const anosPlano: number[] = [];
  for (let y = periodoInicio; y <= periodoFim; y++) anosPlano.push(y);

  // Consultar eventual Plano de Custeio vinculado (aprovado ou mais recente) para exibir indicador real
  const planosCusteio = getPlanosCusteioByExpansaoId(plan.id);
  const custeioReferencia =
    planosCusteio.find(pc => pc.status === 'Aprovado') || planosCusteio[0];

  const mapaCusteioAnualPorOrigem = new Map<string, number>();
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
    custeioReferencia.intervencoes.forEach(iv => {
      const resumo = proj.resumoPorIntervencao.find(r => r.intervencaoId === iv.id);
      if (resumo) {
        mapaCusteioAnualPorOrigem.set(
          `${iv.origemTipo}:${iv.origemId}`,
          resumo.custoAnualizadoRegime
        );
      }
    });
  }

  const itens: any[] = [];

  if (plan.obras) {
    plan.obras.forEach(obra => {
      const { total } = calcularCustoObraTotal(obra, mockModelosCreche, mockModelosAmbiente);
      const vagasEstimadas = calcularVagasObraPadrao(obra, mockModelosCreche);
      const totalDesembolso = obra.desembolsoPorAno?.reduce((s, d) => s + d.valor, 0) || total;
      const desembolsoConsolidado = anosPlano.map(ano => ({
        ano,
        valor: (obra.desembolsoPorAno || [])
          .filter(d => d.ano === ano)
          .reduce((s, d) => s + d.valor, 0),
      }));

      itens.push({
        id: obra.id,
        tipo: 'obra',
        vagas: vagasEstimadas,
        salas: obra.numeroDeSalas,
        totalInvestimento: totalDesembolso,
        desembolsoPorAno: desembolsoConsolidado,
        custoOperacionalAnual: mapaCusteioAnualPorOrigem.get(`obra:${obra.id}`) ?? null,
      });
    });
  }

  if (plan.acoesUnidades) {
    plan.acoesUnidades.forEach(acao => {
      const { total } = calcularCustoAcaoTotal(acao);
      const totalDesembolso = acao.desembolsoPorAno?.reduce((s, d) => s + d.valor, 0) || total;
      const desembolsoConsolidado = anosPlano.map(ano => ({
        ano,
        valor: (acao.desembolsoPorAno || [])
          .filter(d => d.ano === ano)
          .reduce((s, d) => s + d.valor, 0),
      }));

      const salasAcao = parseSalasFromAcao(
        acao.descricao,
        acao.capacidadeAnterior,
        acao.novaCapacidade
      );

      itens.push({
        id: acao.id,
        tipo: 'acao',
        salas: salasAcao,
        vagas: calcularVagasAcaoPadrao(acao),
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

  const vagasPorAno = anosPlano.map(ano => ({
    ano,
    vagas: itens
      .filter(item => {
        const d = item.desembolsoPorAno.find((x: any) => x.ano === ano);
        return d && d.valor > 0;
      })
      .reduce((s, item) => s + item.vagas, 0),
  }));

  const salasPorAno = anosPlano.map(ano => ({
    ano,
    salas: itens
      .filter(item => {
        const d = item.desembolsoPorAno.find((x: any) => x.ano === ano);
        return d && d.valor > 0;
      })
      .reduce((s, item) => s + item.salas, 0),
  }));

  return {
    anosPlano,
    investimentoPorAno,
    vagasPorAno,
    salasPorAno,
    totalInvestimento: itens.reduce((s, item) => s + item.totalInvestimento, 0),
    totalVagas: itens.reduce((s, item) => s + item.vagas, 0),
    totalSalas: itens.reduce((s, item) => s + item.salas, 0),
    itens,
    planosCusteioVinculados: planosCusteio,
  };
}
