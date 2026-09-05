import React, { ComponentProps, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { Main } from '../design-system/Main'
import { useAuthSubscription } from '@nhost/react-apollo'
import { ROOM_SUB } from '../graphql/queries'
import { Loading } from './Loading'
import { usePlayerList } from '../hooks/usePlayerList'
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { P2PRoom } from '../p2p-connection/p2p-room'
import { useNhostClient, useUserId } from '@nhost/react'
import { useApolloClient } from '@apollo/client'
import clsx from 'clsx'
import { Avatar } from './Avatar'
import { HostControls } from './HostControls'
import { ExpeditionButton, expeditionButtonClasses } from '../design-system/ExpeditionButton'
import { CLOSE_ROOM } from '../graphql/mutations'
import { toast } from '@8thday/react'
import { getGraphqlErrorMessage } from '../graphql/utils'

type PeerState = 'connecting' | 'connected' | 'reconnecting' | 'closed'

interface ChatMessage {
  message: string
  id: number
  sentAt: Date
}

export interface GameRoomProps extends ComponentProps<'main'> {}

export const GameRoom = ({ className = '', ...props }: GameRoomProps) => {
  const [p2pRoom, setP2PRoom] = useState<P2PRoom>()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [peerStates, setPeerStates] = useState<Record<number, PeerState>>({})
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesRef = useRef<HTMLDivElement>(null)
  const chatPanelRef = useRef<HTMLElement>(null)
  const mobileChatOpenRef = useRef(false)
  const nhost = useNhostClient()
  const apollo = useApolloClient()
  const navigate = useNavigate()
  const { roomId } = useParams()
  const userId = useUserId()
  const { userLookup } = usePlayerList()
  const numericRoomId = Number(roomId)
  const { data } = useAuthSubscription(ROOM_SUB, {
    variables: { roomId: numericRoomId },
    skip: !Number.isInteger(numericRoomId),
  })
  const room = data?.room_by_pk

  const memberUserIdLookup = useMemo<Record<number, string>>(
    () =>
      room?.members?.reduce(
        (lookup, member) => ({ ...lookup, [member.id]: member.player_id }),
        {} as Record<number, string>,
      ) ?? {},
    [room?.members],
  )

  useEffect(() => {
    if (data && !room) navigate('../lobby', { replace: true })
  }, [data, room, navigate])

  useEffect(() => {
    mobileChatOpenRef.current = mobileChatOpen
    if (mobileChatOpen) setUnreadCount(0)
  }, [mobileChatOpen])

  useEffect(() => {
    if (!mobileChatOpen) return

    const panel = chatPanelRef.current
    const visualViewport = window.visualViewport
    const updatePanelPosition = () => {
      if (!panel || window.matchMedia('(min-width: 1024px)').matches) return

      const visibleHeight = visualViewport?.height ?? window.innerHeight
      const viewportOffset = visualViewport?.offsetTop ?? 0
      const keyboardOffset = Math.max(0, window.innerHeight - visibleHeight - viewportOffset)
      const availableHeight = Math.max(160, visibleHeight - 80)
      const preferredHeight = Math.min(visibleHeight * 0.72, 608)

      panel.style.setProperty('--chat-panel-height', `${Math.min(preferredHeight, availableHeight)}px`)
      panel.style.setProperty('--chat-keyboard-offset', `${keyboardOffset}px`)
    }
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMobileChatOpen(false)
    }

    updatePanelPosition()
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('keydown', closeOnEscape)
    visualViewport?.addEventListener('resize', updatePanelPosition)
    visualViewport?.addEventListener('scroll', updatePanelPosition)

    return () => {
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('keydown', closeOnEscape)
      visualViewport?.removeEventListener('resize', updatePanelPosition)
      visualViewport?.removeEventListener('scroll', updatePanelPosition)
    }
  }, [mobileChatOpen])

  useEffect(() => {
    if (!room || !userId) return

    const nextRoom = new P2PRoom(room, userId, nhost, apollo)
    setP2PRoom(nextRoom)
    return () => nextRoom.destroy()
  }, [room, userId, nhost, apollo])

  useEffect(() => {
    if (!p2pRoom) return

    const messageCleanup = p2pRoom.onMessages(({ id, message }) => {
      setChatMessages((currentMessages) => [...currentMessages, { id, message, sentAt: new Date() }])
      if (!mobileChatOpenRef.current && !window.matchMedia('(min-width: 1024px)').matches) {
        setUnreadCount((count) => Math.min(count + 1, 99))
      }
    })
    const stateCleanups = [...p2pRoom.connections.entries()].map(([memberId, connection]) => {
      const updateState = (state: PeerState) => {
        setPeerStates((states) => ({ ...states, [memberId]: state }))
      }
      updateState(connection.handshakeState)
      connection.on('handshake-state', updateState)
      return () => connection.off('handshake-state', updateState)
    })

    setPeerStates(
      Object.fromEntries(
        [...p2pRoom.connections.entries()].map(([memberId, connection]) => [memberId, connection.handshakeState]),
      ),
    )

    return () => {
      messageCleanup()
      stateCleanups.forEach((cleanup) => cleanup())
    }
  }, [p2pRoom])

  useEffect(() => {
    const messageList = messagesRef.current
    if (!messageList) return

    messageList.scrollTo({ top: messageList.scrollHeight, behavior: chatMessages.length > 1 ? 'smooth' : 'auto' })
  }, [chatMessages, mobileChatOpen])

  if (!room) {
    return (
      <Main className="bg-slate-950">
        <Loading />
      </Main>
    )
  }

  const acceptedMembers = room.members.filter((member) => member.invite_accepted)
  const currentMember = room.members.find((member) => member.player_id === userId)
  const isHost = room.host_id === userId
  const peerCount = p2pRoom?.connections.size ?? 0
  const connectedPeerCount = Object.values(peerStates).filter((state) => state === 'connected').length
  const canChat = peerCount > 0
  const connectionLabel =
    peerCount === 0
      ? 'Waiting for another explorer'
      : connectedPeerCount === peerCount
        ? 'Conversation live'
        : 'Connecting conversation…'

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault()
    const message = draft.trim()
    if (!message || !p2pRoom || !currentMember || !canChat) return

    p2pRoom.sendMessages(JSON.stringify({ type: 'text-message', data: message }))
    setChatMessages((currentMessages) => [
      ...currentMessages,
      { id: currentMember.id, message, sentAt: new Date() },
    ])
    setDraft('')
  }

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
            'radial-gradient(circle at 10% 6%, rgb(180 83 9 / 0.22), transparent 30rem), radial-gradient(circle at 92% 92%, rgb(30 64 175 / 0.2), transparent 36rem)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:px-8">
        <div className="flex min-w-0 flex-col gap-5 lg:min-h-[calc(100dvh-7rem)]">
          <header className="flex flex-col gap-4 rounded-2xl border border-amber-100/15 bg-black/25 p-4 shadow-xl backdrop-blur-sm sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <NavLink
              className={clsx(expeditionButtonClasses({ tone: 'quiet', compact: true }), '-ml-2')}
              to="../lobby"
              aria-label="Back to lobby"
              title="Back to lobby"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </NavLink>
            <div className="min-w-0 grow">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.26em] text-amber-100/50">
                Waiting room
              </p>
              <h1 className="truncate font-serif text-3xl text-amber-50 sm:text-4xl">{room.name}</h1>
              <p className="mt-1 text-sm text-amber-100/55">Settle in and talk while the rest of the table arrives.</p>
            </div>
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-100/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-amber-100/60 sm:inline-flex">
              {room.is_public ? (
                <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
              )}
              {room.is_public ? 'Public' : 'Private'}
            </span>
          </div>

          <div className="flex flex-col gap-3 border-t border-amber-100/10 pt-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2" aria-hidden="true">
                {acceptedMembers.slice(0, 4).map((member) => (
                  <Avatar
                    key={member.id}
                    className="h-8 w-8 border-2 border-slate-950 bg-amber-50/10"
                    avatarUrl={userLookup[member.player_id]?.avatarUrl}
                  />
                ))}
              </div>
              <p className="text-sm text-amber-100/60">
                <strong className="text-amber-50">{acceptedMembers.length}</strong> of {room.members.length}{' '}
                {room.members.length === 1 ? 'player' : 'players'} ready
              </p>
            </div>
            {isHost && <HostControls className="sm:ml-auto" room={room} showLabels showClose={false} />}
          </div>
          </header>

          <section className="self-start rounded-2xl border border-amber-100/15 bg-black/25 p-4 shadow-xl backdrop-blur-sm sm:p-5" aria-labelledby="players-heading">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
                <UserGroupIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-2xl text-amber-50" id="players-heading">Explorers</h2>
                <p className="text-xs text-amber-100/45">Everyone invited to this table</p>
              </div>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {room.members.map((member) => {
                const player = userLookup[member.player_id]
                const isCurrentUser = member.player_id === userId
                const isMemberHost = member.player_id === room.host_id

                return (
                  <li
                    key={member.id}
                    className={clsx(
                      'flex min-w-0 items-center gap-3 rounded-xl border p-3',
                      member.invite_accepted
                        ? 'border-amber-100/10 bg-white/5'
                        : 'border-dashed border-amber-200/20 bg-black/15',
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 bg-amber-50/10" avatarUrl={player?.avatarUrl} />
                      <span
                        className={clsx(
                          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950',
                          member.invite_accepted ? 'bg-emerald-400' : 'bg-amber-500',
                        )}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-bold text-amber-50">
                        {player?.displayName ?? 'Explorer'} {isCurrentUser && <span className="text-amber-100/45">(you)</span>}
                      </p>
                      <p className="text-xs text-amber-100/45">
                        {isMemberHost ? 'Host' : member.invite_accepted ? 'Ready and waiting' : 'Invitation pending'}
                      </p>
                    </div>
                    {member.invite_accepted ? (
                      <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400" aria-label="Ready" />
                    ) : (
                      <ClockIcon className="h-5 w-5 shrink-0 text-amber-300/70" aria-label="Invitation pending" />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {isHost && (
            <footer className="mt-auto border-t border-amber-100/10 pt-5">
              <ExpeditionButton
                className="text-red-100/65"
                tone="quiet"
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
              >
                Close table
              </ExpeditionButton>
            </footer>
          )}
        </div>

        <section
          ref={chatPanelRef}
          id="table-talk-panel"
          className={clsx(
            'z-30 h-[var(--chat-panel-height,min(72dvh,38rem))] max-h-[calc(100dvh-5rem)] flex-col overflow-hidden rounded-2xl border border-amber-100/20 bg-slate-950/95 shadow-2xl backdrop-blur-md',
            mobileChatOpen
              ? 'fixed inset-x-3 bottom-[calc(var(--chat-keyboard-offset,0px)+4rem+env(safe-area-inset-bottom))] flex'
              : 'hidden',
            'lg:sticky lg:inset-auto lg:top-16 lg:flex lg:h-[calc(100dvh-7rem)] lg:max-h-[52rem] lg:min-h-0 lg:bg-black/35',
          )}
          aria-labelledby="conversation-heading"
        >
            <header className="flex shrink-0 items-center gap-3 border-b border-amber-100/10 px-4 py-4 sm:px-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
                <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="font-serif text-2xl text-amber-50" id="conversation-heading">Table Talk</h2>
                <p className="flex items-center gap-1.5 text-xs text-amber-100/45">
                  <span
                    className={clsx(
                      'h-2 w-2 shrink-0 rounded-full',
                      connectedPeerCount === peerCount && peerCount > 0 ? 'bg-emerald-400' : 'bg-amber-400',
                    )}
                    aria-hidden="true"
                  />
                  {connectionLabel}
                </p>
              </div>
              <ExpeditionButton
                className="ml-auto lg:hidden"
                tone="quiet"
                compact
                Icon={XMarkIcon}
                onClick={() => setMobileChatOpen(false)}
                aria-label="Close table talk"
              />
            </header>

            <div ref={messagesRef} className="min-h-0 grow overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
              {chatMessages.length === 0 ? (
                <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100/10 text-amber-200/70">
                    <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="mt-3 font-serif text-xl text-amber-50">
                    {canChat ? 'The conversation starts here.' : 'Waiting for company.'}
                  </p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-amber-100/45">
                    {canChat
                      ? 'Say hello, compare notes, or pass the time while everyone gathers.'
                      : 'Once another player accepts their invitation, you can chat right here.'}
                  </p>
                </div>
              ) : (
                <ol aria-live="polite" aria-label="Conversation messages">
                  {chatMessages.map((chatMessage, index) => {
                    const previousMessage = chatMessages[index - 1]
                    const nextMessage = chatMessages[index + 1]
                    const followsSameSender =
                      previousMessage?.id === chatMessage.id &&
                      chatMessage.sentAt.getTime() - previousMessage.sentAt.getTime() < MESSAGE_GROUP_WINDOW_MS
                    const followedBySameSender =
                      nextMessage?.id === chatMessage.id &&
                      nextMessage.sentAt.getTime() - chatMessage.sentAt.getTime() < MESSAGE_GROUP_WINDOW_MS
                    const showTimestamp =
                      !previousMessage ||
                      chatMessage.sentAt.getTime() - previousMessage.sentAt.getTime() >= MESSAGE_GROUP_WINDOW_MS
                    const isMine = chatMessage.id === currentMember?.id
                    const playerId = memberUserIdLookup[chatMessage.id]
                    const player = userLookup[playerId]

                    return (
                      <li
                        key={`${chatMessage.id}-${chatMessage.sentAt.getTime()}-${index}`}
                        className={clsx('flex', index > 0 && (followsSameSender ? 'mt-1.5' : 'mt-4'), isMine && 'justify-end')}
                      >
                        <div className={clsx('max-w-[88%] sm:max-w-[75%]', isMine && 'text-right')}>
                          {(!followsSameSender || showTimestamp) && (
                            <div className="mb-1 flex items-baseline gap-2 px-1">
                              {!followsSameSender && (
                                <span className="truncate text-xs font-bold text-amber-100/60">
                                  {isMine ? 'You' : player?.displayName ?? 'Explorer'}
                                </span>
                              )}
                              {showTimestamp && (
                                <time
                                  className="text-[0.65rem] text-amber-100/30"
                                  dateTime={chatMessage.sentAt.toISOString()}
                                >
                                  {formatMessageTime(chatMessage.sentAt)}
                                </time>
                              )}
                            </div>
                          )}
                          <p
                            className={clsx(
                              'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-left text-sm leading-6 shadow-md',
                              isMine ? 'bg-[#f5edcf] text-slate-950' : 'border border-amber-100/10 bg-white/8 text-amber-50',
                              !followedBySameSender && (isMine ? 'rounded-br-sm' : 'rounded-bl-sm'),
                            )}
                          >
                            {chatMessage.message}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>

            <form className="shrink-0 border-t border-amber-100/10 bg-slate-950/75 p-3 sm:p-4" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="chat-message">Message the table</label>
              <div className="flex items-end gap-2">
                <textarea
                  id="chat-message"
                  className="max-h-32 min-h-12 min-w-0 grow resize-none rounded-xl border border-amber-100/20 bg-amber-50/95 px-3 py-3 text-base text-slate-950 placeholder:text-slate-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, 500))}
                  onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={canChat ? 'Message the table…' : 'Waiting for another player…'}
                  rows={1}
                  maxLength={500}
                  disabled={!canChat}
                  inputMode="text"
                  enterKeyHint="send"
                  onFocus={(event) => {
                    const input = event.currentTarget
                    window.setTimeout(() => input.scrollIntoView({ block: 'nearest' }), 250)
                  }}
                />
                <ExpeditionButton
                  className="h-12 min-h-12 w-12 px-0"
                  tone="primary"
                  Icon={PaperAirplaneIcon}
                  type="submit"
                  disabled={!canChat || !draft.trim()}
                  aria-label="Send message"
                  title="Send message"
                />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 px-1">
                <p className="text-[0.65rem] text-amber-100/35">
                  {canChat && connectedPeerCount < peerCount
                    ? 'Messages will send when the connection is ready.'
                    : 'Enter to send · Shift + Enter for a new line'}
                </p>
                {draft.length > 400 && <span className="text-[0.65rem] text-amber-100/35">{draft.length}/500</span>}
              </div>
            </form>
        </section>

        {mobileChatOpen && (
          <button
            className="fixed inset-0 z-20 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileChatOpen(false)}
            aria-label="Close table talk"
            tabIndex={-1}
          />
        )}

        {!mobileChatOpen && (
          <button
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-4 z-20 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full border border-amber-100/30 bg-[#f5edcf] text-slate-950 shadow-2xl shadow-black/40 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 focus:ring-offset-slate-950 lg:hidden"
            onClick={() => setMobileChatOpen(true)}
            aria-label={unreadCount ? `Open table talk, ${unreadCount} unread messages` : 'Open table talk'}
            aria-controls="table-talk-panel"
            aria-expanded="false"
          >
            <ChatBubbleLeftRightIcon className="h-7 w-7" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-red-500 px-1.5 text-[0.65rem] font-black leading-none text-white"
                aria-hidden="true"
              >
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>
    </Main>
  )
}

const messageTimeFormatter = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' })
const formatMessageTime = (date: Date) => messageTimeFormatter.format(date)
const MESSAGE_GROUP_WINDOW_MS = 3 * 60 * 1000
