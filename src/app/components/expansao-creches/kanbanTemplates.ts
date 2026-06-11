import { Priority, ActivityStatus } from './types';

export interface TaskTemplate {
  nome: string;
  categoria: string;
  responsavel?: string;
  descricao: string;
}

export interface KanbanTemplate {
  id: string;
  nome: string;
  descricao: string;
  tarefas: TaskTemplate[];
}

const TAREFAS_PADRAO: TaskTemplate[] = [
  // ─── Planejamento e Captação ───
  { nome: '1. Seleção e avaliação de viabilidade do terreno', categoria: 'Planejamento e Captação', descricao: 'Seleção e avaliação de viabilidade do terreno' },
  { nome: '2. Constituição da equipe técnica do projeto', categoria: 'Planejamento e Captação', descricao: 'Constituição da equipe técnica do projeto' },
  { nome: '3. Levantamento topográfico e planialtimétrico', categoria: 'Planejamento e Captação', descricao: 'Levantamento topográfico e planialtimétrico' },
  { nome: '4. Elaboração da documentação técnica e administrativa', categoria: 'Planejamento e Captação', descricao: 'Elaboração da documentação técnica e administrativa' },
  { nome: '5. Cadastro da proposta para captação de recursos', categoria: 'Planejamento e Captação', descricao: 'Cadastro da proposta para captação de recursos' },
  { nome: '6. Formalização do convênio ou termo de compromisso', categoria: 'Planejamento e Captação', descricao: 'Formalização do convênio ou termo de compromisso' },
  { nome: '7. Liberação dos recursos financeiros', categoria: 'Planejamento e Captação', descricao: 'Liberação dos recursos financeiros' },

  // ─── Licitação e Contratação ───
  { nome: '8. Elaboração do ETP, Projeto Básico e Termo de Referência', categoria: 'Licitação e Contratação', descricao: 'Elaboração do ETP, Projeto Básico e Termo de Referência' },
  { nome: '9. Elaboração do orçamento e cronograma físico-financeiro', categoria: 'Licitação e Contratação', descricao: 'Elaboração do orçamento e cronograma físico-financeiro' },
  { nome: '10. Publicação do edital de licitação', categoria: 'Licitação e Contratação', descricao: 'Publicação do edital de licitação' },
  { nome: '11. Homologação da licitação e assinatura do contrato', categoria: 'Licitação e Contratação', descricao: 'Homologação da licitação e assinatura do contrato' },

  // ─── Execução da Obra ───
  { nome: '12. Mobilização e instalação do canteiro de obras', categoria: 'Execução da Obra', descricao: 'Mobilização e instalação do canteiro de obras' },
  { nome: '13. Terraplanagem e execução das fundações', categoria: 'Execução da Obra', descricao: 'Terraplanagem e execução das fundações' },
  { nome: '14. Execução da estrutura e alvenaria', categoria: 'Execução da Obra', descricao: 'Execução da estrutura e alvenaria' },
  { nome: '15. Execução da cobertura', categoria: 'Execução da Obra', descricao: 'Execução da cobertura' },
  { nome: '16. Execução das instalações hidrossanitárias', categoria: 'Execução da Obra', descricao: 'Execução das instalações hidrossanitárias' },
  { nome: '17. Execução das instalações elétricas e de infraestrutura lógica', categoria: 'Execução da Obra', descricao: 'Execução das instalações elétricas e de infraestrutura lógica' },
  { nome: '18. Execução dos revestimentos e pisos', categoria: 'Execução da Obra', descricao: 'Execução dos revestimentos e pisos' },
  { nome: '19. Instalação de esquadrias, vidros e ferragens', categoria: 'Execução da Obra', descricao: 'Instalação de esquadrias, vidros e ferragens' },
  { nome: '20. Pintura e acabamentos finais', categoria: 'Execução da Obra', descricao: 'Pintura e acabamentos finais' },
  { nome: '21. Urbanização, paisagismo e instalação do playground', categoria: 'Execução da Obra', descricao: 'Urbanização, paisagismo e instalação do playground' },

  // ─── Entrega da Obra ───
  { nome: '22. Vistoria técnica e recebimento provisório da obra', categoria: 'Entrega da Obra', descricao: 'Vistoria técnica e recebimento provisório da obra' },
  { nome: '23. Obtenção do Habite-se e demais licenças', categoria: 'Entrega da Obra', descricao: 'Obtenção do Habite-se e demais licenças' },
  { nome: '24. Recebimento definitivo da obra', categoria: 'Entrega da Obra', descricao: 'Recebimento definitivo da obra' },

  // ─── Implantação da Escola ───
  { nome: '25. Aquisição, entrega e montagem do mobiliário escolar', categoria: 'Implantação da Escola', descricao: 'Aquisição, entrega e montagem do mobiliário escolar' },
  { nome: '26. Instalação e testes dos equipamentos', categoria: 'Implantação da Escola', descricao: 'Instalação e testes dos equipamentos' },
  { nome: '27. Constituição e capacitação da equipe escolar', categoria: 'Implantação da Escola', descricao: 'Constituição e capacitação da equipe escolar' },
  { nome: '28. Autorização de funcionamento da unidade escolar', categoria: 'Implantação da Escola', descricao: 'Autorização de funcionamento da unidade escolar' },
];

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

export const TEMPLATE_OBRA_NOVA: KanbanTemplate = {
  id: 'obra-nova',
  nome: 'Obra Nova (Construção)',
  descricao: 'Cronograma completo para construção de creche do zero',
  tarefas: TAREFAS_PADRAO,
};

export const TEMPLATE_OBRA_RETOMADA: KanbanTemplate = {
  id: 'obra-retomada',
  nome: 'Obra Retomada (Paralisada)',
  descricao: 'Cronograma para retomada de obra paralisada',
  tarefas: TAREFAS_PADRAO,
};

export const TEMPLATE_ADAPTACAO: KanbanTemplate = {
  id: 'adaptacao',
  nome: 'Adaptação de Ambiente',
  descricao: 'Cronograma para adaptação de sala/ambiente existente',
  tarefas: TAREFAS_PADRAO,
};

export const TEMPLATE_AMPLIACAO: KanbanTemplate = {
  id: 'ampliacao',
  nome: 'Ampliação (Novo Ambiente)',
  descricao: 'Cronograma para construção de novo ambiente em unidade existente',
  tarefas: TAREFAS_PADRAO,
};

export const ALL_TEMPLATES: KanbanTemplate[] = [
  TEMPLATE_OBRA_NOVA,
  TEMPLATE_OBRA_RETOMADA,
  TEMPLATE_ADAPTACAO,
  TEMPLATE_AMPLIACAO,
];

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Seleciona automaticamente o template adequado baseado no tipo de item
 */
export function selecionarTemplateAutomatico(
  itemType: 'obra' | 'acao-unidade',
  subTipo: 'nova' | 'retomada' | 'adaptacao' | 'ampliacao'
): KanbanTemplate {
  if (itemType === 'obra') {
    return subTipo === 'nova' ? TEMPLATE_OBRA_NOVA : TEMPLATE_OBRA_RETOMADA;
  } else {
    return subTipo === 'adaptacao' ? TEMPLATE_ADAPTACAO : TEMPLATE_AMPLIACAO;
  }
}

/**
 * Calcula data de prazo baseado na data de início e dias de prazo
 */
export function calcularPrazo(dataInicio: string, prazoEmDias: number): string {
  const data = new Date(dataInicio);
  data.setDate(data.getDate() + prazoEmDias);
  return data.toISOString().split('T')[0];
}

