# Testing

Unit and component tests run on **Vitest** with **React Testing Library**. Data comes from **faker**.
Existing (pre-restructure) code is not covered. **Every new helper, `api.js`, hook and view ships with a colocated test
in the same commit.** There is no coverage threshold: a number tends to produce low-value tests, and the rule is
enforced in review.

## Stack

| Tool                                             | Role                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `vitest` (3.x)                                   | Runner. Reuses `vite.config.js`. Pinned to 3.x because Vitest 5 requires Vite 6+ and the project is on Vite 5. |
| `jsdom` (26.x)                                   | DOM environment. Pinned because 30.x fails to load on Node 22.4.                                               |
| `@testing-library/react`, `@testing-library/dom` | Render components and query them the way a user sees them.                                                     |
| `@testing-library/user-event`                    | Realistic typing and clicking. Prefer it over `fireEvent`.                                                     |
| `@testing-library/jest-dom`                      | Readable matchers: `toBeDisabled`, `toHaveTextContent`, `toBeInTheDocument`.                                   |
| `@faker-js/faker`                                | Test data.                                                                                                     |

Not used on purpose: MSW (Supabase is mocked at the `api.js` boundary, there is no network to intercept), Playwright
(possible later for the two-browser reservation flow), coverage tooling.

## Running

```bash
npm test            # run everything once
npm run test:watch  # watch mode
npx vitest run path/to/File.test.jsx   # one file
```

Run `npm test` and `npm run build` before declaring a batch done.

## Layout

- Tests are **colocated**: `GiftCard.jsx` sits next to `GiftCard.test.jsx`, `api.js` next to `api.test.js`.
  They follow the module/view structure in `structure.md`.
- `src/test/setup.js` is the only global setup. It registers the jest-dom matchers, cleans up the DOM and
  `localStorage` after each test, and reseeds faker before each test.
- `restoreMocks` and `clearMocks` are on in `vite.config.js`, so mocks reset between tests automatically.
- Shared test helpers (for example a `renderWithProviders` that wraps the router and `AuthProvider`, or data
  factories) go in `src/test/` and are added when a second test needs them, not up front. The first one needed is
  `src/test/queryWrapper.jsx`: `createQueryWrapper()` returns a wrapper with a **new** `QueryClient` per call, with
  `retry: false` for queries and mutations, so hook tests share no cache and error paths fail fast.
- File names: `*.test.js` for plain logic, `*.test.jsx` for anything that renders.

## What to test per layer

| Layer                   | How                                                                                                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `helpers/`              | Plain unit tests, table-driven with `it.each`. Highest value, cheapest to write.                                                                                                                                                 |
| `api.js`                | Mock the Supabase client with `vi.mock` on `lib/supabase`. Assert the query shape and that failures throw an `ApiError` with the right `code` (`23505` to `already-reserved`, `list_limit` to `list_limit`), never display text. |
| `queries.js`            | Usually covered through hook tests. One cheap guard is worth keeping: `PublicList` keys never start with `'lists'`.                                                                                                              |
| `hooks/`                | `renderHook` with `api.js` mocked and `wrapper: createQueryWrapper()`. Test states (loading, error, refetch on focus, invalidation after a mutation, including a failed one), not implementation.                                |
| `components/` and views | Render, interact, assert on visible text and roles. Mock the view's hooks, so no `QueryClient` is needed; never mock its internals.                                                                                              |
| RLS and `get_list`      | **Not Vitest.** Security rules are proven with `supabase/tests/rls_checks.sql` against a real database. Mocked tests cannot prove them.                                                                                          |

## Writing conventions

1. **Query by role and stable hooks, never by UI copy.** The UI is Spanish today and may be localized later, so tests
   must not depend on the wording of any UI text (labels, buttons, headings, messages). Query by role and position
   (`getByRole('button')`, `getAllByRole('listitem')`), by `data-testid` on the elements whose identity matters
   (`data-testid="reserve-button"`), or by an `aria-*` / `name` attribute that is not translated (a form field's
   `name="title"`). When a role alone is ambiguous, add a `data-testid` instead of matching the text.
