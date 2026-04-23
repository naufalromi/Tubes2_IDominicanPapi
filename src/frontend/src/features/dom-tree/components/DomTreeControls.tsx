import type { CSSProperties } from 'react'

type DomTreeControlsProps = {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void

  onStartAnimation: () => void
  onPauseAnimation: () => void
  onContinueAnimation: () => void
  onStopAnimation: () => void

  animationSpeed: number
  onChangeAnimationSpeed: (speed: number) => void

  isAnimating: boolean
  hasAnimationStarted: boolean
  isPaused: boolean
}

function DomTreeControls({
  onZoomIn,
  onZoomOut,
  onResetView,
  onStartAnimation,
  onPauseAnimation,
  onContinueAnimation,
  onStopAnimation,
  animationSpeed,
  onChangeAnimationSpeed,
  isAnimating,
  hasAnimationStarted,
  isPaused,
}: DomTreeControlsProps) {
  const baseButtonStyle: CSSProperties = {
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1px solid #333',
    backgroundColor: '#1d1d1d',
    color: '#f3f4f6',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    minWidth: '110px',
  }

  const disabledButtonStyle: CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: '16px',
        marginBottom: '18px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: '8px',
          padding: '14px 16px',
          borderRadius: '14px',
          backgroundColor: '#111',
          border: '1px solid #242424',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#a1a1aa',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Viewer Controls
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button type="button" onClick={onZoomIn} style={baseButtonStyle}>
            Zoom In
          </button>

          <button type="button" onClick={onZoomOut} style={baseButtonStyle}>
            Zoom Out
          </button>

          <button type="button" onClick={onResetView} style={baseButtonStyle}>
            Reset View
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '14px',
          backgroundColor: '#111',
          border: '1px solid #242424',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#a1a1aa',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Animation Controls
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onStartAnimation}
            style={{
              ...baseButtonStyle,
              backgroundColor: '#2563eb',
              border: 'none',
            }}
          >
            Start
          </button>

          <button
            type="button"
            onClick={onPauseAnimation}
            disabled={!isAnimating || isPaused}
            style={{
              ...baseButtonStyle,
              ...(!isAnimating || isPaused ? disabledButtonStyle : {}),
            }}
          >
            Pause
          </button>

          <button
            type="button"
            onClick={onContinueAnimation}
            disabled={!hasAnimationStarted || !isPaused}
            style={{
              ...baseButtonStyle,
              ...(!hasAnimationStarted || !isPaused ? disabledButtonStyle : {}),
            }}
          >
            Continue
          </button>

          <button
            type="button"
            onClick={onStopAnimation}
            disabled={!hasAnimationStarted}
            style={{
              ...baseButtonStyle,
              ...(!hasAnimationStarted ? disabledButtonStyle : {}),
            }}
          >
            Stop
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: '#d4d4d8',
              minWidth: '52px',
            }}
          >
            Speed
          </span>

          <input
            type="range"
            min={100}
            max={1200}
            step={50}
            value={animationSpeed}
            onChange={(e) => onChangeAnimationSpeed(Number(e.target.value))}
            style={{
              flex: 1,
              minWidth: '180px',
              accentColor: '#2563eb',
              cursor: 'pointer',
            }}
          />

          <span
            style={{
              fontSize: '13px',
              color: '#a1a1aa',
              minWidth: '72px',
              textAlign: 'right',
            }}
          >
            {animationSpeed} ms
          </span>
        </div>
      </div>
    </div>
  )
}

export default DomTreeControls
