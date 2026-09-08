import { useEffect } from 'react'
import { toast } from '@8thday/react'
import type { P2PRoom, RoomPeer, RoomStream } from '../p2p-connection/p2p-room'

export const useVoiceChat = (room?: P2PRoom) => {
  useEffect(() => {
    if (!room) return

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
      if (state !== 'connected') stopRemote(memberId)
      else if (localStream) room.addStreamTo(userId, localStream)
    }
    // Browsers may require a page interaction before allowing audible playback.
    const resumeAudio = () => remoteAudio.forEach((audio) => { if (audio.paused) play(audio) })

    room.on('stream', receiveStream)
    room.on('peer-state', updatePeer)
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
      document.removeEventListener('pointerdown', resumeAudio)
      document.removeEventListener('keydown', resumeAudio)
      remoteAudio.forEach((_, memberId) => stopRemote(memberId))
      if (localStream) {
        const stream = localStream
        room.getPeers().forEach(({ userId }) => room.removeStreamFrom(userId, stream))
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [room])
}
