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
  } = useTraversalConfig()

  const handleStartTraversal = () => {
    console.log('Traversal config:', config)
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
        <StartTraversalButton onClick={handleStartTraversal} />
      </div>
    </div>
  )
}

export default TraversalConfigPanel