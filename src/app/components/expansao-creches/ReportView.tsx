import { useState } from 'react';
import { ChevronLeft, Download, Printer, FileText, Mail } from 'lucide-react';
import { mockPlans, mockSchools, mockActivities } from './mockData';
import { ExpansionPlan } from './types';

interface ReportViewProps {
  reportType: string;
  filters: any;
  onBack: () => void;
}

export default function ReportView({ reportType, filters, onBack }: ReportViewProps) {
  const reportTitles: { [key: string]: string } = {
    'geral-planos': 'Relatório Geral de Planos de Expansão',
    'geral-escolas': 'Relatório Geral de Escolas',
    'andamento-obras': 'Relatório de Andamento de Obras',
    'cronograma': 'Relatório de Cronograma de Entregas',
    'atividades': 'Relatório de Atividades',
    'orcamentario': 'Relatório Orçamentário',
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

  const filteredPlans = filters.planoId
    ? plans.filter(p => p.id === filters.planoId)
    : plans;

  const filteredSchools = filters.escolaId
    ? mockSchools.filter(s => s.id === filters.escolaId)
    : filters.planoId
    ? mockSchools.filter(s => s.planId === filters.planoId)
    : mockSchools;

  const getSchoolProgress = (schoolId: string) => {
    const activities = mockActivities.filter(a => a.schoolId === schoolId);
    if (activities.length === 0) return 0;
    const completed = activities.filter(a => a.status === 'FEITO').length;
    return Math.round((completed / activities.length) * 100);
  };

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
                Enviar por Email
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm">
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
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
          {/* Cabeçalho do Documento */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  SISTEMA DE GESTÃO DE VAGAS EM CRECHE
                </h2>
                <p className="text-blue-100 text-lg">Módulo: Expansão de Creches</p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-sm text-blue-100">Data de Emissão</p>
                  <p className="font-bold">{getCurrentDate()}</p>
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
                <div>
                  <span className="font-semibold">Período:</span>{' '}
                  {filters.dataInicio && filters.dataFim
                    ? `${new Date(filters.dataInicio).toLocaleDateString('pt-BR')} a ${new Date(filters.dataFim).toLocaleDateString('pt-BR')}`
                    : 'Todos os períodos'}
                </div>
                {filters.planoId && (
                  <div>
                    <span className="font-semibold">Plano:</span>{' '}
                    {plans.find(p => p.id === filters.planoId)?.name || 'N/A'}
                  </div>
                )}
              </div>
            </div>

            {/* Sumário Executivo */}
            <div>
              <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded" />
                Sumário Executivo
              </h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700 font-semibold mb-1">Total de Planos</p>
                  <p className="text-3xl font-bold text-blue-900">{filteredPlans.length}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-semibold mb-1">Total de Escolas</p>
                  <p className="text-3xl font-bold text-green-900">{filteredSchools.length}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-700 font-semibold mb-1">Em Andamento</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {filteredSchools.filter(s => s.status === 'Em andamento').length}
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-700 font-semibold mb-1">Concluídas</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {filteredSchools.filter(s => s.status === 'Concluída').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Detalhamento por Plano */}
            {reportType === 'geral-planos' && (
              <div>
                <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded" />
                  Detalhamento dos Planos
                </h4>
                <div className="space-y-4">
                  {filteredPlans.map(plan => (
                    <div key={plan.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-lg font-bold text-slate-800">{plan.name}</h5>
                            <p className="text-sm text-slate-600">{plan.description}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            plan.status === 'Em execução' ? 'bg-green-100 text-green-700' :
                            plan.status === 'Planejamento' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {plan.status}
                          </span>
                        </div>
                      </div>
                      <div className="px-6 py-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600 font-semibold mb-1">Órgão Responsável</p>
                            <p className="text-slate-800">{plan.responsible}</p>
                          </div>
                          <div>
                            <p className="text-slate-600 font-semibold mb-1">Valor Estimado</p>
                            <p className="text-slate-800 font-bold">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.estimatedValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600 font-semibold mb-1">Fonte de Recurso</p>
                            <p className="text-slate-800">{plan.fundingSource}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalhamento por Escola */}
            {(reportType === 'geral-escolas' || reportType === 'andamento-obras') && (
              <div>
                <h4 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded" />
                  {reportType === 'andamento-obras' ? 'Andamento das Obras' : 'Detalhamento das Escolas'}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-300">
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Código</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Nome da Escola</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Bairro</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Vagas</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Status</th>
                        {reportType === 'andamento-obras' && (
                          <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Progresso</th>
                        )}
                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">Responsável</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.map((school, index) => (
                        <tr key={school.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="px-4 py-3 text-sm text-slate-600 font-mono">{school.code}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 font-semibold">{school.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{school.neighborhood}</td>
                          <td className="px-4 py-3 text-sm text-slate-800 font-semibold">{school.expectedVacancies}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              school.status === 'Em andamento' ? 'bg-green-100 text-green-700' :
                              school.status === 'Planejamento' ? 'bg-blue-100 text-blue-700' :
                              school.status === 'Atrasada' ? 'bg-red-100 text-red-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {school.status}
                            </span>
                          </td>
                          {reportType === 'andamento-obras' && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${getSchoolProgress(school.id)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-slate-700 min-w-[40px]">
                                  {getSchoolProgress(school.id)}%
                                </span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-slate-600">{school.technicalResponsible}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Observações */}
            {filters.incluirDetalhes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h4 className="text-lg font-bold text-yellow-900 mb-2">Observações</h4>
                <p className="text-sm text-yellow-800">
                  Este relatório foi gerado automaticamente pelo Sistema de Gestão de Vagas em Creche.
                  Os dados apresentados refletem o estado atual do sistema no momento da emissão.
                  Para informações mais detalhadas, consulte os módulos específicos do sistema.
                </p>
              </div>
            )}
          </div>

          {/* Rodapé do Documento */}
          <div className="bg-slate-100 border-t border-slate-300 px-8 py-4">
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
