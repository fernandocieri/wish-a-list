import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import { makePublicItem } from '@/test/factories'
import GiftCard from './GiftCard'

const reservedBy = (isMine) =>
  makePublicItem({
    reservation: { reserved_by: faker.person.firstName(), is_mine: isMine },
  })

describe('GiftCard', () => {
  it('lets a friend reserve a free item', async () => {
    const user = userEvent.setup()
    const onReserve = vi.fn()
    const item = makePublicItem()
    render(<GiftCard item={item} onReserveClick={onReserve} />)

    await user.click(screen.getByTestId('reserve-button'))

    expect(onReserve).toHaveBeenCalledWith(item)
    expect(screen.getByTestId('buy-link')).toHaveAttribute(
      'href',
      item.buy_link,
    )
  })

  it('shows who reserved it and hides every action when someone else did', () => {
    const item = reservedBy(false)
    render(<GiftCard item={item} />)

    expect(screen.getByTestId('reserved-by')).toHaveTextContent(
      item.reservation.reserved_by,
    )
    expect(screen.queryByTestId('reserve-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('undo-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('buy-link')).not.toBeInTheDocument()
  })

  it('lets the reserver undo and keeps the buy link', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    const item = reservedBy(true)
    render(<GiftCard item={item} onUndoClick={onUndo} />)

    await user.click(screen.getByTestId('undo-button'))

    expect(onUndo).toHaveBeenCalledWith(item)
    expect(screen.getByTestId('reserved-by-me')).toBeInTheDocument()
    expect(screen.queryByTestId('reserve-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('buy-link')).toBeInTheDocument()
  })

  it('disables undo while it is in progress', () => {
    render(<GiftCard item={reservedBy(true)} isUndoing />)

    expect(screen.getByTestId('undo-button')).toBeDisabled()
  })

  it('hides the reserve button when the viewer cannot reserve', () => {
    render(<GiftCard item={makePublicItem()} canReserve={false} />)

    expect(screen.queryByTestId('reserve-button')).not.toBeInTheDocument()
  })

  it('shows the price label when there is one', () => {
    const item = makePublicItem({ price_label: 'Desde 10€' })
    render(<GiftCard item={item} />)

    expect(screen.getByTestId('item-price')).toHaveTextContent(item.price_label)
  })
})
