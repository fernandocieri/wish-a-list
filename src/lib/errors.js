// Codes the UI knows how to explain. Anything else becomes 'unknown'.
export const API_ERROR_CODES = ['already-reserved', 'list_limit', 'item_limit', 'reservation_limit']

// Messages raised by enforce_limits() in the migration (SQLSTATE P0001).
const RAISED_CODES = ['list_limit', 'item_limit', 'reservation_limit']

export class ApiError extends Error {
  constructor(code, cause) {
    super(code)
    this.name = 'ApiError'
    this.code = code
    this.cause = cause
  }

  get isKnown() {
    return API_ERROR_CODES.includes(this.code)
  }
}

/** Maps a Supabase/Postgres error to an ApiError. Display text is the UI's job. */
export function toApiError(error) {
  if (error instanceof ApiError) return error
  // Unique violation: the only unique constraint a client can hit is one reservation per item.
  if (error?.code === '23505') return new ApiError('already-reserved', error)
  if (error?.code === 'P0001' && RAISED_CODES.includes(error.message)) return new ApiError(error.message, error)
  return new ApiError('unknown', error)
}
