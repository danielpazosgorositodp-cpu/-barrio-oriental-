-- =====================================================================
-- Barrio Oriental · actualización 003
-- Enlace de video (YouTube, Instagram, TikTok, Facebook) en publicaciones.
-- Pegar TODO en Supabase > SQL Editor > New query > Run.
-- =====================================================================
alter table public.posts add column if not exists video text not null default '';
alter table public.posts drop constraint if exists posts_video_largo;
alter table public.posts add constraint posts_video_largo check (char_length(video) <= 300);
