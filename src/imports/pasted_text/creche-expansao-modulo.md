Crie um novo módulo completo para o sistema “Central de Vagas em Creches” chamado **Expansão de Creches**.

O módulo deve possuir um design moderno, profissional, institucional e responsivo, inspirado visualmente em plataformas como Trello, Monday e ClickUp, porém adaptado para gestão pública educacional e acompanhamento de obras de creches municipais.

O objetivo do módulo é permitir o gerenciamento completo da expansão de creches, desde o planejamento até a entrega final das unidades escolares.

O resultado deve parecer um software real, moderno e pronto para utilização por:

* Prefeituras
* Secretarias de Educação
* Órgãos de controle
* Equipes de engenharia e planejamento

Desejo um sistema visualmente rico, intuitivo, elegante e altamente organizado.

# Estrutura Geral do Sistema

O módulo deve funcionar com a seguinte hierarquia:

Plano de Expansão → Escolas → Metas e Atividades → Kanban da Escola

---

# 1. Dashboard Principal do Módulo

Criar uma tela inicial moderna contendo:

* Total de planos cadastrados
* Total de escolas planejadas
* Obras em andamento
* Obras concluídas
* Percentual geral de execução
* Indicadores financeiros
* Gráficos de progresso
* Timeline de entregas
* Alertas de atraso
* Lista das escolas com andamento crítico

Adicionar:

* Cards de indicadores
* Gráficos modernos
* Barra de progresso geral
* Filtros por ano, status e município
* Interface institucional moderna

---

# 2. Gestão de Planos de Expansão

Criar uma funcionalidade para cadastro e gerenciamento dos planos de expansão.

Cada plano deve possuir:

* Nome do plano
* Ano
* Descrição
* Órgão responsável
* Fonte de recurso
* Valor estimado
* Data de início
* Data prevista de conclusão
* Status do plano

Status possíveis:

* Planejamento
* Em execução
* Paralisado
* Concluído

A tela deve possuir:

* Tabela moderna
* Busca
* Filtros
* Ordenação
* Visualização em tabela e cards
* Botão “Novo Plano”
* Tela de detalhamento do plano

---

# 3. Tela de Escolas do Plano

Ao acessar um plano, o usuário deve visualizar as escolas vinculadas ao plano em formato de cards modernos.

Essa tela é extremamente importante e deve ter visual semelhante a ferramentas de gerenciamento de projetos.

Cada escola deve aparecer em um card contendo:

* Nome da escola
* Código da obra
* Endereço
* Bairro
* Quantidade prevista de vagas
* Quantidade de salas
* Responsável técnico
* Empresa executora
* Data prevista de entrega
* Status da obra
* Quantidade de atividades concluídas
* Quantidade total de atividades
* Percentual geral da escola
* Foto ilustrativa da obra
* Barra visual grande de progresso

A barra de progresso deve representar automaticamente:

* Percentual de tarefas concluídas
* Evolução da obra

Os cards devem possuir:

* Sombras suaves
* Bordas arredondadas
* Ícones modernos
* Badges coloridos
* Indicadores visuais de atraso
* Hover moderno

Status possíveis:

* Planejamento
* Em andamento
* Atrasada
* Paralisada
* Concluída

Adicionar:

* Busca
* Filtros
* Ordenação
* Visualização responsiva

---

# 4. Navegação do Fluxo

Ao clicar no card de uma escola, o sistema deve abrir uma tela estilo Trello contendo o Kanban das atividades daquela escola.

Fluxo esperado:
Plano → Escolas → Kanban da Escola

A transição deve parecer moderna e fluida.

---

# 5. Gestão de Metas e Atividades

As metas e atividades devem ser vinculadas diretamente a uma escola.

Cada escola terá seu próprio gerenciamento de atividades.

As atividades representam etapas reais da construção da creche.

Exemplos:

