import type {
  GameState,
  SerializedGameState,
  SerializedSharedGameState,
  SerializedPlayer,
} from '../game-logic/GameState'
import type { InvestigateCard } from '../game-logic/Cards'
import type { P2PRoom, RoomMessage } from './p2p-room'

const PLAYER_STATE = 'player-state'
const DRAW_TREASURE = 'draw-treasure'
export const SHARED_GAME_STATE = 'shared-game-state'
export const TURN_STATE = 'turn-state'

interface SharedMessage {
  roomId: number
  fromTurn: string
  state: SerializedSharedGameState
}

function isSharedMessage(data: unknown): data is SharedMessage {
  if (!data || typeof data !== 'object') return false
  const value = data as SharedMessage
  return (
    typeof value.fromTurn === 'string' &&
    Number.isInteger(value.roomId) &&
    !!value.state &&
    Number.isInteger(value.state.era) &&
    Number.isInteger(value.state.currentTurn) &&
    Array.isArray(value.state.objectives) &&
    !!value.state.turnHistory &&
    !!value.state.explorerDeck &&
    !!value.state.investigateDeck &&
    !!value.state.treasureDeck
  )
}

const turnKey = (game: { era: number; currentTurn: number; gameOver: boolean }) =>
  `${game.era}:${game.currentTurn}:${game.gameOver}`

interface PlayerMessage {
  era: number
  turn: number
  player: SerializedPlayer
  drawResult?: boolean
}

function isPlayerMessage(data: unknown): data is PlayerMessage {
  if (!data || typeof data !== 'object') return false
  const value = data as PlayerMessage
  return (
    Number.isInteger(value.era) &&
    Number.isInteger(value.turn) &&
    typeof value.player?.id === 'string' &&
    Array.isArray(value.player.moveHistory?.historicalMoves) &&
    Array.isArray(value.player.moveHistory?.currentMoves)
  )
}

