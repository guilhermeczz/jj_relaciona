-- JJ Relaciona · Dados iniciais (seeds)
-- IMPORTANTE: para usuários reais, crie-os no Supabase Auth (Authentication > Users)
-- e depois atualize o id do profile para o auth.users.id correspondente.
-- Executar APÓS 001_schema.sql e 002_rls.sql.

-- Vendedores/perfis com UUIDs fixos para referência nos relacionamentos.
-- No Supabase Auth, o id de cada usuário terá outro UUID. Substitua os ids
-- abaixo pelos respectivos auth.users.id (ou recrie os perfis).

-- Perfil admin (substituir id pelo auth.users.id do admin)
insert into public.profiles (id, nome, email, perfil, telefone, ativo) values
  ('00000000-0000-0000-0000-000000000001', 'Administrador JJ', 'admin@jjrelaciona.com.br', 'admin', '(00) 00000-0001', true);

-- Perfis vendedores
insert into public.profiles (id, nome, email, perfil, telefone, ativo) values
  ('00000000-0000-0000-0000-000000000002', 'Carlos Vendedor', 'carlos@jjrelaciona.com.br', 'vendedor', '(00) 00000-0002', true),
  ('00000000-0000-0000-0000-000000000003', 'Mariana Vendedora', 'mariana@jjrelaciona.com.br', 'vendedor', '(00) 00000-0003', true);

-- Lojas
insert into public.lojas (id, razao_social, nome_fantasia, cnpj, data_fundacao, whatsapp, telefone, email, endereco, numero, bairro, cidade, estado, cep, segmento, vendedor_responsavel_id, status, observacoes) values
  ('10000000-0000-0000-0000-000000000001', 'Casa do Construtor LTDA', 'Casa do Construtor', '00.000.000/0001-01', '2010-05-15', '(11) 90001-0001', '(11) 3001-0001', 'contato@casadoconstrutor.com.br', 'Rua das Pedras', '100', 'Centro', 'São Paulo', 'SP', '01000-000', 'Material de construção', '00000000-0000-0000-0000-000000000002', 'ativo', 'Cliente antigo, bom relacionamento.'),
  ('10000000-0000-0000-0000-000000000002', 'Elétrica Brasil ME', 'Elétrica Brasil', '00.000.000/0001-02', '2015-08-20', '(11) 90001-0002', '(11) 3001-0002', 'vendas@eletricabrasil.com.br', 'Av. Energia', '250', 'Industrial', 'Guarulhos', 'SP', '07000-000', 'Materiais elétricos', '00000000-0000-0000-0000-000000000003', 'ativo', NULL),
  ('10000000-0000-0000-0000-000000000003', 'Hidráulica Total S.A.', 'Hidráulica Total', '00.000.000/0001-03', '2008-02-10', '(21) 90001-0003', '(21) 3001-0003', 'comercial@hidraulicatotal.com.br', 'Rua do Cano', '55', 'Centro', 'Rio de Janeiro', 'RJ', '20000-000', 'Materiais hidráulicos', '00000000-0000-0000-0000-000000000002', 'ativo', 'Pagamento em dia.'),
  ('10000000-0000-0000-0000-000000000004', 'Acabamento Nobre ME', 'Acabamento Nobre', '00.000.000/0001-04', '2018-11-01', '(11) 90001-0004', '(11) 3001-0004', 'sac@acabamentonobre.com.br', 'Rua do Acabamento', '320', 'Jardim', 'Campinas', 'SP', '13000-000', 'Acabamentos', '00000000-0000-0000-0000-000000000003', 'ativo', NULL),
  ('10000000-0000-0000-0000-000000000005', 'Ferramentas Forte ME', 'Ferramentas Forte', '00.000.000/0001-05', '2012-09-25', '(11) 90001-0005', '(11) 3001-0005', 'loja@ferramentasforte.com.br', 'Av. do Ferreiro', '77', 'Vila', 'Osasco', 'SP', '06000-000', 'Ferramentas', '00000000-0000-0000-0000-000000000002', 'inativo', 'Contato parado, reativar.'),
  ('10000000-0000-0000-0000-000000000006', 'Tintas e Cia LTDA', 'Tintas e Cia', '00.000.000/0001-06', '2020-03-08', '(11) 90001-0006', '(11) 3001-0006', 'vendas@tintasecia.com.br', 'Rua das Tintas', '10', 'Centro', 'Santo André', 'SP', '09000-000', 'Pinturas', '00000000-0000-0000-0000-000000000003', 'ativo', NULL);

