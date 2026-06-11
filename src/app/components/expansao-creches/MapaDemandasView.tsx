import { useState, useMemo } from 'react';
import { ChevronLeft, MapPin, X } from 'lucide-react';
import { mockPlans, mockCriancasCadUnico, mockUnidades } from './mockData';
import { ObraConstrucao } from './types';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface MapaDemandasViewProps {
  onBack: () => void;
}


// Haversine formula for distance
function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

const getDistanceColor = (distance: number, inRadius: boolean) => {
  if (!inRadius) return { bg: 'bg-slate-400', fill: '#94a3b8', text: 'text-slate-500', bgLight: 'bg-slate-100', hex: '#94a3b8' };
  if (distance <= 250) return { bg: 'bg-green-500', fill: '#22c55e', text: 'text-green-700', bgLight: 'bg-green-100', hex: '#22c55e' };
  if (distance <= 500) return { bg: 'bg-yellow-400', fill: '#facc15', text: 'text-yellow-700', bgLight: 'bg-yellow-100', hex: '#facc15' };
  if (distance <= 750) return { bg: 'bg-orange-500', fill: '#f97316', text: 'text-orange-700', bgLight: 'bg-orange-100', hex: '#f97316' };
  return { bg: 'bg-red-500', fill: '#ef4444', text: 'text-red-700', bgLight: 'bg-red-100', hex: '#ef4444' };
};

const createPinSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" style="width: 18px; height: 24px; fill: ${color}; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3));">
  <path d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
