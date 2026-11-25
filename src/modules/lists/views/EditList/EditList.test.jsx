import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { faker } from '@faker-js/faker'
import { ApiError } from '@/lib/errors'
import { makeItem, makeList } from '@/test/factories'
import { useEditableList } from './hooks/useEditableList'
import { useItemMutations } from './hooks/useItemMutations'
import { useRenameList } from './hooks/useRenameList'
import EditList from './EditList'

vi.mock('./hooks/useEditableList', () => ({ useEditableList: vi.fn() }))
vi.mock('./hooks/useRenameList', () => ({ useRenameList: vi.fn() }))
vi.mock('./hooks/useItemMutations', () => ({ useItemMutations: vi.fn() }))

const mutation = (overrides = {}) => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  ...overrides,
})

function renderEditor({ list = null, query = {}, create = {} } = {}) {
  const id = list?.id ?? faker.string.uuid()
  useEditableList.mockReturnValue({
    data: list ?? undefined,
    isPending: false,
    error: null,
    ...query,
  })
  const rename = mutation()
  useRenameList.mockReturnValue(rename)
  const mutations = {
    create: mutation(create),
    update: mutation(),
    remove: mutation(),
  }
  useItemMutations.mockReturnValue(mutations)
  render(
    <MemoryRouter initialEntries={[`/lists/${id}`]}>
      <Routes>
        <Route path="/lists/:id" element={<EditList />} />
      </Routes>
    </MemoryRouter>,
  )
  return { id, rename, create: mutations.create }
}

const makeListWithItems = (items) => ({ ...makeList(), items })

describe('EditList', () => {
  it('loads the list from the id in the URL', () => {
    const list = makeListWithItems([])
    renderEditor({ list })

    expect(useEditableList).toHaveBeenCalledWith(list.id)
  })

  it('shows the share box with the list link', () => {
    const list = makeListWithItems([])
    renderEditor({ list })

    expect(screen.getByTestId('share-url')).toHaveTextContent(
      `/l/${list.share_slug}`,
    )
  })

  it('groups items by section in creation order', () => {
    const books = 'Libros'
    const spa = 'Spa'
    const items = [
      makeItem({ section: books }),
      makeItem({ section: spa }),
      makeItem({ section: books }),
    ]
    renderEditor({ list: makeListWithItems(items) })

    const groups = screen.getAllByTestId('section-group')
    expect(groups).toHaveLength(2)
    expect(within(groups[0]).getByRole('heading')).toHaveTextContent(books)
    const bookRows = within(groups[0]).getAllByTestId('item-row')
    expect(bookRows[0]).toHaveTextContent(items[0].title)
    expect(bookRows[1]).toHaveTextContent(items[2].title)
    expect(within(groups[1]).getAllByTestId('item-row')).toHaveLength(1)
  })

  it('shows an empty state with no items', () => {
    renderEditor({ list: makeListWithItems([]) })

    expect(screen.getByTestId('no-items')).toBeInTheDocument()
  })

  it('adds an item to the list', async () => {
    const user = userEvent.setup()
    const { create } = renderEditor({ list: makeListWithItems([]) })
    const title = faker.commerce.productName()
    const form = screen.getByTestId('item-form')

    await user.type(form.querySelector('[name="title"]'), title)
    await user.type(
      form.querySelector('[name="buy_link"]'),
      faker.internet.url(),
    )
    await user.click(within(form).getByTestId('item-submit'))

    expect(create.mutate.mock.calls[0][0].title).toBe(title)
  })

  it('renames the list on blur', async () => {
    const user = userEvent.setup()
    const list = makeListWithItems([])
    const { rename } = renderEditor({ list })
    const next = faker.lorem.words(3)
    const titleInput = screen.getByDisplayValue(list.title)

    await user.clear(titleInput)
    await user.type(titleInput, next)
    await user.tab()

    expect(rename.mutate).toHaveBeenCalledWith(next)
  })

  it('shows the item limit error on the add form', () => {
    renderEditor({
      list: makeListWithItems([]),
      create: { error: new ApiError('item_limit') },
    })

    expect(screen.getByTestId('item-form-error')).toBeInTheDocument()
  })

  it('shows "not found" for a list that does not exist or is not the owner\'s', () => {
    renderEditor({ query: { error: new ApiError('not-found') } })

    expect(screen.getByTestId('list-not-found')).toBeInTheDocument()
    expect(screen.getByTestId('back-to-dashboard')).toHaveAttribute('href', '/')
  })

  it('shows an alert when the list cannot be loaded', () => {
    renderEditor({ query: { error: new ApiError('unknown') } })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
