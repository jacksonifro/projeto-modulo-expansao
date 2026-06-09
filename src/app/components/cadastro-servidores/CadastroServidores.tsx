import { useState } from 'react';
import { Camera, Plus } from 'lucide-react';
import { StepIndicator, FormInput, FormSelect, NavigationButtons } from './ServidorFormSteps';

type StepType = 'identificacao' | 'contatos' | 'vinculo';

interface FormData {
  nomeCompleto: string;
  cpf: string;
  rg: string;
  orgaoExpeditor: string;
  dataNascimento: string;
  sexo: string;
  raca: string;
  nivelEscolaridade: string;
  paisOrigem: string;
  uf: string;
  municipio: string;
  telefones: Array<{ tipo: string; numero: string }>;
  emails: string[];
}

export default function CadastroServidores() {
  const [currentStep, setCurrentStep] = useState<StepType>('identificacao');
  const [formData, setFormData] = useState<FormData>({
    nomeCompleto: 'João Silva da Costa Fernandes',
    cpf: '241.677.144-00',
    rg: '12548479',
    orgaoExpeditor: 'SSP/RO',
    dataNascimento: '20/04/1983',
    sexo: 'Masculino',
    raca: 'Parda',
    nivelEscolaridade: 'Ensino superior completo',
    paisOrigem: 'Brasil',
    uf: 'RO',
    municipio: 'Ariquemes',
    telefones: [{ tipo: 'Telefone celular', numero: '(69) 9 9134-7814' }],
    emails: ['pessoa@gmail.com'],
  });

  const steps = [
    { number: '1', label: 'Identificação', active: currentStep === 'identificacao' },
    { number: '2', label: 'Contatos', active: currentStep === 'contatos' },
    { number: '3', label: 'Vínculo a usuário', active: currentStep === 'vinculo' },
  ];

  const handleNext = () => {
    if (currentStep === 'identificacao') setCurrentStep('contatos');
    else if (currentStep === 'contatos') setCurrentStep('vinculo');
  };

  const handlePrevious = () => {
    if (currentStep === 'contatos') setCurrentStep('identificacao');
    else if (currentStep === 'vinculo') setCurrentStep('contatos');
  };

  const addTelefone = () => {
    setFormData({
      ...formData,
      telefones: [...formData.telefones, { tipo: 'Telefone celular', numero: '' }],
    });
  };

  const addEmail = () => {
    setFormData({
      ...formData,
      emails: [...formData.emails, ''],
    });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-12 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1
              className="text-[26px] font-medium text-[#464646]"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Cadastro de Servidores
            </h1>
            <p
              className="mt-1 text-lg text-[#878789]"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Cadastre um novo servidor e mantenha seus dados atualizados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200" />
            <div>
              <p
                className="text-base font-normal text-[#464646]"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Fernanda
              </p>
              <p
                className="text-xs text-[#464646]"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Secretaria de Ji-Paraná
              </p>
            </div>
          </div>
        </div>

        <StepIndicator steps={steps} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-12 py-8">
        {currentStep === 'identificacao' && (
          <div className="max-w-5xl space-y-8">
            {/* Foto */}
            <div>
              <p
                className="mb-2 text-base text-[#303030]"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Adicionar foto
              </p>
              <div className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#379dff] bg-[#f8fbff] transition-colors hover:bg-[#f0f7ff]">
                <Plus className="h-8 w-8 text-[#379dff]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-8">
              <div className="col-span-2">
                <FormInput
                  label="Nome completo *"
                  value={formData.nomeCompleto}
                  onChange={(value) =>
                    setFormData({ ...formData, nomeCompleto: value })
                  }
                />
              </div>

              <FormInput
                label="CPF *"
                value={formData.cpf}
                onChange={(value) => setFormData({ ...formData, cpf: value })}
              />

              <FormInput
                label="RG *"
                value={formData.rg}
                onChange={(value) => setFormData({ ...formData, rg: value })}
              />

              <FormInput
                label="Órgão expeditor *"
                value={formData.orgaoExpeditor}
                onChange={(value) =>
                  setFormData({ ...formData, orgaoExpeditor: value })
                }
              />

              <FormInput
                label="Data de nascimento *"
                value={formData.dataNascimento}
                onChange={(value) =>
                  setFormData({ ...formData, dataNascimento: value })
                }
              />

              <FormSelect
                label="Sexo *"
                value={formData.sexo}
                options={['Masculino', 'Feminino', 'Outro']}
                onChange={(value) => setFormData({ ...formData, sexo: value })}
              />

              <FormSelect
                label="Raça *"
                value={formData.raca}
                options={['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena']}
                onChange={(value) => setFormData({ ...formData, raca: value })}
              />

              <div className="col-span-2">
                <FormSelect
                  label="Nível de escolaridade *"
                  value={formData.nivelEscolaridade}
                  options={[
                    'Ensino fundamental incompleto',
                    'Ensino fundamental completo',
                    'Ensino médio incompleto',
                    'Ensino médio completo',
                    'Ensino superior incompleto',
                    'Ensino superior completo',
                    'Pós-graduação',
                  ]}
                  onChange={(value) =>
                    setFormData({ ...formData, nivelEscolaridade: value })
                  }
                />
              </div>

              <FormSelect
                label="País de origem *"
                value={formData.paisOrigem}
                options={['Brasil']}
                onChange={(value) =>
                  setFormData({ ...formData, paisOrigem: value })
                }
              />

              <FormSelect
                label="UF *"
                value={formData.uf}
                options={['RO', 'AC', 'AM', 'RR', 'PA', 'AP', 'TO']}
                onChange={(value) => setFormData({ ...formData, uf: value })}
              />

              <FormSelect
                label="Município *"
                value={formData.municipio}
                options={['Cacoal', 'Ariquemes', 'Ji-Paraná', 'Porto Velho']}
                onChange={(value) =>
                  setFormData({ ...formData, municipio: value })
                }
              />
            </div>
          </div>
        )}

        {currentStep === 'contatos' && (
          <div className="max-w-4xl space-y-10">
            {/* Telefones */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h3
                  className="text-lg font-medium text-[#303030]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Telefones
                </h3>
                <button
                  onClick={addTelefone}
                  className="rounded bg-[#e2e8f0] px-4 py-2 text-xs text-[#585853] transition-colors hover:bg-[#cbd5e1]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Novo telefone
                </button>
              </div>

              {formData.telefones.map((telefone, index) => (
                <div key={index} className="mb-8 grid grid-cols-3 gap-8">
                  <FormSelect
                    label="Tipo *"
                    value={telefone.tipo}
                    options={['Telefone celular', 'Telefone fixo', 'Comercial']}
                  />

                  <div className="col-span-2">
                    <FormInput
                      label="Número de telefone *"
                      value={telefone.numero}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* E-mails */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h3
                  className="text-lg font-medium text-[#303030]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  E-mails
                </h3>
                <button
                  onClick={addEmail}
                  className="rounded bg-[#e2e8f0] px-4 py-2 text-xs text-[#585853] transition-colors hover:bg-[#cbd5e1]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Novo e-mail
                </button>
              </div>

              {formData.emails.map((email, index) => (
                <div key={index} className="mb-8 max-w-2xl">
                  <FormInput label="E-mail *" value={email} />
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'vinculo' && (
          <div className="flex h-96 items-center justify-center">
            <p
              className="text-lg text-[#878789]"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Funcionalidade de vínculo a usuário será implementada...
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 px-12 py-6">
        <NavigationButtons
          onPrevious={handlePrevious}
          onNext={handleNext}
          showPrevious={currentStep !== 'identificacao'}
          showNext={currentStep !== 'vinculo'}
        />
      </div>
    </div>
  );
}
