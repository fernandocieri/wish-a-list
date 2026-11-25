import { vi } from 'vitest'

const METHODS = [
  'select',
  'insert',
  'update',
  'delete',
  'eq',
  'order',
  'single',
  'maybeSingle',
]

/**
 * A chainable stand-in for a supabase-js query builder: every method returns the builder and
 * awaiting it yields `result`. Use with `supabase.from.mockReturnValue(builder)`.
 */
export function mockQueryBuilder(result) {
  const builder = {}
  for (const method of METHODS) builder[method] = vi.fn(() => builder)
  builder.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject)
  return builder
}
