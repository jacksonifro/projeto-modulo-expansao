import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import {
  BookOpen,
  Home,
  Building2,
  ShoppingCart,
  BarChart3,
  ChevronLeft,
  Star,
  Settings,
  Plus,
  Pencil,
  Trash2,
  X,
  Wrench,
  RotateCcw,
} from "lucide-react";
import {
  ModeloAmbiente,
  ModeloCreche,
  ItemBiblioteca,
  TipoItemBiblioteca,
  CategoriaAmbiente,
  ServicoAnual,
  AquisicaoAnual,
  CargoReferencia,
} from "./types";
import {
  mockBibliotecaItens,
  mockModelosAmbiente,
  mockModelosCreche,
  calcularCustoAmbiente,
  calcularCustoCreche,
  mockServicosReferencia,
  mockAquisicoesReferencia,
  mockCargosReferencia,
} from "./mockDataCusto";
import { UserPlus } from "lucide-react";
import AmbienteEditor from "./AmbienteEditor";
import ModeloCrecheBuilder from "./ModeloCrecheBuilder";

interface ConfiguracoesCustoProps {
  onBack: () => void;
}

const BRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

const CATEGORIAS_LIST: { value: CategoriaAmbiente; label: string }[] = [
  { value: "sala-atividades", label: "Sala de Atividades" },
  { value: "bercario", label: "Berçário" },
  { value: "solario", label: "Solário" },
  { value: "fraldario", label: "Fraldário" },
  { value: "sala-amamentacao", label: "Sala de Amamentação" },
  { value: "refeitorio", label: "Refeitório" },
  { value: "cozinha", label: "Cozinha" },
  { value: "despensa", label: "Despensa" },
  { value: "lavanderia", label: "Lavanderia" },
  { value: "administracao", label: "Administração" },
  { value: "sala-professores", label: "Sala de Professores" },
  { value: "sala-recursos", label: "Recursos (AEE)" },
  { value: "banheiro-infantil", label: "B. Infantil" },
  { value: "banheiro-adulto", label: "B. Adulto/PCD" },
  { value: "deposito", label: "Depósito" },
  { value: "area-descoberta", label: "Pátio/Externa" },
  { value: "guarita", label: "Guarita" },
  { value: "outros", label: "Outros" },
];

interface BibliotecaTabProps {
  itens: ItemBiblioteca[];
  onAddItem: (item: ItemBiblioteca) => void;
  onUpdateItem: (item: ItemBiblioteca) => void;
  onDeleteItem: (id: string) => void;
}

