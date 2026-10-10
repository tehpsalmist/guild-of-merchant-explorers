import React, { ReactNode, useEffect, useState } from 'react'
import clsx from 'clsx'
import { Modal } from '@8thday/react'
import { ArrowsPointingInIcon, XMarkIcon } from '@heroicons/react/24/outline'
import StarIcon from '@heroicons/react/24/solid/StarIcon'
import { Avatar } from './Avatar'
import { type BoardOption, boards } from './BoardSelectionCards'
import { notifyScoreExchange } from './ScoreExchangeToasts'
import {
  HIGH_SCORE_LIMIT,
  HighScore,
  isSameHighScore,
  mergeHighScoreLists,
  mergeHighScoreRecords,
  useHighScoreRecords,
} from '../hooks/useHighScores'
import type { SharedHighScores } from '../hooks/useScoreExchange'

export interface ScoreComparisonDialogProps {
  share: SharedHighScores
  fromName: string
  fromAvatarUrl?: string
  myAvatarUrl?: string
  onClose(): void
}

const PODIUM_CLASSES = [
  'bg-amber-300 text-amber-950 ring-2 ring-amber-100/70',
  'bg-slate-300 text-slate-900',
  'bg-amber-700 text-amber-50',
]

const summarizeBoard = (board: BoardOption, mine: HighScore[], theirs: HighScore[]) => {
  const merged = mergeHighScoreLists(mine, theirs)

  return {
    board,
    mine,
    theirs,
    merged,
    gained: merged.filter((highScore) => !mine.includes(highScore)),
    bumped: mine.filter((highScore) => !merged.includes(highScore)),
  }
}
type BoardSummary = ReturnType<typeof summarizeBoard>

const average = (scores: HighScore[]) =>
  scores.length ? Math.round(scores.reduce((total, { score }) => total + score, 0) / scores.length) : null

