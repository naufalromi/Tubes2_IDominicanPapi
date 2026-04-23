export type TraversalLogAction = 'visit' | 'match' | 'skip'

export type TraversalLogEntry = {
  id: string
  step: number
  nodeLabel: string
  action: TraversalLogAction
  message: string
}