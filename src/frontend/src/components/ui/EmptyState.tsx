type EmptyStateProps = {
  title: string
  description: string
}

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div
      style={{
        height: '100%',
        minHeight: '300px',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        backgroundColor: '#121212',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        color: '#aaa',
      }}
    >
      <div>
        <h2 style={{ marginTop: 0, marginBottom: '8px', color: 'white' }}>{title}</h2>
        <p style={{ margin: 0 }}>{description}</p>
      </div>
    </div>
  )
}

export default EmptyState