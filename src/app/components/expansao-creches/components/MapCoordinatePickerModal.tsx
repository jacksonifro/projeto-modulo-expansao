import { useState, useEffect } from 'react';
import { MapPin, Search, X, Check, ExternalLink, Layers, Loader2, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { mockDemandaBairro, mockUnidades } from '../mockData';

interface MapCoordinatePickerModalProps {
  isOpen: boolean;
  initialLat?: number;
  initialLng?: number;
  initialQuery?: string;
  onClose: () => void;
  onConfirm: (coords: { lat: number; lng: number; suggestedBairro?: string; suggestedAddress?: string }) => void;
}

interface SearchResultItem {
  id: string;
  label: string;
  sublabel: string;
  lat: number;
  lng: number;
  bairro?: string;
  source: 'local' | 'nominatim' | 'coords';
}

const DEFAULT_CENTER = { lat: -11.4343, lng: -61.4484 }; // Cacoal/RO

const googlePinIcon = L.divIcon({
  className: 'google-maps-pin-icon',
  html: `
    <div style="position: relative; width: 34px; height: 44px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
      <svg viewBox="0 0 384 512" style="width: 34px; height: 44px; fill: #ea4335;">
        <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
      </svg>
      <div style="position: absolute; top: 10px; left: 10px; width: 14px; height: 14px; border-radius: 9999px; background: #ffffff; border: 2px solid #b31412;"></div>
    </div>
  `,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
});

function MapClickAndViewController({
  center,
  zoom,
  onPickPoint,
}: {
  center: { lat: number; lng: number };
  zoom: number;
  onPickPoint: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [center.lat, center.lng, zoom, map]);

  useMapEvents({
    click(e) {
      onPickPoint(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6))
      );
    },
  });

  return null;
}

