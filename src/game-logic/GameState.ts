import { aghonData } from '../data/boards/aghon'
import { kazanData } from '../data/boards/kazan'
import { aveniaData } from '../data/boards/avenia'
import { cnidariaData } from '../data/boards/cnidaria'
import { Board, Hex, Region, SerializedHex } from './Board'
import { randomSelection, sleep } from '../utils'
import {
  ExplorerCard,
  ExplorerDeck,
  InvestigateCard,
  InvestigateDeck,
  InvestigateHand,
  SerializedCard,
  SerializedDeck,
  SerializedExplorerDeck,
  SerializedHand,
  TreasureDeck,
  TreasureHand,
} from './Cards'
import { objectives } from '../data/objectives'
import { Objective, SerializedObjective } from './Objective'
import { ScoreBoard } from './ScoreBoard'
import { northProyliaData } from '../data/boards/north-proylia'
import { xawskilData } from '../data/boards/xawskil'
import { investigateCardDataLookup } from '../data/cards/investigate-cards'
import { cardFlipSFX, crystalSFX, placeBlockSFX, towerSFX, tradeSFX, treasureSFX, villageSFX } from '../audio'

export type BoardName = 'aghon' | 'avenia' | 'kazan' | 'cnidaria' | 'northProylia' | 'xawskil'

const getBoardData = (boardName: BoardName) => {
  switch (boardName) {
    case 'aghon':
      return aghonData
    case 'avenia':
      return aveniaData
    case 'kazan':
      return kazanData
    case 'cnidaria':
      return cnidariaData
    case 'northProylia':
      return northProyliaData
    case 'xawskil':
      return xawskilData
  }
}

export interface SerializedGameState {
  boardName: BoardName
  activePlayer: SerializedPlayer
  turnHistory: SerializedTurnHistory
  objectives: SerializedObjective[]
  explorerDeck: SerializedExplorerDeck
  investigateDeck: SerializedDeck
  treasureDeck: SerializedDeck
}

export class GameState extends EventTarget {
  boardName: BoardName
  era = 0
  currentTurn = 0

  activePlayer: Player
  turnHistory: TurnHistory

  explorerDeck: ExplorerDeck
  currentExplorerCard: ExplorerCard

  objectives: Objective[] = []

  investigateDeck: InvestigateDeck

  treasureDeck: TreasureDeck

  scoreBoard?: ScoreBoard

  serializationTimeout = 0
  lastEmittedSerializedState = ''

  constructor(boardName: BoardName, serializedData?: SerializedGameState) {
    super()

    this.boardName = boardName

    if (serializedData) {
      this.fromJSON(serializedData)
    } else {
      this.newGame()
    }
  }

  newGame() {
    this.objectives = randomSelection(objectives[this.boardName], 3).map((algorithm) => new Objective(algorithm, this))

    this.activePlayer = new Player(this)
    this.turnHistory = new TurnHistory(this)

    this.investigateDeck = new InvestigateDeck()
    this.investigateDeck.shuffle()

    this.explorerDeck = new ExplorerDeck()
    this.explorerDeck.shuffle()

    this.treasureDeck = new TreasureDeck()
    this.treasureDeck.shuffle()

    // start game!
    this.flipExplorerCard()
  }

  get currentCardRules() {
    return this.currentExplorerCard?.rules(this.activePlayer)
  }

  startNextAge() {
    this.era++
    if (this.era > 3) {
      this.activePlayer.addEndgameCoins()

      this.era-- // reset to a valid era
      this.activePlayer.mode = 'game-over'
      this.activePlayer.message = 'Game Over!'

      this.scoreBoard = new ScoreBoard(this.activePlayer)
    } else {
      // only wipe the board if we're going to a new era, otherwise leave it up for satisfactory reviewing
      this.currentTurn = 0
      this.activePlayer.board.wipe()
      this.activePlayer.freeExploreQuantity = 0
      this.explorerDeck.prepareForNextEra()

      this.flipExplorerCard()
    }

    this.emitStateChange()
  }

