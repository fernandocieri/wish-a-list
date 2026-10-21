import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { createQueryWrapper } from '@/test/queryWrapper'
import { onAuthChange } from './api'
import AuthProvider from './AuthProvider'
import { useAuth } from './hooks/useAuth'

vi.mock('./api', () => ({
  onAuthChange: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}))

const makeSession = ({ isAnonymous = false } = {}) => ({
  user: { id: faker.string.uuid(), is_anonymous: isAnonymous },
})

/** Renders useAuth inside the providers; `emit(event, session)` plays an auth event. */
function renderAuth() {
  let listener
  const unsubscribe = vi.fn()
  onAuthChange.mockImplementation((callback) => {
    listener = callback
    return unsubscribe
  })
  const QueryWrapper = createQueryWrapper()
  const clear = vi.spyOn(QueryWrapper.queryClient, 'clear')
  const view = renderHook(useAuth, {
    wrapper: ({ children }) => (
      <QueryWrapper>
        <AuthProvider>{children}</AuthProvider>
      </QueryWrapper>
    ),
  })
  const emit = (event, session) => act(() => listener(event, session))
  return { ...view, emit, clear, unsubscribe }
}

describe('AuthProvider', () => {
  it('is loading until the initial session arrives', () => {
    const { result, emit } = renderAuth()
    expect(result.current.isLoading).toBe(true)

    emit('INITIAL_SESSION', null)

    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasAccount).toBe(false)
  })

  it('reports a real account for a Google session', () => {
    const session = makeSession()
    const { result, emit } = renderAuth()

    emit('INITIAL_SESSION', session)

    expect(result.current.hasAccount).toBe(true)
    expect(result.current.user).toEqual(session.user)
  })

  it('does not treat an anonymous friend as an account', () => {
    const { result, emit } = renderAuth()

    emit('INITIAL_SESSION', makeSession({ isAnonymous: true }))

    expect(result.current.hasAccount).toBe(false)
  })

  it('clears the query cache on sign-out', () => {
    const { emit, clear } = renderAuth()
    emit('INITIAL_SESSION', makeSession())

    emit('SIGNED_OUT', null)

    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('clears the query cache when another account signs in', () => {
    const { emit, clear } = renderAuth()
    emit('INITIAL_SESSION', makeSession())

    emit('SIGNED_IN', makeSession())

    expect(clear).toHaveBeenCalledTimes(1)
  })

  it('keeps the cache when an anonymous session is created', () => {
    const { emit, clear } = renderAuth()
    emit('INITIAL_SESSION', null)

    emit('SIGNED_IN', makeSession({ isAnonymous: true }))

    expect(clear).not.toHaveBeenCalled()
  })

  it('keeps the cache when the same account refreshes its token', () => {
    const session = makeSession()
    const { emit, clear } = renderAuth()
    emit('INITIAL_SESSION', session)

    emit('TOKEN_REFRESHED', { ...session })

    expect(clear).not.toHaveBeenCalled()
  })

  it('unsubscribes on unmount', () => {
    const { unmount, unsubscribe } = renderAuth()

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('useAuth', () => {
  it('throws outside AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(useAuth)).toThrow()
  })
})
