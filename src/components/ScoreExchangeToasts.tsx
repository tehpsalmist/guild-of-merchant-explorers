import React, { ReactNode } from 'react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  TrophyIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const plural = (count: number, word: string) => `${count} ${count === 1 ? word : `${word}s`}`

export const describeHighScoreCount = ({ boards, scores }: { boards: number; scores: number }) =>
  scores ? `${plural(boards, 'board')} · ${plural(scores, 'score')}` : 'No high scores yet'

interface ExchangeToastProps {
  visible: boolean
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  onDismiss(): void
}

const ExchangeToast = ({ visible, icon, title, description, actions, onDismiss }: ExchangeToastProps) => (
  <div
    className={clsx(
      'pointer-events-auto w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-amber-100/25 bg-slate-950/95 text-amber-50 shadow-2xl shadow-black/50 backdrop-blur-md transition duration-300',
      visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0',
    )}
    role="status"
  >
    <div className="h-0.5 bg-linear-to-r from-amber-300 via-amber-100 to-sky-300" aria-hidden="true" />
    <div className="flex items-start gap-3 p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
        {icon}
      </span>
      <div className="min-w-0 grow">
        <p className="text-sm font-bold text-amber-50">{title}</p>
        {description && <p className="mt-0.5 text-xs text-amber-100/60">{description}</p>}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
      <button
        type="button"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-amber-100/50 transition hover:bg-white/10 hover:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </div>
)

const ToastButton = ({ primary = false, onClick, children }: { primary?: boolean; onClick(): void; children: ReactNode }) => (
  <button
    type="button"
    className={clsx(
      'rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition focus:outline-none focus:ring-2 focus:ring-amber-200',
      primary
        ? 'bg-[#f5edcf] text-slate-900 hover:bg-amber-50'
        : 'border border-amber-100/25 text-amber-50 hover:bg-white/10',
    )}
    onClick={onClick}
  >
    {children}
  </button>
)

export const notifyScoreExchange = (title: string, description?: string, failed = false) =>
  toast.custom(
    ({ id, visible }) => (
      <ExchangeToast
        visible={visible}
        icon={
          failed ? (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-300" aria-hidden="true" />
          ) : (
            <CheckCircleIcon className="h-6 w-6 text-emerald-300" aria-hidden="true" />
          )
        }
        title={title}
        description={description}
        onDismiss={() => toast.dismiss(id)}
      />
    ),
    { duration: failed ? 6000 : 4000 },
  )

export const notifyHighScoresShared = ({
  fromUserId,
  fromName,
  boards,
  scores,
  onCompare,
}: {
  fromUserId: string
  fromName: string
  boards: number
  scores: number
  onCompare(): void
}) =>
  toast.custom(
    ({ id, visible }) => (
      <ExchangeToast
        visible={visible}
        icon={<TrophyIcon className="h-6 w-6" aria-hidden="true" />}
        title={`${fromName} shared their high scores`}
        description={describeHighScoreCount({ boards, scores })}
        actions={
          <ToastButton
            primary
            onClick={() => {
              toast.dismiss(id)
              onCompare()
            }}
          >
            Compare
          </ToastButton>
        }
        onDismiss={() => toast.dismiss(id)}
      />
    ),
    // One toast per sender: a newer share replaces the older one.
    { id: `high-scores-share-${fromUserId}`, duration: 12000 },
  )

export const notifyHighScoresRequested = ({
  fromUserId,
  fromName,
  hasScores,
  onShare,
  onDismiss,
}: {
  fromUserId: string
  fromName: string
  hasScores: boolean
  onShare(): void
  onDismiss(): void
}) =>
  toast.custom(
    ({ id, visible }) => (
      <ExchangeToast
        visible={visible}
        icon={<HandRaisedIcon className="h-6 w-6" aria-hidden="true" />}
        title={`${fromName} wants to see your high scores`}
        description={hasScores ? 'Send them your charts?' : "You don't have any high scores to share yet."}
        actions={
          hasScores ? (
            <>
              <ToastButton
                primary
                onClick={() => {
                  toast.dismiss(id)
                  onShare()
                }}
              >
                Share mine
              </ToastButton>
              <ToastButton
                onClick={() => {
                  toast.dismiss(id)
                  onDismiss()
                }}
              >
                Not now
              </ToastButton>
            </>
          ) : undefined
        }
        onDismiss={() => toast.dismiss(id)}
      />
    ),
    { id: `high-scores-request-${fromUserId}`, duration: 20000 },
  )
