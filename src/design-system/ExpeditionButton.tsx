import React, { ComponentProps, ElementType } from 'react'
import clsx from 'clsx'

export type ExpeditionButtonTone = 'primary' | 'secondary' | 'quiet' | 'danger'

export const expeditionButtonClasses = ({
  tone = 'secondary',
  compact = false,
}: {
  tone?: ExpeditionButtonTone
  compact?: boolean
} = {}) =>
  clsx(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition duration-200',
    'focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-slate-950',
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0',
    compact ? 'min-h-10 min-w-10 px-2.5 py-2' : 'min-h-11 px-4 py-2.5',
    tone === 'primary' &&
      'border-amber-100/30 bg-[#f5edcf] text-slate-950 shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:bg-amber-50',
    tone === 'secondary' &&
      'border-amber-100/25 bg-white/5 text-amber-50 hover:-translate-y-0.5 hover:border-amber-100/45 hover:bg-white/10',
    tone === 'quiet' && 'border-transparent bg-transparent text-amber-100/65 hover:bg-white/10 hover:text-amber-50',
    tone === 'danger' &&
      'border-red-300/25 bg-red-950/30 text-red-100 hover:border-red-300/45 hover:bg-red-900/45 hover:text-white',
  )

export interface ExpeditionButtonProps extends ComponentProps<'button'> {
  Icon?: ElementType
  tone?: ExpeditionButtonTone
  compact?: boolean
}

export const ExpeditionButton = ({
  className,
  Icon,
  tone = 'secondary',
  compact = false,
  children,
  type = 'button',
  ...props
}: ExpeditionButtonProps) => (
  <button className={clsx(expeditionButtonClasses({ tone, compact }), className)} type={type} {...props}>
    {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
    {children}
  </button>
)
