import { useCallback, useSyncExternalStore } from 'react'

export const LOCAL_GAME_STORAGE_KEY = 'gome-serialized-game-state'
export const onlineGameStorageKey = (roomId: number) => `gome-serialized-game-state-online-${roomId}`

const GAME_STORAGE_EVENT = 'gome-game-storage-change'

export const saveStoredGame = (storageKey: string, serializedGame: string) => {
  localStorage.setItem(storageKey, serializedGame)
  window.dispatchEvent(new CustomEvent(GAME_STORAGE_EVENT, { detail: { storageKey } }))
}

export const removeStoredGame = (storageKey: string) => {
  localStorage.removeItem(storageKey)
  window.dispatchEvent(new CustomEvent(GAME_STORAGE_EVENT, { detail: { storageKey } }))
}

export const useStoredGame = (storageKey: string | null) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!storageKey) return () => {}

      const onStorage = (event: StorageEvent) => {
        if (event.storageArea === localStorage && event.key === storageKey) onStoreChange()
      }
      const onLocalStorage = (event: Event) => {
        if ((event as CustomEvent<{ storageKey: string }>).detail.storageKey === storageKey) onStoreChange()
      }

      window.addEventListener('storage', onStorage)
      window.addEventListener(GAME_STORAGE_EVENT, onLocalStorage)

      return () => {
        window.removeEventListener('storage', onStorage)
        window.removeEventListener(GAME_STORAGE_EVENT, onLocalStorage)
      }
    },
    [storageKey],
  )
  const getSnapshot = useCallback(() => (storageKey ? localStorage.getItem(storageKey) : null), [storageKey])

  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
