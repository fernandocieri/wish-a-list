import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '@/lib/errors'
import { makeList } from '@/test/factories'
import { useCreateList } from './hooks/useCreateList'
import { useDeleteList } from './hooks/useDeleteList'
import { useMyLists } from './hooks/useMyLists'
import Dashboard from './Dashboard'

vi.mock('./hooks/useMyLists', () => ({ useMyLists: vi.fn() }))
vi.mock('./hooks/useCreateList', () => ({ useCreateList: vi.fn() }))
vi.mock('./hooks/useDeleteList', () => ({ useDeleteList: vi.fn() }))

function renderDashboard({ lists = [], query = {}, deletion = {} } = {}) {
  useMyLists.mockReturnValue({
    data: lists,
    isPending: false,
    isError: false,
    ...query,
  })
  useCreateList.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  })
  const mutate = vi.fn()
  useDeleteList.mockReturnValue({
    mutate,
    reset: vi.fn(),
    isPending: false,
    isError: false,
    ...deletion,
  })
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  )
  return { deleteMutate: mutate }
}

describe('Dashboard', () => {
  it('shows the empty state and the new list form when there are no lists', () => {
    renderDashboard()

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByTestId('create-list')).toBeInTheDocument()
  })

  it('shows one row per list with its title, item count and actions', () => {
    const list = makeList({ item_count: 7 })
    renderDashboard({ lists: [list, makeList({ item_count: 0 })] })

    const rows = screen.getAllByTestId('list-row')
    expect(rows).toHaveLength(2)
    const first = within(rows[0])
    expect(first.getByRole('link', { name: list.title })).toHaveAttribute(
      'href',
      `/lists/${list.id}`,
    )
    expect(first.getByTestId('item-count')).toHaveTextContent('7')
    expect(first.getByTestId('edit-list')).toHaveAttribute(
      'href',
      `/lists/${list.id}`,
    )
    expect(first.getByTestId('copy-button')).toBeInTheDocument()
  })

  it('copies the share link of a list', async () => {
    const user = userEvent.setup()
    const list = makeList({ item_count: 1 })
    renderDashboard({ lists: [list] })

    await user.click(screen.getByTestId('copy-button'))

    expect(await navigator.clipboard.readText()).toBe(
      `${window.location.origin}/l/${list.share_slug}`,
    )
  })

  it('deletes a list only after confirmation', async () => {
    const user = userEvent.setup()
    const list = makeList({ item_count: 1 })
    const { deleteMutate } = renderDashboard({ lists: [list] })

    await user.click(screen.getByTestId('delete-list'))
    expect(deleteMutate).not.toHaveBeenCalled()
    await user.click(screen.getByTestId('confirm-accept'))

    expect(deleteMutate.mock.calls[0][0]).toBe(list.id)
  })

  it('keeps the list when the deletion is cancelled', async () => {
    const user = userEvent.setup()
    const { deleteMutate } = renderDashboard({
      lists: [makeList({ item_count: 1 })],
    })

    await user.click(screen.getByTestId('delete-list'))
    await user.click(screen.getByTestId('confirm-cancel'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deleteMutate).not.toHaveBeenCalled()
  })

  it('shows an alert when the lists cannot be loaded', () => {
    renderDashboard({
      lists: undefined,
      query: { isError: true, error: new ApiError('unknown') },
    })

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })
})
