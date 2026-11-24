-- =====================================================================
-- Barrio Oriental · base de datos (Supabase / PostgreSQL)
-- Pegá TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Se puede volver a correr sin romper nada.
-- =====================================================================

-- ---------- Perfiles (uno por persona registrada) ----------
create table if not exists public.perfiles (
  id      uuid primary key references auth.users(id) on delete cascade,
  nombre  text not null default 'Vecino' check (char_length(nombre) between 1 and 60),
  barrio  text not null default '' check (char_length(barrio) <= 60),
  mate    text not null default '' check (char_length(mate) <= 40),
  creado  timestamptz not null default now()
);

-- Administradores (moderan: borran, verifican comercios, ven reportes)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- Seguimientos (quién sigue a quién) ----------
create table if not exists public.seguimientos (
  seguidor uuid not null references public.perfiles(id) on delete cascade,
  seguido  uuid not null references public.perfiles(id) on delete cascade,
  creado   timestamptz not null default now(),
  primary key (seguidor, seguido),
  check (seguidor <> seguido)
);

-- ---------- Publicaciones ----------
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  autor         uuid references public.perfiles(id) on delete cascade,
  ejemplo       boolean not null default false,
  autor_ejemplo text not null default '',
  seccion       text not null check (seccion in ('barrios','ronda','comercios','feria','folklore')),
  barrio        text not null check (char_length(barrio) between 1 and 60),
  texto         text not null check (char_length(texto) between 1 and 500),
  whatsapp      text not null default '' check (char_length(whatsapp) <= 30),
  foto          text not null default '',
  creado        timestamptz not null default now()
);
create index if not exists posts_creado_idx on public.posts (creado desc);

create table if not exists public.comentarios (
  id      uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  autor   uuid not null references public.perfiles(id) on delete cascade,
  texto   text not null check (char_length(texto) between 1 and 300),
  creado  timestamptz not null default now()
);

create table if not exists public.cebadas (
  post_id uuid not null references public.posts(id) on delete cascade,
  autor   uuid not null references public.perfiles(id) on delete cascade,
  creado  timestamptz not null default now(),
  primary key (post_id, autor)
);

create table if not exists public.pasadas (
  post_id uuid not null references public.posts(id) on delete cascade,
  autor   uuid not null references public.perfiles(id) on delete cascade,
  creado  timestamptz not null default now(),
  primary key (post_id, autor)
);

create table if not exists public.reportes (
  id      uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  autor   uuid not null references public.perfiles(id) on delete cascade,
  motivo  text not null default '' check (char_length(motivo) <= 300),
  creado  timestamptz not null default now(),
  unique (post_id, autor)
);

-- ---------- Comercios (vidriera "Barrios Orientales") ----------
create table if not exists public.comercios (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null check (char_length(nombre) between 1 and 60),
  rubro      text not null default '' check (char_length(rubro) <= 60),
  barrio     text not null check (char_length(barrio) between 1 and 60),
  referencia text not null default '' check (char_length(referencia) <= 80),
  atiende    text not null default '' check (char_length(atiende) <= 60),
  horario    text not null default '' check (char_length(horario) <= 80),
  entrega    text not null default '' check (char_length(entrega) <= 40),
  whatsapp   text not null default '' check (char_length(whatsapp) <= 30),
  foto       text not null default '',
  autor      uuid references public.perfiles(id) on delete set null,
  verificado boolean not null default false,
  pendiente  boolean not null default false,
  creado     timestamptz not null default now()
);

-- Solo un admin puede marcar o desmarcar un comercio como "conocido"
create or replace function public.proteger_verificado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.es_admin() then
    if tg_op = 'INSERT' then new.verificado := false;
    elsif new.verificado is distinct from old.verificado then new.verificado := old.verificado;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists comercios_verificado on public.comercios;
create trigger comercios_verificado before insert or update on public.comercios
  for each row execute function public.proteger_verificado();

-- Nadie puede hacerse pasar por "ejemplo" salvo un admin
create or replace function public.proteger_ejemplo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.es_admin() then new.ejemplo := false; new.autor_ejemplo := ''; end if;
  return new;
end $$;
drop trigger if exists posts_ejemplo on public.posts;
create trigger posts_ejemplo before insert or update on public.posts
  for each row execute function public.proteger_ejemplo();

