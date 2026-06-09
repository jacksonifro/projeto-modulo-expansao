/**
 * Dados de referência para Configuração de Custo
 * Baseados nas especificações do FNDE — Programa Proinfância (Tipos B e C)
 * e SINAPI/RO (Rondônia) — referência 2024/2025
 *
 * Tipo 1 → equivalente ao Proinfância Tipo B (capacidade 228 crianças, ~1.347 m²)
 * Tipo 2 → equivalente ao Proinfância Tipo C (capacidade 120 crianças, ~768 m²)
 */

import {
  ItemBiblioteca, ModeloAmbiente, ModeloCreche, ServicoAnual, AquisicaoAnual,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// BIBLIOTECA DE REFERÊNCIA — Mobiliário & Equipamentos (FNDE/SINAPI)
// ─────────────────────────────────────────────────────────────────────────────

export const mockBibliotecaItens: ItemBiblioteca[] = [
  // ── Mobiliário Sala de Atividades ───────────────────────────────────────
  { id: 'b001', codigo: 'M-SAL-001', tipo: 'mobiliario', descricao: 'Mesa infantil trapezoidal 120x60cm', unidade: 'un', valorUnitarioRef: 420, categoriasSugeridas: ['sala-atividades', 'sala-recursos'] },
  { id: 'b002', codigo: 'M-SAL-002', tipo: 'mobiliario', descricao: 'Cadeira infantil PP sem braço', unidade: 'un', valorUnitarioRef: 148, categoriasSugeridas: ['sala-atividades', 'refeitorio', 'sala-recursos'] },
  { id: 'b003', codigo: 'M-SAL-003', tipo: 'mobiliario', descricao: 'Mesa professor 120x60cm c/ gaveta', unidade: 'un', valorUnitarioRef: 780, categoriasSugeridas: ['sala-atividades', 'bercario', 'sala-professores', 'sala-recursos'] },
  { id: 'b004', codigo: 'M-SAL-004', tipo: 'mobiliario', descricao: 'Cadeira ergonômica professor', unidade: 'un', valorUnitarioRef: 520, categoriasSugeridas: ['sala-atividades', 'bercario', 'administracao', 'sala-professores'] },
  { id: 'b005', codigo: 'M-SAL-005', tipo: 'mobiliario', descricao: 'Armário baixo 120x40x80cm c/ 2 portas', unidade: 'un', valorUnitarioRef: 1380, categoriasSugeridas: ['sala-atividades', 'sala-recursos'] },
  { id: 'b006', codigo: 'M-SAL-006', tipo: 'mobiliario', descricao: 'Estante aberta para livros/material pedagógico', unidade: 'un', valorUnitarioRef: 720, categoriasSugeridas: ['sala-atividades', 'sala-professores', 'sala-recursos'] },
  { id: 'b007', codigo: 'M-SAL-007', tipo: 'mobiliario', descricao: 'Quadro branco magnético 200x120cm', unidade: 'un', valorUnitarioRef: 580, categoriasSugeridas: ['sala-atividades', 'sala-recursos', 'sala-professores'] },
  { id: 'b008', codigo: 'M-SAL-008', tipo: 'mobiliario', descricao: 'Cabide/gancho individual com placa identificação', unidade: 'un', valorUnitarioRef: 68, categoriasSugeridas: ['sala-atividades', 'bercario'] },

  // ── Mobiliário Berçário ─────────────────────────────────────────────────
  { id: 'b010', codigo: 'M-BER-001', tipo: 'mobiliario', descricao: 'Berço grade móvel colchão incluso', unidade: 'un', valorUnitarioRef: 1250, categoriasSugeridas: ['bercario'] },
  { id: 'b011', codigo: 'M-BER-002', tipo: 'mobiliario', descricao: 'Mesa trocador c/ cuba e gradil', unidade: 'un', valorUnitarioRef: 1680, categoriasSugeridas: ['bercario', 'fraldario'] },
  { id: 'b012', codigo: 'M-BER-003', tipo: 'mobiliario', descricao: 'Poltrona amamentação c/ apoio lateral', unidade: 'un', valorUnitarioRef: 1450, categoriasSugeridas: ['bercario', 'sala-amamentacao'] },
  { id: 'b013', codigo: 'M-BER-004', tipo: 'mobiliario', descricao: 'Armário alto 2 portas para enxoval', unidade: 'un', valorUnitarioRef: 1680, categoriasSugeridas: ['bercario', 'lavanderia'] },
  { id: 'b014', codigo: 'M-BER-005', tipo: 'mobiliario', descricao: 'Colchonete tatame espuma D33 100x50cm', unidade: 'un', valorUnitarioRef: 185, categoriasSugeridas: ['bercario', 'sala-atividades'] },

  // ── Mobiliário Refeitório ───────────────────────────────────────────────
  { id: 'b020', codigo: 'M-REF-001', tipo: 'mobiliario', descricao: 'Mesa refeitório infantil 4 lugares', unidade: 'un', valorUnitarioRef: 820, categoriasSugeridas: ['refeitorio'] },
  { id: 'b021', codigo: 'M-REF-002', tipo: 'mobiliario', descricao: 'Balcão de distribuição aço inox 200cm', unidade: 'un', valorUnitarioRef: 4200, categoriasSugeridas: ['refeitorio'] },
  { id: 'b022', codigo: 'M-REF-003', tipo: 'mobiliario', descricao: 'Armário aço 4 portas', unidade: 'un', valorUnitarioRef: 2100, categoriasSugeridas: ['refeitorio', 'cozinha', 'deposito', 'lavanderia'] },

  // ── Mobiliário Cozinha ──────────────────────────────────────────────────
  { id: 'b030', codigo: 'M-COZ-001', tipo: 'mobiliario', descricao: 'Mesa trabalho aço inox 150x70cm', unidade: 'un', valorUnitarioRef: 2800, categoriasSugeridas: ['cozinha'] },
  { id: 'b031', codigo: 'M-COZ-002', tipo: 'mobiliario', descricao: 'Cuba aço inox dupla 120x60cm', unidade: 'un', valorUnitarioRef: 1380, categoriasSugeridas: ['cozinha', 'lavanderia'] },
  { id: 'b032', codigo: 'M-COZ-003', tipo: 'mobiliario', descricao: 'Prateleira aço inox 120x40cm', unidade: 'un', valorUnitarioRef: 580, categoriasSugeridas: ['cozinha', 'despensa'] },
  { id: 'b033', codigo: 'M-COZ-004', tipo: 'mobiliario', descricao: 'Carrinho transporte aço inox 2 prateleiras', unidade: 'un', valorUnitarioRef: 1120, categoriasSugeridas: ['cozinha', 'refeitorio'] },

  // ── Mobiliário Administração ────────────────────────────────────────────
  { id: 'b040', codigo: 'M-ADM-001', tipo: 'mobiliario', descricao: 'Mesa escritório L 150x150cm c/ gavetas', unidade: 'un', valorUnitarioRef: 1480, categoriasSugeridas: ['administracao'] },
  { id: 'b041', codigo: 'M-ADM-002', tipo: 'mobiliario', descricao: 'Cadeira escritório com rodízios', unidade: 'un', valorUnitarioRef: 780, categoriasSugeridas: ['administracao', 'sala-professores'] },
  { id: 'b042', codigo: 'M-ADM-003', tipo: 'mobiliario', descricao: 'Armário arquivo 4 gavetas', unidade: 'un', valorUnitarioRef: 2200, categoriasSugeridas: ['administracao'] },
  { id: 'b043', codigo: 'M-ADM-004', tipo: 'mobiliario', descricao: 'Mesa reunião 180x90cm', unidade: 'un', valorUnitarioRef: 2600, categoriasSugeridas: ['administracao', 'sala-professores'] },
  { id: 'b044', codigo: 'M-ADM-005', tipo: 'mobiliario', descricao: 'Cadeira visita fixa sem rodízios', unidade: 'un', valorUnitarioRef: 340, categoriasSugeridas: ['administracao', 'sala-professores'] },
  { id: 'b045', codigo: 'M-ADM-006', tipo: 'mobiliario', descricao: 'Sofá 3 lugares espera', unidade: 'un', valorUnitarioRef: 3200, categoriasSugeridas: ['administracao'] },
  { id: 'b046', codigo: 'M-ADM-007', tipo: 'mobiliario', descricao: 'Armário alto 2 portas com chave', unidade: 'un', valorUnitarioRef: 1800, categoriasSugeridas: ['administracao', 'sala-professores'] },

  // ── Equipamentos Sala de Atividades ─────────────────────────────────────
  { id: 'b060', codigo: 'E-SAL-001', tipo: 'equipamento', descricao: 'Ar condicionado split 9.000 BTU', unidade: 'un', valorUnitarioRef: 2450, categoriasSugeridas: ['sala-atividades', 'bercario', 'administracao', 'sala-professores'] },
  { id: 'b061', codigo: 'E-SAL-002', tipo: 'equipamento', descricao: 'TV LED 50" c/ suporte articulado', unidade: 'un', valorUnitarioRef: 2980, categoriasSugeridas: ['sala-atividades', 'sala-recursos', 'sala-professores'] },
  { id: 'b062', codigo: 'E-SAL-003', tipo: 'equipamento', descricao: 'Aparelho de som bluetooth', unidade: 'un', valorUnitarioRef: 680, categoriasSugeridas: ['sala-atividades', 'refeitorio'] },

  // ── Equipamentos Berçário / Fraldário ────────────────────────────────────
  { id: 'b070', codigo: 'E-BER-001', tipo: 'equipamento', descricao: 'Ar condicionado split 12.000 BTU', unidade: 'un', valorUnitarioRef: 3100, categoriasSugeridas: ['bercario', 'sala-amamentacao'] },
  { id: 'b071', codigo: 'E-BER-002', tipo: 'equipamento', descricao: 'Babá eletrônica monitor de vídeo', unidade: 'un', valorUnitarioRef: 850, categoriasSugeridas: ['bercario'] },
  { id: 'b072', codigo: 'E-BER-003', tipo: 'equipamento', descricao: 'Freezer vertical 280L', unidade: 'un', valorUnitarioRef: 2900, categoriasSugeridas: ['bercario', 'cozinha'] },

  // ── Equipamentos Cozinha ────────────────────────────────────────────────
  { id: 'b080', codigo: 'E-COZ-001', tipo: 'equipamento', descricao: 'Fogão industrial 6 bocas c/ forno', unidade: 'un', valorUnitarioRef: 5800, categoriasSugeridas: ['cozinha'] },
  { id: 'b081', codigo: 'E-COZ-002', tipo: 'equipamento', descricao: 'Geladeira comercial 600L 2 portas', unidade: 'un', valorUnitarioRef: 5200, categoriasSugeridas: ['cozinha'] },
  { id: 'b082', codigo: 'E-COZ-003', tipo: 'equipamento', descricao: 'Freezer horizontal 500L', unidade: 'un', valorUnitarioRef: 3600, categoriasSugeridas: ['cozinha'] },
  { id: 'b083', codigo: 'E-COZ-004', tipo: 'equipamento', descricao: 'Forno combinado 10 GN c/ controle', unidade: 'un', valorUnitarioRef: 12500, categoriasSugeridas: ['cozinha'] },
  { id: 'b084', codigo: 'E-COZ-005', tipo: 'equipamento', descricao: 'Liquidificador industrial 5L', unidade: 'un', valorUnitarioRef: 980, categoriasSugeridas: ['cozinha'] },
  { id: 'b085', codigo: 'E-COZ-006', tipo: 'equipamento', descricao: 'Exaustor/coifa industrial 120cm', unidade: 'un', valorUnitarioRef: 3200, categoriasSugeridas: ['cozinha'] },

  // ── Equipamentos Lavanderia ─────────────────────────────────────────────
  { id: 'b090', codigo: 'E-LAV-001', tipo: 'equipamento', descricao: 'Máquina lavar roupa 15kg', unidade: 'un', valorUnitarioRef: 4200, categoriasSugeridas: ['lavanderia'] },
  { id: 'b091', codigo: 'E-LAV-002', tipo: 'equipamento', descricao: 'Secadora industrial 10kg', unidade: 'un', valorUnitarioRef: 3800, categoriasSugeridas: ['lavanderia'] },
  { id: 'b092', codigo: 'E-LAV-003', tipo: 'equipamento', descricao: 'Ferro de passar industrial a vapor', unidade: 'un', valorUnitarioRef: 2200, categoriasSugeridas: ['lavanderia'] },

  // ── Equipamentos Administração ──────────────────────────────────────────
  { id: 'b100', codigo: 'E-ADM-001', tipo: 'equipamento', descricao: 'Computador desktop c/ monitor 21"', unidade: 'un', valorUnitarioRef: 4200, categoriasSugeridas: ['administracao', 'sala-professores'] },
  { id: 'b101', codigo: 'E-ADM-002', tipo: 'equipamento', descricao: 'Impressora multifuncional laser', unidade: 'un', valorUnitarioRef: 2800, categoriasSugeridas: ['administracao'] },
  { id: 'b102', codigo: 'E-ADM-003', tipo: 'equipamento', descricao: 'Nobreak 1200VA', unidade: 'un', valorUnitarioRef: 980, categoriasSugeridas: ['administracao'] },
  { id: 'b103', codigo: 'E-ADM-004', tipo: 'equipamento', descricao: 'Telefone IP VoIP', unidade: 'un', valorUnitarioRef: 380, categoriasSugeridas: ['administracao'] },

  // ── Equipamentos Área Externa ───────────────────────────────────────────
  { id: 'b110', codigo: 'E-EXT-001', tipo: 'equipamento', descricao: 'Conjunto parquinho (escorregador + balanço + gira-gira)', unidade: 'un', valorUnitarioRef: 18500, categoriasSugeridas: ['area-descoberta'] },
  { id: 'b111', codigo: 'E-EXT-002', tipo: 'equipamento', descricao: 'Casa de boneca/casinha playground', unidade: 'un', valorUnitarioRef: 4800, categoriasSugeridas: ['area-descoberta'] },
  { id: 'b112', codigo: 'E-EXT-003', tipo: 'equipamento', descricao: 'Caixa de areia 200x200cm c/ cobertura', unidade: 'un', valorUnitarioRef: 3200, categoriasSugeridas: ['area-descoberta', 'solario'] },
  { id: 'b113', codigo: 'E-EXT-004', tipo: 'equipamento', descricao: 'Banco externo madeira plástica 200cm', unidade: 'un', valorUnitarioRef: 1200, categoriasSugeridas: ['area-descoberta', 'solario'] },

  // ── Equipamentos Segurança ──────────────────────────────────────────────
  { id: 'b120', codigo: 'E-SEG-001', tipo: 'equipamento', descricao: 'Câmera CFTV dome interno', unidade: 'un', valorUnitarioRef: 420, categoriasSugeridas: ['administracao', 'guarita'] },
  { id: 'b121', codigo: 'E-SEG-002', tipo: 'equipamento', descricao: 'DVR 8 canais c/ HD 1TB', unidade: 'un', valorUnitarioRef: 1800, categoriasSugeridas: ['administracao', 'guarita'] },
  { id: 'b122', codigo: 'E-SEG-003', tipo: 'equipamento', descricao: 'Interfone/videoporteiro c/ câmera', unidade: 'un', valorUnitarioRef: 980, categoriasSugeridas: ['guarita', 'administracao'] },
];

// ─────────────────────────────────────────────────────────────────────────────
// AMBIENTES PADRÃO FNDE
// Custo construção referência SINAPI/RO 2024: R$ 4.950/m² (Rondônia, CUB médio)
// ─────────────────────────────────────────────────────────────────────────────

const CUB = 4950; // R$/m² — referência SINAPI RO 2024

export const mockModelosAmbiente: ModeloAmbiente[] = [
  // ── 1. Sala de Atividades (padrão) ────────────────────────────────────────
  {
    id: 'ma01', nome: 'Sala de Atividades (Padrão)', categoria: 'sala-atividades',
    areaMq: 48, custoConstrucaoMq: CUB, padrao: true,
    itens: [
      { id: 'i001', bibliotecaId: 'b001', tipo: 'mobiliario', descricao: 'Mesa infantil trapezoidal 120x60cm', quantidade: 8, valorUnitario: 420 },
      { id: 'i002', bibliotecaId: 'b002', tipo: 'mobiliario', descricao: 'Cadeira infantil PP sem braço', quantidade: 20, valorUnitario: 148 },
      { id: 'i003', bibliotecaId: 'b003', tipo: 'mobiliario', descricao: 'Mesa professor 120x60cm c/ gaveta', quantidade: 1, valorUnitario: 780 },
      { id: 'i004', bibliotecaId: 'b004', tipo: 'mobiliario', descricao: 'Cadeira ergonômica professor', quantidade: 1, valorUnitario: 520 },
      { id: 'i005', bibliotecaId: 'b005', tipo: 'mobiliario', descricao: 'Armário baixo 120x40x80cm c/ 2 portas', quantidade: 2, valorUnitario: 1380 },
      { id: 'i006', bibliotecaId: 'b006', tipo: 'mobiliario', descricao: 'Estante aberta para livros/material pedagógico', quantidade: 1, valorUnitario: 720 },
      { id: 'i007', bibliotecaId: 'b007', tipo: 'mobiliario', descricao: 'Quadro branco magnético 200x120cm', quantidade: 1, valorUnitario: 580 },
      { id: 'i008', bibliotecaId: 'b008', tipo: 'mobiliario', descricao: 'Cabide/gancho individual com placa', quantidade: 20, valorUnitario: 68 },
      { id: 'i009', bibliotecaId: 'b060', tipo: 'equipamento', descricao: 'Ar condicionado split 9.000 BTU', quantidade: 1, valorUnitario: 2450 },
      { id: 'i010', bibliotecaId: 'b061', tipo: 'equipamento', descricao: 'TV LED 50" c/ suporte articulado', quantidade: 1, valorUnitario: 2980 },
      { id: 'i011', bibliotecaId: 'b062', tipo: 'equipamento', descricao: 'Aparelho de som bluetooth', quantidade: 1, valorUnitario: 680 },
    ],
  },

  // ── 2. Berçário ───────────────────────────────────────────────────────────
  {
    id: 'ma02', nome: 'Berçário', categoria: 'bercario',
    areaMq: 42, custoConstrucaoMq: CUB, padrao: true,
    itens: [
      { id: 'i020', bibliotecaId: 'b010', tipo: 'mobiliario', descricao: 'Berço grade móvel colchão incluso', quantidade: 8, valorUnitario: 1250 },
      { id: 'i021', bibliotecaId: 'b011', tipo: 'mobiliario', descricao: 'Mesa trocador c/ cuba e gradil', quantidade: 2, valorUnitario: 1680 },
      { id: 'i022', bibliotecaId: 'b012', tipo: 'mobiliario', descricao: 'Poltrona amamentação c/ apoio lateral', quantidade: 2, valorUnitario: 1450 },
      { id: 'i023', bibliotecaId: 'b013', tipo: 'mobiliario', descricao: 'Armário alto 2 portas para enxoval', quantidade: 2, valorUnitario: 1680 },
      { id: 'i024', bibliotecaId: 'b003', tipo: 'mobiliario', descricao: 'Mesa professor 120x60cm c/ gaveta', quantidade: 1, valorUnitario: 780 },
      { id: 'i025', bibliotecaId: 'b004', tipo: 'mobiliario', descricao: 'Cadeira ergonômica professor', quantidade: 1, valorUnitario: 520 },
      { id: 'i026', bibliotecaId: 'b070', tipo: 'equipamento', descricao: 'Ar condicionado split 12.000 BTU', quantidade: 2, valorUnitario: 3100 },
      { id: 'i027', bibliotecaId: 'b071', tipo: 'equipamento', descricao: 'Babá eletrônica monitor de vídeo', quantidade: 2, valorUnitario: 850 },
      { id: 'i028', bibliotecaId: 'b072', tipo: 'equipamento', descricao: 'Freezer vertical 280L', quantidade: 1, valorUnitario: 2900 },
    ],
  },

  // ── 3. Solário ────────────────────────────────────────────────────────────
  {
    id: 'ma03', nome: 'Solário', categoria: 'solario',
    areaMq: 28, custoConstrucaoMq: CUB * 0.6, padrao: true,
    itens: [
      { id: 'i030', bibliotecaId: 'b014', tipo: 'mobiliario', descricao: 'Colchonete tatame espuma D33 100x50cm', quantidade: 8, valorUnitario: 185 },
      { id: 'i031', bibliotecaId: 'b112', tipo: 'equipamento', descricao: 'Caixa de areia 200x200cm c/ cobertura', quantidade: 1, valorUnitario: 3200 },
      { id: 'i032', bibliotecaId: 'b113', tipo: 'equipamento', descricao: 'Banco externo madeira plástica 200cm', quantidade: 2, valorUnitario: 1200 },
    ],
  },

  // ── 4. Fraldário ─────────────────────────────────────────────────────────
  {
    id: 'ma04', nome: 'Fraldário', categoria: 'fraldario',
    areaMq: 8, custoConstrucaoMq: CUB * 1.2, padrao: true,
    itens: [
      { id: 'i040', bibliotecaId: 'b011', tipo: 'mobiliario', descricao: 'Mesa trocador c/ cuba e gradil', quantidade: 2, valorUnitario: 1680 },
      { id: 'i041', bibliotecaId: 'b013', tipo: 'mobiliario', descricao: 'Armário alto 2 portas para enxoval', quantidade: 1, valorUnitario: 1680 },
    ],
  },

  // ── 5. Sala de Amamentação ────────────────────────────────────────────────
  {
    id: 'ma05', nome: 'Sala de Amamentação', categoria: 'sala-amamentacao',
    areaMq: 10, custoConstrucaoMq: CUB, padrao: true,
    itens: [
      { id: 'i050', bibliotecaId: 'b012', tipo: 'mobiliario', descricao: 'Poltrona amamentação c/ apoio lateral', quantidade: 2, valorUnitario: 1450 },
      { id: 'i051', bibliotecaId: 'b013', tipo: 'mobiliario', descricao: 'Armário alto 2 portas para enxoval', quantidade: 1, valorUnitario: 1680 },
      { id: 'i052', bibliotecaId: 'b070', tipo: 'equipamento', descricao: 'Ar condicionado split 12.000 BTU', quantidade: 1, valorUnitario: 3100 },
    ],
  },

  // ── 6. Refeitório ─────────────────────────────────────────────────────────
  {
    id: 'ma06', nome: 'Refeitório', categoria: 'refeitorio',
    areaMq: 90, custoConstrucaoMq: CUB * 0.9, padrao: true,
    itens: [
      { id: 'i060', bibliotecaId: 'b020', tipo: 'mobiliario', descricao: 'Mesa refeitório infantil 4 lugares', quantidade: 20, valorUnitario: 820 },
      { id: 'i061', bibliotecaId: 'b002', tipo: 'mobiliario', descricao: 'Cadeira infantil PP sem braço', quantidade: 80, valorUnitario: 148 },
      { id: 'i062', bibliotecaId: 'b021', tipo: 'mobiliario', descricao: 'Balcão de distribuição aço inox 200cm', quantidade: 2, valorUnitario: 4200 },
      { id: 'i063', bibliotecaId: 'b022', tipo: 'mobiliario', descricao: 'Armário aço 4 portas', quantidade: 2, valorUnitario: 2100 },
      { id: 'i064', bibliotecaId: 'b033', tipo: 'mobiliario', descricao: 'Carrinho transporte aço inox', quantidade: 1, valorUnitario: 1120 },
      { id: 'i065', bibliotecaId: 'b062', tipo: 'equipamento', descricao: 'Aparelho de som bluetooth', quantidade: 1, valorUnitario: 680 },
    ],
  },

  // ── 7. Cozinha ────────────────────────────────────────────────────────────
  {
    id: 'ma07', nome: 'Cozinha', categoria: 'cozinha',
    areaMq: 30, custoConstrucaoMq: CUB * 1.3, padrao: true,
    itens: [
      { id: 'i070', bibliotecaId: 'b030', tipo: 'mobiliario', descricao: 'Mesa trabalho aço inox 150x70cm', quantidade: 2, valorUnitario: 2800 },
      { id: 'i071', bibliotecaId: 'b031', tipo: 'mobiliario', descricao: 'Cuba aço inox dupla 120x60cm', quantidade: 2, valorUnitario: 1380 },
      { id: 'i072', bibliotecaId: 'b032', tipo: 'mobiliario', descricao: 'Prateleira aço inox 120x40cm', quantidade: 6, valorUnitario: 580 },
      { id: 'i073', bibliotecaId: 'b033', tipo: 'mobiliario', descricao: 'Carrinho transporte aço inox', quantidade: 2, valorUnitario: 1120 },
      { id: 'i074', bibliotecaId: 'b022', tipo: 'mobiliario', descricao: 'Armário aço 4 portas', quantidade: 2, valorUnitario: 2100 },
      { id: 'i075', bibliotecaId: 'b080', tipo: 'equipamento', descricao: 'Fogão industrial 6 bocas c/ forno', quantidade: 1, valorUnitario: 5800 },
      { id: 'i076', bibliotecaId: 'b081', tipo: 'equipamento', descricao: 'Geladeira comercial 600L 2 portas', quantidade: 1, valorUnitario: 5200 },
      { id: 'i077', bibliotecaId: 'b082', tipo: 'equipamento', descricao: 'Freezer horizontal 500L', quantidade: 1, valorUnitario: 3600 },
      { id: 'i078', bibliotecaId: 'b083', tipo: 'equipamento', descricao: 'Forno combinado 10 GN c/ controle', quantidade: 1, valorUnitario: 12500 },
      { id: 'i079', bibliotecaId: 'b084', tipo: 'equipamento', descricao: 'Liquidificador industrial 5L', quantidade: 2, valorUnitario: 980 },
      { id: 'i080', bibliotecaId: 'b085', tipo: 'equipamento', descricao: 'Exaustor/coifa industrial 120cm', quantidade: 1, valorUnitario: 3200 },
    ],
  },

  // ── 8. Despensa ───────────────────────────────────────────────────────────
  {
    id: 'ma08', nome: 'Despensa', categoria: 'despensa',
    areaMq: 12, custoConstrucaoMq: CUB * 0.8, padrao: true,
    itens: [
      { id: 'i085', bibliotecaId: 'b032', tipo: 'mobiliario', descricao: 'Prateleira aço inox 120x40cm', quantidade: 8, valorUnitario: 580 },
      { id: 'i086', bibliotecaId: 'b022', tipo: 'mobiliario', descricao: 'Armário aço 4 portas', quantidade: 2, valorUnitario: 2100 },
    ],
  },

  // ── 9. Lavanderia ─────────────────────────────────────────────────────────
  {
    id: 'ma09', nome: 'Lavanderia', categoria: 'lavanderia',
    areaMq: 16, custoConstrucaoMq: CUB * 1.1, padrao: true,
    itens: [
      { id: 'i090', bibliotecaId: 'b031', tipo: 'mobiliario', descricao: 'Cuba aço inox dupla 120x60cm', quantidade: 1, valorUnitario: 1380 },
      { id: 'i091', bibliotecaId: 'b013', tipo: 'mobiliario', descricao: 'Armário alto 2 portas para enxoval', quantidade: 2, valorUnitario: 1680 },
      { id: 'i092', bibliotecaId: 'b090', tipo: 'equipamento', descricao: 'Máquina lavar roupa 15kg', quantidade: 2, valorUnitario: 4200 },
      { id: 'i093', bibliotecaId: 'b091', tipo: 'equipamento', descricao: 'Secadora industrial 10kg', quantidade: 1, valorUnitario: 3800 },
      { id: 'i094', bibliotecaId: 'b092', tipo: 'equipamento', descricao: 'Ferro de passar industrial a vapor', quantidade: 1, valorUnitario: 2200 },
    ],
  },

  // ── 10. Administração ─────────────────────────────────────────────────────
  {
    id: 'ma10', nome: 'Administração / Secretaria', categoria: 'administracao',
    areaMq: 30, custoConstrucaoMq: CUB, padrao: true,
    itens: [
      { id: 'i100', bibliotecaId: 'b040', tipo: 'mobiliario', descricao: 'Mesa escritório L 150x150cm c/ gavetas', quantidade: 3, valorUnitario: 1480 },
      { id: 'i101', bibliotecaId: 'b041', tipo: 'mobiliario', descricao: 'Cadeira escritório com rodízios', quantidade: 3, valorUnitario: 780 },
      { id: 'i102', bibliotecaId: 'b042', tipo: 'mobiliario', descricao: 'Armário arquivo 4 gavetas', quantidade: 2, valorUnitario: 2200 },
      { id: 'i103', bibliotecaId: 'b043', tipo: 'mobiliario', descricao: 'Mesa reunião 180x90cm', quantidade: 1, valorUnitario: 2600 },
      { id: 'i104', bibliotecaId: 'b044', tipo: 'mobiliario', descricao: 'Cadeira visita fixa', quantidade: 6, valorUnitario: 340 },
      { id: 'i105', bibliotecaId: 'b045', tipo: 'mobiliario', descricao: 'Sofá 3 lugares espera', quantidade: 1, valorUnitario: 3200 },
      { id: 'i106', bibliotecaId: 'b046', tipo: 'mobiliario', descricao: 'Armário alto 2 portas com chave', quantidade: 2, valorUnitario: 1800 },
      { id: 'i107', bibliotecaId: 'b060', tipo: 'equipamento', descricao: 'Ar condicionado split 9.000 BTU', quantidade: 2, valorUnitario: 2450 },
      { id: 'i108', bibliotecaId: 'b100', tipo: 'equipamento', descricao: 'Computador desktop c/ monitor 21"', quantidade: 3, valorUnitario: 4200 },
      { id: 'i109', bibliotecaId: 'b101', tipo: 'equipamento', descricao: 'Impressora multifuncional laser', quantidade: 1, valorUnitario: 2800 },
      { id: 'i110', bibliotecaId: 'b102', tipo: 'equipamento', descricao: 'Nobreak 1200VA', quantidade: 1, valorUnitario: 980 },
      { id: 'i111', bibliotecaId: 'b103', tipo: 'equipamento', descricao: 'Telefone IP VoIP', quantidade: 2, valorUnitario: 380 },
      { id: 'i112', bibliotecaId: 'b120', tipo: 'equipamento', descricao: 'Câmera CFTV dome interno', quantidade: 4, valorUnitario: 420 },
      { id: 'i113', bibliotecaId: 'b121', tipo: 'equipamento', descricao: 'DVR 8 canais c/ HD 1TB', quantidade: 1, valorUnitario: 1800 },
    ],
  },

  // ── 11. Sala de Professores ───────────────────────────────────────────────
  {
    id: 'ma11', nome: 'Sala de Professores', categoria: 'sala-professores',
    areaMq: 22, custoConstrucaoMq: CUB, padrao: true,
    itens: [
      { id: 'i120', bibliotecaId: 'b040', tipo: 'mobiliario', descricao: 'Mesa escritório L 150x150cm', quantidade: 4, valorUnitario: 1480 },
      { id: 'i121', bibliotecaId: 'b041', tipo: 'mobiliario', descricao: 'Cadeira escritório com rodízios', quantidade: 4, valorUnitario: 780 },
      { id: 'i122', bibliotecaId: 'b046', tipo: 'mobiliario', descricao: 'Armário alto 2 portas com chave (roupeiro)', quantidade: 8, valorUnitario: 1800 },
      { id: 'i123', bibliotecaId: 'b043', tipo: 'mobiliario', descricao: 'Mesa reunião 180x90cm', quantidade: 1, valorUnitario: 2600 },
      { id: 'i124', bibliotecaId: 'b044', tipo: 'mobiliario', descricao: 'Cadeira visita fixa', quantidade: 8, valorUnitario: 340 },
      { id: 'i125', bibliotecaId: 'b006', tipo: 'mobiliario', descricao: 'Estante aberta para livros', quantidade: 2, valorUnitario: 720 },
      { id: 'i126', bibliotecaId: 'b060', tipo: 'equipamento', descricao: 'Ar condicionado split 9.000 BTU', quantidade: 1, valorUnitario: 2450 },
      { id: 'i127', bibliotecaId: 'b100', tipo: 'equipamento', descricao: 'Computador desktop c/ monitor 21"', quantidade: 2, valorUnitario: 4200 },
    ],
  },

  // ── 12. Sala de Recursos Multifuncionais (AEE) ────────────────────────────
  {
    id: 'ma12', nome: 'Sala de Recursos Multifuncionais (AEE)', categoria: 'sala-recursos',
    areaMq: 36, custoConstrucaoMq: CUB, padrao: true,
    itens: [
      { id: 'i130', bibliotecaId: 'b003', tipo: 'mobiliario', descricao: 'Mesa professor 120x60cm c/ gaveta', quantidade: 1, valorUnitario: 780 },
      { id: 'i131', bibliotecaId: 'b004', tipo: 'mobiliario', descricao: 'Cadeira ergonômica professor', quantidade: 1, valorUnitario: 520 },
      { id: 'i132', bibliotecaId: 'b001', tipo: 'mobiliario', descricao: 'Mesa infantil trapezoidal 120x60cm', quantidade: 4, valorUnitario: 420 },
      { id: 'i133', bibliotecaId: 'b002', tipo: 'mobiliario', descricao: 'Cadeira infantil PP sem braço', quantidade: 8, valorUnitario: 148 },
      { id: 'i134', bibliotecaId: 'b005', tipo: 'mobiliario', descricao: 'Armário baixo 120x40x80cm c/ 2 portas', quantidade: 2, valorUnitario: 1380 },
      { id: 'i135', bibliotecaId: 'b006', tipo: 'mobiliario', descricao: 'Estante aberta para material pedagógico', quantidade: 2, valorUnitario: 720 },
      { id: 'i136', bibliotecaId: 'b007', tipo: 'mobiliario', descricao: 'Quadro branco magnético 200x120cm', quantidade: 1, valorUnitario: 580 },
      { id: 'i137', bibliotecaId: 'b060', tipo: 'equipamento', descricao: 'Ar condicionado split 9.000 BTU', quantidade: 1, valorUnitario: 2450 },
      { id: 'i138', bibliotecaId: 'b061', tipo: 'equipamento', descricao: 'TV LED 50" c/ suporte articulado', quantidade: 1, valorUnitario: 2980 },
      { id: 'i139', bibliotecaId: 'b100', tipo: 'equipamento', descricao: 'Computador desktop c/ monitor 21"', quantidade: 2, valorUnitario: 4200 },
    ],
  },

  // ── 13. Banheiro Infantil ─────────────────────────────────────────────────
  {
    id: 'ma13', nome: 'Banheiro Infantil', categoria: 'banheiro-infantil',
    areaMq: 9, custoConstrucaoMq: CUB * 1.4, padrao: true,
    itens: [],  // instalações hidráulicas embutidas no custo de construção
  },

  // ── 14. Banheiro Adulto ───────────────────────────────────────────────────
  {
    id: 'ma14', nome: 'Banheiro Adulto / PCD', categoria: 'banheiro-adulto',
    areaMq: 6, custoConstrucaoMq: CUB * 1.5, padrao: true,
    itens: [],
  },

  // ── 15. Área Descoberta / Pátio ───────────────────────────────────────────
  {
    id: 'ma15', nome: 'Área Descoberta / Pátio', categoria: 'area-descoberta',
    areaMq: 180, custoConstrucaoMq: CUB * 0.3, padrao: true,
    itens: [
      { id: 'i150', bibliotecaId: 'b110', tipo: 'equipamento', descricao: 'Conjunto parquinho (escorregador + balanço + gira-gira)', quantidade: 1, valorUnitario: 18500 },
      { id: 'i151', bibliotecaId: 'b111', tipo: 'equipamento', descricao: 'Casa de boneca/casinha playground', quantidade: 1, valorUnitario: 4800 },
      { id: 'i152', bibliotecaId: 'b113', tipo: 'equipamento', descricao: 'Banco externo madeira plástica 200cm', quantidade: 4, valorUnitario: 1200 },
    ],
  },

  // ── 16. Guarita ───────────────────────────────────────────────────────────
  {
    id: 'ma16', nome: 'Guarita / Controle de Acesso', categoria: 'guarita',
    areaMq: 6, custoConstrucaoMq: CUB, padrao: true,
    itens: [
      { id: 'i160', bibliotecaId: 'b122', tipo: 'equipamento', descricao: 'Interfone/videoporteiro c/ câmera', quantidade: 1, valorUnitario: 980 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODELOS DE CRECHE — FNDE Tipo 1 (Proinfância B) e Tipo 2 (Proinfância C)
// ─────────────────────────────────────────────────────────────────────────────

export const mockModelosCreche: ModeloCreche[] = [
  // ── FNDE Tipo 1 — Proinfância B ──────────────────────────────────────────
  // Capacidade: 228 crianças | Área total aprox.: 1.347 m²
  {
    id: 'mc01',
    nome: 'Creche FNDE Tipo 1 (Proinfância B)',
    tipoBase: 'tipo1',
    descricao: 'Modelo padrão FNDE — Proinfância Tipo B. Capacidade para 228 crianças em período integral. 10 salas de atividades.',
    reservaPct: 10,
    capacidadeAlunos: 228,
    ambientes: [
      { id: 'mca01', modeloAmbienteId: 'ma01', nomeOverride: 'Sala de Atividades (×10)', quantidade: 10 },
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
      { id: 'sv01', descricao: 'Pessoal (professores, auxiliares, direção)', unidade: 'ano', valorAnual: 1420000 },
      { id: 'sv02', descricao: 'Energia elétrica', unidade: 'ano', valorAnual: 48000 },
      { id: 'sv03', descricao: 'Água e esgoto', unidade: 'ano', valorAnual: 14400 },
      { id: 'sv04', descricao: 'Internet e telefonia', unidade: 'ano', valorAnual: 7200 },
      { id: 'sv05', descricao: 'Vigilância e segurança', unidade: 'ano', valorAnual: 86400 },
      { id: 'sv06', descricao: 'Limpeza e higiene (terceirizado)', unidade: 'ano', valorAnual: 72000 },
      { id: 'sv07', descricao: 'Manutenção predial', unidade: 'ano', valorAnual: 36000 },
    ],
    aquisicoes: [
      { id: 'aq01', descricao: 'Merenda escolar (PNAE)', unidade: 'aluno/ano', quantidadeAnual: 228, valorUnitario: 1260 },
      { id: 'aq02', descricao: 'Material pedagógico', unidade: 'aluno/ano', quantidadeAnual: 228, valorUnitario: 480 },
      { id: 'aq03', descricao: 'Material de limpeza e higiene', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 2800 },
      { id: 'aq04', descricao: 'Uniforme e EPI (funcionários)', unidade: 'ano', quantidadeAnual: 1, valorUnitario: 18000 },
      { id: 'aq05', descricao: 'Gás de cozinha', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 1200 },
    ],
  },

  // ── FNDE Tipo 2 — Proinfância C ──────────────────────────────────────────
  // Capacidade: 120 crianças | Área total aprox.: 768 m²
  {
    id: 'mc02',
    nome: 'Creche FNDE Tipo 2 (Proinfância C)',
    tipoBase: 'tipo2',
    descricao: 'Modelo padrão FNDE — Proinfância Tipo C. Capacidade para 120 crianças. 4 salas de atividades + 1 berçário.',
    reservaPct: 10,
    capacidadeAlunos: 120,
    ambientes: [
      { id: 'mca20', modeloAmbienteId: 'ma01', nomeOverride: 'Sala de Atividades (×4)', quantidade: 4 },
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
      { id: 'sv10', descricao: 'Pessoal (professores, auxiliares, direção)', unidade: 'ano', valorAnual: 780000 },
      { id: 'sv11', descricao: 'Energia elétrica', unidade: 'ano', valorAnual: 28800 },
      { id: 'sv12', descricao: 'Água e esgoto', unidade: 'ano', valorAnual: 9600 },
      { id: 'sv13', descricao: 'Internet e telefonia', unidade: 'ano', valorAnual: 7200 },
      { id: 'sv14', descricao: 'Vigilância e segurança', unidade: 'ano', valorAnual: 64800 },
      { id: 'sv15', descricao: 'Limpeza e higiene (terceirizado)', unidade: 'ano', valorAnual: 48000 },
      { id: 'sv16', descricao: 'Manutenção predial', unidade: 'ano', valorAnual: 24000 },
    ],
    aquisicoes: [
      { id: 'aq10', descricao: 'Merenda escolar (PNAE)', unidade: 'aluno/ano', quantidadeAnual: 120, valorUnitario: 1260 },
      { id: 'aq11', descricao: 'Material pedagógico', unidade: 'aluno/ano', quantidadeAnual: 120, valorUnitario: 480 },
      { id: 'aq12', descricao: 'Material de limpeza e higiene', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 1800 },
      { id: 'aq13', descricao: 'Uniforme e EPI (funcionários)', unidade: 'ano', quantidadeAnual: 1, valorUnitario: 12000 },
      { id: 'aq14', descricao: 'Gás de cozinha', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 800 },
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

export function calcularCustoCreche(
  modelo: ModeloCreche,
  ambientes: ModeloAmbiente[]
): {
  obras: number; mobiliario: number; equipamentos: number;
  reserva: number; investimento: number;
  custeioAnual: number;
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
  const custeioAnual =
    modelo.servicos.reduce((s, sv) => s + sv.valorAnual, 0) +
    modelo.aquisicoes.reduce((s, aq) => s + aq.quantidadeAnual * aq.valorUnitario, 0);
  return { obras, mobiliario, equipamentos, reserva, investimento, custeioAnual };
}

export const mockServicosReferencia: ServicoAnual[] = [
  { id: 'ref-sv01', descricao: 'Pessoal (professores, auxiliares, direção)', unidade: 'ano', valorAnual: 1420000 },
  { id: 'ref-sv02', descricao: 'Energia elétrica', unidade: 'ano', valorAnual: 48000 },
  { id: 'ref-sv03', descricao: 'Água e esgoto', unidade: 'ano', valorAnual: 14400 },
  { id: 'ref-sv04', descricao: 'Internet e telefonia', unidade: 'ano', valorAnual: 7200 },
  { id: 'ref-sv05', descricao: 'Vigilância e segurança', unidade: 'ano', valorAnual: 86400 },
  { id: 'ref-sv06', descricao: 'Limpeza e higiene (terceirizado)', unidade: 'ano', valorAnual: 72000 },
  { id: 'ref-sv07', descricao: 'Manutenção predial', unidade: 'ano', valorAnual: 36000 },
];

export const mockAquisicoesReferencia: AquisicaoAnual[] = [
  { id: 'ref-aq01', descricao: 'Merenda escolar (PNAE)', unidade: 'aluno/ano', quantidadeAnual: 120, valorUnitario: 1260 },
  { id: 'ref-aq02', descricao: 'Material pedagógico', unidade: 'aluno/ano', quantidadeAnual: 120, valorUnitario: 480 },
  { id: 'ref-aq03', descricao: 'Material de limpeza e higiene', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 1800 },
  { id: 'ref-aq04', descricao: 'Uniforme e EPI (funcionários)', unidade: 'ano', quantidadeAnual: 1, valorUnitario: 12000 },
  { id: 'ref-aq05', descricao: 'Gás de cozinha', unidade: 'mês', quantidadeAnual: 12, valorUnitario: 800 },
];