  flipExplorerCard() {
    // first things first: check objectives from last move now that all players have confirmed and are ready to advance
    for (const objective of this.objectives) {
      // in multiplayer we will obviously loop over all the players
      objective.checkAndScoreForPlayer(this.activePlayer)
    }

    this.activePlayer.moveHistory.lockInMoveState()
    this.activePlayer.cardPhase = 0

    // increment turn if we already have a card, otherwise, set to zero because it is start of an era
    this.currentTurn = this.currentExplorerCard ? this.currentTurn + 1 : 0

    const [nextCard] = this.explorerDeck.drawCards()
    this.currentExplorerCard = nextCard ?? null

    if (this.currentExplorerCard) {
      this.explorerDeck.discard(nextCard)
      this.turnHistory.saveCardFlip(nextCard.id)
      this.activePlayer.freeExploreQuantity = 0

      // first era card flip, need to deal new ones to the player(s)
      if (this.currentExplorerCard.id === `era-${this.era + 1}`) {
        this.activePlayer.mode = 'choosing-investigate-card'

        this.dealInvestigateCards(this.activePlayer)
      }

      if (this.currentExplorerCard.id === 'era-2') {
        this.objectives[0].isFirstBlocked = true
      }

      if (this.currentExplorerCard.id === 'era-3') {
        this.objectives[0].isSecondBlocked = true
        this.objectives[1].isFirstBlocked = true
      }

      if (this.currentExplorerCard.id === 'era-any') {
        this.activePlayer.mode = 'choosing-investigate-card-reuse'
        this.objectives[1].isSecondBlocked = true
        this.objectives[2].isFirstBlocked = true
      }

      this.activePlayer.message =
        this.currentExplorerCard.rules(this.activePlayer)?.[0].message ?? 'Choose an Investigate Card'
    } else {
      this.startNextAge()
    }

    this.emitStateChange()
  }

  // pass in the player to deal to, kind of preparing this method for multiplayer
  dealInvestigateCards(player: Player) {
    const [candidate1, candidate2] = this.investigateDeck.drawCards({ quantity: 2, recycle: true })

    player.investigateCardCandidates = [candidate1, candidate2]
  }

  emitStateChange() {
    this.dispatchEvent(new CustomEvent('onstatechange'))
    this.enqueueSerialization()
  }

  emitSerializationUpdate(serializedData: string) {
    this.dispatchEvent(new CustomEvent('onserialize', { detail: { serializedData } }))
  }

  enqueueSerialization() {
    clearTimeout(this.serializationTimeout)

    this.serializationTimeout = setTimeout(
      () => {
        const savedState = JSON.stringify(this)

        if (savedState !== this.lastEmittedSerializedState) {
          this.lastEmittedSerializedState = savedState
          this.emitSerializationUpdate(savedState)
        }
      },
      // wait, but not too long, really just want to let the stack clear to avoid unnecessary serializations.
      // to be honest, 0 could do the trick too, because of how the event loop works.
      16,
    )
  }

  /**
   * JSON.stringify will use this method if available
   */
  toJSON(): SerializedGameState {
    return {
      boardName: this.boardName,
      activePlayer: this.activePlayer as SerializedPlayer,
      turnHistory: this.turnHistory,
      objectives: this.objectives,
      explorerDeck: this.explorerDeck,
      investigateDeck: this.investigateDeck,
      treasureDeck: this.treasureDeck,
    }
  }

  fromJSON(data: SerializedGameState) {
    this.activePlayer = new Player(this, data.activePlayer)
    this.turnHistory = new TurnHistory(this, data.turnHistory)
    this.objectives = data.objectives.map(
      (od) => new Objective(objectives[this.boardName].find((o) => od.id === o.id)!, this),
    )
    this.explorerDeck = new ExplorerDeck(data.explorerDeck)
    this.investigateDeck = new InvestigateDeck(data.investigateDeck)
    this.treasureDeck = new TreasureDeck(data.treasureDeck)
  }
}

export interface SerializedTurnHistory {
  era1: string[]
  era2: string[]
  era3: string[]
  era4: string[]
}

/**
 * represents the turn/flip of a single explorer card,
 * within which many indiviual moves (block placements) can be made
 */
