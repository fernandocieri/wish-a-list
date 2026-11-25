import { useQuery } from '@tanstack/react-query'
import { editableListQueryOptions } from '../queries'

export function useEditableList(id) {
  return useQuery(editableListQueryOptions(id))
}
