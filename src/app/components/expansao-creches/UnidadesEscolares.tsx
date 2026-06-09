import { useState } from 'react';
import { ChevronLeft, Search, Building2, Users, AlertCircle, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { mockUnidades } from './mockData';
import { UnidadeEscolar } from './types';

interface UnidadesEscolaresProps {
  onBack: () => void;
}

const SETORES = ['Todos', 'Região Central', 'Região Leste', 'Região Oeste', 'Região Sul', 'Zona Rural', 'Distrito de Riozinho', 'Outros'];

const setorColor: Record<string, string> = {
  'Região Central': 'bg-blue-100 text-blue-700',
  'Região Leste': 'bg-green-100 text-green-700',
  'Região Oeste': 'bg-purple-100 text-purple-700',
  'Região Sul': 'bg-orange-100 text-orange-700',
  'Zona Rural': 'bg-amber-100 text-amber-700',
  'Distrito de Riozinho': 'bg-teal-100 text-teal-700',
};

function ocupacaoColor(matriculas: number, vagas: number) {
  if (vagas === 0) return 'text-slate-400';
  const pct = matriculas / vagas;
  if (pct >= 2) return 'text-red-600';
  if (pct >= 1.2) return 'text-orange-600';
  return 'text-green-600';
}

function ocupacaoBg(matriculas: number, vagas: number) {
  if (vagas === 0) return 'bg-slate-100';
  const pct = matriculas / vagas;
  if (pct >= 2) return 'bg-red-100';
  if (pct >= 1.2) return 'bg-orange-100';
  return 'bg-green-100';
}

function UnidadeCard({ ue }: { ue: UnidadeEscolar }) {
  const [expanded, setExpanded] = useState(false);
  const taxaOcupacao = ue.totalVagas > 0 ? Math.round((ue.totalMatriculas / ue.totalVagas) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{ue.codigo}</span>
              <span className="text-xs font-mono text-slate-400">INEP {ue.inep}</span>
            </div>
            <h3 className="font-bold text-slate-800 leading-tight">{ue.nome}</h3>
            <div className="flex items-center gap-1 mt-1 text-slate-500 text-sm">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{ue.bairro}</span>
            </div>
          </div>
          <span className={`ml-3 shrink-0 text-xs px-2 py-1 rounded-full font-semibold ${setorColor[ue.setor] ?? 'bg-slate-100 text-slate-600'}`}>
            {ue.setor}
          </span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-slate-800">{ue.totalVagas}</div>
            <div className="text-xs text-slate-500">Vagas</div>
          </div>
          <div className={`rounded-xl p-3 text-center ${ocupacaoBg(ue.totalMatriculas, ue.totalVagas)}`}>
            <div className={`text-xl font-bold ${ocupacaoColor(ue.totalMatriculas, ue.totalVagas)}`}>{ue.totalMatriculas}</div>
            <div className="text-xs text-slate-500">Matrículas</div>
          </div>
          <div className={`rounded-xl p-3 text-center ${ue.totalListaEspera > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className={`text-xl font-bold ${ue.totalListaEspera > 0 ? 'text-red-600' : 'text-green-600'}`}>{ue.totalListaEspera}</div>
            <div className="text-xs text-slate-500">Lista Espera</div>
          </div>
        </div>

        {/* Barra de ocupação */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Ocupação</span>
            <span className={taxaOcupacao > 100 ? 'text-red-600 font-bold' : 'text-slate-600'}>{taxaOcupacao}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${taxaOcupacao > 200 ? 'bg-red-500' : taxaOcupacao > 100 ? 'bg-orange-400' : 'bg-green-500'}`}
              style={{ width: `${Math.min(taxaOcupacao, 100)}%` }}
            />
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm text-slate-600 hover:text-slate-900 transition-colors pt-2 border-t border-slate-100"
        >
          <span>{ue.salas.length} sala{ue.salas.length !== 1 ? 's' : ''} cadastrada{ue.salas.length !== 1 ? 's' : ''}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded: salas e vagas por etapa */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-4">
          {/* Vagas por etapa */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Vagas por Etapa</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="text-left py-1">Etapa</th>
                  <th className="text-right py-1">Faixa</th>
                  <th className="text-right py-1">Vagas</th>
                  <th className="text-right py-1">Matr.</th>
                  <th className="text-right py-1">Espera</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ue.vagasPorEtapa.filter(v => v.vagas > 0 || v.matriculas > 0).map(v => (
                  <tr key={v.etapa}>
                    <td className="py-1.5 font-semibold text-slate-700">{v.etapa}</td>
                    <td className="py-1.5 text-right text-slate-500 text-xs">{v.faixaEtaria}</td>
                    <td className="py-1.5 text-right">{v.vagas}</td>
                    <td className={`py-1.5 text-right font-semibold ${v.matriculas > v.vagas ? 'text-red-600' : 'text-slate-800'}`}>{v.matriculas}</td>
                    <td className={`py-1.5 text-right ${v.listaEspera > 0 ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>{v.listaEspera}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Salas */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Ambientes / Salas</h4>
            <div className="space-y-1.5">
              {ue.salas.map(sala => (
                <div key={sala.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">{sala.nome}</span>
                    {sala.etapaAtendida && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{sala.etapaAtendida}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">{sala.tipoAtual}</span>
                    {sala.capacidadeAtual > 0 && (
                      <span className="ml-2 text-xs font-semibold text-slate-700">cap. {sala.capacidadeAtual}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnidadesEscolares({ onBack }: UnidadesEscolaresProps) {
  const [search, setSearch] = useState('');
  const [filterSetor, setFilterSetor] = useState('Todos');

  const filtered = mockUnidades.filter(u => {
    const matchSearch = u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.bairro.toLowerCase().includes(search.toLowerCase()) ||
      u.codigo.toLowerCase().includes(search.toLowerCase()) ||
      u.inep.includes(search);
    const matchSetor = filterSetor === 'Todos' || u.setor === filterSetor;
    return matchSearch && matchSetor;
  });

  const totalVagas = mockUnidades.reduce((s, u) => s + u.totalVagas, 0);
  const totalMatriculas = mockUnidades.reduce((s, u) => s + u.totalMatriculas, 0);
  const totalListaEspera = mockUnidades.reduce((s, u) => s + u.totalListaEspera, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Unidades Escolares</h1>
          <p className="text-slate-600 text-lg">Creches e pré-escolas municipais de Cacoal/RO</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-1"><Building2 className="w-4 h-4 text-blue-500" /><span className="text-xs font-semibold text-slate-500 uppercase">Unidades</span></div>
            <p className="text-3xl font-bold text-blue-600">{mockUnidades.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-green-500">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-slate-500 uppercase">Vagas</span></div>
            <p className="text-3xl font-bold text-green-600">{totalVagas}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-amber-500">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-slate-500 uppercase">Matrículas</span></div>
            <p className="text-3xl font-bold text-amber-600">{totalMatriculas}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 border-l-4 border-red-500">
            <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-xs font-semibold text-slate-500 uppercase">Lista Espera</span></div>
            <p className="text-3xl font-bold text-red-600">{totalListaEspera}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, bairro, código ou INEP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={filterSetor}
              onChange={e => setFilterSetor(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]"
            >
              {SETORES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Grid de unidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(ue => <UnidadeCard key={ue.id} ue={ue} />)}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhuma unidade encontrada</h3>
            <p className="text-slate-500">Ajuste os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
