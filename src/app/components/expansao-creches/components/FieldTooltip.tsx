import { useState, useEffect } from 'react';
import { HelpCircle, AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui/tooltip';

interface FieldTooltipProps {
  text: string;
  title?: string;
  formula?: string;
  className?: string;
}

export function FieldTooltip({ text, title, formula, className = '' }: FieldTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          onClick={e => e.stopPropagation()}
          className={`inline-flex items-center justify-center align-middle text-slate-400 hover:text-blue-600 focus:text-blue-600 transition-colors cursor-help outline-none ${className}`}
          aria-label={title || text}
        >
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        sideOffset={6}
        className="max-w-[310px] bg-slate-900 text-white border border-slate-700 shadow-2xl rounded-xl px-3.5 py-2.5 text-left leading-relaxed z-50"
      >
        {title && (
          <div className="font-bold text-xs text-blue-300 mb-1 leading-snug">
            {title}
          </div>
        )}
        <div className="text-[11px] text-slate-100 font-normal leading-relaxed">
          {text}
        </div>
        {formula && (
          <div className="mt-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-300">
            {formula}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface CusteioCurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CusteioCurrencyInput({
  value,
  onChange,
  className = '',
  placeholder = 'R$ 0,00',
  disabled = false,
}: CusteioCurrencyInputProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const [display, setDisplay] = useState<string>(() => (value > 0 ? fmt(value) : ''));

  useEffect(() => {
    setDisplay(value > 0 ? fmt(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const num = raw === '' ? 0 : Number(raw) / 100;
    setDisplay(raw === '' ? '' : fmt(num));
    onChange(num);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      value={display}
      onChange={handleChange}
      onBlur={() => setDisplay(value > 0 ? fmt(value) : '')}
      onFocus={() => {
        if (value === 0) setDisplay('');
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}

export interface CusteioConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  detailBox?: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export function CusteioConfirmModal({
  isOpen,
  title,
  description,
  detailBox,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'warning',
  onConfirm,
  onCancel,
}: CusteioConfirmModalProps) {
  if (!isOpen) return null;

  const headerStyles =
    variant === 'danger'
      ? 'bg-gradient-to-r from-red-600 to-rose-700'
      : variant === 'warning'
      ? 'bg-gradient-to-r from-amber-500 to-orange-600'
      : 'bg-gradient-to-r from-[#1a3a5c] to-[#2563eb]';

  const confirmBtnStyles =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : variant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className={`${headerStyles} px-6 py-4 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            {variant === 'danger' ? (
              <Trash2 className="w-5 h-5" />
            ) : variant === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
          {detailBox && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
              {detailBox}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${confirmBtnStyles}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

