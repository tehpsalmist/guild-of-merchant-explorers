import React, { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { InvestigateCard } from '../game-logic/Cards'

export interface InvestigateCardDetailProps {
  card: InvestigateCard
  onClose(): void
}

export const InvestigateCardDetail = ({ card, onClose }: InvestigateCardDetailProps) => {
  useEffect(() => {
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
    <div
      className="fixed inset-0 z-95 flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Investigate card detail"
    >
      <img
        src={card.imageUrl.href}
        alt="Enlarged investigate card"
        className="max-h-[94dvh] max-w-[94dvw] rounded-[5%] object-contain shadow-2xl ring-1 ring-amber-100/30"
        onClick={(event) => event.stopPropagation()}
      />
      <button
        type="button"
        className="fixed z-100 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/75 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-white/80"
        style={{
          top: 'max(0.5rem, env(safe-area-inset-top))',
          right: 'max(0.5rem, env(safe-area-inset-right))',
        }}
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
        aria-label="Close card detail"
        title="Close"
      >
        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  )
}
