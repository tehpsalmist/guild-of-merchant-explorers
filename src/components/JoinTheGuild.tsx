import { UserGroupIcon } from '@heroicons/react/24/outline'
import React, { ComponentProps } from 'react'
import { useHasJoined } from '../hooks/useHasJoined'
import clsx from 'clsx'
import { ExpeditionButton } from '../design-system/ExpeditionButton'

export interface JoinTheGuildProps extends ComponentProps<'div'> {}

export const JoinTheGuild = ({ className = '', ...props }: JoinTheGuildProps) => {
  const { gameName, joinGame } = useHasJoined()

  return (
    <div className={clsx(className, 'w-full px-4 py-8 text-amber-50')} {...props}>
      <section className="mx-auto max-w-lg rounded-2xl border border-amber-100/20 bg-black/25 p-6 text-center shadow-2xl backdrop-blur-sm sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
          <UserGroupIcon className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.3em] text-amber-200/60">Guild hall access</p>
        <h1 className="mt-2 font-serif text-4xl text-amber-50">Join {gameName}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-amber-100/55 sm:text-base">
          Entering the online guild hall lets other players see you, invite you to their tables, and accept invitations
          from you.
        </p>
        <p className="mt-3 text-xs text-amber-100/35">You can leave the guild hall at any time.</p>
        <ExpeditionButton className="mt-6 w-full sm:w-auto" tone="primary" Icon={UserGroupIcon} onClick={joinGame}>
          Enter the guild hall
        </ExpeditionButton>
      </section>
    </div>
  )
}
