import { useMutation, useQueryClient } from '@tanstack/react-query'
import { listKeys } from '../../../queries'
import { createItem, deleteItem, updateItem } from '../api'

/** { create, update, remove } for the items of one list. */
export function useItemMutations(listId) {
  const queryClient = useQueryClient()
  // The dashboard's item counts change too, so refresh all owner list data.
  const onSettled = () =>
    queryClient.invalidateQueries({ queryKey: listKeys.all })

  const create = useMutation({
    mutationFn: (fields) => createItem(listId, fields),
    onSettled,
  })
  const update = useMutation({
    mutationFn: ({ id, fields }) => updateItem(id, fields),
    onSettled,
  })
  const remove = useMutation({
    mutationFn: (id) => deleteItem(id),
    onSettled,
  })

  return { create, update, remove }
}
