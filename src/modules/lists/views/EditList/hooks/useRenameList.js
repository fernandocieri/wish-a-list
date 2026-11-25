import { useMutation, useQueryClient } from '@tanstack/react-query'
import { renameList } from '../../../api'
import { listKeys } from '../../../queries'

export function useRenameList(id) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (title) => renameList(id, title),
    // The dashboard shows the title too.
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKeys.all }),
  })
}
