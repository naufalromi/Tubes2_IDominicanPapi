import { useEffect, useMemo, useRef, useState, type MouseEvent, type WheelEvent } from 'react'
import DomTreeControls from './DomTreeControls'
import DomTreeLegend from './DomTreeLegend'
import DomTreeNode from './DomTreeNode'
import EmptyDomState from './EmptyDomState'
import { useDomTreeLayout } from '../hooks/useDomTreeLayout'
import type { DomTreeNodeData } from '../types'

type DomTreeCanvasProps = {
  tree: DomTreeNodeData | null
  traversalPath?: string[]
  matchedNodeIds?: string[]
}

function DomTreeCanvas({
  tree,
  traversalPath = [],
  matchedNodeIds = [],
}: DomTreeCanvasProps) {
  const { nodes, edges, width, height, totalNodes, maxDepth } = useDomTreeLayout(tree)

  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const [isAnimating, setIsAnimating] = useState(false)
  const [hasAnimationStarted, setHasAnimationStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(500)

  const dragRef = useRef<{
    dragging: boolean
    startX: number
    startY: number
    originX: number
    originY: number
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  })

  const clampedScale = useMemo(() => Math.min(2.5, Math.max(0.4, scale)), [scale])

  useEffect(() => {
    if (!isAnimating || isPaused || traversalPath.length === 0) return

    if (animationStep >= traversalPath.length) {
      setIsAnimating(false)
      setIsPaused(false)
      return
    }

    const timer = window.setTimeout(() => {
      setAnimationStep((prev) => prev + 1)
    }, animationSpeed)

    return () => window.clearTimeout(timer)
  }, [isAnimating, isPaused, animationStep, animationSpeed, traversalPath])

  useEffect(() => {
    setHasAnimationStarted(false)
    setIsAnimating(false)
    setIsPaused(false)
    setAnimationStep(0)
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [tree, traversalPath])

  if (!tree) {
    return <EmptyDomState />
  }

  const visibleVisitedIds = hasAnimationStarted
    ? traversalPath.slice(0, animationStep)
    : traversalPath

  const visibleMatchedIds = hasAnimationStarted
    ? matchedNodeIds.filter((id) => visibleVisitedIds.includes(id))
    : matchedNodeIds

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2.5))
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.4))
  const handleResetView = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const handleStartAnimation = () => {
    setHasAnimationStarted(true)
    setIsPaused(false)
    setAnimationStep(0)
    setIsAnimating(true)
  }

  const handlePauseAnimation = () => {
    if (!isAnimating) return
    setIsPaused(true)
    setIsAnimating(false)
  }

  const handleContinueAnimation = () => {
    if (!hasAnimationStarted) return
    if (animationStep >= traversalPath.length) return
    setIsPaused(false)
    setIsAnimating(true)
  }

  const handleStopAnimation = () => {
    setHasAnimationStarted(false)
    setIsAnimating(false)
    setIsPaused(false)
    setAnimationStep(0)
  }

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    }
  }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return

    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    setOffset({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    })
  }

  const handleMouseUp = () => {
    dragRef.current.dragging = false
  }

  const handleMouseLeave = () => {
    dragRef.current.dragging = false
  }

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const delta = e.deltaY > 0 ? -0.08 : 0.08
    setScale((prev) => Math.min(2.5, Math.max(0.4, prev + delta)))
  }

  return (
    <div
      style={{
        height: '100%',
        minHeight: '640px',
        border: '1px solid #2a2a2a',
        borderRadius: '20px',
        backgroundColor: '#101010',
        color: 'white',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>DOM Tree Visualization</h2>
          <p style={{ margin: '6px 0 0', color: '#a1a1aa', fontSize: '14px' }}>
            Total Nodes: {totalNodes} | Max Depth: {maxDepth}
          </p>
        </div>
      </div>

      <DomTreeLegend />
      <DomTreeControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onStartAnimation={handleStartAnimation}
        onPauseAnimation={handlePauseAnimation}
        onContinueAnimation={handleContinueAnimation}
        onStopAnimation={handleStopAnimation}
        animationSpeed={animationSpeed}
        onChangeAnimationSpeed={setAnimationSpeed}
        isAnimating={isAnimating}
        hasAnimationStarted={hasAnimationStarted}
        isPaused={isPaused}
      />

      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{
          position: 'relative',
          height: '560px',
          overflow: 'hidden',
          borderRadius: '18px',
          border: '1px solid #242424',
          backgroundColor: '#0b0b0b',
          cursor: dragRef.current.dragging ? 'grabbing' : 'grab',
          overscrollBehavior: 'contain',
          touchAction: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width,
            height,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${clampedScale})`,
            transformOrigin: '0 0',
          }}
        >
          <svg
            width={width}
            height={height}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              overflow: 'visible',
            }}
          >
            {edges.map((edge) => {
              const edgeVisited =
                visibleVisitedIds.includes(edge.fromId) &&
                visibleVisitedIds.includes(edge.toId)

              return (
                <path
                  key={`${edge.fromId}-${edge.toId}`}
                  d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${edge.y1 + 60}, ${edge.x2} ${edge.y2 - 60}, ${edge.x2} ${edge.y2}`}
                  fill="none"
                  stroke={edgeVisited ? 'rgba(59,130,246,0.8)' : 'rgba(255,255,255,0.14)'}
                  strokeWidth={edgeVisited ? 3 : 2}
                />
              )
            })}
          </svg>

          {nodes.map((node) => (
            <DomTreeNode
              key={node.id}
              node={node}
              isVisited={visibleVisitedIds.includes(node.id)}
              isMatched={visibleMatchedIds.includes(node.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default DomTreeCanvas
