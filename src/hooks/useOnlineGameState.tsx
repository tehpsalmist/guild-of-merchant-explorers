import React, { ReactNode, createContext, useContext } from 'react'
import type { GameState } from '../game-logic/GameState'
import type { P2PRoom } from '../p2p-connection/p2p-room'
import { useGameState } from './useGameState'

export const OnlineGameStateContext = createContext<{
  resetGame(): void
  gameState: GameState
  p2pRoom: P2PRoom
} | null>(null)

export interface OnlineGameStateProviderProps {
  children: ReactNode
  p2pRoom: P2PRoom
}

export const OnlineGameStateProvider = ({ children, p2pRoom }: OnlineGameStateProviderProps) => {
  const { gameState, resetGame } = useGameState()

  return (
    <OnlineGameStateContext.Provider value={{ gameState, p2pRoom, resetGame }}>
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
