import { useState } from 'react';
import {
  ChevronDown, ChevronUp, Plus, Trash2, Copy, Star, StarOff,
  Pencil, Check, X, Package, Wrench,
} from 'lucide-react';
import { ModeloAmbiente, ItemAmbiente, CategoriaAmbiente, TipoItemBiblioteca, ItemBiblioteca } from './types';
import { calcularCustoAmbiente } from './mockDataCusto';

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CATEGORIAS: { value: CategoriaAmbiente; label: string }[] = [
  { value: 'sala-atividades', label: 'Sala de Aula (Atividades)' },
  { value: 'bercario', label: 'Berçário' },
  { value: 'solario', label: 'Solário' },
  { value: 'fraldario', label: 'Fraldário' },
  { value: 'sala-amamentacao', label: 'Sala de Amamentação' },
  { value: 'refeitorio', label: 'Refeitório' },
  { value: 'cozinha', label: 'Cozinha' },
  { value: 'despensa', label: 'Despensa' },
  { value: 'lavanderia', label: 'Lavanderia' },
  { value: 'administracao', label: 'Administração / Secretaria' },
  { value: 'sala-professores', label: 'Sala de Professores' },
  { value: 'sala-recursos', label: 'Sala de Recursos (AEE)' },
  { value: 'banheiro-infantil', label: 'Banheiro Infantil' },
  { value: 'banheiro-adulto', label: 'Banheiro Adulto / PCD' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'area-descoberta', label: 'Área Descoberta / Pátio' },
  { value: 'guarita', label: 'Guarita' },
  { value: 'outros', label: 'Outros' },
];

function CurrencyInput({ value, onChange, className }: {
  value: number; onChange: (v: number) => void; className?: string;
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const [display, setDisplay] = useState(() => value > 0 ? fmt(value) : '');
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = raw === '' ? 0 : Number(raw) / 100;
    setDisplay(raw === '' ? '' : fmt(num));
    onChange(num);
  };
  return (
    <input
      value={display}
      onChange={handleChange}
      onBlur={() => setDisplay(value > 0 ? fmt(value) : '')}
      onFocus={() => { if (value === 0) setDisplay(''); }}
      className={className}
      placeholder="R$ 0,00"
    />
  );
}

interface AmbienteCardProps {
  ambiente: ModeloAmbiente;
  onUpdate: (updated: ModeloAmbiente) => void;
  onDelete: () => void;
  onClone: () => void;
  bibliotecaItens: ItemBiblioteca[];
}

