import React from 'react'
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'
import type { TreasureCard } from '../game-logic/Cards'
import { MetadataDialog } from './MetadataDialog'

export interface TreasureCardDialogProps {
  card: TreasureCard
  playerName: string
  onClose(): void
}

export const TreasureCardDialog = ({ card, playerName, onClose }: TreasureCardDialogProps) => (
  <MetadataDialog title="Treasure Discovered" eyebrow="Ruins Explored" onClose={onClose}>
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 p-3 sm:gap-4 sm:p-5 phone-landscape:gap-2 phone-landscape:p-2">
      <div className="relative flex min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-100/20 bg-black/25 p-2 shadow-inner sm:p-4 phone-landscape:p-1.5">
        <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-1/2 -translate-y-1/2 rounded-full bg-amber-200/15 blur-3xl" />
        <img
          src={card.imageUrl.href}
          alt="Drawn treasure card"
          className="relative block h-auto max-h-full w-auto max-w-full rounded-[3.5%] object-contain shadow-2xl ring-1 ring-black/30"
          draggable={false}
        />
      </div>

      <footer className="flex shrink-0 flex-col items-stretch gap-3 rounded-2xl border border-amber-100/20 bg-slate-950/45 px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between phone-landscape:flex-row phone-landscape:items-center phone-landscape:gap-2 phone-landscape:px-3 phone-landscape:py-2">
        <div className="flex min-w-0 items-center gap-3 phone-landscape:gap-2">
          {card.discard ? (
            <SparklesIcon className="h-8 w-8 shrink-0 text-amber-200 phone-landscape:h-6 phone-landscape:w-6" aria-hidden="true" />
          ) : (
            <CheckCircleIcon className="h-8 w-8 shrink-0 text-emerald-300 phone-landscape:h-6 phone-landscape:w-6" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="truncate font-serif text-lg text-amber-50 phone-landscape:text-base">{playerName}</p>
            <p className="text-sm text-amber-50/70 phone-landscape:text-xs">
              {card.discard ? 'This treasure takes effect immediately.' : 'This treasure was added to your collection.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="shrink-0 rounded-xl border border-amber-100/30 bg-[#f5edcf] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-slate-900 shadow transition hover:-translate-y-0.5 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 phone-landscape:px-4 phone-landscape:py-2"
          onClick={onClose}
        >
          Continue
        </button>
      </footer>
    </div>
  </MetadataDialog>
)
