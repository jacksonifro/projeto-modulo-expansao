import { MapPin, Users, Calendar, Building2, AlertTriangle, ChevronLeft, Plus } from 'lucide-react';
import { mockSchools, mockActivities } from './mockData';
import { School } from './types';

interface SchoolsProps {
  planId: string;
  onNavigate: (view: string, schoolId?: string) => void;
  onBack: () => void;
}

export default function Schools({ planId, onNavigate, onBack }: SchoolsProps) {
  const schools = mockSchools.filter(s => s.planId === planId);

  const getSchoolProgress = (schoolId: string) => {
    const activities = mockActivities.filter(a => a.schoolId === schoolId);
    if (activities.length === 0) return 0;
    const completed = activities.filter(a => a.status === 'FEITO').length;
    return Math.round((completed / activities.length) * 100);
  };

  const getSchoolActivities = (schoolId: string) => {
    const activities = mockActivities.filter(a => a.schoolId === schoolId);
    const completed = activities.filter(a => a.status === 'FEITO').length;
    return { completed, total: activities.length };
  };

  const getStatusColor = (status: School['status']) => {
    switch (status) {
      case 'Em andamento': return 'bg-green-100 text-green-700 border-green-200';
      case 'Planejamento': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Atrasada': return 'bg-red-100 text-red-700 border-red-200';
      case 'Paralisada': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Concluída': return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
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
            Voltar ao Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Escolas do Plano</h1>
              <p className="text-slate-600 text-lg">Acompanhe o progresso de cada unidade escolar</p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {schools.map(school => {
            const progress = getSchoolProgress(school.id);
            const activities = getSchoolActivities(school.id);
            const isDelayed = school.status === 'Atrasada';

            return (
              <div
                key={school.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
                onClick={() => onNavigate('kanban', school.id)}
              >
                <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
                  {school.imageUrl ? (
                    <img src={school.imageUrl} alt={school.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building2 className="w-20 h-20 text-slate-400" />
                    </div>
                  )}
                  {isDelayed && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-semibold">Atrasada</span>
                    </div>
                  )}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(school.status)}`}>
                    {school.status}
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{school.name}</h3>
                    <p className="text-sm text-slate-500 font-mono">{school.code}</p>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{school.address}, {school.neighborhood}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{school.expectedVacancies} vagas • {school.classrooms} salas</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">Entrega: {new Date(school.expectedDelivery).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600 font-semibold">Progresso da Obra</span>
                      <span className="text-2xl font-bold text-slate-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full ${getProgressColor(progress)} transition-all duration-500 rounded-full`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {activities.completed} de {activities.total} atividades concluídas
                    </p>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p><span className="font-semibold">Responsável:</span> {school.technicalResponsible}</p>
                    <p><span className="font-semibold">Executora:</span> {school.executingCompany}</p>
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
