import React, { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { SignedIn, SignedOut, useSignOut, useUserData } from '@nhost/react'
import { toast, useOnlyOnce } from '@8thday/react'
import clsx from 'clsx'
import { Notifications } from './Notifications'
import { Avatar } from './Avatar'
import { GameNavigationProvider } from '../hooks/useGameNavigation'
import {
  ArrowLeftStartOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
  GlobeAltIcon,
  MapIcon,
} from '@heroicons/react/24/outline'

const navActionClasses =
  'relative flex min-h-12 shrink-0 items-center justify-center gap-1.5 px-3 text-xs font-bold transition sm:gap-2 sm:text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-200'

const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
  clsx(
    navActionClasses,
    isActive
      ? 'bg-amber-100/10 text-amber-50 after:absolute after:inset-x-3 after:top-0 after:h-0.5 after:rounded-full after:bg-amber-200 sm:after:bottom-0 sm:after:top-auto'
      : 'text-amber-100/60 hover:bg-white/5 hover:text-amber-50',
  )

export interface AppProps {}

export const App = (_: AppProps) => {
  const [gameActive, setGameActive] = useState(false)
  const { signOut } = useSignOut()
  const user = useUserData()

  useOnlyOnce(() => toast.success({ message: `Welcome, ${user?.displayName}!` }), !!user)

  return (
    <GameNavigationProvider setGameActive={setGameActive}>
      {!gameActive && (
        <nav
          className="fixed bottom-0 z-40 flex h-12 w-full border-t border-amber-100/15 bg-slate-950/95 text-amber-50 shadow-2xl shadow-black/35 backdrop-blur-md sm:bottom-auto sm:top-0 sm:border-b sm:border-t-0"
          aria-label="Primary navigation"
        >
          <div className="mx-auto flex h-full w-full max-w-7xl items-stretch px-1 sm:px-4 lg:px-8">
            <NavLink to="local" className={navLinkClasses}>
              <MapIcon className="h-5 w-5" aria-hidden="true" />
              <span>Local</span>
            </NavLink>
            <NavLink to="online" className={navLinkClasses}>
              <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
              <span>Online</span>
            </NavLink>

            <div className="ml-auto flex items-stretch">
              <SignedOut>
                <NavLink to="online/login" className={navLinkClasses}>
                  <ArrowRightEndOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                  <span>Log in</span>
                </NavLink>
              </SignedOut>

              <SignedIn>
                <Notifications
                  className={clsx(
                    navActionClasses,
                    'text-amber-100/60 hover:bg-white/5 hover:text-amber-50',
                  )}
                />
                <NavLink to="profile" className={navLinkClasses} aria-label="Profile">
                  <Avatar
                    avatarUrl={user?.avatarUrl}
                    className="h-8 w-8 border border-amber-100/30 bg-amber-50/10"
                  />
                  <span className="hidden max-w-36 truncate sm:inline">{user?.displayName ?? 'Profile'}</span>
                </NavLink>
                <button
                  className={clsx(
                    navActionClasses,
                    'hidden text-amber-100/45 hover:bg-red-950/30 hover:text-red-100 sm:flex',
                  )}
                  onClick={() => signOut()}
                >
                  <ArrowLeftStartOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only xl:not-sr-only">Log out</span>
                </button>
              </SignedIn>
            </div>
          </div>
        </nav>
      )}
      <Outlet />
    </GameNavigationProvider>
  )
}
