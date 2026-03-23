
-- Delete old demo products
DELETE FROM produtos WHERE prestador_id = '409beef6-fa1d-4a01-a49d-b83b7f12e8a7';

-- Delete old demo cardapio items and categories
DELETE FROM cardapio_itens WHERE loja_id = 'a1b2c3d4-0000-0000-0000-000000000001';
DELETE FROM cardapio_categorias WHERE loja_id = 'a1b2c3d4-0000-0000-0000-000000000001';

-- Update loja name and slug
UPDATE lojas SET 
  nome = 'Moto Acessórios BR',
  slug = 'moto-acessorios',
  descricao = 'Os melhores acessórios para sua moto. Capacetes, luvas, jaquetas e muito mais!',
  horario_funcionamento = 'Seg-Sáb: 9h às 18h',
  cardapio_ativo = false
WHERE id = 'a1b2c3d4-0000-0000-0000-000000000001';

-- Insert new motorcycle accessory products
INSERT INTO produtos (prestador_id, condominio_id, titulo, descricao, preco, status, imagem_url) VALUES
('409beef6-fa1d-4a01-a49d-b83b7f12e8a7', '31b484d2-0826-4541-a183-3698ac5763c1', 'Capacete Esportivo Fechado', 'Capacete fechado com viseira cristal, forro removível e ventilação. Certificado INMETRO.', 289.90, 'ativo', 'https://qfprslmwsuetqabexwkf.supabase.co/storage/v1/object/public/produtos/demo%2Fcapacete.jpg'),
('409beef6-fa1d-4a01-a49d-b83b7f12e8a7', '31b484d2-0826-4541-a183-3698ac5763c1', 'Luvas de Couro com Proteção', 'Luvas em couro legítimo com proteção nos nós dos dedos. Conforto e segurança.', 129.90, 'ativo', 'https://qfprslmwsuetqabexwkf.supabase.co/storage/v1/object/public/produtos/demo%2Fluvas.jpg'),
('409beef6-fa1d-4a01-a49d-b83b7f12e8a7', '31b484d2-0826-4541-a183-3698ac5763c1', 'Jaqueta de Proteção Motociclista', 'Jaqueta com proteções removíveis em ombros, cotovelos e costas. Material resistente à abrasão.', 449.90, 'ativo', 'https://qfprslmwsuetqabexwkf.supabase.co/storage/v1/object/public/produtos/demo%2Fjaqueta.jpg'),
('409beef6-fa1d-4a01-a49d-b83b7f12e8a7', '31b484d2-0826-4541-a183-3698ac5763c1', 'Protetor de Tanque Carbono', 'Adesivo protetor de tanque em fibra de carbono 3D. Protege contra riscos e arranhões.', 59.90, 'ativo', 'https://qfprslmwsuetqabexwkf.supabase.co/storage/v1/object/public/produtos/demo%2Fprotetor-tanque.jpg'),
('409beef6-fa1d-4a01-a49d-b83b7f12e8a7', '31b484d2-0826-4541-a183-3698ac5763c1', 'Retrovisor Esportivo Cromado', 'Par de retrovisores esportivos cromados. Encaixe universal para guidão.', 89.90, 'ativo', 'https://qfprslmwsuetqabexwkf.supabase.co/storage/v1/object/public/produtos/demo%2Fretrovisor.jpg'),
('409beef6-fa1d-4a01-a49d-b83b7f12e8a7', '31b484d2-0826-4541-a183-3698ac5763c1', 'Capa de Chuva Impermeável', 'Conjunto capa + calça impermeável com costuras seladas. Faixas refletivas para segurança noturna.', 119.90, 'ativo', 'https://qfprslmwsuetqabexwkf.supabase.co/storage/v1/object/public/produtos/demo%2Fcapa-chuva.jpg');
