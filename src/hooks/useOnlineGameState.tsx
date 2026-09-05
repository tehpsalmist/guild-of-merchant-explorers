import React, { ReactNode, createContext, useContext, useState } from 'react'
import { BoardName, GameState, PlayerInputs } from '../game-logic/GameState'
import type { P2PRoom } from '../p2p-connection/p2p-room'
import { GameStateContext } from './useGameState'

export const OnlineGameStateContext = createContext<{
  resetGame(): void
  gameState: GameState
  p2pRoom: P2PRoom
} | null>(null)

export interface OnlineGameStateProviderProps {
  children: ReactNode
  name: BoardName
  playerData: PlayerInputs[]
  p2pRoom: P2PRoom
  resetGame(): void
}

export const OnlineGameStateProvider = ({
  children,
  name,
  playerData,
  p2pRoom,
  resetGame,
}: OnlineGameStateProviderProps) => {
  // The host supplies a complete start snapshot. Room updates must not recreate
  // a running game or restore an unrelated game from the local save slot.
  const [gameState] = useState(() => new GameState({ boardName: name, playerData }))

  return (
    <OnlineGameStateContext.Provider value={{ gameState, p2pRoom, resetGame }}>
      <GameStateContext.Provider value={{ gameState, resetGame, storageKey: null }}>
        {children}
      </GameStateContext.Provider>
    </OnlineGameStateContext.Provider>
  )
}

export const useOnlineGameState = () => {
  const context = useContext(OnlineGameStateContext)
  if (!context) throw new Error('useOnlineGameState requires an OnlineGameStateProvider')
  return context
}

export const useOptionalOnlineGameState = () => useContext(OnlineGameStateContext)
