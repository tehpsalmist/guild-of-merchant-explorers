// Compile-only regression checks; these functions are never executed.
import { useAuthQuery, useAuthSubscription } from '@nhost/react-apollo'
import type { ApolloClient } from '@apollo/client'
import type { NhostClient } from '@nhost/react'
import { GET_GAME, P2P_MESSAGE_STREAM, ROOM_SUB } from '../src/graphql/queries'
import { CLAIM_ROOM_SESSION, UPDATE_ROOM } from '../src/graphql/mutations'

type IsAny<T> = 0 extends (1 & T) ? true : false

export function useOperationInferenceChecks() {
  const { data } = useAuthSubscription(ROOM_SUB, { variables: { roomId: 1 } })
  const isAny: IsAny<typeof data> = false
  const name: string | null | undefined = data?.room_by_pk?.name
  // @ts-expect-error Unselected fields must not appear in subscription results.
  data?.room_by_pk?.game_id
  // @ts-expect-error Room IDs are integers, not strings.
  useAuthSubscription(ROOM_SUB, { variables: { roomId: '1' } })
  // @ts-expect-error Required operation variables cannot be omitted from the variables object.
  useAuthQuery(GET_GAME, { variables: {} })
  return { isAny, name }
}

export async function requestInferenceChecks(nhost: NhostClient, apollo: ApolloClient<object>) {
  const { data } = await nhost.graphql.request(CLAIM_ROOM_SESSION, { roomId: 1, clientInstanceId: 'client' })
  const isAny: IsAny<typeof data> = false
  const session: string | null | undefined = data?.claimRoomSession?.sessionId
  // @ts-expect-error Mutation input fields must match the generated schema input.
  await nhost.graphql.request(UPDATE_ROOM, { id: 1, set: { is_public: 'yes' } })
  // @ts-expect-error Required mutation variables are enforced by Nhost.
  await nhost.graphql.request(CLAIM_ROOM_SESSION, { roomId: 1 })
  apollo.subscribe({
    query: P2P_MESSAGE_STREAM,
    variables: { roomId: 1, sendingMemberId: 2, receivingMemberId: 3, latestId: 0 },
  }).subscribe(({ data }) => {
    const isAny: IsAny<typeof data> = false
    // @ts-expect-error JSON payloads must be validated before accessing their properties.
    data?.p2p_message_stream[0].message.type
    return isAny
  })
  return { isAny, session }
}
