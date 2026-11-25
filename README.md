# Wish-a-List

Interactive wishlist: anyone can reserve a gift by typing just their name, and
everyone else sees it marked as reserved in real time.

## 1. Try it locally

```bash
pnpm install
pnpm dev
```

The app needs a Supabase project: before starting it, create `.env.local` with
its keys (see step 3). The list lives at `/l/<any-text>`.

## 2. Edit the gift catalog

Everything lives in `src/modules/lists/views/PublicList/data/items.json`. Each gift has:

```json
{
  "id": "unique-identifier-without-spaces",
  "title": "Title",
  "author": "Author (optional, leave \"\" if it doesn't apply)",
  "section": "Section name",
  "price": 22.9,
  "priceLabel": "Second hand", // optional: replaces the price if set
  "buyLink": "https://...",
  "imageLink": "" // optional: if left empty, the cover is
  // fetched from buyLink automatically
}
```

- `id` must be unique and stable: don't change it once people start
  reserving, or their reservation will be lost.
- If `imageLink` is empty, the card requests the cover image of the `buyLink`
  page through [Microlink](https://microlink.io) (free up to a reasonable
  volume, no account needed). If that page has no recognizable image, the
  title is shown instead.
- Add as many sections as you like: gifts are grouped automatically by the
  `section` field.

## 3. Connect shared reservations (Supabase, free)

1. Create a free account at [supabase.com](https://supabase.com) and a new
   project.
2. In the project's **SQL Editor**, run:

   ```sql
   create table reservations (
     id uuid primary key default gen_random_uuid(),
     item_id text not null unique,
     reserved_by text not null,
     reserved_at timestamptz not null default now()
   );

   alter table reservations enable row level security;

   -- Anyone can see what is reserved
   create policy "Public can read reservations"
     on reservations for select
     using (true);

   -- Anyone can reserve (create a row), but not modify
   -- or delete other people's reservations
   create policy "Public can insert reservations"
     on reservations for insert
     with check (true);
   ```

   The `unique` constraint on `item_id` is what prevents two people from
   reserving the same gift at once: if two reservations arrive almost
   simultaneously, the second one fails with an error that the app interprets
   as "already reserved" and refreshes the state.

3. In **Project Settings → API**, copy the `Project URL` and the `anon public`
   key.
4. Copy `.env.example` to `.env.local` and paste those two values there:

   ```bash
   cp .env.example .env.local
   ```

5. Restart `pnpm dev`: you are now saving real reservations, shared with
   everyone who opens the link.

## 3b. Sign in with Google

People who create lists sign in with Google; people who reserve don't need an
account (they get an anonymous session). There is one development Supabase
project and one production project, and a single Google Cloud project with one
OAuth client for each (`Wish-a-List dev` and `Wish-a-List prod`).

1. **Google Auth Platform → Branding:** app name, support email, link to the
   privacy policy (`https://<domain>/privacy`) and `<ref>.supabase.co` as an
   authorized domain (`<ref>` is the Project ID in Supabase → Project
   Settings → General).
2. **Data access:** only `openid`, `email` and `profile` (no Google review
   required).
3. **Audience:** publish the app ("In production"). In Testing mode only test
   users can sign in.
4. **Clients:** create a Web client with the redirect URI
   `https://<ref>.supabase.co/auth/v1/callback` and paste its client ID and
   secret into Supabase → Authentication → Sign In / Providers → Google.
5. **Supabase → Authentication → URL Configuration:**
   - Development: Site URL `http://localhost:5173`; Redirect URLs
     `http://localhost:5173/**` and the Vercel preview pattern
     (`https://wish-a-list-*-<team>.vercel.app/**`).
   - Production: only the production URL (and `/**`), no localhost.
6. **Supabase → Authentication → Sign In / Providers:** enable
   _anonymous sign-ins_ (used by friends when reserving).
7. **Variables:** `.env.local` and Vercel's **Preview** environment point to
   the development project; Vercel's **Production** environment points to the
   production one.

## 4. Deploy for free

Either of these two options works equally well with this project (static Vite
build):

**Vercel**

1. Push this project to a GitHub repository.
2. On [vercel.com](https://vercel.com), "Add New Project" → import the repo.
3. Under "Environment Variables", add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` with the same values as your `.env.local`.
4. Deploy. Every `git push` redeploys automatically.

**Netlify**

1. Push the repo to GitHub.
2. On [netlify.com](https://netlify.com), "Add new site" → import the repo.
   Build command: `pnpm build`. Publish directory: `dist`.
3. Under "Site configuration → Environment variables", add the same two
   variables as above.
4. Deploy.

Neither asks for a card for this use.

## How reservations work

- A friend opens the share link (`/l/<slug>`). The page reads the list through
  the `get_list(slug)` database function; viewing creates no session. An
  unknown slug shows "Esta lista no existe".
- On the first "Lo compro yo", the app signs the friend in anonymously
  (Supabase anonymous sign-ins must be enabled) and inserts a row into
  `reservations` tied to that session. The name is remembered in the browser
  to prefill the next reservation.
- If someone else reserved the same item a second earlier, the database
  rejects the duplicate and the app says so and refreshes the list. One person
  can reserve at most 10 items per list.
- Only the person who reserved can undo it, from the same browser
  ("Deshacer"). The list refreshes when the tab regains focus, so friends see
  each other's reservations without reloading.
- The list's owner never receives reservation data: `get_list` leaves it out
  for them, and the page shows a banner instead of the reserve buttons.