export class TurnHistory {
  gameState: GameState

  // only storing the ids of the explorer cards because of the dynamic nature of the era cards
  era1: string[] = []
  era2: string[] = []
  era3: string[] = []
  era4: string[] = []

  constructor(gameState: GameState, serializedData?: SerializedTurnHistory) {
    this.gameState = gameState

    if (serializedData) {
      this.era1 = serializedData.era1
      this.era2 = serializedData.era2
      this.era3 = serializedData.era3
      this.era4 = serializedData.era4
    }
  }

  saveCardFlip(id: string) {
    switch (this.gameState.era) {
      case 0:
        return this.era1.push(id)
      case 1:
        return this.era2.push(id)
      case 2:
        return this.era3.push(id)
      case 3:
        return this.era4.push(id)
    }
  }

  toJSON(): SerializedTurnHistory {
    return {
      era1: this.era1,
      era2: this.era2,
      era3: this.era3,
      era4: this.era4,
    }
  }
}

export interface SerializedPlayer {
  moveHistory: SerializedMoveHistory
  treasureCards: SerializedHand
  investigateCardCandidates: [SerializedCard, SerializedCard] | null
  investigateCards: SerializedHand
  era4SelectedInvestigateCard: SerializedCard | null
}

export type PlayerMode =
  | 'exploring'
  | 'free-exploring' // treasure card block is "free" because it defies all rules
  | 'choosing-village'
  | 'user-prompting'
  | 'choosing-investigate-card'
  | 'choosing-investigate-card-reuse'
  | 'choosing-trade-route'
  | 'trading'
  | 'clearing-history'
  | 'game-over'

export class Player extends EventTarget {
  gameState: GameState
  board: Board
  moveHistory: MoveHistory

  mode: PlayerMode = 'exploring'
  message = 'Explore!'

  coins = 0

  treasureCardHex?: Hex
  treasureCardsToDraw = 0 // use this value to increment when cards are earned, and decrement when they are drawn
  treasureCards: TreasureHand

  connectedTradePosts: Hex[] = []
  chosenRoute: Hex[] = []
  finalizedTradingRoutes: Hex[][] = []

  regionForVillage?: Region

  investigateCardCandidates: [InvestigateCard, InvestigateCard] | null = null

  investigateCards: InvestigateHand
  era4SelectedInvestigateCard: InvestigateCard | null = null

  cardPhase = 0 // some cards have complex logic in 2 or more phases

  freeExploreQuantity = 0 //-1 means infinite

  constructor(gameState: GameState, serializedData?: SerializedPlayer) {
    super()

    this.gameState = gameState
    this.board = new Board(getBoardData(this.gameState.boardName), this, this.gameState)

    if (serializedData) {
      this.fromJSON(serializedData)
    } else {
      this.newGame()
    }
  }

  newGame() {
    this.moveHistory = new MoveHistory(this, this.gameState)

    this.treasureCards = new TreasureHand(this)
    this.investigateCards = new InvestigateHand(this)
  }

  addEndgameCoins() {
    this.coins += this.treasureCards.getCoinTotal()

    this.coins += this.board.getXawskilCoins()
  }

  chooseInvestigateCard(chosenCard: InvestigateCard) {
    if (!this.investigateCardCandidates) return

    const discardedCard = this.investigateCardCandidates.find((ic) => ic !== chosenCard)

    if (!discardedCard) return

    this.moveHistory.doMove({ action: 'choose-investigate-card', chosenCard, discardedCard })
  }

  chooseInvestigateCardForReuse(era: number) {
    this.moveHistory.doMove({ action: 'choose-investigate-card-reuse', era })
  }

  enterNextCardPhaseMode() {
    this.moveHistory.doMove({ action: 'advance-card-phase' })
    this.gameState.emitStateChange()
  }