-- Al registrarse, se crea el perfil con el nombre y barrio que puso
create or replace function public.nuevo_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, barrio)
  values (new.id,
          coalesce(nullif(left(new.raw_user_meta_data->>'nombre', 60), ''), 'Vecino'),
          coalesce(left(new.raw_user_meta_data->>'barrio', 60), ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists al_registrarse on auth.users;
create trigger al_registrarse after insert on auth.users
  for each row execute function public.nuevo_perfil();

-- Permisos para el Data API: solo quien inició sesión (authenticated) accede.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.es_admin() to authenticated;

-- =====================================================================
-- Reglas de acceso (Row Level Security)
-- Solo quien inició sesión ve el barrio. Cada uno cambia lo suyo.
-- Los admins pueden borrar cualquier cosa (moderación).
-- =====================================================================
alter table public.perfiles     enable row level security;
alter table public.admins       enable row level security;
alter table public.seguimientos enable row level security;
alter table public.posts        enable row level security;
alter table public.comentarios  enable row level security;
alter table public.cebadas      enable row level security;
alter table public.pasadas      enable row level security;
alter table public.reportes     enable row level security;
alter table public.comercios    enable row level security;

do $$
declare r record;
begin
  -- borrar políticas anteriores para poder re-correr el archivo
  for r in select policyname, tablename from pg_policies where schemaname='public'
    and tablename in ('perfiles','admins','seguimientos','posts','comentarios','cebadas','pasadas','reportes','comercios')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy leer on public.perfiles for select to authenticated using (true);
create policy editar_propio on public.perfiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy crear_propio on public.perfiles for insert to authenticated with check (id = auth.uid());

create policy ver_admins on public.admins for select to authenticated using (user_id = auth.uid());

create policy leer on public.seguimientos for select to authenticated using (true);
create policy seguir on public.seguimientos for insert to authenticated with check (seguidor = auth.uid());
create policy dejar on public.seguimientos for delete to authenticated using (seguidor = auth.uid());

create policy leer on public.posts for select to authenticated using (true);
create policy publicar on public.posts for insert to authenticated with check (autor = auth.uid());
create policy editar on public.posts for update to authenticated using (autor = auth.uid() or public.es_admin());
create policy borrar on public.posts for delete to authenticated using (autor = auth.uid() or public.es_admin());

create policy leer on public.comentarios for select to authenticated using (true);
create policy comentar on public.comentarios for insert to authenticated with check (autor = auth.uid());
create policy borrar on public.comentarios for delete to authenticated using (autor = auth.uid() or public.es_admin());

create policy leer on public.cebadas for select to authenticated using (true);
create policy cebar on public.cebadas for insert to authenticated with check (autor = auth.uid());
create policy descebar on public.cebadas for delete to authenticated using (autor = auth.uid());

create policy leer on public.pasadas for select to authenticated using (true);
create policy pasar on public.pasadas for insert to authenticated with check (autor = auth.uid());
create policy despasar on public.pasadas for delete to authenticated using (autor = auth.uid());

create policy ver on public.reportes for select to authenticated using (autor = auth.uid() or public.es_admin());
create policy reportar on public.reportes for insert to authenticated with check (autor = auth.uid());
create policy borrar on public.reportes for delete to authenticated using (autor = auth.uid() or public.es_admin());

create policy leer on public.comercios for select to authenticated using (true);
create policy sumar on public.comercios for insert to authenticated with check (autor = auth.uid());
create policy editar on public.comercios for update to authenticated using (autor = auth.uid() or public.es_admin());
create policy borrar on public.comercios for delete to authenticated using (autor = auth.uid() or public.es_admin());

-- =====================================================================
-- Fotos (Storage): cada uno sube a su propia carpeta; se ven públicas
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "fotos subir propia" on storage.objects;
drop policy if exists "fotos borrar propia" on storage.objects;
create policy "fotos subir propia" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos borrar propia" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and ((storage.foldername(name))[1] = auth.uid()::text or public.es_admin()));

-- =====================================================================
-- Tiempo real: que el muro se actualice solo cuando otro publica
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['posts','comentarios','cebadas','pasadas','comercios','seguimientos','perfiles'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- Contenido de arranque (se puede borrar cuando el barrio tenga vida)
-- =====================================================================
insert into public.posts (ejemplo, autor_ejemplo, seccion, barrio, texto, creado)
select * from (values
  (true, 'Vecina de Jacinto Vera', 'barrios', 'Jacinto Vera', 'Bo, ¿alguien conoce un electricista de confianza por el barrio? Que sea de la vuelta, así lo recomendamos entre todos.', now() - interval '1 hour'),
  (true, 'Vecino de Paysandú', 'ronda', 'Paysandú', 'Pregunta para la ronda: ¿qué extrañan del barrio de antes y qué cosas están mejor hoy? Todas las miradas valen, la idea es escucharnos.', now() - interval '2 hours'),
  (true, 'Vecino de Brazo Oriental', 'comercios', 'Brazo Oriental', 'Busco una panadería que haga bizcochos de grasa como los de antes. ¿Recomendaciones? Si es atendida por sus dueños, mejor.', now() - interval '3 hours'),
  (true, 'Vecino de Cordón', 'feria', 'Cordón', 'Vendo bicicleta rodado 20 en buen estado, ideal para gurises. Se retira en el barrio, me escriben por WhatsApp.', now() - interval '6 hours'),
  (true, 'Vecina de Barrio Sur', 'folklore', 'Barrio Sur', 'Este sábado salen los tambores a ensayar. ¿Quién se suma a ver pasar la cuerda? Llevo el termo.', now() - interval '10 hours'),
  (true, 'Vecina de Salto', 'folklore', 'Salto', 'Receta de la abuela para los días de lluvia: torta frita. Harina, grasa, sal y agua tibia; se estira finita y a la sartén. ¿Ustedes le ponen azúcar arriba?', now() - interval '20 hours'),
  (true, 'Vecino de Atahualpa', 'barrios', 'Atahualpa', 'Se perdió un perro mediano, negro con collar rojo, ayer de tarde por la zona. Si lo ven, avisen por acá.', now() - interval '28 hours'),
  (true, 'Vecina de Rocha', 'barrios', 'Rocha', 'Atardecer en la laguna. Qué lindo es tener todo el país a mano: los de Montevideo, ¡vengan a visitarnos!', now() - interval '44 hours')
) as v(ejemplo, autor_ejemplo, seccion, barrio, texto, creado)
where not exists (select 1 from public.posts where ejemplo);

insert into public.comercios (nombre, rubro, barrio, referencia, pendiente)
select 'Jamón y Eso', 'Tienda mayorista de alimentos', 'Atahualpa', 'Carabelas y Finlandia', true
where not exists (select 1 from public.comercios where nombre = 'Jamón y Eso');
