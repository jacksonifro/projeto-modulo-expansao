// ─── Enums / union types ───────────────────────────────────────────────────
export type PlanStatus = 'Planejamento' | 'Em execução' | 'Paralisado' | 'Concluído';
export type SchoolStatus = 'Planejamento' | 'Em andamento' | 'Atrasada' | 'Paralisada' | 'Concluída';
export type ActivityStatus = 'A FAZER' | 'FAZENDO' | 'FEITO';
export type Priority = 'Alta' | 'Média' | 'Baixa';
export type TipoCreche = 'tipo1' | 'tipo2';
export type TipoSala = 'nova' | 'ampliacao';
export type PapelEquipe = 'elaborador' | 'revisor' | 'aprovador' | 'membro';
export type Prioridade = 'P1' | 'P2' | 'P3';
export type TipoAcaoUnidade = 'adaptacao' | 'ampliacao';
export type TipoObra = 'retomada' | 'nova';
export type StatusObra = 'planejada' | 'em_licitacao' | 'em_execucao';
export type EtapaEI = 'Maternal' | 'Jardim I' | 'Jardim II' | 'Pré-Escola';
export type AmbienteCreche =
  | 'Administração'
  | 'Sala Multiuso'
  | 'Sala de Atividades'
  | 'Repouso'
  | 'Higiene'
  | 'Alimentação'
  | 'Serviços'
  | 'Brincar'
  | 'Outros';

export type CategoriaAmbiente =
  | 'sala-atividades'
  | 'bercario'
  | 'solario'
  | 'fraldario'
  | 'sala-amamentacao'
  | 'refeitorio'
  | 'cozinha'
  | 'despensa'
  | 'lavanderia'
  | 'administracao'
  | 'sala-professores'
  | 'sala-recursos'
  | 'banheiro-infantil'
  | 'banheiro-adulto'
  | 'deposito'
  | 'area-descoberta'
  | 'guarita'
  | 'outros';

export type TipoItemBiblioteca = 'mobiliario' | 'equipamento';

// ─── Biblioteca de Itens de Referência ────────────────────────────────────
export interface ItemBiblioteca {
  id: string;
  codigo: string;
  tipo: TipoItemBiblioteca;
  descricao: string;
  unidade: string;
  valorUnitarioRef: number; // valor de referência SINAPI/FNDE
  categoriasSugeridas: CategoriaAmbiente[];
}

// ─── Modelo de Ambiente ────────────────────────────────────────────────────
export interface ItemAmbiente {
  id: string;
  bibliotecaId: string;      // referência ao ItemBiblioteca
  descricao: string;         // copiado da biblioteca (override permitido)
  tipo: TipoItemBiblioteca;
  quantidade: number;
  valorUnitario: number;     // copiado da biblioteca (override permitido)
}

export interface ModeloAmbiente {
  id: string;
  nome: string;
  categoria: CategoriaAmbiente;
  areaMq: number;
  custoConstrucaoMq: number; // R$/m² obra civil sem mobília
  padrao: boolean;           // true = template FNDE padrão
  itens: ItemAmbiente[];
}

// ─── Modelo de Creche ──────────────────────────────────────────────────────
export interface ModeloCrecheAmbiente {
  id: string;
  modeloAmbienteId: string;
  nomeOverride?: string;
  quantidade: number;
}

export interface ServicoAnual {
  id: string;
  descricao: string;
  unidade: string;
  valorAnual: number;
}

export interface AquisicaoAnual {
  id: string;
  descricao: string;
  unidade: string;
  quantidadeAnual: number;
  valorUnitario: number;
}

export interface CargoReferencia {
  id: string;
  descricao: string;
  remuneracaoBase: number;
  auxilios: number;
  patronal: number;
}

export interface ModeloCrechePessoal {
  id: string;
  cargoId: string;
  quantidade: number;
}

