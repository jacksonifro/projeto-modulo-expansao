/**
 * Dados de referência para Configuração de Custo
 * Baseados nas especificações do FNDE — Programa Proinfância (Tipos B e C)
 * e SINAPI/RO (Rondônia) — referência 2024/2025
 *
 * Tipo 1 → equivalente ao Proinfância Tipo B (capacidade 228 crianças, ~1.347 m²)
 * Tipo 2 → equivalente ao Proinfância Tipo C (capacidade 120 crianças, ~768 m²)
 */

import {
  ItemBiblioteca, ModeloAmbiente, ModeloCreche, ServicoAnual, AquisicaoAnual, CargoReferencia,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// BIBLIOTECA DE REFERÊNCIA — Mobiliário & Equipamentos (FNDE/SINAPI)
// ─────────────────────────────────────────────────────────────────────────────

export const mockBibliotecaItens: ItemBiblioteca[] = [
  // ── ITENS DE REFERÊNCIA POR AMBIENTE (FNDE / SINAPI) ──────────────────────
  // COPA
  { id: 'it-cop-001', codigo: 'COP-001', tipo: 'equipamento', descricao: 'ESTERILIZADOR DE MAMADEIRAS PARA MICROONDAS', unidade: 'UN', ambienteClassificacao: 'COPA', valorUnitarioRef: 84.55, categoriasSugeridas: ['cozinha', 'bercario'] },
  { id: 'it-cop-002', codigo: 'COP-002', tipo: 'equipamento', descricao: 'FOGÃO ELÉTRICO 2 BOCAS ANTIADERENTE AÇO INOX', unidade: 'UN', ambienteClassificacao: 'COPA', valorUnitarioRef: 250.00, categoriasSugeridas: ['cozinha'] },
  { id: 'it-cop-003', codigo: 'COP-003', tipo: 'equipamento', descricao: 'MICROONDAS 30L - LINHA BRANCA', unidade: 'UN', ambienteClassificacao: 'COPA', valorUnitarioRef: 389.14, categoriasSugeridas: ['cozinha'] },
  { id: 'it-cop-004', codigo: 'COP-004', tipo: 'equipamento', descricao: 'PURIFICADOR DE ÁGUA', unidade: 'UN', ambienteClassificacao: 'COPA', valorUnitarioRef: 492.99, categoriasSugeridas: ['cozinha', 'refeitorio'] },
  { id: 'it-cop-005', codigo: 'COP-005', tipo: 'equipamento', descricao: 'REFRIGERADOR DOMÉSTICO "FROSTFREE" 300L', unidade: 'UN', ambienteClassificacao: 'COPA', valorUnitarioRef: 1762.21, categoriasSugeridas: ['cozinha'] },
  { id: 'it-cop-006', codigo: 'COP-006', tipo: 'equipamento', descricao: 'CISTERNA 300L', unidade: 'UN', ambienteClassificacao: 'COPA', valorUnitarioRef: 649.00, categoriasSugeridas: ['cozinha', 'outros'] },

  // FRALDÁRIO / SANITÁRIOS
  { id: 'it-fra-001', codigo: 'FRA-001', tipo: 'mobiliario', descricao: 'COLCHONETE PARA TROCADOR', unidade: 'UN', ambienteClassificacao: 'FRALDÁRIO / SANITÁRIOS', valorUnitarioRef: 23.01, categoriasSugeridas: ['bercario', 'banheiro-infantil'] },
  { id: 'it-fra-002', codigo: 'FRA-002', tipo: 'mobiliario', descricao: 'LIXEIRA COM PEDAL 50L', unidade: 'UN', ambienteClassificacao: 'FRALDÁRIO / SANITÁRIOS', valorUnitarioRef: 150.09, categoriasSugeridas: ['banheiro-infantil', 'banheiro-adulto', 'cozinha'] },

  // PÁTIO INFANTIL COBERTO / REFEITÓRIO
  { id: 'it-pat-001', codigo: 'PAT-001', tipo: 'equipamento', descricao: 'BEBEDOURO ELÉTRICO ACESSÍVEL', unidade: 'UN', ambienteClassificacao: 'PÁTIO INFANTIL COBERTO / REFEITÓRIO', valorUnitarioRef: 1859.83, categoriasSugeridas: ['refeitorio', 'area-descoberta'] },
  { id: 'it-pat-002', codigo: 'PAT-002', tipo: 'mobiliario', descricao: 'CONJUNTO REFEITÓRIO 1 - 1 MESA + 4 CADEIRAS', unidade: 'CONJ', ambienteClassificacao: 'PÁTIO INFANTIL COBERTO / REFEITÓRIO', valorUnitarioRef: 1436.76, categoriasSugeridas: ['refeitorio'] },
  { id: 'it-pat-003', codigo: 'PAT-003', tipo: 'mobiliario', descricao: 'CONJUNTO REFEITÓRIO 3 - 1 MESA + 4 CADEIRAS', unidade: 'CONJ', ambienteClassificacao: 'PÁTIO INFANTIL COBERTO / REFEITÓRIO', valorUnitarioRef: 1538.96, categoriasSugeridas: ['refeitorio'] },

  // PLAYGROUND
  { id: 'it-pla-001', codigo: 'PLA-001', tipo: 'equipamento', descricao: 'GIRA GIRA CARROSSEL EM POLIETILENO - DIM: 100X49CM (DXA)', unidade: 'UN', ambienteClassificacao: 'PLAYGROUND', valorUnitarioRef: 1951.70, categoriasSugeridas: ['area-descoberta'] },
  { id: 'it-pla-002', codigo: 'PLA-002', tipo: 'mobiliario', descricao: 'CASA DE BONECAS', unidade: 'UN', ambienteClassificacao: 'PLAYGROUND', valorUnitarioRef: 5372.51, categoriasSugeridas: ['area-descoberta'] },
  { id: 'it-pla-003', codigo: 'PLA-003', tipo: 'equipamento', descricao: 'ESCORREGADOR GRANDE EM POLIETILENO - DIM: 59X115X205CM (LXAXC)', unidade: 'UN', ambienteClassificacao: 'PLAYGROUND', valorUnitarioRef: 737.58, categoriasSugeridas: ['area-descoberta'] },
  { id: 'it-pla-004', codigo: 'PLA-004', tipo: 'equipamento', descricao: 'GANGORRA DUPLA EM POLIETILENO - DIM: 40X47X111CM (LXAXC)', unidade: 'UN', ambienteClassificacao: 'PLAYGROUND', valorUnitarioRef: 236.70, categoriasSugeridas: ['area-descoberta'] },
  { id: 'it-pla-005', codigo: 'PLA-005', tipo: 'equipamento', descricao: 'TÚNEL LÚDICO EM POLIETILENO - DIM: 87X87X214CM (LXAXC)', unidade: 'UN', ambienteClassificacao: 'PLAYGROUND', valorUnitarioRef: 3732.42, categoriasSugeridas: ['area-descoberta'] },

  // SALA DE ATIVIDADES (CRECHE)
  { id: 'it-sac-001', codigo: 'SAC-001', tipo: 'equipamento', descricao: 'APARELHO DE AR CONDICIONADO SPLIT 30.000 BTU\'S', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 3747.14, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sac-002', codigo: 'SAC-002', tipo: 'equipamento', descricao: 'APARELHO DE SOM TIPO MICROSYSTEM', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 184.96, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sac-003', codigo: 'SAC-003', tipo: 'mobiliario', descricao: 'QUADRO MURAL EM FELTRO', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 226.46, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sac-004', codigo: 'SAC-004', tipo: 'equipamento', descricao: 'VENTILADOR DE PAREDE', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 184.96, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sac-005', codigo: 'SAC-005', tipo: 'mobiliario', descricao: 'CAMA EMPILHÁVEL', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 168.96, categoriasSugeridas: ['sala-atividades', 'bercario'] },
  { id: 'it-sac-006', codigo: 'SAC-006', tipo: 'mobiliario', descricao: 'CONJUNTO COLETIVO 1 - 1 MESA + 4 CADEIRAS', unidade: 'CONJ', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 780.95, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sac-007', codigo: 'SAC-007', tipo: 'mobiliario', descricao: 'CONJUNTO PROFESSOR - 1 MESA + 4 CADEIRAS', unidade: 'CONJ', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 431.46, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sac-008', codigo: 'SAC-008', tipo: 'mobiliario', descricao: 'QUADRO BRANCO TIPO LOUSA MAGNÉTICO - 1200X3000', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 536.00, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sac-009', codigo: 'SAC-009', tipo: 'mobiliario', descricao: 'TATAME EM E.V.A', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (CRECHE)', valorUnitarioRef: 57.06, categoriasSugeridas: ['sala-atividades', 'bercario'] },

  // SALA DE ATIVIDADES (PRÉ-ESCOLA)
  { id: 'it-sap-001', codigo: 'SAP-001', tipo: 'equipamento', descricao: 'APARELHO DE AR CONDICIONADO SPLIT 30.000 BTU\'S', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)', valorUnitarioRef: 3747.14, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sap-002', codigo: 'SAP-002', tipo: 'equipamento', descricao: 'APARELHO DE SOM TIPO MICROSYSTEM', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)', valorUnitarioRef: 184.96, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sap-003', codigo: 'SAP-003', tipo: 'mobiliario', descricao: 'QUADRO MURAL EM FELTRO', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)', valorUnitarioRef: 226.46, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sap-004', codigo: 'SAP-004', tipo: 'equipamento', descricao: 'VENTILADOR DE PAREDE', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)', valorUnitarioRef: 184.96, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sap-005', codigo: 'SAP-005', tipo: 'mobiliario', descricao: 'CONJUNTO ALUNO 1 - 1 MESA + 1 CADEIRA', unidade: 'CONJ', ambienteClassificacao: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)', valorUnitarioRef: 239.09, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sap-006', codigo: 'SAP-006', tipo: 'mobiliario', descricao: 'CONJUNTO ALUNO 3 - 1 MESA + 1 CADEIRA', unidade: 'CONJ', ambienteClassificacao: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)', valorUnitarioRef: 238.07, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sap-007', codigo: 'SAP-007', tipo: 'mobiliario', descricao: 'CONJUNTO PROFESSOR - 1 MESA + 1 CADEIRA', unidade: 'CONJ', ambienteClassificacao: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)', valorUnitarioRef: 431.46, categoriasSugeridas: ['sala-atividades'] },
  { id: 'it-sap-008', codigo: 'SAP-008', tipo: 'mobiliario', descricao: 'QUADRO BRANCO TIPO LOUSA MAGNÉTICO - 1200X3000', unidade: 'UN', ambienteClassificacao: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)', valorUnitarioRef: 536.00, categoriasSugeridas: ['sala-atividades'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENTES PADRÃO FNDE
