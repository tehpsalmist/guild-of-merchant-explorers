import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Modal } from '@8thday/react'
import { ChevronDownIcon, TrophyIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { BoardName } from '../game-logic/GameState'
import type { BoardOption } from './BoardSelectionCards'
import { objectives } from '../data/objectives'
import { investigateCardDataLookup } from '../data/cards/investigate-cards'
import { coinImage } from '../images'
import { HighScore, isSameHighScore, useHighScores } from '../hooks/useHighScores'

const PODIUM_CLASSES = [
  'bg-amber-300 text-amber-950 ring-2 ring-amber-100/70',
  'bg-slate-300 text-slate-900',
  'bg-amber-700 text-amber-50',
]

export interface HighScoreListProps {
  boardName: BoardName
  /** Scores from the game being viewed, called out wherever they landed on the chart. */
  highlightedScores?: HighScore[]
  className?: string
}

export const HighScoreList = ({ boardName, highlightedScores = [], className }: HighScoreListProps) => {
  const highScores = useHighScores(boardName)
  const [expandedRank, setExpandedRank] = useState<number | null>(null)

  if (!highScores.length) {
    return (
      <p
        className={clsx(
          'rounded-xl border border-dashed border-amber-100/20 bg-black/15 px-4 py-6 text-center text-sm text-amber-50/60',
          className,
        )}
      >
        No high scores on this board yet. Finish a game to claim the top spot.
      </p>
    )
  }

  return (
    <ol className={clsx('flex flex-col gap-2', className)}>
      {highScores.map((highScore, rank) => {
        const expanded = expandedRank === rank
        const highlighted = highlightedScores.some((candidate) => isSameHighScore(candidate, highScore))
        const detailsId = `high-score-${boardName}-${rank}`

        return (
          <li
            key={rank}
            className={clsx(
              'overflow-hidden rounded-xl border shadow',
              highlighted
                ? 'border-emerald-300/80 bg-emerald-950/50 ring-1 ring-emerald-300/50'
                : 'border-amber-100/15 bg-slate-900/60',
            )}
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-200"
              aria-expanded={expanded}
              aria-controls={detailsId}
              onClick={() => setExpandedRank(expanded ? null : rank)}
            >
              <span
                className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums',
                  PODIUM_CLASSES[rank] ?? 'bg-black/30 text-amber-100/80',
                )}
              >
                <span className="sr-only">Rank </span>
                {rank + 1}
              </span>
              <span className="min-w-0 grow">
                <span className="block truncate font-bold text-amber-50">{highScore.playerName}</span>
                <span className="block text-xs text-amber-100/60">
                  {highScore.playerCount === 1 ? 'Solo' : `${highScore.playerCount} players`}
                  {highlighted && (
                    <span className="ml-2 font-bold uppercase tracking-wider text-emerald-200">This game</span>
                  )}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-2xl font-black tabular-nums text-amber-50">
                {highScore.score}
                <img src={coinImage.href} alt="coins" className="h-6 w-6 object-contain" />
              </span>
              <ChevronDownIcon
                className={clsx('h-5 w-5 shrink-0 text-amber-100/60 transition', expanded && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
            {expanded && <HighScoreCards id={detailsId} boardName={boardName} highScore={highScore} />}
          </li>
        )
      })}
    </ol>
  )
}

const HighScoreCards = ({ id, boardName, highScore }: { id: string; boardName: BoardName; highScore: HighScore }) => {
  const objectiveCards = highScore.objectiveIds.flatMap(
    (objectiveId) => objectives[boardName].find((objective) => objective.id === objectiveId) ?? [],
  )
  const investigateCards = highScore.investigateCardIds.flatMap((cardId) => investigateCardDataLookup[cardId] ?? [])

  return (
    <div id={id} className="flex flex-col gap-3 border-t border-amber-100/10 bg-black/20 p-3">
      <section>
        <h3 className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-100/55">Objectives</h3>
        <div className="grid grid-cols-3 gap-2">
          {objectiveCards.map((objective, position) => (
            <img
              key={objective.id}
              src={objective.imageUrl.href}
              alt={`Objective ${position + 1}`}
              className="w-full rounded-[3%] shadow-lg"
              loading="lazy"
              draggable={false}
            />
          ))}
        </div>
      </section>
      <section>
        <h3 className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-100/55">
          Investigate Cards
        </h3>
        {investigateCards.length ? (
          <div className="grid max-w-sm grid-cols-3 gap-2">
            {investigateCards.map((card) => (
              <img
                key={card.id}
                src={card.imageUrl.href}
                alt="Investigate card"
                className="w-full rounded-[5%] shadow-lg"
                loading="lazy"
                draggable={false}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-amber-50/60">No investigate cards were kept.</p>
        )}
      </section>
    </div>
  )
}

export interface HighScoresDialogProps {
  board: BoardOption
  highlightedScores?: HighScore[]
  onClose(): void
}

export const HighScoresDialog = ({ board, highlightedScores, onClose }: HighScoresDialogProps) => {
  useEffect(() => {
    // Capture Escape so a dialog underneath (like the scoreboard) stays open.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      event.preventDefault()
      event.stopImmediatePropagation()
      onClose()
    }

    window.addEventListener('keydown', closeOnEscape, true)
    return () => window.removeEventListener('keydown', closeOnEscape, true)
  }, [onClose])

  return (
    <Modal
      portal
      onClose={onClose}
      overlayClasses="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6"
      bgClass="bg-slate-950/90 backdrop-blur-sm"
      className="flex max-h-[min(90dvh,48rem)]! w-full max-w-2xl! flex-col overflow-hidden! rounded-2xl! border border-amber-100/25 bg-slate-950! p-0! text-amber-50 shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="high-scores-title"
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-amber-100/15 px-4 py-3 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
          <TrophyIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 grow">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-amber-100/50">{board.label}</p>
          <h2 className="font-serif text-2xl text-amber-50" id="high-scores-title">
            High Scores
          </h2>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-100/20 text-amber-100/70 transition hover:bg-white/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
          onClick={onClose}
          aria-label={`Close ${board.label} high scores`}
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        <HighScoreList boardName={board.name} highlightedScores={highlightedScores} />
      </div>
    </Modal>
  )
}