export interface ModeloCreche {
  id: string;
  nome: string;
  tipoBase: 'tipo1' | 'tipo2' | 'proprio';
  descricao: string;
  reservaPct: number;        // % de contingência (ex: 10)
  capacidadeAlunos: number;  // capacidade de atendimento
  ambientes: ModeloCrecheAmbiente[];
  servicos: ServicoAnual[];
  aquisicoes: AquisicaoAnual[];
  pessoal: ModeloCrechePessoal[];
}

// ─── Servidor Municipal ────────────────────────────────────────────────────
export interface Servidor {
  id: string;
  nome: string;
  matricula: string;
  cargo: string;
  secretaria: string;
  telefone: string;
  email: string;
  ativo: boolean;
}

// ─── Unidade Escolar ───────────────────────────────────────────────────────
export interface SalaUE {
  id: string;
  unidadeId: string;
  nome: string;
  tipoAtual: string;
  capacidadeAtual: number;
  etapaAtendida?: EtapaEI;
}

export interface VagaEtapa {
  etapa: EtapaEI;
  faixaEtaria: string;
  vagas: number;
  matriculas: number;
  listaEspera: number;
}

export interface UnidadeEscolar {
  id: string;
  inep: string;
  nome: string;
  codigo: string;
  endereco: string;
  bairro: string;
  setor: string;
  totalVagas: number;
  totalMatriculas: number;
  totalListaEspera: number;
  salas: SalaUE[];
  vagasPorEtapa: VagaEtapa[];
}

// ─── Configurações de Custo ────────────────────────────────────────────────
export interface ItemMobiliario {
  id: string;
  codigo: string;
  descricao: string;
  ambiente: AmbienteCreche;
  tipoCreche: TipoCreche;
  quantidade: number;
  valorUnitario: number;
}

export interface ItemEquipamento {
  id: string;
  codigo: string;
  descricao: string;
  ambiente: AmbienteCreche;
  tipoCreche: TipoCreche;
  quantidade: number;
  valorUnitario: number;
}

export interface ItemAquisicao {
  id: string;
  codigo: string;
  descricao: string;
  tipoCreche: TipoCreche | 'sala';
  unidade: string;
  quantidadeAnual: number;
  valorUnitario: number;
}

export interface CustoPessoalSala {
  id: string;
  funcao: string;
  quantidade: number;
  remuneracaoBase: number;
  auxilios: number;
  patronal: number;
}

// ─── Plano de Expansão ─────────────────────────────────────────────────────
export interface FonteFinanciamento {
  id: string;
  fonte: string;
  valorPrevisto: number;
}

export interface MembroEquipe {
  id: string;
  servidorId: string;
  papel: PapelEquipe;
}

export interface EstrategiaExpansao {
  id: string;
  estrategia: string;
  vantagens: string[];
  desvantagens: string[];
  viabilidadeTecnica: boolean | null;
  prioridade: Prioridade | null;
  responsavelId: string;
  observacoes: string;
}

export interface DesembolsoAnual {
  ano: number;
  valor: number;
  fonte: string;
}

export interface AcaoUnidade {
  id: string;
  tipo: TipoAcaoUnidade;
  unidadeId: string;
  salaId: string;
  modeloCrecheId?: string;   // used in 'ampliacao': which creche model the ambiente comes from
  descricao: string;
  etapaDestino: EtapaEI;
  capacidadeAnterior: number;
  novaCapacidade: number;
  fonteFinanciamento: string;
  custoPorSala: number;
  previsaoConclusao: string;
  desembolsoPorAno: DesembolsoAnual[];
}

export interface ConfiguracaoSala {
  id: string;
  origem: 'obra' | 'acao';
  origemId: string;
  nome: string;
  numeroTurmas: number;
  etapas: EtapaEI[];
}

export interface ItemPessoal {
  id: string;
  funcao: string;
  categoria: 'pedagogico' | 'administrativo' | 'apoio';
  quantidade: number;
  remuneracaoBase: number;
  auxilios: number;
  autoCalculado?: boolean;
  observacoes?: string;
}

