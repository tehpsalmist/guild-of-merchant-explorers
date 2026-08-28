import React, { ComponentProps, PointerEvent as ReactPointerEvent, useRef, useState } from 'react'
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

interface PanMetrics {
  boardWidth: number
  boardHeight: number
  paddingX: number
  paddingY: number
  viewportWidth: number
  viewportHeight: number
}

interface PointerDrag {
  pointerId: number
  startX: number
  startY: number
  scrollLeft: number
  scrollTop: number
  dragging: boolean
}

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
    const boardWidth = Math.max(width, MIN_BOARD_WIDTH)
    const boardHeight = boardWidth / boardRatio
    // A half-viewport buffer lets either edge of the board be panned all the way to the viewport center.
    const paddingX = width / 2
    const paddingY = height / 2

    boardRef.current.style.width = `${boardWidth}px`
    boardRef.current.style.height = `${boardHeight}px`
    panSurfaceRef.current.style.padding = `${paddingY}px ${paddingX}px`

    panMetricsRef.current = {
      boardWidth,
      boardHeight,
      paddingX,
      paddingY,
      viewportWidth: width,
      viewportHeight: height,
    }

    containerRef.current.scrollLeft = paddingX + focusX * boardWidth - width / 2
    containerRef.current.scrollTop = paddingY + focusY * boardHeight - height / 2
  })

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    // Touch uses the browser's native inertial two-dimensional scrolling.
    if (!event.isPrimary || event.button !== 0 || event.pointerType === 'touch') return

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
    const drag = pointerDragRef.current
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
      className={clsx(
        className,
        'relative h-full min-h-0 w-full min-w-0 overflow-hidden bg-left',
        { 'opacity-70': !isActive },
      )}
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
