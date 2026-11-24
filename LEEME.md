# Barrio Oriental: cómo ponerla en línea

Con esta guía Barrio Oriental queda con su propia dirección web. Tu familia la instala en el teléfono con el ícono del isotipo y no necesita cuenta en Claude.

Lleva unos 20 minutos y no cuesta nada: los planes gratis de Supabase, GitHub y Vercel alcanzan para la prueba.

## Qué hay en la carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html`, `styles.css`, `app.js` | La app |
| `config.js` | Los datos de conexión a la base (paso 2) |
| `manifest.webmanifest`, `sw.js`, `img/` | Lo que la hace instalable con su ícono |
| `supabase/schema.sql` | La base de datos con sus reglas de seguridad (paso 1) |

---

## Paso 1: la base de datos (Supabase)

1. Entrá a **supabase.com** y creá una cuenta. Lo más cómodo es entrar con GitHub (ver paso 3).
2. Tocá **New project**:
   - Nombre: `barrio-oriental`
   - Región: **São Paulo** (la más cercana a Uruguay)
   - Database password: inventá una contraseña y guardala.
3. Esperá un par de minutos a que termine de crearse.
4. En el menú de la izquierda andá a **SQL Editor**, tocá **New query** y pegá todo el contenido de `supabase/schema.sql`. Después tocá **Run**. Tiene que decir *Success*.
5. Andá a **Authentication → Sign In / Providers → Email** y **apagá "Confirm email"**.
   > El correo gratis de Supabase solo manda mails a los miembros del equipo del proyecto, así que si queda prendido tu familia no podría confirmar la cuenta. Por eso, en esta etapa **"Me olvidé la contraseña" tampoco va a mandar mails**. Si alguien se olvida la clave, avisame y lo resolvemos.

## Paso 2: los datos de conexión

En Supabase andá a **Project Settings → API** (puede aparecer como **Data API** o **API Keys**) y copiá dos cosas:

- **Project URL** (algo como `https://abcdxyz.supabase.co`)
- La clave pública: **anon public**, o **publishable key** si te aparece así.

Pasámelas por el chat y yo las pongo en `config.js`. Si lo hacés vos, abrí `config.js` y reemplazá `https://TU-PROYECTO.supabase.co` y `PEGÁ-ACÁ-LA-CLAVE-ANON`.

> ⚠️ Nunca uses ni compartas la clave **service_role** (o **secret**): esa abre todo.

## Paso 3: el código (GitHub)

1. Creá una cuenta en **github.com**.
2. Tocá **+ → New repository**:
   - Nombre: `barrio-oriental`
   - Puede ser **Private**.
   - Tocá **Create repository**.
3. En la página del repositorio tocá **uploading an existing file**, arrastrá **todo el contenido** de la carpeta (los archivos y las carpetas `img` y `supabase`) y tocá **Commit changes**.

**Para que yo pueda hacer los cambios después:** en claude.ai andá a **Configuración → Conectores** y conectá **GitHub**. Cuando le des acceso al repositorio `barrio-oriental`, cada cambio que me pidas lo subo yo directamente.

## Paso 4: publicarla (Vercel)

1. Entrá a **vercel.com** y creá una cuenta con **Continue with GitHub**.
2. Tocá **Add New… → Project** e importá `barrio-oriental`.
3. En *Framework Preset* elegí **Other**. No hay que tocar nada más.
4. Tocá **Deploy**. En un minuto te da la dirección, algo como `barrio-oriental.vercel.app`.
5. Volvé a Supabase, andá a **Authentication → URL Configuration** y pegá esa dirección en **Site URL**.

Desde ahora, **cada cambio que entre en GitHub se publica solo en Vercel**.

## Paso 5: hacerte administrador

1. Entrá a la app y creá tu cuenta.
2. En Supabase andá a **SQL Editor → New query**, pegá esto (con tu correo) y tocá **Run**:

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'TU-CORREO@ejemplo.com';
```

Como administrador podés:
- borrar cualquier publicación o comentario,
- ver cuántos reportes tiene cada publicación,
- marcar comercios como "Conocido por la comunidad".

## Paso 6: compartirla

Mandá la dirección por WhatsApp. En Android:

1. Abrir el enlace en **Chrome**.
2. Tocar **Instalar** en el aviso de la app, o los tres puntos → **Instalar app** / **Agregar a la pantalla principal**.
3. Queda el ícono de Barrio Oriental en el teléfono y se abre a pantalla completa.

En iPhone: abrir en **Safari** → botón **Compartir** → **Agregar a inicio**.

---

## Bueno saber

- Solo ve el barrio quien se registró. Cada uno puede cambiar y borrar únicamente lo suyo.
- Las fotos se achican en el teléfono antes de subirse. El plan gratis de Supabase trae 1 GB para fotos, que alcanza para varios miles.
- Si Supabase pasa una semana sin que nadie entre a la app, pausa el proyecto. Se reactiva desde el panel de Supabase con un botón.
- Las publicaciones de ejemplo se pueden borrar desde la app cuando el barrio tenga vida propia.