function BibliotecaTab({
  itens,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: BibliotecaTabProps) {
  const [filtro, setFiltro] = useState<
    "todos" | "mobiliario" | "equipamento"
  >("todos");
  const [busca, setBusca] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemBiblioteca | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTipo, setFormTipo] = useState<TipoItemBiblioteca>("mobiliario");
  const [formUnidade, setFormUnidade] = useState("un");
  const [formValue, setFormValue] = useState<number>(0);
  const [formCategorias, setFormCategorias] = useState<CategoriaAmbiente[]>([]);

  const openModal = (item?: ItemBiblioteca) => {
    if (item) {
      setEditingItem(item);
      setFormCode(item.codigo);
      setFormDesc(item.descricao);
      setFormTipo(item.tipo);
      setFormUnidade(item.unidade);
      setFormValue(item.valorUnitarioRef);
      setFormCategorias(item.categoriasSugeridas);
    } else {
      setEditingItem(null);
      setFormCode("");
      setFormDesc("");
      setFormTipo("mobiliario");
      setFormUnidade("un");
      setFormValue(0);
      setFormCategorias([]);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formCode.trim() || !formDesc.trim() || !formUnidade.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }
    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        codigo: formCode.trim(),
        descricao: formDesc.trim(),
        tipo: formTipo,
        unidade: formUnidade.trim(),
        valorUnitarioRef: formValue,
        categoriasSugeridas: formCategorias,
      });
    } else {
      onAddItem({
        id: `bib-${Date.now()}`,
        codigo: formCode.trim(),
        descricao: formDesc.trim(),
        tipo: formTipo,
        unidade: formUnidade.trim(),
        valorUnitarioRef: formValue,
        categoriasSugeridas: formCategorias,
      });
    }
    setIsOpen(false);
  };

  const filtered = itens.filter((it) => {
    if (filtro !== "todos" && it.tipo !== filtro) return false;
    if (
      busca &&
      !it.descricao
        .toLowerCase()
        .includes(busca.toLowerCase()) &&
      !it.codigo.toLowerCase().includes(busca.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="p-6 space-y-4 relative">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Biblioteca de Itens de Referência
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Catálogo FNDE/SINAPI — valores de referência para
          mobiliário e equipamentos.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-between items-center">
        <div className="flex gap-3 flex-1 min-w-[280px]">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
            placeholder="Buscar por descrição ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <div className="flex rounded-lg overflow-hidden border">
            {(
              ["todos", "mobiliario", "equipamento"] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 text-sm transition-colors ${filtro === f ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                {f === "todos"
                  ? "Todos"
                  : f === "mobiliario"
                    ? "Mobiliário"
                    : "Equipamento"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Item
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3">Código</th>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Unidade</th>
              <th className="text-right px-4 py-3">
                Valor Ref.
              </th>
              <th className="text-left px-4 py-3">
                Categorias Sugeridas
              </th>
              <th className="w-24 text-center px-4 py-3">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                  {it.codigo}
                </td>
                <td className="px-4 py-2.5 text-gray-800">
                  {it.descricao}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${it.tipo === "mobiliario" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                  >
                    {it.tipo === "mobiliario"
                      ? "Mobiliário"
                      : "Equipamento"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-500">
                  {it.unidade}
                </td>
                <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                  {BRL(it.valorUnitarioRef)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {it.categoriasSugeridas
                      .slice(0, 3)
                      .map((c) => (
                        <span
                          key={c}
                          className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    {it.categoriasSugeridas.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{it.categoriasSugeridas.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openModal(it)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar item"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o item "${it.descricao}"?`)) {
                          onDeleteItem(it.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            Nenhum item encontrado.
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">
        {filtered.length} de {itens.length} itens · Fonte:
        FNDE/SINAPI · Referência: RO 2024
      </p>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingItem ? "Editar Item da Biblioteca" : "Adicionar Novo Item"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ex: M-SAL-009"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Unidade *
                  </label>
                  <input
                    type="text"
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    placeholder="Ex: un, m, conj"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Cadeira giratória estofada"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Tipo *
                  </label>
                  <div className="flex rounded-lg overflow-hidden border mt-0.5">
                    {(["mobiliario", "equipamento"] as TipoItemBiblioteca[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormTipo(t)}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${formTipo === t ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                      >
                        {t === "mobiliario" ? "Mobiliário" : "Equipamento"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Valor de Referência (R$) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Categorias Sugeridas (Onde o item pode ser usado)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border max-h-44 overflow-y-auto">
                  {CATEGORIAS_LIST.map((cat) => {
                    const checked = formCategorias.includes(cat.value);
                    return (
                      <label
                        key={cat.value}
                        className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none py-1 hover:bg-white px-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setFormCategorias(formCategorias.filter((c) => c !== cat.value));
                            } else {
                              setFormCategorias([...formCategorias, cat.value]);
                            }
                          }}
                          className="rounded text-orange-500 focus:ring-orange-300 h-3.5 w-3.5"
                        />
                        <span className="truncate">{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
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

// ─── Serviços Catalog Tab ──────────────────────────────────────────────────
interface ServicosCatalogTabProps {
  itens: ServicoAnual[];
  onAddItem: (item: ServicoAnual) => void;
  onUpdateItem: (item: ServicoAnual) => void;
  onDeleteItem: (id: string) => void;
}

function ServicosCatalogTab({
  itens,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: ServicosCatalogTabProps) {
  const [busca, setBusca] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServicoAnual | null>(null);
  const [formDesc, setFormDesc] = useState("");
  const [formUnidade, setFormUnidade] = useState("ano");
  const [formValue, setFormValue] = useState<number>(0);

  const openModal = (item?: ServicoAnual) => {
    if (item) {
      setEditingItem(item);
      setFormDesc(item.descricao);
      setFormUnidade(item.unidade);
      setFormValue(item.valorAnual);
    } else {
      setEditingItem(null);
      setFormDesc("");
      setFormUnidade("ano");
      setFormValue(0);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formDesc.trim() || !formUnidade.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }
    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        descricao: formDesc.trim(),
        unidade: formUnidade.trim(),
        valorAnual: formValue,
      });
    } else {
      onAddItem({
        id: `sv-${Date.now()}`,
        descricao: formDesc.trim(),
        unidade: formUnidade.trim(),
        valorAnual: formValue,
      });
    }
    setIsOpen(false);
  };

  const filtered = itens.filter(
    (it) =>
      !busca ||
      it.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4 relative">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Catálogo de Serviços de Referência
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Serviços anuais de referência para custeio operacional das creches.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-between items-center">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          placeholder="Buscar serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Serviço
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-left px-4 py-3">Unidade</th>
              <th className="text-right px-4 py-3">Valor de Referência (Anual)</th>
              <th className="w-24 text-center px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-800 font-semibold">{it.descricao}</td>
                <td className="px-4 py-2.5 text-gray-500">{it.unidade}</td>
                <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                  {BRL(it.valorAnual)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openModal(it)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar serviço"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o serviço "${it.descricao}"?`)) {
                          onDeleteItem(it.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir serviço"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            Nenhum serviço encontrado.
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingItem ? "Editar Serviço de Referência" : "Adicionar Novo Serviço"}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Manutenção de ar-condicionado"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Unidade *
                  </label>
                  <input
                    type="text"
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    placeholder="Ex: ano, mês, visita"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Valor de Referência (Anual) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
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

// ─── Aquisições Catalog Tab ────────────────────────────────────────────────
interface AquisicoesCatalogTabProps {
  itens: AquisicaoAnual[];
  onAddItem: (item: AquisicaoAnual) => void;
  onUpdateItem: (item: AquisicaoAnual) => void;
  onDeleteItem: (id: string) => void;
}

function AquisicoesCatalogTab({
  itens,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: AquisicoesCatalogTabProps) {
  const [busca, setBusca] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AquisicaoAnual | null>(null);
  const [formDesc, setFormDesc] = useState("");
  const [formUnidade, setFormUnidade] = useState("un");
  const [formValue, setFormValue] = useState<number>(0);

  const openModal = (item?: AquisicaoAnual) => {
    if (item) {
      setEditingItem(item);
      setFormDesc(item.descricao);
      setFormUnidade(item.unidade);
      setFormValue(item.valorUnitario);
    } else {
      setEditingItem(null);
      setFormDesc("");
      setFormUnidade("un");
      setFormValue(0);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formDesc.trim() || !formUnidade.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }
    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        descricao: formDesc.trim(),
        unidade: formUnidade.trim(),
        valorUnitario: formValue,
      });
    } else {
      onAddItem({
        id: `aq-${Date.now()}`,
        descricao: formDesc.trim(),
        unidade: formUnidade.trim(),
        quantidadeAnual: 1, // default
        valorUnitario: formValue,
      });
    }
    setIsOpen(false);
  };

  const filtered = itens.filter(
    (it) =>
      !busca ||
      it.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4 relative">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Catálogo de Aquisições de Referência
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Itens de aquisição recorrente (materiais, merenda, etc.) para custeio operacional.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-between items-center">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          placeholder="Buscar aquisição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Item
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-left px-4 py-3">Unidade</th>
              <th className="text-right px-4 py-3">Valor Unitário Ref.</th>
              <th className="w-24 text-center px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-800 font-semibold">{it.descricao}</td>
                <td className="px-4 py-2.5 text-gray-500">{it.unidade}</td>
                <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                  {BRL(it.valorUnitario)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openModal(it)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar aquisição"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o item "${it.descricao}"?`)) {
                          onDeleteItem(it.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir aquisição"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            Nenhum item encontrado.
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingItem ? "Editar Item de Aquisição" : "Adicionar Nova Aquisição"}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Merenda escolar — creche"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Unidade *
                  </label>
                  <input
                    type="text"
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    placeholder="Ex: un, kg, resma"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Valor Unitário *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
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

// ─── Simulador & Custeio Tab ──────────────────────────────────────────────────
function SimuladorCusteioTab({
  modelos,
  ambientes,
  cargosRef,
}: {
  modelos: ModeloCreche[];
  ambientes: ModeloAmbiente[];
  cargosRef: CargoReferencia[];
}) {
  const [quantidades, setQuantidades] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    modelos.forEach((m, idx) => {
      init[m.id] = idx === 0 ? 1 : 0; // Default to 1 for the first model
    });
    return init;
  });
  const [inflacao, setInflacao] = useState(4.5);

  const handleIncrement = (id: string) => {
    setQuantidades((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: string) => {
    setQuantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1),
    }));
  };

  const rows = modelos.map((m) => {
    const c = calcularCustoCreche(m, ambientes, cargosRef);
    return {
      modelo: m,
      custos: c,
    };
  });

  // Totais do cenário consolidado
  let cenarioInvestimento = 0;
  let cenarioCusteio = 0;
  let cenarioPessoal = 0;
  let cenarioServicos = 0;
  let cenarioAquisicoes = 0;
  let cenarioVagas = 0;
  let cenarioSalas = 0;
  let cenarioUnidades = 0;

  rows.forEach(({ modelo, custos }) => {
    const qty = quantidades[modelo.id] || 0;
    cenarioInvestimento += custos.investimento * qty;
    cenarioCusteio += custos.custeioAnual * qty;
    cenarioPessoal += (custos.detalheCusteio?.pessoal || 0) * qty;
    cenarioServicos += (custos.detalheCusteio?.servicos || 0) * qty;
    cenarioAquisicoes += (custos.detalheCusteio?.aquisicoes || 0) * qty;
    cenarioVagas += (modelo.capacidadeAlunos || 120) * qty;

    const salasPorCreche = modelo.ambientes
      .filter((ma) => {
        const amb = ambientes.find((a) => a.id === ma.modeloAmbienteId);
        return amb && (amb.categoria === "sala-atividades" || amb.categoria === "bercario");
      })
      .reduce((sum, ma) => sum + ma.quantidade, 0);

    cenarioSalas += salasPorCreche * qty;
    cenarioUnidades += qty;
  });

  const custoAlunoAno = cenarioVagas > 0 ? cenarioCusteio / cenarioVagas : 0;
  const custoAlunoMes = custoAlunoAno / 12;

  // Gerar dados para a projeção de 5 anos
  const projData = [];
  let acumulado = 0;
  for (let i = 1; i <= 5; i++) {
    const custoAnualAjustado = cenarioCusteio * Math.pow(1 + inflacao / 100, i - 1);
    acumulado += custoAnualAjustado;
    projData.push({
      ano: `Ano ${i}`,
      "Custo Anual": Math.round(custoAnualAjustado),
      "Acumulado": Math.round(acumulado),
    });
  }

  const pctPessoal = cenarioCusteio > 0 ? (cenarioPessoal / cenarioCusteio) * 100 : 0;
  const pctServicos = cenarioCusteio > 0 ? (cenarioServicos / cenarioCusteio) * 100 : 0;
  const pctAquisicoes = cenarioCusteio > 0 ? (cenarioAquisicoes / cenarioCusteio) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="text-left">
          <h2 className="text-lg font-semibold text-gray-800">
            Simulador de Custeio e Expansão
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Planeje expansões de rede e simule o impacto financeiro consolidado de investimento e custeio.
          </p>
        </div>
      </div>

      {/* Network Scenario Builder */}
      <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-5 text-left space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm">
          Planejamento de Unidades (Quantidade por Modelo)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modelos.map((modelo) => {
            const qty = quantidades[modelo.id] || 0;
            const singleC = rows.find((r) => r.modelo.id === modelo.id)?.custos;
            return (
              <div key={modelo.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm truncate">{modelo.nome}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{modelo.descricao}</p>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Capacidade: <span className="font-semibold text-slate-700">{modelo.capacidadeAlunos || 120} alunos</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Investimento unit: <span className="font-bold text-blue-700">{BRL(singleC?.investimento || 0)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Custeio unit/ano: <span className="font-bold text-orange-600">{BRL(singleC?.custeioAnual || 0)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-400 font-semibold">Qtd. Simulação</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDecrement(modelo.id)}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-slate-800 text-sm">{qty}</span>
                    <button 
                      onClick={() => handleIncrement(modelo.id)}
                      className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario Consolidated Results Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-100 shadow-sm text-left">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">
            Investimento Total
          </p>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">
            {BRL(cenarioInvestimento)}
          </p>
          <p className="text-xs text-blue-500 mt-1">
            {cenarioUnidades} unidades planejadas
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-4 border border-orange-100 shadow-sm text-left">
          <p className="text-xs text-orange-600 font-bold uppercase tracking-wide">
            Custeio Anual Consolidado
          </p>
          <p className="text-2xl font-extrabold text-orange-700 mt-1">
            {BRL(cenarioCusteio)}
          </p>
          <p className="text-xs text-orange-500 mt-1">
            Pessoal, Serviços e Consumo
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100 shadow-sm text-left">
          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">
            Novas Vagas de EI
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            +{cenarioVagas} crianças
          </p>
          <p className="text-xs text-emerald-500 mt-1">
            Atendimento nas {cenarioSalas} novas salas
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4 border border-purple-100 shadow-sm text-left">
          <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">
            Custo por Aluno / Mês
          </p>
          <p className="text-2xl font-extrabold text-purple-700 mt-1">
            {BRL(custoAlunoMes)}
          </p>
          <p className="text-xs text-purple-500 mt-1">
            Média ponderada da rede
          </p>
        </div>
      </div>

      {/* Simulator Controls & Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sliders and Distribution */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5 text-left">
          <h3 className="font-bold text-slate-800 text-sm">
            Simulador de Reajuste
          </h3>
          
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
              <span>Estimativa de Inflação Anual</span>
              <span className="text-orange-600 font-bold text-sm">{inflacao.toFixed(1)}% a.a.</span>
            </div>
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={inflacao}
              onChange={(e) => setInflacao(Number(e.target.value))}
              className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              Altere a inflação operacional projetada (pessoal, merenda, energia) para simular custos plurianuais (PPA).
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
              Distribuição de Gastos do Custeio
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                    Folha de Pagamento
                  </span>
                  <span className="font-bold text-indigo-700">{pctPessoal.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${pctPessoal}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 text-right">{BRL(cenarioPessoal)}/ano</div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Serviços Terceirizados
                  </span>
                  <span className="font-bold text-blue-700">{pctServicos.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${pctServicos}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 text-right">{BRL(cenarioServicos)}/ano</div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                    Aquisições e Consumo
                  </span>
                  <span className="font-bold text-teal-700">{pctAquisicoes.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full transition-all duration-300" style={{ width: `${pctAquisicoes}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 text-right">{BRL(cenarioAquisicoes)}/ano</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projection Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:col-span-2 text-left flex flex-col h-[320px]">
          <h3 className="font-bold text-slate-800 text-sm mb-3">
            Projeção Plurianual de Custeio (Rede Consolidada)
          </h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorCusteio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ano" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis 
                  tick={{ fontSize: 10, fill: "#64748b" }} 
                  tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${v/1e3}k`} 
                />
                <Tooltip 
                  formatter={(value: any) => [BRL(value), ""]}
                  labelStyle={{ fontSize: 11, fontWeight: "bold", color: "#1e293b" }}
                  contentStyle={{ borderRadius: 8, fontSize: 11 }}
                />
                <Area type="monotone" dataKey="Acumulado" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCusteio)" name="Custeio Acumulado" />
                <Area type="monotone" dataKey="Custo Anual" stroke="#3b82f6" strokeWidth={1.5} fill="none" name="Valor no Ano" />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Folha de Pagamento Catalog Tab ────────────────────────────────────────
interface FolhaPagamentoCatalogTabProps {
  itens: CargoReferencia[];
  onAddItem: (item: CargoReferencia) => void;
  onUpdateItem: (item: CargoReferencia) => void;
  onDeleteItem: (id: string) => void;
}

function FolhaPagamentoCatalogTab({
  itens,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: FolhaPagamentoCatalogTabProps) {
  const [busca, setBusca] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CargoReferencia | null>(null);
  const [formDesc, setFormDesc] = useState("");
  const [formRemuneracao, setFormRemuneracao] = useState<number>(0);
  const [formAuxilios, setFormAuxilios] = useState<number>(0);
  const [formPatronal, setFormPatronal] = useState<number>(0);

  const openModal = (item?: CargoReferencia) => {
    if (item) {
      setEditingItem(item);
      setFormDesc(item.descricao);
      setFormRemuneracao(item.remuneracaoBase);
      setFormAuxilios(item.auxilios);
      setFormPatronal(item.patronal);
    } else {
      setEditingItem(null);
      setFormDesc("");
      setFormRemuneracao(0);
      setFormAuxilios(0);
      setFormPatronal(0);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formDesc.trim()) {
      alert("Por favor, preencha a descrição do cargo.");
      return;
    }
    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        descricao: formDesc.trim(),
        remuneracaoBase: formRemuneracao,
        auxilios: formAuxilios,
        patronal: formPatronal,
      });
    } else {
      onAddItem({
        id: `cg-${Date.now()}`,
        descricao: formDesc.trim(),
        remuneracaoBase: formRemuneracao,
        auxilios: formAuxilios,
        patronal: formPatronal,
      });
    }
    setIsOpen(false);
  };

  const filtered = itens.filter(
    (it) =>
      !busca ||
      it.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4 relative">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Catálogo de Cargos (Folha de Pagamento)
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Cargos de referência para montagem de equipes nas creches.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-between items-center">
        <input
          className="border rounded-lg px-3 py-2 text-sm flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          placeholder="Buscar cargo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
        >
          <Plus size={16} /> Novo Cargo
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3">Cargo/Função</th>
              <th className="text-right px-4 py-3">Salário Base (Mês)</th>
              <th className="text-right px-4 py-3">Auxílios (Mês)</th>
              <th className="text-right px-4 py-3">Encargo Patronal (Mês)</th>
              <th className="text-right px-4 py-3">Custo Mensal Total</th>
              <th className="w-24 text-center px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((it) => {
              const total = it.remuneracaoBase + it.auxilios + it.patronal;
              return (
                <tr key={it.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-800 font-semibold">{it.descricao}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-600">{BRL(it.remuneracaoBase)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-600">{BRL(it.auxilios)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-600">{BRL(it.patronal)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{BRL(total)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openModal(it)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar cargo"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o cargo "${it.descricao}"?`)) {
                            onDeleteItem(it.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir cargo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            Nenhum cargo encontrado.
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingItem ? "Editar Cargo" : "Adicionar Novo Cargo"}
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Descrição / Função *
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: Professor Educação Infantil"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Remuneração Base (R$ / Mês)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formRemuneracao}
                    onChange={(e) => setFormRemuneracao(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Auxílios (Alimentação/Transp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formAuxilios}
                    onChange={(e) => setFormAuxilios(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Encargo Patronal / Custos Indiretos (Mês)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formPatronal}
                  onChange={(e) => setFormPatronal(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
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

// ─── Sidebar Tab Config ───────────────────────────────────────────────────────
type TabId =
  | "biblioteca"
  | "ambientes"
  | "servicos"
  | "aquisicoes"
  | "folha"
  | "modelos"
  | "custeio";

const TABS: {
  id: TabId;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "biblioteca",
    label: "Biblioteca",
    desc: "Itens FNDE de referência",
    icon: <BookOpen size={16} />,
  },
  {
    id: "ambientes",
    label: "Ambientes",
    desc: "Salas e espaços padrão",
    icon: <Home size={16} />,
  },
  {
    id: "servicos",
    label: "Serviços",
    desc: "Catálogo de Serviços",
    icon: <Wrench size={16} />,
  },
  {
    id: "aquisicoes",
    label: "Aquisições",
    desc: "Catálogo de Aquisições",
    icon: <ShoppingCart size={16} />,
  },
  {
    id: "folha",
    label: "Folha de Pagamento",
    desc: "Cargos e salários de referência",
    icon: <UserPlus size={16} />,
  },
  {
    id: "modelos",
    label: "Modelos de Creche",
    desc: "Composição Tipo B e C",
    icon: <Building2 size={16} />,
  },
  {
    id: "custeio",
    label: "Custeio & Simulação",
    desc: "Planejamento de rede e unitário",
    icon: <BarChart3 size={16} />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ConfiguracoesCusto({
  onBack,
}: ConfiguracoesCustoProps) {
  const [activeTab, setActiveTab] =
    useState<TabId>("biblioteca");
  const [ambientes, setAmbientes] = useState<ModeloAmbiente[]>(() => {
    const cached = localStorage.getItem("exp_creches_ambientes");
    return cached ? JSON.parse(cached) : mockModelosAmbiente;
  });
  const [modelos, setModelos] = useState<ModeloCreche[]>(() => {
    const cached = localStorage.getItem("exp_creches_modelos");
    if (!cached) return mockModelosCreche;
    const parsed: ModeloCreche[] = JSON.parse(cached);
    return parsed.map(m => {
      if (!m.pessoal) {
        const mockMatch = mockModelosCreche.find(x => x.id === m.id);
        return { ...m, pessoal: mockMatch?.pessoal || [] };
      }
      return m;
    });
  });
  const [bibliotecaItens, setBibliotecaItens] = useState<ItemBiblioteca[]>(() => {
    const cached = localStorage.getItem("exp_creches_biblioteca");
    return cached ? JSON.parse(cached) : mockBibliotecaItens;
  });
  const [servicosRef, setServicosRef] = useState<ServicoAnual[]>(() => {
    const cached = localStorage.getItem("exp_creches_servicos_ref");
    return cached ? JSON.parse(cached) : mockServicosReferencia;
  });
  const [aquisicoesRef, setAquisicoesRef] = useState<AquisicaoAnual[]>(() => {
    const cached = localStorage.getItem("exp_creches_aquisicoes_ref");
    return cached ? JSON.parse(cached) : mockAquisicoesReferencia;
  });
  const [cargosRef, setCargosRef] = useState<CargoReferencia[]>(() => {
    const cached = localStorage.getItem("exp_creches_cargos_ref");
    return cached ? JSON.parse(cached) : mockCargosReferencia;
  });

  useEffect(() => {
    localStorage.setItem("exp_creches_ambientes", JSON.stringify(ambientes));
  }, [ambientes]);

  useEffect(() => {
    localStorage.setItem("exp_creches_modelos", JSON.stringify(modelos));
  }, [modelos]);

  useEffect(() => {
    localStorage.setItem("exp_creches_biblioteca", JSON.stringify(bibliotecaItens));
  }, [bibliotecaItens]);

  useEffect(() => {
    localStorage.setItem("exp_creches_servicos_ref", JSON.stringify(servicosRef));
  }, [servicosRef]);

  useEffect(() => {
    localStorage.setItem("exp_creches_aquisicoes_ref", JSON.stringify(aquisicoesRef));
  }, [aquisicoesRef]);

  useEffect(() => {
    localStorage.setItem("exp_creches_cargos_ref", JSON.stringify(cargosRef));
  }, [cargosRef]);

  const restaurarPadroes = () => {
    if (confirm("Tem certeza que deseja restaurar as configurações originais padrão? Todas as suas alterações locais serão descartadas.")) {
      localStorage.removeItem("exp_creches_ambientes");
      localStorage.removeItem("exp_creches_modelos");
      localStorage.removeItem("exp_creches_biblioteca");
      localStorage.removeItem("exp_creches_servicos_ref");
      localStorage.removeItem("exp_creches_aquisicoes_ref");

      setAmbientes(mockModelosAmbiente);
      setModelos(mockModelosCreche);
      setBibliotecaItens(mockBibliotecaItens);
      setServicosRef(mockServicosReferencia);
      setAquisicoesRef(mockAquisicoesReferencia);
      setCargosRef(mockCargosReferencia);
      alert("Configurações originais restauradas com sucesso.");
    }
  };

  const currentIdx = TABS.findIndex((t) => t.id === activeTab);
  const padraoCnt = ambientes.filter((a) => a.padrao).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Configurações de Custo
                </h1>
                <p className="text-slate-500">
                  Ambientes, modelos e estimativas de custo para creches FNDE
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={restaurarPadroes}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors mt-9 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Restaurar Padrões
          </button>
        </div>

        <div className="flex gap-5 items-start">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-4 py-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                Configurações
              </p>
              <p className="text-sm font-bold mt-0.5">
                Custo Creche
              </p>
              <div className="mt-2 flex gap-2 text-xs opacity-90">
                <span className="bg-white/20 px-2 py-0.5 rounded-full">
                  {ambientes.length} ambientes
                </span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full">
                  {padraoCnt} padrão
                </span>
              </div>
            </div>

            <nav className="py-2">
              {TABS.map((tab, idx) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                      active
                        ? "bg-orange-50 border-r-2 border-orange-500 text-orange-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                        active
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${active ? "text-orange-700" : "text-gray-700"}`}
                      >
                        {tab.label}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {tab.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="px-4 pb-4">
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${((currentIdx + 1) / TABS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">
                {currentIdx + 1} / {TABS.length}
              </p>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-lg overflow-hidden">
            {activeTab === "biblioteca" && (
              <BibliotecaTab
                itens={bibliotecaItens}
                onAddItem={(item) => setBibliotecaItens([...bibliotecaItens, item])}
                onUpdateItem={(item) =>
                  setBibliotecaItens(bibliotecaItens.map((it) => (it.id === item.id ? item : it)))
                }
                onDeleteItem={(id) =>
                  setBibliotecaItens(bibliotecaItens.filter((it) => it.id !== id))
                }
              />
            )}
            {activeTab === "ambientes" && (
              <AmbienteEditor
                ambientes={ambientes}
                onChange={setAmbientes}
                bibliotecaItens={bibliotecaItens}
              />
            )}
            {activeTab === "servicos" && (
              <ServicosCatalogTab
                itens={servicosRef}
                onAddItem={(item) => setServicosRef([...servicosRef, item])}
                onUpdateItem={(item) =>
                  setServicosRef(servicosRef.map((it) => (it.id === item.id ? item : it)))
                }
                onDeleteItem={(id) => setServicosRef(servicosRef.filter((it) => it.id !== id))}
              />
            )}
            {activeTab === "aquisicoes" && (
              <AquisicoesCatalogTab
                itens={aquisicoesRef}
                onAddItem={(item) => setAquisicoesRef([...aquisicoesRef, item])}
                onUpdateItem={(item) =>
                  setAquisicoesRef(aquisicoesRef.map((it) => (it.id === item.id ? item : it)))
                }
                onDeleteItem={(id) => setAquisicoesRef(aquisicoesRef.filter((it) => it.id !== id))}
              />
            )}
            {activeTab === "folha" && (
              <FolhaPagamentoCatalogTab
                itens={cargosRef}
                onAddItem={(item) => setCargosRef([...cargosRef, item])}
                onUpdateItem={(item) =>
                  setCargosRef(cargosRef.map((it) => (it.id === item.id ? item : it)))
                }
                onDeleteItem={(id) => setCargosRef(cargosRef.filter((it) => it.id !== id))}
              />
            )}
            {activeTab === "modelos" && (
              <ModeloCrecheBuilder
                modelos={modelos}
                ambientes={ambientes}
                onChange={setModelos}
                servicosRef={servicosRef}
                aquisicoesRef={aquisicoesRef}
                cargosRef={cargosRef}
              />
            )}
            {activeTab === "custeio" && (
              <SimuladorCusteioTab
                modelos={modelos}
                ambientes={ambientes}
                cargosRef={cargosRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}