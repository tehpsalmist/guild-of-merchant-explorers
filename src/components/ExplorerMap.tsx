import React, { ComponentProps, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { HexPath } from './HexPath'
import { useGameState } from '../hooks/useGameState'
import { useResizeObserver } from '@8thday/react'
import { EraCards } from './EraCards'
import { plankPanelHorizontal } from '../images'
import { Player } from '../game-logic/GameState'
import clsx from 'clsx'
import { ExplorerBlock } from './ExplorerBlock'

const MAGIC_OFFSET_VALUE_X = 25
const MAGIC_OFFSET_VALUE_Y = 43.3

const HEX_WIDTH = 75
const HEX_HEIGHT = 86.6
const MIN_BOARD_WIDTH = 800
const MAX_ZOOM = 2.5
const WHEEL_ZOOM_SENSITIVITY = 0.0015

interface PanMetrics {
  baseBoardWidth: number
  baseBoardHeight: number
  boardWidth: number
  boardHeight: number
  paddingX: number
  paddingY: number
  viewportWidth: number
  viewportHeight: number
  minZoom: number
  zoom: number
}

interface PointerDrag {
  pointerId: number
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
  dragging: boolean
}

interface PointerPosition {
  x: number
  y: number
}

interface PinchGesture {
  pointerIds: [number, number]
  startDistance: number
  startZoom: number
  boardX: number
  boardY: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export interface ExplorerMapProps extends ComponentProps<'div'> {
  player: Player
  isActive: boolean
  onViewNextPlayer?(): void
}

export const ExplorerMap = ({ className = '', player, isActive, onViewNextPlayer, ...props }: ExplorerMapProps) => {
  const [dimX, dimY] = player.board.dimensions
  const [isDragging, setIsDragging] = useState(false)

  const boardRef = useRef<HTMLDivElement>(null)
  const panSurfaceRef = useRef<HTMLDivElement>(null)
  const panMetricsRef = useRef<PanMetrics | null>(null)
  const pointerDragRef = useRef<PointerDrag | null>(null)
  const pointerPositionsRef = useRef(new Map<number, PointerPosition>())
  const pinchGestureRef = useRef<PinchGesture | null>(null)
  const suppressClickRef = useRef(false)
  const containerRef = useResizeObserver<HTMLDivElement>(() => {
    if (!boardRef.current || !panSurfaceRef.current || !containerRef.current) return

    const boardRatio = player.board.width / player.board.height
    const { width, height } = containerRef.current.getBoundingClientRect()

    if (!width || !height) return

    const previousMetrics = panMetricsRef.current
    if (
      previousMetrics &&
      Math.abs(previousMetrics.viewportWidth - width) < 0.5 &&
      Math.abs(previousMetrics.viewportHeight - height) < 0.5
    ) {
      return
    }

    const focusX = previousMetrics
      ? (containerRef.current.scrollLeft + previousMetrics.viewportWidth / 2 - previousMetrics.paddingX) /
        previousMetrics.boardWidth
      : 0.5
    const focusY = previousMetrics
      ? (containerRef.current.scrollTop + previousMetrics.viewportHeight / 2 - previousMetrics.paddingY) /
        previousMetrics.boardHeight
      : 0.5

    // The board starts at the full viewport width instead of shrinking to fit both dimensions.
    // Its aspect ratio remains unchanged, and the pan surface handles any resulting vertical overflow.
    const baseBoardWidth = Math.max(width, MIN_BOARD_WIDTH)
    const baseBoardHeight = baseBoardWidth / boardRatio
    const minZoom = Math.min(1, width / baseBoardWidth, height / baseBoardHeight)
    const zoom = clamp(previousMetrics?.zoom ?? 1, minZoom, MAX_ZOOM)
    const boardWidth = baseBoardWidth * zoom
    const boardHeight = baseBoardHeight * zoom
    // A half-viewport buffer lets either edge of the board be panned all the way to the viewport center.
    const paddingX = width / 2
    const paddingY = height / 2

    boardRef.current.style.width = `${boardWidth}px`
    boardRef.current.style.height = `${boardHeight}px`
    panSurfaceRef.current.style.padding = `${paddingY}px ${paddingX}px`

    panMetricsRef.current = {
      baseBoardWidth,
      baseBoardHeight,
      boardWidth,
      boardHeight,
      paddingX,
      paddingY,
      viewportWidth: width,
      viewportHeight: height,
      minZoom,
      zoom,
    }

    containerRef.current.scrollLeft = paddingX + focusX * boardWidth - width / 2
    containerRef.current.scrollTop = paddingY + focusY * boardHeight - height / 2
  })

  const zoomBoardAt = (
    requestedZoom: number,
    viewportX: number,
    viewportY: number,
    boardX?: number,
    boardY?: number,
  ) => {
    const container = containerRef.current
    const board = boardRef.current
    const metrics = panMetricsRef.current

    if (!container || !board || !metrics) return

    const zoom = clamp(requestedZoom, metrics.minZoom, MAX_ZOOM)
    if (Math.abs(zoom - metrics.zoom) < 0.0001) return

    const anchorX = boardX ?? clamp((container.scrollLeft + viewportX - metrics.paddingX) / metrics.boardWidth, 0, 1)
    const anchorY = boardY ?? clamp((container.scrollTop + viewportY - metrics.paddingY) / metrics.boardHeight, 0, 1)
    const boardWidth = metrics.baseBoardWidth * zoom
    const boardHeight = metrics.baseBoardHeight * zoom

    board.style.width = `${boardWidth}px`
    board.style.height = `${boardHeight}px`

    metrics.boardWidth = boardWidth
    metrics.boardHeight = boardHeight
    metrics.zoom = zoom

    container.scrollLeft = metrics.paddingX + anchorX * boardWidth - viewportX
    container.scrollTop = metrics.paddingY + anchorY * boardHeight - viewportY
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const metrics = panMetricsRef.current
      if (!metrics) return

      const rect = container.getBoundingClientRect()
      const deltaMultiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? rect.height
            : 1
      const delta = (event.deltaY || event.deltaX) * deltaMultiplier

      zoomBoardAt(
        metrics.zoom * Math.exp(-delta * WHEEL_ZOOM_SENSITIVITY),
        event.clientX - rect.left,
        event.clientY - rect.top,
      )
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    const pointers = pointerPositionsRef.current
    if (pointers.size >= 2) return

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.size === 2) {
      const [[firstId, first], [secondId, second]] = Array.from(pointers.entries())
      const metrics = panMetricsRef.current
      const rect = event.currentTarget.getBoundingClientRect()

      if (!metrics) return

      const midpointX = (first.x + second.x) / 2 - rect.left
      const midpointY = (first.y + second.y) / 2 - rect.top

      pinchGestureRef.current = {
        pointerIds: [firstId, secondId],
        startDistance: Math.hypot(second.x - first.x, second.y - first.y),
        startZoom: metrics.zoom,
        boardX: clamp((event.currentTarget.scrollLeft + midpointX - metrics.paddingX) / metrics.boardWidth, 0, 1),
        boardY: clamp((event.currentTarget.scrollTop + midpointY - metrics.paddingY) / metrics.boardHeight, 0, 1),
      }
      pointerDragRef.current = null

      for (const pointerId of [firstId, secondId]) {
        if (!event.currentTarget.hasPointerCapture(pointerId)) event.currentTarget.setPointerCapture(pointerId)
      }

      setIsDragging(true)
      event.preventDefault()
      return
    }

    if (pointers.size !== 1) return

    pointerDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
      dragging: false,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointers = pointerPositionsRef.current
    if (!pointers.has(event.pointerId)) return

    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const pinch = pinchGestureRef.current
    if (pinch) {
      const first = pointers.get(pinch.pointerIds[0])
      const second = pointers.get(pinch.pointerIds[1])

      if (!first || !second || !pinch.startDistance) return

      const rect = event.currentTarget.getBoundingClientRect()
      const midpointX = (first.x + second.x) / 2 - rect.left
      const midpointY = (first.y + second.y) / 2 - rect.top
      const distance = Math.hypot(second.x - first.x, second.y - first.y)

      zoomBoardAt(pinch.startZoom * (distance / pinch.startDistance), midpointX, midpointY, pinch.boardX, pinch.boardY)
      event.preventDefault()
      return
    }

    const drag = pointerDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY

    if (!drag.dragging && Math.hypot(deltaX, deltaY) < 4) return

    if (!drag.dragging) {
      drag.dragging = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setIsDragging(true)
    }

    event.preventDefault()
    event.currentTarget.scrollLeft = drag.scrollLeft - deltaX
    event.currentTarget.scrollTop = drag.scrollTop - deltaY
  }

  const endPointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointers = pointerPositionsRef.current
    if (!pointers.has(event.pointerId)) return

    const wasPinching = pinchGestureRef.current !== null
    const drag = pointerDragRef.current

    pointers.delete(event.pointerId)

    if (wasPinching) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
      pinchGestureRef.current = null

      const remainingPointer = Array.from(pointers.entries())[0]
      if (remainingPointer) {
        const [pointerId, position] = remainingPointer
        pointerDragRef.current = {
          pointerId,
          startX: position.x,
          startY: position.y,
          scrollLeft: event.currentTarget.scrollLeft,
          scrollTop: event.currentTarget.scrollTop,
          dragging: true,
        }
      } else {
        pointerDragRef.current = null
        setIsDragging(false)
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      return
    }

    if (!drag || drag.pointerId !== event.pointerId) return

    if (drag.dragging) {
      // Prevent the pointer-up click from selecting a hex after a pan gesture.
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    pointerDragRef.current = null
    setIsDragging(false)
  }

  return (
    <div
      className={clsx(className, 'relative h-full min-h-0 w-full min-w-0 overflow-hidden bg-left', {
        'opacity-70': !isActive,
      })}
      style={{ backgroundImage: `url(${plankPanelHorizontal.href})` }}
      {...props}
    >
      <div
        ref={containerRef}
        className={clsx(
          'board-pan-viewport no-scrollbar absolute inset-0 select-none overflow-auto',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
        onClickCapture={(event) => {
          if (!suppressClickRef.current) return

          event.preventDefault()
          event.stopPropagation()
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <div ref={panSurfaceRef} className="box-content h-fit w-fit">
          <div
            id={`explorer-map-${player.id.toLowerCase()}`}
            ref={boardRef}
            className="relative shrink-0 bg-cover"
            style={{
              backgroundImage: `url(${player.board.imageURL})`,
              aspectRatio: `${player.board.width}/${player.board.height}`,
            }}
          >
            <svg
              viewBox={`0 0 ${dimX * HEX_WIDTH + MAGIC_OFFSET_VALUE_X} ${dimY * HEX_HEIGHT + MAGIC_OFFSET_VALUE_Y}`}
              className="absolute"
              style={player.board.svgStyle}
            >
              {player.board.hexes.map((cols, colId) =>
                cols.map(
                  (hex, rowId) =>
                    hex && (
                      <HexPath
                        player={player}
                        isActive={isActive}
                        hex={hex}
                        key={`${rowId}-${colId}`}
                        id={`${rowId}-${colId}`}
                        y={HEX_HEIGHT * rowId + (colId % 2 === 0 ? MAGIC_OFFSET_VALUE_Y : 0)}
                        x={HEX_WIDTH * colId + MAGIC_OFFSET_VALUE_X}
                      />
                    ),
                ),
              )}
            </svg>
            <EraCards player={player} />
          </div>
        </div>
      </div>
      {onViewNextPlayer ? (
        <button
          type="button"
          className="absolute right-[5%] top-[5%] z-10 font-bold text-primary-500 shadow-white text-shadow-lg sm:text-lg md:text-4xl"
          aria-label={`Viewing ${player.id}'s board. View next player's board.`}
          title="View next player's board"
          onClick={onViewNextPlayer}
        >
          {player.id} <ExplorerBlock color={player.color} className="inline h-8" />
        </button>
      ) : (
        <span className="absolute right-[5%] top-[5%] font-bold text-primary-500 shadow-white text-shadow-lg sm:text-lg md:text-4xl">
          {player.id} <ExplorerBlock color={player.color} className="inline h-8" />
        </span>
      )}
    </div>
  )
}
