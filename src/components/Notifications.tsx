import { useAuthQuery } from '@nhost/react-apollo'
import React, { ComponentProps, useEffect, useState } from 'react'
import { GAME_NOTIFICATIONS, GET_HOSTED_ROOM_NAMES, STREAM_NOTIFICATIONS } from '../graphql/queries'
import { useNhostClient, useUserId } from '@nhost/react'
import { useSubscription } from '@apollo/client'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { BellIcon } from '@heroicons/react/24/outline'
import { ACK_NOTIFICATION, DELETE_NOTIFICATION, INVITE_PLAYER } from '../graphql/mutations'
import { XMarkIcon } from '@heroicons/react/16/solid'
import { usePlayerList } from '../hooks/usePlayerList'
import { toast, useMediaQuery } from '@8thday/react'
import { NavLink } from 'react-router-dom'
import { getGraphqlErrorMessage } from '../graphql/utils'
import { ExpeditionButton } from '../design-system/ExpeditionButton'
import clsx from 'clsx'

type NotificationMessage = {
  type: 'request-to-join-room'
  data: {
    userId: string
    roomId: number
  }
}

interface Notification {
  id: number
  ack: boolean
  message: NotificationMessage
  created_at: string
}

export interface NotificationsProps extends ComponentProps<'div'> {}

export const Notifications = ({ className = '', ...props }: NotificationsProps) => {
  const nhost = useNhostClient()
  const userId = useUserId()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const desktopNavigation = useMediaQuery('(min-width: 640px)')

  const { data, refetch } = useAuthQuery<{ game_player_notification: Notification[] }>(GAME_NOTIFICATIONS, {
    variables: { userId },
  })

  useEffect(() => {
    if (!Array.isArray(data?.game_player_notification)) return

    setNotifications(data.game_player_notification)
  }, [data])

  const latestId = Array.isArray(data?.game_player_notification) ? data.game_player_notification.at(-1)?.id ?? 0 : null

  useSubscription<{ game_player_notification_stream: Notification[] }>(STREAM_NOTIFICATIONS, {
    variables: { userId, latestId },
    skip: latestId == null,
    onData({ data }) {
      setNotifications((ns) => ns.concat(data?.data?.game_player_notification_stream ?? []).filter(removeDupes()))
    },
  })

  if (!notifications.length) return null

  const unreadCount = notifications.filter((notification) => !notification.ack).length

  return (
    <Popover className="relative flex" {...props}>
      <PopoverButton className={clsx(className, 'relative')} onClick={() => refetch()} aria-label="Notifications">
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full border border-slate-950 bg-red-500 px-1 text-[0.6rem] font-black leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverButton>
      <PopoverPanel
        anchor={desktopNavigation ? 'bottom end' : 'top end'}
        className="z-50 w-[min(24rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-amber-100/20 bg-slate-950 text-amber-50 shadow-2xl [--anchor-gap:--spacing(2)]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-amber-100/10 px-4 py-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-100/45">Guild hall</p>
            <h2 className="font-serif text-xl text-amber-50">Notifications</h2>
          </div>
          {unreadCount > 0 && (
            <span className="rounded-full bg-amber-100/10 px-2.5 py-1 text-xs font-bold text-amber-100/65">
              {unreadCount} new
            </span>
          )}
        </header>
        <ul className="flex max-h-[min(24rem,60dvh)] flex-col overflow-y-auto p-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={clsx(
                'flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/5',
                !n.ack && 'bg-amber-100/5',
              )}
              onClick={async () => {
                const res = await nhost.graphql.request(ACK_NOTIFICATION, { id: n.id })
                if (!res.error) {
                  setNotifications((ns) => ns.map((n1) => (n1.id === n.id ? { ...n1, ack: true } : n1)))
                }
              }}
            >
              <div className="min-w-0 grow">
                <NotificationMessageDisplay message={n.message} id={n.id} onInvite={() => refetch()} />
              </div>
              {!n.ack && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-300" aria-label="Unread" />}
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amber-100/40 transition hover:bg-white/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
                onClick={async () => {
                  const res = await nhost.graphql.request(DELETE_NOTIFICATION, { id: n.id })
                  if (!res.error) {
                    setNotifications((ns) => ns.filter((n1) => n1.id !== n.id))
                  }
                }}
                aria-label="Dismiss notification"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </PopoverPanel>
    </Popover>
  )
}

interface NotificationMessageDisplayProps {
  message: NotificationMessage
  id: number
  onInvite?(): void
}
const NotificationMessageDisplay = ({ message, id, onInvite }: NotificationMessageDisplayProps) => {
  const nhost = useNhostClient()

  const userId = useUserId()

  const { data } = useAuthQuery(GET_HOSTED_ROOM_NAMES, {
    variables: { hostId: userId },
    skip: message.type !== 'request-to-join-room',
  })

  const { userLookup } = usePlayerList()

  const names = data?.room?.reduce((map, room) => ({ ...map, [room.id]: room.name }), {})

  switch (message.type) {
    case 'request-to-join-room':
      return (
        <div>
          <p className="mb-2 text-sm leading-5 text-amber-100/70">
            {userLookup[message.data.userId]?.displayName ?? 'An unknown user'} would like to join your table:{' '}
            <NavLink
              to={`/online/room/${message.data.roomId}`}
              className="font-bold text-amber-200 underline decoration-amber-200/30 underline-offset-2 hover:text-amber-50"
            >
              {names?.[message.data.roomId]}
            </NavLink>
          </p>
          <div className="flex gap-2">
            <ExpeditionButton
              className="min-h-9 px-3 py-1.5 text-xs"
              tone="primary"
              onClick={async () => {
                const res = await nhost.graphql.request(INVITE_PLAYER, {
                  playerId: message.data.userId,
                  roomId: message.data.roomId,
                })

                if (res.error) {
                  return toast.error({
                    message: 'Trouble inviting player...',
                    description: getGraphqlErrorMessage(res.error),
                  })
                }

                toast.success({ message: `${userLookup[message.data.userId]?.displayName} Invited!` })

                const r = await nhost.graphql.request(DELETE_NOTIFICATION, { id })
                if (!r.error) {
                  onInvite?.()
                }
              }}
            >
              Invite
            </ExpeditionButton>
          </div>
        </div>
      )
    default:
      return null
  }
}

const removeDupes = () => {
  const exists = new Map()

  return (notification) => {
    if (exists.has(notification.id)) return false

    exists.set(notification.id, true)

    return true
  }
}
