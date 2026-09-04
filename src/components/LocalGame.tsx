import React, { ComponentProps, useLayoutEffect } from 'react'
import { BoardName, PlayerInputs } from '../game-logic/GameState'
import { GameStateProvider } from '../hooks/useGameState'
import { GameBoard } from './GameBoard'
import { TextInput, useRememberedState } from '@8thday/react'
import { aghonBoard, aveniaBoard, cnidariaBoard, kazanBoard, northProyliaBoard, xawskilBaseBoard } from '../images'
import clsx from 'clsx'
import { CheckIcon, MapIcon, PlayIcon, PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ColorPicker } from './ColorPicker'
import { Main } from '../design-system/Main'
import { useGameNavigation } from '../hooks/useGameNavigation'

export interface LocalGameProps extends ComponentProps<'main'> {}

const boards: Array<{ name: BoardName; label: string; image: URL }> = [
  { name: 'aghon', label: 'Aghon', image: aghonBoard },
  { name: 'avenia', label: 'Avenia', image: aveniaBoard },
  { name: 'kazan', label: 'Kazan', image: kazanBoard },
  { name: 'cnidaria', label: 'Cnidaria', image: cnidariaBoard },
  { name: 'northProylia', label: 'North Proylia', image: northProyliaBoard },
  { name: 'xawskil', label: 'Xawskil', image: xawskilBaseBoard },
]

export const LocalGame = ({ className = '', ...props }: LocalGameProps) => {
  const setGameActive = useGameNavigation()
  const [boardName, setBoardName] = useRememberedState<BoardName | ''>('gome-board-name', '')
  const [playerData, setPlayerData] = useRememberedState<PlayerInputs[]>('gome-player-data', [{ id: '', color: '' }])
  const [readyToPlay, setReadyToPlay] = useRememberedState('gome-ready-to-play', false)

  const hasDupes = playerData.some((player, i) =>
    playerData.some(
      (otherPlayer, j) =>
        i !== j &&
        ((player.id && player.id === otherPlayer.id) || (player.color && player.color === otherPlayer.color)),
    ),
  )

  const disabled =
    !boardName || !playerData.length || playerData.some(({ id, color }) => !id.trim() || !color) || hasDupes

  const gameActive = readyToPlay && !disabled
  const selectedBoard = boards.find(({ name }) => name === boardName)

  useLayoutEffect(() => {
    setGameActive(gameActive)

    return () => setGameActive(false)
  }, [gameActive, setGameActive])

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
            if (!disabled) setReadyToPlay(true)
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

              <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @3xl:grid-cols-3">
                {boards.map((board) => {
                  const selected = board.name === boardName

                  return (
                    <button
                      type="button"
                      key={board.name}
                      className={clsx(
                        'group relative overflow-hidden rounded-xl border bg-slate-900/70 text-left shadow-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-slate-950',
                        selected
                          ? 'border-amber-300 ring-2 ring-amber-300/70'
                          : 'border-white/15 hover:-translate-y-0.5 hover:border-amber-100/50',
                      )}
                      onClick={() => setBoardName(board.name)}
                      aria-pressed={selected}
                    >
                      <span className="block aspect-square overflow-hidden bg-black/30">
                        <img
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          src={board.image.href}
                          alt={`${board.label} game board`}
                        />
                      </span>
                      <span
                        className={clsx(
                          'flex items-center justify-between gap-2 border-t px-3 py-2 text-sm font-bold transition',
                          selected
                            ? 'border-amber-300/40 bg-amber-100 text-slate-900'
                            : 'border-white/10 text-amber-50 group-hover:bg-white/5',
                        )}
                      >
                        {board.label}
                        <span
                          className={clsx(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                            selected ? 'border-amber-700 bg-amber-500 text-amber-950' : 'border-amber-100/35',
                          )}
                          aria-hidden="true"
                        >
                          {selected && <CheckIcon className="h-4 w-4 stroke-3" />}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
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
      resetGame={() => {
        localStorage.removeItem('gome-serialized-game-state')
        setReadyToPlay(false)
        setBoardName('')
      }}
      name={boardName}
      playerData={playerData}
    >
      <GameBoard className={className} {...props} />
    </GameStateProvider>
  )
}