* Projeto arquitetônico
* Aprovação ambiental
* Licitação
* Terraplanagem
* Fundação
* Estrutura
* Instalações elétricas
* Acabamento
* Entrega final

Cada atividade deve possuir:

* Nome
* Descrição
* Responsável
* Prioridade
* Prazo
* Data de início
* Data de conclusão
* Percentual individual
* Status
* Comentários
* Histórico
* Anexos

---

# 6. Kanban da Escola

Criar uma tela moderna estilo Trello para gerenciamento das atividades da escola.

Cada escola deve possuir um Kanban independente.

O Kanban deve conter as colunas:

* A FAZER
* FAZENDO
* FEITO

A interface deve permitir:

* Drag and drop
* Movimentação fluida entre colunas
* Criação de novas tarefas
* Edição de tarefas
* Exclusão de tarefas
* Comentários
* Upload de anexos
* Histórico de alterações

---

# 7. Cards do Kanban

Cada atividade deve aparecer como um card moderno contendo:

* Nome da atividade
* Responsável
* Prazo
* Prioridade
* Percentual
* Etiquetas coloridas
* Ícones de comentário e anexo
* Indicador de atraso

Prioridades:

* Alta
* Média
* Baixa

Cores:

* Vermelho = alta
* Amarelo = média
* Verde = baixa

Os cards devem possuir:

* Layout moderno
* Cantos arredondados
* Sombras suaves
* Aparência semelhante ao Trello
* Micro animações
* Hover elegante

---

# 8. Cadastro de Nova Atividade

Na tela do Kanban deve existir um botão:
“+ Nova Atividade”

Ao clicar:
abrir um modal moderno contendo:

* Nome da atividade
* Descrição
* Responsável
* Prioridade
* Data de início
* Prazo
* Percentual
* Status
* Upload de arquivos
* Observações

O modal deve possuir design moderno e intuitivo.

---

# 9. Barra de Progresso da Escola

No topo do Kanban da escola exibir:

* Nome da escola
* Status geral
* Percentual geral concluído
* Quantidade de tarefas concluídas
* Quantidade total de tarefas
* Barra grande de progresso
* Cronograma resumido
* Indicadores de atraso

O percentual deve atualizar automaticamente conforme as tarefas forem movidas para “FEITO”.

---

# 10. Tela de Detalhamento da Escola

Criar uma tela detalhada da escola contendo abas:

* Informações Gerais
* Atividades
* Kanban
* Documentos
* Cronograma
* Histórico

Adicionar:

* Timeline visual da obra
* Upload de documentos
* Fotos da construção
* Histórico de movimentações
* Comentários
* Indicadores da execução

---

# 11. Experiência Visual

Desejo um design:

* Moderno
* Minimalista
* Profissional
* Institucional
* Extremamente visual
* Responsivo
* Elegante
* Organizado

Utilizar:

* Sidebar fixa
* Navegação moderna
* Cards arredondados
* Sombras suaves
* Barras de progresso animadas
* Ícones modernos
* Gráficos institucionais
* Micro animações
* Layout semelhante ao Trello e Monday
* Visual premium

---

# 12. Componentes que Devem Ser Criados

Criar protótipos completos das seguintes telas:

1. Dashboard do módulo
2. Lista de planos
3. Cadastro de plano
4. Tela de escolas do plano
5. Cadastro de escola
6. Detalhamento da escola
7. Kanban da escola
8. Modal de nova atividade
9. Gestão de documentos
10. Cronograma da obra
11. Relatórios e indicadores

---

# 13. Objetivo Final do Sistema

O sistema deve permitir:

* Planejar expansão de vagas em creches
* Gerenciar construção de novas unidades
* Controlar etapas da obra
* Gerenciar atividades
* Acompanhar percentual de execução
* Identificar atrasos
* Centralizar documentos
* Monitorar evolução física e financeira

O resultado final deve parecer um sistema SaaS profissional moderno de gerenciamento de obras públicas educacionais.
