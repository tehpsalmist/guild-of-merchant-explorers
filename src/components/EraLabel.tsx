import React, { ComponentProps } from 'react'
import { useGameState } from '../hooks/useGameState'
import { romanNumeral } from '../images'
import clsx from 'clsx'

export interface EraLabelProps extends ComponentProps<'div'> {}

export const EraLabel = ({ className = '', ...props }: EraLabelProps) => {
  const { gameState } = useGameState()

  const era = gameState.era
  const numeralClasses = 'h-14 max-w-4 drop-shadow-[0_2px_2px_rgba(15,23,42,0.3)]'

  return (
    <div
      className={clsx(
        className,
        'flex items-center gap-2 rounded-2xl border border-amber-950/15 bg-amber-50/70 px-3 py-2 shadow-[0_4px_14px_rgba(2,6,23,0.4),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-sm',
      )}
      {...props}
    >
      <img className={numeralClasses} src={romanNumeral.href} alt="" aria-hidden="true" draggable={false} />
      {era > 0 && (
        <img
          className={clsx(numeralClasses, era === 3 && 'translate-x-1 -rotate-12')}
          src={romanNumeral.href}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
      {era > 1 && (
        <img
          className={clsx(numeralClasses, era === 3 && '-translate-x-1 rotate-12')}
          src={romanNumeral.href}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}
    </div>
  )
}
