import { useState } from 'react';
import { Plus, Search, Filter, ChevronLeft, Edit2, Trash2, Eye, KanbanSquare } from 'lucide-react';
import { mockSchools, mockActivities } from './mockData';
import { SchoolStatus } from './types';

interface SchoolsListProps {
  onNavigate: (view: string, schoolId?: string) => void;
  onBack: () => void;
}

export default function SchoolsList({ onNavigate, onBack }: SchoolsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<SchoolStatus | 'Todos'>('Todos');

  const filteredSchools = mockSchools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'Todos' || school.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getSchoolProgress = (schoolId: string) => {
    const activities = mockActivities.filter(a => a.schoolId === schoolId);
    if (activities.length === 0) return 0;
    const completed = activities.filter(a => a.status === 'FEITO').length;
    return Math.round((completed / activities.length) * 100);
  };

  const getStatusColor = (status: SchoolStatus) => {
    switch (status) {
      case 'Em andamento': return 'bg-green-100 text-green-700 border-green-200';
      case 'Planejamento': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Atrasada': return 'bg-red-100 text-red-700 border-red-200';
      case 'Paralisada': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Concluída': return 'bg-purple-100 text-purple-700 border-purple-200';
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Escolas em Construção</h1>
              <p className="text-slate-600 text-lg">Gerencie todas as escolas em obras e planejamento</p>
            </div>
            <button
              onClick={() => onNavigate('new-school')}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Nova Escola
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar escolas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as SchoolStatus | 'Todos')}
                className="pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white min-w-[200px]"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Planejamento">Planejamento</option>
                <option value="Em andamento">Em Andamento</option>
                <option value="Atrasada">Atrasada</option>
                <option value="Paralisada">Paralisada</option>
                <option value="Concluída">Concluída</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Escola</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Código</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Bairro</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Vagas</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Progresso</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSchools.map(school => {
                const progress = getSchoolProgress(school.id);
                return (
                  <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{school.name}</p>
                        <p className="text-sm text-slate-500">{school.address}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-slate-600">{school.code}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{school.neighborhood}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{school.expectedVacancies}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(school.status)}`}>
                        {school.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200 rounded-full h-2 min-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 min-w-[40px]">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onNavigate('view-school', school.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar Detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('kanban', school.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Abrir Kanban"
                        >
                          <KanbanSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate('edit-school', school.id)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
