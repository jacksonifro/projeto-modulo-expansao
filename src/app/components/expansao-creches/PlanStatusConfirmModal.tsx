import React, { useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  Pause,
  RotateCcw,
  AlertTriangle,
  Trash2,
  X,
  ArrowRight,
  FolderKanban,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { PlanStatus } from './types';

export type PlanActionType =
  | 'iniciar'
  | 'concluir'
  | 'paralisar'
  | 'retomar'
  | 'reabrir'
  | 'alterar'
  | 'excluir'
  | 'alerta';

export interface PlanModalConfig {
  isOpen: boolean;
  planId?: string;
  planName: string;
  actionType: PlanActionType;
  currentStatus?: PlanStatus;
  targetStatus?: PlanStatus;
  customTitle?: string;
  customMessage?: string;
  onConfirm: () => void;
  onClose?: () => void;
}

interface PlanStatusConfirmModalProps {
  config: PlanModalConfig | null;
  onClose: () => void;
}

const statusConfig: Record<
  PlanStatus,
  { label: string; bg: string; text: string; border: string; dot: string; icon: React.ComponentType<{ className?: string }> }
> = {
  Rascunho: {
    label: 'Rascunho',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  Planejamento: {
    label: 'Planejamento',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    icon: FolderKanban,
  },
  'Em execução': {
    label: 'Em execução',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: Play,
  },
  Paralisado: {
    label: 'Paralisado',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    icon: Pause,
  },
  Concluído: {
    label: 'Concluído',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    icon: CheckCircle2,
  },
};

export default function PlanStatusConfirmModal({
  config,
  onClose,
}: PlanStatusConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!config?.isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config?.isOpen, onClose]);

  if (!config || !config.isOpen) return null;

  const {
    planName,
    actionType,
    currentStatus,
    targetStatus,
    customTitle,
    customMessage,
    onConfirm,
  } = config;

  // Detalhes visuais e textuais conforme a ação
  const getActionDetails = () => {
    switch (actionType) {
      case 'iniciar':
        return {
          title: customTitle || 'Iniciar Execução do Plano',
          icon: Play,
          iconBg: 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50',
          gradientBar: 'from-emerald-500 via-teal-500 to-emerald-600',
          confirmText: 'Iniciar Execução',
          confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40',
          description:
            customMessage ||
            'Ao iniciar a execução, as atividades, obras e metas vinculadas passarão a ser acompanhadas ativamente no fluxo operacional do módulo.',
          note: 'O status passará para "Em execução". Você poderá paralisar ou concluir o plano quando necessário.',
          noteType: 'success',
        };

      case 'concluir':
        return {
          title: customTitle || 'Concluir Plano de Expansão',
          icon: CheckCircle2,
          iconBg: 'bg-purple-100 text-purple-600 ring-8 ring-purple-50',
          gradientBar: 'from-purple-500 via-indigo-500 to-purple-600',
          confirmText: 'Concluir Plano',
          confirmBtnClass: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30 hover:shadow-purple-600/40',
          description:
            customMessage ||
            'Você está prestes a marcar este plano como Concluído. Isso consolidará os objetivos atingidos e registrará a data de encerramento oficial.',
          note: 'O plano poderá ser reaberto a qualquer momento se houver necessidade de ajustes ou expansões futuras.',
          noteType: 'purple',
        };

      case 'paralisar':
        return {
          title: customTitle || 'Paralisar Execução Temporariamente',
          icon: Pause,
          iconBg: 'bg-amber-100 text-amber-600 ring-8 ring-amber-50',
          gradientBar: 'from-amber-500 via-orange-500 to-amber-600',
          confirmText: 'Paralisar Plano',
          confirmBtnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 hover:shadow-amber-600/40',
          description:
            customMessage ||
            'Deseja paralisar temporariamente a execução deste plano? As atividades serão marcadas como pausadas.',
          note: 'Nenhum dado é perdido. Você poderá retomar a execução com um clique quando as obras/atividades forem reiniciadas.',
          noteType: 'amber',
        };

      case 'retomar':
        return {
          title: customTitle || 'Retomar Execução do Plano',
          icon: Play,
          iconBg: 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50',
          gradientBar: 'from-emerald-500 via-cyan-500 to-emerald-600',
          confirmText: 'Retomar Execução',
          confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40',
          description:
            customMessage ||
            'O plano sairá do estado "Paralisado" e retornará para "Em execução". O andamento e as ações voltam ao cronograma ativo.',
          note: 'As equipes e escolas vinculadas voltarão ao status operacional normal.',
          noteType: 'success',
        };

      case 'reabrir':
        return {
          title: customTitle || 'Reabrir Execução do Plano',
          icon: RotateCcw,
          iconBg: 'bg-purple-100 text-purple-600 ring-8 ring-purple-50',
          gradientBar: 'from-purple-500 via-blue-500 to-purple-600',
          confirmText: 'Reabrir Execução',
          confirmBtnClass: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30 hover:shadow-purple-600/40',
          description:
            customMessage ||
            `Deseja reabrir a execução do plano "${planName}"? O status será alterado de "Concluído" para "Em execução".`,
          note: 'Isso permite cadastrar novas atividades, atualizar obras e gerenciar etapas novamente.',
          noteType: 'purple',
        };

      case 'excluir':
        return {
          title: customTitle || 'Excluir Plano de Expansão',
          icon: Trash2,
          iconBg: 'bg-rose-100 text-rose-600 ring-8 ring-rose-50',
          gradientBar: 'from-rose-500 via-red-500 to-rose-600',
          confirmText: 'Excluir Plano',
          confirmBtnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 hover:shadow-rose-600/40',
          description:
            customMessage ||
            `Tem certeza que deseja excluir o plano "${planName}"? Esta ação removerá o planejamento de expansão e todos os dados associados a ele.`,
          note: 'Atenção: Esta ação não pode ser desfeita.',
          noteType: 'danger',
        };

      case 'alerta':
        return {
          title: customTitle || 'Aviso do Sistema',
          icon: Info,
          iconBg: 'bg-blue-100 text-blue-600 ring-8 ring-blue-50',
          gradientBar: 'from-blue-500 via-indigo-500 to-blue-600',
          confirmText: 'Entendido',
          confirmBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:shadow-blue-600/40',
          description: customMessage || '',
          note: null,
          noteType: 'blue',
        };

      case 'alterar':
      default: {
        const tgt = targetStatus || 'Planejamento';
        const isCompleted = tgt === 'Concluído';
        const isPaused = tgt === 'Paralisado';
        const isRunning = tgt === 'Em execução';

        let btnClass = 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30';
        let barClass = 'from-blue-500 via-sky-500 to-indigo-600';
        let iconBg = 'bg-blue-100 text-blue-600 ring-8 ring-blue-50';
        let IconComp = FolderKanban;

        if (isCompleted) {
          btnClass = 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30';
          barClass = 'from-purple-500 via-indigo-500 to-purple-600';
          iconBg = 'bg-purple-100 text-purple-600 ring-8 ring-purple-50';
          IconComp = CheckCircle2;
        } else if (isPaused) {
          btnClass = 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30';
          barClass = 'from-amber-500 via-orange-500 to-amber-600';
          iconBg = 'bg-amber-100 text-amber-600 ring-8 ring-amber-50';
          IconComp = Pause;
        } else if (isRunning) {
          btnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30';
          barClass = 'from-emerald-500 via-teal-500 to-emerald-600';
          iconBg = 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50';
          IconComp = Play;
        }

        return {
          title: customTitle || `Alterar Status para "${tgt}"`,
          icon: IconComp,
          iconBg,
          gradientBar: barClass,
          confirmText: `Confirmar Mudança para "${tgt}"`,
          confirmBtnClass: btnClass,
          description:
            customMessage ||
            `Deseja atualizar o status do plano de expansão "${planName}" para "${tgt}"?`,
          note: 'O novo status atualizará as visões de monitoramento, kanban e relatórios.',
          noteType: 'blue',
        };
      }
    }
  };

  const details = getActionDetails();
  const IconComponent = details.icon;

  const renderBadge = (statusName: PlanStatus) => {
    const s = statusConfig[statusName] || statusConfig['Planejamento'];
    const StatusIcon = s.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${s.bg} ${s.text} ${s.border}`}
      >
        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
        <StatusIcon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Top vibrant gradient stripe */}
        <div className={`h-2.5 w-full bg-gradient-to-r ${details.gradientBar}`} />

        {/* Modal Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${details.iconBg} transition-transform`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 leading-tight">
                  {details.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Módulo de Expansão de Vagas em Creches
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-2 space-y-4">
          {/* Plan Name Highlight Card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-slate-200 text-blue-600 shadow-xs shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Plano Selecionado
              </span>
              <p className="text-sm font-bold text-slate-800 truncate" title={planName}>
                {planName}
              </p>
            </div>
          </div>

          {/* Status Transition Visual Indicator (if applicable) */}
          {targetStatus && currentStatus && currentStatus !== targetStatus && (
            <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/70 rounded-xl p-3.5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
                Transição de Status
              </div>
              <div className="flex items-center justify-center gap-3">
                {renderBadge(currentStatus)}
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="w-4 h-0.5 bg-slate-300 rounded" />
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <span className="w-4 h-0.5 bg-slate-300 rounded" />
                </div>
                {renderBadge(targetStatus)}
              </div>
            </div>
          )}

          {/* Explanation description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {details.description}
          </p>

          {/* Contextual Note Box */}
          {details.note && (
            <div
              className={`rounded-xl p-3.5 text-xs flex items-start gap-2.5 border ${
                details.noteType === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : details.noteType === 'amber'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : details.noteType === 'purple'
                  ? 'bg-purple-50 border-purple-200 text-purple-800'
                  : details.noteType === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {details.noteType === 'danger' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-current opacity-80" />
              )}
              <span className="leading-snug">{details.note}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 pt-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3 mt-4">
          {actionType !== 'alerta' && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs"
            >
              Cancelar
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${details.confirmBtnClass}`}
            autoFocus
          >
            <IconComponent className="w-4 h-4" />
            {details.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
