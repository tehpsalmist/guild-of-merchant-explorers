import React, { ReactNode, createContext, useContext, useMemo } from 'react'
import { GameState, SerializedGameState } from '../game-logic/GameState'

export const GameStateContext = createContext<{
  resetGame(): void
  gameState: GameState
  storageKey: string | null
} | null>(null)

export interface GameStateProviderProps {
  children: ReactNode
  storageKey: string
  resetGame(): void
}

export const GameStateProvider = ({ children, storageKey, resetGame }: GameStateProviderProps) => {
  const gameState = useMemo(() => {
    const savedState = localStorage.getItem(storageKey)

    if (savedState) {
      try {
        // Saved locally by GameState.toJSON.
        const parsedState = JSON.parse(savedState) as SerializedGameState
        const restoredGameState = new GameState({ boardName: parsedState.boardName }, parsedState)
        restoredGameState.players.forEach((p) => p.replayMoves())

        if (restoredGameState.gameOver) restoredGameState.tallyScores()

        return restoredGameState
      } catch (e) {
        console.error('bad game state:', e, savedState)
      }
    }
  }, [storageKey])

  if (!gameState) return null

  return <GameStateContext.Provider value={{ gameState, resetGame, storageKey }}>{children}</GameStateContext.Provider>
}

export const useGameState = () => {
  const context = useContext(GameStateContext)
  if (!context) throw new Error('useGameState requires a GameStateProvider')
  return context
}
