import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import ConfirmDialog from './ConfirmDialog'

function renderDialog(props = {}) {
  const handlers = { onConfirm: vi.fn(), onCancel: vi.fn() }
  render(
    <ConfirmDialog
      title={faker.lorem.words(3)}
      message={faker.lorem.sentence()}
      confirmLabel={faker.lorem.word()}
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

describe('ConfirmDialog', () => {
  it('confirms', async () => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = renderDialog()

    await user.click(screen.getByTestId('confirm-accept'))

    expect(onConfirm).toHaveBeenCalled()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it.each([
    [
      'the cancel button',
      (user) => user.click(screen.getByTestId('confirm-cancel')),
    ],
    [
      'the backdrop',
      (user) => user.click(screen.getByTestId('modal-backdrop')),
    ],
    ['Escape', (user) => user.keyboard('{Escape}')],
  ])('cancels with %s', async (_name, act) => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = renderDialog()

    await act(user)

    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('disables confirm while pending', () => {
    renderDialog({ isPending: true })

    expect(screen.getByTestId('confirm-accept')).toBeDisabled()
  })

  it('shows an alert on error', () => {
    renderDialog({ hasError: true })

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
