import { Priority, ActivityStatus } from './types';

export interface TaskTemplate {
  nome: string;
  categoria: string;
  prazoEmDias: number;
  prioridade: Priority;
  responsavel?: string;
  descricao: string;
}

export interface KanbanTemplate {
  id: string;
  nome: string;
  descricao: string;
  tarefas: TaskTemplate[];
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE: OBRA NOVA - Construção do Zero
// ═══════════════════════════════════════════════════════════════════════════
export const TEMPLATE_OBRA_NOVA: KanbanTemplate = {
  id: 'obra-nova',
  nome: 'Obra Nova (Construção)',
  descricao: 'Cronograma completo para construção de creche do zero (20-24 meses)',
  tarefas: [
    // ─── Fase 1: Planejamento (0-3 meses) ───
    {
      nome: 'Levantamento topográfico',
      categoria: 'Projeto',
      prazoEmDias: 15,
      prioridade: 'Alta',
      responsavel: 'Engenharia',
      descricao: 'Levantamento topográfico do terreno e análise de solo',
    },
    {
      nome: 'Elaboração de projeto arquitetônico',
      categoria: 'Projeto',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Arquitetura',
      descricao: 'Desenvolvimento do projeto arquitetônico conforme padrão FNDE',
    },
    {
      nome: 'Projeto hidrossanitário',
      categoria: 'Projeto',
      prazoEmDias: 20,
      prioridade: 'Média',
      responsavel: 'Engenharia',
      descricao: 'Projeto de instalações hidráulicas e sanitárias',
    },
    {
      nome: 'Projeto elétrico e SPDA',
      categoria: 'Projeto',
      prazoEmDias: 20,
      prioridade: 'Média',
      responsavel: 'Engenharia',
      descricao: 'Projeto elétrico e sistema de proteção contra descargas atmosféricas',
    },
    {
      nome: 'Orçamento detalhado e cronograma',
      categoria: 'Projeto',
      prazoEmDias: 10,
      prioridade: 'Alta',
      responsavel: 'Engenharia',
      descricao: 'Planilha orçamentária detalhada e cronograma físico-financeiro',
    },

    // ─── Fase 2: Licitação (3-6 meses) ───
    {
      nome: 'Elaboração de edital',
      categoria: 'Licitação',
      prazoEmDias: 15,
      prioridade: 'Alta',
      responsavel: 'Jurídico',
      descricao: 'Preparação de edital de licitação para contratação de empresa',
    },
    {
      nome: 'Publicação e período de impugnação',
      categoria: 'Licitação',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Licitações',
      descricao: 'Publicação do edital e gestão de impugnações',
    },
    {
      nome: 'Análise de propostas',
      categoria: 'Licitação',
      prazoEmDias: 15,
      prioridade: 'Alta',
      responsavel: 'Licitações',
      descricao: 'Avaliação técnica e comercial das propostas recebidas',
    },
    {
      nome: 'Homologação e contratação',
      categoria: 'Licitação',
      prazoEmDias: 10,
      prioridade: 'Alta',
      responsavel: 'Jurídico',
      descricao: 'Homologação do resultado e assinatura de contrato',
    },

    // ─── Fase 3: Execução - Fundação (6-8 meses) ───
    {
      nome: 'Instalação de canteiro de obras',
      categoria: 'Fundação',
      prazoEmDias: 15,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Montagem de canteiro, tapumes e instalações provisórias',
    },
    {
      nome: 'Terraplanagem e fundações',
      categoria: 'Fundação',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Movimento de terra, escavações e execução de fundações',
    },

    // ─── Fase 4: Execução - Estrutura (8-12 meses) ───
    {
      nome: 'Estrutura e alvenaria',
      categoria: 'Estrutura',
      prazoEmDias: 90,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Execução de estrutura de concreto e alvenaria',
    },
    {
      nome: 'Cobertura e impermeabilização',
      categoria: 'Cobertura',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Instalação de cobertura e sistema de impermeabilização',
    },

    // ─── Fase 5: Execução - Instalações (12-15 meses) ───
    {
      nome: 'Instalações hidráulicas',
      categoria: 'Instalações',
      prazoEmDias: 40,
      prioridade: 'Média',
      responsavel: 'Construção',
      descricao: 'Execução de tubulações hidráulicas e sanitárias',
    },
    {
      nome: 'Instalações elétricas',
      categoria: 'Instalações',
      prazoEmDias: 40,
      prioridade: 'Média',
      responsavel: 'Construção',
      descricao: 'Passagem de eletrodutos e fiação elétrica',
    },

    // ─── Fase 6: Execução - Acabamento (15-18 meses) ───
    {
      nome: 'Revestimentos e pisos',
      categoria: 'Acabamento',
      prazoEmDias: 45,
      prioridade: 'Média',
      responsavel: 'Construção',
      descricao: 'Aplicação de revestimentos cerâmicos e pisos',
    },
    {
      nome: 'Esquadrias e vidros',
      categoria: 'Acabamento',
      prazoEmDias: 20,
      prioridade: 'Média',
      responsavel: 'Construção',
      descricao: 'Instalação de portas, janelas e vidros',
    },
    {
      nome: 'Pintura geral',
      categoria: 'Acabamento',
      prazoEmDias: 30,
      prioridade: 'Baixa',
      responsavel: 'Construção',
      descricao: 'Pintura interna e externa das edificações',
    },

    // ─── Fase 7: Execução - Áreas Externas (18-20 meses) ───
    {
      nome: 'Paisagismo e playground',
      categoria: 'Externa',
      prazoEmDias: 20,
      prioridade: 'Baixa',
      responsavel: 'Construção',
      descricao: 'Execução de áreas verdes e instalação de playground',
    },

    // ─── Fase 8: Finalização (20-24 meses) ───
    {
      nome: 'Aquisição de mobiliário FNDE',
      categoria: 'Mobiliário',
      prazoEmDias: 60,
      prioridade: 'Alta',
      responsavel: 'Compras',
      descricao: 'Licitação e aquisição de mobiliário conforme padrão FNDE',
    },
    {
      nome: 'Instalação de equipamentos',
      categoria: 'Mobiliário',
      prazoEmDias: 15,
      prioridade: 'Média',
      responsavel: 'Construção',
      descricao: 'Montagem e instalação de mobiliário e equipamentos',
    },
    {
      nome: 'Vistoria técnica final',
      categoria: 'Entrega',
      prazoEmDias: 5,
      prioridade: 'Alta',
      responsavel: 'Fiscalização',
      descricao: 'Vistoria final e elaboração de relatório de conformidade',
    },
    {
      nome: 'Obtenção de Habite-se',
      categoria: 'Entrega',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Jurídico',
      descricao: 'Regularização junto à prefeitura e obtenção de Habite-se',
    },
    {
      nome: 'Treinamento de equipe',
      categoria: 'Entrega',
      prazoEmDias: 10,
      prioridade: 'Média',
      responsavel: 'Pedagógico',
      descricao: 'Capacitação de equipe pedagógica para operação da unidade',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE: OBRA RETOMADA - Obra Paralisada
// ═══════════════════════════════════════════════════════════════════════════
export const TEMPLATE_OBRA_RETOMADA: KanbanTemplate = {
  id: 'obra-retomada',
  nome: 'Obra Retomada (Paralisada)',
  descricao: 'Cronograma para retomada de obra paralisada (12-18 meses)',
  tarefas: [
    // ─── Fase 1: Diagnóstico (0-1 mês) ───
    {
      nome: 'Vistoria técnica do estado atual',
      categoria: 'Diagnóstico',
      prazoEmDias: 5,
      prioridade: 'Alta',
      responsavel: 'Engenharia',
      descricao: 'Levantamento técnico detalhado do estado atual da obra',
    },
    {
      nome: 'Levantamento de medições e percentual executado',
      categoria: 'Diagnóstico',
      prazoEmDias: 7,
      prioridade: 'Alta',
      responsavel: 'Fiscalização',
      descricao: 'Medição oficial do percentual já executado da obra',
    },
    {
      nome: 'Análise de pendências contratuais',
      categoria: 'Diagnóstico',
      prazoEmDias: 10,
      prioridade: 'Alta',
      responsavel: 'Jurídico',
      descricao: 'Identificação de pendências jurídicas e contratuais',
    },

    // ─── Fase 2: Replanejamento (1-2 meses) ───
    {
      nome: 'Atualização de cronograma e orçamento',
      categoria: 'Replanejamento',
      prazoEmDias: 15,
      prioridade: 'Alta',
      responsavel: 'Engenharia',
      descricao: 'Replanejamento de cronograma e revisão orçamentária',
    },
    {
      nome: 'Adequação de projetos se necessário',
      categoria: 'Replanejamento',
      prazoEmDias: 20,
      prioridade: 'Média',
      responsavel: 'Arquitetura',
      descricao: 'Atualização de projetos conforme necessidades identificadas',
    },

    // ─── Fase 3: Contratual (2-4 meses) ───
    {
      nome: 'Regularização contratual ou nova licitação',
      categoria: 'Contratual',
      prazoEmDias: 45,
      prioridade: 'Alta',
      responsavel: 'Jurídico',
      descricao: 'Aditivo contratual ou processo licitatório para nova empresa',
    },

    // ─── Fase 4-8: Execução (4-18 meses) ───
    // (As tarefas serão as mesmas de OBRA NOVA, mas iniciando do ponto paralisado)
    {
      nome: 'Remobilização de canteiro',
      categoria: 'Retomada',
      prazoEmDias: 10,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Reativação de canteiro e preparação para retomada',
    },
    {
      nome: 'Recuperação de estruturas existentes',
      categoria: 'Retomada',
      prazoEmDias: 20,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Reparos em estruturas danificadas durante paralisação',
    },
    {
      nome: 'Continuidade da execução conforme projeto',
      categoria: 'Execução',
      prazoEmDias: 180,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Retomada da execução das etapas pendentes (adaptado ao % concluído)',
    },
    {
      nome: 'Aquisição de mobiliário',
      categoria: 'Mobiliário',
      prazoEmDias: 60,
      prioridade: 'Alta',
      responsavel: 'Compras',
      descricao: 'Licitação e aquisição de mobiliário',
    },
    {
      nome: 'Vistoria técnica final',
      categoria: 'Entrega',
      prazoEmDias: 5,
      prioridade: 'Alta',
      responsavel: 'Fiscalização',
      descricao: 'Vistoria final e relatório de conformidade',
    },
    {
      nome: 'Obtenção de Habite-se',
      categoria: 'Entrega',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Jurídico',
      descricao: 'Regularização e obtenção de Habite-se',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE: ADAPTAÇÃO - Modificar Sala Existente
// ═══════════════════════════════════════════════════════════════════════════
export const TEMPLATE_ADAPTACAO: KanbanTemplate = {
  id: 'adaptacao',
  nome: 'Adaptação de Ambiente',
  descricao: 'Cronograma para adaptação de sala/ambiente existente (2-4 meses)',
  tarefas: [
    // ─── Fase 1: Diagnóstico (0-2 semanas) ───
    {
      nome: 'Vistoria técnica e laudo estrutural',
      categoria: 'Diagnóstico',
      prazoEmDias: 7,
      prioridade: 'Alta',
      responsavel: 'Engenharia',
      descricao: 'Avaliação técnica das condições estruturais do ambiente',
    },
    {
      nome: 'Levantamento de necessidades pedagógicas',
      categoria: 'Diagnóstico',
      prazoEmDias: 5,
      prioridade: 'Alta',
      responsavel: 'Pedagógico',
      descricao: 'Definição de necessidades pedagógicas para a nova etapa',
    },

    // ─── Fase 2: Projeto (2-4 semanas) ───
    {
      nome: 'Projeto de adequação (layout, elétrica, hidráulica)',
      categoria: 'Projeto',
      prazoEmDias: 15,
      prioridade: 'Alta',
      responsavel: 'Arquitetura',
      descricao: 'Desenvolvimento de projeto de adaptação do ambiente',
    },

    // ─── Fase 3: Regularização (4-7 semanas) ───
    {
      nome: 'Aprovação na vigilância sanitária',
      categoria: 'Regularização',
      prazoEmDias: 20,
      prioridade: 'Alta',
      responsavel: 'Jurídico',
      descricao: 'Adequação às normas sanitárias e aprovação',
    },

    // ─── Fase 4: Execução (7-12 semanas) ───
    {
      nome: 'Execução de pequenas obras (divisórias, pintura)',
      categoria: 'Execução',
      prazoEmDias: 15,
      prioridade: 'Média',
      responsavel: 'Manutenção',
      descricao: 'Obras civis necessárias para adequação',
    },
    {
      nome: 'Adequação de instalações (tomadas, torneiras, iluminação)',
      categoria: 'Execução',
      prazoEmDias: 10,
      prioridade: 'Média',
      responsavel: 'Manutenção',
      descricao: 'Adequação de instalações elétricas e hidráulicas',
    },

    // ─── Fase 5: Mobiliário (10-16 semanas) ───
    {
      nome: 'Aquisição de mobiliário infantil',
      categoria: 'Mobiliário',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Compras',
      descricao: 'Licitação e aquisição de mobiliário adequado à faixa etária',
    },
    {
      nome: 'Aquisição de equipamentos específicos',
      categoria: 'Mobiliário',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Compras',
      descricao: 'Aquisição de berços, trocadores, ou outros equipamentos necessários',
    },

    // ─── Fase 6: Entrega (16-18 semanas) ───
    {
      nome: 'Instalação de mobiliário e equipamentos',
      categoria: 'Instalação',
      prazoEmDias: 5,
      prioridade: 'Média',
      responsavel: 'Manutenção',
      descricao: 'Montagem e instalação de todos os itens adquiridos',
    },
    {
      nome: 'Vistoria final e aprovação',
      categoria: 'Entrega',
      prazoEmDias: 5,
      prioridade: 'Alta',
      responsavel: 'Fiscalização',
      descricao: 'Vistoria final e liberação para uso',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE: AMPLIAÇÃO - Construir Novo Ambiente
// ═══════════════════════════════════════════════════════════════════════════
export const TEMPLATE_AMPLIACAO: KanbanTemplate = {
  id: 'ampliacao',
  nome: 'Ampliação (Novo Ambiente)',
  descricao: 'Cronograma para construção de novo ambiente em unidade existente (4-8 meses)',
  tarefas: [
    // ─── Fase 1: Projeto (0-2 meses) ───
    {
      nome: 'Levantamento do local para ampliação',
      categoria: 'Projeto',
      prazoEmDias: 5,
      prioridade: 'Alta',
      responsavel: 'Engenharia',
      descricao: 'Análise do terreno e viabilidade técnica da ampliação',
    },
    {
      nome: 'Projeto de ampliação e compatibilização',
      categoria: 'Projeto',
      prazoEmDias: 20,
      prioridade: 'Alta',
      responsavel: 'Arquitetura',
      descricao: 'Projeto arquitetônico e compatibilização com edificação existente',
    },
    {
      nome: 'Projetos complementares (hidráulica, elétrica)',
      categoria: 'Projeto',
      prazoEmDias: 15,
      prioridade: 'Média',
      responsavel: 'Engenharia',
      descricao: 'Projetos de instalações para novo ambiente',
    },

    // ─── Fase 2: Regularização (2-3 meses) ───
    {
      nome: 'Aprovação de alvará de construção',
      categoria: 'Regularização',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Jurídico',
      descricao: 'Tramitação e aprovação de alvará junto à prefeitura',
    },

    // ─── Fase 3: Licitação (3-5 meses) ───
    {
      nome: 'Licitação de obra (se necessário)',
      categoria: 'Licitação',
      prazoEmDias: 45,
      prioridade: 'Alta',
      responsavel: 'Licitações',
      descricao: 'Processo licitatório para contratação de empresa (se valor exigir)',
    },

    // ─── Fase 4: Execução (5-7 meses) ───
    {
      nome: 'Fundação e estrutura',
      categoria: 'Estrutura',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Execução de fundações e estrutura do novo ambiente',
    },
    {
      nome: 'Alvenaria e cobertura',
      categoria: 'Estrutura',
      prazoEmDias: 20,
      prioridade: 'Alta',
      responsavel: 'Construção',
      descricao: 'Levantamento de alvenaria e instalação de cobertura',
    },
    {
      nome: 'Instalações hidráulicas e elétricas',
      categoria: 'Instalações',
      prazoEmDias: 15,
      prioridade: 'Média',
      responsavel: 'Construção',
      descricao: 'Execução de instalações prediais',
    },
    {
      nome: 'Revestimento e acabamento',
      categoria: 'Acabamento',
      prazoEmDias: 20,
      prioridade: 'Média',
      responsavel: 'Construção',
      descricao: 'Aplicação de revestimentos, pisos e pintura',
    },

    // ─── Fase 5: Mobiliário (6-8 meses) ───
    {
      nome: 'Mobiliário e equipamentos',
      categoria: 'Mobiliário',
      prazoEmDias: 30,
      prioridade: 'Alta',
      responsavel: 'Compras',
      descricao: 'Aquisição de mobiliário e equipamentos',
    },

    // ─── Fase 6: Entrega (8 meses) ───
    {
      nome: 'Vistoria e Habite-se parcial',
      categoria: 'Entrega',
      prazoEmDias: 15,
      prioridade: 'Alta',
      responsavel: 'Fiscalização',
      descricao: 'Vistoria final e regularização da ampliação',
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// ÍNDICE DE TODOS OS TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════
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
