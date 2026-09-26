# Lista de regalos — La biblioteca andante

Wishlist interactiva: cada persona puede reservar un regalo escribiendo solo su
nombre, y el resto lo ve marcado como reservado en tiempo real.

## 1. Probarlo en local (sin nada más)

```bash
npm install
npm run dev
```

Sin configurar nada, la app funciona en **modo de prueba local**: las
reservas se guardan en `localStorage` de tu navegador, así que no las verá
nadie más. Es solo para revisar el diseño y el flujo antes de conectar la
base de datos real.

## 2. Editar el catálogo de regalos

Todo vive en `src/data/items.json`. Cada regalo tiene:

```json
{
  "id": "identificador-unico-sin-espacios",
  "title": "Título",
  "author": "Autor (opcional, déjalo \"\" si no aplica)",
  "section": "Nombre de la sección",
  "price": 22.9,
  "priceLabel": "Segunda mano",      // opcional: sustituye al precio si lo pones
  "buyLink": "https://...",
  "imageLink": ""                     // opcional: si lo dejas vacío, se intenta
                                       // sacar la portada de buyLink automáticamente
}
```

- `id` tiene que ser único y estable: no lo cambies una vez que la gente
  empiece a reservar, o se perderá la relación con su reserva.
- Si `imageLink` está vacío, la tarjeta pide la imagen de portada de la
  página de `buyLink` a través de [Microlink](https://microlink.io) (gratis
  hasta un volumen razonable, sin necesidad de cuenta). Si esa página no
  tiene una imagen reconocible, se muestra el título en su lugar.
- Añade tantas secciones como quieras: se agrupan automáticamente por el
  campo `section`.

## 3. Conectar las reservas compartidas (Supabase, gratis)

1. Crea una cuenta gratuita en [supabase.com](https://supabase.com) y un
   proyecto nuevo.
2. En el **SQL Editor** del proyecto, ejecuta:

   ```sql
   create table reservations (
     id uuid primary key default gen_random_uuid(),
     item_id text not null unique,
     reserved_by text not null,
     reserved_at timestamptz not null default now()
   );

   alter table reservations enable row level security;

   -- Cualquiera puede ver qué está reservado
   create policy "Public can read reservations"
     on reservations for select
     using (true);

   -- Cualquiera puede reservar (crear una fila), pero no modificar
   -- ni borrar reservas ajenas
   create policy "Public can insert reservations"
     on reservations for insert
     with check (true);
   ```

   La restricción `unique` en `item_id` es la que impide que dos personas
   reserven el mismo regalo a la vez: si dos reservas llegan casi a la vez,
   la segunda falla con un error que la app interpreta como "ya reservado" y
   refresca el estado.

3. En **Project Settings → API**, copia la `Project URL` y la clave
   `anon public`.
4. Copia `.env.example` a `.env.local` y pega ahí esos dos valores:

   ```bash
   cp .env.example .env.local
   ```

5. Reinicia `npm run dev`. El aviso de "modo de prueba local" desaparecerá:
   ya estás guardando reservas de verdad, compartidas entre todo el que abra
   el enlace.

## 4. Desplegar gratis

Cualquiera de estas dos opciones funciona igual de bien con este proyecto
(build estático de Vite):

**Vercel**
1. Sube este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), "Add New Project" → importa el repo.
3. En "Environment Variables", añade `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` con los mismos valores de tu `.env.local`.
4. Deploy. Cada `git push` vuelve a desplegar automáticamente.

**Netlify**
1. Sube el repo a GitHub.
2. En [netlify.com](https://netlify.com), "Add new site" → importa el repo.
   Build command: `npm run build`. Publish directory: `dist`.
3. En "Site configuration → Environment variables", añade las mismas dos
   variables que arriba.
4. Deploy.

Ninguna de las dos pide tarjeta para este uso.

## Cómo funciona la reserva

- Al cargar la página, la app pide la lista de regalos (fija, del JSON) y la
  lista de reservas (de Supabase).
- Al pulsar "Lo compro yo", se pide el nombre y se intenta insertar una fila
  en `reservations`. Si otra persona ya reservó ese mismo item un segundo
  antes, la base de datos rechaza el duplicado y la app avisa de que hay que
  refrescar.
- Reservar es intencionadamente irreversible desde la propia app (no hay
  botón de "deshacer reserva"): si alguien se equivoca, edita la tabla
  directamente desde el panel de Supabase.
