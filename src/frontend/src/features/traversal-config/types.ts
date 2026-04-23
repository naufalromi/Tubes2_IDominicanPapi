export type InputSource = 'url' | 'html'
export type TraversalAlgorithm = 'bfs' | 'dfs'
export type ResultMode = 'all' | 'topn'

export type TraversalConfigState = {
  inputSource: InputSource
  url: string
  html: string
  algorithm: TraversalAlgorithm
  selector: string
  resultMode: ResultMode
  topN: number
}