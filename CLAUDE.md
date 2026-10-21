# Wish-a-List

Multi-user gift wishlist: React 18 + Vite 5 + Tailwind 3 + TanStack Query v5 + Supabase, deployed on Vercel.
The upgrade plan is in `PLAN.md`; code layout in `docs/structure.md`; testing conventions in `docs/testing.md`.

## Working rules

1. **Never weaken RLS.** Do not write policies like `to authenticated using (true)`: anonymous users
   have the `authenticated` role too. Every policy must hinge on `auth.uid()` ownership.
2. Never put the `service_role` key in the frontend, in committed files, or in `VITE_*` variables.
   Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` belong in the client.
3. Owners must never receive reservation data. `get_list()` is the only read path for reservations, and reservation code lives only in `modules/lists/views/PublicList/`.
4. Follow `docs/structure.md` for where files go and what may import what.
5. Keep dependencies minimal. Ask before adding any new one.
6. Follow good practices and avoid code duplication. Before writing something that already exists elsewhere (a
   component, hook, helper, query), propose extracting the shared piece instead of copying it, and place it per
   `docs/structure.md` rule 1 (view → module → root). Extract when the duplication is real, not just in case.
