import { useState } from 'react';
import {
  Plus, Trash2, Building2, Package, Wrench, ShoppingCart, UserPlus,
  ChevronDown, ChevronUp, Settings, AlertCircle, CheckCircle2, X
} from 'lucide-react';
import { ModeloCreche, ModeloCrecheAmbiente, ModeloAmbiente, ServicoAnual, AquisicaoAnual, CargoReferencia, ModeloCrechePessoal } from './types';
import { calcularCustoAmbiente, calcularCustoCreche } from './mockDataCusto';

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function CurrencyInput({ value, onChange, className }: {
  value: number; onChange: (v: number) => void; className?: string;
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const [display, setDisplay] = useState(() => value > 0 ? fmt(value) : '');
  return (
    <input
      value={display}
      onChange={e => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        const num = raw === '' ? 0 : Number(raw) / 100;
        setDisplay(raw === '' ? '' : fmt(num));
        onChange(num);
      }}
      onBlur={() => setDisplay(value > 0 ? fmt(value) : '')}
      onFocus={() => { if (value === 0) setDisplay(''); }}
      className={className}
      placeholder="R$ 0,00"
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: lista de ambientes do modelo
// ─────────────────────────────────────────────────────────────────────────────

function AmbientesDoModelo({ modelo, ambientes, onUpdate }: {
  modelo: ModeloCreche;
  ambientes: ModeloAmbiente[];
  onUpdate: (m: ModeloCreche) => void;
}) {
  const [addingId, setAddingId] = useState('');

  const calcCapacidade = (ambs: ModeloCrecheAmbiente[]) => {
    return ambs.reduce((sum, ma) => {
      const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
      if (amb && (amb.categoria === 'sala-atividades' || amb.categoria === 'bercario')) {
        return sum + (amb.capacidadeAlunos || 0) * ma.quantidade;
      }
      return sum;
    }, 0);
  };

  const addAmbiente = () => {
    if (!addingId) return;
    const novo: ModeloCrecheAmbiente = {
      id: `mca-${Date.now()}`,
      modeloAmbienteId: addingId,
      quantidade: 1,
    };
    const newAmbs = [...modelo.ambientes, novo];
    onUpdate({ ...modelo, ambientes: newAmbs, capacidadeAlunos: calcCapacidade(newAmbs) });
    setAddingId('');
  };

  const removeAmbiente = (id: string) => {
    const newAmbs = modelo.ambientes.filter(a => a.id !== id);
    onUpdate({ ...modelo, ambientes: newAmbs, capacidadeAlunos: calcCapacidade(newAmbs) });
  };

  const updateAmbiente = (id: string, field: keyof ModeloCrecheAmbiente, value: any) => {
    const newAmbs = modelo.ambientes.map(a => a.id === id ? { ...a, [field]: value } : a);
    onUpdate({
      ...modelo,
      ambientes: newAmbs,
      capacidadeAlunos: calcCapacidade(newAmbs),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <select value={addingId} onChange={e => setAddingId(e.target.value)}
          className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">— Adicionar ambiente ao modelo —</option>
          {ambientes.map(a => {
            const c = calcularCustoAmbiente(a);
            return (
              <option key={a.id} value={a.id}>
                {a.nome} · {a.areaMq}m² · {BRL(c.total)}/unidade
              </option>
            );
          })}
        </select>
        <button onClick={addAmbiente} disabled={!addingId}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {modelo.ambientes.length === 0 ? (
        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-300 rounded-xl">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum ambiente adicionado</p>
          <p className="text-xs">Selecione um ambiente da biblioteca acima</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Ambiente</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Área unit.</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 w-24">Qtd</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Obra/un.</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Mob.+Eq./un.</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Subtotal</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modelo.ambientes.map(ma => {
                const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
                if (!amb) return null;
                const c = calcularCustoAmbiente(amb);
                const subtotal = c.total * ma.quantidade;
                return (
                  <tr key={ma.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {ma.nomeOverride || amb.nome}
                      </div>
                      <input
                        value={ma.nomeOverride ?? ''}
                        onChange={e => updateAmbiente(ma.id, 'nomeOverride', e.target.value || undefined)}
                        placeholder="Nome personalizado (opcional)"
                        className="mt-0.5 text-xs text-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-400 outline-none w-full"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{amb.areaMq} m²</td>
                    <td className="px-4 py-3 text-center">
                      <input type="number" min={1} value={ma.quantidade}
                        onChange={e => updateAmbiente(ma.id, 'quantidade', Number(e.target.value))}
                        className="w-20 text-center text-sm px-2 py-1 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{BRL(c.obras)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{BRL(c.mobiliario + c.equipamentos)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">{BRL(subtotal)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeAmbiente(ma.id)}
                        className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr>
                <td className="px-4 py-3 font-bold text-slate-700" colSpan={5}>
                  Área total: {modelo.ambientes.reduce((s, ma) => {
                    const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
                    return s + (amb ? amb.areaMq * ma.quantidade : 0);
                  }, 0)} m²
                </td>
                <td className="px-4 py-3 text-right font-black text-green-700">
                  {BRL(modelo.ambientes.reduce((s, ma) => {
                    const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
                    if (!amb) return s;
                    return s + calcularCustoAmbiente(amb).total * ma.quantidade;
                  }, 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function ServicosTab({
  modelo,
  onUpdate,
  servicosRef,
}: {
  modelo: ModeloCreche;
  onUpdate: (m: ModeloCreche) => void;
  servicosRef: ServicoAnual[];
}) {
  const [addingId, setAddingId] = useState("");

  const addServico = () => {
    if (!addingId) return;
    const refSv = servicosRef.find((s) => s.id === addingId);
    if (!refSv) return;

    if (modelo.servicos.some((s) => s.descricao === refSv.descricao)) {
      alert("Este serviço já está vinculado ao modelo.");
      return;
    }

    const novo: ServicoAnual = {
      id: `sv-${Date.now()}`,
      descricao: refSv.descricao,
      unidade: refSv.unidade,
      valorAnual: refSv.valorAnual,
    };
    onUpdate({ ...modelo, servicos: [...modelo.servicos, novo] });
    setAddingId("");
  };

  const update = (id: string, field: keyof ServicoAnual, value: any) =>
    onUpdate({
      ...modelo,
      servicos: modelo.servicos.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    });

  const remove = (id: string) =>
    onUpdate({ ...modelo, servicos: modelo.servicos.filter((s) => s.id !== id) });

  const total = modelo.servicos.reduce((s, sv) => s + sv.valorAnual, 0);

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2 mb-3 bg-slate-50 p-4 border rounded-xl">
        <select
          value={addingId}
          onChange={(e) => setAddingId(e.target.value)}
          className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
        >
          <option value="">— Selecione um serviço do catálogo —</option>
          {servicosRef.map((s) => (
            <option key={s.id} value={s.id}>
              {s.descricao} ({s.unidade}) · {BRL(s.valorAnual)}/ano
            </option>
          ))}
        </select>
        <button
          onClick={addServico}
          disabled={!addingId}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Vincular Serviço
        </button>
      </div>

      {modelo.servicos.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <Wrench className="w-5 h-5 text-blue-500" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">Nenhum serviço operacional vinculado</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Vincule serviços do catálogo de referência para compor os custos operacionais anuais deste modelo.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Descrição</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 w-32">Unidade</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 w-44">Valor Anual</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modelo.servicos.map((sv) => (
                <tr key={sv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {sv.descricao}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      value={sv.unidade}
                      onChange={(e) => update(sv.id, "unidade", e.target.value)}
                      className="w-28 text-center text-sm px-2 py-1 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-800 font-medium"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CurrencyInput
                      value={sv.valorAnual}
                      onChange={(v) => update(sv.id, "valorAnual", v)}
                      className="w-40 text-right text-sm px-2 py-1 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-800 font-bold"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => remove(sv.id)}
                      className="p-1 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
              <tr>
                <td className="px-4 py-3 font-bold text-slate-700" colSpan={2}>
                  Total serviços / ano
                </td>
                <td className="px-4 py-3 text-right font-black text-blue-700 text-base">
                  {BRL(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

function AquisicoesTab({
  modelo,
  onUpdate,
  aquisicoesRef,
}: {
  modelo: ModeloCreche;
  onUpdate: (m: ModeloCreche) => void;
  aquisicoesRef: AquisicaoAnual[];
}) {
  const [addingId, setAddingId] = useState("");

  const addAquisicao = () => {
    if (!addingId) return;
    const refAq = aquisicoesRef.find((a) => a.id === addingId);
    if (!refAq) return;

    if (modelo.aquisicoes.some((a) => a.descricao === refAq.descricao)) {
      alert("Este item de aquisição já está vinculado ao modelo.");
      return;
    }

    const novo: AquisicaoAnual = {
      id: `aq-${Date.now()}`,
      descricao: refAq.descricao,
      unidade: refAq.unidade,
      quantidadeAnual: 1,
      valorUnitario: refAq.valorUnitario,
    };
    onUpdate({ ...modelo, aquisicoes: [...modelo.aquisicoes, novo] });
    setAddingId("");
  };

  const update = (id: string, field: keyof AquisicaoAnual, value: any) =>
    onUpdate({
      ...modelo,
      aquisicoes: modelo.aquisicoes.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    });

  const remove = (id: string) =>
    onUpdate({ ...modelo, aquisicoes: modelo.aquisicoes.filter((a) => a.id !== id) });

  const total = modelo.aquisicoes.reduce((s, a) => s + a.quantidadeAnual * a.valorUnitario, 0);

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2 mb-3 bg-slate-50 p-4 border rounded-xl">
        <select
          value={addingId}
          onChange={(e) => setAddingId(e.target.value)}
          className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 outline-none text-gray-800"
        >
          <option value="">— Selecione uma aquisição do catálogo —</option>
          {aquisicoesRef.map((a) => (
            <option key={a.id} value={a.id}>
              {a.descricao} ({a.unidade}) · {BRL(a.valorUnitario)}/un
            </option>
          ))}
        </select>
        <button
          onClick={addAquisicao}
          disabled={!addingId}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Vincular Aquisição
        </button>
      </div>

      {modelo.aquisicoes.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3 border border-orange-100">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">Nenhuma aquisição vinculada</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Vincule materiais e suprimentos do catálogo de referência para compor as aquisições anuais deste modelo.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Descrição</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 w-32">Unidade</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 w-28">Quantidade</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 w-36">Valor Unit.</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 w-36">Total/ano</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modelo.aquisicoes.map((aq) => (
                <tr key={aq.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {aq.descricao}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      value={aq.unidade}
                      onChange={(e) => update(aq.id, "unidade", e.target.value)}
                      className="w-28 text-center text-sm px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white text-gray-800 font-medium"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={1}
                      value={aq.quantidadeAnual}
                      onChange={(e) => update(aq.id, "quantidadeAnual", Number(e.target.value))}
                      className="w-24 text-center text-sm px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white text-gray-800 font-bold"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CurrencyInput
                      value={aq.valorUnitario}
                      onChange={(v) => update(aq.id, "valorUnitario", v)}
                      className="w-32 text-right text-sm px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white text-gray-800 font-bold"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-orange-700">
                    {BRL(aq.quantidadeAnual * aq.valorUnitario)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => remove(aq.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr>
                <td className="px-4 py-3 font-bold" colSpan={4}>Total aquisições / ano</td>
                <td className="px-4 py-3 text-right font-black text-orange-700">{BRL(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Folha de Pagamento (Equipe do modelo)
// ─────────────────────────────────────────────────────────────────────────────

function FolhaPagamentoTab({
  modelo,
  onUpdate,
  cargosRef,
}: {
  modelo: ModeloCreche;
  onUpdate: (m: ModeloCreche) => void;
  cargosRef: CargoReferencia[];
}) {
  try {
    const [addingId, setAddingId] = useState("");

    const addCargo = () => {
      if (!addingId) return;
      const refCg = cargosRef.find((c) => c.id === addingId);
      if (!refCg) return;

      if (modelo.pessoal?.some((p) => p.cargoId === addingId)) {
        alert("Este cargo já está vinculado à equipe.");
        return;
      }

      const novo: ModeloCrechePessoal = {
        id: `mp-${Date.now()}`,
        cargoId: addingId,
        quantidade: 1,
      };
      onUpdate({ ...modelo, pessoal: [...(modelo.pessoal || []), novo] });
      setAddingId("");
    };

    const updateQt = (id: string, quantidade: number) =>
      onUpdate({
        ...modelo,
        pessoal: modelo.pessoal.map((p) => (p.id === id ? { ...p, quantidade } : p)),
      });

    const remove = (id: string) =>
      onUpdate({ ...modelo, pessoal: (Array.isArray(modelo.pessoal) ? modelo.pessoal : []).filter((p) => p.id !== id) });

  const safePessoal = Array.isArray(modelo?.pessoal) ? modelo.pessoal.filter(p => p && p.cargoId) : [];
  const safeCargosRef = Array.isArray(cargosRef) ? cargosRef.filter(c => c && c.id) : [];

  const totalMensal = safePessoal.reduce((s, p) => {
    const cg = safeCargosRef.find((c) => c.id === p.cargoId);
    if (!cg) return s;
    const custoCargo = (cg.remuneracaoBase || 0) + (cg.auxilios || 0) + (cg.patronal || 0);
    return s + custoCargo * (p.quantidade || 0);
  }, 0);

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2 mb-3 bg-slate-50 p-4 border rounded-xl">
        <select
          value={addingId}
          onChange={(e) => setAddingId(e.target.value)}
          className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
        >
          <option value="">— Selecione um cargo do catálogo —</option>
          {safeCargosRef.map((c) => (
            <option key={c.id} value={c.id}>
              {c.descricao || 'Sem descrição'} · {BRL((c.remuneracaoBase || 0) + (c.auxilios || 0) + (c.patronal || 0))}/mês total
            </option>
          ))}
        </select>
        <button
          onClick={addCargo}
          disabled={!addingId}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Adicionar à Equipe
        </button>
      </div>

      {safePessoal.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <UserPlus className="w-5 h-5 text-blue-500" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">Nenhum cargo na equipe</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Vincule os cargos necessários para a operação padrão desta creche.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Cargo/Função</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Custo Unit. (Mês)</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 w-28">Quantidade</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 w-36">Total (Mês)</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {safePessoal.map((p) => {
                const cg = safeCargosRef.find((c) => c.id === p.cargoId);
                if (!cg) return null;
                const unitMensal = (cg.remuneracaoBase || 0) + (cg.auxilios || 0) + (cg.patronal || 0);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {cg.descricao || 'Sem descrição'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {BRL(unitMensal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min={1}
                        value={p.quantidade || 1}
                        onChange={(e) => updateQt(p.id, Number(e.target.value))}
                        className="w-20 text-center text-sm px-2 py-1 border border-slate-200 rounded-lg outline-none bg-white text-gray-800 font-bold"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">
                      {BRL(unitMensal * (p.quantidade || 1))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => remove(p.id)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-slate-300">
              <tr>
                <td className="px-4 py-3 font-bold" colSpan={3}>Custo mensal da equipe</td>
                <td className="px-4 py-3 text-right font-black text-blue-700">{BRL(totalMensal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
  } catch (err) {
    console.error("Erro no FolhaPagamentoTab:", err);
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">Erro ao carregar Folha de Pagamento: {String(err)}</div>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Card principal de um modelo de creche
// ─────────────────────────────────────────────────────────────────────────────

type ModeloTab = 'ambientes' | 'servicos' | 'aquisicoes' | 'folha' | 'resumo';

function ModeloCard({
  modelo,
  ambientes,
  onUpdate,
  onDelete,
  servicosRef,
  aquisicoesRef,
  cargosRef,
}: {
  modelo: ModeloCreche;
  ambientes: ModeloAmbiente[];
  onUpdate: (m: ModeloCreche) => void;
  onDelete: () => void;
  servicosRef: ServicoAnual[];
  aquisicoesRef: AquisicaoAnual[];
  cargosRef: CargoReferencia[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ModeloTab>('ambientes');

  const custo = calcularCustoCreche(modelo, ambientes);

  const tabBtns: { id: ModeloTab; label: string; icon: React.ReactNode }[] = [
    { id: 'ambientes', label: 'Ambientes', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'servicos', label: 'Serviços', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'aquisicoes', label: 'Aquisições', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
    { id: 'folha', label: 'Folha Pagamento', icon: <UserPlus className="w-3.5 h-3.5" /> },
    { id: 'resumo', label: 'Resumo', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  ];

  const tipoColors: Record<string, string> = {
    tipo1: 'bg-blue-100 text-blue-700 border-blue-200',
    tipo2: 'bg-green-100 text-green-700 border-green-200',
    proprio: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  const tipoLabels: Record<string, string> = {
    tipo1: 'FNDE Tipo 1', tipo2: 'FNDE Tipo 2', proprio: 'Projeto Próprio',
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
        <button onClick={() => setExpanded(!expanded)}
          className={`p-2 rounded-xl transition-colors shrink-0 ${expanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <input value={modelo.nome}
              onChange={e => onUpdate({ ...modelo, nome: e.target.value })}
              className="font-bold text-slate-800 text-lg bg-transparent border-b border-transparent hover:border-slate-400 focus:border-blue-500 outline-none"
            />
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${tipoColors[modelo.tipoBase]}`}>
              {tipoLabels[modelo.tipoBase]}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{modelo.descricao || 'Sem descrição'}</p>
        </div>

        {/* Cost summary */}
        <div className="hidden lg:grid grid-cols-4 gap-4 shrink-0">
          <div className="text-center">
            <div className="text-xs text-slate-400">Investimento</div>
            <div className="font-bold text-slate-800">{BRL(custo.investimento)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Custeio/ano</div>
            <div className="font-bold text-amber-700">{BRL(custo.custeioAnual)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Ambientes</div>
            <div className="font-bold text-blue-700">{modelo.ambientes.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Capacidade</div>
            <div className="font-bold text-green-700">{modelo.capacidadeAlunos} vagas</div>
          </div>
        </div>

        <button onClick={onDelete}
          className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="border-t border-slate-200">
          {/* Configurações gerais do modelo */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Descrição do Modelo</label>
              <input value={modelo.descricao}
                onChange={e => onUpdate({ ...modelo, descricao: e.target.value })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Descreva o modelo de creche..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo Base</label>
              <select value={modelo.tipoBase}
                onChange={e => onUpdate({ ...modelo, tipoBase: e.target.value as ModeloCreche['tipoBase'] })}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="tipo1">FNDE Tipo 1 (Proinfância B)</option>
                <option value="tipo2">FNDE Tipo 2 (Proinfância C)</option>
                <option value="proprio">Projeto Próprio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reserva / Contingência (%)</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={30} value={modelo.reservaPct}
                  onChange={e => onUpdate({ ...modelo, reservaPct: Number(e.target.value) })}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                <span className="text-slate-500 text-sm font-semibold shrink-0">%</span>
              </div>
            </div>
          </div>

          {/* Tabs Segmented Control */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1.5 mx-6 mt-4 border border-slate-200/50">
            {tabBtns.map(t => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200/40 font-bold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'ambientes' && (
              <AmbientesDoModelo modelo={modelo} ambientes={ambientes} onUpdate={onUpdate} />
            )}
            {activeTab === 'servicos' && (
              <ServicosTab modelo={modelo} onUpdate={onUpdate} servicosRef={servicosRef} />
            )}
            {activeTab === 'aquisicoes' && (
              <AquisicoesTab modelo={modelo} onUpdate={onUpdate} aquisicoesRef={aquisicoesRef} />
            )}
            {activeTab === 'folha' && (
              <FolhaPagamentoTab modelo={modelo} onUpdate={onUpdate} cargosRef={cargosRef} />
            )}
            {activeTab === 'resumo' && (
              <ResumoModelo modelo={modelo} ambientes={ambientes} custo={custo} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resumo financeiro do modelo
// ─────────────────────────────────────────────────────────────────────────────

function ResumoModelo({ modelo, ambientes, custo }: {
  modelo: ModeloCreche;
  ambientes: ModeloAmbiente[];
  custo: ReturnType<typeof calcularCustoCreche>;
}) {
  const totalArea = modelo.ambientes.reduce((s, ma) => {
    const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
    return s + (amb ? amb.areaMq * ma.quantidade : 0);
  }, 0);

  const custeioServicos = modelo.servicos.reduce((s, sv) => s + sv.valorAnual, 0);
  const custeioAquisicoes = modelo.aquisicoes.reduce((s, aq) => s + aq.quantidadeAnual * aq.valorUnitario, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Obra Civil', value: custo.obras, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Mobiliário', value: custo.mobiliario, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Equipamentos', value: custo.equipamentos, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
          { label: `Reserva (${modelo.reservaPct}%)`, value: custo.reserva, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-4 text-center ${item.bg}`}>
            <div className={`font-bold text-lg ${item.color}`}>{BRL(item.value)}</div>
            <div className="text-xs text-slate-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-blue-200 text-sm font-semibold">INVESTIMENTO TOTAL</div>
            <div className="text-4xl font-black">{BRL(custo.investimento)}</div>
            <div className="text-blue-200 text-xs mt-1">Área total: {totalArea} m²  ·  Custo/m²: {BRL(custo.investimento / Math.max(1, totalArea))}</div>
          </div>
          <div className="text-right">
            <div className="text-blue-200 text-sm">Custeio anual</div>
            <div className="text-2xl font-bold">{BRL(custo.custeioAnual)}</div>
            <div className="text-blue-200 text-xs">serv. + aquisições</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-blue-500 pt-4">
          <div className="text-center">
            <div className="text-blue-200 text-xs">Serviços/ano</div>
            <div className="font-bold">{BRL(custeioServicos)}</div>
          </div>
          <div className="text-center">
            <div className="text-blue-200 text-xs">Aquisições/ano</div>
            <div className="font-bold">{BRL(custeioAquisicoes)}</div>
          </div>
          <div className="text-center">
            <div className="text-blue-200 text-xs">Ambientes</div>
            <div className="font-bold">{modelo.ambientes.reduce((s, ma) => s + ma.quantidade, 0)} espaços</div>
          </div>
        </div>
      </div>

      {/* Breakdown por ambiente */}
      <div>
        <h4 className="font-bold text-slate-700 mb-3">Custo por ambiente</h4>
        <div className="space-y-2">
          {modelo.ambientes.map(ma => {
            const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
            if (!amb) return null;
            const c = calcularCustoAmbiente(amb);
            const sub = c.total * ma.quantidade;
            const pct = custo.investimento > 0 ? (sub / (custo.obras + custo.mobiliario + custo.equipamentos)) * 100 : 0;
            return (
              <div key={ma.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700 truncate">{ma.nomeOverride || amb.nome} ×{ma.quantidade}</span>
                    <span className="font-bold text-slate-800 shrink-0 ml-2">{BRL(sub)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
                <span className="text-xs text-slate-400 w-10 text-right shrink-0">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal exportado
// ─────────────────────────────────────────────────────────────────────────────

interface ModeloCrecheBuilderProps {
  modelos: ModeloCreche[];
  ambientes: ModeloAmbiente[];
  onChange: (modelos: ModeloCreche[]) => void;
  servicosRef: ServicoAnual[];
  aquisicoesRef: AquisicaoAnual[];
  cargosRef: CargoReferencia[];
}

export default function ModeloCrecheBuilder({
  modelos,
  ambientes,
  onChange,
  servicosRef,
  aquisicoesRef,
  cargosRef,
}: ModeloCrecheBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formTipoBase, setFormTipoBase] = useState<'tipo1' | 'tipo2' | 'proprio'>('proprio');
  const [formReservaPct, setFormReservaPct] = useState<number>(10);

  const openAddModal = () => {
    setFormNome('');
    setFormDescricao('');
    setFormTipoBase('proprio');
    setFormReservaPct(10);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!formNome.trim()) {
      alert('Por favor, preencha o nome do modelo.');
      return;
    }
    const novo: ModeloCreche = {
      id: `mc-${Date.now()}`,
      nome: formNome.trim(),
      tipoBase: formTipoBase,
      descricao: formDescricao.trim(),
      reservaPct: formReservaPct,
      capacidadeAlunos: 0,
      ambientes: [],
      servicos: [],
      aquisicoes: [],
      pessoal: [],
    };
    onChange([...modelos, novo]);
    setIsOpen(false);
  };

  if (ambientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <AlertCircle className="w-12 h-12 mb-4 opacity-30" />
        <p className="font-semibold text-slate-600">Cadastre ambientes primeiro</p>
        <p className="text-sm mt-1">Vá à aba <strong>Ambientes</strong> e configure os espaços antes de montar um modelo de creche.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{modelos.length}</div>
          <div className="text-sm text-slate-500">Modelos de Creche</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">
            {modelos.filter(m => m.tipoBase === 'tipo1').length}
          </div>
          <div className="text-sm text-slate-500">Modelos Tipo 1</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {modelos.filter(m => m.tipoBase === 'tipo2').length}
          </div>
          <div className="text-sm text-slate-500">Modelos Tipo 2</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-end">
        <button onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm text-sm">
          <Plus className="w-4 h-4" /> Novo Modelo de Creche
        </button>
      </div>

      {/* Lista de modelos */}
      {modelos.length === 0 ? (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-300 rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum modelo configurado</p>
          <p className="text-sm">Clique em "Novo Modelo de Creche" para começar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modelos.map(modelo => (
            <ModeloCard
              key={modelo.id}
              modelo={modelo}
              ambientes={ambientes}
              onUpdate={updated => onChange(modelos.map(m => m.id === modelo.id ? updated : m))}
              onDelete={() => onChange(modelos.filter(m => m.id !== modelo.id))}
              servicosRef={servicosRef}
              aquisicoesRef={aquisicoesRef}
              cargosRef={cargosRef}
            />
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 text-left">
              <h3 className="font-bold text-gray-800 text-lg">
                Criar Novo Modelo de Creche
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
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Creche Modular Padrão Cacoal"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Modelo otimizado para pequenos lotes urbanos"
                  className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipo Base *
                  </label>
                  <select
                    value={formTipoBase}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setFormTipoBase(val);
                    }}
                    className="w-full text-sm px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                  >
                    <option value="tipo1">FNDE Tipo 1 (Proinfância B)</option>
                    <option value="tipo2">FNDE Tipo 2 (Proinfância C)</option>
                    <option value="proprio">Projeto Próprio</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Reserva de Contingência (%) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formReservaPct}
                    onChange={(e) => setFormReservaPct(Number(e.target.value))}
                    className="w-full text-sm px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
                  />
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
