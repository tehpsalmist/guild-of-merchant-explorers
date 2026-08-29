import React, { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext } from 'react'

const GameNavigationContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null)

export const GameNavigationProvider = ({
  children,
  setGameActive,
}: PropsWithChildren<{ setGameActive: Dispatch<SetStateAction<boolean>> }>) => (
  <GameNavigationContext.Provider value={setGameActive}>{children}</GameNavigationContext.Provider>
)

export const useGameNavigation = () => {
  const setGameActive = useContext(GameNavigationContext)

  if (!setGameActive) throw new Error('useGameNavigation must be used inside a GameNavigationProvider')

  return setGameActive
}
