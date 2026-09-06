import React, { ComponentProps } from 'react'
import { BoardName, GameState, PlayerInputs } from '../game-logic/GameState'
import { GameStateProvider } from '../hooks/useGameState'
import { GameBoard } from './GameBoard'
import { TextInput, useRememberedState } from '@8thday/react'
import clsx from 'clsx'
import { MapIcon, PlayIcon, PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ColorPicker } from './ColorPicker'
import { Main } from '../design-system/Main'
import { BoardSelectionCards, boards } from './BoardSelectionCards'
import {
  LOCAL_GAME_STORAGE_KEY,
  removeStoredGame,
  saveStoredGame,
  useStoredGame,
} from '../hooks/useStoredGame'

export interface LocalGameProps extends ComponentProps<'main'> {}

export const LocalGame = ({ className = '', ...props }: LocalGameProps) => {
  const [boardName, setBoardName] = useRememberedState<BoardName | ''>('gome-board-name', '')
  const [playerData, setPlayerData] = useRememberedState<PlayerInputs[]>('gome-player-data', [{ id: '', color: '' }])
  const savedGame = useStoredGame(LOCAL_GAME_STORAGE_KEY)

  const hasDupes = playerData.some((player, i) =>
    playerData.some(
      (otherPlayer, j) =>
        i !== j &&
        ((player.id && player.id === otherPlayer.id) || (player.color && player.color === otherPlayer.color)),
    ),
  )

  const disabled =
    !boardName || !playerData.length || playerData.some(({ id, color }) => !id.trim() || !color) || hasDupes

  const gameActive = savedGame !== null
  const selectedBoard = boards.find(({ name }) => name === boardName)

  if (!gameActive)
    return (
      <Main
        className={clsx(
          className,
          'relative bg-slate-950 text-amber-50 selection:bg-amber-200 selection:text-slate-950',
        )}
        {...props}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(circle at 15% 5%, rgb(180 83 9 / 0.24), transparent 32rem), radial-gradient(circle at 85% 85%, rgb(30 64 175 / 0.2), transparent 34rem)',
          }}
          aria-hidden="true"
        />

        <form
          className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
          onSubmit={(event) => {
            event.preventDefault()
            if (!disabled && boardName) {
              saveStoredGame(LOCAL_GAME_STORAGE_KEY, JSON.stringify(new GameState({ boardName, playerData })))
            }
          }}
        >
          <header className="mx-auto max-w-2xl text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-200/70">Local Game</p>
            <h1 className="font-serif text-4xl text-amber-50 sm:text-5xl">Set the Table</h1>
            <p className="mt-3 text-sm leading-6 text-amber-100/65 sm:text-base">
              Gather your explorers, choose a map, and begin your expedition.
            </p>
          </header>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(19rem,0.75fr)_minmax(0,1.6fr)]">
            <section className="rounded-2xl border border-amber-100/20 bg-black/25 p-4 shadow-xl backdrop-blur-sm sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
                  <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-amber-100/50">Step one</p>
                  <h2 className="font-serif text-2xl text-amber-50">Choose Your Players</h2>
                  <p className="mt-1 text-sm text-amber-100/60">Give each explorer a unique name and color.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {playerData.map(({ id, color }, i) => (
                  <div className="rounded-xl border border-amber-100/15 bg-slate-900/55 p-3 shadow-inner" key={i}>
                    <div className="mb-2 flex items-center">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-amber-100/55">
                        Player {i + 1}
                      </span>
                      {playerData.length > 1 && (
                        <button
                          type="button"
                          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-amber-100/55 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                          onClick={() =>
                            setPlayerData((players) => players.filter((_player, playerIndex) => playerIndex !== i))
                          }
                          aria-label={`Remove player ${i + 1}`}
                        >
                          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-end gap-2">
                      <TextInput
                        className="min-w-0 grow"
                        inputClass="bg-amber-50/95 text-slate-900 placeholder:text-slate-500"
                        label={`Player ${i + 1} name`}
                        hideLabel
                        value={id}
                        onChange={(event) =>
                          setPlayerData((players) =>
                            players.map((player, playerIndex) =>
                              playerIndex === i ? { ...player, id: event.target.value } : player,
                            ),
                          )
                        }
                        placeholder="Player name"
                        autoComplete="off"
                        required
                        collapseDescriptionArea
                      />
                      <ColorPicker
                        value={color}
                        aria-labelledby={`player-${i}-color-label`}
                        disabledColors={playerData
                          .filter((_player, playerIndex) => playerIndex !== i)
                          .map((player) => player.color)}
                        onValueChange={(newColor) =>
                          setPlayerData((players) =>
                            players.map((player, playerIndex) =>
                              playerIndex === i ? { ...player, color: newColor } : player,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {hasDupes && (
                <p
                  className="mt-3 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100"
                  role="alert"
                >
                  Every player needs a unique name and color.
                </p>
              )}

              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-100/25 px-3 py-2 text-sm font-bold text-amber-50 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-200"
                onClick={() => setPlayerData((players) => [...players, { color: '', id: '' }])}
              >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                Add Player
              </button>
            </section>

            <fieldset className="@container rounded-2xl border border-amber-100/20 bg-black/25 p-4 shadow-xl backdrop-blur-sm sm:p-6">
              <legend className="sr-only">Choose a board</legend>
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
                  <MapIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.24em] text-amber-100/50">Step two</p>
                  <h2 className="font-serif text-2xl text-amber-50">Choose a Board</h2>
                  <p className="mt-1 text-sm text-amber-100/60">Select the region your guild will explore.</p>
                </div>
              </div>

              <BoardSelectionCards value={boardName} onChange={setBoardName} />
            </fieldset>
          </div>

          <footer className="self-center sticky bottom-14 z-10 flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/15 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md sm:bottom-3 sm:flex-row sm:px-4">
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100/50">Ready to explore?</p>
              <p className="mt-1 truncate text-sm text-amber-50">
                {selectedBoard
                  ? `${playerData.length} ${playerData.length === 1 ? 'player' : 'players'} · ${selectedBoard.label}`
                  : 'Complete both steps to begin.'}
              </p>
            </div>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex w-fit whitespace-nowrap shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-100/30 bg-[#f5edcf] px-5 py-3 text-sm font-black uppercase tracking-wider text-slate-900 shadow transition hover:-translate-y-0.5 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:w-auto"
            >
              <PlayIcon className="h-5 w-5" aria-hidden="true" />
              {playerData.length === 1 ? 'Start Solo Game' : 'Start Local Game'}
            </button>
          </footer>
        </form>
      </Main>
    )

  return (
    <GameStateProvider
      serializedGame={savedGame}
      resetGame={() => {
        removeStoredGame(LOCAL_GAME_STORAGE_KEY)
        setBoardName('')
      }}
      storageKey={LOCAL_GAME_STORAGE_KEY}
    >
      <GameBoard followPlayerTurns className={className} {...props} />
    </GameStateProvider>
  )
}
