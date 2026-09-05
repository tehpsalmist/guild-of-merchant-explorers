import { useEffect, useRef, useState } from 'react'
import type { RoomSubSubscription } from '../graphql/types.generated'
import type { P2PRoom, RoomMessage } from '../p2p-connection/p2p-room'
import type { BoardName } from '../game-logic/GameState'
import {
  GAME_SETUP_COLOR_MESSAGE,
  GAME_SETUP_MESSAGE,
  incorporatePlayerColor,
  isGameSetupColorMessageData,
  isGameSetupMessageData,
  type GameSetupMessageData,
  type RoomSetup,
} from '../game-logic/room-setup'

type Room = NonNullable<RoomSubSubscription['room_by_pk']>

export const useRoomSetup = (
  room: Room | null | undefined,
  requestedRoomId: number,
  userId: string | undefined,
  p2pRoom: P2PRoom | undefined,
) => {
  const [roomSetup, setRoomSetup] = useState<RoomSetup>({ roomId: requestedRoomId, boardName: '', colors: {} })
  const [colorError, setColorError] = useState<string>()
  const roomSetupRef = useRef(roomSetup)
  const setup =
    roomSetup.roomId === requestedRoomId
      ? roomSetup
      : { roomId: requestedRoomId, boardName: '' as const, colors: {} }
  roomSetupRef.current = setup

  const commitSetup = (nextSetup: RoomSetup) => {
    roomSetupRef.current = nextSetup
    setRoomSetup(nextSetup)
  }

  useEffect(() => {
    if (!p2pRoom || !room) return

    const receiveSetup = (message: RoomMessage) => {
      const isHost = room.host_id === userId
      const hostMember = room.members.find((member) => member.player_id === room.host_id)

      if (!isHost && message.type === GAME_SETUP_MESSAGE) {
        if (message.memberId !== hostMember?.id || !isGameSetupMessageData(message.data, room.id)) return
        commitSetup(message.data.setup)
        if (message.data.rejectedColor?.memberId === p2pRoom.myId) {
          setColorError(message.data.rejectedColor.reason)
        }
        return
      }

      if (!isHost || message.type !== GAME_SETUP_COLOR_MESSAGE || !isGameSetupColorMessageData(message.data)) return
      const currentSetup = roomSetupRef.current
      const result = incorporatePlayerColor(room, currentSetup, message.memberId, message.data.color)
      if (result.error) {
        const response: GameSetupMessageData = {
          setup: currentSetup,
          rejectedColor: { memberId: message.memberId, color: message.data.color, reason: result.error },
        }
        p2pRoom.sendTo(message.userId, GAME_SETUP_MESSAGE, response)
        return
      }

      commitSetup(result.setup)
    }

    p2pRoom.on('message', receiveSetup)
    return () => {
      p2pRoom.off('message', receiveSetup)
    }
  }, [p2pRoom, room, userId])

  // The host owns the canonical snapshot. Sending whenever it changes also
  // queues the current setup for peers whose connection is still opening.
  useEffect(() => {
    if (!p2pRoom || !room || room.host_id !== userId || roomSetup.roomId !== room.id) return
    p2pRoom.broadcast<GameSetupMessageData>(GAME_SETUP_MESSAGE, { setup: roomSetup })
  }, [p2pRoom, room, roomSetup, userId])

  const chooseBoard = (boardName: BoardName) => {
    if (!room || room.host_id !== userId) return
    commitSetup({ ...setup, boardName })
  }

  const chooseColor = (memberId: number, color: string) => {
    if (!room || !p2pRoom) return
    const currentMember = room.members.find((member) => member.player_id === userId && member.invite_accepted)
    if (!currentMember) return

    if (room.host_id === userId) {
      const result = incorporatePlayerColor(room, setup, memberId, color)
      if (!result.error) commitSetup(result.setup)
      return
    }

    if (memberId !== currentMember.id) return
    setColorError(undefined)
    commitSetup({ ...setup, colors: { ...setup.colors, [memberId]: color } })
    p2pRoom.sendTo(room.host_id, GAME_SETUP_COLOR_MESSAGE, { color })
  }

  return { setup, colorError, chooseBoard, chooseColor }
}