-- Contatos de lojas
insert into public.contatos_loja (id, loja_id, nome, cargo, whatsapp, telefone, email, data_nascimento, recebe_mensagens, recebe_campanhas, recebe_treinamentos, ativo) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'João Silva', 'proprietario', '(11) 90001-1001', '(11) 3001-0001', 'joao@casadoconstrutor.com.br', '1990-08-15', true, true, true, true),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Pedro Souza', 'comprador', '(11) 90001-1002', NULL, 'pedro@casadoconstrutor.com.br', '1985-09-03', true, true, true, true),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Ana Pereira', 'gerente', '(11) 90001-1003', '(11) 3001-0002', 'ana@eletricabrasil.com.br', '1992-08-18', true, true, false, true),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Roberto Lima', 'vendedor', '(11) 90001-1004', NULL, 'roberto@eletricabrasil.com.br', '1988-08-22', true, false, true, true),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Maria Oliveira', 'proprietario', '(21) 90001-1005', '(21) 3001-0003', 'maria@hidraulicatotal.com.br', '1995-09-10', true, true, true, true),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Carlos Nunes', 'balconista', '(21) 90001-1006', NULL, 'carlos@hidraulicatotal.com.br', '1998-08-05', true, false, false, true),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'Fernanda Costa', 'comprador', '(11) 90001-1007', '(11) 3001-0004', 'fernanda@acabamentonobre.com.br', '1991-08-28', true, true, true, true),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000004', 'Bruno Almeida', 'financeiro', '(11) 90001-1008', NULL, 'bruno@acabamentonobre.com.br', '1989-09-01', true, false, false, true),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 'Sandra Vieira', 'gerente', '(11) 90001-1009', '(11) 3001-0005', 'sandra@ferramentasforte.com.br', '1987-08-12', true, true, true, true),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', 'Paulo Andrade', 'proprietario', '(11) 90001-1010', '(11) 3001-0006', 'paulo@tintasecia.com.br', '1993-08-30', true, true, true, true);

-- Campanhas
insert into public.campanhas (id, nome, descricao, produto_marca, regra, premio, data_inicio, data_fim, status) values
  ('30000000-0000-0000-0000-000000000001', 'Venda 10 e ganhe R$ 50', 'Campanha de incentivo por volume', 'Cimento Votorantim', 'Venda 10 unidades do produto X', 'R$ 50,00', current_date - interval '10 day', current_date + interval '20 day', 'ativa'),
  ('30000000-0000-0000-0000-000000000002', 'Compre mais, pague menos', 'Desconto progressivo', 'Tinta Suvinil', 'Compre 50 galões de tinta', 'R$ 200,00', current_date - interval '30 day', current_date - interval '2 day', 'encerrada');

-- Participantes da campanha 1
insert into public.campanha_participantes (campanha_id, loja_id, contato_id, status) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'participando'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000007', 'convidado'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000010', 'convidado');

-- Treinamentos
insert into public.treinamentos (id, nome, tema, parceiro, data, horario, local, vagas, descricao, status) values
  ('40000000-0000-0000-0000-000000000001', 'Novidades em Materiais Elétricos', 'Eletricidade', 'Fabricante XYZ', current_date + interval '15 day', '09:00', 'Auditório da JJ', 30, 'Apresentação de novos produtos e técnicas de venda.', 'programado'),
  ('40000000-0000-0000-0000-000000000002', 'Instalações Hidráulicas Modernas', 'Hidráulica', 'Marca ABC', current_date + interval '30 day', '14:00', 'Sala de treinamento JJ', 20, 'Curso prático de instalações.', 'programado');

-- Participantes do treinamento 1
insert into public.treinamento_participantes (treinamento_id, loja_id, contato_id, confirmado, compareceu) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', true, false),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', false, false);

-- Brindes (alguns pendentes)
insert into public.brindes (id, loja_id, contato_id, motivo, descricao, status, data_prevista, vendedor_responsavel_id) values
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'aniversario_contato', 'Kit de ferramentas', 'pendente', current_date + interval '5 day', '00000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 'aniversario_loja', 'Brinde corporativo', 'separado', current_date + interval '10 day', '00000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000010', 'campanha', 'Camiseta da marca', 'enviado', current_date - interval '3 day', '00000000-0000-0000-0000-000000000003');

-- Interações
insert into public.interacoes (loja_id, contato_id, usuario_id, tipo, descricao, data_interacao) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Visita', 'Visita de rotina e apresentação de novos produtos.', now() - interval '5 day'),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'WhatsApp', 'Envio de cotação e acompanhamento do pedido.', now() - interval '2 day'),
  ('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'Ligação', 'Tratativa de brinde pendente e novo pedido.', now() - interval '1 day');
