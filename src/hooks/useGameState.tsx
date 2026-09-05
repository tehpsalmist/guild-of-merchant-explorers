import React, { ReactNode, createContext, useContext, useMemo } from 'react'
import { BoardName, GameState, PlayerInputs, SerializedGameState } from '../game-logic/GameState'

const GameStateContext = createContext<{ resetGame(): void; gameState: GameState } | null>(null)

export interface GameStateProviderProps {
  children: ReactNode
  name: BoardName
  playerData: PlayerInputs[]
  resetGame(): void
}

export const GameStateProvider = ({ children, name, playerData, resetGame }: GameStateProviderProps) => {
  const gameState = useMemo(() => {
    const savedState = localStorage.getItem('gome-serialized-game-state')

    if (savedState) {
      try {
        // Saved locally by GameState.toJSON; restoration failures fall back to a new game.
        const parsedState = JSON.parse(savedState) as SerializedGameState
        console.log(parsedState)
        const restoredGameState = new GameState({ boardName: parsedState.boardName }, parsedState)
        restoredGameState.players.forEach((p) => p.replayMoves())

        if (restoredGameState.gameOver) restoredGameState.tallyScores()

        return restoredGameState
      } catch (e) {
        console.error('bad game state:', e, savedState)
        // localStorage.removeItem('gome-serialized-game-state')
      }
    }

    return new GameState({ boardName: name, playerData })
  }, [name, playerData])

  if (!gameState) return null

  return <GameStateContext.Provider value={{ gameState, resetGame }}>{children}</GameStateContext.Provider>
}

export const useGameState = () => {
  const context = useContext(GameStateContext)
  if (!context) throw new Error('useGameState requires a GameStateProvider')
  return context
}
