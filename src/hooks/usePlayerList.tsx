import { useAuthQuery, useAuthSubscription } from '@nhost/react-apollo'
import { PLAYER_LIST, STREAM_NEW_PLAYERS, WATCH_ONLINE_STATUSES } from '../graphql/queries'
import { useEffect, useState } from 'react'

interface Player {
  id: string
  displayName: string
  avatarUrl?: string
  lastSeen: string
}

export const usePlayerList = () => {
  const [list, setList] = useState<Player[]>([])

  const { data } = useAuthQuery(PLAYER_LIST)

  const latestId = data?.game_player?.at(-1)?.id

  useAuthSubscription(STREAM_NEW_PLAYERS, {
    variables: { latestId },
    skip: latestId == null,
    onData({ data }) {
      setList((l) => l.concat(data.data?.game_player_stream?.map((p) => p.player) ?? []))
    },
  })

  useEffect(() => {
    if (!Array.isArray(data?.game_player)) return

    setList(data.game_player.map((p) => p.player))
  }, [data])

  return { list, userLookup: list.reduce((map, item) => ({ ...map, [item.id]: item }), {} as Record<string, Player>) }
}