function AmbienteCard({ ambiente, onUpdate, onDelete, onClone, bibliotecaItens }: AmbienteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemBibId, setNewItemBibId] = useState('');
  const [newItemTipo, setNewItemTipo] = useState<TipoItemBiblioteca>('mobiliario');
  const [editingHeader, setEditingHeader] = useState(false);

  const custo = calcularCustoAmbiente(ambiente);
  const itensMoviario = ambiente.itens.filter(i => i.tipo === 'mobiliario');
  const itensEquipamento = ambiente.itens.filter(i => i.tipo === 'equipamento');

  const updateItem = (id: string, field: keyof ItemAmbiente, value: any) => {
    onUpdate({
      ...ambiente,
      itens: ambiente.itens.map(i => i.id === id ? { ...i, [field]: value } : i),
    });
  };

  const removeItem = (id: string) => {
    onUpdate({ ...ambiente, itens: ambiente.itens.filter(i => i.id !== id) });
  };

  const addItemFromBiblioteca = () => {
    if (!newItemBibId) return;
    const bib = bibliotecaItens.find(b => b.id === newItemBibId);
    if (!bib) return;
    const newItem: ItemAmbiente = {
      id: `item-${Date.now()}`,
      bibliotecaId: bib.id,
      tipo: bib.tipo,
      descricao: bib.descricao,
      quantidade: 1,
      valorUnitario: bib.valorUnitarioRef,
    };
    onUpdate({ ...ambiente, itens: [...ambiente.itens, newItem] });
    setNewItemBibId('');
    setAddingItem(false);
  };

  const addItemManual = () => {
    const newItem: ItemAmbiente = {
      id: `item-${Date.now()}`,
      bibliotecaId: '',
      tipo: newItemTipo,
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
    };
    onUpdate({ ...ambiente, itens: [...ambiente.itens, newItem] });
    setAddingItem(false);
  };

  const bibFiltrada = bibliotecaItens.filter(b =>
    b.tipo === newItemTipo
  );

  const inputCls = "text-sm px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${ambiente.padrao ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <button onClick={() => setExpanded(!expanded)} className="flex-1 flex items-center gap-3 text-left min-w-0">
          <div className={`p-2 rounded-xl shrink-0 ${expanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            {editingHeader ? (
              <input
                autoFocus
                value={ambiente.nome}
                onChange={e => onUpdate({ ...ambiente, nome: e.target.value })}
                onBlur={() => setEditingHeader(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingHeader(false)}
                className="text-base font-bold border-b-2 border-blue-500 bg-transparent outline-none w-full"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="font-bold text-slate-800 text-base truncate">{ambiente.nome}</span>
            )}
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-slate-500">
                {CATEGORIAS.find(c => c.value === ambiente.categoria)?.label}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{ambiente.areaMq} m²</span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-semibold text-slate-600">{ambiente.itens.length} itens</span>
            </div>
          </div>
        </button>

        {/* Custo summary badges */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-xs text-slate-400">Obra civil</div>
            <div className="text-sm font-semibold text-slate-700">{BRL(custo.obras)}</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-right">
            <div className="text-xs text-slate-400">Mobiliário</div>
            <div className="text-sm font-semibold text-blue-700">{BRL(custo.mobiliario)}</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-right">
            <div className="text-xs text-slate-400">Equipamentos</div>
            <div className="text-sm font-semibold text-purple-700">{BRL(custo.equipamentos)}</div>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-right">
            <div className="text-xs text-slate-400">Total</div>
            <div className="font-bold text-green-700">{BRL(custo.total)}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {ambiente.padrao ? (
            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-lg font-semibold">
              <Star className="w-3 h-3" /> Padrão
            </span>
          ) : null}
          <button onClick={() => onUpdate({ ...ambiente, padrao: !ambiente.padrao })}
            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
            title={ambiente.padrao ? 'Remover padrão' : 'Marcar como padrão'}>
            {ambiente.padrao ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
          </button>
          <button onClick={() => setEditingHeader(true)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onClone}
            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-slate-200 bg-white">
          {/* Dados do ambiente */}
          <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-slate-100 bg-slate-50">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
              <select value={ambiente.categoria}
                onChange={e => onUpdate({ ...ambiente, categoria: e.target.value as CategoriaAmbiente })}
                className={`${inputCls} w-full bg-white`}>
                {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Área (m²)</label>
              <input type="number" value={ambiente.areaMq} min={1}
                onChange={e => onUpdate({ ...ambiente, areaMq: Number(e.target.value) })}
                className={`${inputCls} w-full`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Custo construção / m²</label>
              <CurrencyInput value={ambiente.custoConstrucaoMq}
                onChange={v => onUpdate({ ...ambiente, custoConstrucaoMq: v })}
                className={`${inputCls} w-full`} />
            </div>
            {(ambiente.categoria === 'sala-atividades' || ambiente.categoria === 'bercario') && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Capacidade (vagas)</label>
                <input type="number" value={ambiente.capacidadeAlunos || ''} min={0}
                  onChange={e => onUpdate({ ...ambiente, capacidadeAlunos: Number(e.target.value) })}
                  placeholder="Ex: 20"
                  className={`${inputCls} w-full`} />
              </div>
            )}
            <div className="flex flex-col justify-center bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="text-xs text-green-600 font-semibold">Obra civil total</div>
              <div className="font-bold text-green-700 text-lg">{BRL(custo.obras)}</div>
              <div className="text-xs text-green-500">{ambiente.areaMq} m² × {BRL(ambiente.custoConstrucaoMq)}/m²</div>
            </div>
          </div>

          {/* Itens — Mobiliário */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                Mobiliário
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                  {BRL(custo.mobiliario)}
                </span>
              </h4>
              <button
                onClick={() => { setNewItemTipo('mobiliario'); setAddingItem(true); }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {itensMoviario.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-3">Nenhum item de mobiliário</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Descrição</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-600 w-24">Qtd</th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-600 w-36">Valor Unit.</th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-600 w-36">Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itensMoviario.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <input value={item.descricao}
                            onChange={e => updateItem(item.id, 'descricao', e.target.value)}
                            className="w-full text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none py-0.5" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="number" min={1} value={item.quantidade}
                            onChange={e => updateItem(item.id, 'quantidade', Number(e.target.value))}
                            className="w-20 text-center text-sm px-2 py-1 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <CurrencyInput value={item.valorUnitario}
                            onChange={v => updateItem(item.id, 'valorUnitario', v)}
                            className="w-32 text-right text-sm px-2 py-1 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-blue-700">
                          {BRL(item.quantidade * item.valorUnitario)}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeItem(item.id)}
                            className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Equipamentos */}
            <div className="flex items-center justify-between mb-3 mt-5">
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-500" />
                Equipamentos
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                  {BRL(custo.equipamentos)}
                </span>
              </h4>
              <button
                onClick={() => { setNewItemTipo('equipamento'); setAddingItem(true); }}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>

            {itensEquipamento.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-3">Nenhum equipamento</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600">Descrição</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-600 w-24">Qtd</th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-600 w-36">Valor Unit.</th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-600 w-36">Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itensEquipamento.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <input value={item.descricao}
                            onChange={e => updateItem(item.id, 'descricao', e.target.value)}
                            className="w-full text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 outline-none py-0.5" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input type="number" min={1} value={item.quantidade}
                            onChange={e => updateItem(item.id, 'quantidade', Number(e.target.value))}
                            className="w-20 text-center text-sm px-2 py-1 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none" />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <CurrencyInput value={item.valorUnitario}
                            onChange={v => updateItem(item.id, 'valorUnitario', v)}
                            className="w-32 text-right text-sm px-2 py-1 border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500 outline-none" />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-purple-700">
                          {BRL(item.quantidade * item.valorUnitario)}
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => removeItem(item.id)}
                            className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total bar */}
            <div className="mt-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-xs text-slate-500">Obra Civil</div>
                <div className="font-bold text-slate-700">{BRL(custo.obras)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Mobiliário</div>
                <div className="font-bold text-blue-700">{BRL(custo.mobiliario)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Equipamentos</div>
                <div className="font-bold text-purple-700">{BRL(custo.equipamentos)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-semibold">TOTAL AMBIENTE</div>
                <div className="font-black text-green-700 text-lg">{BRL(custo.total)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal overlay */}
      {addingItem && (
        <div className="border-t border-slate-200 bg-blue-50 px-5 py-4">
          <div className="flex items-center gap-3 mb-3">
            <h4 className="font-semibold text-slate-700 text-sm">Adicionar item</h4>
            <div className="flex gap-2">
              {(['mobiliario', 'equipamento'] as TipoItemBiblioteca[]).map(t => (
                <button key={t} onClick={() => setNewItemTipo(t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${newItemTipo === t ? t === 'mobiliario' ? 'bg-blue-600 text-white border-blue-600' : 'bg-purple-600 text-white border-purple-600' : 'border-slate-300 text-slate-600'}`}>
                  {t === 'mobiliario' ? 'Mobiliário' : 'Equipamento'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <select value={newItemBibId} onChange={e => setNewItemBibId(e.target.value)}
              className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">— Selecione da biblioteca —</option>
              {bibFiltrada.map(b => (
                <option key={b.id} value={b.id}>{b.codigo} · {b.descricao} · {BRL(b.valorUnitarioRef)}</option>
              ))}
            </select>
            <button onClick={addItemFromBiblioteca} disabled={!newItemBibId}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
              <Check className="w-4 h-4" /> Adicionar
            </button>
            <button onClick={addItemManual}
              className="px-3 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-white">
              Manual
            </button>
            <button onClick={() => { setAddingItem(false); setNewItemBibId(''); }}
              className="p-2 text-slate-400 hover:text-red-500 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface AmbienteEditorProps {
  ambientes: ModeloAmbiente[];
  onChange: (ambientes: ModeloAmbiente[]) => void;
  bibliotecaItens: ItemBiblioteca[];
}

