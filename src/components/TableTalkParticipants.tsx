import type { P2PRoom } from '../p2p-connection/p2p-room'
import { usePlayerList } from '../hooks/usePlayerList'
import clsx from 'clsx'

export const TableTalkParticipants = ({ room, className }: { room: P2PRoom; className?: string }) => {
  const { userLookup } = usePlayerList()

  return (
    <div className={clsx('flex flex-wrap gap-x-3 gap-y-1 border-b border-amber-100/10 px-4 py-2 text-xs text-amber-100/55', className)}>
      {room.members.filter((member) => member.invite_accepted).map((member) => (
        <span key={member.id} className="max-w-32 truncate">
          {member.id === room.myId ? 'You' : (userLookup[member.player_id]?.displayName ?? 'Explorer')}
        </span>
      ))}
    </div>
  )
}
