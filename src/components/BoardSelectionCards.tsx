import React, { useState } from 'react'
import clsx from 'clsx'
import { CheckIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Modal } from '@8thday/react'
import type { BoardName } from '../game-logic/GameState'
import { aghonBoard, aveniaBoard, cnidariaBoard, kazanBoard, northProyliaBoard, xawskilBaseBoard } from '../images'

export interface BoardOption {
  name: BoardName
  label: string
  image: URL
}

export const boards: BoardOption[] = [
  { name: 'aghon', label: 'Aghon', image: aghonBoard },
  { name: 'avenia', label: 'Avenia', image: aveniaBoard },
  { name: 'kazan', label: 'Kazan', image: kazanBoard },
  { name: 'cnidaria', label: 'Cnidaria', image: cnidariaBoard },
  { name: 'northProylia', label: 'North Proylia', image: northProyliaBoard },
  { name: 'xawskil', label: 'Xawskil', image: xawskilBaseBoard },
]

interface BoardSelectionCardsProps {
  value: BoardName | ''
  onChange(board: BoardName): void
  canSelect?: boolean
  className?: string
}

export const BoardSelectionCards = ({
  value,
  onChange,
  canSelect = true,
  className = 'grid grid-cols-1 gap-3 @xl:grid-cols-2 @3xl:grid-cols-3',
}: BoardSelectionCardsProps) => {
  const [previewedBoard, setPreviewedBoard] = useState<BoardOption>()

  return (
    <>
      <div className={className} role="group" aria-label={canSelect ? 'Choose a board' : 'Available boards'}>
        {boards.map((board) => {
          const selected = value === board.name

          return (
            <article
              className={clsx(
                'group relative overflow-hidden rounded-xl border bg-slate-900/70 text-left shadow-lg transition duration-200',
                selected ? 'border-amber-300 ring-2 ring-amber-300/70' : 'border-white/15',
              )}
              key={board.name}
            >
              <button
                type="button"
                disabled={!canSelect}
                className={clsx(
                  'block w-full text-left focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-inset',
                  canSelect && 'hover:-translate-y-0.5 hover:border-amber-100/50',
                )}
                onClick={() => onChange(board.name)}
                aria-pressed={selected}
                aria-label={`Select ${board.label}`}
              >
                <span className="block aspect-square overflow-hidden bg-black/30">
                  <img
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    src={board.image.href}
                    alt={`${board.label} game board`}
                    loading="lazy"
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
              <button
                type="button"
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-amber-100/30 bg-slate-950/85 text-amber-50 shadow-lg backdrop-blur-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-200"
                onClick={() => setPreviewedBoard(board)}
                aria-label={`Preview ${board.label} board`}
                title={`Preview ${board.label}`}
              >
                <EyeIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </article>
          )
        })}
      </div>
      {previewedBoard && <BoardPreviewDialog board={previewedBoard} onClose={() => setPreviewedBoard(undefined)} />}
    </>
  )
}

const BoardPreviewDialog = ({ board, onClose }: { board: BoardOption; onClose(): void }) => (
  <Modal
    portal
    onClose={onClose}
    overlayClasses="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
    bgClass="bg-slate-950/90 backdrop-blur-sm"
    className="h-[min(90dvh,58rem)]! w-[min(96dvw,80rem)]! max-w-none! overflow-hidden! rounded-2xl! border border-amber-100/25 bg-slate-950! p-0! text-amber-50 shadow-2xl"
    role="dialog"
    aria-modal="true"
    aria-labelledby="board-preview-title"
  >
    <header className="flex items-center gap-3 border-b border-amber-100/15 px-4 py-3 sm:px-5">
      <div className="min-w-0 grow">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-amber-100/50">Board preview</p>
        <h2 className="font-serif text-2xl text-amber-50" id="board-preview-title">{board.label}</h2>
      </div>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-100/20 text-amber-100/70 transition hover:bg-white/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
        onClick={onClose}
        aria-label={`Close ${board.label} preview`}
      >
        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </header>
    <div className="h-[calc(100%-4.75rem)] overflow-auto bg-black/40 p-3 sm:p-5">
      <img className="max-w-none" src={board.image.href} alt={`${board.label} game board`} draggable={false} />
    </div>
  </Modal>
)
