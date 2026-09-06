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

  const stopVoice = (activeRoom: P2PRoom, notifyPeers = true) => {
    enabledRef.current = false
    setEnabled(false)
    setMemberState(activeRoom.myId, false)
    if (notifyPeers) activeRoom.broadcast(VOICE_STATE_MESSAGE, { enabled: false })
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
        const stream = localStreamRef.current
        if (stream) room.removeStreamFrom(userId, stream)
        stopRemoteAudio(memberId)
        return
      }
      room.sendTo(userId, VOICE_STATE_MESSAGE, { enabled: enabledRef.current })
      const stream = localStreamRef.current
      if (stream && memberStatesRef.current[memberId]) room.addStreamTo(userId, stream)
    }
    const receiveVoiceState = (message: RoomMessage) => {
      if (message.type !== VOICE_STATE_MESSAGE || !isVoiceState(message.data)) return
      setMemberState(message.memberId, message.data.enabled)
      const stream = localStreamRef.current
      if (stream && enabledRef.current) {
        if (message.data.enabled) room.addStreamTo(message.userId, stream)
        else room.removeStreamFrom(message.userId, stream)
      }
      if (!message.data.enabled) stopRemoteAudio(message.memberId)
    }
    const receiveStream = ({ memberId, stream }: RoomStream) => {
      if (!enabledRef.current) return
      stopRemoteAudio(memberId)
      const audio = new Audio()
      audio.autoplay = true
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
      stopVoice(room)
    }
  }, [room])

  const toggle = async () => {
    if (!room || changing) return
    if (enabledRef.current) return stopVoice(room)

    setChanging(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      if (activeRoomRef.current !== room) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      localStreamRef.current = stream
      enabledRef.current = true
      setEnabled(true)
      setMemberState(room.myId, true)
      room.getPeers().forEach(({ userId, memberId, state }) => {
        if (state === 'connected' && memberStatesRef.current[memberId]) room.addStreamTo(userId, stream)
      })
      room.broadcast(VOICE_STATE_MESSAGE, { enabled: true })
    } catch {
      toast.error({ message: 'Microphone unavailable', description: 'Allow microphone access to use voice chat.' })
    } finally {
      if (activeRoomRef.current === room) setChanging(false)
    }
  }

  return { enabled, changing, memberStates, toggle }
}