  checkForUserDecision() {
    if (this.treasureCardsToDraw > 0) {
      this.enterDrawTreasureMode()
      return
    }

    //If there is only one village candidate, auto place the village, then check for user decision again
    if (this.regionForVillage?.villageCandidates.length === 1) {
      this.enterVillageMode()
      return
    }

    const hasTradePosts = this.connectedTradePosts.length > 1
    const needsVillage = !!this.regionForVillage
    const hasTreasureCards = !!this.treasureCardHex

    switch (true) {
      case !hasTradePosts && !needsVillage && !hasTreasureCards:
        this.enterExploringMode()
        break
      case hasTradePosts && !needsVillage && !hasTreasureCards:
        this.enterPickingTradeRouteMode()
        break
      case !hasTradePosts && needsVillage && !hasTreasureCards:
        this.enterVillageMode()
        break
      case !hasTradePosts && !needsVillage && hasTreasureCards:
        this.enterDrawTreasureMode()
        break
      default:
        this.mode = 'user-prompting'
        this.message = 'Choose what to do next.'
    }

    this.gameState.emitStateChange()
  }

  enterVillageMode() {
    this.mode = 'choosing-village'
    this.message = "You've explored the region! Choose where to build a village."

    // auto place the only option
    if (this.regionForVillage?.villageCandidates.length === 1) {
      this.moveHistory.doMove({ action: 'choose-village', hex: this.regionForVillage.villageCandidates[0] })
    } else {
      this.gameState.emitStateChange()
    }
  }

  enterPickingTradeRouteMode() {
    if (this.connectedTradePosts.length === 2) {
      this.chosenRoute.push(this.connectedTradePosts[0], this.connectedTradePosts[1])
      this.enterTradingMode()
      return
    }

    this.mode = 'choosing-trade-route'
    this.message = 'Pick two trading posts to trade between.'
    this.gameState.emitStateChange()
  }

  enterTradingMode() {
    this.mode = 'trading'
    this.message = 'Complete the trade by picking a trading post to permanently cover.'
    this.gameState.emitStateChange()
  }

  enterExploringMode() {
    if (this.freeExploreQuantity > 0 || this.freeExploreQuantity === -1) {
      this.enterFreeExploringMode()
    }

    this.mode = 'exploring'
    this.message = this.gameState.currentExplorerCard?.rules(this)?.[this.cardPhase]?.message ?? 'Explore!'
    this.gameState.emitStateChange()
  }

  enterDrawTreasureMode() {
    if (this.treasureCardHex) {
      this.mode = 'user-prompting'
      this.message = 'Draw a treasure card!'
    } else {
      this.checkForUserDecision()
    }
  }

  enterFreeExploringMode() {
    this.mode = 'free-exploring'
    this.message = 'Explore anywhere!'
    this.gameState.emitStateChange()
  }

  toJSON(): SerializedPlayer {
    return {
      moveHistory: this.moveHistory as SerializedMoveHistory,
      treasureCards: this.treasureCards,
      investigateCardCandidates: this.investigateCardCandidates as [SerializedCard, SerializedCard],
      investigateCards: this.investigateCards,
      era4SelectedInvestigateCard: this.era4SelectedInvestigateCard,
    }
  }

  fromJSON(data: SerializedPlayer) {
    this.moveHistory = new MoveHistory(this, this.gameState, data.moveHistory)
    this.treasureCards = new TreasureHand(this, data.treasureCards)
    this.investigateCards = new InvestigateHand(this, data.investigateCards)
    this.investigateCardCandidates = data.investigateCardCandidates
      ? [
          new InvestigateCard(investigateCardDataLookup[data.investigateCardCandidates[0].id]),
          new InvestigateCard(investigateCardDataLookup[data.investigateCardCandidates[1].id]),
        ]
      : null
    this.era4SelectedInvestigateCard = data.era4SelectedInvestigateCard
      ? new InvestigateCard(investigateCardDataLookup[data.era4SelectedInvestigateCard.id])
      : null
  }
}

export interface SerializedMove {
  action: Move['action']
  hex?: SerializedHex
  tradingHex?: SerializedHex
  era?: number
  chosenCard?: SerializedCard
  discardedCard?: SerializedCard
}

/**
 * a move represents the result of a decision
 */
