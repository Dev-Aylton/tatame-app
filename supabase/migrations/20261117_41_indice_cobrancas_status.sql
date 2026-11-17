-- TATAME · Migration 41 · Índice parcial em cobrancas_mensais (status ativo)
-- Melhora performance de consultas por cobranças abertas/pagas por professor.
-- Seguro aplicar sem downtime (CREATE INDEX CONCURRENTLY não disponível em transação,
-- mas o índice é pequeno e a criação é rápida em produção).
begin;

-- Índice parcial: apenas cobranças ativas ou pagas (exclui canceladas, que são históricas)
create index if not exists cobrancas_status_professor_idx
  on public.cobrancas_mensais (professor_id, status, mes desc)
  where status in ('aberta', 'paga');

-- Índice parcial para busca de cobranças abertas por aluno
create index if not exists cobrancas_abertas_aluno_idx
  on public.cobrancas_mensais (aluno_id, mes desc)
  where status = 'aberta';

commit;
