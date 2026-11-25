import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { faker } from '@faker-js/faker'
import { ApiError } from '@/lib/errors'
import { makePublicItem, makePublicList } from '@/test/factories'
import { usePublicList } from './hooks/usePublicList'
import { useReserve } from './hooks/useReserve'
import { useUndoReservation } from './hooks/useUndoReservation'
import PublicList from './PublicList'

vi.mock('./hooks/usePublicList', () => ({ usePublicList: vi.fn() }))
vi.mock('./hooks/useReserve', () => ({ useReserve: vi.fn() }))
vi.mock('./hooks/useUndoReservation', () => ({ useUndoReservation: vi.fn() }))

const mutation = (overrides = {}) => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  variables: undefined,
  ...overrides,
})

function renderPage({ list, query = {}, reserve = {}, undo = {} } = {}) {
  const slug = faker.string.alphanumeric(16)
  usePublicList.mockReturnValue({
    data: list,
    isPending: false,
    error: null,
    ...query,
  })
  const reserveMutation = mutation(reserve)
  const undoMutation = mutation(undo)
  useReserve.mockReturnValue(reserveMutation)
  useUndoReservation.mockReturnValue(undoMutation)
  render(
    <MemoryRouter initialEntries={[`/l/${slug}`]}>
      <Routes>
        <Route path="/l/:slug" element={<PublicList />} />
      </Routes>
    </MemoryRouter>,
  )
  return { slug, reserve: reserveMutation, undo: undoMutation }
}

describe('PublicList', () => {
  it('loads the list from the slug in the URL', () => {
    const { slug } = renderPage({ list: makePublicList() })

    expect(usePublicList).toHaveBeenCalledWith(slug)
    expect(useReserve).toHaveBeenCalledWith(slug)
    expect(useUndoReservation).toHaveBeenCalledWith(slug)
  })

  it('shows the title and the items grouped by section', () => {
    const items = [
      makePublicItem({ section: 'Libros' }),
      makePublicItem({ section: 'Spa' }),
      makePublicItem({ section: 'Libros' }),
    ]
    const list = makePublicList({ items })
    renderPage({ list })

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      list.title,
    )
    const sections = screen.getAllByTestId('public-section')
    expect(sections).toHaveLength(2)
    expect(within(sections[0]).getAllByTestId('gift-card')).toHaveLength(2)
  })

  it('reserves the chosen item with the typed name', async () => {
    const user = userEvent.setup()
    const item = makePublicItem()
    const name = faker.person.firstName()
    const { reserve } = renderPage({ list: makePublicList({ items: [item] }) })

    await user.click(screen.getByTestId('reserve-button'))
    await user.type(screen.getByRole('textbox'), name)
    await user.click(screen.getByTestId('reserve-confirm'))

    expect(reserve.mutate.mock.calls[0][0]).toEqual({ itemId: item.id, name })
  })

  it('shows the reserve error in the modal', async () => {
    const user = userEvent.setup()
    renderPage({
      list: makePublicList({ items: [makePublicItem()] }),
      reserve: { error: new ApiError('already-reserved') },
    })

    await user.click(screen.getByTestId('reserve-button'))

    expect(screen.getByTestId('reserve-error')).toBeInTheDocument()
  })

  it('undoes my reservation', async () => {
    const user = userEvent.setup()
    const item = makePublicItem({
      reservation: { reserved_by: faker.person.firstName(), is_mine: true },
    })
    const { undo } = renderPage({ list: makePublicList({ items: [item] }) })

    await user.click(screen.getByTestId('undo-button'))

    expect(undo.mutate).toHaveBeenCalledWith(item.id)
  })

  it('shows an alert when undo fails', () => {
    renderPage({ list: makePublicList(), undo: { isError: true } })

    expect(screen.getByTestId('undo-error')).toBeInTheDocument()
  })

  it('shows the owner banner and no reserve controls to the owner', () => {
    const list = makePublicList({
      is_owner: true,
      items: [makePublicItem(), makePublicItem()],
    })
    renderPage({ list })

    expect(screen.getByTestId('owner-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('reserve-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('reserved-by')).not.toBeInTheDocument()
  })

  it('shows no owner banner to a friend', () => {
    renderPage({ list: makePublicList({ items: [makePublicItem()] }) })

    expect(screen.queryByTestId('owner-banner')).not.toBeInTheDocument()
    expect(screen.getByTestId('reserve-button')).toBeInTheDocument()
  })

  it('shows an empty state with no items', () => {
    renderPage({ list: makePublicList() })

    expect(screen.getByTestId('no-items')).toBeInTheDocument()
  })

  it('shows "not found" for an unknown slug', () => {
    renderPage({ query: { error: new ApiError('not-found') } })

    expect(screen.getByTestId('list-not-found')).toBeInTheDocument()
  })

  it('shows an alert when the list cannot be loaded', () => {
    renderPage({ query: { error: new ApiError('unknown') } })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