type Move =
  | {
      action: 'advance-card-phase'
    }
  | {
      action: 'explore'
      hex: Hex
    }
  | {
      action: 'freely-explore'
      hex: Hex
    }
  | {
      action: 'choose-trade-route'
      hex: Hex
    }
  | {
      action: 'cover-tradepost'
      hex: Hex
      tradingHex: Hex
    }
  | {
      action: 'choose-village'
      hex: Hex
    }
  | {
      action: 'draw-treasure'
      hex: Hex
    }
  | {
      action: 'choose-investigate-card'
      chosenCard: InvestigateCard
      discardedCard: InvestigateCard
    }
  | {
      action: 'choose-investigate-card-reuse'
      era: number
    }
  | {
      action: 'discover-tower'
      hex: Hex
    }
  | {
      action: 'discover-crystal'
      hex: Hex
    }
  | {
      action: 'discover-land'
      hex: Hex
    }

export interface SerializedMoveHistory {
  historicalMoves: SerializedMove[][][]
  currentMoves: SerializedMove[]
}

export class MoveHistory {
  currentMoves: Move[] = []
  historicalMoves: Move[][][] = [[], [], [], []] // initialize the 4 eras with their empty lists, ready for individual turns
  gameState: GameState
  player: Player

  constructor(player: Player, gameState: GameState, serializedData?: SerializedMoveHistory) {
    this.player = player
    this.gameState = gameState

    if (serializedData) {
      this.currentMoves = serializedData.currentMoves.map((sm) => this.moveFromJSON(sm))
    }
  }

  moveFromJSON(sm: SerializedMove) {
    const move = {
      action: sm.action,
    } as Move

    switch (move.action) {
      case 'cover-tradepost':
        if (sm.tradingHex) {
          move.tradingHex = this.player.board.getHex(sm.tradingHex.row, sm.tradingHex.column)!
        }
      case 'explore':
      case 'freely-explore':
      case 'choose-trade-route':
      case 'choose-village':
      case 'discover-tower':
      case 'discover-crystal':
      case 'discover-land':
        if (sm.hex) {
          move.hex = this.player.board.getHex(sm.hex.row, sm.hex.column)!
        }
        break
      case 'choose-investigate-card-reuse':
        if (sm.era != null) {
          move.era = sm.era
        }
        break
      case 'choose-investigate-card':
        if (sm.chosenCard) {
          move.chosenCard = new InvestigateCard(investigateCardDataLookup[sm.chosenCard.id])
        }
        if (sm.discardedCard) {
          move.discardedCard = new InvestigateCard(investigateCardDataLookup[sm.discardedCard.id])
        }
      case 'advance-card-phase':
      case 'draw-treasure':
      default:
        break
    }

    return move
  }

  doMove(move: Move, replaying = false) {
    if (!replaying) {
      this.currentMoves.push(move)
    }

    switch (move.action) {
      case 'advance-card-phase':
        this.player.cardPhase++
        break
      case 'explore':
      case 'freely-explore':
        move.hex.explore()
        this.playAudio(placeBlockSFX, replaying)
        break
      case 'discover-tower':
        move.hex.isCovered = true
        const towers = this.player.board.getFlatHexes().filter((h) => h.isTower && h.isCovered)

        if (towers.length === 1) {
          this.player.coins += 6
        } else if (towers.length === 2) {
          this.player.coins += 8
        } else if (towers.length === 3) {
          this.player.coins += 10
        } else if (towers.length === 4) {
          this.player.coins += 14
        }

        this.playAudio(towerSFX, replaying)
        break
      case 'discover-crystal':
        move.hex.isCovered = true

        const crystalValueSum = this.player.board
          .getFlatHexes()
          .filter((h) => h.crystalValue && h.isCovered)
          .reduce((sum, h) => sum + h.crystalValue, 0)

        this.player.coins += crystalValueSum

        this.playAudio(crystalSFX, replaying)
        break
      case 'discover-land':
        if (move.hex.land) {
          move.hex.land.hasBeenReached = true
        }

        break
      case 'choose-trade-route':
        this.player.chosenRoute.push(move.hex)
        break
      case 'cover-tradepost':
        move.hex.isCovered = true

        //Add coins that were just collected
        this.player.coins += this.player.chosenRoute[0].tradingPostValue * this.player.chosenRoute[1].tradingPostValue

        //clear the chosen route
        this.player.finalizedTradingRoutes.push(this.player.chosenRoute)
        this.player.chosenRoute = []
        this.playAudio(tradeSFX, replaying)
        break
      case 'choose-village':
        move.hex.isVillage = true

        this.player.coins += this.gameState.era + 1
        this.player.regionForVillage = undefined

        this.playAudio(villageSFX, replaying)
        break
      case 'draw-treasure':
        move.hex.isCovered = true
        this.playAudio(treasureSFX, replaying)
        break
      case 'choose-investigate-card':
      case 'choose-investigate-card-reuse':
        // nothing more to do, cards are already drawn and evaluated
        break
    }

    if (!replaying) {
      this.adjustGameStateFromMove(move)

      this.gameState.emitStateChange()
    }
  }

