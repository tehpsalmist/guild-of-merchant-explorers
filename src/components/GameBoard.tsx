import clsx from 'clsx'
import React, { ComponentProps, useEffect, useState } from 'react'
import { useGameState } from '../hooks/useGameState'
import { ExplorerMap } from './ExplorerMap'
import { toast, useEventListener } from '@8thday/react'
import UTurnIcon from '@heroicons/react/24/solid/ArrowUturnLeftIcon'
import { EraLabel } from './EraLabel'
import { ScoreBoardModal } from './ScoreBoardModal'
import { GameMetadata } from './GameMetadata'
import type { InvestigateCard, TreasureCard } from '../game-logic/Cards'
import type { Player } from '../game-logic/GameState'
import { MetadataDialog } from './MetadataDialog'
import { TreasureCardDialog } from './TreasureCardDialog'

export interface GameBoardProps extends ComponentProps<'main'> {}

interface GameActionButtonProps extends Omit<ComponentProps<'button'>, 'children'> {
  label: string
  icon?: React.ReactNode
  highlighted?: boolean
}

const GameActionButton = ({ label, icon, highlighted = false, className, ...props }: GameActionButtonProps) => (
  <button
    {...props}
    type="button"
    className={clsx(
      'group flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-1 text-white shadow-lg backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-white/80',
      highlighted
        ? 'bg-primary-600/90 ring-2 ring-primary-200 hover:bg-primary-500'
        : 'bg-slate-900/55 hover:bg-slate-900/75',
      className,
    )}
    aria-label={props['aria-label'] ?? label}
    title={props.title ?? label}
  >
    {icon ?? (
      <span
        className="flex flex-col items-center justify-center text-[0.58rem] font-black uppercase leading-[0.68rem] tracking-tight"
        aria-hidden="true"
      >
        {label.split(' ').map((word, position) => (
          <span key={`${word}-${position}`}>{word}</span>
        ))}
      </span>
    )}
  </button>
)

const InvestigateActionIcon = ({ cards }: { cards: Array<{ id: string; imageUrl: URL }> }) => (
  <span className="relative block h-9 w-9" aria-hidden="true">
    {cards.slice(0, 3).map((card, position, visibleCards) => {
      const fanPosition = visibleCards.length === 1 ? 0 : (position / (visibleCards.length - 1)) * 2 - 1

      return (
        <img
          key={card.id}
          src={card.imageUrl.href}
          alt=""
          className="absolute bottom-0 h-8 w-auto rounded-[6%] object-contain drop-shadow"
          style={{
            left: `${50 + fanPosition * 18}%`,
            zIndex: position + 1,
            rotate: `${fanPosition * 12}deg`,
            translate: '-50% 0',
            transformOrigin: '50% 90%',
          }}
          draggable={false}
        />
      )
    })}
  </span>
)