export function connectPlayerSync(game: GameState, room: P2PRoom, onDrawing: (pending: boolean) => void) {
  const userId = room.members.find((member) => member.id === room.myId)?.player_id
  const isHost = userId === room.host_id
  const ownPlayer = () => game.players.find((player) => player.id === userId)
  const snapshot = (player: SerializedPlayer): SerializedPlayer =>
    JSON.parse(JSON.stringify(player)) as SerializedPlayer
  let lastOwnState = JSON.stringify(ownPlayer())
  let sharedTurn = turnKey(game)
  let lastSharedState = JSON.stringify(game.toSharedJSON())
  let drawing = false
  let previousPlayer: SerializedPlayer | undefined

  // A turn transition includes players: all their preceding turns are committed.
  const broadcastTurnState = () => {
    const fromTurn = sharedTurn
    sharedTurn = turnKey(game)
    lastSharedState = JSON.stringify(game.toSharedJSON())
    room.broadcast(TURN_STATE, {
      roomId: room.id,
      fromTurn,
      state: JSON.parse(JSON.stringify(game)) as SerializedGameState,
    })
  }
  const broadcastShared = () => {
    const serialized = JSON.stringify(game.toSharedJSON())
    if (serialized === lastSharedState) return
    lastSharedState = serialized
    room.broadcast(SHARED_GAME_STATE, {
      roomId: room.id,
      fromTurn: sharedTurn,
      state: JSON.parse(serialized) as SerializedSharedGameState,
    } satisfies SharedMessage)
  }
  const publishPlayer = (player: SerializedPlayer, drawResult = false) => {
    const data: PlayerMessage = { era: game.era, turn: game.currentTurn, player: snapshot(player), drawResult }
    if (isHost) {
      // The owner already has its ordinary moves, and may have made further ones.
      for (const peer of room.getPeers()) {
        if (peer.userId !== player.id || drawResult) room.sendTo(peer.userId, PLAYER_STATE, data)
      }
    } else {
      room.sendTo(room.host_id, PLAYER_STATE, data)
    }
  }
  const onSerialize = () => {
    if (isHost && sharedTurn !== turnKey(game)) {
      lastOwnState = JSON.stringify(ownPlayer())
      broadcastTurnState()
      return
    }
    if (isHost) broadcastShared()
    const player = ownPlayer()
    const serialized = JSON.stringify(player)
    if (!player || drawing || serialized === lastOwnState) return
    lastOwnState = serialized
    publishPlayer(player)
  }
  const onLocked = {
    handleEvent(
      event: CustomEvent<{
        playerId: string
        era: number
        turn: number
        moveIndex: number
        discardedCard: InvestigateCard
        replaying: boolean
      }>,
    ) {
      const lock = event.detail
      if (!isHost || !lock.replaying || previousPlayer?.id !== lock.playerId) return
      const oldMove = previousPlayer.moveHistory.historicalMoves[lock.era]?.[lock.turn]?.[lock.moveIndex]
      if (oldMove?.action !== 'choose-investigate-card') game.investigateDeck.discard(lock.discardedCard)
    },
  }
  const draw = (playerId: string) => {
    const player = game.players.find((candidate) => candidate.id === playerId)
    if (!player || player.treasureCardsToDraw <= 0 || game.readyPlayers.includes(player)) return
    const [card] = game.treasureDeck.drawCards()
    if (!card) return
    if (card.discard) game.treasureDeck.discard(card)
    player.selectMove({ action: 'draw-treasure', treasureCard: card })
  }
  const receive = (message: RoomMessage) => {
    if (message.type === SHARED_GAME_STATE || message.type === TURN_STATE) {
      if (isHost || message.userId !== room.host_id || !isSharedMessage(message.data)) return
      const { state, roomId, fromTurn } = message.data
      if (roomId !== room.id || fromTurn !== turnKey(game) || state.boardName !== game.boardName) return
      if (message.type === SHARED_GAME_STATE) {
        if (turnKey(state) !== turnKey(game)) return
        game.restoreSharedState(state)
      } else {
        if (turnKey(state) === turnKey(game) || !('players' in state) || !Array.isArray(state.players)) return
        game.restoreTurn(state as SerializedGameState)
        sharedTurn = turnKey(game)
        lastOwnState = JSON.stringify(ownPlayer())
        drawing = false
        onDrawing(false)
      }
      lastSharedState = JSON.stringify(game.toSharedJSON())
      return
    }
    if (message.type !== PLAYER_STATE && message.type !== DRAW_TREASURE) return
    if (!isPlayerMessage(message.data)) return
    const data = message.data
    if (data.era !== game.era || data.turn !== game.currentTurn) return
    if (isHost ? message.userId !== data.player.id : message.userId !== room.host_id) return
    if (!isHost && message.type === DRAW_TREASURE) return
    const existing = game.players.find((player) => player.id === data.player.id)
    if (!existing || (isHost && game.readyPlayers.includes(existing))) return
    if (!isHost && data.player.id === userId && !data.drawResult) return

    previousPlayer = snapshot(existing)
    try {
      const restored = game.restorePlayer(data.player)
      if (isHost) {
        if (message.type === DRAW_TREASURE) draw(restored.id)
        if (sharedTurn !== turnKey(game)) broadcastTurnState()
        else {
          publishPlayer(restored, message.type === DRAW_TREASURE)
          broadcastShared()
        }
      } else if (data.player.id === userId) {
        lastOwnState = JSON.stringify(ownPlayer())
        drawing = false
        onDrawing(false)
      }
    } finally {
      previousPlayer = undefined
    }
  }

  game.addEventListener('onserialize', onSerialize)
  game.addEventListener('oninvestigatelocked', onLocked)
  room.on('message', receive)

  return {
    drawTreasure() {
      const player = ownPlayer()
      if (!player || drawing) return
      if (isHost) {
        draw(player.id)
      } else {
        drawing = true
        onDrawing(true)
        // Include all optimistic moves, even if the serialization timer hasn't fired.
        lastOwnState = JSON.stringify(player)
        room.sendTo(room.host_id, DRAW_TREASURE, {
          era: game.era,
          turn: game.currentTurn,
          player: snapshot(player),
        } satisfies PlayerMessage)
      }
    },
    dispose() {
      game.removeEventListener('onserialize', onSerialize)
      game.removeEventListener('oninvestigatelocked', onLocked)
      room.off('message', receive)
    },
  }
}
