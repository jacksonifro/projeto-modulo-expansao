import { ChevronLeft, MapPin, Users, Calendar, Building2, User, DollarSign, FileText, KanbanSquare } from 'lucide-react';
import { mockSchools, mockActivities } from './mockData';

interface SchoolViewProps {
  schoolId: string;
  onNavigate: (view: string, schoolId?: string) => void;
  onBack: () => void;
}

export default function SchoolView({ schoolId, onNavigate, onBack }: SchoolViewProps) {
  const school = mockSchools.find(s => s.id === schoolId);

  if (!school) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Escola não encontrada</h2>
          <button onClick={onBack} className="text-blue-600 hover:text-blue-700 font-semibold">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const activities = mockActivities.filter(a => a.schoolId === schoolId);
  const completedActivities = activities.filter(a => a.status === 'FEITO').length;
  const inProgressActivities = activities.filter(a => a.status === 'FAZENDO').length;
  const pendingActivities = activities.filter(a => a.status === 'A FAZER').length;
  const overallProgress = activities.length > 0 ? Math.round((completedActivities / activities.length) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em andamento': return 'bg-green-100 text-green-700 border-green-200';
      case 'Planejamento': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Atrasada': return 'bg-red-100 text-red-700 border-red-200';
      case 'Paralisada': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Concluída': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">{school.name}</h1>
              <p className="text-slate-600 text-lg font-mono">{school.code}</p>
            </div>
            <button
              onClick={() => onNavigate('kanban', schoolId)}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <KanbanSquare className="w-5 h-5" />
              Abrir Kanban
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Imagem e Status */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-slate-200 to-slate-300 relative">
                {school.imageUrl ? (
                  <img src={school.imageUrl} alt={school.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Building2 className="w-24 h-24 text-slate-400" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(school.status)}`}>
                    {school.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações Gerais */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 pb-3 border-b-2 border-blue-500 inline-block">
                Informações Gerais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Localização</p>
                    <p className="text-slate-800">{school.address}</p>
                    <p className="text-slate-600 text-sm">{school.neighborhood}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Capacidade</p>
                    <p className="text-slate-800 font-bold">{school.expectedVacancies} vagas</p>
                    <p className="text-slate-600 text-sm">{school.classrooms} salas de aula</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Entrega Prevista</p>
                    <p className="text-slate-800 font-bold">
                      {new Date(school.expectedDelivery).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">Responsável Técnico</p>
                    <p className="text-slate-800">{school.technicalResponsible}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Execução */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 pb-3 border-b-2 border-green-500 inline-block">
                Execução da Obra
              </h2>
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">Empresa Executora</span>
                  <span className="text-slate-800">{school.executingCompany}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">Responsável Técnico</span>
                  <span className="text-slate-800">{school.technicalResponsible}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-600 font-semibold">Código da Obra</span>
                  <span className="text-slate-800 font-mono">{school.code}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Progresso Geral */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Progresso Geral</h2>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-blue-600 mb-2">{overallProgress}%</div>
                <p className="text-slate-600">Concluído</p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">A Fazer</span>
                  <span className="font-bold text-slate-800">{pendingActivities}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Em Andamento</span>
                  <span className="font-bold text-blue-600">{inProgressActivities}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Concluídas</span>
                  <span className="font-bold text-green-600">{completedActivities}</span>
                </div>
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Atividades Recentes</h2>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="border-l-4 border-blue-500 pl-3 py-2">
                    <p className="text-sm font-semibold text-slate-800">{activity.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activity.status === 'FEITO' ? 'bg-green-100 text-green-700' :
                        activity.status === 'FAZENDO' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {activity.status}
                      </span>
                      <span className="text-xs text-slate-500">{activity.responsible}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onNavigate('kanban', schoolId)}
                className="w-full mt-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
              >
                Ver todas as atividades →
              </button>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Ações Rápidas</h2>
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('edit-school', schoolId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-semibold">Editar Informações</span>
                </button>
                <button
                  onClick={() => onNavigate('kanban', schoolId)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <KanbanSquare className="w-5 h-5" />
                  <span className="font-semibold">Abrir Kanban</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
