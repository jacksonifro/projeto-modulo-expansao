import { ObraConstrucao, AcaoUnidade, FonteFinanciamento, ModeloCreche, ModeloAmbiente, DesembolsoAnual } from '../types';
import { calcularCustoCreche } from '../mockDataCusto';

export const calcularCustoObraTotal = (obra: ObraConstrucao, modelos: ModeloCreche[], ambientes: ModeloAmbiente[]) => {
  let costPerSala = 0;
  let total = 0;
  const modelo = modelos.find(m => m.id === (obra as any).modeloCrecheId) || modelos.find(m => m.tipoBase === obra.tipoProjetoFNDE);
  
  if (modelo) {
    const c = calcularCustoCreche(modelo, ambientes);
    const modelSalaCount = modelo.ambientes
      .map(a => ambientes.find(ma => ma.id === a.modeloAmbienteId))
      .filter(Boolean)
      .filter(ma => (ma as any).categoria === 'sala-atividades')
      .reduce((s, a, i) => s + (modelo.ambientes[i]?.quantidade || 0), 0) || 0;
      
    const salasModel = modelSalaCount || modelo.ambientes.reduce((s, a) => s + (a.quantidade || 0), 0);
    costPerSala = salasModel > 0 ? (c.investimento / salasModel) : 0;
    total = costPerSala * (obra.numeroDeSalas || 0);
  }
  return { costPerSala, total };
};

export const calcularCustoAcaoTotal = (acao: AcaoUnidade) => {
  const salas = acao.tipo === 'ampliacao' ? 1 : 0;
  const total = (acao.custoPorSala || 0) * salas;
  const costPerSala = acao.custoPorSala || 0;
  return { costPerSala, total };
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

  // disponibilidade por ano (fontes)
  const disponivelPorAno: Record<number, number> = {};
  anosPlano.forEach(y => { disponivelPorAno[y] = fontes.filter(f => f.anoDesembolso === y).reduce((s, f) => s + (f.valorPrevisto || 0), 0); });

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

  // demanda por ano
  const demandaPorAno: Record<number, number> = {};
  anosPlano.forEach(y => demandaPorAno[y] = 0);
  desired.forEach(item => item.arr.forEach(d => { demandaPorAno[d.ano] = (demandaPorAno[d.ano] || 0) + d.valor; }));

  // fator de escala por ano
  const escalaPorAno: Record<number, number> = {};
  anosPlano.forEach(y => {
    const disp = disponivelPorAno[y] || 0;
    const dem = demandaPorAno[y] || 0;
    escalaPorAno[y] = dem > 0 ? Math.min(1, disp / dem) : 1;
  });

  // aplicar escala e montar novos objetos
  const newObras = obras.map(o => {
    const item = desired.find(d => d.id === o.id && d.tipo === 'obra');
    if (!item) return { ...o, desembolsoPorAno: [] };
    const arr = item.arr.map(d => ({ ano: d.ano, valor: Math.round(d.valor * escalaPorAno[d.ano]), fonte: d.fonte }));
    return { ...o, desembolsoPorAno: arr };
  });

  const newAcoes = acoes.map(a => {
    const item = desired.find(d => d.id === a.id && d.tipo === 'acao');
    if (!item) return { ...a, desembolsoPorAno: [] };
    const arr = item.arr.map(d => ({ ano: d.ano, valor: Math.round(d.valor * escalaPorAno[d.ano]), fonte: d.fonte }));
    return { ...a, desembolsoPorAno: arr };
  });

  // Garantir que por ano a soma não exceda o disponível (corrigir por arredondamento)
  const adjustPerYear = (objs: ({ id: string; desembolsoPorAno: { ano: number; valor: number; fonte: string }[] }[])) => {
    anosPlano.forEach(ano => {
      const somaAno = objs.reduce((s, it) => s + (it.desembolsoPorAno.find(d => d.ano === ano)?.valor || 0), 0);
      const dispon = disponivelPorAno[ano] || 0;
      if (somaAno > dispon && somaAno > 0) {
        let diff = somaAno - dispon;
        for (let obj of objs) {
          const d = obj.desembolsoPorAno.find(x => x.ano === ano);
          if (!d || d.valor <= 0) continue;
          const reduc = Math.min(d.valor, diff);
          d.valor = Math.max(0, d.valor - reduc);
          diff -= reduc;
          if (diff <= 0) break;
        }
      }
    });
  };

  const finalObras = newObras.map(o => ({
    ...o,
    desembolsoPorAno: o.desembolsoPorAno.map(d => ({ ano: d.ano, valor: d.valor, fonte: d.fonte || '' }))
  }));
  const finalAcoes = newAcoes.map(a => ({
    ...a,
    desembolsoPorAno: a.desembolsoPorAno.map(d => ({ ano: d.ano, valor: d.valor, fonte: d.fonte || '' }))
  }));

  adjustPerYear([...finalObras, ...finalAcoes]);

  return {
    finalObras: finalObras as unknown as ObraConstrucao[],
    finalAcoes: finalAcoes as unknown as AcaoUnidade[]
  };
};