export default function MapCoordinatePickerModal({
  isOpen,
  initialLat,
  initialLng,
  initialQuery = '',
  onClose,
  onConfirm,
}: MapCoordinatePickerModalProps) {
  const validInitLat =
    typeof initialLat === 'number' && Number.isFinite(initialLat) && initialLat !== 0
      ? initialLat
      : DEFAULT_CENTER.lat;
  const validInitLng =
    typeof initialLng === 'number' && Number.isFinite(initialLng) && initialLng !== 0
      ? initialLng
      : DEFAULT_CENTER.lng;

  const [selectedLat, setSelectedLat] = useState<number>(validInitLat);
  const [selectedLng, setSelectedLng] = useState<number>(validInitLng);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: validInitLat,
    lng: validInitLng,
  });
  const [mapZoom, setMapZoom] = useState<number>(15);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');

  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedAddressLabel, setSelectedAddressLabel] = useState<string>('');
  const [selectedBairro, setSelectedBairro] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const lat =
        typeof initialLat === 'number' && Number.isFinite(initialLat) && initialLat !== 0
          ? initialLat
          : DEFAULT_CENTER.lat;
      const lng =
        typeof initialLng === 'number' && Number.isFinite(initialLng) && initialLng !== 0
          ? initialLng
          : DEFAULT_CENTER.lng;
      setSelectedLat(lat);
      setSelectedLng(lng);
      setMapCenter({ lat, lng });
      setMapZoom(15);
      setSearchQuery(initialQuery || '');
      setSearchResults([]);
      setSelectedAddressLabel('');
      setSelectedBairro('');
    }
  }, [isOpen, initialLat, initialLng, initialQuery]);

  if (!isOpen) return null;

  // Tenta extrair coordenadas diretas ou de link do Google Maps (@lat,lng)
  const parseDirectCoordinates = (input: string): { lat: number; lng: number } | null => {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlMatch) {
      return { lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]) };
    }
    const pairMatch = trimmed.match(/^(-?\d+[.,]\d+)\s*[,;\s]\s*(-?\d+[.,]\d+)$/);
    if (pairMatch) {
      const lat = parseFloat(pairMatch[1].replace(',', '.'));
      const lng = parseFloat(pairMatch[2].replace(',', '.'));
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    }
    return null;
  };

  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // 1. Verifica se o usuário colou coordenadas ou URL do Google Maps
    const directCoords = parseDirectCoordinates(q);
    if (directCoords) {
      const lat = Number(directCoords.lat.toFixed(6));
      const lng = Number(directCoords.lng.toFixed(6));
      setSelectedLat(lat);
      setSelectedLng(lng);
      setMapCenter({ lat, lng });
      setMapZoom(17);
      setSelectedAddressLabel(`Coordenada informada (${lat}, ${lng})`);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const termLower = q.toLowerCase();

    // 2. Busca rápida na base local de bairros e unidades de Cacoal/RO
    const localMatches: SearchResultItem[] = [];
    mockDemandaBairro.forEach(b => {
      if (
        b.coordenadas &&
        (b.bairro.toLowerCase().includes(termLower) || b.setor.toLowerCase().includes(termLower))
      ) {
        localMatches.push({
          id: `bairro-${b.id}`,
          label: `Bairro ${b.bairro}`,
          sublabel: `${b.setor} — Cacoal/RO`,
          lat: b.coordenadas.lat,
          lng: b.coordenadas.lng,
          bairro: b.bairro,
          source: 'local',
        });
      }
    });

    mockUnidades.forEach(u => {
      if (
        u.coordenadas &&
        (u.nome.toLowerCase().includes(termLower) ||
          u.bairro.toLowerCase().includes(termLower) ||
          u.endereco.toLowerCase().includes(termLower))
      ) {
        localMatches.push({
          id: `uni-${u.id}`,
          label: u.nome,
          sublabel: `${u.endereco}, ${u.bairro} — Cacoal/RO`,
          lat: u.coordenadas.lat,
          lng: u.coordenadas.lng,
          bairro: u.bairro,
          source: 'local',
        });
      }
    });

    // 3. Busca online no geocodificador Nominatim (priorizando Cacoal/RO se não especificado)
    const remoteMatches: SearchResultItem[] = [];
    try {
      const queryWithCity =
        termLower.includes('cacoal') || termLower.includes('ro')
          ? q
          : `${q}, Cacoal, Rondônia, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=br&q=${encodeURIComponent(
        queryWithCity
      )}`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR' },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((item: any, idx: number) => {
            const lat = Number(parseFloat(item.lat).toFixed(6));
            const lng = Number(parseFloat(item.lon).toFixed(6));
            const addr = item.address || {};
            const bairro =
              addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
            const mainTitle =
              item.name ||
              [addr.road, addr.house_number].filter(Boolean).join(', ') ||
              bairro ||
              item.display_name.split(',')[0];
            remoteMatches.push({
              id: `nom-${item.place_id || idx}`,
              label: mainTitle,
              sublabel: item.display_name,
              lat,
              lng,
              bairro: bairro || undefined,
              source: 'nominatim',
            });
          });
        }
      }
    } catch {
      // Fallback silencioso para matches locais caso sem internet/bloqueio
    } finally {
      setIsSearching(false);
    }

    const combined = [...localMatches, ...remoteMatches];
    setSearchResults(combined);

    if (combined.length > 0) {
      const first = combined[0];
      setSelectedLat(Number(first.lat.toFixed(6)));
      setSelectedLng(Number(first.lng.toFixed(6)));
      setMapCenter({ lat: first.lat, lng: first.lng });
      setMapZoom(17);
      setSelectedAddressLabel(first.label);
      if (first.bairro) setSelectedBairro(first.bairro);
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    const lat = Number(item.lat.toFixed(6));
    const lng = Number(item.lng.toFixed(6));
    setSelectedLat(lat);
    setSelectedLng(lng);
    setMapCenter({ lat, lng });
    setMapZoom(17);
    setSelectedAddressLabel(item.label);
    if (item.bairro) setSelectedBairro(item.bairro);
  };

  const handlePickOnMap = async (lat: number, lng: number) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setMapCenter({ lat, lng });

    // Tenta identificar o endereço/bairro via reverse geocoding
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data?.address || {};
        const bairro =
          addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
        const road = [addr.road, addr.house_number].filter(Boolean).join(', ');
        setSelectedAddressLabel(
          [road, bairro, addr.city || addr.town || 'Cacoal/RO'].filter(Boolean).join(' · ')
        );
        if (bairro) setSelectedBairro(bairro);
        return;
      }
    } catch {
      // Ignorar erro de rede no reverse geocode
    }
    setSelectedAddressLabel(`Ponto selecionado no mapa (${lat}, ${lng})`);
  };

  const googleMapsExternalUrl = `https://www.google.com/maps/search/?api=1&query=${selectedLat},${selectedLng}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Cabeçalho estilo Google Maps */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#1a73e8] to-[#1557b0] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5 text-[#ea4335] fill-[#ea4335]/20" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                Localizar Coordenadas no Mapa (Google Maps)
              </h3>
              <p className="text-xs text-blue-100">
                Pesquise por endereço/bairro ou clique diretamente no ponto desejado do mapa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            title="Fechar mapa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Busca por Endereço / Bairro / Coordenada */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchAddress();
                  }
                }}
                placeholder="Digite rua, bairro (ex: Bairro Liberdade, Cacoal), escola ou cole coordenadas..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSearchAddress()}
              disabled={isSearching}
              className="px-4 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar Endereço
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setMapType(prev => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
              }
              className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
              title="Alternar entre Mapa de Ruas e Satélite"
            >
              <Layers className="w-4 h-4 text-blue-600" />
              {mapType === 'roadmap' ? 'Visão Satélite' : 'Visão Mapa'}
            </button>
          </div>

          {/* Lista rápida de resultados da busca */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-h-36 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="w-full px-3.5 py-2 text-left hover:bg-blue-50/70 flex items-center justify-between gap-2 transition-colors text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#ea4335] shrink-0" />
                      <span>{item.label}</span>
                      {item.source === 'local' && (
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          Cacoal/RO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate pl-5">
                      {item.sublabel}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Atalhos rápidos de bairros de Cacoal */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
            <span className="text-slate-500 font-semibold shrink-0 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-blue-600" />
              Bairros rápidos:
            </span>
            {mockDemandaBairro.slice(0, 7).map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  const lat = Number(b.coordenadas.lat.toFixed(6));
                  const lng = Number(b.coordenadas.lng.toFixed(6));
                  setSelectedLat(lat);
                  setSelectedLng(lng);
                  setMapCenter({ lat, lng });
                  setMapZoom(16);
                  setSelectedAddressLabel(`Bairro ${b.bairro} (${b.setor})`);
                  setSelectedBairro(b.bairro);
                }}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 font-medium shrink-0 transition-colors"
              >
                {b.bairro}
              </button>
            ))}
          </div>
        </div>

        {/* Mapa Interativo (Clique ou Arraste o Pino) */}
        <div className="relative h-[380px] sm:h-[420px] w-full bg-slate-100">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
          >
            {mapType === 'roadmap' ? (
              <TileLayer
                attribution='&copy; Google Maps / OpenStreetMap'
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              />
            ) : (
              <TileLayer
                attribution='&copy; Google Maps Satellite'
                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              />
            )}

            <MapClickAndViewController
              center={mapCenter}
              zoom={mapZoom}
              onPickPoint={handlePickOnMap}
            />

            <Marker
              position={[selectedLat, selectedLng]}
              icon={googlePinIcon}
              draggable={true}
              eventHandlers={{
                dragend: e => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  if (pos) {
                    handlePickOnMap(
                      Number(pos.lat.toFixed(6)),
                      Number(pos.lng.toFixed(6))
                    );
                  }
                },
              }}
            />
          </MapContainer>

          {/* Instrução flutuante no topo do mapa */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/80 backdrop-blur-xs text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-md pointer-events-none flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            Clique em qualquer ponto do mapa ou arraste o marcador vermelho
          </div>
        </div>

        {/* Rodapé com Coordenadas Selecionadas + Botão Confirmar */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700">Coordenadas selecionadas:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-slate-900">
                Lat: {selectedLat.toFixed(6)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono font-bold text-slate-900">
                Lng: {selectedLng.toFixed(6)}
              </span>
              <a
                href={googleMapsExternalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold ml-1"
                title="Abrir este ponto no Google Maps em nova guia"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver no Google Maps
              </a>
            </div>
            {selectedAddressLabel && (
              <div className="text-[11px] text-slate-500 truncate max-w-xl">
                Local referência: <strong className="text-slate-700">{selectedAddressLabel}</strong>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm({
                  lat: Number(selectedLat.toFixed(6)),
                  lng: Number(selectedLng.toFixed(6)),
                  suggestedBairro: selectedBairro || undefined,
                  suggestedAddress: selectedAddressLabel || undefined,
                });
                onClose();
              }}
              className="px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Confirmar Coordenadas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

