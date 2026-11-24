-- =====================================================================
-- Barrio Oriental · actualización 002
-- Comercios con video, galería y crédito de producción;
-- pedidos de "Soy el dueño"; panel de administración.
-- Pegar TODO en Supabase > SQL Editor > New query > Run.
-- Se puede volver a correr sin romper nada.
-- =====================================================================

-- ---------- Comercios: video, galería y crédito ----------
alter table public.comercios add column if not exists video   text   not null default '';
alter table public.comercios add column if not exists fotos   text[] not null default '{}';
alter table public.comercios add column if not exists credito text   not null default '';

alter table public.comercios drop constraint if exists comercios_video_largo;
alter table public.comercios add constraint comercios_video_largo check (char_length(video) <= 300);
alter table public.comercios drop constraint if exists comercios_fotos_max;
alter table public.comercios add constraint comercios_fotos_max check (coalesce(array_length(fotos, 1), 0) <= 4);
alter table public.comercios drop constraint if exists comercios_credito_largo;
alter table public.comercios add constraint comercios_credito_largo check (char_length(credito) <= 80);

-- Solo un admin marca "conocido" o pone el crédito de producción
create or replace function public.proteger_verificado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.es_admin() then
    if tg_op = 'INSERT' then
      new.verificado := false; new.credito := '';
    else
      if new.verificado is distinct from old.verificado then new.verificado := old.verificado; end if;
      if new.credito is distinct from old.credito then new.credito := old.credito; end if;
      if new.autor is distinct from old.autor then new.autor := old.autor; end if;
    end if;
  end if;
  return new;
end $$;

-- ---------- Pedidos de "Soy el dueño de este comercio" ----------
create table if not exists public.reclamos (
  id          uuid primary key default gen_random_uuid(),
  comercio_id uuid not null references public.comercios(id) on delete cascade,
  autor       uuid not null references public.perfiles(id) on delete cascade,
  mensaje     text not null default '' check (char_length(mensaje) <= 300),
  creado      timestamptz not null default now(),
  unique (comercio_id, autor)
);
alter table public.reclamos enable row level security;
drop policy if exists ver on public.reclamos;
drop policy if exists pedir on public.reclamos;
drop policy if exists borrar on public.reclamos;
create policy ver on public.reclamos for select to authenticated using (autor = auth.uid() or public.es_admin());
create policy pedir on public.reclamos for insert to authenticated with check (autor = auth.uid());
create policy borrar on public.reclamos for delete to authenticated using (autor = auth.uid() or public.es_admin());

-- El admin aprueba: el comercio pasa a ser de quien lo pidió
create or replace function public.aprobar_reclamo(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede aprobar'; end if;
  select * into r from public.reclamos where id = p_id;
  if not found then raise exception 'El pedido ya no existe'; end if;
  update public.comercios set autor = r.autor where id = r.comercio_id;
  delete from public.reclamos where comercio_id = r.comercio_id;
end $$;

-- ---------- Permisos para usuarios con sesión ----------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.aprobar_reclamo(uuid) to authenticated;

-- Tiempo real también para los pedidos
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reclamos') then
    alter publication supabase_realtime add table public.reclamos;
  end if;
end $$;
