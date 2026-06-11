import { ChevronLeft, MapPin } from 'lucide-react';

interface MapasMenuProps {
  onNavigate: (view: string, id?: string) => void;
  onBack: () => void;
}

export default function MapasMenu({ onNavigate, onBack }: MapasMenuProps) {
  const mapTypes = [
    {
      id: 'mapa-demandas',
      title: 'Demandas de Expansão',
      description: 'Mapa interativo com georreferenciamento de crianças no CadÚnico e obras de creches na cidade escolhida.',
      icon: MapPin,
      color: 'bg-teal-500',
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
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Mapas Interativos</h1>
          <p className="text-slate-600 text-lg">Acesso aos mapas interativos de crianças e unidades escolares para visualizar os registros na cidade escolhida.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mapTypes.map((mapInfo) => {
            const Icon = mapInfo.icon;
            return (
              <div
                key={mapInfo.id}
                onClick={() => onNavigate(mapInfo.id)}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1 group"
              >
                <div className={`${mapInfo.color} h-2`} />
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${mapInfo.color} bg-opacity-10 p-4 rounded-xl group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${mapInfo.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                        {mapInfo.title}
                      </h3>
                      <p className="text-sm text-slate-600">{mapInfo.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
                    Acessar
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
