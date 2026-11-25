import { describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { ApiError } from '@/lib/errors'
import {
  dropSessionIfUserGone,
  ensureSession,
  onAuthChange,
  signInWithGoogle,
  signOut,
} from './api'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInAnonymously: vi.fn(),
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

describe('dropSessionIfUserGone', () => {
  it('signs out locally when the user no longer exists', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: 'user_not_found', status: 403 },
    })
    supabase.auth.signOut.mockResolvedValue({ error: null })

    await dropSessionIfUserGone()

    expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })

  it('keeps the session when the user exists', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'x' } },
      error: null,
    })

    await dropSessionIfUserGone()

    expect(supabase.auth.signOut).not.toHaveBeenCalled()
  })

  it('keeps the session on other failures, such as being offline', async () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: undefined, status: 0 },
    })

    await dropSessionIfUserGone()

    expect(supabase.auth.signOut).not.toHaveBeenCalled()
  })
})

describe('ensureSession', () => {
  it('keeps an existing session', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'x' } } },
      error: null,
    })

    await ensureSession()

    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it('signs in anonymously when there is no session', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    supabase.auth.signInAnonymously.mockResolvedValue({ data: {}, error: null })

    await ensureSession()

    expect(supabase.auth.signInAnonymously).toHaveBeenCalled()
  })

  it('throws "anonymous-disabled" when anonymous sign-ins are off', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    supabase.auth.signInAnonymously.mockResolvedValue({
      data: {},
      error: { code: 'anonymous_provider_disabled', status: 422 },
    })

    await expect(ensureSession()).rejects.toMatchObject({
      name: 'ApiError',
      code: 'anonymous-disabled',
    })
  })
})
