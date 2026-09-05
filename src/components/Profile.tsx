import React, { useEffect, useState } from 'react'
import { Main } from '../design-system/Main'
import { useNhostClient, useUserData } from '@nhost/react'
import { CheckIcon, EnvelopeIcon, IdentificationIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { ChangePassword } from './ChangePassword'
import { toast } from '@8thday/react'
import { UPDATE_USER } from '../graphql/mutations'
import { Avatar } from './Avatar'
import { ExpeditionButton } from '../design-system/ExpeditionButton'

export interface ProfileProps {}

export const Profile = (_: ProfileProps) => {
  const user = useUserData()
  const nhost = useNhostClient()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [savedDisplayName, setSavedDisplayName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.displayName) return
    setDisplayName(user.displayName)
    setSavedDisplayName(user.displayName)
  }, [user?.displayName])

  if (!user) return null

  const normalizedDisplayName = displayName.trim()
  const displayNameChanged = normalizedDisplayName !== savedDisplayName
  const canSaveDisplayName = normalizedDisplayName.length >= 3 && displayNameChanged && !saving

  return (
    <Main className="relative bg-slate-950 text-amber-50 selection:bg-amber-200 selection:text-slate-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 12% 6%, rgb(180 83 9 / 0.2), transparent 30rem), radial-gradient(circle at 88% 90%, rgb(30 64 175 / 0.18), transparent 34rem)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <header className="max-w-3xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-200/65">Peer account</p>
          <h1 className="font-serif text-4xl text-amber-50 sm:text-5xl">Your Connection Profile</h1>
          <p className="mt-3 text-sm leading-6 text-amber-100/60 sm:text-base">
            One identity for finding players and establishing peer-to-peer sessions across games that use this
            service.
          </p>
        </header>

        <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(16rem,0.7fr)_minmax(0,1.3fr)]">
          <aside className="rounded-2xl border border-amber-100/15 bg-black/25 p-5 text-center shadow-xl backdrop-blur-sm sm:p-6 lg:sticky lg:top-20">
            <Avatar
              className="mx-auto h-28 w-28 border-2 border-amber-100/25 bg-amber-50/10 shadow-xl"
              avatarUrl={user.avatarUrl}
            />
            <h2 className="mt-4 truncate font-serif text-2xl text-amber-50">{savedDisplayName}</h2>
            <p className="mt-1 break-all text-sm text-amber-100/45">{user.email}</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-100/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-amber-100/60">
              <IdentificationIcon className="h-4 w-4 text-amber-200" aria-hidden="true" />
              Shared player identity
            </span>
            <p className="mt-5 border-t border-amber-100/10 pt-5 text-left text-sm leading-6 text-amber-100/50">
              Games use this profile to help players recognize one another before a direct WebRTC session begins.
              Each game still owns its rooms, rules, and play experience.
            </p>
          </aside>

          <div className="space-y-5">
            <section className="rounded-2xl border border-amber-100/15 bg-black/25 p-5 shadow-xl backdrop-blur-sm sm:p-6" aria-labelledby="identity-settings-heading">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
                  <IdentificationIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl text-amber-50" id="identity-settings-heading">
                    Public Identity
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-amber-100/50">
                    Your display name and avatar can appear in games and to other players using the service.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-amber-100/10 bg-white/5 p-3.5">
                <div className="flex items-start gap-3">
                  <EnvelopeIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-200/70" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-100/40">Sign-in email</p>
                    <p className="mt-1 break-all text-sm font-bold text-amber-50">{user.email}</p>
                    <p className="mt-1 text-xs leading-5 text-amber-100/40">
                      Used for account access and recovery. It is not included in game player lists.
                    </p>
                  </div>
                </div>
              </div>

              <form
                onSubmit={async (event) => {
                  event.preventDefault()
                  if (!canSaveDisplayName) return

                  setSaving(true)
                  const result = await nhost.graphql.request(UPDATE_USER, {
                    userId: user.id,
                    set: { displayName: normalizedDisplayName },
                  })
                  setSaving(false)

                  if (result.error) {
                    return toast.error({
                      message: 'Trouble updating your display name',
                      description: Array.isArray(result.error) ? result.error[0].message : result.error.message,
                    })
                  }

                  setDisplayName(normalizedDisplayName)
                  setSavedDisplayName(normalizedDisplayName)
                  toast.success({ message: 'Display name updated.' })
                }}
              >
                <label className="block text-sm font-bold text-amber-50" htmlFor="profile-display-name">
                  Display name
                </label>
                <p className="mt-1 text-xs leading-5 text-amber-100/40" id="profile-display-name-description">
                  This is the name other players will see. Use at least three characters.
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    id="profile-display-name"
                    className="min-h-12 min-w-0 grow rounded-xl border border-amber-100/25 bg-amber-50/95 px-3 text-base text-slate-950 placeholder:text-slate-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    minLength={3}
                    autoComplete="nickname"
                    aria-describedby="profile-display-name-description"
                    required
                  />
                  <ExpeditionButton
                    className="w-full sm:w-auto"
                    tone="primary"
                    Icon={CheckIcon}
                    type="submit"
                    disabled={!canSaveDisplayName}
                  >
                    {saving ? 'Saving…' : displayNameChanged ? 'Save name' : 'Saved'}
                  </ExpeditionButton>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-amber-100/15 bg-black/25 p-5 shadow-xl backdrop-blur-sm sm:p-6" aria-labelledby="security-settings-heading">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
                  <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-serif text-2xl text-amber-50" id="security-settings-heading">
                    Account Security
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-amber-100/50">
                    Your password protects this account across every connected game.
                  </p>
                </div>
              </div>
              <ChangePassword dark />
            </section>
          </div>
        </div>
      </div>
    </Main>
  )
}
