import clsx from 'clsx'
import React, { ComponentProps } from 'react'
import { useGameState } from '../hooks/useGameState'
import { ObjectiveCardDisplay } from './ObjectiveCardDisplay'

export interface ObjectiveCardsProps extends ComponentProps<'div'> {}

export const ObjectiveCards = ({ className = '', ...props }: ObjectiveCardsProps) => {
  const { gameState } = useGameState()

  return (
    <div
      className={clsx('pointer-events-none grid grid-cols-3 items-end gap-[2%] px-[2%] pb-[2%]', className)}
      {...props}
    >
      {gameState.objectives.map((objective, position) => (
        <ObjectiveCardDisplay
          key={objective.id}
          objective={objective}
          position={position}
          className="w-full drop-shadow-[0_6px_6px_rgba(0,0,0,0.7)]"
        />
      ))}
    </div>
  )
}
