import React, { ComponentProps, useEffect, useState } from 'react'
import { useGameState } from '../hooks/useGameState'
import { ExplorerMap } from './ExplorerMap'
import { Button, Modal, toast, useEventListener } from '@8thday/react'
import ChevronRightIcon from '@heroicons/react/24/solid/ChevronRightIcon'
import ChevronLeftIcon from '@heroicons/react/24/solid/ChevronLeftIcon'
import UTurnIcon from '@heroicons/react/24/solid/ArrowUturnLeftIcon'
import clsx from 'clsx'
import { coinImage, placeBlock, plankPanelHorizontal, treasureChestImage } from '../images'
import { audioTools, uiWoodCloseSound, uiWoodOpenSound } from '../audio'
import { EraLabel } from './EraLabel'
import { ExplorerCardMat } from './ExplorerCardMat'
import { ObjectiveCards } from './ObjectiveCards'
import { PlayerMessage } from './PlayerMessage'

export interface GameBoardProps extends ComponentProps<'main'> {}

export const GameBoard = ({ className = '', ...props }: GameBoardProps) => {
  const [sideBarOpen, setSideBarOpen] = useState(false)
  const [investigateModalOpen, setInvestigateModalOpen] = useState(false)
  const [newTreasureCard, setNewTreasureCard] = useState(false)
  const [userPromptOpen, setUserPromptOpen] = useState(false)
  const [viewedPlayerId, setViewedPlayerId] = useState<string>()
  const updateState = useState(0)[1]

  const { gameState, resetGame } = useGameState()
  const viewedPlayer = gameState.players.find((player) => player.id === viewedPlayerId) ?? gameState.activePlayer

  const treasureCards = gameState.activePlayer.treasureCards.keptCards.filter((c) => c.type !== 'jarMultiplier')
  const treasureJars = gameState.activePlayer.treasureCards.keptCards.filter((c) => c.type === 'jarMultiplier')

  const investigateCard = gameState.currentExplorerCard?.isEraCard
    ? gameState.currentExplorerCard.getInvestigateCard?.(gameState.activePlayer)
    : null

  useEventListener('keydown', (e) => {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      gameState.activePlayer.selectUndo()
    }
    if (e.key === 'd') {
      toggleSideBar()
    }
  })

  function toggleSideBar() {
    setSideBarOpen((o) => !o)
    if (sideBarOpen) {
      audioTools.play(uiWoodCloseSound)
    } else {
      audioTools.play(uiWoodOpenSound)
    }
  }

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
    const treasureListener = () => setNewTreasureCard(true)
    gameState.activePlayer.addEventListener('treasure-gained', treasureListener)

    return () => gameState.activePlayer.removeEventListener('treasure-gained', treasureListener)
  }, [gameState.activePlayer])

  useEffect(() => {
    if (gameState.gameOver) {
      setUserPromptOpen(true)
    }

    switch (gameState.activePlayer.mode) {
      case 'choosing-investigate-card':
      case 'choosing-investigate-card-reuse':
        return setInvestigateModalOpen(true)
      case 'user-prompting':
      case 'treasure-to-draw':
        return setUserPromptOpen(true)
    }
  }, [gameState.activePlayer.mode, gameState.gameOver])

  const isEndOfPhase =
    gameState.activePlayer.moveHistory.getPlacedHexes()[gameState.activePlayer.cardPhase]?.size ===
    gameState.activePlayer.currentCardRules?.[gameState.activePlayer.cardPhase]?.limit
  const noLegalMoves = isEndOfPhase || gameState.activePlayer.board.getFlatHexes().every((h) => !h.isExplorable())

  return (
    <>
      <div className="fixed top-0 z-30 h-16 w-full">
        <ObjectiveCards />
      </div>
      <div
        className="fixed top-0 z-40 h-16 w-full px-4"
        style={{ backgroundImage: `url(${plankPanelHorizontal.href})` }}
      >
        <div className="grid h-full grid-cols-[1fr,auto,1fr] grid-rows-1">
          <div className="flex h-16 items-center py-0.5">
            <EraLabel className="mr-4" />
            {gameState.currentExplorerCard && (
              <button className="mx-4 flex h-full" onClick={() => toggleSideBar()}>
                {!investigateCard && (
                  <img
                    className="max-h-full max-w-12 rounded border-2 border-transparent"
                    src={gameState.currentExplorerCard.imageUrl.href}
                  />
                )}
                {investigateCard && (
                  <img
                    className="max-h-full max-w-12 rounded border-2 border-primary-400"
                    src={investigateCard.imageUrl.href}
                  />
                )}
                {gameState.activePlayer.mode === 'free-exploring' && (
                  <img className="max-h-full max-w-32 rounded border-2 border-primary-400" src={placeBlock.href} />
                )}
              </button>
            )}
            {(gameState.activePlayer.mode === 'choosing-investigate-card' ||
              gameState.activePlayer.mode === 'choosing-investigate-card-reuse') && (
              <button
                className="flex-center mr-4 h-full gap-4 rounded border-2 border-primary-400"
                onClick={() => setInvestigateModalOpen(true)}
              >
                {(gameState.era < 3
                  ? gameState.activePlayer.investigateCardCandidates
                  : gameState.activePlayer.investigateCards.keptCards
                )?.map((candidate) => (
                  <img
                    key={candidate.id}
                    className="-z-10 max-h-full max-w-12"
                    src={candidate.imageUrl.href}
                    alt="Investigate Card"
                  />
                ))}
              </button>
            )}
            {gameState.activePlayer.mode === 'exploring' &&
              gameState.activePlayer.currentCardRules &&
              (!gameState.currentExplorerCard ||
                (gameState.activePlayer.currentCardRules?.length ?? 1) - 1 === gameState.activePlayer.cardPhase) && (
                <Button
                  className="mr-4 whitespace-nowrap"
                  variant={noLegalMoves ? 'primary' : 'dismissive'}
                  onClick={() => {
                    if (
                      noLegalMoves ||
                      confirm('There are legal moves left on the board, are you sure you want to end your turn?')
                    ) {
                      gameState.activePlayer.selectMove({ action: 'confirm-turn' })
                    }
                  }}
                >
                  {gameState.soloMode ? 'Next Card' : 'End Turn'}
                </Button>
              )}
            {gameState.activePlayer.mode === 'exploring' &&
              gameState.activePlayer.currentCardRules &&
              (gameState.activePlayer.currentCardRules?.length ?? 1) - 1 !== gameState.activePlayer.cardPhase && (
                <Button
                  className="mr-4 whitespace-nowrap"
                  variant={isEndOfPhase ? 'primary' : 'dismissive'}
                  onClick={() => gameState.activePlayer.selectMove({ action: 'advance-card-phase' })}
                >
                  Next Phase
                </Button>
              )}
            {gameState.gameOver && (
              <Button className="mr-4 whitespace-nowrap" variant="primary" onClick={() => setUserPromptOpen(true)}>
                Score Board
              </Button>
            )}
            {!userPromptOpen && ['user-prompting', 'treasure-to-draw'].includes(gameState.activePlayer.mode) && (
              <Button className="mr-2" variant="primary" onClick={() => setUserPromptOpen(true)}>
                View Choices
              </Button>
            )}
            {gameState.activePlayer.moveHistory.size > 0 && (
              <Button
                className="mr-4"
                variant="dismissive"
                PreIcon={UTurnIcon}
                onClick={() => gameState.activePlayer.selectUndo()}
              >
                Undo
              </Button>
            )}
          </div>
          <ExplorerCardMat />
          <div className="flex justify-end gap-2">
            <img className="max-h-16 max-w-32" src={coinImage.href} alt="coin" />
            <span className="text-6xl font-bold leading-[1em] text-primary-500 shadow-white text-shadow">
              {gameState.activePlayer.coins}
            </span>
            <img className="max-h-16 max-w-32" src={treasureChestImage.href} alt="treasure" />
            <span className="text-6xl font-bold leading-[1em] text-primary-500 shadow-white text-shadow">
              {treasureCards.length + treasureJars.length}
            </span>
          </div>
        </div>
      </div>
      <PlayerMessage className="fixed bottom-24 left-1/2 z-50 mt-2 w-max max-w-[95vw] -translate-x-1/2 rounded bg-slate-900/50 p-2 text-lg font-bold text-white" />
      <main className={`${className} game-board-grid relative w-full`} {...props}>
        <ExplorerMap
          key={viewedPlayer.id}
          player={viewedPlayer}
          isActive={viewedPlayer === gameState.activePlayer}
          onViewNextPlayer={gameState.players.length > 1 ? viewNextPlayer : undefined}
        />
        <div
          className={clsx(
            'fixed right-0 top-0 z-30 h-screen w-sm bg-gray-700/60 pt-16 transition-all duration-300',
            sideBarOpen ? 'translate-x-0' : 'translate-x-sm',
          )}
          style={{ backgroundImage: `url(${plankPanelHorizontal.href})` }}
        >
          <div className="relative flex h-full flex-col items-center gap-2 overflow-y-auto p-2 text-white">
            <div className="flex-center sticky top-0 min-h-12 w-full gap-2 py-2">
              {gameState.activePlayer.moveHistory.size > 1 && (
                <Button onClick={() => gameState.activePlayer.selectUndo(true)}>Reset Moves</Button>
              )}
              {gameState.activePlayer.moveHistory.size > 0 && (
                <Button onClick={() => gameState.activePlayer.selectUndo()}>Undo Move</Button>
              )}
            </div>
            <div className="p-2 text-center text-xl">
              <a
                className="rounded border-none p-1 text-white underline ring-primary-50 hover:text-primary-50 focus:text-primary-50 focus:outline-none focus:ring-1"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.alderac.com/wp-content/uploads/2022/08/TGOME-Rulebook_web.pdf"
              >
                Read Game Instructions
              </a>
            </div>
            <div className="flex-center w-full flex-col gap-y-2">
              <h3 className="mb-2">Current Explorer Card</h3>
              {gameState.currentExplorerCard && (
                <img
                  className={clsx(
                    gameState.currentExplorerCard.isEraCard ? 'mb-2 w-1/3 rounded-lg' : 'w-4/5 rounded-3xl',
                  )}
                  src={gameState.currentExplorerCard.imageUrl.href}
                />
              )}
              {investigateCard && <img className="ml-2 w-4/5 rounded-3xl" src={investigateCard.imageUrl.href} />}
              <h3 className="mb-2 mt-4">Acquired Treasure Cards</h3>
              {treasureCards.length === 0 && treasureJars.length === 0 && <em>(None)</em>}
              {treasureJars.length > 0 && (
                <div className="flex-center flex-col">
                  <img className="mb-2 w-4/5 rounded-2xl" src={treasureJars[0].imageUrl.href} />
                  <div className="flex-center flex-row">
                    <h2>x{treasureJars.length}≈</h2>
                    <img className="w-8" src={coinImage.href} />
                    <p>{gameState.activePlayer.treasureCards.getTreasureJarValue()}</p>
                  </div>
                </div>
              )}
              {treasureCards.map((tc) => (
                <div key={tc.id} className="flex-center flex-col">
                  <img className="mb-2 w-4/5 rounded-2xl" src={tc.imageUrl.href} />
                  <div className="flex-center flex-row">
                    <h2>≈</h2>
                    <img className="w-8" src={coinImage.href} />
                    <p>{tc.value(gameState.activePlayer.board)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-8"
              variant="destructive"
              onClick={() => (gameState.soloMode || confirm('Do all players agree to this?')) && resetGame()}
            >
              Quit Game
            </Button>
          </div>
        </div>
        <div
          className={clsx(
            'fixed top-1/2 -translate-y-1/2 opacity-40 transition-all duration-300 focus-within:opacity-100 hover:opacity-100',
            sideBarOpen ? 'right-[calc(theme(spacing.sm)+theme(spacing.2))]' : 'right-2',
          )}
        >
          <Button PreIcon={sideBarOpen ? ChevronRightIcon : ChevronLeftIcon} onClick={() => toggleSideBar()}></Button>
        </div>
      </main>
      {['user-prompting', 'treasure-to-draw'].includes(gameState.activePlayer.mode) && userPromptOpen && (
        <Modal onClose={() => setUserPromptOpen(false)}>
          <div
            className="flex-center flex-col gap-4 p-2 text-white"
            style={{ backgroundImage: `url(${plankPanelHorizontal.href})` }}
          >
            <p>
              <strong>{gameState.activePlayer.id}</strong>: How would you like to proceed?
            </p>
            {gameState.activePlayer.treasureCardsToDraw > 0 && (
              <div className="flex-center flex-col">
                <Button
                  variant="primary"
                  onClick={() => {
                    const [treasureCard] = gameState.treasureDeck.drawCards()

                    if (treasureCard.discard) {
                      gameState.treasureDeck.discard(treasureCard)
                    }

                    gameState.activePlayer.selectMove({
                      action: 'draw-treasure',
                      treasureCard,
                    })
                  }}
                >
                  Draw Treasure
                </Button>
                <p>Drawing a treasure card cannot be undone!</p>
              </div>
            )}
            {gameState.activePlayer.connectedTradePosts.length > 1 && (
              <Button
                variant="primary"
                onClick={() =>
                  gameState.activePlayer.setMode(
                    gameState.activePlayer.connectedTradePosts.length === 2 ? 'trading' : 'choosing-trade-route',
                  )
                }
              >
                Trade
              </Button>
            )}
            {gameState.activePlayer.regionForVillage && (
              <Button variant="primary" onClick={() => gameState.activePlayer.setMode('choosing-village')}>
                Place Village
              </Button>
            )}
            {gameState.activePlayer.moveHistory.currentMoves.length > 0 && (
              <Button
                variant={gameState.activePlayer.treasureCardsToDraw ? 'destructive' : 'dismissive'}
                onClick={() => gameState.activePlayer.selectUndo()}
              >
                Undo
              </Button>
            )}
          </div>
        </Modal>
      )}
      {['choosing-investigate-card', 'choosing-investigate-card-reuse', ''].includes(gameState.activePlayer.mode) &&
        investigateModalOpen && (
          <Modal onClose={() => setInvestigateModalOpen(false)}>
            <p className="mb-4 text-center">
              <strong>{gameState.activePlayer.id}</strong>: Choose an Investigate Card for Era{' '}
              {gameState.era > 2 ? 'IV' : 'I'.repeat(gameState.era + 1)}.
            </p>
            <div className="flex-center gap-4">
              {(gameState.era < 3
                ? gameState.activePlayer.investigateCardCandidates
                : gameState.activePlayer.investigateCards.keptCards
              )?.map((candidate, index, cards) => (
                <button
                  key={candidate.id}
                  onClick={() => {
                    if (gameState.era < 3) {
                      const discardedCard = cards.find((c) => c !== candidate)
                      if (!discardedCard) {
                        return toast.error({
                          message: 'Error choosing Investigate Card',
                          description: 'Please refresh the browser and try again.',
                        })
                      }
                      gameState.activePlayer.selectMove({
                        action: 'choose-investigate-card',
                        chosenCard: candidate,
                        discardedCard,
                      })
                    } else {
                      gameState.activePlayer.selectMove({ action: 'choose-investigate-card-reuse', era: index })
                    }
                  }}
                >
                  <img src={candidate.imageUrl.href} alt="Investigate Card" />
                </button>
              ))}
            </div>
          </Modal>
        )}
      {newTreasureCard && (
        <Modal onClose={() => setNewTreasureCard(false)}>
          <p className="mb-4 text-center">
            Congratulations, <strong>{gameState.activePlayer.id}</strong>, you drew a treasure card:
          </p>
          <img
            className="block max-w-md rounded-2xl"
            src={
              gameState.activePlayer.treasureCards.cards[gameState.activePlayer.treasureCards.size - 1]?.card.imageUrl
                .href
            }
          />
          <Button variant="primary" onClick={() => setNewTreasureCard(false)}>
            OK
          </Button>
        </Modal>
      )}
      {gameState.gameOver && userPromptOpen && (
        <Modal
          className="rounded-none !p-0 shadow-2xl"
          bgClass="bg-transparent"
          onClose={() => setUserPromptOpen(false)}
        >
          <div
            className="grid min-w-[50vw] gap-4 py-4 text-white"
            style={{
              gridTemplateColumns: `repeat(${gameState.players.length}, auto)`,
              gridAutoRows: 'auto',
              backgroundImage: `url(${plankPanelHorizontal.href})`,
            }}
          >
            <h1 className="col-span-full w-full text-center">All Eras Complete!</h1>
            {gameState.players.map((player) => (
              <div key={player.id} className="flex-center flex-col gap-4 p-2">
                {!gameState.soloMode && <h3>{player.id}</h3>}
                {player.scoreBoard.stats.map((stat, i) => (
                  <div key={i}>
                    <div className="flex-center gap-4 text-gray-100">
                      {stat.image && <img className="max-h-8 max-w-8" src={stat.image.href} />}
                      {stat.name && <p className="text-lg">{stat.name}</p>}
                    </div>
                    <div className="flex-center gap-4 font-semibold">
                      <p className="text-xl">
                        {stat.visibleScore >= 0 ? stat.visibleScore : '-'}
                        {stat.visibleScore >= 0 && stat.maxScore ? ` / ${stat.maxScore}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <Button
              className="col-span-full row-start-3 place-self-center"
              disabled={!gameState.activePlayer.scoreBoard.doneRevealing}
              variant={gameState.activePlayer.scoreBoard.doneRevealing ? 'primary' : 'dismissive'}
              onClick={resetGame}
            >
              New Game
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
