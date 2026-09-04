import React, { ComponentProps, useState } from 'react'
import { Hex } from '../game-logic/Board'
import clsx from 'clsx'
import { useGameState } from '../hooks/useGameState'
import {
  blockImage,
  towerImage,
  villageImage,
  treasureChestImage,
  crystalImage,
  tradingPostGrass,
  tradingPostMountain,
  tradingPostSand,
  exploredMarker,
} from '../images'
import { autoUpdate, offset, size, useFloating } from '@floating-ui/react-dom'
import { createPortal } from 'react-dom'
import { Player } from '../game-logic/GameState'

export interface HexProps extends ComponentProps<'path'> {
  x: number
  y: number
  hex: Hex
  player: Player
  isActive: boolean
}

export const HexPath = ({ className = '', id, x, y, hex, player, isActive, ...props }: HexProps) => {
  const { gameState } = useGameState()

  const [hovered, setHovered] = useState(false)

  // show/hide logic for game pieces
  const isVillageCandidate =
    player.mode === 'choosing-village' && hex.region === player.regionForVillage && hex.isVillageCandidate
  const isTradeRouteCandidate =
    player.mode === 'choosing-trade-route' &&
    player.connectedTradePosts.includes(hex) &&
    !player.chosenRoute.includes(hex)
  const isSelectedTradeRoute = player.mode === 'choosing-trade-route' && player.chosenRoute.includes(hex)
  const isTradeCandidate = player.mode === 'trading' && player.chosenRoute.includes(hex)

  const isExplorable =
    isActive && (player.mode === 'exploring' || player.mode === 'free-exploring') && hex.isExplorable()

  const hasReachedMark = gameState.boardName === 'xawskil' && hex.land?.hasBeenReached && hex === hex.land?.markableHex

  const showBlock =
    hex.isExplored &&
    !hex.isCity &&
    !hex.isVillage &&
    !isVillageCandidate &&
    !isTradeCandidate &&
    !isTradeRouteCandidate &&
    !isSelectedTradeRoute

  const hasPiece = hex.isCovered || hex.isVillage || showBlock || hasReachedMark

  const handleClick = () => {
    console.log(hex)

    if (!isActive) return

    switch (player.mode) {
      case 'exploring':
        if (!hex.isExplorable()) return

        return player.selectMove({ action: 'explore', hex })
      case 'free-exploring':
        if (!hex.isExplorable()) return

        return player.selectMove({ action: 'freely-explore', hex })
      case 'choosing-village':
        if (!isVillageCandidate) return

        return player.selectMove({ action: 'choose-village', hex })
      case 'choosing-trade-route':
        if (!isTradeRouteCandidate) return

        return player.selectMove({ action: 'choose-trade-route', hex })
      case 'trading':
        if (!isTradeCandidate) return

        const tradingHex = player.chosenRoute.find((h) => h !== hex)

        if (!tradingHex) return

        return player.selectMove({
          action: 'cover-tradepost',
          hex,
          tradingHex,
        })
    }
  }

  const { refs, floatingStyles } = useFloating({
    whileElementsMounted: autoUpdate,
    placement: 'bottom',
    middleware: [
      offset(({ rects }) => -rects.floating.height),
      size({
        apply({ rects, elements }) {
          elements.floating.style.width = `${rects.reference.width}px`
          elements.floating.style.height = `${rects.reference.height}px`
        },
      }),
    ],
  })

  const explorerMapDiv = document.getElementById(`explorer-map-${player.id.toLowerCase()}`)

  return (
    <>
      <path
        ref={refs.setReference}
        id={id}
        d={`M${x},${y} h50 l25,43.3 l-25,43.3 h-50 l-25,-43.3 z`}
        className={clsx(className, 'fill-transparent', {
          'cursor-pointer hover:fill-red-500/15': isExplorable,
          'cursor-pointer fill-red-500/15!': isExplorable && hovered && hasPiece,
          'cursor-pointer fill-blue-500/15! hover:fill-blue-500/25!': isVillageCandidate || isTradeCandidate,
          'cursor-pointer fill-yellow-500/15! hover:fill-yellow-500/25!': isTradeRouteCandidate,
          'cursor-pointer fill-green-500/15! hover:fill-green-500/25!': isSelectedTradeRoute,
        })}
        onClick={handleClick}
        {...props}
      />
      {/* Floating Element for Piece Images */}
      {explorerMapDiv &&
        hasPiece &&
        createPortal(
          <div
            ref={refs.setFloating}
            className={clsx(isExplorable || (isVillageCandidate && 'cursor-pointer'))}
            style={floatingStyles}
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <div className="relative h-full w-full">
              {hex.isCovered && !!hex.crystalValue && (
                <img src={crystalImage.href} className="absolute inset-x-1/4 w-1/2" />
              )}
              {hex.isCovered && hex.isRuin && (
                <img src={treasureChestImage.href} className="absolute inset-x-[15%] top-[5%] w-[70%]" />
              )}
              {hex.isCovered && !!hex.tradingPostValue && (
                <img
                  src={
                    (hex.terrain === 'sand'
                      ? tradingPostSand
                      : hex.terrain === 'grass'
                        ? tradingPostGrass
                        : tradingPostMountain
                    ).href
                  }
                  className="absolute left-[3%] w-[90%]"
                />
              )}
              {hasReachedMark && (
                <img
                  src={exploredMarker.href}
                  className="absolute left-[-10%] top-[10%] w-[70%] rounded-full ring-2 ring-primary-400 lg:ring-4"
                />
              )}
              {hex.isCovered && hex.isTower && (
                <img src={towerImage.href} className="absolute bottom-0 left-1/4 w-1/2" />
              )}
              {showBlock && (
                <img src={blockImage.href} className={clsx(player.color, 'absolute inset-1/4 z-10 w-1/2')} />
              )}
              {hex.isVillage && (
                <img src={villageImage.href} className={clsx(player.color, 'absolute inset-1/4 z-10 w-1/2')} />
              )}
            </div>
          </div>,
          explorerMapDiv,
        )}
    </>
  )
}
