import { gql } from '@apollo/client'
import { GOME_ID } from '../data/get-a-room'

export const UPDATE_USER = gql`
  mutation UpdateUser($userId: uuid!, $set: users_set_input) {
    updateUser(pk_columns: { id: $userId }, _set: $set) {
      id
    }
  }
`

export const PLAY_GAME = gql`
  mutation PlayGame {
    insert_game_player_one(object: { game_id: "${GOME_ID}" }) {
      id
    }
  }
`

export const LEAVE_GAME_PERMANENTLY = gql`
  mutation LeaveGamePermanently($id: Int!) {
    delete_game_player_by_pk(id: $id) {
      id
    }
  }
`

export const CREATE_ROOM = gql`
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

export const CLOSE_ROOM = gql`
  mutation CloseRoom($id: Int!) {
    delete_room_by_pk(id: $id) {
      id
    }
  }
`

export const UPDATE_ROOM = gql`
  mutation UpdateRoom($id: Int!, $set: room_set_input) {
    update_room_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
    }
  }
`

export const INVITE_PLAYER = gql`
  mutation InvitePlayer($roomId: Int!, $playerId: uuid!) {
    insert_room_member_one(object: { room_id: $roomId, player_id: $playerId }) {
      id
    }
  }
`

export const DISINVITE_PLAYER = gql`
  mutation DisinvitePlayer($roomMemberId: Int!) {
    delete_room_member_by_pk(id: $roomMemberId) {
      id
    }
  }
`

export const UPDATE_ROOM_MEMBER = gql`
  mutation UpdateRoom($roomMemberId: Int!, $set: room_member_set_input) {
    update_room_member_by_pk(pk_columns: { id: $roomMemberId }, _set: $set) {
      id
    }
  }
`

export const REQUEST_TO_JOIN_ROOM = gql`
  mutation RequestToJoinRoom($roomId: Int!) {
    requestToJoinRoom(roomId: $roomId) {
      success
      error
    }
  }
`

export const ACK_NOTIFICATION = gql`
  mutation AckNotification($id: Int!) {
    update_game_player_notification_by_pk(pk_columns: { id: $id }, _set: { ack: true }) {
      id
    }
  }
`

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: Int!) {
    delete_game_player_notification_by_pk(id: $id) {
      id
    }
  }
`

export const SEND_P2P_MESSAGE = gql`
  mutation SendP2PMessage($message: jsonb!, $receiverId: Int!, $senderId: Int!, $roomId: Int!) {
    insert_p2p_message_one(
      object: { message: $message, room_id: $roomId, receiver_member_id: $receiverId, sender_member_id: $senderId }
    ) {
      id
    }
  }
`
