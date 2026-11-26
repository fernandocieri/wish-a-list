import { useMutation, useQueryClient } from '@tanstack/react-query'
import { duplicateList } from '../../../api'
import { listKeys } from '../../../queries'
import { copyTitle } from '../helpers/copyTitle'

/** mutate(list) copies that list under copyTitle(list.title) and resolves to `{ id }` of the copy. */
export function useDuplicateList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (list) => duplicateList(list.id, copyTitle(list.title)),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: listKeys.mine() }),
  })
}
