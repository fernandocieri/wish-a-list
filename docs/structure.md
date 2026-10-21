# Project structure

The code is organized by **domain**. Each domain is a *module*; each screen in a module is a *view*.
Code lives as close as possible to where it is used and moves up only when it is shared.

```
src/
  main.jsx                       # providers: QueryClientProvider > AuthProvider > router
  App.jsx                        # router + the "/" switch (Landing vs Dashboard)
  config.js                      # APP_NAME, limits
  index.css

  modules/
    auth/
      views/
        Landing/                 # pitch + "Continuar con Google" (+ email code in Batch 7)
          Landing.jsx
          components/            # Pitch, GoogleSignInButton, EmailCodeForm (Batch 7)
          hooks/                 # useEmailCodeLogin (Batch 7: cooldown, states)
      components/                # RequireAuth
      hooks/                     # useAuth
      AuthProvider.jsx
      api.js                     # signInWithOAuth, signOut, lazy signInAnonymously
      index.js

    lists/
      views/
        Dashboard/               # "Mis listas"
          Dashboard.jsx
          components/            # ListRow, NewListForm, DeleteListDialog
          hooks/                 # useMyLists
        EditList/                # owner editor at /lists/:id
          EditList.jsx
          components/            # ShareBox, ItemForm, ItemRow, SectionGroup
          hooks/                 # useEditableList, useItemMutations
          helpers/               # suggestSections, validateLink
          api.js                 # item CRUD (owner only)
        PublicList/              # friend view at /l/:slug
          PublicList.jsx
          components/            # GiftCard, ReserveModal, OwnerBanner
          hooks/                 # usePublicList (refetch on focus), useReserve
          helpers/               # friendName storage
          api.js                 # get_list, reserve, undo
          queries.js             # publicListKeys + queryOptions; private to this view
      components/                # shared in module: CopyButton
      hooks/                     # shared in module: useList (single list by id)
      helpers/                   # formatPrice, groupBySection, shareUrl
      api.js                     # list CRUD: create, rename, delete, count
      queries.js                 # listKeys + queryOptions for owner data (lists, items)
      index.js

  components/                    # app-wide shared: Layout, Modal, Button, Spinner, ErrorState
  hooks/                         # app-wide: useDocumentTitle
  lib/                           # supabase.js client, queryClient.js, errors.js (Postgres error -> ApiError code)
  views/NotFound/                # app-level view, belongs to no domain
```

Outside `src/`: `supabase/` (migrations, tests), `scripts/`, `public/`, `docs/`.
Folders in the tree are created when the first file needs them, not up front.

## Vocabulary

- **Module:** a domain (`auth`, `lists`). Its top-level `components/`, `hooks/`, `helpers/`, `api.js` and
  `queries.js` are shared *between that module's views only*.
- **View:** a screen mapped to a route. A folder named after the view, with the view component at its root and its
  own `components/`, `hooks/`, `helpers/`, `api.js` and `queries.js` as needed.
- **Root folders** (`src/components`, `src/hooks`, `src/lib`): shared across modules.

## Rules

1. **Where code goes.** Used by one view: it stays in that view. Used by two views of a module: move it to the module
   folder. Used by two modules: move it to the root folders. Do not hoist code "just in case".
2. **Imports go down only.** A view may import from its own folder, its module, the root folders, and `auth` through
   its `index.js`. Views never import from sibling views. Modules never import another module's views or internals;
   they use its `index.js`.
   **Path style:** `@/` is an alias for `src/`. Use it for anything outside the current module (`@/lib/supabase`,
   `@/test/queryWrapper`, `@/modules/auth`); keep relative paths (`./`, `../`) inside a module.
3. **Routing.** `App.jsx` imports views from each module's `index.js` and maps routes to them. Its only logic is the
   `/` switch: `Landing` when there is no real account, `Dashboard` when there is.
4. **Data handling.** Server state goes through TanStack Query. The layers are
   `api.js` → `queries.js` → hooks → components:
   - `api.js` files are the only code that calls Supabase, using the client from `lib/supabase.js`. They return data
     and **throw** an `ApiError` from `lib/errors.js` (with a `code` such as `already-reserved` or `list_limit`) on
     failure. Mapping a code to Spanish text happens in the UI, not in `api.js` or `errors.js`.
   - `queries.js` sits next to an `api.js` that has reads. It holds that level's query key factory and
     `queryOptions()` factories, so a key and its fetcher are defined once. Keep mutations in the hook that uses them
     unless two hooks share one (rule 1).
   - Hooks call `useQuery` / `useMutation` with those factories. Components call hooks and never call `useQuery`,
     `queryClient` or Supabase directly.
   - The auth session is not server state: it lives in `AuthProvider`, which clears the query cache on sign-out or
     when the signed-in account changes.
   - If one level's data code outgrows a single `queries.js` (roughly 150+ lines), turn that level into a
     `repository/` folder containing `api.js`, `keys.js`, `queries.js` and `mutations.js`. Do it per level, never as a
     global or module-wide folder that would mix in another view's data.
5. **Reservations stay in `PublicList`.** `get_list`, reserve and undo live in `views/PublicList/api.js`, and their
   cache keys in `views/PublicList/queries.js`, under a root (`['public-list', ...]`) separate from `['lists', ...]`.
   Nothing in `Dashboard`, `EditList` or the module-level `lists/api.js` / `lists/queries.js` reads or writes
   reservations, and nothing imports `PublicList` internals or uses its keys. This is how "owners never see
   reservations" is enforced in code.
6. **Naming.** Folders are `kebab-case` except views, which use the component's `PascalCase`. Components are
   `PascalCase.jsx`, hooks start with `use`, helpers are plain `camelCase.js`.

## Mapping from the pre-restructure files

| Before | After |
| --- | --- |
| `src/App.jsx` | `modules/lists/views/PublicList/PublicList.jsx` (new `App.jsx` is the router) |
| `src/components/GiftCard.jsx` | `modules/lists/views/PublicList/components/GiftCard.jsx` |
| `src/components/ReserveModal.jsx` | `modules/lists/views/PublicList/components/ReserveModal.jsx` |
| `src/lib/reservations.js` | `modules/lists/views/PublicList/api.js` (rewritten for the new schema), plus `queries.js` and hooks when TanStack Query is added |
| `src/data/items.json` | stays under `PublicList/` until the Batch 5 cutover, then removed |
