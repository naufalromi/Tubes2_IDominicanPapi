import { useState } from 'react'
import type {
  InputSource,
  ResultMode,
  TraversalAlgorithm,
  TraversalConfigState,
} from '../types'

const initialState: TraversalConfigState = {
  inputSource: 'url',
  url: '',
  html: '',
  algorithm: 'bfs',
  selector: '',
  resultMode: 'all',
  topN: 5,
}

export function useTraversalConfig() {
  const [config, setConfig] = useState<TraversalConfigState>(initialState)

  const setInputSource = (inputSource: InputSource) => {
    setConfig((prev) => ({ ...prev, inputSource }))
  }

  const setUrl = (url: string) => {
    setConfig((prev) => ({ ...prev, url }))
  }

  const setHtml = (html: string) => {
    setConfig((prev) => ({ ...prev, html }))
  }

  const setAlgorithm = (algorithm: TraversalAlgorithm) => {
    setConfig((prev) => ({ ...prev, algorithm }))
  }

  const setSelector = (selector: string) => {
    setConfig((prev) => ({ ...prev, selector }))
  }

  const setResultMode = (resultMode: ResultMode) => {
    setConfig((prev) => ({ ...prev, resultMode }))
  }

  const setTopN = (topN: number) => {
    setConfig((prev) => ({ ...prev, topN }))
  }

  return {
    config,
    setInputSource,
    setUrl,
    setHtml,
    setAlgorithm,
    setSelector,
    setResultMode,
    setTopN,
  }
}