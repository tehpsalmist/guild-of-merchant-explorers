// Run with node tests/player-sync.cjs. Stub browser assets/audio, use real game logic.
const ts = require('typescript')
const fs = require('node:fs')
const Module = require('node:module')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const originalLoad = Module._load
Module._load = function (id, ...args) {
  if (id.endsWith('/images')) return new Proxy({}, { get: () => new URL('file:///image') })
  if (id.endsWith('/audio')) return { audioTools: { play() {}, playAfterDelay() {} } }
  return originalLoad.call(this, id, ...args)
}
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file)
global.window = { setTimeout: () => 0 }

const { GameState } = require('../src/game-logic/GameState.ts')
const { ExplorerCard } = require('../src/game-logic/Cards.ts')
const { explorerCardDataMapping } = require('../src/data/cards/explorer-cards.ts')
const { connectPlayerSync } = require('../src/p2p-connection/player-sync.ts')
const rooms = [], queue = [], messages = []
const snapshot = (value) => JSON.parse(JSON.stringify(value))
class Room extends EventEmitter {
  constructor(id) {
    super()
    this.id = 1
    this.myId = id
    this.host_id = 'host'
    this.members = [{ id: 1, player_id: 'host' }, { id: 2, player_id: 'guest' }, { id: 3, player_id: 'observer' }]
    rooms.push(this)
  }
  getPeers() {
    return this.members.filter(m => m.id !== this.myId).map(m => ({ userId: m.player_id, state: 'connected' }))
  }
  sendTo(userId, type, data) {
    const target = rooms.find(r => r.members.find(m => m.id === r.myId).player_id === userId)
    const message = { type, data: snapshot(data), userId: this.members.find(m => m.id === this.myId).player_id }
    if (target) queue.push(() => target.emit('message', message))
    messages.push(message)
    return 'id'
  }
  broadcast(type, data) { this.getPeers().forEach(p => this.sendTo(p.userId, type, data)) }
}
const host = new GameState({ boardName: 'aghon', playerData: [{ id: 'host', color: 'a' }, { id: 'guest', color: 'b' }] })
host.explorerDeck.cards.unshift(new ExplorerCard(explorerCardDataMapping['era-1']))
host.flipExplorerCard()
function clone(game) {
  const data = snapshot(game)
  const copy = new GameState({ boardName: data.boardName }, data)
  copy.autoAdvance = false
  copy.players.forEach(p => p.replayMoves())
  return copy
}
const guest = clone(host), observer = clone(host)
const initialGame = snapshot(host)
const hr = new Room(1), gr = new Room(2), or = new Room(3)
let pending = false
const connections = [connectPlayerSync(host, hr, () => {}), connectPlayerSync(guest, gr, value => pending = value), connectPlayerSync(observer, or, () => {})]
function flush() { while (queue.length) queue.shift()() }
function send() { guest.emitSerializationUpdate(JSON.stringify(guest)); flush() }
const player = guest.players[1]
const [chosenCard, discardedCard] = player.investigateCardCandidates
const discardCount = host.investigateDeck.discarded.length
player.selectMove({ action: 'choose-investigate-card', chosenCard, discardedCard })
send()
assert.equal(host.investigateDeck.discarded.length, discardCount)
assert.deepEqual(snapshot(observer.players[1]), snapshot(player))
player.selectUndo()
send()
assert.equal(host.investigateDeck.discarded.length, discardCount)
assert.ok(host.players[1].investigateCardCandidates)
player.selectMove({ action: 'choose-investigate-card', chosenCard, discardedCard })
player.selectMove({ action: 'explore', hex: player.board.getFlatHexes().find(h => h.isRuin) })
// Shared updates must preserve unsent optimistic moves and every player instance.
const playerInstances = [...guest.players]
const optimisticState = snapshot(player)
host.treasureDeck.cards.reverse()
host.emitSerializationUpdate(JSON.stringify(host))
flush()
assert.ok(messages.some(m => m.type === 'shared-game-state'))
assert.ok(guest.players.every((p, index) => p === playerInstances[index]))
assert.deepEqual(snapshot(guest.players[1]), optimisticState)
assert.deepEqual(snapshot(guest.toSharedJSON()), snapshot(host.toSharedJSON()))
const sharedMessage = messages.findLast(m => m.type === 'shared-game-state')
assert.equal('players' in sharedMessage.data.state, false)
// A non-host cannot alter shared state.
gr.emit('message', { ...sharedMessage, userId: 'observer', data: { ...sharedMessage.data, state: { ...sharedMessage.data.state, objectives: [] } } })
assert.equal(guest.objectives.length, host.objectives.length)
// Request carries optimistic moves even before onserialize fires.
const deckSize = host.treasureDeck.cards.length
connections[1].drawTreasure()
assert.equal(pending, true)
connections[1].drawTreasure()
flush()
assert.equal(pending, false)
assert.equal(host.treasureDeck.cards.length, deckSize - 1)
assert.equal(host.investigateDeck.discarded.length, discardCount + 1)
assert.deepEqual(snapshot(host.players[1]), snapshot(guest.players[1]))
assert.deepEqual(snapshot(observer.players[1]), snapshot(guest.players[1]))
assert.deepEqual(snapshot(guest.toSharedJSON()), snapshot(host.toSharedJSON()))
guest.players[1].selectMove({ action: 'confirm-turn' })
send()
assert.equal(host.investigateDeck.discarded.length, discardCount + 1)
assert.ok(host.readyPlayers.includes(host.players[1]))
// Duplicate snapshots must not discard again.
gr.sendTo('host', 'player-state', { era: guest.era, turn: guest.currentTurn, player: snapshot(guest.players[1]) })
flush()
assert.equal(host.investigateDeck.discarded.length, discardCount + 1)
const turn = host.currentTurn
const hostPlayer = host.players[0]
const [hostChoice, hostDiscard] = hostPlayer.investigateCardCandidates
hostPlayer.selectMove({ action: 'choose-investigate-card', chosenCard: hostChoice, discardedCard: hostDiscard })
hostPlayer.selectMove({ action: 'confirm-turn' })
host.emitSerializationUpdate(JSON.stringify(host))
flush()
assert.notEqual(host.currentTurn, turn)
assert.ok(messages.some(m => m.type === 'turn-state'))
assert.equal(messages.some(m => m.type === 'game-state'), false)
assert.equal(guest.currentTurn, host.currentTurn)
assert.deepEqual(snapshot(guest), snapshot(host))
assert.deepEqual(snapshot(observer), snapshot(host))
// Duplicate transitions and old shared updates cannot reset the current turn.
const transition = messages.findLast(m => m.type === 'turn-state')
const currentPlayer = guest.players[1]
gr.emit('message', transition)
gr.emit('message', sharedMessage)
assert.equal(guest.players[1], currentPlayer)
assert.deepEqual(snapshot(guest), snapshot(host))
// Exercise era dealing, board wipes, objective references, and game completion.
function choose(player) {
  if (player.investigateCardCandidates) {
    const [chosenCard, discardedCard] = player.investigateCardCandidates
    player.selectMove({ action: 'choose-investigate-card', chosenCard, discardedCard })
  } else if (player.mode === 'choosing-investigate-card-reuse') {
    player.selectMove({ action: 'choose-investigate-card-reuse', era: 0 })
  }
}
let rounds = 0
while (!host.gameOver && rounds++ < 50) {
  choose(guest.players[1])
  guest.players[1].selectMove({ action: 'confirm-turn' })
  send()
  choose(host.players[0])
  host.players[0].selectMove({ action: 'confirm-turn' })
  host.emitSerializationUpdate(JSON.stringify(host))
  flush()
  assert.deepEqual(snapshot(guest), snapshot(host))
  assert.deepEqual(snapshot(observer), snapshot(host))
  assert.deepEqual(guest.players.map(p => p.coins), host.players.map(p => p.coins))
}
assert.equal(host.gameOver, true)
connections.forEach(connection => connection.dispose())

