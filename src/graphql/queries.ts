import type { TypedDocumentNode } from '@apollo/client'
import type {
  GetGameQuery,
  GetGameQueryVariables,
  GetRoomsSubscription,
  GetRoomsSubscriptionVariables,
  HostedRoomsQuery,
  HostedRoomsQueryVariables,
  PlayerListQuery,
  PlayerListQueryVariables,
  StreamNewPlayersSubscription,
  StreamNewPlayersSubscriptionVariables,
  WatchOnlineStatusesSubscription,
  WatchOnlineStatusesSubscriptionVariables,
  GameNotificationsQuery,
  GameNotificationsQueryVariables,
  StreamNotificationsSubscription,
  StreamNotificationsSubscriptionVariables,
  RoomSubSubscription,
  RoomSubSubscriptionVariables,
  LatestP2PMessageQuery,
  LatestP2PMessageQueryVariables,
  P2PMessageStreamSubscription,
  P2PMessageStreamSubscriptionVariables,
} from './types.generated'
import { gql } from '@apollo/client'
import { GOME_ID } from '../data/get-a-room'

export const GET_GAME: TypedDocumentNode<GetGameQuery, GetGameQueryVariables> = gql`
  query GetGame ($userId: uuid!) {
    game_by_pk(id: "${GOME_ID}") {
      id
      name
      players(where: { player_id: {_eq: $userId } }) {
        id
        player_id
      }
    }
  }
`

export const GET_ROOMS: TypedDocumentNode<GetRoomsSubscription, GetRoomsSubscriptionVariables> = gql`
  subscription GetRooms {
    room(where: { game_id: { _eq: "${GOME_ID}" } }, order_by: { created_at: desc }) {
      id
      name
      is_public
      host_id
      members {
        id
        player_id
        invite_accepted
      }
    }
  }
`

export const GET_HOSTED_ROOM_NAMES: TypedDocumentNode<HostedRoomsQuery, HostedRoomsQueryVariables> = gql`
  query HostedRooms ($hostId: uuid!) {
    room(where: { game_id: { _eq: "${GOME_ID}" }, host_id: { _eq: $hostId } }, order_by: { created_at: desc }) {
      id
      name
    }
  }
`

export const PLAYER_LIST: TypedDocumentNode<PlayerListQuery, PlayerListQueryVariables> = gql`
  query PlayerList {
    game_player (where: { game_id: {_eq: "${GOME_ID}" } }, order_by: { player: { displayName: asc } }) {
      id
      player {
        id
        displayName
        avatarUrl
        lastSeen
      }
    }
  }
`

export const STREAM_NEW_PLAYERS: TypedDocumentNode<StreamNewPlayersSubscription, StreamNewPlayersSubscriptionVariables> = gql`
  subscription StreamNewPlayers($latestId: Int!) {
    game_player_stream(
      where: { game_id: { _eq: "${GOME_ID}" } }
      cursor: { initial_value: { id: $latestId } }
      batch_size: 4
    ) {
      id
      player {
        id
        displayName
        avatarUrl
        lastSeen
      }
    }
  }
`

export const WATCH_ONLINE_STATUSES: TypedDocumentNode<WatchOnlineStatusesSubscription, WatchOnlineStatusesSubscriptionVariables> = gql`
  subscription WatchOnlineStatuses($limit: Int!) {
    users(
      where: { games: { game_id: { _eq: "${GOME_ID}" } } }
      limit: $limit
      order_by: { lastSeen: desc_nulls_last }
    ) {
      lastSeen
      id
    }
  }
`

export const GAME_NOTIFICATIONS: TypedDocumentNode<GameNotificationsQuery, GameNotificationsQueryVariables> = gql`
  query GameNotifications($userId: uuid!) {
    game_player_notification(where: { game_id: { _eq: "${GOME_ID}" }, user_id: { _eq: $userId } }) {
      id
      message
      ack
      created_at
    }
  }
`

export const STREAM_NOTIFICATIONS: TypedDocumentNode<StreamNotificationsSubscription, StreamNotificationsSubscriptionVariables> = gql`
  subscription StreamNotifications($userId: uuid!, $latestId: Int!) {
    game_player_notification_stream(
      where: { game_id: { _eq: "${GOME_ID}" }, user_id: { _eq: $userId } }
      cursor: { initial_value: { id: $latestId } }
      batch_size: 1
    ) {
      id
      message
      ack
      created_at
    }
  }
`

export const ROOM_SUB: TypedDocumentNode<RoomSubSubscription, RoomSubSubscriptionVariables> = gql`
  subscription RoomSub($roomId: Int!) {
    room_by_pk(id: $roomId) {
      id
      host_id
      created_at
      name
      is_public
      members {
        id
        player_id
        invite_accepted
      }
    }
  }
`

export const LATEST_P2P_MESSAGE: TypedDocumentNode<LatestP2PMessageQuery, LatestP2PMessageQueryVariables> = gql`
  query LatestP2PMessage($roomId: Int!, $sendingMemberId: Int!, $receivingMemberId: Int!) {
    p2p_message(
      where: {
        room_id: { _eq: $roomId }
        sender_member_id: { _eq: $sendingMemberId }
        receiver_member_id: { _eq: $receivingMemberId }
      }
      limit: 1
      order_by: { id: desc }
    ) {
      id
      message
    }
  }
`

export const P2P_MESSAGE_STREAM: TypedDocumentNode<P2PMessageStreamSubscription, P2PMessageStreamSubscriptionVariables> = gql`
  subscription P2PMessageStream($roomId: Int!, $sendingMemberId: Int!, $receivingMemberId: Int!, $latestId: Int!) {
    p2p_message_stream(
      where: {
        room_id: { _eq: $roomId }
        sender_member_id: { _eq: $sendingMemberId }
        receiver_member_id: { _eq: $receivingMemberId }
      }
      batch_size: 1
      cursor: { initial_value: { id: $latestId } }
    ) {
      id
      message
      created_at
    }
  }
`