export const GameBoard = ({ className = '', ...props }: GameBoardProps) => {
  const [investigateModalOpen, setInvestigateModalOpen] = useState(false)
  const [newTreasureCard, setNewTreasureCard] = useState<{
    card: TreasureCard
    playerName: string
  } | null>(null)
  const [userPromptOpen, setUserPromptOpen] = useState(false)
  const [scoreBoardOpen, setScoreBoardOpen] = useState(false)
  const [viewedPlayerId, setViewedPlayerId] = useState<string>()
  const updateState = useState(0)[1]

  const { gameState, resetGame } = useGameState()
  const viewedPlayer = gameState.players.find((player) => player.id === viewedPlayerId) ?? gameState.activePlayer
  const isInvestigateChoice = ['choosing-investigate-card', 'choosing-investigate-card-reuse'].includes(
    gameState.activePlayer.mode,
  )
  const isPlayerChoice = ['user-prompting', 'treasure-to-draw'].includes(gameState.activePlayer.mode)

  useEventListener('keydown', (e) => {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      gameState.activePlayer.selectUndo()
    }
  })

  useEffect(() => {
    const stateListener = () => updateState((s) => ++s)
    const serializationListener = (e: CustomEvent<{ serializedData: string }>) => {
      localStorage.setItem('gome-serialized-game-state', e.detail.serializedData)
    }

    gameState.addEventListener('onstatechange', stateListener)
    gameState.addEventListener('onserialize', { handleEvent: serializationListener })

    return () => {
      gameState.removeEventListener('onstatechange', stateListener)
      gameState.removeEventListener('onserialize', { handleEvent: serializationListener })
    }
  }, [gameState])

  useEffect(() => {
    setViewedPlayerId(gameState.activePlayer.id)
  }, [gameState.activePlayer.id])

  const viewNextPlayer = () => {
    const currentIndex = gameState.players.indexOf(viewedPlayer)
    const nextPlayer = gameState.players[(currentIndex + 1) % gameState.players.length]

    if (nextPlayer) setViewedPlayerId(nextPlayer.id)
  }

  useEffect(() => {
    const activePlayer = gameState.activePlayer
    const treasureListener = () => {
      const drawnTreasure = activePlayer.treasureCards.cards[activePlayer.treasureCards.size - 1]

      if (drawnTreasure) {
        setNewTreasureCard({
          card: drawnTreasure.card,
          playerName: activePlayer.id,
        })
      }
    }
    activePlayer.addEventListener('treasure-gained', treasureListener)

    return () => activePlayer.removeEventListener('treasure-gained', treasureListener)
  }, [gameState.activePlayer])

  useEffect(() => {
    if (newTreasureCard) {
      setUserPromptOpen(false)
      setInvestigateModalOpen(false)
      return
    }

    if (gameState.gameOver) {
      setScoreBoardOpen(true)
      return
    }

    if (isInvestigateChoice) {
      setUserPromptOpen(false)
      setInvestigateModalOpen(true)
      return
    }

    if (isPlayerChoice) {
      setInvestigateModalOpen(false)
      setUserPromptOpen(true)
    }
  }, [gameState.gameOver, isInvestigateChoice, isPlayerChoice, newTreasureCard])

  const isEndOfPhase =
    gameState.activePlayer.moveHistory.getPlacedHexes()[gameState.activePlayer.cardPhase]?.size ===
    gameState.activePlayer.currentCardRules?.[gameState.activePlayer.cardPhase]?.limit
  const noLegalMoves = isEndOfPhase || gameState.activePlayer.board.getFlatHexes().every((h) => !h.isExplorable())
  const investigateActionCards =
    (gameState.era < 3
      ? gameState.activePlayer.investigateCardCandidates
      : gameState.activePlayer.investigateCards.keptCards) ?? []

  return (
    <>
      <GameMetadata viewedPlayer={viewedPlayer} />
      <div className="fixed bottom-2 left-2 landscape:left-[4.5rem] z-[65] flex max-w-[calc(100dvw-5rem)] flex-wrap gap-2 landscape:max-w-[calc(100dvw-10rem)]">
        {isInvestigateChoice && (
          <GameActionButton
            label="Choose Investigate Card"
            highlighted
            icon={<InvestigateActionIcon cards={investigateActionCards} />}
            onClick={() => setInvestigateModalOpen(true)}
          />
        )}
        {gameState.activePlayer.mode === 'exploring' &&
          gameState.activePlayer.currentCardRules &&
          (!gameState.currentExplorerCard ||
            (gameState.activePlayer.currentCardRules?.length ?? 1) - 1 === gameState.activePlayer.cardPhase) && (
            <GameActionButton
              label={gameState.soloMode ? 'Next Card' : 'End Turn'}
              highlighted={noLegalMoves}
              onClick={() => {
                if (
                  noLegalMoves ||
                  confirm('There are legal moves left on the board, are you sure you want to end your turn?')
                ) {
                  gameState.activePlayer.selectMove({ action: 'confirm-turn' })
                }
              }}
            />
          )}
        {gameState.activePlayer.mode === 'exploring' &&
          gameState.activePlayer.currentCardRules &&
          (gameState.activePlayer.currentCardRules?.length ?? 1) - 1 !== gameState.activePlayer.cardPhase && (
            <GameActionButton
              label="Next Phase"
              highlighted={isEndOfPhase}
              onClick={() => gameState.activePlayer.selectMove({ action: 'advance-card-phase' })}
            />
          )}
        {gameState.gameOver && (
          <GameActionButton label="Score Board" highlighted onClick={() => setScoreBoardOpen(true)} />
        )}
        {!userPromptOpen && isPlayerChoice && !newTreasureCard && (
          <GameActionButton label="View Choices" highlighted onClick={() => setUserPromptOpen(true)} />
        )}
        {gameState.activePlayer.moveHistory.size > 0 && (
          <GameActionButton
            label="Undo"
            icon={<UTurnIcon className="h-7 w-7" aria-hidden="true" />}
            onClick={() => gameState.activePlayer.selectUndo()}
          />
        )}
      </div>
      <EraLabel
        className="pointer-events-none fixed bottom-2 right-2 z-50 flex opacity-80"
        aria-label={`Era ${gameState.era + 1}`}
      />
      <main className={`${className} game-board-grid relative w-full`} {...props}>
        <ExplorerMap
          key={viewedPlayer.id}
          player={viewedPlayer}
          isActive={viewedPlayer === gameState.activePlayer}
          onViewNextPlayer={gameState.players.length > 1 ? viewNextPlayer : undefined}
        />
      </main>
      {isPlayerChoice && userPromptOpen && !newTreasureCard && (
        <PlayerChoicesDialog
          player={gameState.activePlayer}
          onClose={() => setUserPromptOpen(false)}
          onDrawTreasure={() => {
            const [treasureCard] = gameState.treasureDeck.drawCards()

            if (!treasureCard) return

            setUserPromptOpen(false)
            if (treasureCard.discard) gameState.treasureDeck.discard(treasureCard)

            gameState.activePlayer.selectMove({ action: 'draw-treasure', treasureCard })
          }}
          onTrade={() => {
            setUserPromptOpen(false)
            gameState.activePlayer.setMode(
              gameState.activePlayer.connectedTradePosts.length === 2 ? 'trading' : 'choosing-trade-route',
            )
          }}
          onPlaceVillage={() => {
            setUserPromptOpen(false)
            gameState.activePlayer.setMode('choosing-village')
          }}
          onUndo={() => {
            setUserPromptOpen(false)
            gameState.activePlayer.selectUndo()
          }}
        />
      )}
      {(isInvestigateChoice || gameState.activePlayer.mode === '') && investigateModalOpen && !newTreasureCard && (
        <InvestigateChoiceDialog
          era={gameState.era}
          playerName={gameState.activePlayer.id}
          cards={
            (gameState.era < 3
              ? gameState.activePlayer.investigateCardCandidates
              : gameState.activePlayer.investigateCards.keptCards) ?? []
          }
          onClose={() => setInvestigateModalOpen(false)}
          onSelect={(candidate, index, cards) => {
            if (gameState.era < 3) {
              const discardedCard = cards.find((card) => card !== candidate)
              if (!discardedCard) {
                return toast.error({
                  message: 'Error choosing Investigate Card',
                  description: 'Please refresh the browser and try again.',
                })
              }
              setInvestigateModalOpen(false)
              gameState.activePlayer.selectMove({
                action: 'choose-investigate-card',
                chosenCard: candidate,
                discardedCard,
              })
            } else {
              setInvestigateModalOpen(false)
              gameState.activePlayer.selectMove({ action: 'choose-investigate-card-reuse', era: index })
            }
          }}
        />
      )}
      {newTreasureCard && (
        <TreasureCardDialog
          card={newTreasureCard.card}
          playerName={newTreasureCard.playerName}
          onClose={() => setNewTreasureCard(null)}
        />
      )}
      {gameState.gameOver && scoreBoardOpen && !newTreasureCard && (
        <ScoreBoardModal onClose={() => setScoreBoardOpen(false)} onNewGame={resetGame} />
      )}
    </>
  )
}

