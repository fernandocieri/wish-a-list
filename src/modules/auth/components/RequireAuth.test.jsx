import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import RequireAuth from './RequireAuth'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div data-testid="home" />} />
        <Route
          path="/lists/:id"
          element={
            <RequireAuth>
              <div data-testid="protected" />
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  it('renders the page for a signed-in owner', () => {
    useAuth.mockReturnValue({ hasAccount: true, isLoading: false })

    renderAt('/lists/abc')

    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('redirects visitors without an account to "/"', () => {
    useAuth.mockReturnValue({ hasAccount: false, isLoading: false })

    renderAt('/lists/abc')

    expect(screen.getByTestId('home')).toBeInTheDocument()
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
  })

  it('waits for the session before deciding', () => {
    useAuth.mockReturnValue({ hasAccount: false, isLoading: true })

    renderAt('/lists/abc')

    expect(screen.queryByTestId('home')).not.toBeInTheDocument()
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument()
  })
})
