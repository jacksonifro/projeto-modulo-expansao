import { useState } from 'react';
import { ChevronLeft, FileText, Building2, BarChart3, TrendingUp, Calendar, FileBarChart, PieChart, Users, LayoutDashboard } from 'lucide-react';

interface ReportsProps {
  onNavigate: (view: string, reportType?: string) => void;
  onBack: () => void;
}

export default function Reports({ onNavigate, onBack }: ReportsProps) {
  const reportTypes = [
    {
      id: 'diagnostico-demanda',
      title: 'Diagnóstico de Demanda Escolar',
      description: 'Análise de fila de espera, CadÚnico e taxa de atendimento.',
      icon: PieChart,
      color: 'bg-indigo-500',
    },
    {
      id: 'expansao-vagas-obras',
      title: 'Expansão de Vagas e Obras',
      description: 'Mapeamento de novas vagas por obras e ações de ampliação.',
      icon: Building2,
      color: 'bg-emerald-500',
    },
    {
      id: 'orcamentario-financeiro',
      title: 'Orçamentário e Financeiro',
      description: 'Custos do plano, fluxo de desembolso e fontes de financiamento.',
      icon: FileBarChart,
      color: 'bg-blue-600',
    },
    {
      id: 'planejamento-pessoal',
      title: 'Planejamento de Pessoal',
      description: 'Necessidade de contratação, professores, auxiliares e impacto financeiro.',
      icon: Users,
      color: 'bg-amber-500',
    },
    {
      id: 'acompanhamento-execucao',
      title: 'Acompanhamento de Execução',
      description: 'Progresso das atividades e status das obras em andamento.',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      id: 'geral-plano',
      title: 'Visão Geral do Plano',
      description: 'Sumário executivo consolidado com objetivos e principais indicadores.',
      icon: LayoutDashboard,
      color: 'bg-purple-600',
    },
  ];

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
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Menu de Relatórios</h1>
          <p className="text-slate-600 text-lg">Selecione o tipo de relatório que deseja emitir</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                onClick={() => onNavigate('report-filters', report.id)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1 group"
              >
                <div className={`${report.color} h-2`} />
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${report.color} bg-opacity-10 p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${report.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-sm text-slate-600">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Emitir relatório
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
