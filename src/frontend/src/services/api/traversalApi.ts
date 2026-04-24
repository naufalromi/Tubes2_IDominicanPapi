import type { BackendSearchResponse, TraversalRequest, TraversalResponse } from '../../types/api'
import {
  adaptTraversalRequest,
  adaptTraversalResponse,
} from '../adapters/traversalAdapter'

const SEARCH_ENDPOINT =
  import.meta.env.VITE_SEARCH_ENDPOINT ?? 'http://localhost:8080/api/search'

async function extractErrorMessage(response: Response): Promise<string> {
  const message = await response.text()

  if (message.trim().length > 0) {
    return message.trim()
  }

  return `Traversal request failed with status ${response.status}.`
}

export async function runTraversal(request: TraversalRequest): Promise<TraversalResponse> {
  const response = await fetch(SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adaptTraversalRequest(request)),
  })

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response))
  }

  const payload = (await response.json()) as BackendSearchResponse
  return adaptTraversalResponse(payload)
}
