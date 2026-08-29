import clsx from 'clsx'
import React, { ComponentProps, useEffect, useState } from 'react'
import { useGameState } from '../hooks/useGameState'
import { era2Blocker, era3Blocker, eraAnyBlocker } from '../images'
import { useEventListener } from '@8thday/react'
import { ExplorerBlock } from './ExplorerBlock'
import { audioTools, uiCardCloseSound, uiCardOpenSound } from '../audio'

export interface ObjectiveCardsProps extends ComponentProps<'div'> {}

export const ObjectiveCards = ({ className = '', ...props }: ObjectiveCardsProps) => {
  const [inView, setInView] = useState(true)

  const { gameState } = useGameState()

  useEventListener('keydown', (e) => {
    if (e.key === 'w') {
      toggleView()
    }
  })

  function toggleView() {
    setInView((v) => !v)
    if (inView) {
      audioTools.play(uiCardCloseSound)
    } else {
      audioTools.play(uiCardOpenSound)
    }
  }

  useEffect(() => {
    const listener = () => {
      setInView(true)
      audioTools.play(uiCardOpenSound)
    }
    gameState.players.forEach((p) => p.addEventListener('objective-achieved', listener))

    return () => gameState.players.forEach((p) => p.removeEventListener('objective-achieved', listener))
  }, [gameState.players])

  return (
    <div
      className={clsx(
        className,
        `absolute left-0 top-16 z-10 flex w-full cursor-pointer justify-evenly transition-all duration-200`,
        inView ? 'translate-y-2 opacity-100' : '-translate-y-[80%] opacity-50',
      )}
      onClick={() => toggleView()}
      {...props}
    >
      {gameState.objectives.map((card, i) =>
        card ? (
          <div key={i} className="relative aspect-[1042/744] w-full max-w-1/4 shrink-0">
            <img
              src={card.imageUrl.href}
              className="absolute inset-0 block h-full w-full object-contain"
              draggable={false}
            />
            {card.isFirstBlocked && i === 0 && (
              <img
                src={era2Blocker.href}
                alt="era 2 objective blocker"
                className="absolute left-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
                draggable={false}
              />
            )}
            {card.isSecondBlocked && i === 0 && (
              <img
                src={era3Blocker.href}
                alt="era 3 objective blocker"
                className="absolute right-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
                draggable={false}
              />
            )}
            {card.isFirstBlocked && i === 1 && (
              <img
                src={era3Blocker.href}
                alt="era 3 objective blocker"
                className="absolute left-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
                draggable={false}
              />
            )}
            {card.isSecondBlocked && i === 1 && (
              <img
                src={eraAnyBlocker.href}
                alt="era any objective blocker"
                className="absolute right-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
                draggable={false}
              />
            )}
            {card.isFirstBlocked && i === 2 && (
              <img
                src={eraAnyBlocker.href}
                alt="era any objective blocker"
                className="absolute left-1/5 top-1/2 h-1/3 w-auto max-w-none object-contain"
                draggable={false}
              />
            )}
            {[
              { id: 'first', players: card.firstPlayers, position: 'left-[24%]' },
              { id: 'second', players: card.secondPlayers, position: 'right-[24%]' },
            ].map(({ id, players, position }) =>
              players.length ? (
                <div
                  key={id}
                  className={clsx('absolute top-[41.5%] grid h-[17%] w-[16%] place-items-center gap-[4%]', position)}
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
        ) : (
          <div key={i} className="w-full max-w-1/4" />
        ),
      )}
    </div>
  )
}
