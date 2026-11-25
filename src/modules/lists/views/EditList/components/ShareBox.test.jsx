import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeList } from '@/test/factories'
import ShareBox from './ShareBox'

describe('ShareBox', () => {
  it('shows the share link and copies it', async () => {
    const user = userEvent.setup()
    const { share_slug } = makeList()
    const url = `${window.location.origin}/l/${share_slug}`
    render(<ShareBox slug={share_slug} />)

    await user.click(screen.getByTestId('copy-button'))

    expect(screen.getByTestId('share-url')).toHaveTextContent(url)
    expect(await navigator.clipboard.readText()).toBe(url)
  })

  it('opens the friend view in a new tab', () => {
    const { share_slug } = makeList()
    render(<ShareBox slug={share_slug} />)

    const link = screen.getByTestId('view-as-friend')
    expect(link).toHaveAttribute(
      'href',
      `${window.location.origin}/l/${share_slug}`,
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})
