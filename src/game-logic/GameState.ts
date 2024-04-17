import { aghonData } from '../data/boards/aghon'
import { Board, Hex, Region } from './Board'
import { sleep } from '../utils'

export type GameMode = 'exploring' | 'treasure-exploring' | 'village' | 'power-card' | 'trading' | 'clear-history' | 'wait-for-new-card'

export class GameState {
  mode: GameMode = 'exploring'
  currentExplorerCard: 0
  moveHistory: MoveHistory
  board: Board
  regionForVillage?: Region

  constructor() {
    this.moveHistory = new MoveHistory()
    this.board = new Board(aghonData)

    this.moveHistory.gameState = this
    this.board.gameState = this
  }

  startNextAge() {
    this.board.wipe()
    //TODO undraw all cards here
    //TODO add next age card to the deck
    //TODO finish the game if age 5

    //You shouldn't be able to undo things in the previous ages, so we clear the history here.
    this.moveHistory.moveHistory = []
    this.moveHistory.recordState()
  }

  //TODO this will probably need to be the default mode at some point
  waitForNewCardMode() {
    this.mode = 'wait-for-new-card'
  }

  villageMode(region: Region) {
    this.mode = 'village'
    this.regionForVillage = region
  }

  tradingMode() {
    this.mode = 'trading'
    //TODO how are we going to determine what trading posts are connected?
  }

  //TODO this will probably need to take a card as an argument at some point
  exploringMode() {
    this.mode = 'exploring'
  }
}

interface Move {
  hex: Hex
  action: 'explored' | 'traded' | 'village' | 'draw-treasure' | 'do-treasure'
}

export class MoveHistory extends EventTarget {
  moveHistory: Move[] = []
  gameState: GameState

  doMove(move: Move) {
    this.moveHistory.push(move)

    switch (move.action) {
      case 'explored':
        move.hex.explore()
        break
      case 'traded':
        move.hex.isCovered = true
        //TODO add trade logic
        break
      case 'village':
        move.hex.isVillage = true
        this.gameState.exploringMode()
        break
      case 'draw-treasure':
        //TODO add draw treasure logic
        move.hex.isCovered = true
        //Completely blocks the ability to undo anything prior to drawing a treasure card
        this.moveHistory = []
        break
    }

    this.recordState()
  }

  undoMove() {
    const undoing = this.moveHistory.pop()

    if (undoing) {
      switch (undoing.action) {
        case 'explored':
          undoing.hex.isExplored = false
          this.gameState.exploringMode()
          break
        case 'traded':
          undoing.hex.isCovered = false
          //TODO add undo trade logic
          this.gameState.exploringMode()
          break
        case 'village':
          undoing.hex.isVillage = false
          if (undoing.hex.region) this.gameState.villageMode(undoing.hex.region)
          else this.gameState.exploringMode()
          break
        case 'draw-treasure':
          //You can't undo drawing a treasure card. Once you draw a treasure card, the history is cleared.
          //This means it's not technically possible to hit this switch case.
          console.error('How did we get here?!?')
          break
      }
    }

    this.recordState()
  }

  async undoAllMoves() {
    while (this.moveHistory.length) {
      this.undoMove()

      // cool UI effect of undoing all the action visually in half-second increments
      // this mode blocks the user from doing anything while it happens
      if (this.moveHistory.length) this.gameState.mode = 'clear-history'
      await sleep(100)
    }

    // this will always be the mode we return to, I'm 99% sure of it.
    //TODO does this account for treasure cards clearing history? The if statement I added would let undoMove set it to what the last item in history was.
    //this.gameState.exploringMode()
    this.recordState()
  }

  recordState() {
    this.dispatchEvent(new CustomEvent('statechange'))
  }
}
