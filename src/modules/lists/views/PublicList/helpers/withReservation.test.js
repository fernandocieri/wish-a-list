import { describe, expect, it } from 'vitest'
import { makePublicItem, makePublicList } from '@/test/factories'
import { withReservation } from './withReservation'

describe('withReservation', () => {
  it('replaces the reservation of the matching item only', () => {
    const [target, other] = [makePublicItem(), makePublicItem()]
    const list = makePublicList({ items: [target, other] })
    const reservation = { reserved_by: 'Ana', is_mine: true }

    const next = withReservation(list, target.id, reservation)

    expect(next.items[0]).toEqual({ ...target, reservation })
    expect(next.items[1]).toBe(other)
    expect(list.items[0].reservation).toBeNull()
  })

  it('leaves an uncached list alone', () => {
    expect(withReservation(undefined, 'x', null)).toBeUndefined()
  })
})
