import React, { ComponentProps } from 'react'
import { useGameState } from '../hooks/useGameState'
import { romanNumeral } from '../images'
import clsx from 'clsx'

export interface EraLabelProps extends ComponentProps<'div'> {}

export const EraLabel = ({ className = '', ...props }: EraLabelProps) => {
  const { gameState } = useGameState()

  const era = gameState.era

  return (
    <div className={`${className} flex items-center gap-2`} {...props}>
      <img className="h-14 max-w-4" src={romanNumeral.href} />
      {era > 0 && (
        <img className={clsx('h-14 max-w-4', era === 3 && 'translate-x-1 -rotate-12')} src={romanNumeral.href} />
      )}
      {era > 1 && (
        <img className={clsx('h-14 max-w-4', era === 3 && '-translate-x-1 rotate-12')} src={romanNumeral.href} />
      )}
    </div>
  )
}
