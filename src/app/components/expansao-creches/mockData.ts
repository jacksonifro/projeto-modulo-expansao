import {
  Servidor, UnidadeEscolar, ExpansionPlan, School, Activity,
  ItemMobiliario, ItemEquipamento, ItemAquisicao, DemandaBairro, DemandaEtapa, ProjecaoVagas,
} from './types';

// ─── Servidores ────────────────────────────────────────────────────────────
export const mockServidores: Servidor[] = [
  { id: 's1', nome: 'Gabriel Vieira Antunes', matricula: '10241', cargo: 'Secretário Adjunto de Educação', secretaria: 'SEMED', telefone: '(69) 3907-3001', email: 'gabriel.antunes@cacoal.ro.gov.br', ativo: true },
  { id: 's2', nome: 'Marcelo Machado dos Santos', matricula: '10315', cargo: 'Assessor Técnico', secretaria: 'SEMED', telefone: '(69) 3907-3002', email: 'marcelo.santos@cacoal.ro.gov.br', ativo: true },
  { id: 's3', nome: 'Raquel Fatima dos Santos', matricula: '10189', cargo: 'Coordenadora Pedagógica', secretaria: 'SEMED', telefone: '(69) 3907-3003', email: 'raquel.santos@cacoal.ro.gov.br', ativo: true },
  { id: 's4', nome: 'Kiara Cristina da Silva Santos', matricula: '10422', cargo: 'Assessora Especial', secretaria: 'SEMED', telefone: '(69) 3907-3004', email: 'kiara.santos@cacoal.ro.gov.br', ativo: true },
  { id: 's5', nome: 'Viviane Calauro Diniz', matricula: '20087', cargo: 'Agente Administrativo', secretaria: 'SEMFAZ', telefone: '(69) 3907-4001', email: 'viviane.diniz@cacoal.ro.gov.br', ativo: true },
  { id: 's6', nome: 'Carolina Lenzi Armodes', matricula: '20003', cargo: 'Secretária Municipal de Fazenda', secretaria: 'SEMFAZ', telefone: '(69) 3907-4000', email: 'carolina.armodes@cacoal.ro.gov.br', ativo: true },
  { id: 's7', nome: 'Patricia Migliorine Costa Rodrigues', matricula: '30011', cargo: 'Controladora Geral do Município', secretaria: 'CGM', telefone: '(69) 3907-5000', email: 'patricia.rodrigues@cacoal.ro.gov.br', ativo: true },
];

