import React, { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react'
import type { GameState } from '../game-logic/GameState'
import type { P2PRoom, RoomPeer } from '../p2p-connection/p2p-room'
import { useGameState } from './useGameState'
import { GAME_STATE_MESSAGE, type GameStateMessageData } from '../game-logic/room-setup'
import { connectPlayerSync } from '../p2p-connection/player-sync'

export const OnlineGameStateContext = createContext<{
  resetGame(): void
  gameState: GameState
  p2pRoom: P2PRoom
  drawTreasure(): void
  drawingTreasure: boolean
} | null>(null)

export interface OnlineGameStateProviderProps {
  children: ReactNode
  p2pRoom: P2PRoom
}

export const OnlineGameStateProvider = ({ children, p2pRoom }: OnlineGameStateProviderProps) => {
  const { gameState, resetGame } = useGameState()
  const sync = useRef<ReturnType<typeof connectPlayerSync> | null>(null)
  const [drawingTreasure, setDrawingTreasure] = useState(false)

  useEffect(() => {
    setDrawingTreasure(false)
    const connection = connectPlayerSync(gameState, p2pRoom, setDrawingTreasure)
    sync.current = connection
    return () => {
      connection.dispose()
      sync.current = null
    }
  }, [gameState, p2pRoom])

  useEffect(() => {
    const currentMember = p2pRoom.members.find((member) => member.id === p2pRoom.myId)
    if (currentMember?.player_id !== p2pRoom.host_id) return
    const syncedPeers = new Set<string>()

    const sendGameState = ({ userId, state }: RoomPeer) => {
      if (state !== 'connected') {
        syncedPeers.delete(userId)
        return
      }
      if (syncedPeers.has(userId)) return
      syncedPeers.add(userId)

      const gameStateMessage: GameStateMessageData = {
        roomId: p2pRoom.id,
        serializedGame: JSON.stringify(gameState),
      }
      p2pRoom.sendTo(userId, GAME_STATE_MESSAGE, gameStateMessage)
    }

    p2pRoom.on('peer-state', sendGameState)
    p2pRoom.getPeers().forEach(sendGameState)

    return () => {
      p2pRoom.off('peer-state', sendGameState)
    }
  }, [gameState, p2pRoom])

  return (
    <OnlineGameStateContext.Provider value={{ gameState, p2pRoom, resetGame, drawingTreasure, drawTreasure: () => sync.current?.drawTreasure() }}>
      {children}
    </OnlineGameStateContext.Provider>
  )
}

export const useOnlineGameState = () => {
  const context = useContext(OnlineGameStateContext)
  if (!context) throw new Error('useOnlineGameState requires an OnlineGameStateProvider')
  return context
}

export const useOptionalOnlineGameState = () => useContext(OnlineGameStateContext)
