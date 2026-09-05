import type { TypedDocumentNode } from '@apollo/client'
import type {
  UpdateUserMutation,
  UpdateUserMutationVariables,
  PlayGameMutation,
  PlayGameMutationVariables,
  LeaveGamePermanentlyMutation,
  LeaveGamePermanentlyMutationVariables,
  CreateRoomMutation,
  CreateRoomMutationVariables,
  CloseRoomMutation,
  CloseRoomMutationVariables,
  UpdateRoomMutation,
  UpdateRoomMutationVariables,
  InvitePlayerMutation,
  InvitePlayerMutationVariables,
  DisinvitePlayerMutation,
  DisinvitePlayerMutationVariables,
  UpdateRoomMemberMutation,
  UpdateRoomMemberMutationVariables,
  RequestToJoinRoomMutation,
  RequestToJoinRoomMutationVariables,
  ClaimRoomSessionMutation,
  ClaimRoomSessionMutationVariables,
  HeartbeatRoomSessionMutation,
  HeartbeatRoomSessionMutationVariables,
  ReleaseRoomSessionMutation,
  ReleaseRoomSessionMutationVariables,
  AckNotificationMutation,
  AckNotificationMutationVariables,
  DeleteNotificationMutation,
  DeleteNotificationMutationVariables,
  SendP2PMessageMutation,
  SendP2PMessageMutationVariables,
} from './types.generated'
import { gql } from '@apollo/client'
import { GOME_ID } from '../data/get-a-room'

export const UPDATE_USER: TypedDocumentNode<UpdateUserMutation, UpdateUserMutationVariables> = gql`
  mutation UpdateUser($userId: uuid!, $set: users_set_input) {
    updateUser(pk_columns: { id: $userId }, _set: $set) {
      id
    }
  }
`

export const PLAY_GAME: TypedDocumentNode<PlayGameMutation, PlayGameMutationVariables> = gql`
  mutation PlayGame {
    insert_game_player_one(object: { game_id: "${GOME_ID}" }) {
      id
    }
  }
`

export const LEAVE_GAME_PERMANENTLY: TypedDocumentNode<LeaveGamePermanentlyMutation, LeaveGamePermanentlyMutationVariables> = gql`
  mutation LeaveGamePermanently($id: Int!) {
    delete_game_player_by_pk(id: $id) {
      id
    }
  }
`

export const CREATE_ROOM: TypedDocumentNode<CreateRoomMutation, CreateRoomMutationVariables> = gql`
  mutation CreateRoom($roomName: String!, $userId: uuid!) {
    insert_room_one(object: {
      game_id: "${GOME_ID}",
      name: $roomName,
      members: {
        data: [{ invite_accepted: true, player_id: $userId }]
      }
    }) {
      id
    }
  }
`

export const CLOSE_ROOM: TypedDocumentNode<CloseRoomMutation, CloseRoomMutationVariables> = gql`
  mutation CloseRoom($id: Int!) {
    delete_room_by_pk(id: $id) {
      id
    }
  }
`

export const UPDATE_ROOM: TypedDocumentNode<UpdateRoomMutation, UpdateRoomMutationVariables> = gql`
  mutation UpdateRoom($id: Int!, $set: room_set_input) {
    update_room_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
    }
  }
`

export const INVITE_PLAYER: TypedDocumentNode<InvitePlayerMutation, InvitePlayerMutationVariables> = gql`
  mutation InvitePlayer($roomId: Int!, $playerId: uuid!) {
    insert_room_member_one(object: { room_id: $roomId, player_id: $playerId }) {
      id
    }
  }
`

export const DISINVITE_PLAYER: TypedDocumentNode<DisinvitePlayerMutation, DisinvitePlayerMutationVariables> = gql`
  mutation DisinvitePlayer($roomMemberId: Int!) {
    delete_room_member_by_pk(id: $roomMemberId) {
      id
    }
  }
`

export const UPDATE_ROOM_MEMBER: TypedDocumentNode<UpdateRoomMemberMutation, UpdateRoomMemberMutationVariables> = gql`
  mutation UpdateRoomMember($roomMemberId: Int!, $set: room_member_set_input) {
    update_room_member_by_pk(pk_columns: { id: $roomMemberId }, _set: $set) {
      id
    }
  }
`

export const REQUEST_TO_JOIN_ROOM: TypedDocumentNode<RequestToJoinRoomMutation, RequestToJoinRoomMutationVariables> = gql`
  mutation RequestToJoinRoom($roomId: Int!) {
    requestToJoinRoom(roomId: $roomId) {
      success
      error
    }
  }
`

export const CLAIM_ROOM_SESSION: TypedDocumentNode<ClaimRoomSessionMutation, ClaimRoomSessionMutationVariables> = gql`
  mutation ClaimRoomSession($roomId: Int!, $clientInstanceId: String!) {
    claimRoomSession(roomId: $roomId, clientInstanceId: $clientInstanceId) {
      success
      error
      memberId
      sessionId
      leaseExpiresAt
    }
  }
`

export const HEARTBEAT_ROOM_SESSION: TypedDocumentNode<HeartbeatRoomSessionMutation, HeartbeatRoomSessionMutationVariables> = gql`
  mutation HeartbeatRoomSession($roomId: Int!, $sessionId: String!) {
    heartbeatRoomSession(roomId: $roomId, sessionId: $sessionId) {
      success
      error
    }
  }
`

export const RELEASE_ROOM_SESSION: TypedDocumentNode<ReleaseRoomSessionMutation, ReleaseRoomSessionMutationVariables> = gql`
  mutation ReleaseRoomSession($roomId: Int!, $sessionId: String!) {
    releaseRoomSession(roomId: $roomId, sessionId: $sessionId) {
      success
      error
    }
  }
`

export const ACK_NOTIFICATION: TypedDocumentNode<AckNotificationMutation, AckNotificationMutationVariables> = gql`
  mutation AckNotification($id: Int!) {
    update_game_player_notification_by_pk(pk_columns: { id: $id }, _set: { ack: true }) {
      id
    }
  }
`

export const DELETE_NOTIFICATION: TypedDocumentNode<DeleteNotificationMutation, DeleteNotificationMutationVariables> = gql`
  mutation DeleteNotification($id: Int!) {
    delete_game_player_notification_by_pk(id: $id) {
      id
    }
  }
`

export const SEND_P2P_MESSAGE: TypedDocumentNode<SendP2PMessageMutation, SendP2PMessageMutationVariables> = gql`
  mutation SendP2PMessage($message: jsonb!, $receiverId: Int!, $senderId: Int!, $roomId: Int!) {
    insert_p2p_message_one(
      object: { message: $message, room_id: $roomId, receiver_member_id: $receiverId, sender_member_id: $senderId }
    ) {
      id
    }
  }
`
