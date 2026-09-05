import { useNhostClient, useUserId } from '@nhost/react'
import { GET_GAME } from '../graphql/queries'
import { useAuthQuery } from '@nhost/react-apollo'
import { LEAVE_GAME_PERMANENTLY, PLAY_GAME } from '../graphql/mutations'
import { toast } from '@8thday/react'
import { getGraphqlErrorMessage } from '../graphql/utils'

export const useHasJoined = () => {
  const nhost = useNhostClient()

  const userId = useUserId()

  const { data, loading, refetch } = useAuthQuery(GET_GAME, { variables: { userId: userId ?? '' }, skip: !userId })

  const joined = !!userId && data?.game_by_pk?.players?.[0]?.player_id === userId

  const joinGame = async () => {
    const res = await nhost.graphql.request(PLAY_GAME)

    if (res.error) {
      return toast.error({ message: 'Trouble Entering Forum', description: getGraphqlErrorMessage(res.error) })
    }

    refetch()
    toast.success({ message: "Let's Play!" })
  }

  const leaveGame = async () => {
    if (
      !confirm(
        'Leaving permanently will prevent other players from seeing your name and inviting you to tables. Proceed?',
      )
    ) {
      return
    }

    const id = data?.game_by_pk?.players[0]?.id
    if (id == null) return

    const res = await nhost.graphql.request(LEAVE_GAME_PERMANENTLY, { id })

    if (res.error) {
      return toast.error({ message: 'Trouble Leaving Forum', description: getGraphqlErrorMessage(res.error) })
    }

    refetch()
  }

  return {
    gameName: data?.game_by_pk?.name ?? '',
    joined,
    loading,
    joinGame,
    leaveGame,
  }
}
