function MainPanel() {
  return (
    <main
      style={{
        flex: 1,
        backgroundColor: '#0f0f0f',
        padding: '20px',
        color: 'white',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          height: '100%',
          minHeight: '500px',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          backgroundColor: '#121212',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777',
          textAlign: 'center',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <div>
          <h2 style={{ marginTop: 0, marginBottom: '8px', color: 'white' }}>
            No DOM Tree Loaded
          </h2>
          <p style={{ margin: 0 }}>
            Enter a URL or HTML content and start traversal to visualize the DOM tree
          </p>
        </div>
      </div>
    </main>
  )
}

export default MainPanel





// import DomTreeCanvas from '../../features/dom-tree/components/DomTreeCanvas'
// import type { DomTreeNodeData } from '../../features/dom-tree/types'

// const dummyTree: DomTreeNodeData = {
//   id: 'n1',
//   tag: 'html',
//   depth: 0,
//   label: 'html',
//   children: [
//     {
//       id: 'n2',
//       tag: 'body',
//       depth: 1,
//       label: 'body',
//       children: [
//         {
//           id: 'n3',
//           tag: 'div',
//           depth: 2,
//           label: 'div#main',
//           children: [
//             {
//               id: 'n4',
//               tag: 'section',
//               depth: 3,
//               label: 'section.content',
//               children: [
//                 {
//                   id: 'n5',
//                   tag: 'div',
//                   depth: 4,
//                   label: 'div.card',
//                   children: [
//                     {
//                       id: 'n6',
//                       tag: 'span',
//                       depth: 5,
//                       label: 'span',
//                       children: [],
//                     },
//                   ],
//                 },
//                 {
//                   id: 'n7',
//                   tag: 'div',
//                   depth: 4,
//                   label: 'div.card',
//                   children: [
//                     {
//                       id: 'n8',
//                       tag: 'span',
//                       depth: 5,
//                       label: 'span',
//                       children: [],
//                     },
//                   ],
//                 },
//               ],
//             },
//             {
//               id: 'n9',
//               tag: 'footer',
//               depth: 3,
//               label: 'footer',
//               children: [],
//             },
//           ],
//         },
//       ],
//     },
//   ],
// }

// const dummyTraversalPath = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']

// const dummyMatchedNodeIds = ['n6']

// function MainPanel() {
//   return (
//     <main
//       style={{
//         flex: 1,
//         backgroundColor: '#0f0f0f',
//         padding: '20px',
//         color: 'white',
//         boxSizing: 'border-box',
//       }}
//     >
//       <DomTreeCanvas
//         tree={dummyTree}
//         traversalPath={dummyTraversalPath}
//         matchedNodeIds={dummyMatchedNodeIds}
//       />
//     </main>
//   )
// }

// export default MainPanel