  /**
   * This method specifically handles game state changes that follow from a given state after a move.
   * This is relevant only to the active player _during play_, not for opponents or restoring game state.
   */
  adjustGameStateFromMove(move: Move) {
    switch (move.action) {
      case 'advance-card-phase':
        this.player.message =
          this.gameState.currentExplorerCard?.rules(this.player)?.[this.player.cardPhase]?.message ?? 'Explore!'
        break
      case 'explore':
        //Finds trading routes every time a hex is explored
        this.player.connectedTradePosts = move.hex.getConnectedTradingPosts()

        if (
          this.gameState.currentCardRules?.[this.player.cardPhase + 1] &&
          this.gameState.currentCardRules?.[this.player.cardPhase].limit ===
            this.getPlacedHexes()[this.player.cardPhase].size
        ) {
          this.doMove({ action: 'advance-card-phase' })
        }

        // auto-handle actions that don't require user decisions
        if (!move.hex.isCovered) {
          if (move.hex.isTower) {
            this.doMove({ action: 'discover-tower', hex: move.hex })
          }

          if (move.hex.crystalValue) {
            this.doMove({ action: 'discover-crystal', hex: move.hex })
          }

          if (move.hex.isRuin) {
            this.player.treasureCardHex = move.hex
          }
        }

        if (!move.hex.land?.hasBeenReached) {
          this.doMove({ action: 'discover-land', hex: move.hex })
        }

        this.player.checkForUserDecision()
        break
      case 'freely-explore':
        if (this.player.freeExploreQuantity > 0) {
          this.player.freeExploreQuantity--
        }

        this.player.checkForUserDecision()
        break
      case 'discover-tower':
      case 'discover-crystal':
      case 'discover-land':
        // no extra game logic
        break
      case 'choose-trade-route':
        if (this.player.chosenRoute.length === 2) {
          this.player.enterTradingMode()
        } else {
          this.player.enterPickingTradeRouteMode()
        }

        break
      case 'cover-tradepost':
        //removes the hex that was just covered
        const index = this.player.connectedTradePosts.indexOf(move.hex)
        this.player.connectedTradePosts.splice(index, 1)

        //determines whether or not you should continue trading or continue the game
        if (this.player.connectedTradePosts.length > 1) {
          this.player.enterPickingTradeRouteMode()
        } else {
          this.player.connectedTradePosts = []
          this.player.checkForUserDecision()
        }

        break
      case 'choose-village':
        this.player.checkForUserDecision()

        break
      case 'draw-treasure':
        //Applies the bonus from certain investigate cards
        if (this.player.treasureCardsToDraw === 0) {
          const bonus = this.gameState.currentExplorerCard.bonus(this.player)
          const multiplier = bonus?.type === 'treasure' ? bonus.multiplier : 1

          this.player.treasureCardsToDraw = multiplier
        }

        //Draws a treasure card and saves it's id to history
        const [treasureCard] = this.gameState.treasureDeck.drawCards()

        this.player.treasureCards.addCard(treasureCard, treasureCard.discard)

        this.player.dispatchEvent(new CustomEvent('treasure-gained'))

        if (treasureCard.discard) {
          this.player.coins += treasureCard.value(this.player.board)
          this.gameState.treasureDeck.discard(treasureCard)
        }

        this.player.treasureCardsToDraw--
        //Completely blocks the ability to undo anything prior to drawing a treasure card
        this.lockInMoveState()

        //Unassigns the treasure card hex when all treasure cards have been drawn
        if (this.player.treasureCardsToDraw === 0 && this.player.treasureCardHex) {
          this.player.treasureCardHex = undefined
        }

        //Performs immediate actions based on the treasure card drawn
        if (treasureCard.type === 'placeBlock') {
          this.player.enterFreeExploringMode()
          break
        }

        this.player.checkForUserDecision()
        break
      case 'choose-investigate-card':
        this.player.investigateCards.addCard(move.chosenCard, false)
        this.player.investigateCards.addCard(move.discardedCard, true)
        this.player.investigateCardCandidates = null
        this.player.enterExploringMode()
        break
      case 'choose-investigate-card-reuse':
        this.player.era4SelectedInvestigateCard = this.player.investigateCards.keptCards[move.era]
        this.player.enterExploringMode()
        break
    }
  }

