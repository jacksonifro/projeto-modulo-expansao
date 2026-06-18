import { useState } from 'react';
import { ChevronLeft, Download, Printer, FileText, Mail, Users, TrendingUp, PieChart, Building2, LayoutDashboard, FileBarChart } from 'lucide-react';
import { mockPlans, mockSchools, mockActivities, mockDemandaEtapa, mockUnidades, mockDemandaBairro } from './mockData';
import { mockCargosReferencia } from './mockDataCusto';
import { ExpansionPlan, MembroEquipe, ObraConstrucao, AcaoUnidade, CargoReferencia } from './types';
import { getActivities } from './Kanban';

interface ReportViewProps {
  reportType: string;
  filters: any;
  onBack: () => void;
}

export default function ReportView({ reportType, filters, onBack }: ReportViewProps) {
  const reportTitles: { [key: string]: string } = {
    'diagnostico-demanda': 'Relatório Diagnóstico de Demanda Escolar',
    'expansao-vagas-obras': 'Relatório de Expansão de Vagas e Obras',
    'orcamentario-financeiro': 'Relatório Orçamentário e Financeiro',
    'planejamento-pessoal': 'Relatório de Planejamento de Pessoal',
    'acompanhamento-execucao': 'Relatório de Acompanhamento de Execução',
    'geral-plano': 'Relatório Consolidado do Plano',
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const [plans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

  const [cargosRef] = useState<CargoReferencia[]>(() => {
    const cached = localStorage.getItem("exp_creches_cargos_ref");
    return cached ? JSON.parse(cached) : mockCargosReferencia;
  });

  const filteredPlans = filters.planoId
    ? plans.filter(p => p.id === filters.planoId)
    : plans;

  // Use the active plan (or the first one) to fetch data like obras, acoes, equipe
  const activePlan = filteredPlans[0] || plans[0];
  const obras = activePlan?.obras || [];
  const acoes = activePlan?.acoesUnidades || [];
  const equipe = activePlan?.equipe || [];

  const atividadesPlano = getActivities().filter(a => a.planId === activePlan?.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FEITO': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">FEITO</span>;
      case 'FAZENDO': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">FAZENDO</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">A FAZER</span>;
    }
  };

  const getCategoryDotColor = (category: string | undefined) => {
    switch (category) {
      case 'Planejamento e Captação': return 'bg-purple-500';
      case 'Licitação e Contratação': return 'bg-blue-500';
      case 'Execução da Obra': return 'bg-amber-500';
      case 'Entrega da Obra': return 'bg-green-500';
      case 'Implantação da Escola': return 'bg-pink-500';
      default: return 'bg-slate-400';
    }
  };

  const filteredUnidades = filters.escolaId
    ? mockUnidades.filter(s => s.id === filters.escolaId)
    : mockUnidades;

  // --- Funções de Ajuda e Cálculos ---
  const BRL = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Diagnóstico
  const totalCadUnico = mockDemandaEtapa.reduce((sum, d) => sum + d.criancasResidentes, 0);
  const totalVagasAtuais = mockDemandaEtapa.reduce((sum, d) => sum + d.vagasAtuais, 0);
  const totalDeficit = totalCadUnico - totalVagasAtuais;
  const taxaAtendimento = totalCadUnico > 0 ? Math.round((totalVagasAtuais / totalCadUnico) * 100) : 0;

  // Financeiro
  const sumObras = obras.reduce((sum, o) => {
    const totalDesembolso = o.desembolsoPorAno?.reduce((s, d) => s + d.valor, 0) || 0;
    return sum + totalDesembolso;
  }, 0);
  const sumAcoes = acoes.reduce((sum, a) => sum + (a.custoPorSala * 1), 0);
  const totalGeral = sumObras + sumAcoes;

  // Pessoal
  const novasSalasPrevistas = obras.reduce((sum, o) => sum + (o.numeroDeSalas || 0), 0) + acoes.length;
  
  const pessoal = activePlan?.pessoal || [];
  const configSalas = activePlan?.configSalas || [];

  const calcularCustoPessoal = (item: any) => {
    const cargoConf = cargosRef.find((c: any) => c.descricao === item.funcao);
    const patronal = cargoConf ? cargoConf.patronal : 0;
    const custoMensal = (item.remuneracaoBase + item.auxilios + patronal) * item.quantidade;
    const custoAnual = custoMensal * 13.3; // 13º salário + 1/3 Férias
    return { patronal, custoMensal, custoAnual };
  };

  const totalContratacoes = pessoal.reduce((sum, p) => sum + p.quantidade, 0);
  const custoMensalPessoal = pessoal.reduce((sum, p) => sum + calcularCustoPessoal(p).custoMensal, 0);
  const custoAnualPessoal = pessoal.reduce((sum, p) => sum + calcularCustoPessoal(p).custoAnual, 0);
  const totalTurmas = configSalas.reduce((sum, c) => sum + c.numeroTurmas, 0);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar aos Filtros
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-800">Visualização do Relatório</h1>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                <Mail className="w-5 h-5" />
                Enviar
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm" onClick={() => window.print()}>
                <Printer className="w-5 h-5" />
                Imprimir
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                <Download className="w-5 h-5" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        {/* Documento do Relatório */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden print:shadow-none">
          {/* Cabeçalho do Documento */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 print:bg-white print:text-black print:border-b-2 print:border-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  SISTEMA DE GESTÃO DE VAGAS EM CRECHE
                </h2>
                <p className="text-blue-100 text-lg print:text-slate-600">Módulo: Expansão de Creches</p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 px-4 py-2 rounded-lg print:bg-transparent print:p-0">
                  <p className="text-sm text-blue-100 print:text-slate-500">Data de Emissão</p>
                  <p className="font-bold print:text-slate-800">{getCurrentDate()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Corpo do Documento */}
          <div className="p-8 space-y-8" style={{ minHeight: '800px' }}>
            {/* Título do Relatório */}
            <div className="border-b-2 border-blue-600 pb-4">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {reportTitles[reportType] || 'Relatório'}
              </h3>
              <div className="flex gap-6 text-sm text-slate-600">
                {filters.planoId && (
                  <div>
                    <span className="font-semibold">Plano Selecionado:</span>{' '}
                    {activePlan?.nome || activePlan?.name || 'N/A'}
                  </div>
                )}
                {filters.escolaId && (
                  <div>
                    <span className="font-semibold">Unidade:</span>{' '}
                    {mockUnidades.find(u => u.id === filters.escolaId)?.nome || 'Todas'}
                  </div>
                )}
              </div>
            </div>

            {/* Renderização Condicional baseada no reportType */}

            {/* 1. Diagnóstico de Demanda */}
            {reportType === 'diagnostico-demanda' && (
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-indigo-500" /> Resumo da Demanda
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm text-indigo-700 font-semibold mb-1">Crianças (CadÚnico)</p>
                    <p className="text-3xl font-bold text-indigo-900">{totalCadUnico}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Vagas Atuais</p>
                    <p className="text-3xl font-bold text-blue-900">{totalVagasAtuais}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-semibold mb-1">Déficit Atual</p>
                    <p className="text-3xl font-bold text-red-900">{totalDeficit}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-700 font-semibold mb-1">Taxa de Atendimento</p>
                    <p className="text-3xl font-bold text-amber-900">{taxaAtendimento}%</p>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Demanda por Etapa</h4>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Etapa</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">CadÚnico</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">Vagas</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">Déficit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {mockDemandaEtapa.map(d => (
                      <tr key={d.etapa}>
                        <td className="px-4 py-2 font-medium">{d.etapa}</td>
                        <td className="px-4 py-2 text-right">{d.criancasResidentes}</td>
                        <td className="px-4 py-2 text-right">{d.vagasAtuais}</td>
                        <td className="px-4 py-2 text-right text-red-600 font-semibold">{d.deficitAtual}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Fila de Espera por Unidade Escolar</h4>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b border-slate-300">Unidade Escolar</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700 border-b border-slate-300">Maternal</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700 border-b border-slate-300">Jardim I</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700 border-b border-slate-300">Jardim II</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700 border-b border-slate-300">Total Fila</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredUnidades.filter(u => u.totalListaEspera > 0).map(u => (
                      <tr key={u.id}>
                        <td className="px-4 py-2 font-medium text-slate-800">{u.nome}</td>
                        <td className="px-4 py-2 text-center">{u.vagasPorEtapa.find(v => v.etapa === 'Maternal')?.listaEspera || 0}</td>
                        <td className="px-4 py-2 text-center">{u.vagasPorEtapa.find(v => v.etapa === 'Jardim I')?.listaEspera || 0}</td>
                        <td className="px-4 py-2 text-center">{u.vagasPorEtapa.find(v => v.etapa === 'Jardim II')?.listaEspera || 0}</td>
                        <td className="px-4 py-2 text-right font-bold text-orange-600">{u.totalListaEspera}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Expansão de Vagas e Obras */}
            {reportType === 'expansao-vagas-obras' && (
              <div className="space-y-6">
                 <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-emerald-500" /> Resumo da Expansão
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm text-emerald-700 font-semibold mb-1">Novas Salas Previstas</p>
                    <p className="text-3xl font-bold text-emerald-900">{novasSalasPrevistas}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Novas Vagas (Ações)</p>
                    <p className="text-3xl font-bold text-blue-900">{acoes.reduce((s, a) => s + (a.novaCapacidade - a.capacidadeAnterior), 0)}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-700 font-semibold mb-1">Obras Planejadas</p>
                    <p className="text-3xl font-bold text-purple-900">{obras.length}</p>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Ações em Unidades (Ampliação/Adaptação)</h4>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Unidade</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Ação</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700">Salas Add</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700">Vagas Add</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Previsão Conclusão</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Atividades (%)</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {acoes.map(a => {
                      const unidade = mockUnidades.find(u => u.id === a.unidadeId);
                      const vagasAdd = a.novaCapacidade - a.capacidadeAnterior;
                      
                      const atividadesDestaAcao = atividadesPlano.filter(t => t.itemId === a.id && t.itemType === 'acao-unidade');
                      const totalAtiv = atividadesDestaAcao.length;
                      const concluidas = atividadesDestaAcao.filter(t => t.status === 'FEITO').length;
                      const porcentagem = totalAtiv > 0 ? Math.round((concluidas / totalAtiv) * 100) : 0;

                      return (
                      <tr key={a.id}>
                        <td className="px-4 py-2">{unidade?.nome || 'Unidade'}</td>
                        <td className="px-4 py-2">{a.tipo}</td>
                        <td className="px-4 py-2 text-center">1</td>
                        <td className="px-4 py-2 text-center text-blue-600 font-bold">+{vagasAdd}</td>
                        <td className="px-4 py-2">{a.previsaoConclusao || '-'}</td>
                        <td className="px-4 py-2">
                          {totalAtiv > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${porcentagem}%` }}></div>
                              </div>
                              <span className="text-xs font-semibold text-slate-600">{porcentagem}%</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Sem kanban</span>
                          )}
                        </td>
                        <td className="px-4 py-2">Planejada</td>
                      </tr>
                    )})}
                  </tbody>
                </table>

                <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Obras (Construção/Retomada)</h4>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Identificação</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Tipo</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700">Salas</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Previsão Conclusão</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Atividades (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {obras.map(o => {
                      const atividadesDestaObra = atividadesPlano.filter(t => t.itemId === o.id && t.itemType === 'obra');
                      const totalAtiv = atividadesDestaObra.length;
                      const concluidas = atividadesDestaObra.filter(t => t.status === 'FEITO').length;
                      const porcentagem = totalAtiv > 0 ? Math.round((concluidas / totalAtiv) * 100) : 0;
                      
                      return (
                      <tr key={o.id}>
                        <td className="px-4 py-2 font-semibold">{o.nome}</td>
                        <td className="px-4 py-2">{o.tipoProjetoFNDE === 'proprio' ? 'Projeto Próprio' : (o.tipoProjetoFNDE || 'Padrão FNDE')}</td>
                        <td className="px-4 py-2 text-center">{o.numeroDeSalas}</td>
                        <td className="px-4 py-2">{o.previsaoConclusao}</td>
                        <td className="px-4 py-2">
                          {totalAtiv > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${porcentagem}%` }}></div>
                              </div>
                              <span className="text-xs font-semibold text-slate-600">{porcentagem}%</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Sem kanban</span>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>

                {atividadesPlano.length > 0 && (
                  <>
                    <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Situação das Tarefas (Kanban)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b border-slate-300">Ação / Obra</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b border-slate-300">Tarefa</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b border-slate-300">Categoria</th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-700 border-b border-slate-300">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {atividadesPlano.map(a => {
                            let itemName = 'Desconhecido';
                            if (a.itemType === 'obra') {
                              const obra = obras.find(o => o.id === a.itemId);
                              if (obra) itemName = obra.nome;
                            } else if (a.itemType === 'acao-unidade') {
                              const acao = acoes.find(ac => ac.id === a.itemId);
                              if (acao) {
                                const unidade = mockUnidades.find(u => u.id === acao.unidadeId);
                                itemName = unidade ? `Ação: ${unidade.nome}` : 'Ação em Unidade';
                              }
                            }
                            return (
                              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-800">{itemName}</td>
                                <td className="px-4 py-3 text-slate-600">{a.name}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getCategoryDotColor(a.category)} flex-shrink-0`} />
                                    <span className="text-slate-600 truncate max-w-[150px]" title={a.category}>{a.category || 'Sem Categoria'}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">{getStatusBadge(a.status)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. Orçamentário e Financeiro */}
            {reportType === 'orcamentario-financeiro' && (
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileBarChart className="w-6 h-6 text-blue-600" /> Resumo Financeiro do Plano
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Total de Fontes (Receitas)</p>
                    <p className="text-2xl font-bold text-blue-900">{BRL(activePlan.fontesFinanciamento?.reduce((s,f) => s + f.valorPrevisto, 0) || 0)}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-700 font-semibold mb-1">Investimento Total Previsto</p>
                    <p className="text-2xl font-bold text-orange-900">{BRL(totalGeral)}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700 font-semibold mb-1">Saldo Estimado</p>
                    <p className="text-2xl font-bold text-green-900">{BRL((activePlan.fontesFinanciamento?.reduce((s,f) => s + f.valorPrevisto, 0) || 0) - totalGeral)}</p>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Distribuição de Fontes de Financiamento</h4>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Fonte (Origem)</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">Valor Disponível</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activePlan.fontesFinanciamento?.map((f, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{f.fonte}</td>
                        <td className="px-4 py-2 text-right font-semibold">{BRL(f.valorPrevisto)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Cronograma de Desembolso</h4>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Ano</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">Valor Previsto</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">% do Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Consolidar desembolso de obras e ações */}
                    {(() => {
                      const anos: { [ano: number]: number } = {};
                      obras.forEach(o => {
                        o.desembolsoPorAno?.forEach(d => {
                          anos[d.ano] = (anos[d.ano] || 0) + d.valor;
                        });
                      });
                      acoes.forEach(a => {
                        a.desembolsoPorAno?.forEach(d => {
                          anos[d.ano] = (anos[d.ano] || 0) + d.valor;
                        });
                      });
                      return Object.entries(anos).sort().map(([ano, valor], i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-semibold">{ano}</td>
                          <td className="px-4 py-2 text-right">{BRL(valor)}</td>
                          <td className="px-4 py-2 text-right text-slate-500">
                            {totalGeral > 0 ? Math.round((valor / totalGeral) * 100) : 0}%
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Planejamento de Pessoal */}
            {reportType === 'planejamento-pessoal' && (
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-amber-500" /> Dimensionamento de Equipe Escolar
                </h4>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                  <p className="text-amber-800 mb-2">Este relatório apresenta o detalhamento do quadro de pessoal necessário para o plano, considerando a configuração de turmas e os custos parametrizados na Folha de Pagamento.</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="border border-slate-200 rounded-lg p-5 bg-white">
                    <h5 className="font-bold text-slate-700 mb-4 border-b pb-2">Contratações Previstas</h5>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Total de Profissionais</span>
                      <span className="font-bold">{totalContratacoes}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Turmas a serem atendidas</span>
                      <span className="font-bold">{totalTurmas}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-5 bg-white">
                    <h5 className="font-bold text-slate-700 mb-4 border-b pb-2">Impacto Financeiro Consolidado</h5>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Custo Total Mensal</span>
                      <span className="font-bold text-slate-800">{BRL(custoMensalPessoal)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-600">Custo Anual (c/ 13º e 1/3 Férias)</span>
                      <span className="font-bold text-red-600">{BRL(custoAnualPessoal)}</span>
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Detalhamento por Função</h4>
                <table className="w-full text-sm border-collapse mb-8">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Função</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Categoria</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700">Qtd</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">Base+Auxílios (Mês)</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">Patronal (Mês)</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-700">Total Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pessoal.map(p => {
                      const { patronal, custoMensal } = calcularCustoPessoal(p);
                      return (
                      <tr key={p.id}>
                        <td className="px-4 py-2 font-medium">{p.funcao || 'Não informada'}</td>
                        <td className="px-4 py-2 capitalize">{p.categoria}</td>
                        <td className="px-4 py-2 text-center font-bold text-blue-600">{p.quantidade}</td>
                        <td className="px-4 py-2 text-right">{BRL((p.remuneracaoBase + p.auxilios) * p.quantidade)}</td>
                        <td className="px-4 py-2 text-right text-slate-500">{BRL(patronal * p.quantidade)}</td>
                        <td className="px-4 py-2 text-right font-semibold">{BRL(custoMensal)}</td>
                      </tr>
                    )})}
                    {pessoal.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-slate-500">Nenhum profissional planejado.</td></tr>
                    )}
                  </tbody>
                </table>

                {configSalas.length > 0 && (
                  <>
                    <h4 className="text-lg font-bold text-slate-800 mt-8 mb-4">Configuração de Turmas (Origem da Demanda)</h4>
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b border-slate-300">Origem</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b border-slate-300">Nome da Sala</th>
                          <th className="px-4 py-2 text-center font-semibold text-slate-700 border-b border-slate-300">Número de Turmas</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700 border-b border-slate-300">Etapas Atendidas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {configSalas.map(c => (
                          <tr key={c.id}>
                            <td className="px-4 py-2 capitalize font-medium text-slate-700">{c.origem}</td>
                            <td className="px-4 py-2 text-slate-800">{c.nome}</td>
                            <td className="px-4 py-2 text-center font-bold text-blue-600">{c.numeroTurmas}</td>
                            <td className="px-4 py-2 text-slate-600">{c.etapas.join(', ') || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            {/* 5. Acompanhamento de Execução */}
            {reportType === 'acompanhamento-execucao' && (
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-orange-500" /> Acompanhamento de Atividades (Kanban)
                </h4>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-sm text-slate-600 font-semibold mb-1">A Fazer</p>
                    <p className="text-2xl font-bold text-slate-800">{atividadesPlano.filter(a => a.status === 'A FAZER').length}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-semibold mb-1">Em Andamento</p>
                    <p className="text-2xl font-bold text-blue-900">{atividadesPlano.filter(a => a.status === 'FAZENDO').length}</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-700 font-semibold mb-1">Concluídas</p>
                    <p className="text-2xl font-bold text-green-900">{atividadesPlano.filter(a => a.status === 'FEITO').length}</p>
                  </div>
                </div>

                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Título da Atividade</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Responsável</th>
                      <th className="px-4 py-2 text-center font-semibold text-slate-700">Prazo</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {atividadesPlano.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-800">{a.name}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {(a.responsible || 'NI').substring(0, 2).toUpperCase()}
                            </span>
                            {a.responsible || 'Não informado'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center text-slate-500">
                          {a.deadline ? new Date(a.deadline).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-4 py-2">
                          {getStatusBadge(a.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 6. Visão Geral do Plano */}
            {reportType === 'geral-plano' && (
              <div className="space-y-8">
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <LayoutDashboard className="w-6 h-6 text-purple-600" /> Resumo Executivo
                </h4>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <div className="mb-4 pb-4 border-b border-slate-100">
                    <h5 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome do Plano</h5>
                    <p className="text-2xl font-bold text-slate-800">{activePlan.nome || activePlan.name}</p>
                    <p className="text-slate-600 mt-2">{activePlan.descricao || activePlan.description}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Status Geral</p>
                      <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold text-sm">Em Execução</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Ações Planejadas</p>
                      <p className="text-xl font-bold text-slate-800 mt-1">{acoes.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Obras FNDE/Próprias</p>
                      <p className="text-xl font-bold text-slate-800 mt-1">{obras.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Valor Estimado</p>
                      <p className="text-xl font-bold text-slate-800 mt-1">{BRL(totalGeral)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-bold text-slate-700 mb-4">Estratégias de Ação</h5>
                    <ul className="space-y-3">
                      {activePlan.estrategias?.map((est, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <span className="text-slate-700 text-sm leading-relaxed">{est.estrategia}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-700 mb-4">Equipe Responsável</h5>
                    <div className="space-y-3">
                      {equipe.map(m => (
                        <div key={m.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                            US
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-800">Servidor ID: {m.servidorId}</p>
                            <p className="text-xs text-slate-500 uppercase">{m.papel}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Rodapé do Documento */}
          <div className="bg-slate-100 border-t border-slate-300 px-8 py-4 print:bg-white print:border-t-2 print:border-slate-800">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <div>
                <p className="font-semibold">Sistema de Gestão de Vagas em Creche</p>
                <p>Módulo: Expansão de Creches</p>
              </div>
              <div className="text-right">
                <p>Relatório gerado em {getCurrentDate()}</p>
                <p className="text-xs mt-1">Documento eletrônico - válido sem assinatura</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
