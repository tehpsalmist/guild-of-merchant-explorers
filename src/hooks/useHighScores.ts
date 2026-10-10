import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { BoardName, GameState } from '../game-logic/GameState'
import { BOARD_NAMES } from '../game-logic/room-setup'

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

export type HighScoreRecords = Partial<Record<BoardName, HighScore[]>>

const parseHighScores = (serialized: string | null): HighScoreRecords => {
  try {
    return serialized ? (JSON.parse(serialized) as HighScoreRecords) : {}
  } catch (e) {
    console.error('bad high scores:', e, serialized)
    return {}
  }
}

export const readHighScoreRecords = () => parseHighScores(localStorage.getItem(HIGH_SCORES_STORAGE_KEY))

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
 * The chart that results from adding `incoming` to `existing`. Scores already on the chart are skipped, and the
 * result keeps the original objects, so callers can tell which entries are new by reference.
 */
export const mergeHighScoreLists = (existing: HighScore[], incoming: HighScore[]) => {
  const newScores = incoming.filter(
    (highScore, index) =>
      getHighScoreRank(existing, highScore) === -1 && getHighScoreRank(incoming, highScore) === index,
  )

  // Stable sort keeps earlier scores ahead of later ties, so a new score must beat a tie to displace it.
  return [...existing, ...newScores].sort((a, b) => b.score - a.score).slice(0, HIGH_SCORE_LIMIT)
}

export const mergeHighScoreRecords = (incoming: HighScoreRecords) => {
  const records = readHighScoreRecords()
  const merged = { ...records }
  let changed = false

  for (const boardName of BOARD_NAMES) {
    const existing = records[boardName] ?? []
    const chart = mergeHighScoreLists(existing, incoming[boardName] ?? [])

    if (chart.length === existing.length && chart.every((highScore, index) => highScore === existing[index])) continue

    merged[boardName] = chart
    changed = true
  }

  if (!changed) return

  localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(merged))
  window.dispatchEvent(new CustomEvent(HIGH_SCORES_STORAGE_EVENT))
}

/**
 * Finished games are re-tallied every time they are restored, so recording must be idempotent:
 * scores already on the chart are skipped rather than added again.
 */
export const recordHighScores = (boardName: BoardName, highScores: HighScore[]) =>
  mergeHighScoreRecords({ [boardName]: highScores })

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length <= 10 && value.every((item) => typeof item === 'string' && item.length <= 64)

const parseHighScore = (value: unknown): HighScore | null => {
  if (!value || typeof value !== 'object') return null
  const { playerName, score, playerCount, objectiveIds, investigateCardIds } = value as Record<string, unknown>

  if (typeof playerName !== 'string' || !playerName.trim() || playerName.length > 100) return null
  if (typeof score !== 'number' || !Number.isFinite(score)) return null
  if (typeof playerCount !== 'number' || !Number.isInteger(playerCount) || playerCount < 1) return null
  if (!isStringList(objectiveIds) || !isStringList(investigateCardIds)) return null

  return { playerName, score, playerCount, objectiveIds, investigateCardIds }
}

/**
 * Scores shared by other players are untrusted: keep only well-formed entries on known boards, top 10 per board.
 */
export const parseHighScoreRecords = (value: unknown): HighScoreRecords | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const records = value as Record<string, unknown>
  const parsed: HighScoreRecords = {}

  for (const boardName of BOARD_NAMES) {
    const scores = records[boardName]
    if (!Array.isArray(scores)) continue

    const chart = scores
      .slice(0, 50)
      .flatMap((score) => parseHighScore(score) ?? [])
      .sort((a, b) => b.score - a.score)
      .slice(0, HIGH_SCORE_LIMIT)
    if (chart.length) parsed[boardName] = chart
  }

  return parsed
}

export const countHighScores = (records: HighScoreRecords) => {
  const charts = BOARD_NAMES.map((boardName) => records[boardName] ?? []).filter((chart) => chart.length)

  return { boards: charts.length, scores: charts.reduce((total, chart) => total + chart.length, 0) }
}

export const useHighScoreRecords = () => {
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

  return useMemo(() => parseHighScores(serialized), [serialized])
}

export const useHighScores = (boardName: BoardName) => {
  const records = useHighScoreRecords()

  return useMemo(() => records[boardName] ?? [], [records, boardName])
}
