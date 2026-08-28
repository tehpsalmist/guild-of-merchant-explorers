import { ApolloClient } from '@apollo/client'
import { NhostClient } from '@nhost/react'
import { EventEmitter } from 'events'
import SimplePeer, { SignalData } from 'simple-peer'
import { SEND_P2P_MESSAGE } from '../graphql/mutations'
import { LATEST_P2P_MESSAGE, P2P_MESSAGE_STREAM } from '../graphql/queries'

type PeerState = 'connecting' | 'connected' | 'reconnecting' | 'closed'

type SignalingMessage =
  | { type: 'probe' }
  | { type: 'ready'; nonce: string }
  | { type: 'start'; sessionId: string }
  | { type: 'signal'; sessionId: string; data: SignalData }

type PeerEvents = {
  message: [string]
  stream: [MediaStream]
  'handshake-state': [PeerState]
}

type ServerEvents = {
  message: [SignalingMessage]
  error: [Error]
}

export class P2PConnection extends EventEmitter<PeerEvents> {
  readonly isInitiator: boolean
  handshakeState: PeerState = 'connecting'
  private peer?: SimplePeer.Instance

  private readonly serverConnection: ServerConnection
  private readonly localStreams = new Set<MediaStream>()
  private sessionId?: string
  private readyNonce?: string
  private lastReadyNonce?: string
  private reconnectTimer?: ReturnType<typeof setTimeout>
  destroyed = false

  constructor(
    readonly myId: number,
    readonly memberId: number,
    readonly roomId: number,
    nhost: NhostClient,
    apollo: ApolloClient<any>,
  ) {
    super()

    this.isInitiator = myId < memberId
    this.serverConnection = new ServerConnection(nhost, apollo, myId, memberId, roomId)
    this.serverConnection.on('message', (message) => this.handleServerMessage(message))
    this.serverConnection.on('error', (error) => this.handleFailure(error))

    this.connectToCoordinator()
  }

  sendMessage(message: string) {
    if (!this.peer?.connected) {
      return this.connectToCoordinator()
    }

    this.peer.send(message)
  }

  addStream(stream: MediaStream) {
    if (this.localStreams.has(stream)) return

    this.localStreams.add(stream)
    if (this.peer && !this.peer.destroyed) this.peer.addStream(stream)
  }

  destroy() {
    if (this.destroyed) return

    this.destroyed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.updateHandshakeState('closed')
    this.destroyPeer()
    this.serverConnection.destroy()
    this.removeAllListeners()
  }

  private async connectToCoordinator() {
    try {
      await this.serverConnection.connect()
      if (this.destroyed) return

      if (this.isInitiator) {
        await this.serverConnection.send({ type: 'probe' })
      } else {
        await this.announceReady()
      }
    } catch (error) {
      this.handleFailure(error)
    }
  }

  private handleServerMessage(message: SignalingMessage) {
    if (this.destroyed) return

    switch (message.type) {
      case 'probe':
        if (!this.isInitiator) this.announceReady(false).catch((error) => this.handleFailure(error))
        break
      case 'ready':
        if (this.isInitiator && message.nonce !== this.lastReadyNonce) {
          this.lastReadyNonce = message.nonce
          this.startSession()
        }
        break
      case 'start':
        if (!this.isInitiator) {
          this.sessionId = message.sessionId
          this.setupPeer()
        }
        break
      case 'signal':
        if (message.sessionId !== this.sessionId || !this.peer) return

        try {
          this.peer.signal(message.data)
        } catch (error) {
          this.handleFailure(error)
        }
        break
    }
  }

  private async announceReady(useNewNonce = true) {
    if (useNewNonce || !this.readyNonce) this.readyNonce = createId()
    await this.serverConnection.send({ type: 'ready', nonce: this.readyNonce })
  }

  private async startSession() {
    const sessionId = createId()
    this.sessionId = sessionId

    try {
      // Persist the session marker before SimplePeer starts emitting signals.
      await this.serverConnection.send({ type: 'start', sessionId })
      if (this.destroyed || this.sessionId !== sessionId) return
      this.setupPeer()
    } catch (error) {
      this.handleFailure(error)
    }
  }

  private setupPeer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
    this.destroyPeer()
    this.updateHandshakeState(this.handshakeState === 'connecting' ? 'connecting' : 'reconnecting')

    const peer = new SimplePeer({
      initiator: this.isInitiator,
      streams: [...this.localStreams],
    })
    this.peer = peer
    peer.setDefaultEncoding('utf-8')

    peer.on('signal', (data) => {
      if (peer !== this.peer || !this.sessionId) return
      this.serverConnection
        .send({ type: 'signal', sessionId: this.sessionId, data })
        .catch((error) => this.handleFailure(error))
    })

