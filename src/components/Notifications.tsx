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
import { Button, toast } from '@8thday/react'
import { NavLink } from 'react-router-dom'
import { getGraphqlErrorMessage } from '../graphql/utils'

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

  return (
    <Popover className={className}>
      <PopoverButton className="flex-center relative focus:outline-none" onClick={() => refetch()}>
        <BellIcon className="h-7 w-7" />
        {notifications.some((n) => !n.ack) && (
          <div className="absolute right-0 top-0 h-3 w-3 animate-pulse rounded-full bg-red-500" />
        )}
      </PopoverButton>
      <PopoverPanel
        anchor="bottom end"
        className="z-20 min-w-64 max-w-96 rounded-md bg-white shadow-lg [--anchor-gap:--spacing(2)]"
      >
        <h3 className="p-2">Notifications</h3>
        <ul className="flex max-h-96 flex-col overflow-y-auto py-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="flex items-center gap-x-2 p-2 even:bg-gray-50"
              onClick={async () => {
                const res = await nhost.graphql.request(ACK_NOTIFICATION, { id: n.id })
                if (!res.error) {
                  setNotifications((ns) => ns.map((n1) => (n1.id === n.id ? { ...n1, ack: true } : n1)))
                }
              }}
            >
              <span className="mr-auto">
                <NotificationMessageDisplay message={n.message} id={n.id} onInvite={() => refetch()} />
              </span>
              {!n.ack && <div className="h-4 w-4 shrink-0 rounded-full bg-primary-400" />}
              <button
                className="h-4 w-4 shrink-0 rounded-full text-primary-400"
                onClick={async () => {
                  const res = await nhost.graphql.request(DELETE_NOTIFICATION, { id: n.id })
                  if (!res.error) {
                    setNotifications((ns) => ns.filter((n1) => n1.id !== n.id))
                  }
                }}
              >
                <XMarkIcon className="h-full w-full" />
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
          <p className="mb-1">
            {userLookup[message.data.userId]?.displayName ?? 'An unknown user'} would like to join your table:{' '}
            <NavLink to={`/online/room/${message.data.roomId}`} className="link-on-light">
              {names?.[message.data.roomId]}
            </NavLink>
          </p>
          <div className="flex gap-x-2">
            <Button
              variant="primary"
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
            </Button>
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
