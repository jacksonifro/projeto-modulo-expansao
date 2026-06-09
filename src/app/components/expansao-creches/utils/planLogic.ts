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
