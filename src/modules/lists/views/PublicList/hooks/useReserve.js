import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reserveItem } from '../api'
import { saveFriendName } from '../helpers/friendName'
import { withReservation } from '../helpers/withReservation'
import { publicListKeys } from '../queries'

export function useReserve(slug) {
  const queryClient = useQueryClient()
  const queryKey = publicListKeys.detail(slug)

  return useMutation({
    mutationFn: ({ itemId, name }) => reserveItem(itemId, name),
    onSuccess: (_data, { itemId, name }) => {
      saveFriendName(name)
      queryClient.setQueryData(queryKey, (list) =>
        withReservation(list, itemId, {
          reserved_by: name.trim(),
          is_mine: true,
        }),
      )
    },
    // On a conflict too: someone else grabbed it, so the UI must reflect reality.
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
