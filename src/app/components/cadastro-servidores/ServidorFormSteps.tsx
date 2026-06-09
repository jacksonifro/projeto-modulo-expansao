interface StepIndicatorProps {
  steps: Array<{ number: string; label: string; active: boolean }>;
}

export function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold ${
                step.active
                  ? 'bg-[#379dff] text-white'
                  : 'bg-[#f0eeff] text-[#878789]'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: '16px' }}
            >
              {step.number}
            </div>
            <span
              className={`text-base ${
                step.active ? 'font-normal text-black' : 'text-[#767575]'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {step.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FormInput({ label, value, onChange, placeholder, disabled }: FormInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-base text-[#303030]"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full border-0 border-b border-[#767575] bg-transparent pb-2 text-sm text-[#959595] outline-none transition-colors focus:border-[#379dff]"
          style={{ fontFamily: 'Poppins, sans-serif', borderBottomWidth: '0.5px' }}
        />
      </div>
    </div>
  );
}

interface FormSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
}

export function FormSelect({ label, value, options, onChange }: FormSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-base text-[#303030]"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full appearance-none border-0 border-b border-[#767575] bg-transparent pb-2 pr-6 text-sm text-[#959595] outline-none transition-colors focus:border-[#379dff]"
          style={{ fontFamily: 'Poppins, sans-serif', borderBottomWidth: '0.5px' }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute bottom-2 right-0">
          <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
            <path
              d="M1 1L8 7L15 1"
              stroke="#767575"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface NavigationButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  showPrevious?: boolean;
  showNext?: boolean;
}

export function NavigationButtons({
  onPrevious,
  onNext,
  showPrevious = true,
  showNext = true,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center justify-between">
      {showPrevious ? (
        <button
          onClick={onPrevious}
          className="flex items-center gap-2 text-lg text-[#767575] transition-colors hover:text-[#379dff]"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#379dff]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="rotate-180"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          Anterior
        </button>
      ) : (
        <div />
      )}

      {showNext && (
        <button
          onClick={onNext}
          className="flex items-center gap-2 text-lg text-[#767575] transition-colors hover:text-[#379dff]"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Próximo
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#379dff]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18L15 12L9 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}
