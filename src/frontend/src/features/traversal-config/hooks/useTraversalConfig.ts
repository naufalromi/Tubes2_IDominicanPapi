import { traversalStoreActions, useTraversalStore } from '../../../store/traversalStore'

export function useTraversalConfig() {
  const config = useTraversalStore((state) => state.config)
  const status = useTraversalStore((state) => state.status)
  const error = useTraversalStore((state) => state.error)
  const requestId = useTraversalStore((state) => state.requestId)

  return {
    config,
    status,
    error,
    requestId,
    ...traversalStoreActions,
  }
}
