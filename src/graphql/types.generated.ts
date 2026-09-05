/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** input type for updating data in table "room_member" */
export type Room_Member_Set_Input = {
  invite_accepted?: boolean | null | undefined;
};

/** input type for updating data in table "room" */
export type Room_Set_Input = {
  host_id?: string | null | undefined;
  is_public?: boolean | null | undefined;
  name?: string | null | undefined;
};

/** input type for updating data in table "auth.users" */
export type Users_Set_Input = {
  avatarUrl?: string | null | undefined;
  displayName?: string | null | undefined;
  lastSeen?: string | null | undefined;
  metadata?: unknown;
};

export type UpdateUserMutationVariables = Exact<{
  userId: string;
  set?: Users_Set_Input | null | undefined;
}>;


export type UpdateUserMutation = { updateUser: { id: string } | null };

export type PlayGameMutationVariables = Exact<{ [key: string]: never; }>;


export type PlayGameMutation = { insert_game_player_one: { id: number } | null };

export type LeaveGamePermanentlyMutationVariables = Exact<{
  id: number;
}>;


export type LeaveGamePermanentlyMutation = { delete_game_player_by_pk: { id: number } | null };

export type CreateRoomMutationVariables = Exact<{
  roomName: string;
  userId: string;
}>;


export type CreateRoomMutation = { insert_room_one: { id: number } | null };

export type CloseRoomMutationVariables = Exact<{
  id: number;
}>;


export type CloseRoomMutation = { delete_room_by_pk: { id: number } | null };

export type UpdateRoomMutationVariables = Exact<{
  id: number;
  set?: Room_Set_Input | null | undefined;
}>;


export type UpdateRoomMutation = { update_room_by_pk: { id: number } | null };

export type InvitePlayerMutationVariables = Exact<{
  roomId: number;
  playerId: string;
}>;


export type InvitePlayerMutation = { insert_room_member_one: { id: number } | null };

export type DisinvitePlayerMutationVariables = Exact<{
  roomMemberId: number;
}>;


export type DisinvitePlayerMutation = { delete_room_member_by_pk: { id: number } | null };

export type UpdateRoomMemberMutationVariables = Exact<{
  roomMemberId: number;
  set?: Room_Member_Set_Input | null | undefined;
}>;


export type UpdateRoomMemberMutation = { update_room_member_by_pk: { id: number } | null };

export type RequestToJoinRoomMutationVariables = Exact<{
  roomId: number;
}>;


export type RequestToJoinRoomMutation = { requestToJoinRoom: { success: boolean, error: string | null } | null };

export type ClaimRoomSessionMutationVariables = Exact<{
  roomId: number;
  clientInstanceId: string;
}>;


export type ClaimRoomSessionMutation = { claimRoomSession: { success: boolean, error: string | null, memberId: number | null, sessionId: string | null, leaseExpiresAt: string | null } | null };

export type HeartbeatRoomSessionMutationVariables = Exact<{
  roomId: number;
  sessionId: string;
}>;


export type HeartbeatRoomSessionMutation = { heartbeatRoomSession: { success: boolean, error: string | null } | null };

export type ReleaseRoomSessionMutationVariables = Exact<{
  roomId: number;
  sessionId: string;
}>;


export type ReleaseRoomSessionMutation = { releaseRoomSession: { success: boolean, error: string | null } | null };

export type AckNotificationMutationVariables = Exact<{
  id: number;
}>;


export type AckNotificationMutation = { update_game_player_notification_by_pk: { id: number } | null };

export type DeleteNotificationMutationVariables = Exact<{
  id: number;
}>;


export type DeleteNotificationMutation = { delete_game_player_notification_by_pk: { id: number } | null };

export type SendP2PMessageMutationVariables = Exact<{
  message: unknown;
  receiverId: number;
  senderId: number;
  roomId: number;
}>;


export type SendP2PMessageMutation = { insert_p2p_message_one: { id: number } | null };

export type GetGameQueryVariables = Exact<{
  userId: string;
}>;


export type GetGameQuery = { game_by_pk: { id: string, name: string, players: Array<{ id: number, player_id: string }> } | null };

export type GetRoomsSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type GetRoomsSubscription = { room: Array<{ id: number, name: string | null, is_public: boolean, host_id: string, members: Array<{ id: number, player_id: string, invite_accepted: boolean }> }> };

export type HostedRoomsQueryVariables = Exact<{
  hostId: string;
}>;


export type HostedRoomsQuery = { room: Array<{ id: number, name: string | null }> };

export type PlayerListQueryVariables = Exact<{ [key: string]: never; }>;


export type PlayerListQuery = { game_player: Array<{ id: number, player: { id: string, displayName: string, avatarUrl: string, lastSeen: string | null } }> };

export type StreamNewPlayersSubscriptionVariables = Exact<{
  latestId: number;
}>;


export type StreamNewPlayersSubscription = { game_player_stream: Array<{ id: number, player: { id: string, displayName: string, avatarUrl: string, lastSeen: string | null } }> };

export type WatchOnlineStatusesSubscriptionVariables = Exact<{
  limit: number;
}>;


export type WatchOnlineStatusesSubscription = { users: Array<{ lastSeen: string | null, id: string }> };

export type GameNotificationsQueryVariables = Exact<{
  userId: string;
}>;


export type GameNotificationsQuery = { game_player_notification: Array<{ id: number, message: unknown, ack: boolean, created_at: string }> };

export type StreamNotificationsSubscriptionVariables = Exact<{
  userId: string;
  latestId: number;
}>;


export type StreamNotificationsSubscription = { game_player_notification_stream: Array<{ id: number, message: unknown, ack: boolean, created_at: string }> };

export type RoomSubSubscriptionVariables = Exact<{
  roomId: number;
}>;


export type RoomSubSubscription = { room_by_pk: { id: number, host_id: string, created_at: string, name: string | null, is_public: boolean, members: Array<{ id: number, player_id: string, invite_accepted: boolean }> } | null };

export type LatestP2PMessageQueryVariables = Exact<{
  roomId: number;
  sendingMemberId: number;
  receivingMemberId: number;
}>;


export type LatestP2PMessageQuery = { p2p_message: Array<{ id: number, message: unknown }> };

export type P2PMessageStreamSubscriptionVariables = Exact<{
  roomId: number;
  sendingMemberId: number;
  receivingMemberId: number;
  latestId: number;
}>;


export type P2PMessageStreamSubscription = { p2p_message_stream: Array<{ id: number, message: unknown, created_at: string }> };
