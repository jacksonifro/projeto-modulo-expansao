# Contexto do Projeto: Gestão de Vagas em Creches (Módulo Expansão) — Cacoal/RO

Este documento apresenta o mapeamento e o contexto do sistema de planejamento e expansão de vagas em creches para a Secretaria Municipal de Educação (SEMED) de Cacoal/RO, abrangendo o Plano Plurianual (PPA) de 2026–2029.

O projeto foi originalmente gerado/desenhado utilizando a ferramenta **Figma Maker** e implementado apenas como aplicação front-end.

---

## 1. Visão Geral do Sistema

O objetivo principal do sistema é planejar, orçar e monitorar a capacidade física de atendimento infantil (creches de 0 a 5 anos), permitindo aos gestores:
1. Analisar a demanda por bairro e o déficit de atendimento de cada etapa da educação infantil.
2. Simular custos de construção de novas creches (Projetos Tipo 1 e Tipo 2 do FNDE) ou de ampliação/remanejamento de salas existentes.
3. Cadastrar servidores municipais e vinculá-los às unidades escolares.
4. Gerenciar o andamento das obras e ações de expansão por meio de um painel Kanban.
5. Visualizar e exportar relatórios gerenciais sobre orçamento, turmas e pessoal.

---

## 2. Tecnologias e Dependências

A aplicação foi desenvolvida sob o seguinte ecossistema tecnológico:
*   **Core:** React (v18) com TypeScript e empacotamento rápido via Vite.
*   **Estilização:** Tailwind CSS (v4) integrado para estilização utilitária moderna e responsiva.
*   **Componentes de UI:** Primitivos Radix UI estilizados nos moldes do **Shadcn UI** (localizados em `src/app/components/ui/`).
*   **Gráficos e Estatísticas:** Recharts para renderização dos gráficos de área (projeções) e de barra (demanda).
*   **Ícones:** Lucide React.
*   **Animações:** Framer Motion (Motion).

---

## 3. Estrutura de Pastas e Arquivos Chave

*   **[`/`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/) (Raiz)**
    *   `package.json`: Configurações de dependências (React, Radix, Tailwind, Recharts).
    *   `vite.config.ts`: Configurações do Vite de compilação.
    *   `default_shadcn_theme.css`: Variáveis CSS padrões do Shadcn UI.
*   **[`/src/app/`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/)**
    *   [`App.tsx`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/App.tsx): Ponto de entrada do layout principal. Gerencia a barra lateral (Sidebar) de navegação e alterna a visualização ativa entre a tela inicial e os módulos de cadastro ou expansão.
    *   **[`/components/cadastro-servidores/`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/cadastro-servidores/)**
        *   [`CadastroServidores.tsx`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/cadastro-servidores/CadastroServidores.tsx): Gerencia o formulário passo a passo de cadastro de profissionais da educação (Identificação, Contatos e Vínculos).
        *   `ServidorFormSteps.tsx`: Componentes auxiliares (inputs de formulário e indicadores de passo).
    *   **[`/components/expansao-creches/`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/expansao-creches/)**
        *   [`ExpansaoCreches.tsx`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/expansao-creches/ExpansaoCreches.tsx): Roteador interno do módulo de expansão. Controla a troca de abas como dashboard, kanban, obras, custos e relatórios.
        *   [`Dashboard.tsx`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/expansao-creches/Dashboard.tsx): Painel inicial com KPIs em tempo real, investimentos do PPA e gráficos da demanda.
        *   `ConfiguracoesCusto.tsx`: Permite simular custos de obras (Tipo 1 / Tipo 2 / Próprio), além de preços de mobiliários, equipamentos, folha salarial e despesas anuais.
        *   `PlanoForm.tsx` e `PlanoView.tsx`: Telas para criação, edição e visualização detalhada do Plano de Expansão (orçamento, cronograma físico-financeiro e equipe do projeto).
        *   `Kanban.tsx` e `QuadroKanbanGlobal.tsx`: Painéis Kanban para gestão das atividades vinculadas a cada obra escolar.
        *   `Reports.tsx` e `ReportView.tsx`: Geradores de relatórios consolidados sobre salas, remanejamentos de turmas e projeções orçamentárias.
        *   [`types.ts`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/expansao-creches/types.ts): Definições de tipos TypeScript que regem a lógica de dados do sistema (planos, obras, servidores, etc.).
        *   [`mockData.ts`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/expansao-creches/mockData.ts): Conjunto de dados simulados (baseados em estudos reais e orçamentos do FNDE/SINAPI) que preenche a interface.
    *   **[`/components/ui/`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/ui/)**: Componentes utilitários de design system (botões, inputs, modais, tabelas, tooltips, cards, etc.).
    *   **[`/components/figma/`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/app/components/figma/)**: Utilitários do Figma Maker para tratamento e fallbacks de imagens.
*   **[`/src/imports/`](file:///c:/Users/jackh/OneDrive/Documentos/App-Modulo-Expansao/src/imports/)**: Documentação técnica e arquivos de referência anexos em PDF, incluindo levantamento de requisitos, custos de sala, estratégias, dados de remanejamento e as turmas atuais.

---

## 4. Fluxos de Navegação e Menu Lateral

A navegação lateral (`App.tsx`) controla a visualização principal:

1.  **Início:** Visão unificada do sistema de Gestão de Vagas Geral e atalho para o submódulo de Expansão.
2.  **Dashboard de Expansão:** Indicadores de demanda (ex: 3.888 crianças fora da creche, meta de atingir 29,97% de atendimento em 2029).
3.  **Configurações de Custo:** Simulador de custos estruturais.
4.  **Planos de Expansão:** Listagem do plano vigente PPA 2026-2029 e suas ações específicas.
5.  **Quadro Kanban:** Acompanhamento do andamento físico das obras/licitações de cada creche cadastrada.
6.  **Relatórios:** Geração de relatórios analíticos de demandas locais e orçamentárias.
7.  **Cadastro de Servidores:** (Acessível via menu lateral interno) Cadastro estruturado para admissão de novos servidores.

---

## 5. Atualizações recentes (junho de 2026)

Nesta atualização foram feitas melhorias importantes no fluxo de criação e edição de planos de expansão, principalmente em `src/app/components/expansao-creches/PlanoForm.tsx`:

*   Reorganizada a aba de `Desembolso` para exibir:
    *   lista de fontes de financiamento por ano conforme cadastradas em `Dados Gerais`;
    *   saldo anual entre disponibilidade e desembolso;
    *   distribuição por obra e por ação com total previsto.
*   Permitido ao usuário editar valores de desembolso manualmente por ano.
*   Adicionado suporte para múltiplas fontes de financiamento por ano em cada obra/ação.
*   Disponibilizada seleção de fonte por item/ano, permitindo indicar quais fontes são aplicadas em cada desembolso.
*   Expandida a `Projeção Orçamentária` para incluir o detalhamento de desembolso por ano e por fonte.

---

## 6. Próximos Passos & Integração

Como se trata de uma aplicação puramente front-end que utiliza dados simulados (`mockData.ts`), os próximos passos de evolução do projeto podem envolver:
*   Integração com uma API RESTful para persistência de dados.
*   Conexão direta com sistemas de mapeamento geográfico (ex: Google Maps/Leaflet) para georreferenciamento das demandas por bairro.
*   Expansão dos fluxos de aprovação de fluxos de caixa e cronogramas de desembolsos financeiros.
