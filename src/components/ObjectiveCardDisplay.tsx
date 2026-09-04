import clsx from 'clsx'
import React, { ComponentProps } from 'react'
import { Objective } from '../game-logic/Objective'
import { era2Blocker, era3Blocker, eraAnyBlocker } from '../images'
import { ExplorerBlock } from './ExplorerBlock'

export interface ObjectiveCardDisplayProps extends ComponentProps<'div'> {
  objective: Objective
  position: number
}

export const ObjectiveCardDisplay = ({ objective, position, className, ...props }: ObjectiveCardDisplayProps) => (
  <div className={clsx('relative aspect-1042/744 overflow-hidden rounded-[3%]', className)} {...props}>
    <img
      src={objective.imageUrl.href}
      alt={`Objective ${position + 1}`}
      className="absolute inset-0 block h-full w-full object-contain"
      draggable={false}
    />

    {objective.isFirstBlocked && position === 0 && (
      <img
        src={era2Blocker.href}
        alt="Era II reward blocked"
        className="absolute left-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
        draggable={false}
      />
    )}
    {objective.isSecondBlocked && position === 0 && (
      <img
        src={era3Blocker.href}
        alt="Era III reward blocked"
        className="absolute right-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
        draggable={false}
      />
    )}
    {objective.isFirstBlocked && position === 1 && (
      <img
        src={era3Blocker.href}
        alt="Era III reward blocked"
        className="absolute left-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
        draggable={false}
      />
    )}
    {objective.isSecondBlocked && position === 1 && (
      <img
        src={eraAnyBlocker.href}
        alt="Any-era reward blocked"
        className="absolute right-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
        draggable={false}
      />
    )}
    {objective.isFirstBlocked && position === 2 && (
      <img
        src={eraAnyBlocker.href}
        alt="Any-era reward blocked"
        className="absolute left-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
        draggable={false}
      />
    )}

    {[
      { id: 'first', players: objective.firstPlayers, cardPosition: 'left-[24%]' },
      { id: 'second', players: objective.secondPlayers, cardPosition: 'right-[24%]' },
    ].map(({ id, players, cardPosition }) =>
      players.length ? (
        <div
          key={id}
          className={clsx('absolute top-[41.5%] grid h-[17%] w-[16%] place-items-center gap-[4%]', cardPosition)}
          style={{
            gridTemplateColumns: `repeat(${Math.min(players.length, 2)}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${Math.ceil(players.length / 2)}, minmax(0, 1fr))`,
          }}
        >
          {players.map((player) => (
            <ExplorerBlock
              key={player.id}
              color={player.color}
              className="block h-full w-full object-contain"
              draggable={false}
            />
          ))}
        </div>
      ) : null,
    )}
  </div>
)
