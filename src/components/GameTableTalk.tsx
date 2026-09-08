import clsx from 'clsx'
import React, { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, WifiIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ExpeditionButton } from '../design-system/ExpeditionButton'
import type { P2PRoom } from '../p2p-connection/p2p-room'
import { usePlayerList } from '../hooks/usePlayerList'
import { TableTalkParticipants } from './TableTalkParticipants'
import { TableTalkMicrophone } from './TableTalkMicrophone'
import { TableTalkIcon } from './TableTalkIcon'
import type { VoiceChatState } from '../hooks/useVoiceChat'

interface ChatMessage {
  memberId: number
  message: string
  sentAt: Date
}

export const GameTableTalk = ({ p2pRoom, voice }: { p2pRoom: P2PRoom; voice: VoiceChatState }) => {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [peerStates, setPeerStates] = useState<Record<number, string>>({})
  const messagesRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(false)
  const { userLookup } = usePlayerList()
  const membersById = Object.fromEntries(p2pRoom.members.map((member) => [member.id, member]))
  const connectedPeerCount = Object.values(peerStates).filter((state) => state === 'connected').length
  const peerCount = p2pRoom.connections.size
  const canChat = connectedPeerCount > 0
  const localMember = p2pRoom.members.find((member) => member.id === p2pRoom.myId)
  const requiredConnections =
    localMember?.player_id === p2pRoom.host_id
      ? p2pRoom.members.filter((member) => member.invite_accepted && member.id !== p2pRoom.myId)
      : p2pRoom.members.filter((member) => member.invite_accepted && member.player_id === p2pRoom.host_id)
  const hasRequiredConnectionMissing = requiredConnections.some((member) => peerStates[member.id] !== 'connected')
  const connectionLabel =
    peerCount === 0
      ? 'Waiting for another explorer'
      : canChat
        ? `Chat connected with ${connectedPeerCount} ${connectedPeerCount === 1 ? 'explorer' : 'explorers'}`
        : 'Waiting for another explorer to connect'

  useEffect(() => {
    openRef.current = open
    if (open) setUnreadCount(0)
  }, [open])

  useEffect(() => {
    const receiveMessages = p2pRoom.onMessages(({ id, message }) => {
      setMessages((current) => [...current, { memberId: id, message, sentAt: new Date() }])
      if (!openRef.current) setUnreadCount((count) => Math.min(count + 1, 99))
    })
    const updatePeerState = ({ memberId, state }: { memberId: number; state: string }) => {
      setPeerStates((states) => ({ ...states, [memberId]: state }))
    }
    p2pRoom.on('peer-state', updatePeerState)
    setPeerStates(Object.fromEntries(p2pRoom.getPeers().map(({ memberId, state }) => [memberId, state])))

    return () => {
      receiveMessages()
      p2pRoom.off('peer-state', updatePeerState)
    }
  }, [p2pRoom])

  useEffect(() => {
    if (!open) return
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: messages.length > 1 ? 'smooth' : 'auto',
    })
  }, [messages, open])

  const sendMessage = (event?: FormEvent) => {
    event?.preventDefault()
    const message = draft.trim()
    if (!message || !canChat) return
    p2pRoom.sendMessages(message)
    setMessages((current) => [...current, { memberId: p2pRoom.myId, message, sentAt: new Date() }])
    setDraft('')
  }

  return (
    <>
      <button
        type="button"
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/50 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-white/80"
        onClick={() => setOpen(true)}
        aria-label={
          hasRequiredConnectionMissing
            ? 'Open voice and text chat, required game connection unavailable'
            : unreadCount
              ? `Open voice and text chat, ${unreadCount} unread messages`
              : 'Open voice and text chat'
        }
        aria-expanded={open}
        aria-controls="game-table-talk"
        title="Table Talk — voice and text chat"
      >
        <TableTalkIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-red-500 px-1.5 text-[0.65rem] font-black leading-none text-white">
            {unreadCount}
          </span>
        )}
        {hasRequiredConnectionMissing && (
          <span
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-red-500 text-white"
            aria-label="Required game connection unavailable"
          >
            <WifiIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="absolute h-px w-4 rotate-45 bg-white" aria-hidden="true" />
          </span>
        )}
        <span className="pointer-events-none absolute left-1/2 top-full mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/90 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-lg group-hover:block group-focus:block landscape:left-full landscape:top-1/2 landscape:ml-2 landscape:mt-0 landscape:-translate-y-1/2 landscape:translate-x-0">
          Voice & Text Chat
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-80 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-label="Close table talk"
            tabIndex={-1}
          />
          <section
            id="game-table-talk"
            className="fixed inset-x-3 bottom-3 z-90 flex h-[min(72dvh,38rem)] max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-amber-100/20 bg-slate-950/95 shadow-2xl backdrop-blur-md sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[min(28rem,calc(100dvw-2rem))] landscape:bottom-3 landscape:left-20 landscape:right-auto"
            aria-label="Table talk"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-amber-100/10 px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
                <TableTalkIcon />
              </span>
              <div className="min-w-0 grow">
                <h2 className="font-serif text-2xl text-amber-50">Table Talk</h2>
                <p className="flex items-center gap-1.5 text-xs text-amber-100/45">
                  <span className={clsx('h-2 w-2 shrink-0 rounded-full', canChat ? 'bg-emerald-400' : 'bg-amber-400')} />
                  {connectionLabel}
                </p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-amber-100/15 text-amber-100/60 transition hover:bg-slate-900 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
                onClick={() => setOpen(false)}
                aria-label="Close table talk"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>
            <div className="flex shrink-0 items-center gap-2 border-b border-amber-100/10 pr-4">
              <TableTalkParticipants className="min-w-0 grow border-b-0!" room={p2pRoom} voice={voice} />
              <TableTalkMicrophone voice={voice} />
            </div>
            <div ref={messagesRef} className="min-h-0 grow overflow-y-auto overscroll-contain px-3 py-3">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100/10 text-amber-200/70">
                    <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-2 font-serif text-lg text-amber-50">{canChat ? 'The conversation starts here.' : 'Waiting for company.'}</p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-amber-100/45">
                    {canChat
                      ? 'Say hello, compare notes, or pass the time while everyone gathers.'
                      : 'Once another player enters the room and connects, you can chat right here.'}
                  </p>
                </div>
              ) : (
                <ol aria-live="polite" aria-label="Conversation messages">
                  {messages.map((chatMessage, index) => {
                    const previous = messages[index - 1]
                    const next = messages[index + 1]
                    const followsSameSender = previous?.memberId === chatMessage.memberId && chatMessage.sentAt.getTime() - previous.sentAt.getTime() < MESSAGE_GROUP_WINDOW_MS
                    const followedBySameSender = next?.memberId === chatMessage.memberId && next.sentAt.getTime() - chatMessage.sentAt.getTime() < MESSAGE_GROUP_WINDOW_MS
                    const showTimestamp = !previous || chatMessage.sentAt.getTime() - previous.sentAt.getTime() >= MESSAGE_GROUP_WINDOW_MS
                    const isMine = chatMessage.memberId === p2pRoom.myId
                    const player = userLookup[membersById[chatMessage.memberId]?.player_id]
                    return (
                      <li key={`${chatMessage.memberId}-${chatMessage.sentAt.getTime()}-${index}`} className={clsx('flex', index > 0 && (followsSameSender ? 'mt-1.5' : 'mt-4'), isMine && 'justify-end')}>
                        <div className={clsx('max-w-[88%]', isMine && 'text-right')}>
                          {(!followsSameSender || showTimestamp) && (
                            <div className="mb-1 flex items-baseline gap-2 px-1">
                              {!followsSameSender && <span className="truncate text-xs font-bold text-amber-100/60">{isMine ? 'You' : (player?.displayName ?? 'Explorer')}</span>}
                              {showTimestamp && <time className="text-[0.65rem] text-amber-100/30" dateTime={chatMessage.sentAt.toISOString()}>{formatMessageTime(chatMessage.sentAt)}</time>}
                            </div>
                          )}
                          <p className={clsx('whitespace-pre-wrap wrap-break-word rounded-2xl px-3 py-2 text-left text-sm leading-5 shadow-md', isMine ? 'bg-[#f5edcf] text-slate-950' : 'border border-amber-100/10 bg-white/8 text-amber-50', !followedBySameSender && (isMine ? 'rounded-br-sm' : 'rounded-bl-sm'))}>{chatMessage.message}</p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
            <form className="shrink-0 border-t border-amber-100/10 bg-slate-950/75 p-2" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="game-chat-message">Message the table</label>
              <div className="flex items-end gap-2">
                <textarea
                  id="game-chat-message"
                  className="max-h-32 min-h-10 min-w-0 grow resize-none rounded-xl border border-amber-100/20 bg-amber-50/95 px-3 py-2 text-[16px] text-slate-950 placeholder:text-slate-500 focus:border-amber-300 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, 500))}
                  onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage() }
                  }}
                  placeholder={canChat ? 'Message the table…' : 'Waiting for another player…'}
                  rows={1}
                  maxLength={500}
                  disabled={!canChat}
                  enterKeyHint="send"
                  onFocus={(event) => window.setTimeout(() => event.currentTarget.scrollIntoView({ block: 'nearest' }), 250)}
                />
                <ExpeditionButton className="h-10 min-h-10! w-10 px-0" tone="primary" compact Icon={PaperAirplaneIcon} type="submit" disabled={!canChat || !draft.trim()} aria-label="Send message" title="Send message" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 px-1">
                <p className="text-[0.65rem] text-amber-100/35">Enter to send · Shift + Enter for a new line</p>
                {draft.length > 400 && <span className="text-[0.65rem] text-amber-100/35">{draft.length}/500</span>}
              </div>
            </form>
          </section>
        </>
      )}
    </>
  )
}

const messageTimeFormatter = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' })
const formatMessageTime = (date: Date) => messageTimeFormatter.format(date)
const MESSAGE_GROUP_WINDOW_MS = 3 * 60 * 1000
