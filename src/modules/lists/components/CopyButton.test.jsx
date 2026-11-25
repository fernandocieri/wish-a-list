import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import CopyButton from './CopyButton'

describe('CopyButton', () => {
  it('copies the text to the clipboard', async () => {
    const user = userEvent.setup()
    const url = faker.internet.url()
    render(<CopyButton text={url} />)

    await user.click(screen.getByTestId('copy-button'))

    expect(await navigator.clipboard.readText()).toBe(url)
    expect(screen.getByTestId('copy-button')).toHaveAttribute(
      'data-status',
      'copied',
    )
  })

  it('reports a failure when the clipboard is unavailable', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('denied'),
    )
    render(<CopyButton text={faker.internet.url()} />)

    await user.click(screen.getByTestId('copy-button'))

    expect(screen.getByTestId('copy-button')).toHaveAttribute(
      'data-status',
      'failed',
    )
  })
})
