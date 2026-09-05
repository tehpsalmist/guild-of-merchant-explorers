import type { BoardName, GameInputs, PlayerInputs } from './GameState'
import type { RoomSubSubscription } from '../graphql/types.generated'

export interface RoomSetup {
  roomId: number
  boardName: BoardName | ''
  colors: Record<number, string>
}

export const GAME_SETUP_MESSAGE = 'game-setup'
export const GAME_SETUP_COLOR_MESSAGE = 'game-setup-color'

export const EXPLORER_COLORS = [
  'hue-rotate-[310deg] saturate-[7] brightness-[0.7]',
  'hue-rotate-[350deg] saturate-[6] brightness-[0.9]',
  'hue-rotate-[10deg] saturate-[7]',
  'hue-rotate-[30deg] saturate-[5]',
  'hue-rotate-[120deg] saturate-[3]',
  'hue-rotate-[150deg] saturate-[3] brightness-[0.8]',
  'hue-rotate-[240deg] saturate-[2] brightness-[0.9]',
  'hue-rotate-[290deg] saturate-[3]',
] as const

const BOARD_NAMES: BoardName[] = ['aghon', 'avenia', 'kazan', 'cnidaria', 'northProylia', 'xawskil']

export interface GameSetupMessageData {
  setup: RoomSetup
  rejectedColor?: {
    memberId: number
    color: string
    reason: string
  }
}

export interface GameSetupColorMessageData {
  color: string
}

type Room = NonNullable<RoomSubSubscription['room_by_pk']>
type AssembledRoomGame =
  | { inputs: GameInputs & { playerData: PlayerInputs[] }; requirements: [] }
  | { inputs: null; requirements: string[] }

export function isGameSetupMessageData(value: unknown, roomId: number): value is GameSetupMessageData {
  if (!value || typeof value !== 'object' || !('setup' in value)) return false
  const message = value as Record<string, unknown>
  if (!isRoomSetup(message.setup, roomId)) return false
  if (message.rejectedColor === undefined) return true
  if (!message.rejectedColor || typeof message.rejectedColor !== 'object') return false
  const rejection = message.rejectedColor as Record<string, unknown>
  return (
    typeof rejection.memberId === 'number' &&
    typeof rejection.color === 'string' &&
    typeof rejection.reason === 'string'
  )
}

export function isGameSetupColorMessageData(value: unknown): value is GameSetupColorMessageData {
  return (
    !!value &&
    typeof value === 'object' &&
    Object.keys(value).length === 1 &&
    'color' in value &&
    typeof value.color === 'string'
  )
}

export function incorporatePlayerColor(
  room: Room,
  setup: RoomSetup,
  memberId: number,
  color: string,
): { setup: RoomSetup; error?: string } {
  const member = room.members.find((candidate) => candidate.id === memberId && candidate.invite_accepted)
  if (!member) return { setup, error: 'You are not an accepted explorer at this table.' }
  if (!EXPLORER_COLORS.includes(color as (typeof EXPLORER_COLORS)[number])) {
    return { setup, error: 'That color is not available.' }
  }
  const usedByAnotherMember = room.members.some(
    (candidate) => candidate.id !== memberId && candidate.invite_accepted && setup.colors[candidate.id] === color,
  )
  if (usedByAnotherMember) return { setup, error: 'That color is already selected. Choose another.' }

  return { setup: { ...setup, colors: { ...setup.colors, [memberId]: color } } }
}

function isRoomSetup(value: unknown, roomId: number): value is RoomSetup {
  if (!value || typeof value !== 'object') return false
  const setup = value as Record<string, unknown>
  if (setup.roomId !== roomId || typeof setup.colors !== 'object' || !setup.colors) return false
  if (setup.boardName !== '' && !BOARD_NAMES.includes(setup.boardName as BoardName)) return false
  return Object.entries(setup.colors).every(
    ([memberId, color]) => Number.isInteger(Number(memberId)) && typeof color === 'string',
  )
}

// Build a fresh snapshot from current membership, so removed players and pending
// invitations cannot leak into the game through old color selections.
export function assembleRoomGame(
  room: Room,
  setup: RoomSetup,
  userId: string | undefined,
  playerNames: Record<string, string> = {},
): AssembledRoomGame {
  if (userId !== room.host_id) return { inputs: null, requirements: ['Only the host can start this game.'] }
  if (setup.roomId !== room.id)
    return { inputs: null, requirements: ['Choose a board and player colors for this room.'] }

  const requirements: string[] = []
  const members = room.members.filter((member) => member.invite_accepted)
  if (!setup.boardName) requirements.push('Choose a board.')
  if (!members.length) requirements.push('At least one explorer must accept an invitation.')
  if (members.length && !members.some((member) => member.player_id === room.host_id)) {
    requirements.push('The host must be an accepted member of this room.')
  }

  const playerData: PlayerInputs[] = members.map((member, index) => {
    const name = playerNames[member.player_id] || `Explorer ${index + 1}`
    const color = setup.colors[member.id]?.trim() ?? ''
    if (!member.player_id.trim()) requirements.push(`${name} needs a player identity.`)
    if (!color) requirements.push(`Choose a color for ${name}.`)
    return { id: member.player_id, displayName: name, color }
  })
  const colors = playerData.map((player) => player.color).filter(Boolean)
  if (new Set(colors).size !== colors.length) requirements.push('Each explorer needs a different color.')
  if (new Set(playerData.map((player) => player.id)).size !== playerData.length) {
    requirements.push('Each explorer must have a unique player identity.')
  }

  if (requirements.length || !setup.boardName) return { inputs: null, requirements }
  return { inputs: { boardName: setup.boardName, playerData }, requirements: [] }
}
