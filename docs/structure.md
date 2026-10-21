# Project structure

The code is organized by **domain**. Each domain is a *module*; each screen in a module is a *view*.
Code lives as close as possible to where it is used and moves up only when it is shared.

```
src/
  main.jsx
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
      components/                # shared in module: CopyButton
      hooks/                     # shared in module: useList (single list by id)
      helpers/                   # formatPrice, groupBySection, shareUrl
      api.js                     # list CRUD: create, rename, delete, count
      index.js

  components/                    # app-wide shared: Layout, Modal, Button, Spinner, ErrorState
  hooks/                         # app-wide: useDocumentTitle
  lib/                           # supabase.js client, errors.js (Postgres error -> Spanish message)
  views/NotFound/                # app-level view, belongs to no domain
```

Outside `src/`: `supabase/` (migrations, tests), `scripts/`, `public/`, `docs/`.
Folders in the tree are created when the first file needs them, not up front.

## Vocabulary

- **Module:** a domain (`auth`, `lists`). Its top-level `components/`, `hooks/`, `helpers/` and `api.js` are
  shared *between that module's views only*.
- **View:** a screen mapped to a route. A folder named after the view, with the view component at its root and its
  own `components/`, `hooks/`, `helpers/` and `api.js` as needed.
- **Root folders** (`src/components`, `src/hooks`, `src/lib`): shared across modules.

## Rules

1. **Where code goes.** Used by one view: it stays in that view. Used by two views of a module: move it to the module
   folder. Used by two modules: move it to the root folders. Do not hoist code "just in case".
2. **Imports go down only.** A view may import from its own folder, its module, the root folders, and `auth` through
   its `index.js`. Views never import from sibling views. Modules never import another module's views or internals;
   they use its `index.js`.
3. **Routing.** `App.jsx` imports views from each module's `index.js` and maps routes to them. Its only logic is the
   `/` switch: `Landing` when there is no real account, `Dashboard` when there is.
4. **Data handling.** `api.js` files are the only code that calls Supabase, using the client from `lib/supabase.js`.
   Components call hooks, hooks call `api.js`. No component talks to Supabase directly.
5. **Reservations stay in `PublicList`.** `get_list`, reserve and undo live in `views/PublicList/api.js`. Nothing in
   `Dashboard`, `EditList` or the module-level `lists/api.js` reads or writes reservations, and nothing imports
   `PublicList` internals. This is how "owners never see reservations" is enforced in code.
6. **Naming.** Folders are `kebab-case` except views, which use the component's `PascalCase`. Components are
   `PascalCase.jsx`, hooks start with `use`, helpers are plain `camelCase.js`.

## Mapping from the pre-restructure files

| Before | After |
| --- | --- |
| `src/App.jsx` | `modules/lists/views/PublicList/PublicList.jsx` (new `App.jsx` is the router) |
| `src/components/GiftCard.jsx` | `modules/lists/views/PublicList/components/GiftCard.jsx` |
| `src/components/ReserveModal.jsx` | `modules/lists/views/PublicList/components/ReserveModal.jsx` |
| `src/lib/reservations.js` | `modules/lists/views/PublicList/api.js` (rewritten for the new schema) |
| `src/data/items.json` | stays under `PublicList/` until the Batch 5 cutover, then removed |
