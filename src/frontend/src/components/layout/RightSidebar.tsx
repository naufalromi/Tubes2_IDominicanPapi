import StatsPanel from '../../features/traversal-stats/components/StatsPanel'
import TraversalLogPanel from '../../features/traversal-log/components/TraversalLogPanel'
import ResultsPanel from '../../features/traversal-results/components/ResultsPanel'
import type { TraversalStats } from '../../features/traversal-stats/types'

const emptyStats: TraversalStats = {
  maxDepth: 0,
  nodesVisited: 0,
  traversalTimeMs: 0,
  matchesFound: 0,
}

function RightSidebar() {
  return (
    <aside
      style={{
        width: '340px',
        backgroundColor: '#111',
        borderLeft: '1px solid #2a2a2a',
        padding: '24px',
        color: 'white',
        boxSizing: 'border-box',
        minHeight: 'calc(100vh - 81px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: '24px',
        }}
      >
        <StatsPanel stats={emptyStats} />
        <TraversalLogPanel />
        <ResultsPanel />
      </div>
    </aside>
  )
}

export default RightSidebar




// import StatsPanel from '../../features/traversal-stats/components/StatsPanel'
// import TraversalLogPanel from '../../features/traversal-log/components/TraversalLogPanel'
// import ResultsPanel from '../../features/traversal-results/components/ResultsPanel'
// import type { TraversalStats } from '../../features/traversal-stats/types'
// import type { TraversalLogEntry } from '../../features/traversal-log/types'
// import type { MatchResult } from '../../features/traversal-results/types'

// const dummyStats: TraversalStats = {
//   maxDepth: 5,
//   nodesVisited: 9,
//   traversalTimeMs: 12.4,
//   matchesFound: 2,
// }

// const dummyLogs: TraversalLogEntry[] = [
//   {
//     id: '1',
//     step: 1,
//     nodeLabel: '<html>',
//     action: 'visit',
//     message: 'Started traversal from root node',
//   },
//   {
//     id: '2',
//     step: 2,
//     nodeLabel: '<body>',
//     action: 'visit',
//     message: 'Visited body node',
//   },
//   {
//     id: '3',
//     step: 3,
//     nodeLabel: '<div#main>',
//     action: 'visit',
//     message: 'Moved into main container',
//   },
//   {
//     id: '4',
//     step: 4,
//     nodeLabel: '<span>',
//     action: 'match',
//     message: 'Selector matched current span node',
//   },
// ]

// const dummyMatches: MatchResult[] = [
//   {
//     id: 'n6',
//     tag: 'span',
//     label: '<span>',
//     path: 'html > body > div#main > section.content > div.card > span',
//     depth: 5,
//     attributes: {},
//     textPreview: 'Target text',
//   },
//   {
//     id: 'n10',
//     tag: 'button',
//     label: '<button id="cta-button">',
//     path: 'html > body > div#main > section.hero > button#cta-button',
//     depth: 4,
//     attributes: {
//       id: 'cta-button',
//       class: 'primary-button',
//     },
//     textPreview: 'Click me',
//   },
// ]

// function RightSidebar() {
//   return (
//     <aside
//       style={{
//         width: '340px',
//         backgroundColor: '#111',
//         borderLeft: '1px solid #2a2a2a',
//         padding: '24px',
//         color: 'white',
//         boxSizing: 'border-box',
//         minHeight: 'calc(100vh - 81px)',
//         overflowY: 'auto',
//       }}
//     >
//       <div
//         style={{
//           display: 'grid',
//           gap: '24px',
//         }}
//       >
//         <StatsPanel stats={dummyStats} />
//         <TraversalLogPanel logs={dummyLogs} />
//         <ResultsPanel matches={dummyMatches} />
//       </div>
//     </aside>
//   )
// }

// export default RightSidebar