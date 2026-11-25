import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteList } from '../../../api'
import { listKeys } from '../../../queries'

export function useDeleteList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteList,
    onSuccess: (_data, id) =>
      queryClient.removeQueries({ queryKey: listKeys.detail(id) }),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: listKeys.mine() }),
  })
}