// A remote confirmation also commits the discard without a Treasure request.
rooms.length = 0
const secondHost = new GameState({ boardName: initialGame.boardName }, initialGame)
secondHost.players.forEach(p => p.replayMoves())
const secondGuest = clone(secondHost)
const secondHostRoom = new Room(1), secondGuestRoom = new Room(2)
const secondConnections = [
  connectPlayerSync(secondHost, secondHostRoom, () => {}),
  connectPlayerSync(secondGuest, secondGuestRoom, () => {}),
]
const secondPlayer = secondGuest.players[1]
const [choice, discard] = secondPlayer.investigateCardCandidates
const previousDiscards = secondHost.investigateDeck.discarded.length
secondPlayer.selectMove({ action: 'choose-investigate-card', chosenCard: choice, discardedCard: discard })
secondPlayer.selectMove({ action: 'confirm-turn' })
secondGuest.emitSerializationUpdate(JSON.stringify(secondGuest))
flush()
assert.equal(secondHost.investigateDeck.discarded.length, previousDiscards + 1)
assert.ok(secondHost.readyPlayers.includes(secondHost.players[1]))
secondConnections.forEach(connection => connection.dispose())
console.log('PASS: player replication, locked discards, shared updates preserve optimistic players, atomic turn sync, stale/unauthorized events ignored')
