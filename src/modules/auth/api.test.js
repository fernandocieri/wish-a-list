import { describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { ApiError } from '@/lib/errors'
import { onAuthChange, signInWithGoogle, signOut } from './api'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

const authError = { code: 'unexpected_failure', message: 'boom' }

describe('onAuthChange', () => {
  it('subscribes the callback and returns an unsubscribe function', () => {
    const unsubscribe = vi.fn()
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    })
    const callback = vi.fn()

    const stop = onAuthChange(callback)
    stop()

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback)
    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('signInWithGoogle', () => {
  it('starts the Google OAuth flow back to the app root', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })

    await signInWithGoogle()

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  })

  it('throws an ApiError when the flow cannot start', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({
      data: {},
      error: authError,
    })

    await expect(signInWithGoogle()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('signOut', () => {
  it('signs out', async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null })

    await signOut()

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('throws an ApiError when sign-out fails', async () => {
    supabase.auth.signOut.mockResolvedValue({ error: authError })

    await expect(signOut()).rejects.toBeInstanceOf(ApiError)
  })
})