interface PlayerChoicesDialogProps {
  player: Player
  onClose(): void
  onDrawTreasure(): void
  onTrade(): void
  onPlaceVillage(): void
  onUndo(): void
}

const PlayerChoicesDialog = ({
  player,
  onClose,
  onDrawTreasure,
  onTrade,
  onPlaceVillage,
  onUndo,
}: PlayerChoicesDialogProps) => (
  <MetadataDialog title="Choose Your Next Move" eyebrow={`${player.id}'s Turn`} onClose={onClose}>
    <div className="flex h-full items-center justify-center overflow-y-auto p-4 sm:p-6 phone-landscape:p-3">
      <div className="w-full max-w-xl rounded-2xl border border-amber-100/20 bg-black/25 p-3 shadow-xl sm:p-4 phone-landscape:p-2">
        <div className="grid gap-2.5 sm:grid-cols-2 phone-landscape:grid-cols-2 phone-landscape:gap-2">
          {player.treasureCardsToDraw > 0 && (
            <PlayerChoiceButton
              title="Draw Treasure"
              detail="Drawing a treasure card cannot be undone."
              onClick={onDrawTreasure}
              highlighted
            />
          )}
          {player.connectedTradePosts.length > 1 && <PlayerChoiceButton title="Trade" onClick={onTrade} />}
          {player.regionForVillage && <PlayerChoiceButton title="Place Village" onClick={onPlaceVillage} />}
          {player.moveHistory.currentMoves.length > 0 && (
            <PlayerChoiceButton
              title="Undo"
              detail="Reverse your last decision."
              onClick={onUndo}
              destructive={player.treasureCardsToDraw > 0}
            />
          )}
        </div>
      </div>
    </div>
  </MetadataDialog>
)

