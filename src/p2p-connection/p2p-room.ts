import type { RoomSubSubscription } from '../graphql/types.generated'
import { ApolloClient } from '@apollo/client'
import { NhostClient } from '@nhost/react'
import { EventEmitter } from 'events'
import { CLAIM_ROOM_SESSION, HEARTBEAT_ROOM_SESSION, RELEASE_ROOM_SESSION } from '../graphql/mutations'
import { PeerMessage, PeerState, P2PConnection } from './p2p-connection'

type Room = NonNullable<RoomSubSubscription['room_by_pk']>
export type RoomMember = Room['members'][number]

export interface RoomPeer {
  userId: string
  memberId: number
  state: PeerState
}

export interface RoomMessage<T = unknown> extends PeerMessage<T> {
  userId: string
  memberId: number
}

type RoomEvents = {
  message: [RoomMessage]
  'peer-state': [RoomPeer]
  'session-lost': [string]
}

const HEARTBEAT_MS = 10_000
const CLIENT_INSTANCE_KEY = 'get-a-room-client-instance-id'

export class RoomSessionError extends Error {}

export class P2PRoom extends EventEmitter<RoomEvents> implements Room {
  readonly connections = new Map<number, P2PConnection>()
  id: number
  name: Room['name']
  host_id: string
  created_at: string
  is_public: boolean
  members: RoomMember[]
  readonly myId: number
  readonly sessionId: string

  private heartbeatTimer?: ReturnType<typeof setInterval>
  private readonly seenMessageIds = new Set<string>()
  private destroyed = false

  static async connect(room: Room, userId: string, nhost: NhostClient, apollo: ApolloClient<object>) {
    const { data, error } = await nhost.graphql.request(CLAIM_ROOM_SESSION, {
      roomId: room.id,
      clientInstanceId: getClientInstanceId(),
    })
    const claim = data?.claimRoomSession

    if (error || !claim?.success || !claim.memberId || !claim.sessionId) {
      throw new RoomSessionError(claim?.error ?? 'Unable to connect to this room.')
    }

    const localMember = room.members.find((member) => member.player_id === userId)
    if (!localMember?.invite_accepted || localMember.id !== claim.memberId) {
      await nhost.graphql.request(RELEASE_ROOM_SESSION, { roomId: room.id, sessionId: claim.sessionId })
      throw new RoomSessionError('Your room membership could not be verified.')
    }

    return new P2PRoom(room, localMember.id, claim.sessionId, nhost, apollo)
  }

  private constructor(
    room: Room,
    myId: number,
    sessionId: string,
    private readonly nhost: NhostClient,
    private readonly apollo: ApolloClient<object>,
  ) {
    super()
    this.id = room.id
    this.name = room.name
    this.host_id = room.host_id
    this.created_at = room.created_at
    this.is_public = room.is_public
    this.members = room.members ?? []
    this.myId = myId
    this.sessionId = sessionId

    this.syncMembers(this.members)
    this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARTBEAT_MS)
  }

  syncMembers(members: RoomMember[]) {
    if (this.destroyed) return

    const previousMembers = this.members
    this.members = members
    if (!members.some((member) => member.id === this.myId && member.invite_accepted)) {
      this.emit('session-lost', 'You are no longer an accepted member of this room.')
      this.destroyInternal(false)
      return
    }

    const acceptedRemoteMembers = new Map(
      members
        .filter((member) => member.id !== this.myId && member.invite_accepted)
        .map((member) => [member.id, member]),
    )

    for (const [memberId, connection] of this.connections) {
      if (acceptedRemoteMembers.has(memberId)) continue
      const userId = previousMembers.find((member) => member.id === memberId)?.player_id ?? ''
      connection.destroy()
      this.connections.delete(memberId)
      this.emit('peer-state', { userId, memberId, state: 'closed' })
    }

    for (const member of acceptedRemoteMembers.values()) {
      if (this.connections.has(member.id)) continue

      const connection = new P2PConnection(this.myId, member.id, this.id, this.sessionId, this.nhost, this.apollo)
      connection.on('message', (message) => this.receive(member, message))
      connection.on('handshake-state', (state) => {
        this.emit('peer-state', { userId: member.player_id, memberId: member.id, state })
      })
      this.connections.set(member.id, connection)
      this.emit('peer-state', { userId: member.player_id, memberId: member.id, state: connection.handshakeState })
    }
  }

  getPeers(): RoomPeer[] {
    return [...this.connections.entries()].map(([memberId, connection]) => ({
      userId: this.userIdFor(memberId),
      memberId,
      state: connection.handshakeState,
    }))
  }

  getPeer(userId: string) {
    return this.getPeers().find((peer) => peer.userId === userId)
  }

  sendTo<T>(userId: string, type: string, data: T) {
    const member = this.members.find((candidate) => candidate.player_id === userId)
    const connection = member && this.connections.get(member.id)
    if (!connection) return undefined
    const message = { id: createId(), type, data }
    connection.sendMessage(message)
    return message.id
  }

  broadcast<T>(type: string, data: T) {
    const message = { id: createId(), type, data }
    for (const connection of this.connections.values()) connection.sendMessage(message)
    return message.id
  }

  onMessages(listener: (message: { id: number; message: string }) => void) {
    const receiveText = (message: RoomMessage) => {
      if (message.type === 'text-message' && typeof message.data === 'string') {
        listener({ id: message.memberId, message: message.data })
      }
    }
    this.on('message', receiveText)
    return () => this.off('message', receiveText)
  }

  sendMessages(message: string) {
    this.broadcast('text-message', message)
  }

  destroy() {
    this.destroyInternal(true)
  }

  private receive(member: RoomMember, message: PeerMessage) {
    if (this.seenMessageIds.has(message.id)) return
    this.seenMessageIds.add(message.id)
    if (this.seenMessageIds.size > 500) this.seenMessageIds.delete(this.seenMessageIds.values().next().value!)
    this.emit('message', { ...message, userId: member.player_id, memberId: member.id })
  }

  private async heartbeat() {
    const { data, error } = await this.nhost.graphql.request(HEARTBEAT_ROOM_SESSION, {
      roomId: this.id,
      sessionId: this.sessionId,
    })

    if (this.destroyed || error || data?.heartbeatRoomSession?.success) return
    const reason = data?.heartbeatRoomSession?.error ?? 'This room connection is no longer active.'
    this.emit('session-lost', reason)
    this.destroyInternal(false)
  }

  private destroyInternal(releaseSession: boolean) {
    if (this.destroyed) return
    this.destroyed = true
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    for (const connection of this.connections.values()) connection.destroy()
    this.connections.clear()

    if (releaseSession) {
      this.nhost.graphql.request(RELEASE_ROOM_SESSION, { roomId: this.id, sessionId: this.sessionId })
    }
    this.removeAllListeners()
  }

  private userIdFor(memberId: number) {
    return this.members.find((member) => member.id === memberId)?.player_id ?? ''
  }
}

function getClientInstanceId() {
  const existing = sessionStorage.getItem(CLIENT_INSTANCE_KEY)
  if (existing) return existing
  const id = createId()
  sessionStorage.setItem(CLIENT_INSTANCE_KEY, id)
  return id
}

function createId() {
  if (crypto.randomUUID) return crypto.randomUUID()

  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
