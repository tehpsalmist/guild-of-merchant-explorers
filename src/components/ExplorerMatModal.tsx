import clsx from 'clsx'
import React, { useEffect, useState } from 'react'
import { Modal } from '@8thday/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { explorerCardDataMapping } from '../data/cards/explorer-cards'
import { InvestigateCard } from '../game-logic/Cards'
import type { Player } from '../game-logic/GameState'
import { useGameState } from '../hooks/useGameState'
import { explorerMat } from '../images'
import { InvestigateCardDetail } from './InvestigateCardDetail'

interface ExplorerMatModalProps {
  player: Player
  onClose(): void
}

interface MatSlot {
  id: keyof typeof explorerCardDataMapping
  left: string
  top: string
  width: string
  height: string
}

const MAT_SLOTS: MatSlot[] = [
  { id: 'mountain-1', left: '5.35%', top: '11.15%', width: '15.65%', height: '33.85%' },
  { id: 'sand-2', left: '23.4%', top: '11.15%', width: '15.65%', height: '33.85%' },
  { id: 'grass-2', left: '41.48%', top: '11.15%', width: '15.65%', height: '33.85%' },
  { id: 'wild-2', left: '59.55%', top: '11.15%', width: '15.65%', height: '33.85%' },
  { id: 'water-3', left: '77.64%', top: '11.15%', width: '15.65%', height: '33.85%' },
  { id: 'era-1', left: '13.35%', top: '54.85%', width: '15.6%', height: '33.9%' },
  { id: 'era-2', left: '32.33%', top: '54.85%', width: '15.6%', height: '33.9%' },
  { id: 'era-3', left: '51.47%', top: '54.85%', width: '15.6%', height: '33.9%' },
  { id: 'era-any', left: '70.22%', top: '54.85%', width: '15.6%', height: '33.9%' },
]

const currentEraCardIds = (era: number, turnHistory: ReturnType<typeof useGameState>['gameState']['turnHistory']) =>
  [turnHistory.era1, turnHistory.era2, turnHistory.era3, turnHistory.era4][era] ?? []

export const ExplorerMatModal = ({ player, onClose }: ExplorerMatModalProps) => {
  const { gameState } = useGameState()
  const [detailCard, setDetailCard] = useState<InvestigateCard | null>(null)
  const playedCardIds = new Set(currentEraCardIds(gameState.era, gameState.turnHistory))

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      if (detailCard) setDetailCard(null)
      else onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [detailCard, onClose])

  return (
    <Modal
      className="max-h-none! max-w-none! overflow-visible! rounded-none! bg-transparent! p-0! shadow-none!"
      bgClass="bg-slate-950/85 backdrop-blur-sm"
      overlayClasses="fixed inset-0 z-[80] flex items-center justify-center"
      onClose={onClose}
    >
      <section
        className="relative aspect-1877/1344 overflow-hidden drop-shadow-[0_18px_22px_rgba(0,0,0,0.75)]"
        style={{ height: 'min(94dvh, 68.74dvw, 51.54rem)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explorer-mat-title"
      >
        <h1 id="explorer-mat-title" className="sr-only">
          Explorer Card Mat for {player.id}
        </h1>
        <img src={explorerMat.href} alt="" className="absolute inset-0 h-full w-full" draggable={false} />

        {MAT_SLOTS.map((slot) => {
          const card = explorerCardDataMapping[slot.id]
          const played = playedCardIds.has(slot.id)
          const isCurrent = gameState.currentExplorerCard?.id === slot.id
          const investigateCard = card.isEraCard ? card.getInvestigateCard?.(player) : null

          return (
            <div
              key={slot.id}
              className="absolute flex items-center justify-center"
              style={{ left: slot.left, top: slot.top, width: slot.width, height: slot.height }}
            >
              {played && investigateCard ? (
                <>
                  <InvestigateCardButton
                    card={investigateCard}
                    current={isCurrent}
                    onClick={() => setDetailCard(investigateCard)}
                  />
                  <img
                    src={card.imageUrl.href}
                    alt={`${slot.id} era card`}
                    className="pointer-events-none absolute bottom-[2%] right-[1%] z-10 w-[36%] rounded-[7%] object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.9)]"
                    draggable={false}
                  />
                </>
              ) : played ? (
                <img
                  src={card.imageUrl.href}
                  alt={`${slot.id} explorer card`}
                  className={clsx(
                    'h-full w-full rounded-[7%] object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.85)]',
                    isCurrent && 'ring-4 ring-primary-400 ring-offset-1 ring-offset-slate-900',
                  )}
                  draggable={false}
                />
              ) : investigateCard ? (
                <button
                  type="button"
                  className="absolute bottom-[2%] right-[1%] z-10 w-[45%] rounded-[7%] opacity-70 drop-shadow-[0_3px_3px_rgba(0,0,0,0.8)] transition hover:scale-105 hover:opacity-100 focus:scale-105 focus:opacity-100 focus:outline-none focus:ring-4 focus:ring-primary-400"
                  onClick={() => setDetailCard(investigateCard)}
                  aria-label={`Enlarge ${slot.id} investigate card`}
                >
                  <img src={investigateCard.imageUrl.href} alt="Investigate card preview" className="w-full" />
                </button>
              ) : null}
            </div>
          )
        })}
      </section>

      {!detailCard && <CloseButton label="Close explorer mat" onClick={onClose} />}

      {detailCard && (
        <InvestigateCardDetail card={detailCard} onClose={() => setDetailCard(null)} />
      )}
    </Modal>
  )
}

const InvestigateCardButton = ({
  card,
  current,
  onClick,
}: {
  card: InvestigateCard
  current: boolean
  onClick(): void
}) => (
  <button
    type="button"
    className={clsx(
      'h-full w-full rounded-[7%] drop-shadow-[0_4px_4px_rgba(0,0,0,0.85)] transition hover:scale-[1.02] focus:scale-[1.02] focus:outline-none',
      current ? 'ring-4 ring-primary-400 ring-offset-1 ring-offset-slate-900' : 'focus:ring-4 focus:ring-primary-400',
    )}
    onClick={onClick}
    aria-label="Enlarge investigate card"
  >
    <img src={card.imageUrl.href} alt="Investigate card" className="h-full w-full rounded-[7%] object-contain" />
  </button>
)

const CloseButton = ({ label, onClick }: { label: string; onClick(): void }) => (
  <button
    type="button"
    className="fixed z-90 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/75 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-white/80"
    style={{
      top: 'max(0.5rem, env(safe-area-inset-top))',
      right: 'max(0.5rem, env(safe-area-inset-right))',
    }}
    onClick={onClick}
    aria-label={label}
    title={label}
  >
    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
  </button>
)
