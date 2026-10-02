import { useState, useEffect } from "react";

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
import { UserPlus, Calculator } from "lucide-react";
import AmbienteEditor from "./AmbienteEditor";
import ModeloCrecheBuilder from "./ModeloCrecheBuilder";

interface ConfiguracoesCustoProps {
  onBack: () => void;
  onNavigate?: (view: string) => void;
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

export const AMBIENTES_CLASSIFICACAO_OPTIONS = [
  'COPA',
  'FRALDÁRIO / SANITÁRIOS',
  'PÁTIO INFANTIL COBERTO / REFEITÓRIO',
  'PLAYGROUND',
  'SALA DE ATIVIDADES (CRECHE)',
  'SALA DE ATIVIDADES (PRÉ-ESCOLA)',
] as const;

export const UNIDADES_PREDEFINIDAS = [
  "Unidade",
  "Conjunto",
  "Metro",
  "Metro Quadrado (m²)",
  "Par",
  "Kit",
  "Peça",
  "Caixa",
];

function ItemCurrencyInput({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const [display, setDisplay] = useState(() => (value > 0 ? fmt(value) : ""));

  useEffect(() => {
    setDisplay(value > 0 ? fmt(value) : "");
  }, [value]);

  return (
    <input
      type="text"
      value={display}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, "");
        const num = raw === "" ? 0 : Number(raw) / 100;
        setDisplay(raw === "" ? "" : fmt(num));
        onChange(num);
      }}
      onBlur={() => setDisplay(value > 0 ? fmt(value) : "")}
      onFocus={() => {
        if (value === 0) setDisplay("");
      }}
      className={className}
      placeholder="R$ 0,00"
    />
  );
}

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
  const [filtroAmbiente, setFiltroAmbiente] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemBiblioteca | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTipo, setFormTipo] = useState<TipoItemBiblioteca>("mobiliario");
  const [formUnidade, setFormUnidade] = useState("UNIDADE");
  const [formAmbiente, setFormAmbiente] = useState("");
  const [formValue, setFormValue] = useState<number>(0);
  const [formCategorias, setFormCategorias] = useState<CategoriaAmbiente[]>([]);

  const openModal = (item?: ItemBiblioteca) => {
    if (item) {
      setEditingItem(item);
      setFormCode(item.codigo);
      setFormDesc(item.descricao);
      setFormTipo(item.tipo);
      setFormUnidade(item.unidade || "UNIDADE");
      setFormAmbiente(item.ambienteClassificacao || "");
      setFormValue(item.valorUnitarioRef);
      setFormCategorias(item.categoriasSugeridas || []);
    } else {
      setEditingItem(null);
      setFormCode("");
      setFormDesc("");
      setFormTipo("mobiliario");
      setFormUnidade("UNIDADE");
      setFormAmbiente("");
      setFormValue(0);
      setFormCategorias([]);
    }
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formDesc.trim()) {
      alert("Por favor, preencha a descrição do item (*).");
      return;
    }
    const unidadeFinal = (formUnidade.trim() || "UNIDADE").toUpperCase();
    const codigoFinal = (
      formCode.trim() ||
      (formTipo === "mobiliario"
        ? `MOB-${Date.now().toString().slice(-4)}`
        : `EQP-${Date.now().toString().slice(-4)}`)
    ).toUpperCase();

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        codigo: codigoFinal,
        descricao: formDesc.trim().toUpperCase(),
        tipo: formTipo,
        unidade: unidadeFinal,
        ambienteClassificacao: formAmbiente || undefined,
        valorUnitarioRef: formValue,
        categoriasSugeridas: formCategorias,
      });
    } else {
      onAddItem({
        id: `bib-${Date.now()}`,
        codigo: codigoFinal,
        descricao: formDesc.trim().toUpperCase(),
        tipo: formTipo,
        unidade: unidadeFinal,
        ambienteClassificacao: formAmbiente || undefined,
        valorUnitarioRef: formValue,
        categoriasSugeridas: formCategorias,
      });
    }
    setIsOpen(false);
  };

  const filtered = itens.filter((it) => {
    if (filtro !== "todos" && it.tipo !== filtro) return false;
    if (filtroAmbiente !== "todos" && it.ambienteClassificacao !== filtroAmbiente) return false;
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
          Catálogo FNDE/SINAPI — Valores de referência para mobiliário e equipamentos, classificados por ambiente escolar.
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-between items-center">
        <div className="flex gap-3 flex-1 flex-wrap min-w-[280px]">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
            placeholder="Buscar por descrição ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            value={filtroAmbiente}
            onChange={(e) => setFiltroAmbiente(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="todos">Todos os ambientes</option>
            {AMBIENTES_CLASSIFICACAO_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <div className="flex rounded-lg overflow-hidden border">
            {(
              ["todos", "mobiliario", "equipamento"] as const
            ).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-4 py-2 text-sm transition-colors ${filtro === f ? "bg-orange-500 text-white font-semibold" : "bg-white text-gray-600 hover:bg-gray-50"}`}
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
              <th className="text-left px-4 py-3">Ambiente</th>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Unidade</th>
              <th className="text-right px-4 py-3">Valor Ref.</th>
              <th className="text-left px-4 py-3">Categorias Sugeridas</th>
              <th className="w-24 text-center px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((it) => (
              <tr key={it.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                  {it.codigo}
                </td>
                <td className="px-4 py-2.5 text-gray-800 font-medium">
                  {it.descricao.toUpperCase()}
                </td>
                <td className="px-4 py-2.5">
                  {it.ambienteClassificacao ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                      {it.ambienteClassificacao.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Não especificado</span>
                  )}
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
                <td className="px-4 py-2.5 text-gray-500 font-medium">
                  {it.unidade.toUpperCase()}
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
                          className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    {it.categoriasSugeridas.length > 3 && (
                      <span className="text-xs text-gray-400 font-mono">
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
                      title="Editar Item"
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
                      title="Excluir Item"
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
        {filtered.length} de {itens.length} itens · Fonte: FNDE/SINAPI · Referência: RO 2024
      </p>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingItem ? "Editar Item" : "Adicionar Novo Item"}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Ex: CADEIRA GIRATÓRIA ESTOFADA"
                  className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-500 outline-none bg-white text-gray-800 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Unidade *
                  </label>
                  <select
                    value={formUnidade}
                    onChange={(e) => setFormUnidade(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-500 outline-none bg-white text-gray-800"
                  >
                    <option value="">Selecione a unidade</option>
                    {UNIDADES_PREDEFINIDAS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    {formUnidade && !UNIDADES_PREDEFINIDAS.includes(formUnidade) && (
                      <option value={formUnidade}>{formUnidade}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ambiente (Classificação)
                  </label>
                  <select
                    value={formAmbiente}
                    onChange={(e) => setFormAmbiente(e.target.value)}
                    className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-500 outline-none bg-white text-gray-800"
                  >
                    <option value="">Selecione o ambiente</option>
                    {AMBIENTES_CLASSIFICACAO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300">
                    {(["mobiliario", "equipamento"] as TipoItemBiblioteca[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormTipo(t)}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          formTipo === t
                            ? "bg-orange-500 text-white font-semibold"
                            : "bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {t === "mobiliario" ? "Mobiliário" : "Equipamento"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Valor de Referência *
                  </label>
                  <ItemCurrencyInput
                    value={formValue}
                    onChange={setFormValue}
                    className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-500 outline-none bg-white text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
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
      setFormUnidade("ANO");
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
        descricao: formDesc.trim().toUpperCase(),
        unidade: formUnidade.trim().toUpperCase(),
        valorAnual: formValue,
      });
    } else {
      onAddItem({
        id: `sv-${Date.now()}`,
        descricao: formDesc.trim().toUpperCase(),
        unidade: formUnidade.trim().toUpperCase(),
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
                <td className="px-4 py-2.5 text-gray-800 font-semibold">{it.descricao.toUpperCase()}</td>
                <td className="px-4 py-2.5 text-gray-500 font-medium">{it.unidade.toUpperCase()}</td>
                <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                  {BRL(it.valorAnual)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openModal(it)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Serviço"
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
                      title="Excluir Serviço"
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
                  placeholder="Ex: Manutenção predial"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800 uppercase"
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
                    placeholder="Ex: ANO, MÊS"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800 uppercase"
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
  const [formUnidade, setFormUnidade] = useState("UN");
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
      setFormUnidade("UN");
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
        descricao: formDesc.trim().toUpperCase(),
        unidade: formUnidade.trim().toUpperCase(),
        valorUnitario: formValue,
      });
    } else {
      onAddItem({
        id: `aq-${Date.now()}`,
        descricao: formDesc.trim().toUpperCase(),
        unidade: formUnidade.trim().toUpperCase(),
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
                <td className="px-4 py-2.5 text-gray-800 font-semibold">{it.descricao.toUpperCase()}</td>
                <td className="px-4 py-2.5 text-gray-500 font-medium">{it.unidade.toUpperCase()}</td>
                <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                  {BRL(it.valorUnitario)}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => openModal(it)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Aquisição"
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
                      title="Excluir Aquisição"
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
                  placeholder="Ex: Merenda escolar — Creche"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800 uppercase"
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
                    placeholder="Ex: UN, KG, RESMA"
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Valor Unitário Ref. *
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
        descricao: formDesc.trim().toUpperCase(),
        remuneracaoBase: formRemuneracao,
        auxilios: formAuxilios,
        patronal: formPatronal,
      });
    } else {
      onAddItem({
        id: `cg-${Date.now()}`,
        descricao: formDesc.trim().toUpperCase(),
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
                  <td className="px-4 py-2.5 text-gray-800 font-semibold">{it.descricao.toUpperCase()}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-600">{BRL(it.remuneracaoBase)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-600">{BRL(it.auxilios)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-600">{BRL(it.patronal)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-800">{BRL(total)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openModal(it)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Cargo"
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
                        title="Excluir Cargo"
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
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-800 uppercase"
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
  | "modelos";

const TABS: {
  id: TabId;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "biblioteca",
    label: "Itens",
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
    desc: "Catálogo de serviços",
    icon: <Wrench size={16} />,
  },
  {
    id: "aquisicoes",
    label: "Aquisições",
    desc: "Catálogo de aquisições",
    icon: <ShoppingCart size={16} />,
  },
  {
    id: "folha",
    label: "Folha de Pagamento",
    desc: "Cargos e salários de referência",
    icon: <UserPlus size={16} />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ConfiguracoesCusto({
  onBack,
}: ConfiguracoesCustoProps) {
  // Inicializa na tela de consulta de Modelos de Creche
  const [activeTab, setActiveTab] = useState<TabId>("modelos");
  const [ambientes, setAmbientes] = useState<ModeloAmbiente[]>(() => {
    try {
      const cached = localStorage.getItem("exp_creches_ambientes");
      if (!cached) return mockModelosAmbiente;
      const parsed: ModeloAmbiente[] = JSON.parse(cached);
      // Remove any legacy items (e.g. b001, b002) from ambientes
      const hasLegacy = parsed.some((a) =>
        a.itens.some((i) => i.bibliotecaId?.startsWith("b0") || i.bibliotecaId?.startsWith("b1"))
      );
      const hasNewItems = parsed.some((a) =>
        a.itens.some((i) => i.bibliotecaId?.startsWith("it-"))
      );
      // If cached has legacy items or lacks the new items in created environments, reset to mockModelosAmbiente!
      if (hasLegacy || !hasNewItems) {
        localStorage.setItem("exp_creches_ambientes", JSON.stringify(mockModelosAmbiente));
        return mockModelosAmbiente;
      }
      return parsed;
    } catch {
      return mockModelosAmbiente;
    }
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
    try {
      const cached = localStorage.getItem("exp_creches_biblioteca");
      if (!cached) return mockBibliotecaItens;
      const parsed: ItemBiblioteca[] = JSON.parse(cached);
      // Purge completely any old legacy items (b001, b002, etc.)
      const clean = parsed.filter(
        (it) =>
          !it.id.startsWith("b0") &&
          !it.id.startsWith("b1") &&
          (it.id.startsWith("it-") || it.id.startsWith("bib-"))
      );
      // Keep all official 33 new items plus any user-created items
      const officialIds = new Set(mockBibliotecaItens.map((m) => m.id));
      const userAdded = clean.filter((it) => !officialIds.has(it.id));
      const result = [...mockBibliotecaItens, ...userAdded];
      localStorage.setItem("exp_creches_biblioteca", JSON.stringify(result));
      return result;
    } catch {
      return mockBibliotecaItens;
    }
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
      localStorage.removeItem("exp_creches_cargos_ref");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4 font-semibold"
            >
              <ChevronLeft size={16} />
              Voltar
            </button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Consultar Modelos de Creches
                </h1>
                <p className="text-slate-500 font-medium">
                  Ambientes, modelos e estimativas de custo para creches FNDE
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={restaurarPadroes}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors mt-9 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> Restaurar padrões
          </button>
        </div>

        <div className="flex gap-5 items-start">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 bg-white rounded-2xl shadow-lg overflow-hidden sticky top-6">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-4 py-4 text-white">
              <p className="text-xs font-semibold tracking-wider opacity-80">
                Configurações
              </p>
              <p className="text-sm font-bold mt-0.5">
                Custo Creche
              </p>
            </div>

            {/* Acesso rápido a Consultar Modelos */}
            <div className="p-2 border-b border-slate-100">
              <button
                onClick={() => setActiveTab("modelos")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all rounded-xl ${
                  activeTab === "modelos"
                    ? "bg-orange-500 text-white font-bold shadow-sm"
                    : "text-slate-700 hover:bg-slate-100 font-semibold"
                }`}
              >
                <Building2 size={17} className={activeTab === "modelos" ? "text-white" : "text-orange-500"} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate leading-tight">
                    Consultar Modelos
                  </p>
                  <p className={`text-[10px] truncate ${activeTab === "modelos" ? "text-white/80" : "text-slate-400"}`}>
                    Visão dos modelos
                  </p>
                </div>
              </button>
            </div>

            {/* Opções de 1 a 5 */}
            <nav className="py-2">
              {TABS.map((tab, idx) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                      active
                        ? "bg-orange-50 border-r-2 border-orange-500 text-orange-700 font-semibold"
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
                        className={`text-sm font-medium truncate ${active ? "text-orange-700 font-bold" : "text-gray-700"}`}
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
                    width: `${activeTab === "modelos" ? 100 : ((currentIdx + 1) / TABS.length) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center font-medium">
                {activeTab === "modelos" ? "Modelos de Creche" : `${currentIdx + 1} / ${TABS.length}`}
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
          </div>
        </div>
      </div>
    </div>
  );
}