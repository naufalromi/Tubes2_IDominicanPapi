import InputSourceTabs from './InputSourceTabs'
import UrlInput from './UrlInput'
import HtmlInput from './HtmlInput'
import AlgorithmSelect from './AlgorithmSelect'
import SelectorInput from './SelectorInput'
import ResultModeSelect from './ResultModeSelect'
import TopNInput from './TopNInput'
import StartTraversalButton from './StartTraversalButton'
import { useTraversalConfig } from '../hooks/useTraversalConfig'

function TraversalConfigPanel() {
  const {
    config,
    setInputSource,
    setUrl,
    setHtml,
    setAlgorithm,
    setSelector,
    setResultMode,
    setTopN,
    startTraversal,
    status,
    error,
    requestId,
  } = useTraversalConfig()

  const handleStartTraversal = () => {
    void startTraversal()
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#ddd',
            marginBottom: '10px',
          }}
        >
          Input Source
        </div>
        <InputSourceTabs value={config.inputSource} onChange={setInputSource} />
      </div>

      {config.inputSource === 'url' ? (
        <UrlInput value={config.url} onChange={setUrl} />
      ) : (
        <HtmlInput value={config.html} onChange={setHtml} />
      )}

      <AlgorithmSelect value={config.algorithm} onChange={setAlgorithm} />
      <SelectorInput value={config.selector} onChange={setSelector} />
      <ResultModeSelect value={config.resultMode} onChange={setResultMode} />

      {config.resultMode === 'topn' && (
        <TopNInput value={config.topN} onChange={setTopN} />
      )}

      <div style={{ marginTop: '8px' }}>
        <StartTraversalButton
          onClick={handleStartTraversal}
          disabled={status === 'loading'}
          isLoading={status === 'loading'}
        />
      </div>

      {error && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid #7f1d1d',
            backgroundColor: '#2b1111',
            color: '#fca5a5',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px solid #2a2a2a',
          backgroundColor: '#151515',
          color: '#a1a1aa',
          fontSize: '13px',
          lineHeight: 1.6,
        }}
      >
        <div>Status: {status}</div>
        <div>Last Request: {requestId ?? 'No traversal has run yet'}</div>
      </div>
    </div>
  )
}

export default TraversalConfigPanel
