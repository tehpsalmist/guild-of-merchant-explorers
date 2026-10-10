import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { BoardName, GameState } from '../game-logic/GameState'

export const HIGH_SCORES_STORAGE_KEY = 'gome-high-scores'
export const HIGH_SCORE_LIMIT = 10

const HIGH_SCORES_STORAGE_EVENT = 'gome-high-scores-change'

export interface HighScore {
  playerName: string
  score: number
  playerCount: number
  objectiveIds: string[]
  investigateCardIds: string[]
}

type HighScoreRecords = Partial<Record<BoardName, HighScore[]>>

const parseHighScores = (serialized: string | null): HighScoreRecords => {
  try {
    return serialized ? (JSON.parse(serialized) as HighScoreRecords) : {}
  } catch (e) {
    console.error('bad high scores:', e, serialized)
    return {}
  }
}

export const isSameHighScore = (a: HighScore, b: HighScore) =>
  a.playerName === b.playerName &&
  a.score === b.score &&
  a.playerCount === b.playerCount &&
  a.objectiveIds.join() === b.objectiveIds.join() &&
  a.investigateCardIds.join() === b.investigateCardIds.join()

/**
 * Zero-based position of a score on its board's chart, or -1 when it didn't make the cut.
 */
export const getHighScoreRank = (highScores: HighScore[], highScore: HighScore) =>
  highScores.findIndex((candidate) => isSameHighScore(candidate, highScore))

export const getHighScoresForGame = (gameState: GameState): HighScore[] =>
  gameState.players.map((player) => ({
    playerName: player.displayName,
    score: player.coins,
    playerCount: gameState.players.length,
    objectiveIds: gameState.objectives.map(({ id }) => id),
    investigateCardIds: player.investigateCards.keptCards.map(({ id }) => id),
  }))

/**
 * Finished games are re-tallied every time they are restored, so recording must be idempotent:
 * scores already on the chart are skipped rather than added again.
 */
export const recordHighScores = (boardName: BoardName, highScores: HighScore[]) => {
  const records = parseHighScores(localStorage.getItem(HIGH_SCORES_STORAGE_KEY))
  const boardScores = records[boardName] ?? []
  const newScores = highScores.filter((highScore) => getHighScoreRank(boardScores, highScore) === -1)
  // Stable sort keeps earlier scores ahead of later ties, so a new score must beat a tie to displace it.
  const chart = [...boardScores, ...newScores].sort((a, b) => b.score - a.score).slice(0, HIGH_SCORE_LIMIT)

  if (!newScores.some((highScore) => chart.includes(highScore))) return

  localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify({ ...records, [boardName]: chart }))
  window.dispatchEvent(new CustomEvent(HIGH_SCORES_STORAGE_EVENT))
}

export const useHighScores = (boardName: BoardName) => {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === HIGH_SCORES_STORAGE_KEY) onStoreChange()
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener(HIGH_SCORES_STORAGE_EVENT, onStoreChange)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(HIGH_SCORES_STORAGE_EVENT, onStoreChange)
    }
  }, [])
  const serialized = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(HIGH_SCORES_STORAGE_KEY),
    () => null,
  )

  return useMemo(() => parseHighScores(serialized)[boardName] ?? [], [serialized, boardName])
}
