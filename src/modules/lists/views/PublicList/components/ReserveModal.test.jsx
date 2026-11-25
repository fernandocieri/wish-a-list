import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import { makePublicItem } from '@/test/factories'
import { saveFriendName } from '../helpers/friendName'
import ReserveModal from './ReserveModal'

function renderModal(props = {}) {
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  render(
    <ReserveModal
      item={makePublicItem()}
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
  )
  return { onConfirm, onClose, input: screen.getByRole('textbox') }
}

describe('ReserveModal', () => {
  it('confirms with the trimmed name', async () => {
    const user = userEvent.setup()
    const name = faker.person.firstName()
    const { onConfirm, input } = renderModal()

    await user.type(input, `  ${name}  `)
    await user.click(screen.getByTestId('reserve-confirm'))

    expect(onConfirm).toHaveBeenCalledWith(name)
  })

  it('prefills the name used last time', () => {
    const name = faker.person.firstName()
    saveFriendName(name)

    const { input } = renderModal()

    expect(input).toHaveValue(name)
  })

  it('cannot confirm with a blank name', async () => {
    const user = userEvent.setup()
    const { input } = renderModal()

    await user.type(input, '   ')

    expect(screen.getByTestId('reserve-confirm')).toBeDisabled()
  })

  it('caps the name at the database limit', () => {
    const { input } = renderModal()

    expect(input).toHaveAttribute('maxLength', '40')
  })

  it.each([
    'already-reserved',
    'reservation_limit',
    'anonymous-disabled',
    'unknown',
  ])('shows an alert for %s', (errorCode) => {
    renderModal({ errorCode })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows no alert without an error', () => {
    renderModal()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('closes on cancel', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()

    await user.click(screen.getByTestId('reserve-cancel'))

    expect(onClose).toHaveBeenCalled()
  })
})
