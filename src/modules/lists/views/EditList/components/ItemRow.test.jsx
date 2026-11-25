import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import { ApiError } from '@/lib/errors'
import { makeItem } from '@/test/factories'
import { useItemMutations } from '../hooks/useItemMutations'
import ItemRow from './ItemRow'

vi.mock('../hooks/useItemMutations', () => ({ useItemMutations: vi.fn() }))

const mutation = (overrides = {}) => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
  ...overrides,
})

function renderRow({ item = makeItem(), update = {}, remove = {} } = {}) {
  const mutations = {
    create: mutation(),
    update: mutation(update),
    remove: mutation(remove),
  }
  useItemMutations.mockReturnValue(mutations)
  render(
    <ul>
      <ItemRow item={item} listId={faker.string.uuid()} sections={[]} />
    </ul>,
  )
  return { item, ...mutations }
}

describe('ItemRow', () => {
  it('shows the item title and its formatted price', () => {
    const { item } = renderRow({ item: makeItem({ price: 12.5 }) })

    expect(screen.getByTestId('item-row')).toHaveTextContent(item.title)
    expect(screen.getByTestId('item-price')).toHaveTextContent('12,50€')
  })

  it('edits the item inline and saves the changes', async () => {
    const user = userEvent.setup()
    const { item, update } = renderRow()
    const title = faker.commerce.productName()

    await user.click(screen.getByTestId('edit-item'))
    const titleInput = document.querySelector('[name="title"]')
    await user.clear(titleInput)
    await user.type(titleInput, title)
    await user.click(screen.getByTestId('item-submit'))

    const [{ id, fields }] = update.mutate.mock.calls[0]
    expect(id).toBe(item.id)
    expect(fields.title).toBe(title)
  })

  it('leaves edit mode on cancel', async () => {
    const user = userEvent.setup()
    renderRow()

    await user.click(screen.getByTestId('edit-item'))
    await user.click(screen.getByTestId('item-cancel'))

    expect(screen.queryByTestId('item-form')).not.toBeInTheDocument()
  })

  it('shows the save error while editing', async () => {
    const user = userEvent.setup()
    renderRow({ update: { error: new ApiError('unknown') } })

    await user.click(screen.getByTestId('edit-item'))

    expect(screen.getByTestId('item-form-error')).toBeInTheDocument()
  })

  it('deletes the item only after confirmation', async () => {
    const user = userEvent.setup()
    const { item, remove } = renderRow()

    await user.click(screen.getByTestId('delete-item'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(remove.mutate).not.toHaveBeenCalled()
    await user.click(screen.getByTestId('confirm-accept'))

    expect(remove.mutate.mock.calls[0][0]).toBe(item.id)
  })

  it('keeps the item when the deletion is cancelled', async () => {
    const user = userEvent.setup()
    const { remove } = renderRow()

    await user.click(screen.getByTestId('delete-item'))
    await user.click(screen.getByTestId('confirm-cancel'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(remove.mutate).not.toHaveBeenCalled()
  })
})
