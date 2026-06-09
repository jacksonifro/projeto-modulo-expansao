import { useState } from 'react';
import { ChevronLeft, Plus, Search, Edit2, Trash2, UserCheck, X, Save, Phone, Mail, Building } from 'lucide-react';
import { Servidor } from './types';
import { mockServidores } from './mockData';

interface ServidoresProps {
  onBack: () => void;
}

const SECRETARIAS = ['SEMED', 'SEMFAZ', 'CGM', 'SEMPLAN', 'SEMOB', 'SEMSAU', 'PREFEITURA'];

const emptyServidor: Omit<Servidor, 'id'> = {
  nome: '', matricula: '', cargo: '', secretaria: 'SEMED', telefone: '', email: '', ativo: true,
};

export default function Servidores({ onBack }: ServidoresProps) {
  const [servidores, setServidores] = useState<Servidor[]>(mockServidores);
  const [search, setSearch] = useState('');
  const [filterSecretaria, setFilterSecretaria] = useState('Todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Servidor, 'id'>>(emptyServidor);

  const filtered = servidores.filter(s => {
    const matchSearch = s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.cargo.toLowerCase().includes(search.toLowerCase()) ||
      s.matricula.includes(search);
    const matchSec = filterSecretaria === 'Todas' || s.secretaria === filterSecretaria;
    return matchSearch && matchSec;
  });

  const openNew = () => {
    setForm(emptyServidor);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (s: Servidor) => {
    setForm({ nome: s.nome, matricula: s.matricula, cargo: s.cargo, secretaria: s.secretaria, telefone: s.telefone, email: s.email, ativo: s.ativo });
    setEditingId(s.id);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.matricula.trim()) return;
    if (editingId) {
      setServidores(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
    } else {
      const newId = `s${Date.now()}`;
      setServidores(prev => [...prev, { id: newId, ...form }]);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setServidores(prev => prev.filter(s => s.id !== id));
  };

  const secColors: Record<string, string> = {
    SEMED: 'bg-blue-100 text-blue-700',
    SEMFAZ: 'bg-green-100 text-green-700',
    CGM: 'bg-purple-100 text-purple-700',
    SEMPLAN: 'bg-orange-100 text-orange-700',
    SEMOB: 'bg-red-100 text-red-700',
    SEMSAU: 'bg-teal-100 text-teal-700',
    PREFEITURA: 'bg-slate-100 text-slate-700',
  };

  const totalAtivos = servidores.filter(s => s.ativo).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Servidores Municipais</h1>
              <p className="text-slate-600 text-lg">{totalAtivos} servidores ativos cadastrados</p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Novo Servidor
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou matrícula..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={filterSecretaria}
              onChange={e => setFilterSecretaria(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[180px]"
            >
              <option value="Todas">Todas as Secretarias</option>
              {SECRETARIAS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(servidor => (
            <div key={servidor.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {servidor.nome.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{servidor.nome}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${secColors[servidor.secretaria] ?? 'bg-slate-100 text-slate-600'}`}>
                      {servidor.secretaria}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(servidor)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(servidor.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <UserCheck className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{servidor.cargo}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Building className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Matrícula: <strong>{servidor.matricula}</strong></span>
                </div>
                {servidor.telefone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{servidor.telefone}</span>
                  </div>
                )}
                {servidor.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="truncate">{servidor.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${servidor.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {servidor.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <UserCheck className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhum servidor encontrado</h3>
            <p className="text-slate-500">Ajuste os filtros ou cadastre um novo servidor</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Editar Servidor' : 'Novo Servidor'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nome completo do servidor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Matrícula *</label>
                  <input
                    type="text"
                    value={form.matricula}
                    onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Ex: 10241"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Secretaria *</label>
                  <select
                    value={form.secretaria}
                    onChange={e => setForm(f => ({ ...f, secretaria: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {SECRETARIAS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={form.cargo}
                  onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Coordenador Pedagógico"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="(69) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.ativo ? 'ativo' : 'inativo'}
                    onChange={e => setForm(f => ({ ...f, ativo: e.target.value === 'ativo' }))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="servidor@cacoal.ro.gov.br"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Salvar Alterações' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
