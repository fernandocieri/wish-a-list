import { LIMITS } from '@/config'

/** Shown when creating or duplicating a list hits ApiError('list_limit'). */
export const LIST_LIMIT_MESSAGE = `Has llegado al máximo de ${LIMITS.lists} listas. Borra alguna para crear otra.`