export default function AmbienteEditor({ ambientes, onChange, bibliotecaItens }: AmbienteEditorProps) {
  const [filterCategoria, setFilterCategoria] = useState<string>('todas');
  const [filterPadrao, setFilterPadrao] = useState<'todos' | 'padrao' | 'custom'>('todos');
  const [search, setSearch] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formCategoria, setFormCategoria] = useState<CategoriaAmbiente>('outros');
  const [formArea, setFormArea] = useState<number>(20);
  const [formCusto, setFormCusto] = useState<number>(4950);
  const [formPadrao, setFormPadrao] = useState(false);
  const [formCapacidade, setFormCapacidade] = useState<number | undefined>();

  const openAddModal = () => {
    setFormNome('');
    setFormCategoria('outros');
    setFormArea(20);
    setFormCusto(4950);
    setFormPadrao(false);
    setFormCapacidade(undefined);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formNome.trim()) {
      alert('Por favor, preencha o nome do ambiente.');
      return;
    }
    const novo: ModeloAmbiente = {
      id: `ma-${Date.now()}`,
      nome: formNome.trim(),
      categoria: formCategoria,
      areaMq: formArea,
      custoConstrucaoMq: formCusto,
      padrao: formPadrao,
      capacidadeAlunos: (formCategoria === 'sala-atividades' || formCategoria === 'bercario') ? (formCapacidade || 0) : undefined,
      itens: [],
    };
    onChange([...ambientes, novo]);
    setIsOpen(false);
  };

  const cloneAmbiente = (amb: ModeloAmbiente) => {
    const clone: ModeloAmbiente = {
      ...amb,
      id: `ma-${Date.now()}`,
      nome: `${amb.nome} (cópia)`,
      padrao: false,
      itens: amb.itens.map(i => ({ ...i, id: `item-${Date.now()}-${Math.random()}` })),
    };
    onChange([...ambientes, clone]);
  };

  const filtered = ambientes.filter(a => {
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategoria === 'todas' || a.categoria === filterCategoria;
    const matchPadrao =
      filterPadrao === 'todos' ||
      (filterPadrao === 'padrao' && a.padrao) ||
      (filterPadrao === 'custom' && !a.padrao);
    return matchSearch && matchCat && matchPadrao;
  });

  const totalAmbientes = ambientes.length;
  const totalArea = ambientes.reduce((s, a) => s + a.areaMq, 0);
  const totalCusto = ambientes.reduce((s, a) => {
    const c = calcularCustoAmbiente(a);
    return s + c.total;
  }, 0);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{totalAmbientes}</div>
          <div className="text-sm text-slate-500">Modelos de Ambiente</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{totalArea} m²</div>
          <div className="text-sm text-slate-500">Área total configurada</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-xl font-bold text-green-700">{BRL(totalCusto)}</div>
          <div className="text-sm text-slate-500">Custo total dos ambientes</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Buscar ambiente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-48"
          />
          <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="todas">Todas as categorias</option>
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            {([['todos', 'Todos'], ['padrao', 'Padrão FNDE'], ['custom', 'Customizados']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterPadrao(v)}
                className={`px-3 py-2 text-xs font-semibold transition-all ${filterPadrao === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm">
          <Plus className="w-4 h-4" /> Novo Ambiente
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum ambiente encontrado</p>
          </div>
        ) : (
          filtered.map(amb => (
            <AmbienteCard
              key={amb.id}
              ambiente={amb}
              onUpdate={updated => onChange(ambientes.map(a => a.id === amb.id ? updated : a))}
              onDelete={() => onChange(ambientes.filter(a => a.id !== amb.id))}
              onClone={() => cloneAmbiente(amb)}
              bibliotecaItens={bibliotecaItens}
            />
          ))
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 text-left">
              <h3 className="font-bold text-gray-800 text-lg">
                Criar Novo Ambiente
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nome do Ambiente *
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Sala de Leitura Infantil"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as CategoriaAmbiente)}
                    className="w-full text-sm px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Área (m²) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formArea}
                    onChange={(e) => setFormArea(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Custo de Construção / m² (R$) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formCusto}
                    onChange={(e) => setFormCusto(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                  />
                </div>
                {(formCategoria === 'sala-atividades' || formCategoria === 'bercario') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Capacidade (alunos/vagas)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formCapacidade || ''}
                      onChange={(e) => setFormCapacidade(Number(e.target.value))}
                      placeholder="Ex: 20"
                      className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                    />
                  </div>
                )}
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formPadrao}
                      onChange={() => setFormPadrao(!formPadrao)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Ambiente Padrão FNDE</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 text-left">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
