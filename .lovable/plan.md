

## Corrigir Contatos do Desapego

### Problema Encontrado
A pagina de detalhe do Desapego tenta buscar o perfil do dono diretamente na tabela `profiles`, mas a politica de seguranca so permite que cada usuario veja seu proprio perfil. Isso significa que **um morador nao consegue ver o contato de outro morador** no Desapego — o botao de WhatsApp simplesmente nao aparece.

O E-shop funciona corretamente porque usa uma funcao segura (`get_prestador_profiles`). O Desapego precisa de uma solucao similar.

### Solucao

**1. Criar funcao segura no banco de dados**

Criar a funcao `get_desapego_owner_profile` que retorna apenas nome, avatar e telefone de um usuario especifico, de forma segura (SECURITY DEFINER), sem expor toda a tabela de perfis.

**2. Atualizar a pagina de detalhe do Desapego**

Alterar `src/pages/morador/MoradorDesapegoDetalhe.tsx` para usar a nova funcao RPC em vez da consulta direta a tabela `profiles`.

### Detalhes Tecnicos

- Migracao SQL: criar `public.get_desapego_owner_profile(_user_id uuid)` como `SECURITY DEFINER` retornando `(user_id, nome, avatar_url, telefone)`
- Frontend: substituir `supabase.from("profiles").select(...)` por `supabase.rpc("get_desapego_owner_profile", { _user_id: data.morador_id })`
- Nenhuma alteracao nas politicas RLS existentes

