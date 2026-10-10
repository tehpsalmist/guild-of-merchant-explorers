import React, { ReactNode, useState } from 'react'
import clsx from 'clsx'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowsRightLeftIcon,
  HandRaisedIcon,
  InboxIcon,
  TrophyIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Avatar } from './Avatar'
import { countHighScores, useHighScoreRecords } from '../hooks/useHighScores'
import { EVERYONE, type ScoreExchange, type ScoreExchangeRecipient } from '../hooks/useScoreExchange'
import { describeHighScoreCount } from './ScoreExchangeToasts'

export interface ScoreExchangePlayer {
  userId: string
  name: string
  avatarUrl?: string
  connected: boolean
}

interface ScoreExchangePanelProps {
  exchange: ScoreExchange
  /** The other accepted members of the room. */
  players: ScoreExchangePlayer[]
  canSend: boolean
}

export const ScoreExchangePanel = ({ exchange, players, canSend }: ScoreExchangePanelProps) => {
  const [chosenRecipient, setChosenRecipient] = useState<ScoreExchangeRecipient>(EVERYONE)
  const myScores = countHighScores(useHighScoreRecords())
  // Fall back to everyone if the chosen player leaves the room.
  const recipient = players.some(({ userId }) => userId === chosenRecipient) ? chosenRecipient : EVERYONE
  const recipientName = players.find(({ userId }) => userId === recipient)?.name
  const disabled = !canSend || !players.length
  const inboxCount = exchange.requests.length + exchange.shares.length
  const avatarFor = (userId: string) => players.find((player) => player.userId === userId)?.avatarUrl

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-100/50">Trade with</h3>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Trade high scores with">
          <RecipientChip
            selected={recipient === EVERYONE}
            disabled={disabled}
            onSelect={() => setChosenRecipient(EVERYONE)}
            icon={<UserGroupIcon className="h-5 w-5" aria-hidden="true" />}
            label="Everyone"
          />
          {players.map((player) => (
            <RecipientChip
              key={player.userId}
              selected={recipient === player.userId}
              disabled={disabled}
              onSelect={() => setChosenRecipient(player.userId)}
              icon={
                <span className="relative block h-6 w-6">
                  <Avatar className="h-6 w-6 bg-amber-50/10" avatarUrl={player.avatarUrl} />
                  <span
                    className={clsx(
                      'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950',
                      player.connected ? 'bg-emerald-400' : 'bg-slate-500',
                    )}
                    aria-hidden="true"
                  />
                </span>
              }
              label={player.name}
              detail={player.connected ? undefined : 'Delivered when they connect'}
            />
          ))}
        </div>
        {!players.length && (
          <p className="mt-2 text-xs text-amber-100/50">Invite another explorer to trade high scores.</p>
        )}
      </section>

      <div className="grid gap-2 sm:grid-cols-2">
        <ExchangeActionButton
          icon={<ArrowUpTrayIcon className="h-6 w-6" aria-hidden="true" />}
          title="Share my scores"
          detail={describeHighScoreCount(myScores)}
          disabled={disabled || !myScores.scores}
          onClick={() => exchange.shareScores(recipient)}
          tone="amber"
        />
        <ExchangeActionButton
          icon={<ArrowDownTrayIcon className="h-6 w-6" aria-hidden="true" />}
          title="Request scores"
          detail={recipientName ? `Ask ${recipientName}` : 'Ask the whole table'}
          disabled={disabled}
          onClick={() => exchange.requestScores(recipient)}
          tone="sky"
        />
      </div>

      <section aria-labelledby="score-exchange-inbox">
        <h3
          id="score-exchange-inbox"
          className="mb-2 flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-amber-100/50"
        >
          <InboxIcon className="h-4 w-4" aria-hidden="true" />
          Inbox
          {inboxCount > 0 && (
            <span className="rounded-full bg-amber-300 px-1.5 py-0.5 text-[0.6rem] tracking-normal text-amber-950">
              {inboxCount}
            </span>
          )}
        </h3>

        {inboxCount === 0 ? (
          <p className="rounded-xl border border-dashed border-amber-100/20 bg-black/15 px-4 py-5 text-center text-sm text-amber-50/55">
            Scores and requests from the table will land here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {exchange.requests.map((request) => (
              <InboxItem
                key={request.id}
                avatarUrl={avatarFor(request.fromUserId)}
                badge={<HandRaisedIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                title={
                  <>
                    <strong>{exchange.playerName(request.fromUserId)}</strong> wants to see your high scores
                  </>
                }
                detail={myScores.scores ? formatTime(request.receivedAt) : 'You have no high scores to share yet.'}
                action={
                  <InboxButton
                    primary
                    disabled={!canSend || !myScores.scores}
                    onClick={() => exchange.shareScores(request.fromUserId)}
                  >
                    Share
                  </InboxButton>
                }
                onDismiss={() => exchange.dismissRequest(request.id)}
              />
            ))}
            {exchange.shares.map((share) => (
              <InboxItem
                key={share.id}
                avatarUrl={avatarFor(share.fromUserId)}
                badge={<TrophyIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                highlighted={!share.seen}
                title={
                  <>
                    <strong>{exchange.playerName(share.fromUserId)}</strong> shared their high scores
                  </>
                }
                detail={`${describeHighScoreCount(countHighScores(share.scores))} · ${formatTime(share.receivedAt)}`}
                action={
                  <InboxButton primary onClick={() => exchange.openComparison(share.id)}>
                    Compare
                  </InboxButton>
                }
                onDismiss={() => exchange.dismissShare(share.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

const RecipientChip = ({
  selected,
  disabled,
  onSelect,
  icon,
  label,
  detail,
}: {
  selected: boolean
  disabled: boolean
  onSelect(): void
  icon: ReactNode
  label: string
  detail?: string
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    disabled={disabled}
    className={clsx(
      'flex min-w-0 max-w-full items-center gap-2 rounded-full border py-1 pl-1.5 pr-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-40',
      selected
        ? 'border-amber-300 bg-amber-300/15 text-amber-50 ring-1 ring-amber-300/50'
        : 'border-amber-100/15 bg-white/5 text-amber-100/70 enabled:hover:border-amber-100/35 enabled:hover:bg-white/10',
    )}
    onClick={onSelect}
    title={detail}
  >
    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-amber-200">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
)

const ExchangeActionButton = ({
  icon,
  title,
  detail,
  disabled,
  onClick,
  tone,
}: {
  icon: ReactNode
  title: string
  detail: string
  disabled: boolean
  onClick(): void
  tone: 'amber' | 'sky'
}) => (
  <button
    type="button"
    disabled={disabled}
    className={clsx(
      'group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-left shadow-lg transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5',
      tone === 'amber'
        ? 'border-amber-300/35 bg-linear-to-br from-amber-300/20 to-amber-950/30 focus:ring-amber-200 enabled:hover:border-amber-300/70'
        : 'border-sky-300/35 bg-linear-to-br from-sky-300/20 to-sky-950/30 focus:ring-sky-200 enabled:hover:border-sky-300/70',
    )}
    onClick={onClick}
  >
    <span
      className={clsx(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
        tone === 'amber' ? 'bg-amber-300 text-amber-950' : 'bg-sky-300 text-sky-950',
      )}
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block font-black text-amber-50">{title}</span>
      <span className="block truncate text-xs text-amber-100/60">{detail}</span>
    </span>
  </button>
)

const InboxItem = ({
  avatarUrl,
  badge,
  highlighted = false,
  title,
  detail,
  action,
  onDismiss,
}: {
  avatarUrl?: string
  badge: ReactNode
  highlighted?: boolean
  title: ReactNode
  detail: string
  action: ReactNode
  onDismiss(): void
}) => (
  <li
    className={clsx(
      'flex items-center gap-3 rounded-xl border p-2.5 transition',
      highlighted ? 'border-sky-300/50 bg-sky-300/10 ring-1 ring-sky-300/30' : 'border-amber-100/10 bg-white/5',
    )}
  >
    <span className="relative shrink-0">
      <Avatar className="h-9 w-9 bg-amber-50/10" avatarUrl={avatarUrl} />
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-300 text-amber-950">
        {badge}
      </span>
    </span>
    <span className="min-w-0 grow">
      <span className="block text-sm leading-snug text-amber-50 [&_strong]:font-black">
        {title}
        {highlighted && (
          <span className="ml-1.5 rounded-full bg-sky-300 px-1.5 py-0.5 align-middle text-[0.6rem] font-black uppercase tracking-wider text-sky-950">
            New
          </span>
        )}
      </span>
      <span className="block truncate text-xs text-amber-100/50">{detail}</span>
    </span>
    {action}
    <button
      type="button"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-amber-100/50 transition hover:bg-white/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
      onClick={onDismiss}
      aria-label="Dismiss"
      title="Dismiss"
    >
      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
    </button>
  </li>
)

const InboxButton = ({
  primary = false,
  disabled = false,
  onClick,
  children,
}: {
  primary?: boolean
  disabled?: boolean
  onClick(): void
  children: ReactNode
}) => (
  <button
    type="button"
    disabled={disabled}
    className={clsx(
      'shrink-0 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-40',
      primary
        ? 'bg-[#f5edcf] text-slate-900 enabled:hover:bg-amber-50'
        : 'border border-amber-100/25 text-amber-50 enabled:hover:bg-white/10',
    )}
    onClick={onClick}
  >
    {children}
  </button>
)

/** The waiting room's card. */
export const ScoreExchangeCard = (props: ScoreExchangePanelProps) => (
  <section
    className="rounded-2xl border border-amber-100/15 bg-black/25 p-4 shadow-xl backdrop-blur-sm sm:p-5"
    aria-labelledby="score-exchange-heading"
  >
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
        <ArrowsRightLeftIcon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <h2 className="font-serif text-2xl text-amber-50" id="score-exchange-heading">
          High Score Exchange
        </h2>
        <p className="text-xs text-amber-100/45">Trade charts with the table. Nothing changes until you merge.</p>
      </div>
    </div>
    <ScoreExchangePanel {...props} />
  </section>
)

const timeFormatter = new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' })
const formatTime = (date: Date) => timeFormatter.format(date)
