import { useState } from 'react';
import { ChevronLeft, Save, X, ChevronRight, Plus, Trash2, Calendar, User, AlertCircle } from 'lucide-react';
import { Priority } from './types';

interface SchoolFormProps {
  onBack: () => void;
  isEdit?: boolean;
}

type Tab = 'identificacao' | 'localizacao' | 'infraestrutura' | 'execucao' | 'plano-expansao' | 'documentos';

interface ActivityForm {
  id: string;
  name: string;
  description: string;
  responsible: string;
  priority: Priority;
  deadline: string;
}

export default function SchoolForm({ onBack, isEdit = false }: SchoolFormProps) {
  const [activeTab, setActiveTab] = useState<Tab>('identificacao');
  const [activities, setActivities] = useState<ActivityForm[]>([]);

  const tabs = [
    { id: 'identificacao' as Tab, label: 'Identificação', number: 1 },
    { id: 'localizacao' as Tab, label: 'Localização', number: 2 },
    { id: 'infraestrutura' as Tab, label: 'Infraestrutura', number: 3 },
    { id: 'execucao' as Tab, label: 'Execução', number: 4 },
    { id: 'plano-expansao' as Tab, label: 'Plano de Expansão', number: 5 },
    { id: 'documentos' as Tab, label: 'Documentos', number: 6 },
  ];

  const handleNext = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handleAddActivity = () => {
    const newActivity: ActivityForm = {
      id: Date.now().toString(),
      name: '',
      description: '',
      responsible: '',
      priority: 'Média',
      deadline: '',
    };
    setActivities([...activities, newActivity]);
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter(act => act.id !== id));
  };

  const handleUpdateActivity = (id: string, field: keyof ActivityForm, value: string) => {
    setActivities(activities.map(act =>
      act.id === id ? { ...act, [field]: value } : act
    ));
  };

  const loadDefaultActivities = () => {
    const defaultActivities: ActivityForm[] = [
      { id: '1', name: 'Projeto Arquitetônico', description: 'Elaboração e aprovação do projeto arquitetônico', responsible: '', priority: 'Alta', deadline: '' },
      { id: '2', name: 'Aprovação Ambiental', description: 'Obtenção de licenças ambientais necessárias', responsible: '', priority: 'Alta', deadline: '' },
      { id: '3', name: 'Licitação', description: 'Processo licitatório para contratação de empresa', responsible: '', priority: 'Alta', deadline: '' },
      { id: '4', name: 'Terraplanagem', description: 'Preparação do terreno para início da obra', responsible: '', priority: 'Média', deadline: '' },
      { id: '5', name: 'Fundação', description: 'Execução das fundações da edificação', responsible: '', priority: 'Alta', deadline: '' },
      { id: '6', name: 'Estrutura', description: 'Construção da estrutura em concreto armado', responsible: '', priority: 'Alta', deadline: '' },
      { id: '7', name: 'Alvenaria', description: 'Execução das paredes e divisórias', responsible: '', priority: 'Média', deadline: '' },
      { id: '8', name: 'Instalações Elétricas', description: 'Instalação do sistema elétrico completo', responsible: '', priority: 'Média', deadline: '' },
      { id: '9', name: 'Instalações Hidráulicas', description: 'Instalação do sistema hidráulico completo', responsible: '', priority: 'Média', deadline: '' },
      { id: '10', name: 'Acabamento', description: 'Pintura, revestimentos e acabamentos finais', responsible: '', priority: 'Média', deadline: '' },
      { id: '11', name: 'Entrega Final', description: 'Vistoria final e entrega da obra', responsible: '', priority: 'Alta', deadline: '' },
    ];
    setActivities(defaultActivities);
  };

  const isLastTab = activeTab === 'documentos';

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
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            {isEdit ? 'Editar Escola' : 'Nova Escola'}
          </h1>
          <p className="text-slate-600 text-lg">
            {isEdit ? 'Atualize as informações da escola' : 'Preencha os dados para cadastrar uma nova escola'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs Header */}
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 font-semibold transition-all relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.number}
                  </div>
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'identificacao' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Dados de Identificação</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Nome da Escola *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Ex: Creche Municipal Jardim Primavera"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Código da Obra *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="OB-2026-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Plano de Expansão *
                    </label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option value="">Selecione o plano</option>
                      <option value="1">Expansão 2024</option>
                      <option value="2">Expansão 2025</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Status *
                    </label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option value="">Selecione o status</option>
                      <option value="Planejamento">Planejamento</option>
                      <option value="Em andamento">Em Andamento</option>
                      <option value="Atrasada">Atrasada</option>
                      <option value="Paralisada">Paralisada</option>
                      <option value="Concluída">Concluída</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    rows={4}
                    placeholder="Descreva as características principais da escola..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'localizacao' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Dados de Localização</h2>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Endereço *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Rua, Avenida..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Número *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Nome do bairro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Município *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Nome do município"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      CEP *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Complemento
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Apartamento, sala, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Zona
                    </label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option value="">Selecione</option>
                      <option value="Urbana">Urbana</option>
                      <option value="Rural">Rural</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="-23.550520"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="-46.633308"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Referências
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    rows={3}
                    placeholder="Pontos de referência para localização..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'infraestrutura' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Infraestrutura e Capacidade</h2>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Vagas Previstas *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Quantidade de Salas *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Área Total (m²)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Área Construída (m²)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Pavimentos
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Tipo de Construção
                    </label>
                    <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option value="">Selecione</option>
                      <option value="Alvenaria">Alvenaria</option>
                      <option value="Concreto Armado">Concreto Armado</option>
                      <option value="Metálica">Metálica</option>
                      <option value="Mista">Mista</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Espaços e Ambientes</h3>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Refeitório</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Cozinha</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Lactário</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Parquinho</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Pátio Coberto</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Biblioteca</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Banheiro Adaptado</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Sala de Professores</label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm font-semibold text-slate-700">Estacionamento</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Observações sobre Infraestrutura
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    rows={3}
                    placeholder="Informações adicionais sobre a infraestrutura..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'plano-expansao' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Plano de Expansão</h2>
                    <p className="text-slate-600 mt-1">Cadastre as etapas de construção e atividades que serão lançadas no Kanban</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={loadDefaultActivities}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
                    >
                      Carregar Padrão
                    </button>
                    <button
                      onClick={handleAddActivity}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Nova Atividade
                    </button>
                  </div>
                </div>

                {activities.length === 0 ? (
                  <div className="bg-slate-50 rounded-lg p-12 text-center">
                    <div className="text-slate-400 mb-4">
                      <AlertCircle className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-600 mb-2">Nenhuma atividade cadastrada</h3>
                    <p className="text-slate-500 mb-4">Adicione atividades que farão parte do cronograma de construção</p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={loadDefaultActivities}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors"
                      >
                        Carregar Atividades Padrão
                      </button>
                      <button
                        onClick={handleAddActivity}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Criar Atividade Personalizada
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Dica:</strong> As atividades cadastradas aqui serão automaticamente adicionadas ao Kanban da escola na coluna "A FAZER" após salvar.
                      </p>
                    </div>

                    {activities.map((activity, index) => (
                      <div key={activity.id} className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Atividade {index + 1}</h3>
                          </div>
                          <button
                            onClick={() => handleRemoveActivity(activity.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover atividade"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Nome da Atividade *
                            </label>
                            <input
                              type="text"
                              value={activity.name}
                              onChange={(e) => handleUpdateActivity(activity.id, 'name', e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              placeholder="Ex: Fundação"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Descrição
                            </label>
                            <textarea
                              value={activity.description}
                              onChange={(e) => handleUpdateActivity(activity.id, 'description', e.target.value)}
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                              rows={2}
                              placeholder="Descreva os detalhes da atividade..."
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Responsável
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  value={activity.responsible}
                                  onChange={(e) => handleUpdateActivity(activity.id, 'responsible', e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                  placeholder="Nome"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Prioridade
                              </label>
                              <select
                                value={activity.priority}
                                onChange={(e) => handleUpdateActivity(activity.id, 'priority', e.target.value)}
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                              >
                                <option value="Baixa">Baixa</option>
                                <option value="Média">Média</option>
                                <option value="Alta">Alta</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Prazo
                              </label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="date"
                                  value={activity.deadline}
                                  onChange={(e) => handleUpdateActivity(activity.id, 'deadline', e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-center pt-4">
                      <button
                        onClick={handleAddActivity}
                        className="flex items-center gap-2 px-6 py-3 text-blue-600 border-2 border-dashed border-blue-300 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Adicionar Mais uma Atividade
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 mt-6">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        Total de atividades: {activities.length}
                      </p>
                      <p className="text-xs text-slate-600">
                        Estas atividades serão criadas automaticamente no Kanban da escola na coluna "A FAZER"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'execucao' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Execução da Obra</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Responsável Técnico *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Eng. Nome Completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      CREA/CAU
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="00000-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Empresa Executora *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Nome da construtora"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Data Prevista de Entrega *
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Valor da Obra (R$)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Número do Contrato
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="000/2026"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Data do Contrato
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Observações sobre Execução
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    rows={4}
                    placeholder="Informações adicionais sobre a execução da obra..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'documentos' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Documentos e Imagens</h2>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Foto da Obra
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="text-slate-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-semibold mb-2">Clique para fazer upload da foto</p>
                    <p className="text-sm text-slate-500">JPG ou PNG até 5MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Documentos Técnicos
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="text-slate-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-semibold mb-2">Clique para fazer upload ou arraste arquivos aqui</p>
                    <p className="text-sm text-slate-500">PDF, DOC, XLS, DWG até 10MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Documentos Anexados
                  </label>
                  <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500">
                    Nenhum documento anexado ainda
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-6 flex justify-between items-center">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 text-slate-700 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
            {isLastTab ? (
              <button
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Save className="w-5 h-5" />
                {isEdit ? 'Salvar Alterações' : 'Criar Escola'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Avançar
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