export interface ObraConstrucao {
  id: string;
  tipo: TipoObra;
  nome: string;
  localizacao: string;
  bairro: string;
  setor: string;
  numeroConvenio?: string;
  percentualConclusaoAtual?: number;
  tipoProjetoFNDE?: TipoCreche | 'proprio';
  modeloCrecheId?: string;
  numeroDeSalas: number;
  etapasAtendidas: EtapaEI[];
  desembolsoPorAno: DesembolsoAnual[];
  contrapartidaMunicipal?: number;
  previsaoConclusao: string;
  statusObra: StatusObra;
}

export interface ExpansionPlan {
  id: string;
  // Aba 0 — Dados Gerais
  nome: string;
  periodoInicio: number;
  periodoFim: number;
  status: PlanStatus;
  descricao: string;
  objetivoEstrategico: string;
  fontesFinanciamento: FonteFinanciamento[];
  responsavelId: string;
  dataElaboracao: string;
  dataRevisao?: string;
  dataAprovacao?: string;
  // Aba 1 — Equipe
  equipe: MembroEquipe[];
  // Aba 2 — Estratégias
  estrategias: EstrategiaExpansao[];
  // Aba 3 — Ações em Unidades
  acoesUnidades: AcaoUnidade[];
  // Aba 4 — Obras
  obras: ObraConstrucao[];
  // Aba 5 — Pessoal
  pessoal?: ItemPessoal[];
  configSalas?: ConfiguracaoSala[];
  // Legacy para compatibilidade com componentes existentes
  name: string;
  year: number;
  description: string;
  responsible: string;
  fundingSource: string;
  estimatedValue: number;
  startDate: string;
  expectedEndDate: string;
}

// ─── School (mantido para Kanban e outras telas) ───────────────────────────
export interface School {
  id: string;
  planId: string;
  name: string;
  code: string;
  address: string;
  neighborhood: string;
  expectedVacancies: number;
  classrooms: number;
  technicalResponsible: string;
  executingCompany: string;
  expectedDelivery: string;
  status: SchoolStatus;
  imageUrl?: string;
}

// ─── Activity ──────────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  user: string;
  action: string;
}

export interface Activity {
  id: string;
  schoolId: string;           // LEGACY: mantido para compatibilidade
  planId?: string;            // NOVO: ID do plano de expansão
  itemId?: string;            // NOVO: ID da obra ou ação em unidade
  itemType?: 'obra' | 'acao-unidade';  // NOVO: tipo do item vinculado
  name: string;
  description: string;
  category?: string;          // NOVO: categoria da tarefa (Projeto, Licitação, etc)
  responsible: string;
  priority: Priority;
  deadline: string;
  startDate?: string;
  endDate?: string;
  percentage: number;
  status: ActivityStatus;
  autoGenerated?: boolean;    // NOVO: indica se foi gerada automaticamente do template
  comments: Comment[];
  attachments: Attachment[];
  history: HistoryEntry[];
  tags?: string[];            // NOVO: tags personalizadas
}

// ─── Diagnóstico / Análise ─────────────────────────────────────────────────
export interface DemandaBairro {
  id: string;
  bairro: string;
  setor: string;
  totalCadUnico: number;
  frequentam: number;
  naoFrequentam: number;
}

export interface DemandaEtapa {
  etapa: EtapaEI;
  faixaEtaria: string;
  criancasResidentes: number;
  vagasAtuais: number;
  taxaAtual: number;
  deficitAtual: number;
  novasVagasPlanejadas: number;
  deficitFinal: number;
}

export interface ProjecaoVagas {
  ano: number;
  novasVagas: number;
  acumulado: number;
  taxaAtendimento: number;
}

export interface CadUnicoRaioData {
  raioMts: number;
  maternal: number;
  jardimI: number;
  jardimII: number;
}

export interface CadUnicoPorUnidade {
  unidadeId: string;
  raios: CadUnicoRaioData[];
}
