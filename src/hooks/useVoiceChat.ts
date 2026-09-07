import { useEffect, useRef, useState } from 'react'
import { toast } from '@8thday/react'
import type { P2PRoom, RoomMessage, RoomPeer, RoomStream } from '../p2p-connection/p2p-room'

const VOICE_STATE_MESSAGE = 'voice-state'

const isVoiceState = (data: unknown): data is { enabled: boolean } =>
  !!data && typeof data === 'object' && 'enabled' in data && typeof data.enabled === 'boolean'

export const useVoiceChat = (room?: P2PRoom) => {
  const [enabled, setEnabled] = useState(false)
  const [changing, setChanging] = useState(false)
  const [memberStates, setMemberStates] = useState<Record<number, boolean>>({})
  const activeRoomRef = useRef<P2PRoom>()
  const enabledRef = useRef(false)
  const memberStatesRef = useRef<Record<number, boolean>>({})
  const localStreamRef = useRef<MediaStream>()
  const remoteAudioRef = useRef(new Map<number, HTMLAudioElement>())

  const setMemberState = (memberId: number, voiceEnabled: boolean) => {
    memberStatesRef.current = { ...memberStatesRef.current, [memberId]: voiceEnabled }
    setMemberStates(memberStatesRef.current)
  }

  const stopRemoteAudio = (memberId?: number) => {
    const entries = memberId === undefined
      ? [...remoteAudioRef.current.entries()]
      : [[memberId, remoteAudioRef.current.get(memberId)] as const]
    entries.forEach(([id, audio]) => {
      if (!audio) return
      audio.pause()
      audio.srcObject = null
      remoteAudioRef.current.delete(id)
    })
  }

  const setVoiceEnabled = (activeRoom: P2PRoom, voiceEnabled: boolean) => {
    enabledRef.current = voiceEnabled
    setEnabled(voiceEnabled)
    setMemberState(activeRoom.myId, voiceEnabled)
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = voiceEnabled })
    remoteAudioRef.current.forEach((audio) => {
      audio.muted = !voiceEnabled
      if (voiceEnabled) audio.play().catch(() => undefined)
    })
    activeRoom.broadcast(VOICE_STATE_MESSAGE, { enabled: voiceEnabled })
  }

  const disposeVoice = (activeRoom: P2PRoom) => {
    enabledRef.current = false
    activeRoom.broadcast(VOICE_STATE_MESSAGE, { enabled: false })
    const stream = localStreamRef.current
    localStreamRef.current = undefined
    if (stream) {
      activeRoom.getPeers().forEach(({ userId }) => activeRoom.removeStreamFrom(userId, stream))
      stream.getTracks().forEach((track) => track.stop())
    }
    stopRemoteAudio()
  }

  useEffect(() => {
    activeRoomRef.current = room
    enabledRef.current = false
    memberStatesRef.current = {}
    setEnabled(false)
    setChanging(false)
    setMemberStates({})
    if (!room) return

    const updatePeerState = ({ userId, memberId, state }: RoomPeer) => {
      if (state !== 'connected') {
        setMemberState(memberId, false)
        stopRemoteAudio(memberId)
        return
      }
      room.sendTo(userId, VOICE_STATE_MESSAGE, { enabled: enabledRef.current })
      const stream = localStreamRef.current
      if (stream) room.addStreamTo(userId, stream)
    }
    const receiveVoiceState = (message: RoomMessage) => {
      if (message.type !== VOICE_STATE_MESSAGE || !isVoiceState(message.data)) return
      setMemberState(message.memberId, message.data.enabled)
    }
    const receiveStream = ({ memberId, stream }: RoomStream) => {
      stopRemoteAudio(memberId)
      const audio = new Audio()
      audio.autoplay = true
      audio.muted = !enabledRef.current
      audio.srcObject = stream
      remoteAudioRef.current.set(memberId, audio)
      audio.play().catch(() => undefined)
    }

    room.on('peer-state', updatePeerState)
    room.on('message', receiveVoiceState)
    room.on('stream', receiveStream)

    return () => {
      activeRoomRef.current = undefined
      room.off('peer-state', updatePeerState)
      room.off('message', receiveVoiceState)
      room.off('stream', receiveStream)
      disposeVoice(room)
    }
  }, [room])

  const toggle = async () => {
    if (!room || changing) return
    if (localStreamRef.current) return setVoiceEnabled(room, !enabledRef.current)

    setChanging(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      if (activeRoomRef.current !== room) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      localStreamRef.current = stream
      room.getPeers().forEach(({ userId }) => room.addStreamTo(userId, stream))
      setVoiceEnabled(room, true)
    } catch {
      toast.error({ message: 'Microphone unavailable', description: 'Allow microphone access to use voice chat.' })
    } finally {
      if (activeRoomRef.current === room) setChanging(false)
    }
  }

  return { enabled, changing, memberStates, toggle }
}

export type VoiceChatState = ReturnType<typeof useVoiceChat>
