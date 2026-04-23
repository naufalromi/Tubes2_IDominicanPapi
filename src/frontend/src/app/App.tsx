import Header from '../components/layout/Header'
import LeftSidebar from '../components/layout/LeftSidebar'
import MainPanel from '../components/layout/MainPanel'
import RightSidebar from '../components/layout/RightSidebar'

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0b0b0b',
      }}
    >
      <Header />

      <div
        style={{
          display: 'flex',
          minHeight: 'calc(100vh - 81px)',
        }}
      >
        <LeftSidebar />
        <MainPanel />
        <RightSidebar />
      </div>
    </div>
  )
}

export default App