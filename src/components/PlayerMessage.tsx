import clsx from 'clsx'
import React, { ComponentProps, useEffect, useState } from 'react'
import { Player, PlayerMode } from '../game-logic/GameState'
import { useGameState } from '../hooks/useGameState'

const messages: Record<PlayerMode, string> = {
  'choosing-village': "You've explored the region! Choose where to build a village.",
  'choosing-trade-route': 'Pick two trading posts to trade between.',
  'choosing-investigate-card': 'Choose an Investigate Card',
  'choosing-investigate-card-reuse': 'Choose an Investigate Card',
  'clearing-history': 'Clearing move history...',
  exploring: 'Explore!',
  'free-exploring': 'Explore anywhere!',
  trading: 'Complete the trade by picking a trading post to permanently cover.',
  'user-prompting': 'Choose what to do next.',
  'treasure-to-draw': 'Draw a treasure card!',
}

export interface PlayerMessageProps extends ComponentProps<'button'> {
  activePlayer: Player
}

export const PlayerMessage = ({ className = '', activePlayer, ...props }: PlayerMessageProps) => {
  const { gameState } = useGameState()
  const [expanded, setExpanded] = useState(false)

  const mode = activePlayer.mode
  const message =
    mode === 'exploring'
      ? gameState.currentExplorerCard?.rules(activePlayer)?.[activePlayer.cardPhase]?.message ??
        'Explore!'
      : messages[mode]

  useEffect(() => setExpanded(false), [message])

  return (
    <button
      {...props}
      type="button"
      className={clsx(
        className,
        'cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-white/80',
        expanded ? 'overflow-visible whitespace-normal text-clip' : 'truncate',
      )}
      onClick={(event) => {
        props.onClick?.(event)
        setExpanded((isExpanded) => !isExpanded)
      }}
      aria-expanded={expanded}
      title={expanded ? undefined : message}
    >
      {message}
    </button>
  )
}
