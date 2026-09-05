import type { GetRoomsSubscription } from '../graphql/types.generated'
import React, { ComponentProps, ReactNode, useState } from 'react'
import { Main } from '../design-system/Main'
import { useAuthSubscription } from '@nhost/react-apollo'
import { GET_ROOMS } from '../graphql/queries'
import { Loading } from './Loading'
import { Modal, toast } from '@8thday/react'
import { useNhostClient, useUserId } from '@nhost/react'
import { CREATE_ROOM, DISINVITE_PLAYER, REQUEST_TO_JOIN_ROOM, UPDATE_ROOM_MEMBER } from '../graphql/mutations'
import { useHasJoined } from '../hooks/useHasJoined'
import { JoinTheGuild } from './JoinTheGuild'
import {
  ArrowLeftStartOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
  CheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PlusIcon,
  SparklesIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { getGraphqlErrorMessage } from '../graphql/utils'
import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { HostControls } from './HostControls'
import {
  ExpeditionButton,
  expeditionButtonClasses,
} from '../design-system/ExpeditionButton'

type RoomMember = Room['members'][number]

type Room = GetRoomsSubscription['room'][number]

export interface LobbyProps extends ComponentProps<'div'> {}

export const Lobby = ({ className = '', ...props }: LobbyProps) => {
  const nhost = useNhostClient()
  const navigate = useNavigate()
  const userId = useUserId()
  const { joined, loading: loadingGameData, gameName, leaveGame } = useHasJoined()
  const { data: roomData, loading: loadingRooms } = useAuthSubscription(GET_ROOMS, { skip: !joined })
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [savingRoom, setSavingRoom] = useState(false)

  const rooms: Room[] = roomData?.room ?? []

  if (loadingGameData || loadingRooms) {
    return (
      <Main className="bg-slate-950">
        <Loading />
      </Main>
    )
  }

  if (!joined) {
    return (
      <Main className="flex-center flex-col bg-slate-950">
        <JoinTheGuild />
      </Main>
    )
  }

  const { hostedRooms, joinedRooms, publicRooms } = rooms.reduce(
    (groups, room) => {
      if (room.host_id === userId) groups.hostedRooms.push(room)
      else if (room.members.some((member) => member.player_id === userId)) groups.joinedRooms.push(room)
      else if (room.is_public) groups.publicRooms.push(room)
      return groups
    },
    { hostedRooms: [] as Room[], joinedRooms: [] as Room[], publicRooms: [] as Room[] },
  )

  const myRooms = [...hostedRooms, ...joinedRooms]

  return (
    <Main
      className={clsx(
        className,
        'relative bg-slate-950 text-amber-50 selection:bg-amber-200 selection:text-slate-950',
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(circle at 12% 8%, rgb(180 83 9 / 0.24), transparent 32rem), radial-gradient(circle at 88% 84%, rgb(30 64 175 / 0.18), transparent 36rem)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-200/65">Online game</p>
            <h1 className="font-serif text-4xl text-amber-50 sm:text-5xl">Find Your Table</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-amber-100/60 sm:text-base">
              Join fellow explorers in the {gameName} guild hall, or open a table of your own.
            </p>
          </div>
          <ExpeditionButton
            className="w-full sm:w-auto"
            tone="primary"
            Icon={PlusIcon}
            onClick={() => setCreatingRoom(true)}
          >
            Host a table
          </ExpeditionButton>
        </header>

        <section aria-labelledby="my-tables-heading">
          <SectionHeading
            id="my-tables-heading"
            eyebrow="Your invitations and hosted games"
            icon={<UserGroupIcon className="h-6 w-6" aria-hidden="true" />}
            count={myRooms.length}
          >
            My Tables
          </SectionHeading>

          {myRooms.length === 0 ? (
            <EmptyState>
              <p className="font-serif text-xl text-amber-50">No table has your name on it yet.</p>
              <p className="mt-1 text-sm text-amber-100/55">Host one now, or browse the open tables below.</p>
            </EmptyState>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {myRooms.map((room) => {
                const isHost = room.host_id === userId
                const membership = room.members.find((member) => member.player_id === userId)
                const inviteAccepted = !!membership?.invite_accepted

                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    label={isHost ? 'You are hosting' : inviteAccepted ? 'Joined table' : 'Invitation waiting'}
                    accent={!isHost && !inviteAccepted}
                    actions={
                      isHost ? (
                        <>
                          <NavLink
                            className={expeditionButtonClasses({ tone: 'primary' })}
                            to={`../room/${room.id}`}
                          >
                            Enter waiting room
                          </NavLink>
                          <HostControls room={room} />
                        </>
                      ) : inviteAccepted ? (
                        <>
                          <NavLink
                            className={expeditionButtonClasses({ tone: 'primary' })}
                            to={`../room/${room.id}`}
                          >
                            Enter waiting room
                          </NavLink>
                          <ExpeditionButton
                            tone="quiet"
                            compact
                            Icon={ArrowLeftStartOnRectangleIcon}
                            aria-label={`Leave ${room.name}`}
                            title={`Leave ${room.name}`}
                            onClick={() => membership && removeMembership(nhost, membership, room.name ?? 'table')}
                          />
                        </>
                      ) : (
                        <>
                          <ExpeditionButton
                            tone="primary"
                            Icon={CheckIcon}
                            onClick={() => membership && acceptInvitation(nhost, membership, room.name ?? 'table')}
                          >
                            Accept
                          </ExpeditionButton>
                          <ExpeditionButton
                            tone="danger"
                            Icon={XMarkIcon}
                            onClick={() => membership && removeMembership(nhost, membership, room.name ?? 'table')}
                          >
                            Decline
                          </ExpeditionButton>
                        </>
                      )
                    }
                  />
                )
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="public-tables-heading">
          <SectionHeading
            id="public-tables-heading"
            eyebrow="Open to fellow guild members"
            icon={<GlobeAltIcon className="h-6 w-6" aria-hidden="true" />}
            count={publicRooms.length}
          >
            Public Tables
          </SectionHeading>

          {publicRooms.length === 0 ? (
            <EmptyState>
              <SparklesIcon className="mx-auto mb-3 h-8 w-8 text-amber-200/70" aria-hidden="true" />
              <p className="font-serif text-xl text-amber-50">The hall is quiet for the moment.</p>
              <p className="mt-1 text-sm text-amber-100/55">Be the first to set out a new table.</p>
              <ExpeditionButton className="mt-4" Icon={PlusIcon} onClick={() => setCreatingRoom(true)}>
                Host a table
              </ExpeditionButton>
            </EmptyState>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {publicRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  label="Open table"
                  actions={
                    <ExpeditionButton
                      tone="primary"
                      Icon={ArrowRightEndOnRectangleIcon}
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
                          message: 'Request sent!',
                          description: 'The host will know you would like to join.',
                        })
                      }}
                    >
                      Ask to join
                    </ExpeditionButton>
                  }
                />
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-amber-100/10 pt-5 text-center sm:text-left">
          <button
            className="min-h-11 rounded-lg px-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-100/35 transition hover:bg-white/5 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-amber-200"
            onClick={leaveGame}
          >
            Leave this game permanently
          </button>
        </footer>
      </div>

      {creatingRoom && (
        <Modal
          portal
          onClose={() => !savingRoom && setCreatingRoom(false)}
          overlayClasses="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
          bgClass="bg-slate-950/90"
          className="w-full max-w-md border border-amber-100/20 bg-slate-950! p-5! text-amber-50 shadow-2xl sm:p-6!"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-room-title"
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              const name = roomName.trim()
              if (!name || !userId || savingRoom) return

              setSavingRoom(true)
              const res = await nhost.graphql.request(CREATE_ROOM, { roomName: name, userId })
              setSavingRoom(false)

              if (res.error || !res.data?.insert_room_one?.id) {
                return toast.error({
                  message: 'Trouble opening the table...',
                  description: res.error ? getGraphqlErrorMessage(res.error) : undefined,
                })
              }

              setCreatingRoom(false)
              setRoomName('')
              navigate(`../room/${res.data.insert_room_one.id}`)
            }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-100/50">A new gathering</p>
            <h2 className="mt-1 font-serif text-3xl text-amber-50" id="create-room-title">
              Name your table
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-100/55">
              Give your group a recognizable name. You can invite players once the table is open.
            </p>
            <label className="mt-5 block text-sm font-bold text-amber-50" htmlFor="room-name">
              Table name
            </label>
            <input
              id="room-name"
              className="mt-2 min-h-12 w-full rounded-xl border border-amber-100/25 bg-amber-50/95 px-3 text-base text-slate-950 placeholder:text-slate-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-200"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="The Thursday Explorers"
              maxLength={60}
              autoComplete="off"
              autoFocus
              required
            />
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <ExpeditionButton className="w-full sm:w-auto" onClick={() => setCreatingRoom(false)} disabled={savingRoom}>
                Cancel
              </ExpeditionButton>
              <ExpeditionButton
                className="w-full sm:w-auto"
                tone="primary"
                Icon={PlusIcon}
                type="submit"
                disabled={!roomName.trim() || savingRoom}
              >
                {savingRoom ? 'Opening…' : 'Open table'}
              </ExpeditionButton>
            </div>
          </form>
        </Modal>
      )}
    </Main>
  )
}

const SectionHeading = ({
  id,
  eyebrow,
  icon,
  count,
  children,
}: {
  id: string
  eyebrow: string
  icon: ReactNode
  count: number
  children: ReactNode
}) => (
  <div className="mb-3 flex items-center gap-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
      {icon}
    </span>
    <div>
      <h2 className="font-serif text-2xl text-amber-50" id={id}>
        {children}
      </h2>
      <p className="text-xs text-amber-100/45">{eyebrow}</p>
    </div>
    <span className="ml-auto rounded-full border border-amber-100/15 bg-black/20 px-2.5 py-1 text-xs font-bold text-amber-100/55">
      {count}
    </span>
  </div>
)

const RoomCard = ({
  room,
  label,
  actions,
  accent = false,
}: {
  room: Room
  label: string
  actions: ReactNode
  accent?: boolean
}) => (
  <article
    className={clsx(
      'flex min-w-0 flex-col gap-4 rounded-2xl border bg-black/25 p-4 shadow-xl backdrop-blur-sm sm:p-5',
      accent ? 'border-amber-300/40 bg-amber-500/5' : 'border-amber-100/15',
    )}
  >
    <div className="flex min-w-0 items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
        {room.is_public ? (
          <GlobeAltIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 grow">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-100/45">{label}</p>
        <h3 className="truncate font-serif text-xl text-amber-50 sm:text-2xl">{room.name}</h3>
        <p className="mt-1 text-sm text-amber-100/50">
          {room.members.length} {room.members.length === 1 ? 'explorer' : 'explorers'} ·{' '}
          {room.is_public ? 'Public' : 'Private'}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">{actions}</div>
  </article>
)

const EmptyState = ({ children }: { children: ReactNode }) => (
  <div className="rounded-2xl border border-dashed border-amber-100/20 bg-black/15 px-5 py-8 text-center">
    {children}
  </div>
)

const acceptInvitation = async (nhost: ReturnType<typeof useNhostClient>, membership: RoomMember, roomName: string) => {
  const res = await nhost.graphql.request(UPDATE_ROOM_MEMBER, {
    roomMemberId: membership.id,
    set: { invite_accepted: true },
  })

  if (res.error) {
    return toast.error({
      message: 'Trouble joining the table...',
      description: getGraphqlErrorMessage(res.error),
    })
  }

  toast.success({ message: `You joined ${roomName}.` })
}

const removeMembership = async (nhost: ReturnType<typeof useNhostClient>, membership: RoomMember, roomName: string) => {
  const res = await nhost.graphql.request(DISINVITE_PLAYER, { roomMemberId: membership.id })

  if (res.error) {
    return toast.error({
      message: 'Trouble leaving the table...',
      description: getGraphqlErrorMessage(res.error),
    })
  }

  toast.success({ message: `You left ${roomName}.` })
}
