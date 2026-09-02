import React, { ComponentProps, useLayoutEffect, useState } from 'react'
import { BoardName, PlayerInputs } from '../game-logic/GameState'
import { GameStateProvider } from '../hooks/useGameState'
import { GameBoard } from './GameBoard'
import { Button, TextInput, useRememberedState } from '@8thday/react'
import { aghonBoard, aveniaBoard, cnidariaBoard, kazanBoard, northProyliaBoard, xawskilBaseBoard } from '../images'
import clsx from 'clsx'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ColorPicker } from './ColorPicker'
import { Main } from '../design-system/Main'
import { useGameNavigation } from '../hooks/useGameNavigation'

export interface LocalGameProps extends ComponentProps<'main'> {}

export const LocalGame = ({ className = '', ...props }: LocalGameProps) => {
  const setGameActive = useGameNavigation()
  const [boardName, setBoardName] = useRememberedState<BoardName | ''>('gome-board-name', '')
  const [playerData, setPlayerData] = useRememberedState<PlayerInputs[]>('gome-player-data', [{ id: '', color: '' }])
  const [readyToPlay, setReadyToPlay] = useRememberedState('gome-ready-to-play', false)

  const hasDupes = playerData.some((pi, i) =>
    playerData.some((pj, j) => i !== j && (pi.id === pj.id || pi.color === pj.color)),
  )

  const disabled = !boardName || !playerData?.length || playerData.some(({ id, color }) => !id || !color) || hasDupes

  const gameActive = readyToPlay && !disabled

  useLayoutEffect(() => {
    setGameActive(gameActive)

    return () => setGameActive(false)
  }, [gameActive, setGameActive])

  if (!gameActive)
    return (
      <Main className={clsx(className, 'flex flex-col items-center')} {...props}>
        <h2 className="mb-4">Players</h2>
        <div className="flex flex-col items-center gap-1">
          {playerData.map(({ id, color }, i) => (
            <div className="flex items-center gap-x-1" key={i}>
              <TextInput
                value={id}
                onChange={(e) =>
                  setPlayerData((pns) => pns.map((pn, pi) => (pi === i ? { ...pn, id: e.target.value } : pn)))
                }
                placeholder="Player Name"
                required
                collapseDescriptionArea
              />
              <ColorPicker
                value={color}
                disabledColors={playerData.map(({ color }) => color)}
                onValueChange={(c) =>
                  setPlayerData((pns) => pns.map((pn, pi) => (pi === i ? { ...pn, color: c } : pn)))
                }
              />
              {playerData.length > 1 && (
                <Button
                  PreIcon={XMarkIcon}
                  variant="dismissive"
                  onClick={() => setPlayerData((pns) => pns.filter((_pn, pi) => pi !== i))}
                />
              )}
            </div>
          ))}
          {hasDupes && <p className="text-orange-500">Please choose a unique name and color for each player.</p>}

          <Button
            className="my-4"
            PreIcon={PlusIcon}
            onClick={() => setPlayerData((p) => [...p, { color: '', id: '' }])}
          >
            Add Player
          </Button>

          {!disabled && (
            <Button variant="primary" onClick={() => setReadyToPlay(true)}>
              Play{playerData.length === 1 && ' in Solo Mode'}
            </Button>
          )}
        </div>
        <div
          className={clsx(
            className,
            'grid gap-4 p-4',
            boardName ? 'mx-auto max-w-[50vw] grid-cols-1 place-content-center' : 'grid-cols-[repeat(2,minmax(0,auto))]',
          )}
        >
          <h2 className="col-span-full text-center">Choose A Board To Play</h2>
          {(boardName === '' || boardName === 'aghon') && (
            <button
              className="opacity-100 hover:opacity-70 focus:opacity-70 focus:outline-none"
              onClick={() => setBoardName(boardName ? '' : 'aghon')}
            >
              <img className="h-full w-full" src={aghonBoard.href} />
            </button>
          )}
          {(boardName === '' || boardName === 'avenia') && (
            <button
              className="opacity-100 hover:opacity-70 focus:opacity-70 focus:outline-none"
              onClick={() => setBoardName(boardName ? '' : 'avenia')}
            >
              <img className="h-full w-full" src={aveniaBoard.href} />
            </button>
          )}
          {(boardName === '' || boardName === 'kazan') && (
            <button
              className="opacity-100 hover:opacity-70 focus:opacity-70 focus:outline-none"
              onClick={() => setBoardName(boardName ? '' : 'kazan')}
            >
              <img className="h-full w-full" src={kazanBoard.href} />
            </button>
          )}
          {(boardName === '' || boardName === 'cnidaria') && (
            <button
              className="opacity-100 hover:opacity-70 focus:opacity-70 focus:outline-none"
              onClick={() => setBoardName(boardName ? '' : 'cnidaria')}
            >
              <img className="h-full w-full" src={cnidariaBoard.href} />
            </button>
          )}
          {(boardName === '' || boardName === 'northProylia') && (
            <button
              className="opacity-100 hover:opacity-70 focus:opacity-70 focus:outline-none"
              onClick={() => setBoardName(boardName ? '' : 'northProylia')}
            >
              <img className="h-full w-full" src={northProyliaBoard.href} />
            </button>
          )}
          {(boardName === '' || boardName === 'xawskil') && (
            <button
              className="opacity-100 hover:opacity-70 focus:opacity-70 focus:outline-none"
              onClick={() => setBoardName(boardName ? '' : 'xawskil')}
            >
              <img className="h-full w-full" src={xawskilBaseBoard.href} />
            </button>
          )}
        </div>
      </Main>
    )

  return (
    <GameStateProvider
      resetGame={() => {
        localStorage.removeItem('gome-serialized-game-state')
        setReadyToPlay(false)
        setBoardName('')
      }}
      name={boardName}
      playerData={playerData}
    >
      <GameBoard className={`${className}`} {...props} />
    </GameStateProvider>
  )
}