export const ScoreComparisonDialog = ({
  share,
  fromName,
  fromAvatarUrl,
  myAvatarUrl,
  onClose,
}: ScoreComparisonDialogProps) => {
  const records = useHighScoreRecords()
  const [justMerged, setJustMerged] = useState<HighScore[]>([])

  const summaries = boards.map((board) =>
    summarizeBoard(board, records[board.name] ?? [], share.scores[board.name] ?? []),
  )

  const [selectedBoard, setSelectedBoard] = useState(
    () =>
      (
        summaries.find(({ gained }) => gained.length) ??
        summaries.find(({ theirs }) => theirs.length) ??
        summaries[0]
      ).board.name,
  )
  const selected = summaries.find(({ board }) => board.name === selectedBoard) ?? summaries[0]
  const totalGained = summaries.reduce((total, { gained }) => total + gained.length, 0)
  const topScore = Math.max(1, ...selected.mine.map(({ score }) => score), ...selected.theirs.map(({ score }) => score))
  const ranksWon = { mine: 0, theirs: 0 }
  for (let rank = 0; rank < HIGH_SCORE_LIMIT; rank++) {
    const winner = rankWinner(selected.mine[rank], selected.theirs[rank])
    if (winner === 'mine' || winner === 'theirs') ranksWon[winner]++
  }

  useEffect(() => {
    // Capture Escape so whatever dialog is underneath stays open.
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      event.preventDefault()
      event.stopImmediatePropagation()
      onClose()
    }

    window.addEventListener('keydown', closeOnEscape, true)
    return () => window.removeEventListener('keydown', closeOnEscape, true)
  }, [onClose])

  const merge = (targets: BoardSummary[]) => {
    const gained = targets.flatMap((summary) => summary.gained)
    if (!gained.length) return

    mergeHighScoreRecords(Object.fromEntries(targets.map(({ board, theirs }) => [board.name, theirs])))
    setJustMerged(gained)
    notifyScoreExchange(
      `Merged ${gained.length} of ${fromName}'s ${gained.length === 1 ? 'score' : 'scores'}`,
      targets.length === 1
        ? `Your ${targets[0].board.label} chart is updated.`
        : 'Each chart still keeps only its top 10.',
    )
  }

  return (
    <Modal
      portal
      onClose={onClose}
      overlayClasses="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 mobile:p-0 phone-landscape:p-0"
      bgClass="bg-slate-950/90 backdrop-blur-sm"
      className="relative flex max-h-[min(94dvh,62rem)]! w-full max-w-6xl! flex-col overflow-hidden! rounded-3xl! border border-amber-100/20 bg-slate-950! p-0! text-amber-50 shadow-2xl mobile:h-dvh! mobile:max-h-dvh! mobile:rounded-none! phone-landscape:h-dvh! phone-landscape:max-h-dvh! phone-landscape:rounded-none!"
      role="dialog"
      aria-modal="true"
      aria-labelledby="score-comparison-title"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 0% 0%, rgb(252 211 77 / 0.16), transparent 28rem), radial-gradient(circle at 100% 0%, rgb(125 211 252 / 0.16), transparent 28rem)',
        }}
        aria-hidden="true"
      />

      <header className="relative shrink-0 border-b border-amber-100/10 px-4 pb-3 pt-4 sm:px-6 phone-landscape:py-2">
        <button
          type="button"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-amber-100/20 bg-slate-950/70 text-amber-100/70 transition hover:bg-white/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
          onClick={onClose}
          aria-label="Close comparison"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="text-center text-[0.65rem] font-bold uppercase tracking-[0.3em] text-amber-100/50 phone-landscape:hidden">
          Ledger Comparison
        </p>
        <h2 id="score-comparison-title" className="sr-only">
          Your high scores compared with {fromName}'s
        </h2>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-10 sm:gap-5 phone-landscape:mt-0">
          <Contender name="You" avatarUrl={myAvatarUrl} side="mine" />
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-amber-300 via-amber-50 to-sky-300 font-serif text-lg font-black text-slate-950 shadow-[0_0_1.5rem_rgb(252_211_77/0.35)] phone-landscape:h-9 phone-landscape:w-9 phone-landscape:text-sm">
            vs
          </span>
          <Contender name={fromName} avatarUrl={fromAvatarUrl} side="theirs" />
        </div>
      </header>

      <nav
        className="no-scrollbar relative flex shrink-0 gap-2 overflow-x-auto border-b border-amber-100/10 px-4 py-3 sm:px-6 phone-landscape:py-2"
        aria-label="Boards"
      >
        {summaries.map(({ board, mine, theirs, gained }) => {
          const isSelected = board.name === selected.board.name
          const isEmpty = !mine.length && !theirs.length

          return (
            <button
              key={board.name}
              type="button"
              className={clsx(
                'relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border text-left transition focus:outline-none focus:ring-2 focus:ring-amber-200 phone-landscape:h-11',
                isSelected
                  ? 'border-amber-300 ring-2 ring-amber-300/60'
                  : 'border-white/10 opacity-70 hover:opacity-100',
                isEmpty && !isSelected && 'opacity-35',
              )}
              onClick={() => setSelectedBoard(board.name)}
              aria-pressed={isSelected}
            >
              <img
                src={board.image.href}
                alt=""
                className="absolute inset-0 h-full w-full scale-150 object-cover"
                draggable={false}
              />
              <span className="absolute inset-0 bg-linear-to-t from-slate-950/95 via-slate-950/50 to-slate-950/10" />
              <span className="absolute bottom-1.5 left-2 right-2 truncate text-xs font-black text-amber-50">
                {board.label}
              </span>
              {gained.length > 0 && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-emerald-300 px-1.5 py-0.5 text-[0.6rem] font-black text-emerald-950 shadow">
                  +{gained.length}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <section aria-label={`${selected.board.label} head to head`}>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <StatDuel label="Best" mine={selected.mine[0]?.score} theirs={selected.theirs[0]?.score} />
              <StatDuel label="Top 10 avg" mine={average(selected.mine)} theirs={average(selected.theirs)} />
              <StatDuel
                label="Ranks won"
                mine={selected.mine.length || selected.theirs.length ? ranksWon.mine : null}
                theirs={selected.mine.length || selected.theirs.length ? ranksWon.theirs : null}
              />
            </div>

            <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em]">
              <span className="text-right text-amber-200">You</span>
              <span className="text-center text-amber-100/40">Rank</span>
              <span className="truncate text-sky-200">{fromName}</span>
            </div>
            <ol key={selected.board.name} className="flex flex-col gap-1.5">
              {Array.from({ length: HIGH_SCORE_LIMIT }, (_, rank) => {
                const mine = selected.mine[rank]
                const theirs = selected.theirs[rank]
                const winner = rankWinner(mine, theirs)

                return (
                  <li
                    key={rank}
                    className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-center gap-2 motion-safe:animate-score-row-in"
                    style={{ animationDelay: `${rank * 35}ms` }}
                  >
                    <DuelBar
                      side="mine"
                      highScore={mine}
                      topScore={topScore}
                      leading={winner === 'mine'}
                      justMerged={!!mine && justMerged.some((merged) => isSameHighScore(merged, mine))}
                    />
                    <span
                      className={clsx(
                        'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black tabular-nums',
                        PODIUM_CLASSES[rank] ?? 'bg-white/5 text-amber-100/70',
                      )}
                    >
                      {rank + 1}
                    </span>
                    <DuelBar side="theirs" highScore={theirs} topScore={topScore} leading={winner === 'theirs'} />
                  </li>
                )
              })}
            </ol>
          </section>

          <MergePreview summary={selected} fromName={fromName} />
        </div>
      </div>

      <footer className="relative flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-amber-100/10 bg-black/30 px-4 py-3 sm:px-6 phone-landscape:py-2">
        <p className="mr-auto text-xs text-amber-100/50">Only the top 10 per board are kept.</p>
        <button
          type="button"
          className="rounded-xl border border-amber-100/25 px-4 py-2.5 text-sm font-bold text-amber-50 transition enabled:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!totalGained}
          onClick={() => merge(summaries)}
        >
          Merge all boards{totalGained ? ` (+${totalGained})` : ''}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-100/30 bg-[#f5edcf] px-4 py-2.5 text-sm font-black text-slate-900 shadow-lg transition enabled:hover:-translate-y-0.5 enabled:hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!selected.gained.length}
          onClick={() => merge([selected])}
        >
          <ArrowsPointingInIcon className="h-5 w-5" aria-hidden="true" />
          {selected.gained.length
            ? `Merge ${selected.board.label} (+${selected.gained.length})`
            : `${selected.board.label} is up to date`}
        </button>
      </footer>
    </Modal>
  )
}

type RankWinner = 'mine' | 'theirs' | 'tie' | null

function rankWinner(mine?: HighScore, theirs?: HighScore): RankWinner {
  if (!mine && !theirs) return null
  if (!theirs) return 'mine'
  if (!mine) return 'theirs'
  if (mine.score === theirs.score) return 'tie'
  return mine.score > theirs.score ? 'mine' : 'theirs'
}

const Contender = ({ name, avatarUrl, side }: { name: string; avatarUrl?: string; side: 'mine' | 'theirs' }) => (
  <div className={clsx('flex min-w-0 items-center gap-3', side === 'mine' ? 'flex-row-reverse text-right' : 'text-left')}>
    <Avatar
      className={clsx(
        'h-12 w-12 shrink-0 bg-amber-50/10 ring-2 ring-offset-2 ring-offset-slate-950 phone-landscape:h-9 phone-landscape:w-9',
        side === 'mine' ? 'ring-amber-300' : 'ring-sky-300',
      )}
      avatarUrl={avatarUrl}
    />
    <p
      className={clsx(
        'min-w-0 truncate font-serif text-2xl sm:text-3xl phone-landscape:text-xl',
        side === 'mine' ? 'text-amber-100' : 'text-sky-100',
      )}
    >
      {name}
    </p>
  </div>
)

const StatDuel = ({ label, mine, theirs }: { label: string; mine?: number | null; theirs?: number | null }) => {
  const winner = mine == null || theirs == null || mine === theirs ? null : mine > theirs ? 'mine' : 'theirs'

  return (
    <div className="rounded-xl border border-amber-100/10 bg-white/5 px-2 py-2 text-center">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-amber-100/45">{label}</p>
      <p className="mt-0.5 flex items-baseline justify-center gap-1.5 tabular-nums">
        <span className={clsx('text-xl font-black', winner === 'mine' ? 'text-amber-200' : 'text-amber-100/60')}>
          {mine ?? '—'}
        </span>
        <span className="text-[0.6rem] font-bold uppercase text-amber-100/30">vs</span>
        <span className={clsx('text-xl font-black', winner === 'theirs' ? 'text-sky-200' : 'text-sky-100/60')}>
          {theirs ?? '—'}
        </span>
      </p>
    </div>
  )
}

const DuelBar = ({
  side,
  highScore,
  topScore,
  leading,
  justMerged = false,
}: {
  side: 'mine' | 'theirs'
  highScore?: HighScore
  topScore: number
  leading: boolean
  justMerged?: boolean
}) => {
  const mine = side === 'mine'

  if (!highScore) {
    return (
      <div
        className={clsx(
          'flex h-11 items-center rounded-lg border border-dashed border-amber-100/10 px-3 text-xs text-amber-100/25',
          mine ? 'justify-end' : 'justify-start',
        )}
      >
        —
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'relative h-11 overflow-hidden rounded-lg border px-2.5 sm:px-3',
        leading
          ? mine
            ? 'border-amber-300/50 bg-amber-300/10'
            : 'border-sky-300/50 bg-sky-300/10'
          : 'border-white/10 bg-white/5',
        justMerged && 'motion-safe:animate-score-merged',
      )}
    >
      {/* Bars grow outward from the rank column, so the two sides read as a tug-of-war. */}
      <div
        className={clsx(
          'absolute inset-y-0 transition-[width] duration-700 ease-out',
          mine
            ? 'right-0 bg-linear-to-l from-amber-400/50 to-amber-400/5'
            : 'left-0 bg-linear-to-r from-sky-400/50 to-sky-400/5',
        )}
        style={{ width: `${Math.max(4, (highScore.score / topScore) * 100)}%` }}
        aria-hidden="true"
      />
      <div className={clsx('relative flex h-full min-w-0 items-center gap-2', mine && 'flex-row-reverse')}>
        <span className="text-lg font-black tabular-nums text-amber-50">{highScore.score}</span>
        <span className={clsx('min-w-0 grow truncate text-xs', mine ? 'text-right' : 'text-left')}>
          <span className="font-bold text-amber-50/90">{highScore.playerName}</span>
          <span className="hidden text-amber-100/45 sm:inline">
            {' '}
            · {highScore.playerCount === 1 ? 'solo' : `${highScore.playerCount}p`}
          </span>
        </span>
        {leading && (
          <>
            <StarIcon
              className={clsx('h-4 w-4 shrink-0', mine ? 'text-amber-300' : 'text-sky-300')}
              aria-hidden="true"
            />
            <span className="sr-only">Higher score</span>
          </>
        )}
      </div>
    </div>
  )
}

const MergePreview = ({ summary, fromName }: { summary: BoardSummary; fromName: string }) => {
  const { board, theirs, merged, gained, bumped } = summary

  return (
    <section
      className="flex flex-col rounded-2xl border border-amber-100/15 bg-black/30 p-3 sm:p-4"
      aria-labelledby="merge-preview-title"
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-100/45">If you merge</p>
      <h3 id="merge-preview-title" className="font-serif text-xl text-amber-50">
        Your new {board.label} chart
      </h3>
      <p className="mt-1 text-xs text-amber-100/55">
        {!theirs.length
          ? `${fromName} has no ${board.label} scores to offer.`
          : gained.length
            ? `${gained.length} of ${fromName}'s ${gained.length === 1 ? 'score makes' : 'scores make'} the cut.`
            : `Nothing from ${fromName} would make your top 10.`}
      </p>

      {merged.length ? (
        <ol className="mt-3 flex flex-col gap-1">
          {merged.map((highScore, rank) => {
            const isNew = gained.includes(highScore)

            return (
              <MergeRow
                key={rank}
                rank={rank}
                highScore={highScore}
                tag={
                  isNew ? (
                    <span className="rounded-full bg-sky-300 px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wider text-sky-950 shadow-[0_0_0.75rem_rgb(125_211_252/0.5)]">
                      New
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-300/30 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-amber-200/70">
                      Yours
                    </span>
                  )
                }
                className={isNew ? 'border-sky-300/40 bg-sky-300/10' : 'border-white/5 bg-white/5'}
              />
            )
          })}
        </ol>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-amber-100/15 px-3 py-6 text-center text-sm text-amber-50/45">
          No scores on this board yet.
        </p>
      )}

      {bumped.length > 0 && (
        <div className="mt-3 border-t border-red-200/10 pt-3">
          <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-red-200/60">
            Falls off your chart
          </p>
          <ol className="flex flex-col gap-1">
            {bumped.map((highScore, index) => (
              <MergeRow
                key={index}
                highScore={highScore}
                className="border-red-200/10 bg-red-950/20 opacity-70 [&_.score-name]:line-through"
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

const MergeRow = ({
  rank,
  highScore,
  tag,
  className,
}: {
  rank?: number
  highScore: HighScore
  tag?: ReactNode
  className: string
}) => (
  <li className={clsx('flex items-center gap-2 rounded-lg border px-2 py-1.5', className)}>
    <span className="w-6 shrink-0 text-center text-xs font-black tabular-nums text-amber-100/50">
      {rank === undefined ? '—' : rank + 1}
    </span>
    <span className="score-name min-w-0 grow truncate text-sm font-bold text-amber-50">{highScore.playerName}</span>
    {tag}
    <span className="w-10 shrink-0 text-right text-base font-black tabular-nums text-amber-50">{highScore.score}</span>
  </li>
)