    peer.on('connect', () => {
      if (peer === this.peer) this.updateHandshakeState('connected')
    })

    peer.on('data', (data) => {
      if (peer !== this.peer) return

      try {
        const message = JSON.parse(data.toString())
        if (message.type === 'text-message' && typeof message.data === 'string') this.emit('message', message.data)
      } catch {
        // Ignore data that does not use this application's message format.
      }
    })

    peer.on('stream', (stream) => {
      if (peer === this.peer) this.emit('stream', stream)
    })

    peer.on('error', (error) => {
      if (peer === this.peer) this.handleFailure(error)
    })

    peer.on('close', () => {
      if (peer === this.peer) this.scheduleReconnect()
    })
  }

  private destroyPeer() {
    const peer = this.peer
    this.peer = undefined
    if (!peer) return

    peer.removeAllListeners()
    if (!peer.destroyed) peer.destroy()
  }

  private handleFailure(error: unknown) {
    if (this.destroyed) return
    console.error(`P2P connection to member ${this.memberId} failed`, error)
    this.scheduleReconnect()
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectTimer) return

    this.destroyPeer()
    this.sessionId = undefined
    this.updateHandshakeState('reconnecting')

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      if (this.isInitiator) this.lastReadyNonce = undefined
      this.connectToCoordinator()
    }, 1000)
  }

  private updateHandshakeState(state: PeerState) {
    if (this.handshakeState === state) return
    this.handshakeState = state
    this.emit('handshake-state', state)
  }
}

class ServerConnection extends EventEmitter<ServerEvents> {
  private subscription?: { unsubscribe(): void; closed?: boolean }
  private connectPromise?: Promise<void>
  private sendQueue: Promise<void> = Promise.resolve()
  private destroyed = false

  constructor(
    private readonly nhost: NhostClient,
    private readonly apollo: ApolloClient<any>,
    private readonly myId: number,
    private readonly memberId: number,
    private readonly roomId: number,
  ) {
    super()
  }

  connect() {
    if (this.destroyed) return Promise.reject(new Error('Signaling connection is closed'))
    if (this.subscription && !this.subscription.closed) return Promise.resolve()
    if (this.connectPromise) return this.connectPromise

    this.connectPromise = this.openSubscription().finally(() => {
      this.connectPromise = undefined
    })
    return this.connectPromise
  }

  send(message: SignalingMessage) {
    const request = this.sendQueue.then(async () => {
      if (this.destroyed) throw new Error('Signaling connection is closed')

      const { error } = await this.nhost.graphql.request(SEND_P2P_MESSAGE, {
        message,
        senderId: this.myId,
        receiverId: this.memberId,
        roomId: this.roomId,
      })
      if (error) throw error
    })

    // Keep later messages moving even if one request fails.
    this.sendQueue = request.catch(() => {})
    return request
  }

  destroy() {
    this.destroyed = true
    this.subscription?.unsubscribe()
    this.subscription = undefined
    this.removeAllListeners()
  }

  private async openSubscription() {
    const { data, error } = await this.nhost.graphql.request(LATEST_P2P_MESSAGE, {
      roomId: this.roomId,
      sendingMemberId: this.memberId,
      receivingMemberId: this.myId,
    })
    if (error) throw error
    if (this.destroyed) return

    this.subscription = this.apollo
      .subscribe({
        query: P2P_MESSAGE_STREAM,
        variables: {
          roomId: this.roomId,
          sendingMemberId: this.memberId,
          receivingMemberId: this.myId,
          latestId: data?.p2p_message?.[0]?.id ?? 0,
        },
      })
      .subscribe({
        next: (result) => {
          const rows = result.data?.p2p_message_stream ?? []
          for (const row of rows) {
            if (isSignalingMessage(row.message)) this.emit('message', row.message)
          }
        },
        error: (subscriptionError) => {
          this.subscription = undefined
          this.emit('error', toError(subscriptionError))
        },
      })
  }
}

function isSignalingMessage(value: unknown): value is SignalingMessage {
  if (!value || typeof value !== 'object' || !('type' in value)) return false
  const message = value as Record<string, unknown>

  switch (message.type) {
    case 'probe':
      return true
    case 'ready':
      return typeof message.nonce === 'string'
    case 'start':
      return typeof message.sessionId === 'string'
    case 'signal':
      return typeof message.sessionId === 'string' && !!message.data && typeof message.data === 'object'
    default:
      return false
  }
}

function toError(error: unknown) {
  return error instanceof Error ? error : new Error(String(error))
}

function createId() {
  return crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-')
}
