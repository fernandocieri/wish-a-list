import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/lib/errors'
import { useAuth } from '../../../hooks/useAuth'
import GoogleSignInButton from './GoogleSignInButton'

vi.mock('../../../hooks/useAuth', () => ({ useAuth: vi.fn() }))

describe('GoogleSignInButton', () => {
  it('starts Google sign-in and disables itself while redirecting', async () => {
    const user = userEvent.setup()
    const signInWithGoogle = vi.fn(() => new Promise(() => {}))
    useAuth.mockReturnValue({ signInWithGoogle })
    render(<GoogleSignInButton />)

    await user.click(screen.getByTestId('google-sign-in'))

    expect(signInWithGoogle).toHaveBeenCalled()
    expect(screen.getByTestId('google-sign-in')).toBeDisabled()
  })

  it('shows an alert and re-enables when sign-in fails', async () => {
    const user = userEvent.setup()
    const signInWithGoogle = vi.fn().mockRejectedValue(new ApiError('unknown'))
    useAuth.mockReturnValue({ signInWithGoogle })
    render(<GoogleSignInButton />)

    await user.click(screen.getByTestId('google-sign-in'))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByTestId('google-sign-in')).toBeEnabled()
  })
})
