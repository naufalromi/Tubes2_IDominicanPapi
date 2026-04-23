function EmptyDomState() {
  return (
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
  )
}

export default EmptyDomState