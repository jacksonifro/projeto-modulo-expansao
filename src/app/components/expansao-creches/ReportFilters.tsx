import { useState } from 'react';
import { ChevronLeft, FileText, Download, Printer, X } from 'lucide-react';
import { mockPlans, mockSchools } from './mockData';
import { ExpansionPlan } from './types';

interface ReportFiltersProps {
  reportType: string;
  onNavigate: (view: string, data?: any) => void;
  onBack: () => void;
}

export default function ReportFilters({ reportType, onNavigate, onBack }: ReportFiltersProps) {
  const [plans] = useState<ExpansionPlan[]>(() => {
    const cached = localStorage.getItem("exp_creches_plans");
    return cached ? JSON.parse(cached) : mockPlans;
  });

  const [filters, setFilters] = useState({
    planoId: '',
    escolaId: '',
    dataInicio: '',
    dataFim: '',
    status: '',
    responsavel: '',
    valorMin: '',
    valorMax: '',
    incluirDetalhes: false,
    incluirAtividades: false,
    incluirDocumentos: false,
    agruparPorPlano: false,
    agruparPorStatus: false,
  });

  const reportTitles: { [key: string]: string } = {
    'geral-planos': 'Relatório Geral de Planos de Expansão',
    'geral-escolas': 'Relatório Geral de Escolas',
    'andamento-obras': 'Relatório de Andamento de Obras',
    'cronograma': 'Relatório de Cronograma de Entregas',
    'atividades': 'Relatório de Atividades',
    'orcamentario': 'Relatório Orçamentário',
  };

  const handleEmitReport = () => {
    onNavigate('report-view', { reportType, filters });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            {reportTitles[reportType] || 'Emitir Relatório'}
          </h1>
          <p className="text-slate-600 text-lg">Configure os filtros para personalizar o relatório</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-8 space-y-8">
            {/* Filtros Principais */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-blue-500 inline-block">
                Filtros Principais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Plano de Expansão
                  </label>
                  <select
                    value={filters.planoId}
                    onChange={(e) => setFilters({ ...filters, planoId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todos os planos</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Escola
                  </label>
                  <select
                    value={filters.escolaId}
                    onChange={(e) => setFilters({ ...filters, escolaId: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todas as escolas</option>
                    {mockSchools.map(school => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Todos os status</option>
                    <option value="Planejamento">Planejamento</option>
                    <option value="Em andamento">Em Andamento</option>
                    <option value="Atrasada">Atrasada</option>
                    <option value="Paralisada">Paralisada</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Período */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-green-500 inline-block">
                Período
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={filters.dataInicio}
                    onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={filters.dataFim}
                    onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Filtros Avançados */}
            {(reportType === 'orcamentario' || reportType === 'geral-planos') && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-purple-500 inline-block">
                  Filtros Orçamentários
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Valor Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      value={filters.valorMin}
                      onChange={(e) => setFilters({ ...filters, valorMin: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Valor Máximo (R$)
                    </label>
                    <input
                      type="number"
                      value={filters.valorMax}
                      onChange={(e) => setFilters({ ...filters, valorMax: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Opções de Visualização */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-orange-500 inline-block">
                Opções de Visualização
              </h2>
              <div className="space-y-3 mt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.incluirDetalhes}
                    onChange={(e) => setFilters({ ...filters, incluirDetalhes: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium group-hover:text-blue-600 transition-colors">
                    Incluir detalhes completos de cada item
                  </span>
                </label>

                {reportType !== 'orcamentario' && (
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.incluirAtividades}
                      onChange={(e) => setFilters({ ...filters, incluirAtividades: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-medium group-hover:text-blue-600 transition-colors">
                      Incluir lista de atividades
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.incluirDocumentos}
                    onChange={(e) => setFilters({ ...filters, incluirDocumentos: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium group-hover:text-blue-600 transition-colors">
                    Incluir referências de documentos anexados
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.agruparPorPlano}
                    onChange={(e) => setFilters({ ...filters, agruparPorPlano: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium group-hover:text-blue-600 transition-colors">
                    Agrupar por plano de expansão
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.agruparPorStatus}
                    onChange={(e) => setFilters({ ...filters, agruparPorStatus: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 font-medium group-hover:text-blue-600 transition-colors">
                    Agrupar por status
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer de Ações */}
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-6 flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
            <button
              onClick={handleEmitReport}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <FileText className="w-5 h-5" />
              Emitir Relatório
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
