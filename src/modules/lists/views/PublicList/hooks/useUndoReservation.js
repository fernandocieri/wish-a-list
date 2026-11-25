import { useMutation, useQueryClient } from '@tanstack/react-query'
import { undoReservation } from '../api'
import { withReservation } from '../helpers/withReservation'
import { publicListKeys } from '../queries'

export function useUndoReservation(slug) {
  const queryClient = useQueryClient()
  const queryKey = publicListKeys.detail(slug)

  return useMutation({
    mutationFn: (itemId) => undoReservation(itemId),
    onSuccess: (_data, itemId) =>
      queryClient.setQueryData(queryKey, (list) =>
        withReservation(list, itemId, null),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
