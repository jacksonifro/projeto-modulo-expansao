import { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChevronLeft, Plus, Calendar, User, AlertCircle, Paperclip, MessageSquare, X } from 'lucide-react';
import { mockSchools, mockActivities } from './mockData';
import { Activity, ActivityStatus, Priority } from './types';

interface KanbanProps {
  schoolId: string;
  onBack: () => void;
}

const STORAGE_KEY = "exp_creches_activities";

export const getActivities = (): Activity[] => {
  const cached = localStorage.getItem(STORAGE_KEY);
  return cached ? JSON.parse(cached) : mockActivities;
};

export const saveActivities = (activities: Activity[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
};


const ItemTypes = {
  CARD: 'card'
};

interface DragItem {
  id: string;
  status: ActivityStatus;
}

function ActivityCard({ activity, onMove }: { activity: Activity; onMove: (id: string, newStatus: ActivityStatus) => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.CARD,
    item: { id: activity.id, status: activity.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Alta': return 'bg-red-500';
      case 'Média': return 'bg-yellow-500';
      case 'Baixa': return 'bg-green-500';
    }
  };

  const isOverdue = new Date(activity.deadline) < new Date() && activity.status !== 'FEITO';

  return (
    <div
      ref={drag as any}
      className={`bg-white rounded-lg shadow-md p-4 mb-3 cursor-move hover:shadow-lg transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-slate-800 flex-1">{activity.name}</h4>
        <div className={`w-2 h-2 rounded-full ${getPriorityColor(activity.priority)} flex-shrink-0 mt-1`} />
      </div>

      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{activity.description}</p>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <User className="w-3 h-3" />
          <span>{activity.responsible}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>{new Date(activity.deadline).toLocaleDateString('pt-BR')}</span>
          {isOverdue && (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              <AlertCircle className="w-3 h-3" />
              Atrasada
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
            activity.priority === 'Alta' ? 'bg-red-100 text-red-700' :
            activity.priority === 'Média' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {activity.priority}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          {activity.comments.length > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs">{activity.comments.length}</span>
            </div>
          )}
          {activity.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              <span className="text-xs">{activity.attachments.length}</span>
            </div>
          )}
        </div>
      </div>

      {activity.percentage > 0 && activity.status !== 'FEITO' && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600">Progresso</span>
            <span className="text-xs font-semibold text-slate-700">{activity.percentage}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{ width: `${activity.percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Column({ title, status, activities, onMove, onAddActivity }: {
  title: string;
  status: ActivityStatus;
  activities: Activity[];
  onMove: (id: string, newStatus: ActivityStatus) => void;
  onAddActivity: (status: ActivityStatus) => void;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.CARD,
    drop: (item: DragItem) => {
      if (item.status !== status) {
        onMove(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getColumnColor = () => {
    switch (status) {
      case 'A FAZER': return 'border-slate-300 bg-slate-50';
      case 'FAZENDO': return 'border-blue-300 bg-blue-50';
      case 'FEITO': return 'border-green-300 bg-green-50';
    }
  };

  return (
    <div className="flex-1 min-w-[320px]">
      <div className={`rounded-lg border-2 ${getColumnColor()} ${isOver ? 'ring-4 ring-blue-200' : ''} transition-all`}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
            <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-sm font-semibold">
              {activities.length}
            </span>
          </div>
          <button
            onClick={() => onAddActivity(status)}
            className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-white py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-semibold">Nova Atividade</span>
          </button>
        </div>
        <div ref={drop as any} className="p-4 min-h-[600px]">
          {activities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} onMove={onMove} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NewActivityModal({ isOpen, onClose, initialStatus, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  initialStatus: ActivityStatus;
  onAdd: (data: Partial<Activity>) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [responsible, setResponsible] = useState('');
  const [priority, setPriority] = useState<Priority>('Média');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    onAdd({
      name,
      description,
      responsible,
      priority,
      status: initialStatus,
      startDate,
      deadline,
    });
    setName('');
    setDescription('');
    setResponsible('');
    setPriority('Média');
    setStartDate('');
    setDeadline('');
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-800">Nova Atividade</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nome da Atividade</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ex: Instalações hidráulicas"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={4}
              placeholder="Descreva os detalhes da atividade..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Responsável</label>
              <input
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Prazo</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Observações</label>
            <textarea
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={3}
              placeholder="Informações adicionais..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Criar Atividade
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Kanban({ schoolId, onBack }: KanbanProps) {
  const school = mockSchools.find(s => s.id === schoolId);
  const [allActivities, setAllActivities] = useState<Activity[]>(() => getActivities());
  
  const activities = allActivities.filter(a => a.schoolId === schoolId);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<ActivityStatus>('A FAZER');

  if (!school) return null;

  const handleMove = (activityId: string, newStatus: ActivityStatus) => {
    setAllActivities(prev => {
      const updated = prev.map(activity =>
        activity.id === activityId
          ? { ...activity, status: newStatus, percentage: newStatus === 'FEITO' ? 100 : activity.percentage }
          : activity
      );
      saveActivities(updated);
      return updated;
    });
  };

  const handleAddSubmit = (data: Partial<Activity>) => {
    const novaAtividade: Activity = {
      id: `act-${Date.now()}`,
      schoolId: schoolId,
      name: data.name || '',
      description: data.description || '',
      responsible: data.responsible || '',
      priority: data.priority || 'Média',
      deadline: data.deadline || new Date().toISOString().split('T')[0],
      startDate: data.startDate,
      percentage: 0,
      status: data.status || 'A FAZER',
      comments: [],
      attachments: [],
      history: [{ id: `h-${Date.now()}`, date: new Date().toISOString(), user: 'Sistema', action: 'Atividade criada' }],
    };

    setAllActivities(prev => {
      const updated = [...prev, novaAtividade];
      saveActivities(updated);
      return updated;
    });
    setModalOpen(false);
  };

  const handleAddActivity = (status: ActivityStatus) => {
    setModalStatus(status);
    setModalOpen(true);
  };

  const todoActivities = activities.filter(a => a.status === 'A FAZER');
  const doingActivities = activities.filter(a => a.status === 'FAZENDO');
  const doneActivities = activities.filter(a => a.status === 'FEITO');

  const overallProgress = Math.round((doneActivities.length / activities.length) * 100);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Voltar às Escolas
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">{school.name}</h1>
                <p className="text-slate-600">{school.address}, {school.neighborhood}</p>
                <p className="text-sm text-slate-500 mt-1 font-mono">{school.code}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600 mb-1">{overallProgress}%</div>
                <div className="text-sm text-slate-600">Concluído</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Progresso Geral da Obra</span>
                <span className="text-sm text-slate-600">
                  {doneActivities.length} de {activities.length} atividades concluídas
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-slate-700">{todoActivities.length}</div>
                <div className="text-sm text-slate-600">A Fazer</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-700">{doingActivities.length}</div>
                <div className="text-sm text-slate-600">Em Andamento</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700">{doneActivities.length}</div>
                <div className="text-sm text-slate-600">Concluídas</div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4">
            <Column
              title="A FAZER"
              status="A FAZER"
              activities={todoActivities}
              onMove={handleMove}
              onAddActivity={handleAddActivity}
            />
            <Column
              title="FAZENDO"
              status="FAZENDO"
              activities={doingActivities}
              onMove={handleMove}
              onAddActivity={handleAddActivity}
            />
            <Column
              title="FEITO"
              status="FEITO"
              activities={doneActivities}
              onMove={handleMove}
              onAddActivity={handleAddActivity}
            />
          </div>
        </div>

        <NewActivityModal isOpen={modalOpen} onClose={() => setModalOpen(false)} initialStatus={modalStatus} onAdd={handleAddSubmit} />
      </div>
    </DndProvider>
  );
}
