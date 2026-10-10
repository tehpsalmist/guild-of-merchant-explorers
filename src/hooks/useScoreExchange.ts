import { useEffect, useRef, useState } from 'react'
import type { P2PRoom, RoomMessage } from '../p2p-connection/p2p-room'
import {
  HighScoreRecords,
  countHighScores,
  parseHighScoreRecords,
  readHighScoreRecords,
} from './useHighScores'
import { notifyHighScoresRequested, notifyHighScoresShared, notifyScoreExchange } from '../components/ScoreExchangeToasts'

export const HIGH_SCORES_SHARE_MESSAGE = 'high-scores-share'
export const HIGH_SCORES_REQUEST_MESSAGE = 'high-scores-request'

export const EVERYONE = 'everyone'
/** A player's user id, or everyone in the room. */
export type ScoreExchangeRecipient = string

interface HighScoresShareMessageData {
  roomId: number
  scores: HighScoreRecords
}

interface HighScoresRequestMessageData {
  roomId: number
}

export interface SharedHighScores {
  id: string
  fromUserId: string
  scores: HighScoreRecords
  receivedAt: Date
  seen: boolean
}

export interface HighScoresRequest {
  id: string
  fromUserId: string
  receivedAt: Date
}

const isRoomMessage = (data: unknown, roomId: number): data is { roomId: number } =>
  !!data && typeof data === 'object' && (data as { roomId?: unknown }).roomId === roomId

/**
 * Trades high score charts between the players in a room. Nothing received is stored until the player
 * chooses to merge it, and only the latest share and request from each player is kept.
 */
export const useScoreExchange = (p2pRoom: P2PRoom | undefined, playerName: (userId: string) => string) => {
  const [shares, setShares] = useState<SharedHighScores[]>([])
  const [requests, setRequests] = useState<HighScoresRequest[]>([])
  const [comparingId, setComparingId] = useState<string | null>(null)
  const playerNameRef = useRef(playerName)
  playerNameRef.current = playerName

  const openComparison = (shareId: string) => {
    setComparingId(shareId)
    setShares((current) => current.map((share) => (share.id === shareId ? { ...share, seen: true } : share)))
  }

  const sendScores = (room: P2PRoom, recipient: ScoreExchangeRecipient) => {
    const data: HighScoresShareMessageData = { roomId: room.id, scores: readHighScoreRecords() }

    if (recipient === EVERYONE) room.broadcast(HIGH_SCORES_SHARE_MESSAGE, data)
    else if (!room.sendTo(recipient, HIGH_SCORES_SHARE_MESSAGE, data)) return false

    // Sharing answers any outstanding requests from the same players.
    setRequests((current) => current.filter((request) => recipient !== EVERYONE && request.fromUserId !== recipient))
    return true
  }

  const shareScores = (recipient: ScoreExchangeRecipient) => {
    if (!p2pRoom) return
    const target = recipient === EVERYONE ? 'everyone' : playerNameRef.current(recipient)

    if (sendScores(p2pRoom, recipient)) notifyScoreExchange(`Shared your high scores with ${target}`)
    else notifyScoreExchange(`Couldn't reach ${target}`, 'Their connection to the room is closed.', true)
  }

  const requestScores = (recipient: ScoreExchangeRecipient) => {
    if (!p2pRoom) return
    const target = recipient === EVERYONE ? 'everyone' : playerNameRef.current(recipient)
    const data: HighScoresRequestMessageData = { roomId: p2pRoom.id }
    const sent =
      recipient === EVERYONE
        ? p2pRoom.broadcast(HIGH_SCORES_REQUEST_MESSAGE, data)
        : p2pRoom.sendTo(recipient, HIGH_SCORES_REQUEST_MESSAGE, data)

    if (sent) notifyScoreExchange(`Asked ${target} for their high scores`, 'Their charts will land in your inbox.')
    else notifyScoreExchange(`Couldn't reach ${target}`, 'Their connection to the room is closed.', true)
  }

  const dismissRequest = (requestId: string) =>
    setRequests((current) => current.filter((request) => request.id !== requestId))

  const dismissShare = (shareId: string) => {
    setShares((current) => current.filter((share) => share.id !== shareId))
    setComparingId((current) => (current === shareId ? null : current))
  }

  // Latest callbacks for toasts, which outlive the render that created them.
  const actionsRef = useRef({ openComparison, shareScores, dismissRequest })
  actionsRef.current = { openComparison, shareScores, dismissRequest }

  useEffect(() => {
    if (!p2pRoom) return

    const receive = (message: RoomMessage) => {
      if (message.type === HIGH_SCORES_SHARE_MESSAGE) {
        if (!isRoomMessage(message.data, p2pRoom.id)) return
        const scores = parseHighScoreRecords((message.data as Partial<HighScoresShareMessageData>).scores)
        if (!scores) return

        const share: SharedHighScores = {
          id: message.id,
          fromUserId: message.userId,
          scores,
          receivedAt: new Date(),
          seen: false,
        }
        setShares((current) => [share, ...current.filter((other) => other.fromUserId !== message.userId)])
        notifyHighScoresShared({
          fromUserId: message.userId,
          fromName: playerNameRef.current(message.userId),
          ...countHighScores(scores),
          onCompare: () => actionsRef.current.openComparison(share.id),
        })
        return
      }

      if (message.type === HIGH_SCORES_REQUEST_MESSAGE) {
        if (!isRoomMessage(message.data, p2pRoom.id)) return

        const request: HighScoresRequest = { id: message.id, fromUserId: message.userId, receivedAt: new Date() }
        setRequests((current) => [request, ...current.filter((other) => other.fromUserId !== message.userId)])
        notifyHighScoresRequested({
          fromUserId: message.userId,
          fromName: playerNameRef.current(message.userId),
          hasScores: countHighScores(readHighScoreRecords()).scores > 0,
          onShare: () => actionsRef.current.shareScores(message.userId),
          onDismiss: () => actionsRef.current.dismissRequest(request.id),
        })
      }
    }

    p2pRoom.on('message', receive)
    return () => {
      p2pRoom.off('message', receive)
    }
  }, [p2pRoom])

  return {
    shares,
    requests,
    unreadCount: requests.length + shares.filter((share) => !share.seen).length,
    comparing: shares.find((share) => share.id === comparingId) ?? null,
    playerName,
    shareScores,
    requestScores,
    dismissRequest,
    dismissShare,
    openComparison,
    closeComparison: () => setComparingId(null),
  }
}

export type ScoreExchange = ReturnType<typeof useScoreExchange>
