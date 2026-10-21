import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ApiError } from '@/lib/errors'
import { useAuth } from '@/modules/auth'
import Layout from './Layout'

vi.mock('@/modules/auth', () => ({ useAuth: vi.fn() }))

function renderLayout() {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<div data-testid="page" />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  it('renders the page and links to the privacy policy', () => {
    useAuth.mockReturnValue({ hasAccount: false, signOut: vi.fn() })

    renderLayout()

    expect(screen.getByTestId('page')).toBeInTheDocument()
    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/privacy')
  })

  it('hides sign-out without a real account', () => {
    useAuth.mockReturnValue({ hasAccount: false, signOut: vi.fn() })

    renderLayout()

    expect(screen.queryByTestId('sign-out')).not.toBeInTheDocument()
  })

  it('signs the owner out', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn().mockResolvedValue()
    useAuth.mockReturnValue({ hasAccount: true, signOut })
    renderLayout()

    await user.click(screen.getByTestId('sign-out'))

    expect(signOut).toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an alert when sign-out fails', async () => {
    const user = userEvent.setup()
    const signOut = vi.fn().mockRejectedValue(new ApiError('unknown'))
    useAuth.mockReturnValue({ hasAccount: true, signOut })
    renderLayout()

    await user.click(screen.getByTestId('sign-out'))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
