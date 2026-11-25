import { queryOptions } from '@tanstack/react-query'
import { listKeys } from '../../queries'
import { fetchEditableList } from './api'

export const editableListQueryOptions = (id) =>
  queryOptions({
    queryKey: listKeys.detail(id),
    queryFn: () => fetchEditableList(id),
  })