2. **Test behavior, not implementation.** Assert on what the user or caller observes. Do not assert on state
   variables, render counts or internal function calls (except the call that crosses a boundary, such as `api.js`).
3. **Mock at one boundary.** For a view or hook, mock its `api.js`. Do not mock React, child components or hook
   internals unless they are slow or unrelated to what the test covers.
4. **Arrange, act, assert.** One behavior per test. Name tests as specs:
   `it('shows "already reserved" when the insert hits a unique violation')`.
   Group with `describe` per unit; do not nest more than two levels.
5. **No shared mutable state.** Each test sets up what it needs. Tests must pass in any order and alone.
6. **Async the right way.** Create the user with `const user = userEvent.setup()` and `await user.click(...)`.
   Wait for async UI with `findBy...` or `waitFor`. Never use `setTimeout` or fixed sleeps.
7. **Never assert on UI copy.** Do not match visible Spanish text, in regexes or otherwise, so that adding
   localization or rewording a message never breaks a test. Assert on structure, state and data instead:
   - _Data the user typed or the factory produced is not copy_ and can be asserted: a reserver's name, an item
     title, a price value from `makeItem`.
   - _Errors and states_: `api.js` and `lib/errors.js` throw `ApiError`s carrying codes (`already-reserved`, `list_limit`), and the
     UI renders them in an element with `role="alert"` or a `data-testid`. Test the code mapping in unit tests, and in
     component tests assert that the alert exists, not what it says.
   - _Enabled/disabled, present/absent, checked, count of items_: assert these with jest-dom matchers.
8. **Business rules get tests first.** The ones that matter most here: owners never see reservations, link
   validation mirrors the database constraints, limit messages (`list_limit`, `item_limit`, `reservation_limit`),
   only the reserver can undo. UI polish needs thinner coverage.
9. **Cover the failure paths.** Every `api.js` function and form needs at least one error or invalid-input test, not
   only the happy path.
10. **Keep tests small and readable.** If a test needs a long setup, extract a helper or factory. If a test is hard
    to write, the code under test is probably doing too much.

## Test data with faker

- Import `faker` from `@faker-js/faker`. It is **reseeded with a fixed seed before every test** (`setup.js`), so data
  looks random but is identical on every run and on CI. A failure is always reproducible.
- Use faker for values the test does **not** care about (a name, a title, a price). Write literal values for the ones
  it does care about, so the test explains itself: a slug of 65 characters, `javascript:alert(1)`, a count of 20.
- Do not assert on faker output by hardcoding it. Generate the value, keep it in a variable, and assert against that
  variable.
- Build objects through small factory functions with overrides, so a test states only what is relevant:

  ```js
  // src/test/factories.js (create when the first test needs it)
  import { faker } from '@faker-js/faker'

  export const makeItem = (overrides = {}) => ({
    id: faker.string.uuid(),
    title: faker.commerce.productName(),
    price: faker.number.float({ min: 1, max: 100, fractionDigits: 2 }),
    buy_link: faker.internet.url(),
    reservation: null,
    ...overrides,
  })

  // in a test
  const reserved = makeItem({
    reservation: { reserved_by: 'Ana', is_mine: false },
  })
  ```

- Use `fakerES` (`import { fakerES as faker } from '@faker-js/faker'`) only if a test needs Spanish-looking data. The
  default locale is fine otherwise.

## Example

```jsx
// GiftCard.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { makeItem } from '@/test/factories'
import GiftCard from './GiftCard'

describe('GiftCard', () => {
  it('lets a friend reserve a free item', async () => {
    const user = userEvent.setup()
    const onReserve = vi.fn()
    const item = makeItem()
    render(<GiftCard item={item} onReserveClick={onReserve} />)

    await user.click(screen.getByTestId('reserve-button'))

    expect(onReserve).toHaveBeenCalledWith(item)
  })

  it('hides the reserve button when someone else reserved it', () => {
    const item = makeItem({
      reservation: { reserved_by: 'Ana', is_mine: false },
    })
    render(<GiftCard item={item} />)

    expect(screen.getByTestId('reserved-by')).toHaveTextContent('Ana') // Ana is data, not copy
    expect(screen.queryByTestId('reserve-button')).not.toBeInTheDocument()
  })
})
```
