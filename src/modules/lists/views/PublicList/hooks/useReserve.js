import { useMutation, useQueryClient } from '@tanstack/react-query'
import { reserveItem } from '../api'
import { publicListKeys } from '../queries'

export function useReserve() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, name }) => reserveItem(itemId, name),
    onSuccess: (reservation, { itemId }) => {
      queryClient.setQueryData(publicListKeys.reservations(), (prev) => ({
        ...prev,
        [itemId]: reservation,
      }))
    },
    // On a conflict too: someone else grabbed it, so the UI must reflect reality.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: publicListKeys.all }),
  })
}
