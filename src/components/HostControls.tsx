import type { GetRoomsSubscription } from '../graphql/types.generated'
import { useNhostClient } from '@nhost/react'
import React, { ComponentProps, useState } from 'react'
import { Modal, toast } from '@8thday/react'
import { EyeIcon, EyeSlashIcon, PaperAirplaneIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getGraphqlErrorMessage } from '../graphql/utils'
import clsx from 'clsx'
import { usePlayerList } from '../hooks/usePlayerList'
import { CLOSE_ROOM, DISINVITE_PLAYER, INVITE_PLAYER, UPDATE_ROOM } from '../graphql/mutations'
import { Avatar } from './Avatar'
import { ExpeditionButton } from '../design-system/ExpeditionButton'

export interface HostControlsProps extends ComponentProps<'div'> {
  room: GetRoomsSubscription['room'][number]
  showLabels?: boolean
  showClose?: boolean
}

export const HostControls = ({
  className = '',
  showLabels = false,
  showClose = true,
  room,
  ...props
}: HostControlsProps) => {
  const nhost = useNhostClient()
  const { list, userLookup } = usePlayerList()
  const availablePlayers = list.filter(
    (user) => user.id !== room.host_id && room.members.every((member) => member.player_id !== user.id),
  )
  const [invitingUsers, setInvitingUsers] = useState(false)

  return (
    <div className={clsx(className, 'flex flex-wrap gap-2')} {...props}>
      <ExpeditionButton
        compact={!showLabels}
        Icon={UserGroupIcon}
        onClick={() => setInvitingUsers(true)}
        aria-label="Manage players"
        title="Manage players"
      >
        {showLabels && 'Manage players'}
      </ExpeditionButton>
      <ExpeditionButton
        compact={!showLabels}
        Icon={room.is_public ? EyeIcon : EyeSlashIcon}
        onClick={async () => {
          const is_public = !room.is_public
          const res = await nhost.graphql.request(UPDATE_ROOM, { id: room.id, set: { is_public } })

          if (res.error) {
            return toast.error({
              message: 'Trouble updating table visibility...',
              description: getGraphqlErrorMessage(res.error),
            })
          }

          toast.success({ message: `Table is now ${is_public ? 'public' : 'private'}.` })
        }}
        aria-label={`Make table ${room.is_public ? 'private' : 'public'}`}
        title={`Make table ${room.is_public ? 'private' : 'public'}`}
      >
        {showLabels && `Make ${room.is_public ? 'private' : 'public'}`}
      </ExpeditionButton>
      {showClose && (
        <ExpeditionButton
          tone="danger"
          compact={!showLabels}
          Icon={XMarkIcon}
          onClick={async () => {
            if (!confirm('Folding up this table will lose any current game progress. Continue?')) return

            const res = await nhost.graphql.request(CLOSE_ROOM, { id: room.id })
            if (res.error) {
              toast.error({
                message: 'Trouble folding up the table...',
                description: getGraphqlErrorMessage(res.error),
              })
            }
          }}
          aria-label="Close table"
          title="Close table"
        >
          {showLabels && 'Close table'}
        </ExpeditionButton>
      )}

      {invitingUsers && (
        <Modal
          portal
          onClose={() => setInvitingUsers(false)}
          overlayClasses="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          bgClass="bg-slate-950/90"
          className="w-full max-w-4xl overflow-hidden! border border-amber-100/20 bg-slate-950! p-0! text-amber-50 shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`manage-players-${room.id}`}
        >
          <header className="flex items-start gap-3 border-b border-amber-100/15 px-4 py-3 sm:px-7 sm:py-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200 sm:h-10 sm:w-10">
              <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="hidden text-[0.65rem] font-bold uppercase tracking-[0.24em] text-amber-100/50 sm:block">
                Your table
              </p>
              <h2 className="truncate font-serif text-xl text-amber-50 sm:text-2xl" id={`manage-players-${room.id}`}>
                {room.name}
              </h2>
            </div>
            <ExpeditionButton
              className="ml-auto"
              tone="quiet"
              compact
              Icon={XMarkIcon}
              onClick={() => setInvitingUsers(false)}
              aria-label="Close player manager"
            />
          </header>

          <div className="grid max-h-[75dvh] gap-6 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:gap-8">
            <section>
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h3 className="font-serif text-xl text-amber-50">At the table</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-100/45">
                  {room.members.length} {room.members.length === 1 ? 'player' : 'players'}
                </span>
              </div>
              <ul className="space-y-2">
                {room.members.map((member) => {
                  const player = userLookup[member.player_id]
                  const isHost = member.player_id === room.host_id

                  return (
                    <li
                      key={member.id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-amber-100/10 bg-white/5 p-2.5"
                    >
                      <Avatar className="h-9 w-9 shrink-0 bg-amber-50/10" avatarUrl={player?.avatarUrl} />
                      <div className="min-w-0 grow">
                        <p className="truncate text-sm font-bold text-amber-50">{player?.displayName ?? 'Explorer'}</p>
                        <p className="text-xs text-amber-100/45">
                          {isHost ? 'Host' : member.invite_accepted ? 'Invitation accepted' : 'Invitation pending'}
                        </p>
                      </div>
                      {!isHost && (
                        <ExpeditionButton
                          tone="quiet"
                          compact
                          Icon={XMarkIcon}
                          onClick={async () => {
                            if (!confirm('Remove this player from the table?')) return

                            const res = await nhost.graphql.request(DISINVITE_PLAYER, { roomMemberId: member.id })
                            if (res.error || !res.data?.delete_room_member_by_pk?.id) {
                              return toast.error({
                                message: 'Trouble removing player...',
                                description: res.error ? getGraphqlErrorMessage(res.error) : undefined,
                              })
                            }

                            toast.success({ message: `${player?.displayName ?? 'Player'} was removed.` })
                          }}
                          aria-label={`Remove ${player?.displayName ?? 'player'}`}
                          title={`Remove ${player?.displayName ?? 'player'}`}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            <section className="min-w-0 border-t border-amber-100/15 pt-6 md:border-t-0 md:border-l md:border-amber-100/15 md:pl-8 md:pt-0">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h3 className="font-serif text-xl text-amber-50">Invite an explorer</h3>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-100/45">
                  {availablePlayers.length} available
                </span>
              </div>
              {availablePlayers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-100/20 px-4 py-6 text-center">
                  <p className="text-sm text-amber-100/55">Everyone in the guild is already accounted for.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {availablePlayers.map((user) => (
                    <li
                      key={user.id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-amber-100/10 bg-white/5 p-2.5"
                    >
                      <Avatar className="h-9 w-9 shrink-0 bg-amber-50/10" avatarUrl={user.avatarUrl} />
                      <p className="min-w-0 grow truncate text-sm font-bold text-amber-50">{user.displayName}</p>
                      <ExpeditionButton
                        tone="primary"
                        compact
                        Icon={PaperAirplaneIcon}
                        onClick={async () => {
                          const res = await nhost.graphql.request(INVITE_PLAYER, {
                            playerId: user.id,
                            roomId: room.id,
                          })

                          if (res.error) {
                            return toast.error({
                              message: 'Trouble sending invitation...',
                              description: getGraphqlErrorMessage(res.error),
                            })
                          }

                          toast.success({ message: `${user.displayName} invited!` })
                        }}
                        aria-label={`Invite ${user.displayName}`}
                        title={`Invite ${user.displayName}`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </Modal>
      )}
    </div>
  )
}
