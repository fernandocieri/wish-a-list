import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { APP_NAME } from '@/config'
import { useAuth } from '../../hooks/useAuth'
import Landing from './Landing'

vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

describe('Landing', () => {
  it('shows the app name, the no-spoilers promise and the sign-in button', () => {
    useAuth.mockReturnValue({ signInWithGoogle: vi.fn() })

    render(<Landing />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      APP_NAME,
    )
    expect(screen.getByTestId('promise')).toBeInTheDocument()
    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument()
  })
})
