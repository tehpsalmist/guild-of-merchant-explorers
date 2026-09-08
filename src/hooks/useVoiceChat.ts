import { useEffect, useRef, useState } from 'react'
import { toast } from '@8thday/react'
import type { P2PRoom, RoomMessage, RoomPeer, RoomStream } from '../p2p-connection/p2p-room'

const VOICE_MUTE_MESSAGE = 'voice-mute'

const isVoiceMuteMessage = (data: unknown): data is { muted: boolean } =>
  !!data && typeof data === 'object' && 'muted' in data && typeof data.muted === 'boolean'

export const useVoiceChat = (room?: P2PRoom) => {
  const [muted, setMuted] = useState(false)
  const [mutedMembers, setMutedMembers] = useState<Record<number, boolean>>({})
  const mutedRef = useRef(false)
  const mutedMembersRef = useRef<Record<number, boolean>>({})
  const localStreamRef = useRef<MediaStream>()

  const setMemberMuted = (memberId: number, isMuted: boolean) => {
    mutedMembersRef.current = { ...mutedMembersRef.current, [memberId]: isMuted }
    setMutedMembers(mutedMembersRef.current)
  }

  const toggleMute = () => {
    mutedRef.current = !mutedRef.current
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !mutedRef.current })
    setMuted(mutedRef.current)
    if (room) {
      setMemberMuted(room.myId, mutedRef.current)
      room.broadcast(VOICE_MUTE_MESSAGE, { muted: mutedRef.current })
    }
  }

  useEffect(() => {
    if (!room) return

    mutedMembersRef.current = { [room.myId]: mutedRef.current }
    setMutedMembers(mutedMembersRef.current)
    let disposed = false
    let localStream: MediaStream | undefined
    const remoteAudio = new Map<number, HTMLAudioElement>()
    const play = (audio: HTMLAudioElement) => {
      audio.play().catch((error: unknown) => console.warn('Voice playback could not start', error))
    }
    const stopRemote = (memberId: number) => {
      const audio = remoteAudio.get(memberId)
      if (!audio) return
      audio.pause()
      audio.srcObject = null
      remoteAudio.delete(memberId)
    }
    const receiveStream = ({ memberId, stream }: RoomStream) => {
      const audio = remoteAudio.get(memberId) ?? new Audio()
      audio.autoplay = true
      audio.srcObject = stream
      remoteAudio.set(memberId, audio)
      play(audio)
    }
    const updatePeer = ({ userId, memberId, state }: RoomPeer) => {
      // Register audio when a peer first appears so its initial offer includes it.
      if (localStream && state !== 'closed') room.addStreamTo(userId, localStream)
      if (state !== 'connected') {
        stopRemote(memberId)
        setMemberMuted(memberId, false)
      } else {
        room.sendTo(userId, VOICE_MUTE_MESSAGE, { muted: mutedRef.current })
      }
    }
    const receiveMuteState = (message: RoomMessage) => {
      if (message.type === VOICE_MUTE_MESSAGE && isVoiceMuteMessage(message.data)) {
        setMemberMuted(message.memberId, message.data.muted)
      }
    }
    // Browsers may require a page interaction before allowing audible playback.
    const resumeAudio = () => remoteAudio.forEach((audio) => { if (audio.paused) play(audio) })

    room.on('stream', receiveStream)
    room.on('peer-state', updatePeer)
    room.on('message', receiveMuteState)
    room.getRemoteStreams().forEach(receiveStream)
    document.addEventListener('pointerdown', resumeAudio)
    document.addEventListener('keydown', resumeAudio)

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        localStream = stream
        localStreamRef.current = stream
        // Honor a mute click made while microphone permission was pending.
        stream.getAudioTracks().forEach((track) => { track.enabled = !mutedRef.current })
        room.getPeers().forEach(({ userId }) => room.addStreamTo(userId, stream))
      } catch (error) {
        if (disposed) return
        console.error('Microphone capture could not start', error)
        toast.error({ message: 'Microphone unavailable', description: 'Allow microphone access to stream voice.' })
      }
    }
    void startAudio()

    return () => {
      disposed = true
      room.off('stream', receiveStream)
      room.off('peer-state', updatePeer)
      room.off('message', receiveMuteState)
      document.removeEventListener('pointerdown', resumeAudio)
      document.removeEventListener('keydown', resumeAudio)
      remoteAudio.forEach((_, memberId) => stopRemote(memberId))
      if (localStream) {
        const stream = localStream
        if (localStreamRef.current === stream) localStreamRef.current = undefined
        room.getPeers().forEach(({ userId }) => room.removeStreamFrom(userId, stream))
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [room])

  return { muted, mutedMembers, toggleMute }
}

export type VoiceChatState = ReturnType<typeof useVoiceChat>
