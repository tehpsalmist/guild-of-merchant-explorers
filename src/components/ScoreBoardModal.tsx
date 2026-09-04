import React, { useEffect } from 'react'
import { Button, Modal } from '@8thday/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useGameState } from '../hooks/useGameState'
import { plankPanelHorizontal } from '../images'
import { ExplorerBlock } from './ExplorerBlock'
import clsx from 'clsx'

export interface ScoreBoardModalProps {
  onClose(): void
  onNewGame(): void
}

export const ScoreBoardModal = ({ onClose, onNewGame }: ScoreBoardModalProps) => {
  const { gameState } = useGameState()
  const allDone = gameState.players.every((player) => player.scoreBoard.doneRevealing)
  const highestScore = Math.max(...gameState.players.map((player) => player.coins))
  const revealedStats = gameState.players.reduce(
    (total, player) => total + player.scoreBoard.stats.filter((stat) => stat.visibleScore >= 0).length,
    0,
  )
  const totalStats = gameState.players.reduce((total, player) => total + player.scoreBoard.stats.length, 0)
  const revealProgress = totalStats ? (revealedStats / totalStats) * 100 : 0

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <Modal
      className="max-h-[96dvh]! max-w-[96dvw]! overflow-hidden! rounded-3xl! bg-transparent! p-0! shadow-2xl mobile:h-dvh! mobile:max-h-dvh! mobile:max-w-none! mobile:rounded-none! phone-landscape:h-dvh! phone-landscape:max-h-dvh! phone-landscape:max-w-none! phone-landscape:rounded-none!"
      bgClass="bg-slate-950/80 backdrop-blur-sm"
      onClose={onClose}
    >
      <section
        className="relative flex max-h-[96dvh] w-[min(94dvw,72rem)] flex-col overflow-hidden text-white mobile:h-dvh mobile:max-h-dvh mobile:w-screen phone-landscape:h-dvh phone-landscape:max-h-dvh phone-landscape:w-screen"
        style={{ backgroundImage: `url(${plankPanelHorizontal.href})` }}
        aria-labelledby="scoreboard-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/45" />

        <button
          type="button"
          className="fixed z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-900/70 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-white/80"
          style={{
            top: 'max(0.5rem, env(safe-area-inset-top))',
            right: 'max(0.5rem, env(safe-area-inset-right))',
          }}
          onClick={onClose}
          aria-label="Hide scoreboard"
          title="Hide scoreboard"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        <header className="relative shrink-0 border-b border-white/20 px-5 pb-4 pt-5 text-center sm:px-8 mobile:px-3 mobile:pb-3 mobile:pt-3 phone-landscape:px-3 phone-landscape:py-1.5">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.28em] text-amber-100/75 mobile:text-[0.65rem] phone-landscape:hidden">
            Final Ledger
          </p>
          <h1
            id="scoreboard-title"
            className="font-serif text-3xl text-amber-50 sm:text-4xl mobile:text-2xl phone-landscape:text-xl"
          >
            All Eras Complete
          </h1>
          <p className="mt-1 text-sm text-white/70 mobile:text-xs phone-landscape:hidden">
            {allDone ? 'The guild has recorded every expedition.' : 'Tallying the guild expeditions…'}
          </p>
          {gameState.players.length > 1 && (
            <p className="mt-1 hidden text-[0.65rem] font-semibold uppercase tracking-wider text-amber-100/60 mobile:block phone-landscape:hidden">
              Swipe to compare explorers
            </p>
          )}

          <div className="mx-auto mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-black/30 mobile:mt-2 phone-landscape:mt-1 phone-landscape:h-1">
            <div
              className="h-full rounded-full bg-amber-300 transition-[width] duration-500 ease-out"
              style={{ width: `${revealProgress}%` }}
            />
          </div>
        </header>

        <div className="relative grid min-h-0 flex-1 snap-x snap-mandatory auto-cols-[minmax(17rem,1fr)] grid-flow-col gap-4 overflow-auto p-3 sm:p-5 mobile:auto-cols-[100%] mobile:gap-2 mobile:p-2 phone-landscape:auto-cols-[100%] phone-landscape:gap-2 phone-landscape:p-2">
          {gameState.players.map((player) => {
            const totalStat = player.scoreBoard.stats.at(-1)
            const detailStats = player.scoreBoard.stats.slice(0, -1)
            const isWinner = allDone && !gameState.soloMode && player.coins === highestScore
            const winners = gameState.players.filter((candidate) => candidate.coins === highestScore).length

            return (
              <article
                key={player.id}
                className={clsx(
                  'relative flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-[#f5edcf]/95 text-slate-800 shadow-xl',
                  'snap-center mobile:rounded-xl phone-landscape:grid phone-landscape:grid-cols-[8rem_minmax(0,1fr)_9rem] phone-landscape:grid-rows-1 phone-landscape:rounded-xl',
                  isWinner ? 'border-amber-300 ring-2 ring-amber-300/60' : 'border-amber-950/30',
                )}
              >
                {isWinner && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-amber-500 px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest text-amber-950">
                    {winners > 1 ? 'Tied Winner' : 'Winner'}
                  </div>
                )}

                <div className="flex min-h-16 items-center gap-3 border-b border-amber-950/20 bg-slate-800/90 px-4 py-3 text-amber-50 mobile:min-h-14 mobile:py-2 phone-landscape:min-h-0 phone-landscape:flex-col phone-landscape:justify-center phone-landscape:gap-2 phone-landscape:border-b-0 phone-landscape:border-r phone-landscape:px-2 phone-landscape:py-2 phone-landscape:text-center">
                  <ExplorerBlock
                    color={player.color}
                    className="h-9 w-9 object-contain mobile:h-8 mobile:w-8 phone-landscape:h-10 phone-landscape:w-10"
                  />
                  <div className="min-w-0 phone-landscape:w-full">
                    <p className="truncate text-xs font-semibold uppercase tracking-widest text-amber-100/65">
                      Explorer
                    </p>
                    <h2 className="truncate text-xl font-bold phone-landscape:text-base">{player.id}</h2>
                  </div>
                </div>

                <div className="min-h-0 flex-1 divide-y divide-amber-950/10 overflow-y-auto px-3 py-2 mobile:py-1 phone-landscape:h-full phone-landscape:px-3 phone-landscape:py-1">
                  {detailStats.map((stat, index) => {
                    const revealed = stat.visibleScore >= 0

                    return (
                      <div
                        key={`${stat.name}-${index}`}
                        className="grid min-h-12 grid-cols-[2.25rem_1fr_auto] items-center gap-2 py-1.5 mobile:min-h-10 mobile:grid-cols-[2rem_1fr_auto] mobile:py-1 phone-landscape:min-h-10 phone-landscape:grid-cols-[2rem_1fr_auto] phone-landscape:py-1"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-950/5 p-1 mobile:h-8 mobile:w-8 phone-landscape:h-8 phone-landscape:w-8">
                          {stat.image && <img className="h-full w-full object-contain" src={stat.image.href} alt="" />}
                        </div>
                        <p className="text-sm font-semibold leading-tight text-slate-700 mobile:text-xs phone-landscape:text-xs">
                          {stat.name}
                        </p>
                        <p
                          className={clsx(
                            'min-w-14 text-right text-xl font-black tabular-nums transition-all duration-300 mobile:min-w-12 mobile:text-lg phone-landscape:min-w-12 phone-landscape:text-lg',
                            revealed ? 'scale-100 text-slate-900 opacity-100' : 'scale-90 text-slate-400 opacity-40',
                          )}
                        >
                          {revealed ? stat.visibleScore : '—'}
                          {revealed && stat.maxScore ? (
                            <span className="ml-0.5 text-xs font-semibold text-slate-500">/ {stat.maxScore}</span>
                          ) : null}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div className="m-3 mt-1 flex min-h-20 items-center justify-between rounded-xl border border-amber-700/30 bg-amber-100/80 px-4 py-3 shadow-inner mobile:m-2 mobile:mt-1 mobile:min-h-16 mobile:py-2 phone-landscape:m-2 phone-landscape:min-h-0 phone-landscape:flex-col phone-landscape:justify-center phone-landscape:px-2 phone-landscape:py-2 phone-landscape:text-center">
                  <div className="phone-landscape:shrink-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-900/65">Final Coins</p>
                    <p className="text-sm text-amber-950/60 phone-landscape:hidden">Expedition total</p>
                  </div>
                  <div
                    className={clsx(
                      'flex items-center gap-2 transition-all duration-300 phone-landscape:flex-col phone-landscape:gap-0',
                      totalStat && totalStat.visibleScore >= 0 ? 'scale-100 opacity-100' : 'scale-90 opacity-40',
                    )}
                  >
                    {totalStat?.image && (
                      <img
                        className="h-11 w-11 object-contain mobile:h-9 mobile:w-9 phone-landscape:h-8 phone-landscape:w-8"
                        src={totalStat.image.href}
                        alt=""
                      />
                    )}
                    <span className="min-w-12 text-right text-4xl font-black tabular-nums text-amber-950 mobile:text-3xl phone-landscape:text-center phone-landscape:text-3xl">
                      {totalStat && totalStat.visibleScore >= 0 ? totalStat.visibleScore : '—'}
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <footer className="relative flex shrink-0 flex-col items-center gap-2 border-t border-white/20 bg-black/20 px-4 py-3 mobile:py-2 phone-landscape:py-1">
          <Button
            className="phone-landscape:py-1!"
            disabled={!allDone}
            variant={allDone ? 'primary' : 'dismissive'}
            onClick={onNewGame}
          >
            {allDone ? 'Start a New Game' : 'Tallying Scores…'}
          </Button>
        </footer>
      </section>
    </Modal>
  )
}