</svg>
`;

export default function MapaDemandasView({ onBack }: MapaDemandasViewProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(mockPlans[0]?.id || '');
  const [referenceId, setReferenceId] = useState<string>('');
  const [radiusMeters, setRadiusMeters] = useState<number>(1000);

  const selectedPlan = mockPlans.find(p => p.id === selectedPlanId);

  // Collect all Obras and Ações (linked to Unidades) for the selected plan
  const references = useMemo(() => {
    if (!selectedPlan) return [];
    const list: { id: string, name: string, type: 'obra' | 'unidade', lat: number, lng: number }[] = [];

    selectedPlan.obras.forEach(o => {
      if (o.coordenadas) {
        list.push({ id: o.id, name: o.nome, type: 'obra', lat: o.coordenadas.lat, lng: o.coordenadas.lng });
      }
    });

    selectedPlan.acoesUnidades.forEach(a => {
      const u = mockUnidades.find(u => u.id === a.unidadeId);
      if (u && u.coordenadas && !list.find(l => l.id === u.id)) {
        list.push({ id: u.id, name: u.nome, type: 'unidade', lat: u.coordenadas.lat, lng: u.coordenadas.lng });
      }
    });

    return list;
  }, [selectedPlan]);

  // Set default reference if none selected and references exist
  if (!referenceId && references.length > 0) {
    setReferenceId(references[0].id);
  }

  const activeReference = references.find(r => r.id === referenceId);

  // Filter and sort children within radius
  const childrenWithinRadius = useMemo(() => {
    if (!activeReference) return [];
    const withDistance = mockCriancasCadUnico.map(c => {
      const distance = getDistanceFromLatLonInM(
        activeReference.lat, activeReference.lng,
        c.coordenadas.lat, c.coordenadas.lng
      );
      return { ...c, distance };
    });

    return withDistance
      .filter(c => c.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);
  }, [activeReference, radiusMeters]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-1 transition-colors text-sm font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-2xl font-bold text-slate-800">Mapa de Demanda do cadÚnico por Plano de Expansão</h1>
          <p className="text-slate-500 text-sm">Selecione um plano de expansão e uma Unidade Escolar ou obra para visualizar as crianças do cadÚnico em volta da Unidade Escolar.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap gap-6 items-end shrink-0">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Plano de Expansão</label>
          <select
            value={selectedPlanId}
            onChange={e => { setSelectedPlanId(e.target.value); setReferenceId(''); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[250px]"
          >
            {mockPlans.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Unidade Escolar / Obra Central</label>
          <div className="flex items-center gap-2">
            <select
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white min-w-[300px]"
            >
              {references.map(r => (
                <option key={r.id} value={r.id}>{r.type === 'obra' ? '🏗️ ' : '🏫 '}{r.name}</option>
              ))}
              {references.length === 0 && <option value="">Nenhuma obra ou unidade georreferenciada</option>}
            </select>
            {referenceId && (
              <button onClick={() => setReferenceId('')} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
            <span>Raio do círculo: {radiusMeters}m</span>
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">100m</span>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={radiusMeters}
              onChange={e => setRadiusMeters(Number(e.target.value))}
              className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-slate-400">5km</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative z-0">
          {activeReference ? (
            <MapContainer
              key={`${activeReference.lat}-${activeReference.lng}-${radiusMeters}`} // Force re-render on change if needed, but react-leaflet handles center well. We use key just to be safe with circle updates.
              center={[activeReference.lat, activeReference.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Radius Circle */}
              <Circle
                center={[activeReference.lat, activeReference.lng]}
                radius={radiusMeters}
                pathOptions={{ fillColor: '#3b82f6', color: '#2563eb', weight: 2, fillOpacity: 0.15 }}
              />

              {/* Central Reference Marker */}
              <Marker
                position={[activeReference.lat, activeReference.lng]}
                icon={L.divIcon({
                  className: 'custom-icon',
                  html: `<div class="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-lg ${activeReference.type === 'obra' ? 'bg-orange-500' : 'bg-emerald-500'}"><span class="text-white text-base">${activeReference.type === 'obra' ? '🏗️' : '🏫'}</span></div>`,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20],
                })}
              >
                <Popup>
                  <div className="font-bold">{activeReference.name}</div>
                  <div className="text-sm text-slate-600">{activeReference.type === 'obra' ? 'Obra de Construção' : 'Ação de Ampliação'}</div>
                </Popup>
              </Marker>

              {/* Children Markers */}
              {mockCriancasCadUnico.map(c => {
                const distance = getDistanceFromLatLonInM(activeReference.lat, activeReference.lng, c.coordenadas.lat, c.coordenadas.lng);
                const inRadius = distance <= radiusMeters;
                const distColor = getDistanceColor(distance, inRadius);
                return (
                  <Marker
                    key={c.id}
                    position={[c.coordenadas.lat, c.coordenadas.lng]}
                    icon={L.divIcon({
                      className: 'custom-icon',
                      html: `<div class="relative flex items-center justify-center -top-3">${createPinSvg(distColor.hex)}</div>`,
                      iconSize: [18, 24],
                      iconAnchor: [9, 24],
                    })}
                  >
                    <Popup>
                      <div className="text-sm">
                        <div className="font-bold text-slate-800">{c.nome}</div>
                        <div className="text-slate-600">Idade: {c.idade}</div>
                        <div className="text-slate-600">Bairro: {c.bairro}</div>
                        <div className={`mt-1 font-semibold ${inRadius ? 'text-red-600' : 'text-slate-500'}`}>
                          Distância: {distance}m
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-100 text-slate-500">
              Selecione uma obra ou escola para visualizar o mapa
            </div>
          )}

          {/* Legend Overlay */}
          <div className="absolute bottom-6 left-6 z-[400] bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white shadow-sm">🏫</div> <span>Escola</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[8px] text-white shadow-sm">🏗️</div> <span>Obra Nova</span></div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-4 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: createPinSvg('#22c55e') }} />
                <span>Muito Perto (0m - 250m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-4 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: createPinSvg('#facc15') }} />
                <span>Perto (250m - 500m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-4 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: createPinSvg('#f97316') }} />
                <span>Médio (500m - 750m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-4 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: createPinSvg('#ef4444') }} />
                <span>Longe (750m - 1000m+)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar List */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-800">Crianças Próximas</h3>
            <p className="text-sm text-slate-500">{childrenWithinRadius.length} encontrada(s)</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {childrenWithinRadius.length > 0 ? (
              <div className="space-y-1">
                {childrenWithinRadius.map((child, index) => {
                  const distColor = getDistanceColor(child.distance, true);
                  return (
                    <div key={child.id} className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                      <div className={`w-6 h-6 rounded-full ${distColor.bgLight} ${distColor.text} flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-800 leading-tight">{child.nome}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span className={`font-medium ${distColor.text}`}>{child.distance}m</span>
                          <span>•</span>
                          <span>{child.idade}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500 mt-10">
                Nenhuma criança encontrada neste raio de busca.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
