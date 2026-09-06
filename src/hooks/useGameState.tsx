import React, { ReactNode, createContext, useContext, useMemo } from 'react'
import { GameState, SerializedGameState } from '../game-logic/GameState'

export const GameStateContext = createContext<{
  resetGame(): void
  gameState: GameState
  storageKey: string | null
} | null>(null)

export interface GameStateProviderProps {
  children: ReactNode
  serializedGame: string
  autoAdvance?: boolean
  storageKey: string
  resetGame(): void
}

export const GameStateProvider = ({ children, serializedGame, storageKey, resetGame, autoAdvance = true }: GameStateProviderProps) => {
  const gameState = useMemo(() => {
    try {
      // Saved locally by GameState.toJSON.
      const parsedState = JSON.parse(serializedGame) as SerializedGameState
      const restoredGameState = new GameState({ boardName: parsedState.boardName }, parsedState)
      restoredGameState.autoAdvance = autoAdvance
      restoredGameState.players.forEach((p) => p.replayMoves())

      if (restoredGameState.gameOver) restoredGameState.tallyScores()

      return restoredGameState
    } catch (e) {
      console.error('bad game state:', e, serializedGame)
    }
  }, [serializedGame, autoAdvance])

  if (!gameState) return null

  return <GameStateContext.Provider value={{ gameState, resetGame, storageKey }}>{children}</GameStateContext.Provider>
}

export const useGameState = () => {
  const context = useContext(GameStateContext)
  if (!context) throw new Error('useGameState requires a GameStateProvider')
  return context
}
