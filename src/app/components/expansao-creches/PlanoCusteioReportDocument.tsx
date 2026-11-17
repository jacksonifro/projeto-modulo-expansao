import {
  Printer,
  Download,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  DollarSign,
  Users,
  Package,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { ExpansionPlan, PlanoCusteio } from './types';
import {
  calcularProjecaoPlanoCusteio,
  calcularBaselineAutomaticoPeriodo,
  calcularSustentabilidadeFiscalCusteio,
  formatProporcaoResumo,
  CRITERIO_LABELS,
  formatYMDisplay,
  obterPeriodoExpansaoYM,
} from './utils/custeioCalculator';

interface PlanoCusteioReportDocumentProps {
  planoCusteio: PlanoCusteio;
  planoExpansao?: ExpansionPlan;
  showToolbar?: boolean;
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v || 0);

export default function PlanoCusteioReportDocument({
  planoCusteio,
  planoExpansao,
  showToolbar = true,
}: PlanoCusteioReportDocumentProps) {
  const baselineAutomatico = calcularBaselineAutomaticoPeriodo(
    planoCusteio.dataInicio,
    planoCusteio.dataFim,
    planoCusteio.intervencoes
  );

  const projecao = calcularProjecaoPlanoCusteio(
    planoCusteio.dataInicio,
    planoCusteio.dataFim,
    planoCusteio.intervencoes,
    planoCusteio.servicos,
    planoCusteio.aquisicoes,
    planoCusteio.pessoal,
    planoCusteio.parametrosSimulacao,
    baselineAutomatico,
    planoCusteio.mobiliario
  );

  const { resumoFinanceiro, cronogramaAnual, cronogramaMensal, resumoPorIntervencao } = projecao;
  const sustentabilidadeFiscal = calcularSustentabilidadeFiscalCusteio(
    planoCusteio,
    projecao,
    planoExpansao
  );
  const mapInterv = new Map(planoCusteio.intervencoes.map(i => [i.id, i]));
  const mapIntervNome = new Map(
    planoCusteio.intervencoes.map(i => [i.id, i.nomeUnidadeOuObra])
  );

  const itensAjustadosManualmente = [
    ...projecao.servicos
      .filter(i => i.origemCalculo !== 'automatico')
      .map(i => ({ ...i, catLabel: 'Serviços' })),
    ...projecao.aquisicoes
      .filter(i => i.origemCalculo !== 'automatico')
      .map(i => ({ ...i, catLabel: 'Aquisições' })),
    ...projecao.pessoal
      .filter(i => i.origemCalculo !== 'automatico')
      .map(i => ({ ...i, catLabel: 'Pessoal' })),
  ];

  const aquisicoesPontuais = projecao.aquisicoes.filter(
    a => a.tipoAquisicao === 'pontual_implantacao'
  );
  const aquisicoesRecorrentes = projecao.aquisicoes.filter(
    a => a.tipoAquisicao === 'recorrente_manutencao'
  );

  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const deltaSimulacao = resumoFinanceiro.totalGeralPeriodo - baselineAutomatico;

  const anualServicosAtivos = projecao.servicos.reduce((acc, s) => {
    const iv = mapInterv.get(s.intervencaoCusteioId);
    return iv && !iv.ativoNoCusteio ? acc : acc + s.valorAnualizado;
  }, 0);
  const anualAqRecAtivas = aquisicoesRecorrentes.reduce((acc, a) => {
    const iv = mapInterv.get(a.intervencaoCusteioId);
    return iv && !iv.ativoNoCusteio ? acc : acc + a.valorAnualizado;
  }, 0);
  const anualPessoalAtivo = projecao.pessoal.reduce((acc, p) => {
    const iv = mapInterv.get(p.intervencaoCusteioId);
    return iv && !iv.ativoNoCusteio ? acc : acc + p.valorAnualizado;
  }, 0);

  return (
    <div className="space-y-6">
      {showToolbar && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              Emissão Oficial — Relatório Consolidado do Plano de Custeio
            </h3>
            <p className="text-xs text-slate-500">
              Documento técnico completo com memória de proporcionalidade exata, cronograma financeiro e rastreabilidade de versão.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              Salvar PDF
            </button>
          </div>
        </div>
      )}

      {/* Documento Imprimível */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden print:shadow-none print:border-0">
        {/* Cabeçalho Institucional */}
        <div className="bg-gradient-to-r from-[#1a3a5c] to-[#2563eb] text-white p-8 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 border border-white/30 mb-3 print:border-slate-400 print:text-slate-700">
                Relatório Técnico-Financeiro · Módulo de Expansão
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {planoCusteio.nome}
              </h1>
              <p className="text-blue-100 text-sm mt-1 print:text-slate-600">
                {planoCusteio.descricao ||
                  'Planejamento financeiro de implantação, operação e manutenção da rede escolar expandida.'}
              </p>
            </div>
            <div className="text-left md:text-right shrink-0 bg-white/10 rounded-xl p-4 print:bg-slate-50 print:border print:border-slate-200">
              <div className="text-xs text-blue-100 print:text-slate-500">Emissão</div>
              <div className="font-bold text-sm">{dataEmissao}</div>
              <div className="text-xs text-blue-100 mt-2 print:text-slate-500">
                Cenário / Versão
              </div>
              <div className="font-bold text-sm">
                {planoCusteio.cenarioLabel} · v{planoCusteio.versao} ({planoCusteio.status})
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 text-slate-800">
          {/* 1. Identificação, Vínculo com Plano de Expansão e Vigência */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              1. Identificação, Vínculo com Plano de Expansão e Vigência
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                  Plano de Custeio
                </div>
                <div className="font-bold text-slate-900">{planoCusteio.nome}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Código: <span className="font-mono">{planoCusteio.id}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Responsável: <strong>{planoCusteio.responsavelNome}</strong>
                </div>
              </div>

              <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200">
                <div className="text-xs font-bold uppercase text-blue-700 mb-1">
                  Plano de Expansão Vinculado
                </div>
                <div className="font-bold text-slate-900">
                  {planoExpansao
                    ? planoExpansao.nome || planoExpansao.name
                    : planoCusteio.planoExpansaoId}
                </div>
                {planoExpansao && (
                  <>
                    <div className="text-xs text-slate-600 mt-1">
                      Período da Expansão:{' '}
                      <strong>
                        {obterPeriodoExpansaoYM(planoExpansao).labelComMeses}
                      </strong>{' '}
                      ({planoExpansao.status})
                    </div>
                    <div className="text-xs text-slate-600">
                      Escopo Físico: {planoExpansao.obras.length} obra(s) e{' '}
                      {planoExpansao.acoesUnidades.length} ação(ões)
                    </div>
                  </>
                )}
              </div>

              <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-200">
                <div className="text-xs font-bold uppercase text-emerald-700 mb-1">
                  Período do Custeio & Premissas
                </div>
                <div className="font-bold text-slate-900">
                  {formatYMDisplay(planoCusteio.dataInicio)} até{' '}
                  {formatYMDisplay(planoCusteio.dataFim)} ({cronogramaMensal.length} meses)
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Reajustes anuais: Serv.{' '}
                  {planoCusteio.parametrosSimulacao.taxaReajusteAnualServicos}% · Aq.{' '}
                  {planoCusteio.parametrosSimulacao.taxaReajusteAnualAquisicoes}% · Folha{' '}
                  {planoCusteio.parametrosSimulacao.taxaReajusteAnualPessoal}%
                </div>
              </div>
            </div>
          </section>

          {/* 2. Unidades Escolares, Ambientes Previstos e Entrada em Funcionamento */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              2. Unidades Escolares, Ambientes Previstos e Entrada em Funcionamento
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-bold">Unidade / Intervenção</th>
                    <th className="text-left px-3 py-2.5 font-bold">Escopo de Custeio</th>
                    <th className="text-left px-3 py-2.5 font-bold">Ambientes Considerados</th>
                    <th className="text-center px-3 py-2.5 font-bold">Salas / Turmas / Vagas</th>
                    <th className="text-center px-3 py-2.5 font-bold">Conclusão Obra</th>
                    <th className="text-center px-3 py-2.5 font-bold">Início Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planoCusteio.intervencoes.map(iv => (
                    <tr key={iv.id} className={!iv.ativoNoCusteio ? 'opacity-50 bg-slate-50' : ''}>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-800">{iv.nomeUnidadeOuObra}</div>
                        <div className="text-[11px] text-slate-500">
                          {iv.modeloCrecheNome} · {iv.localizacaoResumo}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            iv.escopo === 'unidade_completa'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {iv.escopo === 'unidade_completa'
                            ? 'Unidade Completa'
                            : 'Expansão Incremental'}
                        </span>
                        {iv.subtipoIntervencao === 'retomada' && (
                          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                            Retomada ({iv.percentualConclusaoObra || 0}%)
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-xs">
                        {iv.ambientesPrevistos
                          .map(a => `${a.quantidade}× ${a.nome}`)
                          .slice(0, 3)
                          .join(', ')}
                        {iv.ambientesPrevistos.length > 3
                          ? ` (+${iv.ambientesPrevistos.length - 3} ambientes)`
                          : ''}
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold">
                        +{iv.salasAdicionais} sl · {iv.turmasPrevistas} tr · +{iv.vagasAdicionais} vg
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-600">
                        {iv.dataConclusaoObra || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-blue-700">
                        {iv.ativoNoCusteio
                          ? formatYMDisplay(iv.dataInicioOperacao)
                          : 'Inativa no Cenário'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Custos Consolidados por Unidade Escolar / Intervenção (precisão de centavos) */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              3. Custos Consolidados por Unidade Escolar / Intervenção
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-bold">Unidade Escolar / Obra</th>
                    <th className="text-center px-2 py-2.5 font-bold">Meses</th>
                    <th className="text-right px-2.5 py-2.5 font-bold">1. Mobiliário</th>
                    <th className="text-right px-2.5 py-2.5 font-bold">2. Serviços</th>
                    <th className="text-right px-2.5 py-2.5 font-bold">3. Aquisições</th>
                    <th className="text-right px-2.5 py-2.5 font-bold">4. Pessoal</th>
                    <th className="text-right px-3 py-2.5 font-bold bg-slate-200/70">
                      Total no Período
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resumoPorIntervencao.map(r => (
                    <tr key={r.intervencaoId}>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{r.nome}</td>
                      <td className="px-2 py-2.5 text-center">{r.mesesOperacaoNoPeriodo}m</td>
                      <td className="px-2.5 py-2.5 text-right">{BRL(r.mobiliario)}</td>
                      <td className="px-2.5 py-2.5 text-right">{BRL(r.servicos)}</td>
                      <td className="px-2.5 py-2.5 text-right">{BRL(r.aquisicoesRecorrentes)}</td>
                      <td className="px-2.5 py-2.5 text-right">{BRL(r.pessoal)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-blue-800 bg-slate-50">
                        {BRL(r.totalPeriodo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-slate-900 font-bold">
                  <tr>
                    <td className="px-3 py-2.5">TOTAL GERAL CONSOLIDADO</td>
                    <td className="px-2 py-2.5 text-center">{cronogramaMensal.length}m</td>
                    <td className="px-2.5 py-2.5 text-right">
                      {BRL(resumoFinanceiro.totalMobiliarioPeriodo)}
                    </td>
                    <td className="px-2.5 py-2.5 text-right">
                      {BRL(resumoFinanceiro.totalServicosPeriodo)}
                    </td>
                    <td className="px-2.5 py-2.5 text-right">
                      {BRL(resumoFinanceiro.totalAquisicoesRecorrentesPeriodo)}
                    </td>
                    <td className="px-2.5 py-2.5 text-right">
                      {BRL(resumoFinanceiro.totalPessoalPeriodo)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-blue-900 font-black bg-blue-50">
                      {BRL(resumoFinanceiro.totalGeralPeriodo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 3.1. Detalhamento — Seção 1: Mobiliário & Equipamentos dos Ambientes */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              4. Detalhamento — Seção 1: Mobiliário & Equipamentos (Ambientes do Modelo)
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-amber-50 text-amber-900">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Unidade / Intervenção</th>
                    <th className="text-left px-3 py-2 font-bold">Ambiente do Modelo</th>
                    <th className="text-center px-3 py-2 font-bold">Qtd Amb.</th>
                    <th className="text-right px-3 py-2 font-bold">Custo Unit. (Mob.+Eq.)</th>
                    <th className="text-right px-3 py-2 font-bold">Total Implantação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projecao.mobiliario.map(m => (
                    <tr key={m.id}>
                      <td className="px-3 py-2 text-slate-600">
                        {mapIntervNome.get(m.intervencaoCusteioId) || 'Global'}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{m.descricao}</td>
                      <td className="px-3 py-2 text-center font-bold">{m.quantidade}</td>
                      <td className="px-3 py-2 text-right">{BRL(m.valorUnitario)}</td>
                      <td className="px-3 py-2 text-right font-bold">{BRL(m.valorTotalProjetado)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-amber-50/70 border-t-2 border-amber-200 font-bold text-amber-950">
                  <tr>
                    <td className="px-3 py-2" colSpan={4}>
                      SUBTOTAL SEÇÃO 1 — MOBILIÁRIO & EQUIPAMENTOS (AMBIENTES)
                    </td>
                    <td className="px-3 py-2 text-right">
                      {BRL(resumoFinanceiro.totalMobiliarioPeriodo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 4. Detalhamento — Categoria A: Serviços Operacionais */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-600" />
              4. Detalhamento — Categoria A: Serviços Operacionais (Base Anual do Modelo)
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Unidade / Intervenção</th>
                    <th className="text-left px-3 py-2 font-bold">Serviço</th>
                    <th className="text-left px-3 py-2 font-bold">Base do Modelo</th>
                    <th className="text-right px-3 py-2 font-bold">Custo Anual da Unidade</th>
                    <th className="text-center px-3 py-2 font-bold">Meses</th>
                    <th className="text-right px-3 py-2 font-bold">Total no Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projecao.servicos.map(s => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 text-slate-600">
                        {mapIntervNome.get(s.intervencaoCusteioId) || 'Global'}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{s.descricao}</td>
                      <td className="px-3 py-2 text-slate-600">
                        <strong>{formatProporcaoResumo(s)}</strong> (
                        {s.naturezaCusto === 'compartilhado_rede' ? 'Compartilhado' : 'Exclusivo'})
                      </td>
                      <td className="px-3 py-2 text-right">{BRL(s.valorAnualizado)}</td>
                      <td className="px-3 py-2 text-center">{s.ocorrenciasNoPeriodo}m</td>
                      <td className="px-3 py-2 text-right font-bold">
                        {BRL(s.valorTotalProjetado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <tr>
                    <td className="px-3 py-2" colSpan={3}>
                      SUBTOTAL CATEGORIA A — SERVIÇOS
                    </td>
                    <td className="px-3 py-2 text-right">{BRL(anualServicosAtivos)}/ano</td>
                    <td className="px-3 py-2 text-center">—</td>
                    <td className="px-3 py-2 text-right text-blue-800">
                      {BRL(resumoFinanceiro.totalServicosPeriodo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 5. Detalhamento — Categoria B: Aquisições de Consumo Anual */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              5. Detalhamento — Categoria B: Aquisições de Funcionamento (Base Anual do Modelo)
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-emerald-50 text-emerald-900">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Unidade / Intervenção</th>
                    <th className="text-left px-3 py-2 font-bold">Insumo / Aquisição</th>
                    <th className="text-left px-3 py-2 font-bold">Base do Modelo</th>
                    <th className="text-right px-3 py-2 font-bold">Custo Anual da Unidade</th>
                    <th className="text-center px-3 py-2 font-bold">Meses</th>
                    <th className="text-right px-3 py-2 font-bold">Total no Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aquisicoesRecorrentes.map(a => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 text-slate-600">
                        {mapIntervNome.get(a.intervencaoCusteioId) || 'Global'}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-800">{a.descricao}</td>
                      <td className="px-3 py-2 text-slate-600">
                        <strong>{formatProporcaoResumo(a)}</strong>
                      </td>
                      <td className="px-3 py-2 text-right">{BRL(a.valorAnualizado)}</td>
                      <td className="px-3 py-2 text-center">{a.ocorrenciasNoPeriodo}m</td>
                      <td className="px-3 py-2 text-right font-bold">
                        {BRL(a.valorTotalProjetado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-emerald-50/70 border-t-2 border-emerald-200 font-bold text-emerald-950">
                  <tr>
                    <td className="px-3 py-2" colSpan={3}>
                      SUBTOTAL CATEGORIA B — AQUISIÇÕES DE CONSUMO
                    </td>
                    <td className="px-3 py-2 text-right">{BRL(anualAqRecAtivas)}/ano</td>
                    <td className="px-3 py-2 text-center">—</td>
                    <td className="px-3 py-2 text-right">
                      {BRL(resumoFinanceiro.totalAquisicoesRecorrentesPeriodo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 6. Detalhamento — Categoria C: Pessoal e Folha de Pagamento */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              6. Detalhamento — Categoria C: Pessoal e Folha de Pagamento (×13,33/ANO)
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2 font-bold">Unidade / Intervenção</th>
                    <th className="text-left px-3 py-2 font-bold">Cargo / Função</th>
                    <th className="text-center px-3 py-2 font-bold">Qtd</th>
                    <th className="text-right px-3 py-2 font-bold">Custo Mensal Unit.</th>
                    <th className="text-right px-3 py-2 font-bold">Custo Anual da Linha</th>
                    <th className="text-center px-3 py-2 font-bold">Meses</th>
                    <th className="text-right px-3 py-2 font-bold">Total no Período</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projecao.pessoal.map(p => (
                    <tr key={p.id} className={p.quantidade === 0 ? 'text-slate-400' : ''}>
                      <td className="px-3 py-2">
                        {mapIntervNome.get(p.intervencaoCusteioId) || 'Global'}
                      </td>
                      <td className="px-3 py-2 font-semibold">
                        {p.funcao}
                        {p.naturezaCusto === 'compartilhado_rede' && p.quantidade === 0 && (
                          <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                            (Compartilhado)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{p.quantidade}</td>
                      <td className="px-3 py-2 text-right">{BRL(p.custoMensalUnitario)}</td>
                      <td className="px-3 py-2 text-right">{BRL(p.valorAnualizado)}</td>
                      <td className="px-3 py-2 text-center">{p.ocorrenciasNoPeriodo}m</td>
                      <td className="px-3 py-2 text-right font-bold">
                        {BRL(p.valorTotalProjetado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <tr>
                    <td className="px-3 py-2" colSpan={2}>
                      SUBTOTAL CATEGORIA C — PESSOAL E FOLHA
                    </td>
                    <td className="px-3 py-2 text-center">
                      {resumoFinanceiro.totalProfissionais} prof.
                    </td>
                    <td></td>
                    <td className="px-3 py-2 text-right">{BRL(anualPessoalAtivo)}/ano</td>
                    <td className="px-3 py-2 text-center">—</td>
                    <td className="px-3 py-2 text-right text-purple-800">
                      {BRL(resumoFinanceiro.totalPessoalPeriodo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 7. Cronograma Financeiro Consolidado por Exercício */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              7. Cronograma Financeiro Consolidado por Exercício
            </h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-bold">Exercício</th>
                    <th className="text-center px-3 py-2.5 font-bold">Meses no Plano</th>
                    <th className="text-right px-3 py-2.5 font-bold">1. Mobiliário</th>
                    <th className="text-right px-3 py-2.5 font-bold">2. Serviços</th>
                    <th className="text-right px-3 py-2.5 font-bold">3. Aquisições</th>
                    <th className="text-right px-3 py-2.5 font-bold">4. Pessoal e Folha</th>
                    <th className="text-right px-3 py-2.5 font-bold bg-blue-50 text-blue-900">
                      Total Anual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cronogramaAnual.map(a => (
                    <tr key={a.ano}>
                      <td className="px-3 py-2.5 font-black text-slate-800">{a.ano}</td>
                      <td className="px-3 py-2.5 text-center">{a.mesesNoPlano} meses</td>
                      <td className="px-3 py-2.5 text-right">{BRL(a.aquisicoesPontuais)}</td>
                      <td className="px-3 py-2.5 text-right">{BRL(a.servicos)}</td>
                      <td className="px-3 py-2.5 text-right">{BRL(a.aquisicoesRecorrentes)}</td>
                      <td className="px-3 py-2.5 text-right">{BRL(a.pessoal)}</td>
                      <td className="px-3 py-2.5 text-right font-bold bg-blue-50/40 text-blue-800">
                        {BRL(a.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <tr>
                    <td className="px-3 py-2.5">TOTAL ACUMULADO</td>
                    <td className="px-3 py-2.5 text-center">{cronogramaMensal.length} meses</td>
                    <td className="px-3 py-2.5 text-right">
                      {BRL(resumoFinanceiro.totalMobiliarioPeriodo)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {BRL(resumoFinanceiro.totalServicosPeriodo)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {BRL(resumoFinanceiro.totalAquisicoesRecorrentesPeriodo)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {BRL(resumoFinanceiro.totalPessoalPeriodo)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black bg-blue-50 text-blue-900">
                      {BRL(resumoFinanceiro.totalGeralPeriodo)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 8. Sustentabilidade Fiscal (FUNDEB / PNAE / MDE) e Visão Consolidada TCO (CAPEX + OPEX) */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              8. Sustentabilidade Fiscal (FUNDEB / PNAE / MDE) & Orçamento Global TCO (CAPEX + OPEX)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-xs">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <div className="font-bold uppercase text-[10px] text-emerald-800">
                  Receita Incremental FUNDEB + PNAE (Regime)
                </div>
                <div className="text-base font-black text-emerald-900 mt-0.5">
                  {BRL(sustentabilidadeFiscal.receitaVinculadaAnualRegime)}/ano
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  Cobre <strong>{sustentabilidadeFiscal.coberturaVinculadaRegimePct.toFixed(1)}%</strong> do custeio em regime pleno
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                <div className="font-bold uppercase text-[10px] text-amber-800">
                  Esforço Líquido Tesouro MDE (Regime)
                </div>
                <div className="text-base font-black text-amber-900 mt-0.5">
                  {BRL(sustentabilidadeFiscal.esforcoLiquidoTesouroMdeRegime)}/ano
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Complementação municipal além do FUNDEB/PNAE
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                <div className="font-bold uppercase text-[10px] text-purple-800">
                  Índice FUNDEB Magistério (Mín. 70%)
                </div>
                <div className="text-base font-black text-purple-900 mt-0.5">
                  {sustentabilidadeFiscal.indiceMagisterioFundebPct.toFixed(1)}%
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  Folha Pedagógica: {BRL(sustentabilidadeFiscal.folhaMagisterioAnualRegime)}/ano
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <div className="font-bold uppercase text-[10px] text-blue-800">
                  Custo Total de Propriedade (TCO Global)
                </div>
                <div className="text-base font-black text-blue-900 mt-0.5">
                  {BRL(sustentabilidadeFiscal.totalTcoGlobal)}
                </div>
                <div className="text-[11px] text-blue-700 mt-0.5">
                  CAPEX Obras ({BRL(sustentabilidadeFiscal.totalCapexPlanoExpansao)}) + OPEX ({BRL(sustentabilidadeFiscal.totalOpexPeriodoCusteio)})
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-2.5 font-bold">Exercício</th>
                    <th className="text-right px-3 py-2.5 font-bold">Obras e Ampliações (CAPEX)</th>
                    <th className="text-right px-3 py-2.5 font-bold">Operação (Serv + Aq + Folha)</th>
                    <th className="text-right px-3 py-2.5 font-bold bg-blue-50 text-blue-900">
                      Total TCO (CAPEX + OPEX)
                    </th>
                    <th className="text-right px-3 py-2.5 font-bold text-emerald-800">
                      Repasse Est. FUNDEB+PNAE
                    </th>
                    <th className="text-right px-3 py-2.5 font-bold bg-amber-50/70 text-amber-900">
                      Esforço Líquido MDE (OPEX)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sustentabilidadeFiscal.fluxoIntegradoAnual.map(row => (
                    <tr key={row.ano}>
                      <td className="px-3 py-2.5 font-black text-slate-800">
                        {row.ano}{' '}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({row.vagasEmOperacaoMediaAno} vg méd.)
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.capexObrasAcoes > 0 ? BRL(row.capexObrasAcoes) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.opexServicos + row.opexAquisicoesRecorrentes + row.opexPessoal > 0
                          ? BRL(row.opexServicos + row.opexAquisicoesRecorrentes + row.opexPessoal)
                          : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold bg-blue-50/40 text-blue-900">
                        {BRL(row.totalTcoMunicipal)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-emerald-700">
                        {row.receitaVinculadaTotal > 0 ? `+${BRL(row.receitaVinculadaTotal)}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold bg-amber-50/30 text-amber-900">
                        {row.esforcoLiquidoTesouroMde > 0
                          ? BRL(row.esforcoLiquidoTesouroMde)
                          : 'R$ 0,00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 9. Rastreabilidade de Ajustes Manuais */}
          <section>
            <h2 className="text-lg font-extrabold text-slate-800 border-b-2 border-blue-600 pb-2 mb-4 flex items-center gap-2">
              {itensAjustadosManualmente.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              9. Rastreabilidade de Simulação e Ajustes Manuais
            </h2>
            {itensAjustadosManualmente.length === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800">
                Todos os itens deste cenário utilizam integralmente os parâmetros automáticos dos catálogos de referência e regras proporcionais exatas.
              </div>
            ) : (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-amber-900">
                  Foram registrados {itensAjustadosManualmente.length} item(ns) com ajuste ou inclusão manual preservados no plano:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-amber-900">
                  {itensAjustadosManualmente.map(it => (
                    <li key={it.id}>
                      <strong>
                        [{it.catLabel}] {it.descricao}
                      </strong>{' '}
                      ({mapIntervNome.get(it.intervencaoCusteioId) || 'Global'}): Qtd {it.quantidade}{' '}
                      · Projetado {BRL(it.valorTotalProjetado)} (
                      {it.origemCalculo === 'incluido_manualmente'
                        ? 'Incluído manualmente'
                        : 'Ajustado manualmente'}
                      )
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* 9. Resumo Geral e Assinaturas Institucionais */}
          <section className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="text-xs uppercase tracking-wider text-blue-700 font-bold">
                  Total Consolidado do Plano de Custeio (
                  {formatYMDisplay(planoCusteio.dataInicio)} –{' '}
                  {formatYMDisplay(planoCusteio.dataFim)})
                </div>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {BRL(resumoFinanceiro.totalGeralPeriodo)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Contemplando +{resumoFinanceiro.totalSalasContempladas} salas, +
                  {resumoFinanceiro.totalVagasContempladas} vagas e{' '}
                  {resumoFinanceiro.totalProfissionais} profissionais
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="text-slate-500 font-semibold">Regime Pleno / Ano</div>
                  <div className="font-bold text-sm text-emerald-700 mt-0.5">
                    {BRL(resumoFinanceiro.custoAnualRegimePleno)}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="text-slate-500 font-semibold">Custo/Vaga/Ano</div>
                  <div className="font-bold text-sm text-slate-800 mt-0.5">
                    {BRL(resumoFinanceiro.custoPorVagaAdicionalAno)}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="text-slate-500 font-semibold">Média Anual (Período)</div>
                  <div className="font-bold text-sm text-slate-800 mt-0.5">
                    {BRL(resumoFinanceiro.custoMedioAnual)}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <div className="text-slate-500 font-semibold">Variação vs. Base</div>
                  <div
                    className={`font-bold text-sm mt-0.5 ${
                      Math.abs(deltaSimulacao) < 0.01
                        ? 'text-slate-700'
                        : deltaSimulacao > 0
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {deltaSimulacao >= 0 ? '+' : ''}
                    {BRL(deltaSimulacao)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 mt-4 text-center text-xs text-slate-600">
              <div className="border-t border-slate-400 pt-2">
                <strong className="text-slate-800">{planoCusteio.responsavelNome}</strong>
                <div>Responsável pela Elaboração do Plano de Custeio</div>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <strong className="text-slate-800">
                  Secretaria Municipal de Educação — SEMED
                </strong>
                <div>Homologação Orçamentária e Financeira</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
