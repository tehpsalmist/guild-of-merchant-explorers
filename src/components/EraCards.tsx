import clsx from 'clsx'
import React, { ComponentProps } from 'react'
import type { Player } from '../game-logic/GameState'

export interface EraCardsProps extends ComponentProps<'div'> {
  player: Player
}

export const EraCards = ({ className = '', player, ...props }: EraCardsProps) => {
  const chosenCards = player.investigateCards.chosenCards
  const slots = [chosenCards[0], chosenCards[1], chosenCards[2]]

  return (
    <div
      className={clsx('pointer-events-none grid grid-rows-3 place-items-center py-[4%] pr-[4%]', className)}
      {...props}
    >
      {slots.map((card, position) => (
        <div key={position} className="grid h-full min-h-0 w-full place-items-center">
          {card && (
            <img
              src={card.card.imageUrl.href}
              alt={`Investigate card for Era ${position + 1}`}
              className="max-h-[92%] max-w-[88%] rounded-[6%] object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,0.75)]"
              draggable={false}
            />
          )}
        </div>
      ))}
    </div>
  )
}