// ─── Unidades Escolares ────────────────────────────────────────────────────
export const mockUnidades: UnidadeEscolar[] = [
  {
    id: 'ue1', inep: '11044888', nome: 'CEI Terezinha Geneci de Oliveira', codigo: 'CEI-001',
    endereco: 'Rua das Flores, 120', bairro: 'Centro', setor: 'Região Central',
    totalVagas: 36, totalMatriculas: 176, totalListaEspera: 37,
    salas: [
      { id: 'sl1', unidadeId: 'ue1', nome: 'Sala 1', tipoAtual: 'Creche', capacidadeAtual: 16, etapaAtendida: 'Jardim I' },
      { id: 'sl2', unidadeId: 'ue1', nome: 'Sala 2', tipoAtual: 'Creche', capacidadeAtual: 16, etapaAtendida: 'Jardim I' },
      { id: 'sl3', unidadeId: 'ue1', nome: 'Sala 3', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl4', unidadeId: 'ue1', nome: 'Sala 4', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl5', unidadeId: 'ue1', nome: 'Sala 5', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
    ],
    vagasPorEtapa: [
      { etapa: 'Maternal', faixaEtaria: '1a–1a11m', vagas: 0, matriculas: 0, listaEspera: 0 },
      { etapa: 'Jardim I', faixaEtaria: '2a–2a11m', vagas: 16, matriculas: 73, listaEspera: 20 },
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 103, listaEspera: 17 },
    ],
  },
  {
    id: 'ue2', inep: '11048000', nome: 'CMEI Josino Brito', codigo: 'CMEI-002',
    endereco: 'Rua São João, 450', bairro: 'Josino Brito', setor: 'Região Oeste',
    totalVagas: 36, totalMatriculas: 63, totalListaEspera: 38,
    salas: [
      { id: 'sl6', unidadeId: 'ue2', nome: 'Sala 1', tipoAtual: 'Creche', capacidadeAtual: 16, etapaAtendida: 'Jardim I' },
      { id: 'sl7', unidadeId: 'ue2', nome: 'Sala 2', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
    ],
    vagasPorEtapa: [
      { etapa: 'Maternal', faixaEtaria: '1a–1a11m', vagas: 0, matriculas: 0, listaEspera: 0 },
      { etapa: 'Jardim I', faixaEtaria: '2a–2a11m', vagas: 16, matriculas: 15, listaEspera: 10 },
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 48, listaEspera: 28 },
    ],
  },
  {
    id: 'ue3', inep: '11048069', nome: 'CMEI Balão Mágico', codigo: 'CMEI-003',
    endereco: 'Rua Liberdade, 80', bairro: 'Liberdade', setor: 'Região Sul',
    totalVagas: 36, totalMatriculas: 107, totalListaEspera: 13,
    salas: [
      { id: 'sl8', unidadeId: 'ue3', nome: 'Sala 1', tipoAtual: 'Creche', capacidadeAtual: 16, etapaAtendida: 'Jardim I' },
      { id: 'sl9', unidadeId: 'ue3', nome: 'Sala 2', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl10', unidadeId: 'ue3', nome: 'Sala 3', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl11', unidadeId: 'ue3', nome: 'Sala Multiuso', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
      { id: 'sl12', unidadeId: 'ue3', nome: 'Sala de Informática', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 25 },
    ],
    vagasPorEtapa: [
      { etapa: 'Maternal', faixaEtaria: '1a–1a11m', vagas: 0, matriculas: 0, listaEspera: 0 },
      { etapa: 'Jardim I', faixaEtaria: '2a–2a11m', vagas: 16, matriculas: 18, listaEspera: 5 },
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 89, listaEspera: 8 },
    ],
  },
  {
    id: 'ue4', inep: '11049448', nome: 'CMEI Vereador Expedito Alves de Macedo', codigo: 'CMEI-004',
    endereco: 'Av. Brasil, 670', bairro: 'Vista Alegre', setor: 'Região Oeste',
    totalVagas: 36, totalMatriculas: 92, totalListaEspera: 35,
    salas: [
      { id: 'sl13', unidadeId: 'ue4', nome: 'Sala 1', tipoAtual: 'Creche', capacidadeAtual: 16, etapaAtendida: 'Jardim I' },
      { id: 'sl14', unidadeId: 'ue4', nome: 'Sala 2', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl15', unidadeId: 'ue4', nome: 'Sala 3', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl16', unidadeId: 'ue4', nome: 'Depósito Adaptável', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 0 },
    ],
    vagasPorEtapa: [
      { etapa: 'Maternal', faixaEtaria: '1a–1a11m', vagas: 0, matriculas: 0, listaEspera: 0 },
      { etapa: 'Jardim I', faixaEtaria: '2a–2a11m', vagas: 16, matriculas: 20, listaEspera: 12 },
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 72, listaEspera: 23 },
    ],
  },
  {
    id: 'ue5', inep: '11051035', nome: 'CMEI Monica Francisca da Cruz', codigo: 'CMEI-005',
    endereco: 'Rua Boa Vista, 310', bairro: 'Paineiras', setor: 'Região Leste',
    totalVagas: 46, totalMatriculas: 75, totalListaEspera: 19,
    salas: [
      { id: 'sl17', unidadeId: 'ue5', nome: 'Sala Maternal', tipoAtual: 'Creche', capacidadeAtual: 10, etapaAtendida: 'Maternal' },
      { id: 'sl18', unidadeId: 'ue5', nome: 'Sala Jardim I', tipoAtual: 'Creche', capacidadeAtual: 16, etapaAtendida: 'Jardim I' },
      { id: 'sl19', unidadeId: 'ue5', nome: 'Sala Jardim II', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl20', unidadeId: 'ue5', nome: 'Sala de Leitura', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 20 },
    ],
    vagasPorEtapa: [
      { etapa: 'Maternal', faixaEtaria: '1a–1a11m', vagas: 10, matriculas: 19, listaEspera: 5 },
      { etapa: 'Jardim I', faixaEtaria: '2a–2a11m', vagas: 16, matriculas: 20, listaEspera: 7 },
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 36, listaEspera: 7 },
    ],
  },
  {
    id: 'ue6', inep: '11051159', nome: 'CMEI Dercy Gomes Rodrigues', codigo: 'CMEI-006',
    endereco: 'Rua São Pedro, 52', bairro: 'Teixeirão', setor: 'Região Leste',
    totalVagas: 46, totalMatriculas: 86, totalListaEspera: 83,
    salas: [
      { id: 'sl21', unidadeId: 'ue6', nome: 'Sala Maternal', tipoAtual: 'Creche', capacidadeAtual: 10, etapaAtendida: 'Maternal' },
      { id: 'sl22', unidadeId: 'ue6', nome: 'Sala Jardim I', tipoAtual: 'Creche', capacidadeAtual: 16, etapaAtendida: 'Jardim I' },
      { id: 'sl23', unidadeId: 'ue6', nome: 'Sala Jardim II A', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
    ],
    vagasPorEtapa: [
      { etapa: 'Maternal', faixaEtaria: '1a–1a11m', vagas: 10, matriculas: 16, listaEspera: 30 },
      { etapa: 'Jardim I', faixaEtaria: '2a–2a11m', vagas: 16, matriculas: 35, listaEspera: 25 },
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 35, listaEspera: 28 },
    ],
  },
  {
    id: 'ue7', inep: '11051388', nome: 'CMEI José Simões', codigo: 'CMEI-007',
    endereco: 'Rua das Palmeiras, 200', bairro: 'Jardim Clodoaldo', setor: 'Região Central',
    totalVagas: 46, totalMatriculas: 67, totalListaEspera: 8,
    salas: [
      { id: 'sl24', unidadeId: 'ue7', nome: 'Sala Maternal A', tipoAtual: 'Creche', capacidadeAtual: 10, etapaAtendida: 'Maternal' },
      { id: 'sl25', unidadeId: 'ue7', nome: 'Sala Maternal B', tipoAtual: 'Creche', capacidadeAtual: 10, etapaAtendida: 'Maternal' },
      { id: 'sl26', unidadeId: 'ue7', nome: 'Sala Jardim I', tipoAtual: 'Creche', capacidadeAtual: 16, etapaAtendida: 'Jardim I' },
      { id: 'sl27', unidadeId: 'ue7', nome: 'Sala Jardim II', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
    ],
    vagasPorEtapa: [
      { etapa: 'Maternal', faixaEtaria: '1a–1a11m', vagas: 10, matriculas: 11, listaEspera: 2 },
      { etapa: 'Jardim I', faixaEtaria: '2a–2a11m', vagas: 16, matriculas: 20, listaEspera: 3 },
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 36, listaEspera: 3 },
    ],
  },
  {
    id: 'ue8', inep: '11027380', nome: 'EMEIEF José de Almeida e Silva', codigo: 'EMEIEF-001',
    endereco: 'Estrada Rural Km 12', bairro: 'Zona Rural', setor: 'Zona Rural',
    totalVagas: 20, totalMatriculas: 16, totalListaEspera: 0,
    salas: [
      { id: 'sl28', unidadeId: 'ue8', nome: 'Sala Rural', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl29', unidadeId: 'ue8', nome: 'Sala Multisseriada', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
    ],
    vagasPorEtapa: [
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 16, listaEspera: 0 },
    ],
  },
  {
    id: 'ue9', inep: '11026839', nome: 'EMEIEF Nossa Senhora do Carmo', codigo: 'EMEIEF-002',
    endereco: 'Estrada Riozinho Km 5', bairro: 'Distrito de Riozinho', setor: 'Distrito de Riozinho',
    totalVagas: 20, totalMatriculas: 22, totalListaEspera: 0,
    salas: [
      { id: 'sl30', unidadeId: 'ue9', nome: 'Sala Creche', tipoAtual: 'Creche', capacidadeAtual: 20, etapaAtendida: 'Jardim II' },
      { id: 'sl31', unidadeId: 'ue9', nome: 'Sala EF', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
    ],
    vagasPorEtapa: [
      { etapa: 'Jardim II', faixaEtaria: '3a–3a11m', vagas: 20, matriculas: 22, listaEspera: 0 },
    ],
  },
  {
    id: 'ue10', inep: '11044020', nome: 'EMEIEF Pedro Kemper', codigo: 'EMEIEF-003',
    endereco: 'Rua Pedro Kemper, 300', bairro: 'Village do Sol', setor: 'Região Leste',
    totalVagas: 0, totalMatriculas: 0, totalListaEspera: 0,
    salas: [
      { id: 'sl32', unidadeId: 'ue10', nome: 'Sala EF A', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
      { id: 'sl33', unidadeId: 'ue10', nome: 'Sala EF B', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
      { id: 'sl34', unidadeId: 'ue10', nome: 'Sala EF C', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
      { id: 'sl35', unidadeId: 'ue10', nome: 'Sala de Recursos', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 15 },
    ],
    vagasPorEtapa: [],
  },
  {
    id: 'ue11', inep: '11027398', nome: 'EMEIEF Luiz Lenzi', codigo: 'EMEIEF-004',
    endereco: 'Av. Luiz Lenzi, 150', bairro: 'Habitar Brasil', setor: 'Região Oeste',
    totalVagas: 0, totalMatriculas: 0, totalListaEspera: 0,
    salas: [
      { id: 'sl36', unidadeId: 'ue11', nome: 'Sala EF A', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
      { id: 'sl37', unidadeId: 'ue11', nome: 'Sala EF B', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
      { id: 'sl38', unidadeId: 'ue11', nome: 'Quadra Coberta', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 0 },
    ],
    vagasPorEtapa: [],
  },
  {
    id: 'ue12', inep: '11027002', nome: 'EMEIEF Agustinho Goes de Oliveira', codigo: 'EMEIEF-005',
    endereco: 'Rua Agustinho, 88', bairro: 'Alphapark', setor: 'Região Leste',
    totalVagas: 0, totalMatriculas: 0, totalListaEspera: 0,
    salas: [
      { id: 'sl39', unidadeId: 'ue12', nome: 'Sala EF A', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
      { id: 'sl40', unidadeId: 'ue12', nome: 'Sala EF B', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 30 },
    ],
    vagasPorEtapa: [],
  },
  {
    id: 'ue13', inep: '11043342', nome: 'EMEF Maria Socorro Viana de Almeida', codigo: 'EMEF-001',
    endereco: 'Rua Maria Socorro, 77', bairro: 'Colina Verde', setor: 'Região Sul',
    totalVagas: 0, totalMatriculas: 0, totalListaEspera: 0,
    salas: [
      { id: 'sl41', unidadeId: 'ue13', nome: 'Sala EF A', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 35 },
      { id: 'sl42', unidadeId: 'ue13', nome: 'Sala EF B', tipoAtual: 'Ensino Fundamental', capacidadeAtual: 35 },
    ],
    vagasPorEtapa: [],
  },
];

// ─── Planos de Expansão ────────────────────────────────────────────────────
export const mockPlans: ExpansionPlan[] = [
  {
    id: 'p1',
    nome: 'Plano de Expansão de Creches 2026–2029',
    periodoInicio: 2026,
    periodoFim: 2029,
    status: 'Em execução',
    descricao: 'Plano municipal de ampliação do acesso à educação pública de qualidade para a primeira infância, com meta de criar 672 novas vagas e elevar a taxa de atendimento de 15,33% para 29,97%.',
    objetivoEstrategico: 'Ampliar o acesso à educação pública de qualidade para a primeira infância, gerando oportunidades e reduzindo desigualdades.',
    fontesFinanciamento: [
      { id: 'ff1', fonte: 'FNDE — Proinfância', valorPrevisto: 12415806 },
      { id: 'ff2', fonte: 'Recurso Próprio', valorPrevisto: 1289758 },
      { id: 'ff3', fonte: 'Convênio MD Calha Norte', valorPrevisto: 1189777 },
      { id: 'ff4', fonte: 'Emenda Parlamentar', valorPrevisto: 321184 },
    ],
    responsavelId: 's1',
    dataElaboracao: '2025-11-15',
    dataRevisao: '2025-12-01',
    dataAprovacao: '2025-12-15',
    equipe: [
      { id: 'eq1', servidorId: 's1', papel: 'aprovador' },
      { id: 'eq2', servidorId: 's2', papel: 'elaborador' },
      { id: 'eq3', servidorId: 's3', papel: 'elaborador' },
      { id: 'eq4', servidorId: 's4', papel: 'membro' },
      { id: 'eq5', servidorId: 's5', papel: 'membro' },
      { id: 'eq6', servidorId: 's6', papel: 'revisor' },
      { id: 'eq7', servidorId: 's7', papel: 'revisor' },
    ],
    estrategias: [
      { id: 'e1', estrategia: 'Remanejamento de turmas', vantagens: ['Custo', 'Prazo', 'Flexibilidade'], desvantagens: [], viabilidadeTecnica: true, prioridade: 'P1', responsavelId: 's2', observacoes: 'Iniciar imediatamente com CMEI Balão Mágico' },
      { id: 'e2', estrategia: 'Ampliação de unidades existentes', vantagens: ['Prazo', 'Flexibilidade'], desvantagens: [], viabilidadeTecnica: true, prioridade: 'P2', responsavelId: 's2', observacoes: 'Pedro Kemper (2027) e Luiz Lenzi (2028)' },
      { id: 'e3', estrategia: 'Construção FNDE', vantagens: ['Custo', 'Escala', 'Qualidade'], desvantagens: ['Esforço'], viabilidadeTecnica: true, prioridade: 'P3', responsavelId: 's1', observacoes: 'Proposta 4021/2024 aprovada — execução em 2029' },
      { id: 'e4', estrategia: 'Construção Outras Fontes', vantagens: ['Custo', 'Flexibilidade'], desvantagens: [], viabilidadeTecnica: true, prioridade: 'P3', responsavelId: 's1', observacoes: 'Convênio MD Calha Norte' },
      { id: 'e5', estrategia: 'Construção Recurso Próprios', vantagens: [], desvantagens: [], viabilidadeTecnica: false, prioridade: null, responsavelId: '', observacoes: '' },
      { id: 'e6', estrategia: 'Convênio/Credenciamento', vantagens: [], desvantagens: [], viabilidadeTecnica: false, prioridade: null, responsavelId: '', observacoes: '' },
      { id: 'e7', estrategia: 'Parceria público-privada', vantagens: [], desvantagens: [], viabilidadeTecnica: false, prioridade: null, responsavelId: '', observacoes: '' },
    ],
    acoesUnidades: [
      {
        id: 'au1', tipo: 'adaptacao', unidadeId: 'ue3', salaId: 'sl11',
        descricao: 'Transformar Sala Multiuso em sala de Jardim I para criação de turma de creche',
        etapaDestino: 'Jardim I', capacidadeAnterior: 30, novaCapacidade: 16,
        fonteFinanciamento: 'Recurso Próprio', custoPorSala: 0,
        previsaoConclusao: '2026-06-30',
        desembolsoPorAno: [{ ano: 2026, valor: 0, fonte: 'Recurso Próprio' }],
      },
      {
        id: 'au2', tipo: 'ampliacao', unidadeId: 'ue10', salaId: 'sl32',
        descricao: 'Construção de 2 novas salas de creche anexas à unidade',
        etapaDestino: 'Jardim II', capacidadeAnterior: 0, novaCapacidade: 40,
        fonteFinanciamento: 'Emenda Parlamentar', custoPorSala: 160592,
        previsaoConclusao: '2027-12-31',
        desembolsoPorAno: [{ ano: 2027, valor: 321184, fonte: 'Emenda Parlamentar' }],
      },
      {
        id: 'au3', tipo: 'ampliacao', unidadeId: 'ue11', salaId: 'sl36',
        descricao: 'Construção de 3 novas salas de creche',
        etapaDestino: 'Jardim II', capacidadeAnterior: 0, novaCapacidade: 60,
        fonteFinanciamento: 'Recurso Próprio', custoPorSala: 160592,
        previsaoConclusao: '2028-12-31',
        desembolsoPorAno: [{ ano: 2028, valor: 481777, fonte: 'Recurso Próprio' }],
      },
    ],
    obras: [
      {
        id: 'ob1', tipo: 'retomada',
        nome: 'Creche Projeto Próprio — Bairro Liberdade',
        localizacao: 'Bairro Liberdade', bairro: 'Liberdade', setor: 'Região Sul',
        numeroConvenio: 'MD Calha Norte / 2023',
        percentualConclusaoAtual: 60,
        tipoProjetoFNDE: 'proprio',
        numeroDeSalas: 4,
        etapasAtendidas: ['Jardim I', 'Jardim II'],
        desembolsoPorAno: [
          { ano: 2026, valor: 800000, fonte: 'Recurso Próprio' },
          { ano: 2026, valor: 708000, fonte: 'Convênio MD Calha Norte' },
        ],
        contrapartidaMunicipal: 53,
        previsaoConclusao: '2026-12-31',
        statusObra: 'em_execucao',
      },
      {
        id: 'ob2', tipo: 'nova',
        nome: 'Creche Pré-Escola Tipo 1 — Região Leste',
        localizacao: 'Village do Sol', bairro: 'Village do Sol', setor: 'Região Leste',
        tipoProjetoFNDE: 'tipo1',
        numeroDeSalas: 10,
        etapasAtendidas: ['Maternal', 'Jardim I', 'Jardim II', 'Pré-Escola'],
        desembolsoPorAno: [
          { ano: 2029, valor: 7347966, fonte: 'FNDE — Proinfância' },
          { ano: 2029, valor: 816530, fonte: 'Recurso Próprio' },
        ],
        contrapartidaMunicipal: 10,
        previsaoConclusao: '2029-12-31',
        statusObra: 'planejada',
      },
      {
        id: 'ob3', tipo: 'nova',
        nome: 'Creche Pré-Escola Tipo 2 — Região Oeste',
        localizacao: 'Habitar Brasil', bairro: 'Habitar Brasil', setor: 'Região Oeste',
        tipoProjetoFNDE: 'tipo2',
        numeroDeSalas: 5,
        etapasAtendidas: ['Maternal', 'Jardim I', 'Jardim II'],
        desembolsoPorAno: [
          { ano: 2029, valor: 3825840, fonte: 'FNDE — Proinfância' },
          { ano: 2029, valor: 425469, fonte: 'Recurso Próprio' },
        ],
        contrapartidaMunicipal: 10,
        previsaoConclusao: '2029-12-31',
        statusObra: 'planejada',
      },
      {
        id: 'ob4', tipo: 'nova',
        nome: 'Creche Convênio MD Calha Norte — Zona Rural',
        localizacao: 'Zona Rural', bairro: 'Zona Rural', setor: 'Zona Rural',
        numeroConvenio: 'MD Calha Norte / 2025',
        tipoProjetoFNDE: 'proprio',
        numeroDeSalas: 3,
        etapasAtendidas: ['Jardim I', 'Jardim II'],
        desembolsoPorAno: [
          { ano: 2029, valor: 433599, fonte: 'Convênio MD Calha Norte' },
          { ano: 2029, valor: 48178, fonte: 'Recurso Próprio' },
        ],
        contrapartidaMunicipal: 10,
        previsaoConclusao: '2029-12-31',
        statusObra: 'planejada',
      },
    ],
    // Legacy fields
    name: 'Plano de Expansão 2026–2029',
    year: 2026,
    description: 'Plano municipal de expansão de creches (PPA 2026–2029)',
    responsible: 'SEMED — Cacoal/RO',
    fundingSource: 'FNDE / Recurso Próprio / Calha Norte / Emenda',
    estimatedValue: 16498302,
    startDate: '2026-01-01',
    expectedEndDate: '2029-12-31',
  },
];

// ─── Schools (para Kanban e telas legadas) ─────────────────────────────────
export const mockSchools: School[] = [
  {
    id: 'sc1', planId: 'p1',
    name: 'Creche Projeto Próprio — Liberdade',
    code: 'OB-2026-001',
    address: 'Bairro Liberdade', neighborhood: 'Liberdade',
    expectedVacancies: 160, classrooms: 4,
    technicalResponsible: 'Eng. Municipal',
    executingCompany: 'A definir',
    expectedDelivery: '2026-12-31',
    status: 'Em andamento',
  },
  {
    id: 'sc2', planId: 'p1',
    name: 'Ampliação EMEIEF Pedro Kemper',
    code: 'AM-2027-001',
    address: 'Rua Pedro Kemper, 300', neighborhood: 'Village do Sol',
    expectedVacancies: 64, classrooms: 2,
    technicalResponsible: 'Eng. Municipal',
    executingCompany: 'A contratar — Emenda Parlamentar',
    expectedDelivery: '2027-12-31',
    status: 'Planejamento',
  },
  {
    id: 'sc3', planId: 'p1',
    name: 'Ampliação EMEIEF Luiz Lenzi',
    code: 'AM-2028-001',
    address: 'Av. Luiz Lenzi, 150', neighborhood: 'Habitar Brasil',
    expectedVacancies: 96, classrooms: 3,
    technicalResponsible: 'Eng. Municipal',
    executingCompany: 'A contratar — Recurso Próprio',
    expectedDelivery: '2028-12-31',
    status: 'Planejamento',
  },
  {
    id: 'sc4', planId: 'p1',
    name: 'Creche Tipo 1 — Village do Sol',
    code: 'CN-2029-001',
    address: 'Village do Sol', neighborhood: 'Village do Sol',
    expectedVacancies: 228, classrooms: 10,
    technicalResponsible: 'Eng. FNDE',
    executingCompany: 'A contratar — FNDE',
    expectedDelivery: '2029-12-31',
    status: 'Planejamento',
  },
];

// ─── Activities (Kanban) ───────────────────────────────────────────────────
export const mockActivities: Activity[] = [
  { id: 'a1', schoolId: 'sc1', name: 'Projeto Executivo', description: 'Elaboração do projeto executivo de arquitetura', responsible: 'Marcelo Santos', priority: 'Alta', deadline: '2026-03-31', startDate: '2026-01-10', endDate: '2026-03-25', percentage: 100, status: 'FEITO', comments: [], attachments: [], history: [] },
  { id: 'a2', schoolId: 'sc1', name: 'Licitação Obra', description: 'Processo licitatório — Pregão Eletrônico', responsible: 'Marcelo Santos', priority: 'Alta', deadline: '2026-05-30', startDate: '2026-04-01', percentage: 70, status: 'FAZENDO', comments: [], attachments: [], history: [] },
  { id: 'a3', schoolId: 'sc1', name: 'Ordem de Serviço', description: 'Emissão da ordem de serviço à empresa contratada', responsible: 'Gabriel Antunes', priority: 'Alta', deadline: '2026-06-15', percentage: 0, status: 'A FAZER', comments: [], attachments: [], history: [] },
  { id: 'a4', schoolId: 'sc1', name: 'Obras Civis', description: 'Execução das obras civis de retomada', responsible: 'Fiscal de obra', priority: 'Alta', deadline: '2026-11-30', percentage: 0, status: 'A FAZER', comments: [], attachments: [], history: [] },
  { id: 'a5', schoolId: 'sc1', name: 'Entrega e Vistoria', description: 'Vistoria final e recebimento da obra', responsible: 'Raquel Santos', priority: 'Média', deadline: '2026-12-15', percentage: 0, status: 'A FAZER', comments: [], attachments: [], history: [] },
  { id: 'a6', schoolId: 'sc2', name: 'Projeto de Ampliação', description: 'Elaboração do projeto de ampliação de 2 salas', responsible: 'Eng. Municipal', priority: 'Alta', deadline: '2027-02-28', percentage: 0, status: 'A FAZER', comments: [], attachments: [], history: [] },
  { id: 'a7', schoolId: 'sc2', name: 'Processo Licitatório', description: 'Licitação para construção das 2 novas salas', responsible: 'Marcelo Santos', priority: 'Alta', deadline: '2027-05-31', percentage: 0, status: 'A FAZER', comments: [], attachments: [], history: [] },
];

// ─── Diagnóstico — Demanda por Bairro (CadÚnico) ──────────────────────────
export const mockDemandaBairro: DemandaBairro[] = [
  { id: 'db1', bairro: 'Zona Rural (geral)', setor: 'Zona Rural', totalCadUnico: 270, frequentam: 0, naoFrequentam: 270 },
  { id: 'db2', bairro: 'Village do Sol', setor: 'Região Leste', totalCadUnico: 100, frequentam: 1, naoFrequentam: 99 },
  { id: 'db3', bairro: 'Vista Alegre', setor: 'Região Oeste', totalCadUnico: 76, frequentam: 1, naoFrequentam: 75 },
  { id: 'db4', bairro: 'Distrito de Riozinho', setor: 'Distrito de Riozinho', totalCadUnico: 52, frequentam: 0, naoFrequentam: 52 },
  { id: 'db5', bairro: 'Teixeirão', setor: 'Região Leste', totalCadUnico: 51, frequentam: 0, naoFrequentam: 51 },
  { id: 'db6', bairro: 'Paineiras', setor: 'Região Leste', totalCadUnico: 47, frequentam: 4, naoFrequentam: 43 },
  { id: 'db7', bairro: 'Jardim Clodoaldo', setor: 'Região Central', totalCadUnico: 40, frequentam: 1, naoFrequentam: 39 },
  { id: 'db8', bairro: 'Josino Brito', setor: 'Região Oeste', totalCadUnico: 35, frequentam: 1, naoFrequentam: 34 },
  { id: 'db9', bairro: 'Liberdade', setor: 'Região Sul', totalCadUnico: 35, frequentam: 0, naoFrequentam: 35 },
  { id: 'db10', bairro: 'Habitar Brasil', setor: 'Região Oeste', totalCadUnico: 30, frequentam: 0, naoFrequentam: 30 },
  { id: 'db11', bairro: 'Alphapark', setor: 'Região Leste', totalCadUnico: 28, frequentam: 2, naoFrequentam: 26 },
  { id: 'db12', bairro: 'Colina Verde', setor: 'Região Sul', totalCadUnico: 25, frequentam: 2, naoFrequentam: 23 },
  { id: 'db13', bairro: 'Centro', setor: 'Região Central', totalCadUnico: 22, frequentam: 2, naoFrequentam: 20 },
  { id: 'db14', bairro: 'Distrito de Divinópolis', setor: 'Distrito de Divinópolis', totalCadUnico: 4, frequentam: 0, naoFrequentam: 4 },
  { id: 'db15', bairro: 'Aldeias Indígenas', setor: 'Aldeias', totalCadUnico: 7, frequentam: 0, naoFrequentam: 7 },
  { id: 'db16', bairro: 'Outros bairros', setor: 'Região Central', totalCadUnico: 349, frequentam: 2, naoFrequentam: 347 },
];

// ─── Diagnóstico — Demanda por Etapa ──────────────────────────────────────
export const mockDemandaEtapa: DemandaEtapa[] = [
  { etapa: 'Maternal', faixaEtaria: '1a a 1a11m', criancasResidentes: 2266, vagasAtuais: 46, taxaAtual: 2.0, deficitAtual: 1087, novasVagasPlanejadas: 949, deficitFinal: -138 },
  { etapa: 'Jardim I', faixaEtaria: '2a a 2a11m', criancasResidentes: 1102, vagasAtuais: 201, taxaAtual: 18.2, deficitAtual: 350, novasVagasPlanejadas: 391, deficitFinal: 41 },
  { etapa: 'Jardim II', faixaEtaria: '3a a 3a11m', criancasResidentes: 1224, vagasAtuais: 180, taxaAtual: 14.7, deficitAtual: 432, novasVagasPlanejadas: 132, deficitFinal: 300 },
];

// ─── Projeção de vagas ano a ano ──────────────────────────────────────────
export const mockProjecaoVagas: ProjecaoVagas[] = [
  { ano: 2025, novasVagas: 0, acumulado: 0, taxaAtendimento: 15.33 },
  { ano: 2026, novasVagas: 160, acumulado: 160, taxaAtendimento: 18.81 },
  { ano: 2027, novasVagas: 64, acumulado: 224, taxaAtendimento: 20.17 },
  { ano: 2028, novasVagas: 96, acumulado: 320, taxaAtendimento: 22.24 },
  { ano: 2029, novasVagas: 352, acumulado: 672, taxaAtendimento: 29.97 },
];

// ─── Mobiliário Padrão ─────────────────────────────────────────────────────
export const mockMobiliario: ItemMobiliario[] = [
  // Administração — Tipo 1
  { id: 'm1', codigo: 'MA-01', descricao: 'Mesa de reunião retangular', ambiente: 'Administração', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 2500 },
  { id: 'm2', codigo: 'MA-02', descricao: 'Cadeira fixa executiva', ambiente: 'Administração', tipoCreche: 'tipo1', quantidade: 8, valorUnitario: 280 },
  { id: 'm3', codigo: 'MA-03', descricao: 'Armário de aço 2 portas', ambiente: 'Administração', tipoCreche: 'tipo1', quantidade: 2, valorUnitario: 780 },
  { id: 'm4', codigo: 'MA-04', descricao: 'Mesa de trabalho secretaria', ambiente: 'Administração', tipoCreche: 'tipo1', quantidade: 2, valorUnitario: 850 },
  { id: 'm5', codigo: 'MA-05', descricao: 'Cadeira giratória', ambiente: 'Administração', tipoCreche: 'tipo1', quantidade: 2, valorUnitario: 380 },
  // Sala Multiuso — Tipo 1
  { id: 'm6', codigo: 'MM-01', descricao: 'Módulo psicomotricidade — degraus', ambiente: 'Sala Multiuso', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 580 },
  { id: 'm7', codigo: 'MM-02', descricao: 'Piscina de bolinhas', ambiente: 'Sala Multiuso', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 420 },
  { id: 'm8', codigo: 'MM-03', descricao: 'Lombada de psicomotricidade', ambiente: 'Sala Multiuso', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 380 },
  { id: 'm9', codigo: 'MM-04', descricao: 'Túnel de gatinhamento', ambiente: 'Sala Multiuso', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 547 },
  // Salas de Atividades — Tipo 1
  { id: 'm10', codigo: 'SA-01', descricao: 'Conjunto coletivo infantil (Maternal)', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 4, valorUnitario: 780 },
  { id: 'm11', codigo: 'SA-02', descricao: 'Conjunto coletivo infantil (Jardim)', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 14, valorUnitario: 780 },
  { id: 'm12', codigo: 'SA-03', descricao: 'Conjunto professor — mesa e cadeira', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 8, valorUnitario: 431 },
  { id: 'm13', codigo: 'SA-04', descricao: 'Armário baixo 2 portas', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 16, valorUnitario: 1493 },
  { id: 'm14', codigo: 'SA-05', descricao: 'Estante baixa 2 prateleiras', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 16, valorUnitario: 1086 },
  { id: 'm15', codigo: 'SA-06', descricao: 'Lousa magnética branca', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 8, valorUnitario: 413 },
  { id: 'm16', codigo: 'SA-07', descricao: 'Tatame EVA 1m×1m', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 72, valorUnitario: 57 },
  // Repouso — Tipo 1
  { id: 'm17', codigo: 'RE-01', descricao: 'Berço de madeira', ambiente: 'Repouso', tipoCreche: 'tipo1', quantidade: 20, valorUnitario: 876 },
  { id: 'm18', codigo: 'RE-02', descricao: 'Cama empilhável', ambiente: 'Repouso', tipoCreche: 'tipo1', quantidade: 72, valorUnitario: 169 },
  // Alimentação — Tipo 1
  { id: 'm19', codigo: 'AL-01', descricao: 'Cadeira para alimentação infantil', ambiente: 'Alimentação', tipoCreche: 'tipo1', quantidade: 20, valorUnitario: 380 },
  { id: 'm20', codigo: 'AL-02', descricao: 'Mesa refeitório para creche', ambiente: 'Alimentação', tipoCreche: 'tipo1', quantidade: 12, valorUnitario: 680 },
  { id: 'm21', codigo: 'AL-03', descricao: 'Mesa refeitório pré-escola', ambiente: 'Alimentação', tipoCreche: 'tipo1', quantidade: 8, valorUnitario: 520 },
  // Brincar — Tipo 1
  { id: 'm22', codigo: 'BR-01', descricao: 'Balanço de 2 lugares', ambiente: 'Brincar', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 1200 },
  { id: 'm23', codigo: 'BR-02', descricao: 'Escorregador', ambiente: 'Brincar', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 2800 },
  { id: 'm24', codigo: 'BR-03', descricao: 'Gangorra dupla', ambiente: 'Brincar', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 1400 },
  { id: 'm25', codigo: 'BR-04', descricao: 'Casa de bonecas', ambiente: 'Brincar', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 1800 },
  // Tipo 2 — principais
  { id: 'm26', codigo: 'MA-01', descricao: 'Mesa de reunião retangular', ambiente: 'Administração', tipoCreche: 'tipo2', quantidade: 1, valorUnitario: 2500 },
  { id: 'm27', codigo: 'MA-02', descricao: 'Cadeira fixa executiva', ambiente: 'Administração', tipoCreche: 'tipo2', quantidade: 6, valorUnitario: 280 },
  { id: 'm28', codigo: 'SA-01', descricao: 'Conjunto coletivo infantil', ambiente: 'Sala de Atividades', tipoCreche: 'tipo2', quantidade: 5, valorUnitario: 780 },
  { id: 'm29', codigo: 'SA-03', descricao: 'Conjunto professor', ambiente: 'Sala de Atividades', tipoCreche: 'tipo2', quantidade: 3, valorUnitario: 431 },
  { id: 'm30', codigo: 'SA-04', descricao: 'Armário baixo 2 portas', ambiente: 'Sala de Atividades', tipoCreche: 'tipo2', quantidade: 8, valorUnitario: 1493 },
  { id: 'm31', codigo: 'RE-01', descricao: 'Berço de madeira', ambiente: 'Repouso', tipoCreche: 'tipo2', quantidade: 10, valorUnitario: 876 },
  { id: 'm32', codigo: 'RE-02', descricao: 'Cama empilhável', ambiente: 'Repouso', tipoCreche: 'tipo2', quantidade: 36, valorUnitario: 169 },
];

// ─── Equipamentos Padrão ───────────────────────────────────────────────────
export const mockEquipamentos: ItemEquipamento[] = [
  // Sala de Atividades — Tipo 1
  { id: 'eq1', codigo: 'AR1', descricao: 'Ar-condicionado split 30.000 BTUs', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 10, valorUnitario: 5000 },
  { id: 'eq2', codigo: 'VP', descricao: 'Ventilador de parede', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 20, valorUnitario: 185 },
  { id: 'eq3', codigo: 'MS', descricao: 'Aparelho de som microsystem', ambiente: 'Sala de Atividades', tipoCreche: 'tipo1', quantidade: 10, valorUnitario: 205 },
  // Serviços (Cozinha/Lavanderia) — Tipo 1
  { id: 'eq4', codigo: 'GEL-I', descricao: 'Geladeira industrial', ambiente: 'Serviços', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 6062 },
  { id: 'eq5', codigo: 'FZ', descricao: 'Freezer horizontal', ambiente: 'Serviços', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 2800 },
  { id: 'eq6', codigo: 'FG-C', descricao: 'Fogão comercial 6 bocas', ambiente: 'Serviços', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 3200 },
  { id: 'eq7', codigo: 'MO', descricao: 'Microondas 30L', ambiente: 'Serviços', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 680 },
  { id: 'eq8', codigo: 'BT', descricao: 'Batedeira industrial', ambiente: 'Serviços', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 3211 },
  { id: 'eq9', codigo: 'LQ-G', descricao: 'Liquidificador industrial', ambiente: 'Serviços', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 1200 },
  { id: 'eq10', codigo: 'LAV', descricao: 'Lavadora de roupas', ambiente: 'Serviços', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 1288 },
  { id: 'eq11', codigo: 'SEC', descricao: 'Secadora de roupas', ambiente: 'Serviços', tipoCreche: 'tipo1', quantidade: 1, valorUnitario: 1500 },
  // Demais ambientes — Tipo 1
  { id: 'eq12', codigo: 'PR', descricao: 'Purificador de água', ambiente: 'Outros', tipoCreche: 'tipo1', quantidade: 9, valorUnitario: 493 },
  { id: 'eq13', codigo: 'BB', descricao: 'Bebedouro elétrico acessível', ambiente: 'Outros', tipoCreche: 'tipo1', quantidade: 2, valorUnitario: 1860 },
  { id: 'eq14', codigo: 'TV', descricao: 'Televisor 32 polegadas', ambiente: 'Outros', tipoCreche: 'tipo1', quantidade: 2, valorUnitario: 1656 },
  // Tipo 2
  { id: 'eq15', codigo: 'AR1', descricao: 'Ar-condicionado split 30.000 BTUs', ambiente: 'Sala de Atividades', tipoCreche: 'tipo2', quantidade: 5, valorUnitario: 5000 },
  { id: 'eq16', codigo: 'VP', descricao: 'Ventilador de parede', ambiente: 'Sala de Atividades', tipoCreche: 'tipo2', quantidade: 10, valorUnitario: 185 },
  { id: 'eq17', codigo: 'GEL-I', descricao: 'Geladeira industrial', ambiente: 'Serviços', tipoCreche: 'tipo2', quantidade: 1, valorUnitario: 6062 },
  { id: 'eq18', codigo: 'FG-C', descricao: 'Fogão comercial 6 bocas', ambiente: 'Serviços', tipoCreche: 'tipo2', quantidade: 1, valorUnitario: 3200 },
  { id: 'eq19', codigo: 'PR', descricao: 'Purificador de água', ambiente: 'Outros', tipoCreche: 'tipo2', quantidade: 6, valorUnitario: 493 },
  { id: 'eq20', codigo: 'TV', descricao: 'Televisor 32 polegadas', ambiente: 'Outros', tipoCreche: 'tipo2', quantidade: 2, valorUnitario: 1656 },
];

// ─── Aquisições Padrão ─────────────────────────────────────────────────────
export const mockAquisicoes: ItemAquisicao[] = [
  // Tipo 1
  { id: 'aq1', codigo: '1', descricao: 'Kit Educação Infantil FNDE', tipoCreche: 'tipo1', unidade: 'aluno/ano', quantidadeAnual: 414, valorUnitario: 75.15 },
  { id: 'aq2', codigo: '2', descricao: 'Merenda escolar — creche (0–3a)', tipoCreche: 'tipo1', unidade: 'aluno/dia letivo', quantidadeAnual: 52800, valorUnitario: 16.37 },
  { id: 'aq3', codigo: '3', descricao: 'Merenda escolar — pré-escola', tipoCreche: 'tipo1', unidade: 'aluno/dia letivo', quantidadeAnual: 30000, valorUnitario: 15.72 },
  { id: 'aq4', codigo: '4', descricao: 'Energia elétrica', tipoCreche: 'tipo1', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 2500 },
  { id: 'aq5', codigo: '5', descricao: 'Água e esgoto', tipoCreche: 'tipo1', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 250 },
  { id: 'aq6', codigo: '6', descricao: 'Telefonia e conectividade', tipoCreche: 'tipo1', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 600 },
  { id: 'aq7', codigo: '7', descricao: 'Material de consumo', tipoCreche: 'tipo1', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 3500 },
  { id: 'aq8', codigo: '8', descricao: 'Serviços de terceiros', tipoCreche: 'tipo1', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 500 },
  // Tipo 2
  { id: 'aq9', codigo: '1', descricao: 'Kit Educação Infantil FNDE', tipoCreche: 'tipo2', unidade: 'aluno/ano', quantidadeAnual: 192, valorUnitario: 75.15 },
  { id: 'aq10', codigo: '2', descricao: 'Merenda escolar — creche (0–3a)', tipoCreche: 'tipo2', unidade: 'aluno/dia letivo', quantidadeAnual: 18400, valorUnitario: 16.37 },
  { id: 'aq11', codigo: '3', descricao: 'Merenda escolar — pré-escola', tipoCreche: 'tipo2', unidade: 'aluno/dia letivo', quantidadeAnual: 20000, valorUnitario: 15.72 },
  { id: 'aq12', codigo: '4', descricao: 'Energia elétrica', tipoCreche: 'tipo2', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 2000 },
  { id: 'aq13', codigo: '5', descricao: 'Água e esgoto', tipoCreche: 'tipo2', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 200 },
  { id: 'aq14', codigo: '6', descricao: 'Telefonia e conectividade', tipoCreche: 'tipo2', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 600 },
  { id: 'aq15', codigo: '7', descricao: 'Material de consumo', tipoCreche: 'tipo2', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 2800 },
  { id: 'aq16', codigo: '8', descricao: 'Serviços de terceiros', tipoCreche: 'tipo2', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 350 },
  // Sala
  { id: 'aq17', codigo: '1', descricao: 'Kit Educação Infantil FNDE', tipoCreche: 'sala', unidade: 'aluno/ano', quantidadeAnual: 20, valorUnitario: 75.15 },
  { id: 'aq18', codigo: '2', descricao: 'Merenda escolar', tipoCreche: 'sala', unidade: 'aluno/dia letivo', quantidadeAnual: 4000, valorUnitario: 16.37 },
  { id: 'aq19', codigo: '3', descricao: 'Material pedagógico', tipoCreche: 'sala', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 800 },
  { id: 'aq20', codigo: '4', descricao: 'Material de limpeza e consumo', tipoCreche: 'sala', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 350 },
];

// ─── Diagnóstico — CadÚnico por Unidade e Raio (MOCK) ──────────────────────
export const mockCadUnicoUnidade = [
  {
    unidadeId: 'ue1', // CEI Terezinha Geneci de Oliveira
    raios: [
      { raioMts: 500, maternal: 12, jardimI: 18, jardimII: 22 },
      { raioMts: 1000, maternal: 34, jardimI: 45, jardimII: 50 },
      { raioMts: 2000, maternal: 80, jardimI: 95, jardimII: 110 },
      { raioMts: 3000, maternal: 120, jardimI: 140, jardimII: 165 },
    ]
  },
  {
    unidadeId: 'ue2', // CMEI Josino Brito
    raios: [
      { raioMts: 500, maternal: 8, jardimI: 10, jardimII: 15 },
      { raioMts: 1000, maternal: 22, jardimI: 30, jardimII: 42 },
      { raioMts: 2000, maternal: 65, jardimI: 80, jardimII: 92 },
      { raioMts: 3000, maternal: 105, jardimI: 125, jardimII: 140 },
    ]
  },
  {
    unidadeId: 'ue3', // CMEI Balão Mágico
    raios: [
      { raioMts: 500, maternal: 15, jardimI: 22, jardimII: 28 },
      { raioMts: 1000, maternal: 40, jardimI: 55, jardimII: 68 },
      { raioMts: 2000, maternal: 95, jardimI: 110, jardimII: 130 },
      { raioMts: 3000, maternal: 150, jardimI: 175, jardimII: 190 },
    ]
  },
  {
    unidadeId: 'ue4', // CMEI Vereador Expedito Alves de Macedo
    raios: [
      { raioMts: 500, maternal: 10, jardimI: 15, jardimII: 20 },
      { raioMts: 1000, maternal: 28, jardimI: 38, jardimII: 45 },
      { raioMts: 2000, maternal: 70, jardimI: 88, jardimII: 98 },
      { raioMts: 3000, maternal: 115, jardimI: 135, jardimII: 155 },
    ]
  },
  {
    unidadeId: 'ue5', // CMEI Monica Francisca da Cruz
    raios: [
      { raioMts: 500, maternal: 5, jardimI: 8, jardimII: 12 },
      { raioMts: 1000, maternal: 18, jardimI: 25, jardimII: 35 },
      { raioMts: 2000, maternal: 55, jardimI: 70, jardimII: 85 },
      { raioMts: 3000, maternal: 90, jardimI: 110, jardimII: 125 },
    ]
  },
  {
    unidadeId: 'ue6', // CMEI Dercy Gomes Rodrigues
    raios: [
      { raioMts: 500, maternal: 20, jardimI: 28, jardimII: 35 },
      { raioMts: 1000, maternal: 50, jardimI: 65, jardimII: 80 },
      { raioMts: 2000, maternal: 110, jardimI: 135, jardimII: 150 },
      { raioMts: 3000, maternal: 175, jardimI: 210, jardimII: 235 },
    ]
  },
  {
    unidadeId: 'ue7', // CMEI José Simões
    raios: [
      { raioMts: 500, maternal: 14, jardimI: 20, jardimII: 25 },
      { raioMts: 1000, maternal: 36, jardimI: 48, jardimII: 60 },
      { raioMts: 2000, maternal: 85, jardimI: 105, jardimII: 120 },
      { raioMts: 3000, maternal: 130, jardimI: 160, jardimII: 185 },
    ]
  },
  {
    unidadeId: 'ue8', // EMEIEF José de Almeida e Silva
    raios: [
      { raioMts: 500, maternal: 2, jardimI: 3, jardimII: 5 },
      { raioMts: 1000, maternal: 8, jardimI: 12, jardimII: 15 },
      { raioMts: 2000, maternal: 25, jardimI: 35, jardimII: 40 },
      { raioMts: 3000, maternal: 45, jardimI: 60, jardimII: 70 },
    ]
  },
];
