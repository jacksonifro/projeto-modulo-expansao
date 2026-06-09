import { ExpansionPlan } from '../types';
import { mockUnidades } from '../mockData';
import { mockModelosCreche, mockModelosAmbiente } from '../mockDataCusto';
import { calcularCustoObraTotal, calcularCustoAcaoTotal } from './planLogic';

export function calculateViewMetrics(plan: ExpansionPlan) {
  const periodoInicio = plan.periodoInicio || plan.year || 2026;
  const periodoFim = plan.periodoFim || (periodoInicio + 3);
  const anosPlano: number[] = [];
  for (let y = periodoInicio; y <= periodoFim; y++) anosPlano.push(y);

  const configSalas: any[] = [];
  
  // Das obras
  if (plan.obras) {
    plan.obras.forEach(obra => {
      for (let i = 1; i <= obra.numeroDeSalas; i++) {
        configSalas.push({ id: `obra-${obra.id}-sala-${i}`, numeroTurmas: 2 });
      }
    });
  }
  
  // Das ações
  if (plan.acoesUnidades) {
    plan.acoesUnidades.filter(a => a.tipo === 'ampliacao').forEach(acao => {
      configSalas.push({ id: `acao-${acao.id}`, numeroTurmas: 1 });
    });
  }

  const totalTurmasPlanejadas = configSalas.reduce((s, sala) => s + sala.numeroTurmas, 0);
  const totalCustoAnualPessoal = totalTurmasPlanejadas * 135000; // Simulated Custo Anual Pessoal por Turma (approx)

  const itens: any[] = [];

  if (plan.obras) {
    plan.obras.forEach(obra => {
      const { total } = calcularCustoObraTotal(obra, mockModelosCreche, mockModelosAmbiente);
      const vagasEstimadas = obra.numeroDeSalas * 20; 
      const totalDesembolso = obra.desembolsoPorAno?.reduce((s, d) => s + d.valor, 0) || total;
      const desembolsoConsolidado = anosPlano.map(ano => ({
        ano,
        valor: (obra.desembolsoPorAno || []).filter(d => d.ano === ano).reduce((s, d) => s + d.valor, 0)
      }));

      const turmas = configSalas.find(c => c.id === obra.id)?.numeroTurmas || (obra.numeroDeSalas * 2);
      const custoPessoalAnual = totalTurmasPlanejadas > 0 ? (turmas / totalTurmasPlanejadas) * totalCustoAnualPessoal : 0;
      
      itens.push({
        id: obra.id,
        tipo: 'obra',
        vagas: vagasEstimadas,
        salas: obra.numeroDeSalas,
        totalInvestimento: totalDesembolso,
        desembolsoPorAno: desembolsoConsolidado,
        custoPessoalAnual
      });
    });
  }

  if (plan.acoesUnidades) {
    plan.acoesUnidades.forEach(acao => {
      const { total } = calcularCustoAcaoTotal(acao);
      const totalDesembolso = acao.desembolsoPorAno?.reduce((s, d) => s + d.valor, 0) || total;
      const desembolsoConsolidado = anosPlano.map(ano => ({
        ano,
        valor: (acao.desembolsoPorAno || []).filter(d => d.ano === ano).reduce((s, d) => s + d.valor, 0)
      }));

      const turmas = configSalas.find(c => c.id === acao.id)?.numeroTurmas || (acao.tipo === 'ampliacao' ? 1 : 0);
      const custoPessoalAnual = totalTurmasPlanejadas > 0 ? (turmas / totalTurmasPlanejadas) * totalCustoAnualPessoal : 0;

      itens.push({
        id: acao.id,
        tipo: 'acao',
        salas: acao.tipo === 'ampliacao' ? 1 : 0,
        vagas: Math.max(0, acao.novaCapacidade - acao.capacidadeAnterior),
        desembolsoPorAno: desembolsoConsolidado,
        totalInvestimento: totalDesembolso,
        custoPessoalAnual
      });
    });
  }

  const investimentoPorAno = anosPlano.map(ano => ({
    ano,
    valor: itens.reduce((s, item) => s + (item.desembolsoPorAno.find((d:any) => d.ano === ano)?.valor || 0), 0)
  }));

  const vagasPorAno = anosPlano.map(ano => ({
    ano,
    vagas: itens.filter(item => {
      const d = item.desembolsoPorAno.find((x:any) => x.ano === ano);
      return d && d.valor > 0;
    }).reduce((s, item) => s + item.vagas, 0)
  }));

  const salasPorAno = anosPlano.map(ano => ({
    ano,
    salas: itens.filter(item => {
      const d = item.desembolsoPorAno.find((x:any) => x.ano === ano);
      return d && d.valor > 0;
    }).reduce((s, item) => s + item.salas, 0)
  }));

  return {
    anosPlano,
    investimentoPorAno,
    vagasPorAno,
    salasPorAno,
    totalInvestimento: itens.reduce((s, item) => s + item.totalInvestimento, 0),
    totalVagas: itens.reduce((s, item) => s + item.vagas, 0),
    totalSalas: itens.reduce((s, item) => s + item.salas, 0),
    itens
  };
}
