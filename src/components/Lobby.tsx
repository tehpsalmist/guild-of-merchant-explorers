import React, { ComponentProps } from 'react'
import { Main } from '../design-system/Main'
import { useAuthSubscription } from '@nhost/react-apollo'
import { GET_ROOMS } from '../graphql/queries'
import { Loading } from './Loading'
import { Button, toast } from '@8thday/react'
import { useNhostClient, useUserId } from '@nhost/react'
import { CREATE_ROOM, DISINVITE_PLAYER, REQUEST_TO_JOIN_ROOM, UPDATE_ROOM_MEMBER } from '../graphql/mutations'
import { useHasJoined } from '../hooks/useHasJoined'
import { JoinTheGuild } from './JoinTheGuild'
import { HomeIcon, PlusIcon } from '@heroicons/react/24/outline'
import { HostControls } from './HostControls'
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowLeftStartOnRectangleIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import { getGraphqlErrorMessage } from '../graphql/utils'
import { NavLink } from 'react-router-dom'

export interface LobbyProps extends ComponentProps<'div'> {}

export const Lobby = ({ className = '', ...props }: LobbyProps) => {
  const nhost = useNhostClient()

  const userId = useUserId()

  const { joined, loading: loadingGameData, gameName, leaveGame } = useHasJoined()

  const { data: roomData, loading: loadingRooms } = useAuthSubscription(GET_ROOMS, { skip: !joined })

  const rooms = roomData?.room ?? []

  const openRoom = async () => {
    const roomName = prompt('Name your table')
    if (!roomName) return

    const res = await nhost.graphql.request(CREATE_ROOM, { roomName, userId })

    console.log(res)
  }

  if (loadingGameData || loadingRooms)
    return (
      <Main>
        <Loading />
      </Main>
    )

  if (!joined) {
    return (
      <Main className="flex-center flex-col">
        <JoinTheGuild />
      </Main>
    )
  }

  const { hostedRooms, joinedRooms, publicRooms } = rooms.reduce(
    (agg, r) => {
      if (r.host_id === userId) {
        agg.hostedRooms.push(r)
      } else if (r.members.some((m) => m.player_id === userId)) {
        agg.joinedRooms.push(r)
      } else if (r.is_public) {
        agg.publicRooms.push(r)
      }

      return agg
    },
    { hostedRooms: [], joinedRooms: [], publicRooms: [] },
  )

  return (
    <Main className={`${className}`} {...props}>
      <div className="sticky top-0 flex flex-col items-center pt-2 text-center sm:flex-row sm:p-2 sm:text-left">
        <span className="text-sm leading-3 sm:text-2xl">Active Tables for</span>
        <h3 className="text-primary-700 sm:hidden">{gameName}</h3>
        <h2 className="ml-2 hidden text-primary-700 sm:block">{gameName}</h2>
        <Button
          variant="primary"
          type="button"
          className="ml-auto hidden sm:flex"
          PreIcon={HomeIcon}
          onClick={openRoom}
        >
          Host a Table
        </Button>
        <Button
          variant="primary"
          type="button"
          className="bottom-15 fixed! right-3 rounded-full! sm:hidden"
          PreIcon={PlusIcon}
          onClick={openRoom}
        />
      </div>
      <ul className="flex min-h-[calc(100vh-(--spacing(24)))] flex-col pt-2 sm:min-h-[calc(100vh-(--spacing(24)+(--spacing(2))))]">
        {hostedRooms.length > 0 && <strong className="bg-primary-50 pl-2">You Are Hosting:</strong>}
        {hostedRooms.map((room) => (
          <li key={room.id} className="flex items-center gap-2 px-2 py-1 even:bg-gray-50">
            <span className="mr-auto min-w-0 grow truncate text-sm">{room.name}</span>
            <NavLink to={`../room/${room.id}`}>
              <Button type="button" className="min-h-8" variant="primary">
                Play
              </Button>
            </NavLink>
            <HostControls room={room} buttonClasses="min-h-8 !py-0 px-1" />
          </li>
        ))}
        {joinedRooms.length > 0 && <strong className="bg-primary-50 pl-2">You Joined:</strong>}
        {joinedRooms.map((room) => {
          const membership = room.members.find((m) => m.player_id === userId)

          if (!membership) return null

          const inviteAccepted = membership.invite_accepted

          return (
            <li key={room.id} className="flex items-center gap-2 px-2 py-1 even:bg-gray-50">
              <span className="mr-auto text-sm">{room.name}</span>
              {inviteAccepted && (
                <NavLink to={`../room/${room.id}`}>
                  <Button type="button" className="min-h-8" variant="primary">
                    Play
                  </Button>
                </NavLink>
              )}
              {!inviteAccepted && (
                <Button
                  variant="primary"
                  className="min-h-8 py-0! px-1"
                  PreIcon={CheckIcon}
                  onClick={async () => {
                    const res = await nhost.graphql.request(UPDATE_ROOM_MEMBER, {
                      roomMemberId: room.members.find((m) => m.player_id === userId)?.id,
                      set: { invite_accepted: true },
                    })

                    if (res.error) {
                      return toast.error({
                        message: 'Trouble joining the table...',
                        description: getGraphqlErrorMessage(res.error),
                      })
                    }

                    toast.success({ message: `Invite Accepted!` })
                  }}
                />
              )}
              <Button
                variant={inviteAccepted ? 'secondary' : 'destructive'}
                className="min-h-8 py-0! px-1"
                PreIcon={inviteAccepted ? ArrowLeftStartOnRectangleIcon : XMarkIcon}
                onClick={async () => {
                  const res = await nhost.graphql.request(DISINVITE_PLAYER, {
                    roomMemberId: room.members.find((m) => m.player_id === userId)?.id,
                  })

                  if (res.error) {
                    return toast.error({
                      message: 'Trouble leaving the table...',
                      description: getGraphqlErrorMessage(res.error),
                    })
                  }

                  toast.success({ message: `You have left ${room.name}.` })
                }}
              />
            </li>
          )
        })}
        <strong className="bg-primary-50 pl-2">Public Tables:</strong>
        {publicRooms.map((room) => (
          <li key={room.id} className="flex items-center gap-2 px-2 py-1 even:bg-gray-50">
            <span className="mr-auto text-sm">{room.name}</span>
            <Button
              variant="primary"
              className="min-h-8 py-0! px-1"
              PreIcon={ArrowLeftEndOnRectangleIcon}
              onClick={async () => {
                const res = await nhost.graphql.request(REQUEST_TO_JOIN_ROOM, { roomId: room.id })

                if (res.error) {
                  return toast.error({
                    message: 'Trouble sending request to join...',
                    description: getGraphqlErrorMessage(res.error),
                  })
                }

                if (!res.data?.requestToJoinRoom?.success) {
                  return toast.error({
                    message: "Couldn't send request.",
                    description: res.data?.requestToJoinRoom?.error,
                  })
                }

                toast.success({
                  message: `Request to Join Sent!`,
                  description: 'The host will receive a notification that you would like to play.',
                })
              }}
            />
          </li>
        ))}
        {(!rooms.length || !publicRooms.length) && (
          <p className="mt-8 text-center">
            <em>No public tables open!</em>{' '}
            <button className="link-on-light italic" onClick={openRoom}>
              Host one yourself?
            </button>
          </p>
        )}
        <p className="mb-2 mt-auto pl-2">
          <button className="link-on-light text-xs" onClick={leaveGame}>
            Leave Game Permanently
          </button>
        </p>
      </ul>
    </Main>
  )
}
