function Header() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #2a2a2a',
        backgroundColor: '#111',
        color: 'white',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: '24px' }}>DOM Tree Traversal Visualizer</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#aaa' }}>
          BFS and DFS CSS Selector Search
        </p>
      </div>

      <div
        style={{
          padding: '6px 12px',
          border: '1px solid #3a3a3a',
          borderRadius: '999px',
          fontSize: '12px',
          color: '#ccc',
        }}
      >
        TUBES 2
      </div>
    </header>
  )
}

export default Header