  undoMove() {
    const undoing = this.currentMoves.pop()

    if (undoing) {
      switch (undoing.action) {
        case 'advance-card-phase':
          this.player.cardPhase--
          this.gameState.currentExplorerCard?.rules(this.player)?.[this.player.cardPhase]?.message ?? 'Explore!'

          if (
            this.gameState.currentCardRules?.[this.player.cardPhase].limit ===
            this.getPlacedHexes()[this.player.cardPhase].size
          )
            this.undoMove()
          break
        case 'explore':
          undoing.hex.unexplore()

          if (undoing.hex.isRuin) {
            this.player.treasureCardHex = undefined
          }

          this.player.chosenRoute = []
          this.player.connectedTradePosts = []

          this.player.checkForUserDecision()
          break
        case 'freely-explore':
          undoing.hex.unexplore()
          if (this.player.freeExploreQuantity > -1) {
            this.player.freeExploreQuantity++
          }
          this.player.enterFreeExploringMode()
          break
        case 'discover-tower':
          const towers = undoing.hex.board.getFlatHexes().filter((h) => h.isTower && h.isCovered)

          if (towers.length === 1) {
            this.player.coins -= 6
          } else if (towers.length === 2) {
            this.player.coins -= 8
          } else if (towers.length === 3) {
            this.player.coins -= 10
          } else if (towers.length === 4) {
            this.player.coins -= 14
          }

          undoing.hex.isCovered = false

          // automatically undo the explore action that caused this tower to be discovered
          this.undoMove()
          break
        case 'discover-crystal':
          const crystalValueSum = this.player.board
            .getFlatHexes()
            .filter((h) => h.crystalValue && h.isCovered)
            .reduce((sum, h) => sum + h.crystalValue, 0)

          this.player.board.player.coins -= crystalValueSum

          undoing.hex.isCovered = false

          // automatically undo the explore action that caused this tower to be discovered
          this.undoMove()
          break
        case 'discover-land':
          if (undoing.hex.land) {
            undoing.hex.land.hasBeenReached = false
          }

          // automatically undo the explore action that caused this tower to be discovered
          this.undoMove()
          break
        case 'choose-trade-route':
          this.player.connectedTradePosts = undoing.hex.getConnectedTradingPosts()

          if (this.currentMoves.length > 1) {
            const previousMove = this.currentMoves[this.currentMoves.length - 1]
            if (previousMove.action === 'choose-trade-route') {
              this.player.chosenRoute = [previousMove.hex]
              this.player.enterPickingTradeRouteMode()
              break
            }
          }

          this.player.chosenRoute = []
          this.player.checkForUserDecision()
          break
        case 'cover-tradepost':
          undoing.hex.isCovered = false
          if (undoing.tradingHex) {
            this.player.coins -= undoing.tradingHex.tradingPostValue * undoing.hex.tradingPostValue
            this.player.connectedTradePosts = undoing.hex.getConnectedTradingPosts()
            this.player.chosenRoute = [undoing.hex, undoing.tradingHex]
            this.player.finalizedTradingRoutes.pop()
            if (this.player.connectedTradePosts.length > 2) this.player.enterTradingMode()
            else this.player.checkForUserDecision()
          }
          break
        case 'choose-village':
          undoing.hex.isVillage = false
          this.player.coins -= this.gameState.era + 1

          if (!undoing.hex.region) {
            // Theoretically, this should never happen
            this.player.checkForUserDecision()
            break
          }

          //If there was only one village candidate, undoing the village placement should undo the explore action as well
          if (undoing.hex.region.villageCandidates.length === 1) {
            this.undoMove()
          } else {
            this.player.regionForVillage = undoing.hex.region
            this.player.checkForUserDecision()
          }

          break
        case 'draw-treasure':
          //You can't undo drawing a treasure card. Once you draw a treasure card, the history is cleared.
          //This means it's not technically possible to hit this switch case.
          //But if you do hit this case, there will be a funny error message in the console.
          console.error('How did we get here?!?')
          break
        case 'choose-investigate-card':
          this.player.investigateCardCandidates = this.player.investigateCards.undoCardSelection()
          this.player.mode = 'choosing-investigate-card'
          this.player.message = 'Choose an Investigate Card'
          break
        case 'choose-investigate-card-reuse':
          this.player.era4SelectedInvestigateCard = null
          this.player.mode = 'choosing-investigate-card-reuse'
          this.player.message = 'Choose an Investigate Card'
          break
      }
    }

    this.gameState.emitStateChange()
  }

