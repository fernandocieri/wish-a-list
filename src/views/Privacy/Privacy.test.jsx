import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CONTACT_EMAIL } from '@/config'
import Privacy from './Privacy'

describe('Privacy', () => {
  it('renders the policy with a way to contact us', () => {
    render(<Privacy />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    const mailtos = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(mailtos).toContain(`mailto:${CONTACT_EMAIL}`)
  })
})
