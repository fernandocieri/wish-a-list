import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createList } from '../../../api'
import { listKeys } from '../../../queries'

export function useCreateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createList,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: listKeys.mine() }),
  })
}