const PlayerChoiceButton = ({
  title,
  detail,
  highlighted = false,
  destructive = false,
  onClick,
}: {
  title: string
  detail?: string
  highlighted?: boolean
  destructive?: boolean
  onClick(): void
}) => (
  <button
    type="button"
    className={clsx(
      'min-h-20 rounded-xl border p-4 text-left shadow transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 phone-landscape:min-h-14 phone-landscape:p-3',
      highlighted
        ? 'border-primary-200/60 bg-primary-600/90 text-white hover:bg-primary-500 focus:ring-primary-100'
        : destructive
          ? 'border-red-200/30 bg-red-950/65 text-red-50 hover:bg-red-900/75 focus:ring-red-200'
          : 'border-amber-100/25 bg-[#f5edcf]/95 text-slate-900 hover:bg-amber-50 focus:ring-amber-200',
    )}
    onClick={onClick}
  >
    <span className="block text-lg font-black phone-landscape:text-base">{title}</span>
    {detail && (
      <span
        className={clsx(
          'mt-0.5 block text-sm phone-landscape:text-xs',
          highlighted ? 'text-primary-50/90' : destructive ? 'text-red-100/75' : 'text-slate-600',
        )}
      >
        {detail}
      </span>
    )}
  </button>
)

interface InvestigateChoiceDialogProps {
  era: number
  playerName: string
  cards: InvestigateCard[]
  onClose(): void
  onSelect(card: InvestigateCard, index: number, cards: InvestigateCard[]): void
}

const InvestigateChoiceDialog = ({ era, playerName, cards, onClose, onSelect }: InvestigateChoiceDialogProps) => (
  <MetadataDialog
    title="Choose an Investigate Card"
    eyebrow={`${playerName} · Era ${era > 2 ? 'IV' : 'I'.repeat(era + 1)}`}
    onClose={onClose}
  >
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 p-3 sm:gap-4 sm:p-5 phone-landscape:gap-1.5 phone-landscape:p-2">
      <p className="text-center text-sm text-amber-50/75 phone-landscape:text-xs">Select a card to continue.</p>
      <div
        className={clsx(
          'grid min-h-0 grid-cols-2 place-items-center gap-3 phone-landscape:gap-2',
          cards.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        )}
      >
        {cards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            className="group flex h-full min-h-0 w-full items-center justify-center rounded-[5%] focus:outline-none focus:ring-4 focus:ring-primary-300"
            onClick={() => onSelect(card, index, cards)}
            aria-label={`Choose investigate card ${index + 1}`}
          >
            <img
              src={card.imageUrl.href}
              alt="Investigate card"
              className="h-auto max-h-full w-auto max-w-full rounded-[5%] object-contain shadow-2xl transition group-hover:scale-[1.02] group-focus:scale-[1.02]"
            />
          </button>
        ))}
      </div>
    </div>
  </MetadataDialog>
)
