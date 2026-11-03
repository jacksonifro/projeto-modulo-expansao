// ─── Enums / union types ───────────────────────────────────────────────────
export type PlanStatus = 'Rascunho' | 'Planejamento' | 'Em execução' | 'Paralisado' | 'Concluído';
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
  ambienteClassificacao?: string; // Classificação por ambiente: COPA, FRALDÁRIO / SANITÁRIOS, etc.
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
  capacidadeAlunos?: number; // lotação máxima de alunos para salas
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
  unidade?: string;
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
  coordenadas?: { lat: number; lng: number };
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
  capacidadeAlunos?: number;
  etapasAtendidas: EtapaEI[];
  desembolsoPorAno: DesembolsoAnual[];
  contrapartidaMunicipal?: number;
  previsaoConclusao: string;
  statusObra: StatusObra;
  coordenadas?: { lat: number; lng: number };
}

export interface CriancaCadUnico {
  id: string;
  nome: string;
  idade: string;
  status: 'aguardando' | 'matriculada';
  bairro: string;
  coordenadas: { lat: number; lng: number };
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
  coordenadas?: { lat: number; lng: number };
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

// ─── Plano de Custeio (Operação e Manutenção) ──────────────────────────────

export type CriterioProporcionalidade =
  | 'por_ambiente'           // Multiplicado pelo nº de salas/ambientes adicionados
  | 'por_vaga'               // Multiplicado pela capacidade de alunos/vagas adicionadas
  | 'por_turma'              // Multiplicado pelo nº de turmas em operação
  | 'por_profissional'       // Vinculado ao total de profissionais
  | 'por_unidade'            // 1x para Nova Creche; 0x (compartilhado) por padrão em Ampliação
  | 'percentual_utilizacao'  // Fração percentual (ex.: +20% de contrato existente na ampliação)
  | 'valor_fixo_incremental' // Valor fixo específico para a intervenção
  | 'manual';                // Definido livremente pelo usuário

export type PeriodicidadeDespesa = 'unica' | 'mensal' | 'anual';

export type NaturezaCustoIntervencao = 'exclusivo_intervencao' | 'compartilhado_rede';

export type OrigemCalculoItemCusteio = 'automatico' | 'ajustado_manualmente' | 'incluido_manualmente';

export type StatusPlanoCusteio = 'Rascunho' | 'Em Análise' | 'Aprovado' | 'Arquivado';

export interface IntervencaoCusteioVinculada {
  id: string;
  origemTipo: 'obra' | 'acao';
  origemId: string;
  unidadeId?: string;
  nomeUnidadeOuObra: string;
  localizacaoResumo: string;
  escopo: 'unidade_completa' | 'incremental';
  subtipoIntervencao: 'nova_construcao' | 'retomada' | 'ampliacao' | 'adaptacao';
  modeloCrecheId?: string;
  modeloCrecheNome?: string;
  projetoProprio?: boolean;
  salasAdicionais: number;
  vagasAdicionais: number;
  turmasPrevistas: number;
  turmasPadraoModelo?: number;
  etapasAtendidas: EtapaEI[];
  ambientesPrevistos: { ambienteId: string; nome: string; quantidade: number }[];
  dataConclusaoObra?: string; // YYYY-MM-DD
  dataInicioOperacao: string; // YYYY-MM
  dataFimOperacao?: string;   // YYYY-MM
  ativoNoCusteio: boolean;
}

export interface ItemCusteioBase {
  id: string;
  intervencaoCusteioId: string; // ID de IntervencaoCusteioVinculada ou 'global'
  catalogoRefId?: string;
  descricao: string;
  criterioCalculo: CriterioProporcionalidade;
  fatorProporcional: number;    // Razão exata (sem truncamento), ex.: 40/120 = 0.333333...
  numeradorProporcao?: number;  // Ex.: 40 (vagas da intervenção)
  denominadorProporcao?: number;// Ex.: 120 (vagas do modelo referência)
  unidadeProporcao?: string;    // Ex.: 'vagas' | 'salas' | 'turmas' | 'prof.' | 'unid.'
  percentualRateio?: number;    // 0–100 quando criterioCalculo === 'percentual_utilizacao'
  memoriaCalculo: string;       // Explicação legível do cálculo proporcional
  naturezaCusto: NaturezaCustoIntervencao;
  periodicidade: PeriodicidadeDespesa;
  unidadeMedida: string;        // 'ANO' | 'UN' | 'KIT' | 'MES'
  quantidade: number;
  valorUnitario: number;        // Valor base anual (quando 'anual') ou unitário (quando 'unica'/'mensal')
  dataInicio: string;           // YYYY-MM
  dataFim?: string;             // YYYY-MM
  ocorrenciasNoPeriodo: number; // Meses ativos (recorrentes) ou 1/0 (única)
  valorAnualizado: number;      // Custo anual de referência (para recorrentes) ou valor único
  valorTotalProjetado: number;  // Total acumulado dentro do período do Plano de Custeio
  origemCalculo: OrigemCalculoItemCusteio;
  quantidadeOriginal?: number;
  valorUnitarioOriginal?: number;
  justificativaAjuste?: string;
}

export interface ItemCusteioServico extends ItemCusteioBase {
  categoria: 'servico';
  tipoServico: 'utilidades' | 'seguranca' | 'limpeza' | 'conectividade' | 'manutencao' | 'outros';
}

export interface ItemCusteioAquisicao extends ItemCusteioBase {
  categoria: 'aquisicao';
  tipoAquisicao: 'pontual_implantacao' | 'recorrente_manutencao';
  subcategoriaAquisicao: 'mobiliario_equipamento' | 'alimentacao' | 'material_pedagogico' | 'insumos_higiene' | 'uniformes_epi' | 'outros';
}

export interface ItemCusteioPessoal extends ItemCusteioBase {
  categoria: 'pessoal';
  categoriaCargo: 'pedagogico' | 'administrativo' | 'apoio';
  cargoRefId?: string;
  funcao: string;
  cargaHoraria: string;
  remuneracaoBase: number;
  auxilios: number;
  patronalUnitario: number;
  custoMensalUnitario: number;
  custoAnualUnitario: number; // (remuneracaoBase + auxilios + patronalUnitario) * 13.33
}

export interface ParametrosSimulacaoCusteio {
  taxaReajusteAnualServicos: number;   // % ao ano
  taxaReajusteAnualAquisicoes: number; // % ao ano
  taxaReajusteAnualPessoal: number;    // % ao ano
  observacoesCenario?: string;
}

export interface ResumoFinanceiroCusteio {
  totalServicosPeriodo: number;
  totalAquisicoesPontuaisPeriodo: number;
  totalAquisicoesRecorrentesPeriodo: number;
  totalPessoalPeriodo: number;
  totalGeralPeriodo: number;
  custoAnualRegimePleno: number; // Custo anualizado de 12 meses com todas as intervenções ativas em operação
  custoMedioAnual: number;       // Desembolso médio anual ao longo do horizonte do plano
  custoMedioMensal: number;
  custoPorVagaAdicionalAno: number;
  totalVagasContempladas: number;
  totalSalasContempladas: number;
  totalProfissionais: number;
  totalInicialAutomatico: number;
}

export interface PlanoCusteio {
  id: string;
  planoExpansaoId: string;
  nome: string;
  descricao: string;
  cenarioLabel: string;
  versao: number;
  status: StatusPlanoCusteio;
  dataInicio: string; // YYYY-MM
  dataFim: string;    // YYYY-MM
  anoInicio: number;
  anoFim: number;
  responsavelNome: string;
  dataCriacao: string;
  dataAtualizacao: string;
  intervencoes: IntervencaoCusteioVinculada[];
  configSalas: ConfiguracaoSala[];
  servicos: ItemCusteioServico[];
  aquisicoes: ItemCusteioAquisicao[];
  pessoal: ItemCusteioPessoal[];
  parametrosSimulacao: ParametrosSimulacaoCusteio;
  resumoFinanceiro: ResumoFinanceiroCusteio;
}