// Custo construção referência SINAPI/RO 2024: R$ 4.950/m² (Rondônia, CUB médio)
// ─────────────────────────────────────────────────────────────────────────────

const CUB = 4950; // R$/m² — referência SINAPI RO 2024

export const mockModelosAmbiente: ModeloAmbiente[] = [
  // ── 1. SALA DE ATIVIDADES (CRECHE) ─────────────────────────────────────────
  {
    id: 'ma01',
    nome: 'SALA DE ATIVIDADES (CRECHE)',
    categoria: 'sala-atividades',
    areaMq: 48,
    custoConstrucaoMq: CUB,
    padrao: true,
    capacidadeAlunos: 20,
    itens: [
      { id: 'i-sac-01', bibliotecaId: 'it-sac-001', tipo: 'equipamento', descricao: 'APARELHO DE AR CONDICIONADO SPLIT 30.000 BTU\'S', quantidade: 1, valorUnitario: 3747.14 },
      { id: 'i-sac-02', bibliotecaId: 'it-sac-002', tipo: 'equipamento', descricao: 'APARELHO DE SOM TIPO MICROSYSTEM', quantidade: 1, valorUnitario: 184.96 },
      { id: 'i-sac-03', bibliotecaId: 'it-sac-003', tipo: 'mobiliario', descricao: 'QUADRO MURAL EM FELTRO', quantidade: 2, valorUnitario: 226.46 },
      { id: 'i-sac-04', bibliotecaId: 'it-sac-004', tipo: 'equipamento', descricao: 'VENTILADOR DE PAREDE', quantidade: 2, valorUnitario: 184.96 },
      { id: 'i-sac-05', bibliotecaId: 'it-sac-005', tipo: 'mobiliario', descricao: 'CAMA EMPILHÁVEL', quantidade: 20, valorUnitario: 168.96 },
      { id: 'i-sac-06', bibliotecaId: 'it-sac-006', tipo: 'mobiliario', descricao: 'CONJUNTO COLETIVO 1 - 1 MESA + 4 CADEIRAS', quantidade: 5, valorUnitario: 780.95 },
      { id: 'i-sac-07', bibliotecaId: 'it-sac-007', tipo: 'mobiliario', descricao: 'CONJUNTO PROFESSOR - 1 MESA + 4 CADEIRAS', quantidade: 1, valorUnitario: 431.46 },
      { id: 'i-sac-08', bibliotecaId: 'it-sac-008', tipo: 'mobiliario', descricao: 'QUADRO BRANCO TIPO LOUSA MAGNÉTICO - 1200X3000', quantidade: 1, valorUnitario: 536.00 },
      { id: 'i-sac-09', bibliotecaId: 'it-sac-009', tipo: 'mobiliario', descricao: 'TATAME EM E.V.A', quantidade: 10, valorUnitario: 57.06 },
    ],
  },

  // ── 2. SALA DE ATIVIDADES (PRÉ-ESCOLA) ──────────────────────────────────────
  {
    id: 'ma02',
    nome: 'SALA DE ATIVIDADES (PRÉ-ESCOLA)',
    categoria: 'sala-atividades',
    areaMq: 48,
    custoConstrucaoMq: CUB,
    padrao: true,
    capacidadeAlunos: 25,
    itens: [
      { id: 'i-sap-01', bibliotecaId: 'it-sap-001', tipo: 'equipamento', descricao: 'APARELHO DE AR CONDICIONADO SPLIT 30.000 BTU\'S', quantidade: 1, valorUnitario: 3747.14 },
      { id: 'i-sap-02', bibliotecaId: 'it-sap-002', tipo: 'equipamento', descricao: 'APARELHO DE SOM TIPO MICROSYSTEM', quantidade: 1, valorUnitario: 184.96 },
      { id: 'i-sap-03', bibliotecaId: 'it-sap-003', tipo: 'mobiliario', descricao: 'QUADRO MURAL EM FELTRO', quantidade: 2, valorUnitario: 226.46 },
      { id: 'i-sap-04', bibliotecaId: 'it-sap-004', tipo: 'equipamento', descricao: 'VENTILADOR DE PAREDE', quantidade: 2, valorUnitario: 184.96 },
      { id: 'i-sap-05', bibliotecaId: 'it-sap-005', tipo: 'mobiliario', descricao: 'CONJUNTO ALUNO 1 - 1 MESA + 1 CADEIRA', quantidade: 12, valorUnitario: 239.09 },
      { id: 'i-sap-06', bibliotecaId: 'it-sap-006', tipo: 'mobiliario', descricao: 'CONJUNTO ALUNO 3 - 1 MESA + 1 CADEIRA', quantidade: 13, valorUnitario: 238.07 },
      { id: 'i-sap-07', bibliotecaId: 'it-sap-007', tipo: 'mobiliario', descricao: 'CONJUNTO PROFESSOR - 1 MESA + 1 CADEIRA', quantidade: 1, valorUnitario: 431.46 },
      { id: 'i-sap-08', bibliotecaId: 'it-sap-008', tipo: 'mobiliario', descricao: 'QUADRO BRANCO TIPO LOUSA MAGNÉTICO - 1200X3000', quantidade: 1, valorUnitario: 536.00 },
    ],
  },

  // ── 3. COPA ───────────────────────────────────────────────────────────────
  {
    id: 'ma07',
    nome: 'COPA',
    categoria: 'cozinha',
    areaMq: 25,
    custoConstrucaoMq: CUB * 1.2,
    padrao: true,
    itens: [
      { id: 'i-cop-01', bibliotecaId: 'it-cop-001', tipo: 'equipamento', descricao: 'ESTERILIZADOR DE MAMADEIRAS PARA MICROONDAS', quantidade: 2, valorUnitario: 84.55 },
      { id: 'i-cop-02', bibliotecaId: 'it-cop-002', tipo: 'equipamento', descricao: 'FOGÃO ELÉTRICO 2 BOCAS ANTIADERENTE AÇO INOX', quantidade: 2, valorUnitario: 250.00 },
      { id: 'i-cop-03', bibliotecaId: 'it-cop-003', tipo: 'equipamento', descricao: 'MICROONDAS 30L - LINHA BRANCA', quantidade: 2, valorUnitario: 389.14 },
      { id: 'i-cop-04', bibliotecaId: 'it-cop-004', tipo: 'equipamento', descricao: 'PURIFICADOR DE ÁGUA', quantidade: 2, valorUnitario: 492.99 },
      { id: 'i-cop-05', bibliotecaId: 'it-cop-005', tipo: 'equipamento', descricao: 'REFRIGERADOR DOMÉSTICO "FROSTFREE" 300L', quantidade: 2, valorUnitario: 1762.21 },
      { id: 'i-cop-06', bibliotecaId: 'it-cop-006', tipo: 'equipamento', descricao: 'CISTERNA 300L', quantidade: 1, valorUnitario: 649.00 },
    ],
  },

  // ── 4. FRALDÁRIO / SANITÁRIOS ─────────────────────────────────────────────
  {
    id: 'ma04',
    nome: 'FRALDÁRIO / SANITÁRIOS',
    categoria: 'fraldario',
    areaMq: 18,
    custoConstrucaoMq: CUB * 1.3,
    padrao: true,
    itens: [
      { id: 'i-fra-01', bibliotecaId: 'it-fra-001', tipo: 'mobiliario', descricao: 'COLCHONETE PARA TROCADOR', quantidade: 4, valorUnitario: 23.01 },
      { id: 'i-fra-02', bibliotecaId: 'it-fra-002', tipo: 'mobiliario', descricao: 'LIXEIRA COM PEDAL 50L', quantidade: 4, valorUnitario: 150.09 },
    ],
  },

  // ── 5. PÁTIO INFANTIL COBERTO / REFEITÓRIO ────────────────────────────────
  {
    id: 'ma06',
    nome: 'PÁTIO INFANTIL COBERTO / REFEITÓRIO',
    categoria: 'refeitorio',
    areaMq: 100,
    custoConstrucaoMq: CUB * 0.9,
    padrao: true,
    itens: [
      { id: 'i-pat-01', bibliotecaId: 'it-pat-001', tipo: 'equipamento', descricao: 'BEBEDOURO ELÉTRICO ACESSÍVEL', quantidade: 2, valorUnitario: 1859.83 },
      { id: 'i-pat-02', bibliotecaId: 'it-pat-002', tipo: 'mobiliario', descricao: 'CONJUNTO REFEITÓRIO 1 - 1 MESA + 4 CADEIRAS', quantidade: 10, valorUnitario: 1436.76 },
      { id: 'i-pat-03', bibliotecaId: 'it-pat-003', tipo: 'mobiliario', descricao: 'CONJUNTO REFEITÓRIO 3 - 1 MESA + 4 CADEIRAS', quantidade: 10, valorUnitario: 1538.96 },
    ],
  },

  // ── 6. PLAYGROUND ─────────────────────────────────────────────────────────
  {
    id: 'ma15',
    nome: 'PLAYGROUND',
    categoria: 'area-descoberta',
    areaMq: 150,
    custoConstrucaoMq: CUB * 0.4,
    padrao: true,
    itens: [
      { id: 'i-pla-01', bibliotecaId: 'it-pla-001', tipo: 'equipamento', descricao: 'GIRA GIRA CARROSSEL EM POLIETILENO - DIM: 100X49CM (DXA)', quantidade: 1, valorUnitario: 1951.70 },
      { id: 'i-pla-02', bibliotecaId: 'it-pla-002', tipo: 'mobiliario', descricao: 'CASA DE BONECAS', quantidade: 1, valorUnitario: 5372.51 },
      { id: 'i-pla-03', bibliotecaId: 'it-pla-003', tipo: 'equipamento', descricao: 'ESCORREGADOR GRANDE EM POLIETILENO - DIM: 59X115X205CM (LXAXC)', quantidade: 2, valorUnitario: 737.58 },
      { id: 'i-pla-04', bibliotecaId: 'it-pla-004', tipo: 'equipamento', descricao: 'GANGORRA DUPLA EM POLIETILENO - DIM: 40X47X111CM (LXAXC)', quantidade: 2, valorUnitario: 236.70 },
      { id: 'i-pla-05', bibliotecaId: 'it-pla-005', tipo: 'equipamento', descricao: 'TÚNEL LÚDICO EM POLIETILENO - DIM: 87X87X214CM (LXAXC)', quantidade: 1, valorUnitario: 3732.42 },
    ],
  },

  // ── Ambientes de Apoio ───────────────────────────────────────────────────
  {
    id: 'ma03',
    nome: 'SOLÁRIO',
    categoria: 'solario',
    areaMq: 28,
    custoConstrucaoMq: CUB * 0.6,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma05',
    nome: 'SALA DE AMAMENTAÇÃO',
    categoria: 'sala-amamentacao',
    areaMq: 10,
    custoConstrucaoMq: CUB,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma08',
    nome: 'DESPENSA',
    categoria: 'despensa',
    areaMq: 12,
    custoConstrucaoMq: CUB * 0.8,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma09',
    nome: 'LAVANDERIA',
    categoria: 'lavanderia',
    areaMq: 16,
    custoConstrucaoMq: CUB * 1.1,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma10',
    nome: 'ADMINISTRAÇÃO / SECRETARIA',
    categoria: 'administracao',
    areaMq: 30,
    custoConstrucaoMq: CUB,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma11',
    nome: 'SALA DE PROFESSORES',
    categoria: 'sala-professores',
    areaMq: 22,
    custoConstrucaoMq: CUB,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma12',
    nome: 'SALA DE RECURSOS (AEE)',
    categoria: 'sala-recursos',
    areaMq: 36,
    custoConstrucaoMq: CUB,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma13',
    nome: 'BANHEIRO INFANTIL',
    categoria: 'banheiro-infantil',
    areaMq: 9,
    custoConstrucaoMq: CUB * 1.4,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma14',
    nome: 'BANHEIRO ADULTO / PCD',
    categoria: 'banheiro-adulto',
    areaMq: 6,
    custoConstrucaoMq: CUB * 1.5,
    padrao: true,
    itens: [],
  },
  {
    id: 'ma16',
    nome: 'GUARITA / CONTROLE DE ACESSO',
    categoria: 'guarita',
    areaMq: 6,
    custoConstrucaoMq: CUB,
    padrao: true,
    itens: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODELOS DE CRECHE — FNDE Tipo 1 (Proinfância B) e Tipo 2 (Proinfância C)
// ─────────────────────────────────────────────────────────────────────────────

export const mockModelosCreche: ModeloCreche[] = [
  // ── FNDE TIPO 1 — PROINFÂNCIA B ──────────────────────────────────────────
  // Capacidade: 228 crianças | Área total aprox.: 1.347 m²
  {
    id: 'mc01',
    nome: 'CRECHE FNDE TIPO 1 (PROINFÂNCIA B)',
    tipoBase: 'tipo1',
    descricao: 'MODELO PADRÃO FNDE — PROINFÂNCIA TIPO B. CAPACIDADE PARA 228 CRIANÇAS EM PERÍODO INTEGRAL. 10 SALAS DE ATIVIDADES.',
    reservaPct: 10,
    capacidadeAlunos: 228,
    ambientes: [
      { id: 'mca01', modeloAmbienteId: 'ma01', nomeOverride: 'SALA DE ATIVIDADES (CRECHE) (×10)', quantidade: 10 },
      { id: 'mca02', modeloAmbienteId: 'ma02', quantidade: 2 },
      { id: 'mca03', modeloAmbienteId: 'ma03', quantidade: 2 },
      { id: 'mca04', modeloAmbienteId: 'ma04', quantidade: 4 },
      { id: 'mca05', modeloAmbienteId: 'ma05', quantidade: 1 },
      { id: 'mca06', modeloAmbienteId: 'ma06', quantidade: 1 },
      { id: 'mca07', modeloAmbienteId: 'ma07', quantidade: 1 },
      { id: 'mca08', modeloAmbienteId: 'ma08', quantidade: 1 },
      { id: 'mca09', modeloAmbienteId: 'ma09', quantidade: 1 },
      { id: 'mca10', modeloAmbienteId: 'ma10', quantidade: 1 },
      { id: 'mca11', modeloAmbienteId: 'ma11', quantidade: 1 },
      { id: 'mca12', modeloAmbienteId: 'ma12', quantidade: 1 },
      { id: 'mca13', modeloAmbienteId: 'ma13', quantidade: 10 },
      { id: 'mca14', modeloAmbienteId: 'ma14', quantidade: 4 },
      { id: 'mca15', modeloAmbienteId: 'ma15', quantidade: 1 },
      { id: 'mca16', modeloAmbienteId: 'ma16', quantidade: 1 },
    ],
    servicos: [
      { id: 'sv02', descricao: 'ENERGIA ELÉTRICA', unidade: 'ANO', valorAnual: 48000 },
      { id: 'sv03', descricao: 'ÁGUA E ESGOTO', unidade: 'ANO', valorAnual: 14400 },
      { id: 'sv04', descricao: 'INTERNET E TELEFONIA', unidade: 'ANO', valorAnual: 7200 },
      { id: 'sv05', descricao: 'VIGILÂNCIA E SEGURANÇA', unidade: 'ANO', valorAnual: 86400 },
      { id: 'sv06', descricao: 'LIMPEZA E HIGIENE (TERCEIRIZADO)', unidade: 'ANO', valorAnual: 72000 },
      { id: 'sv07', descricao: 'MANUTENÇÃO PREDIAL', unidade: 'ANO', valorAnual: 36000 },
    ],
    aquisicoes: [
      { id: 'aq01', descricao: 'MERENDA ESCOLAR (PNAE)', unidade: 'ALUNO/ANO', quantidadeAnual: 228, valorUnitario: 1260 },
      { id: 'aq02', descricao: 'MATERIAL PEDAGÓGICO', unidade: 'ALUNO/ANO', quantidadeAnual: 228, valorUnitario: 480 },
      { id: 'aq03', descricao: 'MATERIAL DE LIMPEZA E HIGIENE', unidade: 'MÊS', quantidadeAnual: 12, valorUnitario: 2800 },
      { id: 'aq04', descricao: 'UNIFORME E EPI (FUNCIONÁRIOS)', unidade: 'ANO', quantidadeAnual: 1, valorUnitario: 18000 },
      { id: 'aq05', descricao: 'GÁS DE COZINHA', unidade: 'MÊS', quantidadeAnual: 12, valorUnitario: 1200 },
    ],
    pessoal: [
      { id: 'mp01', cargoId: 'cg01', quantidade: 1 }, // Diretor
      { id: 'mp02', cargoId: 'cg02', quantidade: 2 }, // Coordenador
      { id: 'mp03', cargoId: 'cg03', quantidade: 20 }, // Professor
      { id: 'mp04', cargoId: 'cg04', quantidade: 10 }, // Monitor
      { id: 'mp05', cargoId: 'cg05', quantidade: 4 }, // Merendeira
      { id: 'mp06', cargoId: 'cg06', quantidade: 4 }, // Aux Limpeza
    ],
  },

  // ── FNDE TIPO 2 — PROINFÂNCIA C ──────────────────────────────────────────
  // Capacidade: 120 crianças | Área total aprox.: 768 m²
  {
    id: 'mc02',
    nome: 'CRECHE FNDE TIPO 2 (PROINFÂNCIA C)',
    tipoBase: 'tipo2',
    descricao: 'MODELO PADRÃO FNDE — PROINFÂNCIA TIPO C. CAPACIDADE PARA 120 CRIANÇAS. 4 SALAS DE ATIVIDADES + 1 BERÇÁRIO.',
    reservaPct: 10,
    capacidadeAlunos: 120,
    ambientes: [
      { id: 'mca20', modeloAmbienteId: 'ma01', nomeOverride: 'SALA DE ATIVIDADES (CRECHE) (×4)', quantidade: 4 },
      { id: 'mca21', modeloAmbienteId: 'ma02', quantidade: 1 },
      { id: 'mca22', modeloAmbienteId: 'ma03', quantidade: 1 },
      { id: 'mca23', modeloAmbienteId: 'ma04', quantidade: 2 },
      { id: 'mca24', modeloAmbienteId: 'ma05', quantidade: 1 },
      { id: 'mca25', modeloAmbienteId: 'ma06', quantidade: 1 },
      { id: 'mca26', modeloAmbienteId: 'ma07', quantidade: 1 },
      { id: 'mca27', modeloAmbienteId: 'ma08', quantidade: 1 },
      { id: 'mca28', modeloAmbienteId: 'ma09', quantidade: 1 },
      { id: 'mca29', modeloAmbienteId: 'ma10', quantidade: 1 },
      { id: 'mca30', modeloAmbienteId: 'ma11', quantidade: 1 },
      { id: 'mca31', modeloAmbienteId: 'ma13', quantidade: 5 },
      { id: 'mca32', modeloAmbienteId: 'ma14', quantidade: 2 },
      { id: 'mca33', modeloAmbienteId: 'ma15', quantidade: 1 },
      { id: 'mca34', modeloAmbienteId: 'ma16', quantidade: 1 },
    ],
    servicos: [
      { id: 'sv11', descricao: 'ENERGIA ELÉTRICA', unidade: 'ANO', valorAnual: 28800 },
      { id: 'sv12', descricao: 'ÁGUA E ESGOTO', unidade: 'ANO', valorAnual: 9600 },
      { id: 'sv13', descricao: 'INTERNET E TELEFONIA', unidade: 'ANO', valorAnual: 7200 },
      { id: 'sv14', descricao: 'VIGILÂNCIA E SEGURANÇA', unidade: 'ANO', valorAnual: 64800 },
      { id: 'sv15', descricao: 'LIMPEZA E HIGIENE (TERCEIRIZADO)', unidade: 'ANO', valorAnual: 48000 },
      { id: 'sv16', descricao: 'MANUTENÇÃO PREDIAL', unidade: 'ANO', valorAnual: 24000 },
    ],
    aquisicoes: [
      { id: 'aq10', descricao: 'MERENDA ESCOLAR (PNAE)', unidade: 'ALUNO/ANO', quantidadeAnual: 120, valorUnitario: 1260 },
      { id: 'aq11', descricao: 'MATERIAL PEDAGÓGICO', unidade: 'ALUNO/ANO', quantidadeAnual: 120, valorUnitario: 480 },
      { id: 'aq12', descricao: 'MATERIAL DE LIMPEZA E HIGIENE', unidade: 'MÊS', quantidadeAnual: 12, valorUnitario: 1800 },
      { id: 'aq13', descricao: 'UNIFORME E EPI (FUNCIONÁRIOS)', unidade: 'ANO', quantidadeAnual: 1, valorUnitario: 12000 },
      { id: 'aq14', descricao: 'GÁS DE COZINHA', unidade: 'MÊS', quantidadeAnual: 12, valorUnitario: 800 },
    ],
    pessoal: [
      { id: 'mp11', cargoId: 'cg01', quantidade: 1 }, // Diretor
      { id: 'mp12', cargoId: 'cg02', quantidade: 1 }, // Coordenador
      { id: 'mp13', cargoId: 'cg03', quantidade: 10 }, // Professor
      { id: 'mp14', cargoId: 'cg04', quantidade: 5 }, // Monitor
      { id: 'mp15', cargoId: 'cg05', quantidade: 2 }, // Merendeira
      { id: 'mp16', cargoId: 'cg06', quantidade: 2 }, // Aux Limpeza
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — cálculos de custo
// ─────────────────────────────────────────────────────────────────────────────

export function calcularCustoAmbiente(ambiente: ModeloAmbiente): {
  obras: number; mobiliario: number; equipamentos: number; total: number;
} {
  const obras = ambiente.areaMq * ambiente.custoConstrucaoMq;
  const mobiliario = ambiente.itens
    .filter(i => i.tipo === 'mobiliario')
    .reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const equipamentos = ambiente.itens
    .filter(i => i.tipo === 'equipamento')
    .reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  return { obras, mobiliario, equipamentos, total: obras + mobiliario + equipamentos };
}

export const mockCargosReferencia: CargoReferencia[] = [
  { id: 'cg01', descricao: 'DIRETOR ESCOLAR', remuneracaoBase: 6500, auxilios: 500, patronal: 1300 },
  { id: 'cg02', descricao: 'COORDENADOR PEDAGÓGICO', remuneracaoBase: 5800, auxilios: 500, patronal: 1160 },
  { id: 'cg03', descricao: 'PROFESSOR EDUCAÇÃO INFANTIL (40H)', remuneracaoBase: 4420, auxilios: 500, patronal: 884 },
  { id: 'cg04', descricao: 'MONITOR/AUXILIAR DE CRECHE', remuneracaoBase: 2200, auxilios: 350, patronal: 440 },
  { id: 'cg05', descricao: 'MERENDEIRA/COZINHEIRA', remuneracaoBase: 1800, auxilios: 350, patronal: 360 },
  { id: 'cg06', descricao: 'AUXILIAR DE LIMPEZA', remuneracaoBase: 1500, auxilios: 350, patronal: 300 },
];

export function calcularCustoCreche(
  modelo: ModeloCreche,
  ambientes: ModeloAmbiente[],
  cargosRef: CargoReferencia[] = mockCargosReferencia
): {
  obras: number; mobiliario: number; equipamentos: number;
  reserva: number; investimento: number;
  custeioAnual: number;
  detalheCusteio: { pessoal: number; servicos: number; aquisicoes: number };
} {
  let obras = 0, mobiliario = 0, equipamentos = 0;
  for (const ma of modelo.ambientes) {
    const amb = ambientes.find(a => a.id === ma.modeloAmbienteId);
    if (!amb) continue;
    const c = calcularCustoAmbiente(amb);
    obras += c.obras * ma.quantidade;
    mobiliario += c.mobiliario * ma.quantidade;
    equipamentos += c.equipamentos * ma.quantidade;
  }
  const subtotal = obras + mobiliario + equipamentos;
  const reserva = subtotal * (modelo.reservaPct / 100);
  const investimento = subtotal + reserva;
  
  const custoPessoal = (modelo.pessoal || []).reduce((sum, p) => {
    const cargo = cargosRef.find(c => c.id === p.cargoId);
    if (!cargo) return sum;
    const custoMensal = cargo.remuneracaoBase + cargo.auxilios + cargo.patronal;
    return sum + (custoMensal * 13.33 * p.quantidade); // 13.33 = 12 meses + 13º + 1/3 férias
  }, 0);

  const custoServicos = modelo.servicos.reduce((s, sv) => s + sv.valorAnual, 0);
  const custoAquisicoes = modelo.aquisicoes.reduce((s, aq) => s + aq.quantidadeAnual * aq.valorUnitario, 0);

  const custeioAnual = custoPessoal + custoServicos + custoAquisicoes;

  return { 
    obras, mobiliario, equipamentos, reserva, investimento, custeioAnual,
    detalheCusteio: { pessoal: custoPessoal, servicos: custoServicos, aquisicoes: custoAquisicoes }
  };
}

export const mockServicosReferencia: ServicoAnual[] = [
  { id: 'ref-sv01', descricao: 'PESSOAL (PROFESSORES, AUXILIARES, DIREÇÃO)', unidade: 'ANO', valorAnual: 1420000 },
  { id: 'ref-sv02', descricao: 'ENERGIA ELÉTRICA', unidade: 'ANO', valorAnual: 48000 },
  { id: 'ref-sv03', descricao: 'ÁGUA E ESGOTO', unidade: 'ANO', valorAnual: 14400 },
  { id: 'ref-sv04', descricao: 'INTERNET E TELEFONIA', unidade: 'ANO', valorAnual: 7200 },
  { id: 'ref-sv05', descricao: 'VIGILÂNCIA E SEGURANÇA', unidade: 'ANO', valorAnual: 86400 },
  { id: 'ref-sv06', descricao: 'LIMPEZA E HIGIENE (TERCEIRIZADO)', unidade: 'ANO', valorAnual: 72000 },
  { id: 'ref-sv07', descricao: 'MANUTENÇÃO PREDIAL', unidade: 'ANO', valorAnual: 36000 },
];

export const mockAquisicoesReferencia: AquisicaoAnual[] = [
  { id: 'ref-aq01', descricao: 'MERENDA ESCOLAR (PNAE)', unidade: 'ALUNO/ANO', quantidadeAnual: 120, valorUnitario: 1260 },
  { id: 'ref-aq02', descricao: 'MATERIAL PEDAGÓGICO', unidade: 'ALUNO/ANO', quantidadeAnual: 120, valorUnitario: 480 },
  { id: 'ref-aq03', descricao: 'MATERIAL DE LIMPEZA E HIGIENE', unidade: 'MÊS', quantidadeAnual: 12, valorUnitario: 1800 },
  { id: 'ref-aq04', descricao: 'UNIFORME E EPI (FUNCIONÁRIOS)', unidade: 'ANO', quantidadeAnual: 1, valorUnitario: 12000 },
  { id: 'ref-aq05', descricao: 'GÁS DE COZINHA', unidade: 'MÊS', quantidadeAnual: 12, valorUnitario: 800 },
];