  async undoAllMoves() {
    while (this.currentMoves.length) {
      this.undoMove()

      // cool UI effect of undoing all the action visually in half-second increments
      // this mode blocks the user from doing anything while it happens
      if (this.currentMoves.length) this.player.mode = 'clearing-history'
      await sleep(100)
    }

    this.gameState.emitStateChange()
  }

  /**
   * deduce the placed hexes for the current turn from the move history
   */
  getPlacedHexes() {
    const relevantMoves = (this.historicalMoves[this.gameState.era][this.gameState.currentTurn] || [])
      .concat(this.currentMoves)
      .filter((m) => m.action === 'explore' || m.action === 'advance-card-phase')

    const placedHexes: Hex[][] = [[]]

    for (const move of relevantMoves) {
      if (move.action === 'explore') {
        placedHexes[placedHexes.length - 1].push(move.hex)
      }

      if (move.action === 'advance-card-phase') {
        placedHexes.push([])
      }
    }

    return placedHexes.map((hexes, i) => {
      const iceCount = hexes.filter((h) => h.isIce).length

      const totalSize = hexes.length
      const iceSize = hexes.length + iceCount

      const ruleIsWild = this.gameState.currentCardRules?.[i].terrains.some((t) => t.terrain === 'wild')

      return { hexes, size: ruleIsWild ? totalSize : iceSize, affectedByIce: !ruleIsWild }
    })
  }

  get size() {
    return this.currentMoves.length
  }

  playAudio(sfx: HTMLAudioElement, replaying: boolean) {
    if (replaying) {
      return
    }

    //restarts the audio if it's already playing
    sfx.currentTime = 0

    sfx.play()
  }

  lockInMoveState() {
    const investigateCardChoice = this.currentMoves.find((m) => m.action === 'choose-investigate-card')

    if (investigateCardChoice?.action === 'choose-investigate-card') {
      this.gameState.investigateDeck.discard(investigateCardChoice.discardedCard)
    }

    // get any pre-existing moves (prior to treasure card draw, for example)
    const preexistingTurnMoves = this.historicalMoves[this.gameState.era][this.gameState.currentTurn] || []

    // insert these moves in the corresponding era/turn slot of the historical state for replay purposes
    this.historicalMoves[this.gameState.era][this.gameState.currentTurn] = preexistingTurnMoves.concat(
      this.currentMoves,
    )

    // clear move state
    this.currentMoves = []
  }

  toJSON(): SerializedMoveHistory {
    return {
      historicalMoves: this.historicalMoves as SerializedMove[][][],
      currentMoves: this.currentMoves as SerializedMove[],
    }
  }
}
