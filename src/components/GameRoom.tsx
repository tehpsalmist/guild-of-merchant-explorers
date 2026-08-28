import React, { ComponentProps, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Main } from '../design-system/Main'
import { useAuthSubscription } from '@nhost/react-apollo'
import { ROOM_SUB } from '../graphql/queries'
import { Loading } from './Loading'
import { usePlayerList } from '../hooks/usePlayerList'
import { CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { P2PRoom } from '../p2p-connection/p2p-room'
import { useNhostClient, useUserId } from '@nhost/react'
import { useApolloClient } from '@apollo/client'
import { Button, copyText, TextArea } from '@8thday/react'
import { P2PConnection } from '../p2p-connection/p2p-connection'

interface ChatMessage {
  message: string
  id: number
}

export interface GameRoomProps extends ComponentProps<'main'> {}

export const GameRoom = ({ className = '', ...props }: GameRoomProps) => {
  const [p2pRoom, setP2PRoom] = useState<P2PRoom>()
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const nhost = useNhostClient()
  const apollo = useApolloClient()

  const { roomId } = useParams()

  const userId = useUserId()

  const { userLookup } = usePlayerList()
  const { data } = useAuthSubscription(ROOM_SUB, { variables: { roomId } })

  const room = data?.room_by_pk

  const memberUserIdLookup = room?.members?.reduce((a, m) => ({...a, [m.id]:m.player_id}))??{}

  useEffect(() => {
    if (room && userId && nhost && apollo) {
      const nextRoom = new P2PRoom(room, userId, nhost, apollo)
      setP2PRoom(nextRoom)

      return () => nextRoom.destroy()
    }
  }, [room, userId, nhost, apollo])

  useEffect(() => {
    if (!p2pRoom) return

    return p2pRoom.onMessages((newMessage) => {
      setChatMessages((cms) => [...cms, newMessage])
    })
  }, [p2pRoom])

  if (!room) {
    return (
      <Main>
        <Loading />
      </Main>
    )
  }

  return (
    <Main className={`${className}`} {...props}>
      <h3 className="text-center text-primary-500">{room.name}</h3>
      <div className="p-2">
        <h3 className="text-gray-600">Players</h3>
        <ul className="max-w-fit">
          {room.members.map((m:any) => (
            <li key={m.player_id} className="flex items-center">
              <span className="mr-4">{userLookup[m.player_id]?.displayName}</span>
              {m.invite_accepted ? (
                <CheckCircleIcon className="ml-auto h-5 w-5 text-green-500" />
              ) : (
                <QuestionMarkCircleIcon className="ml-auto h-5 w-5 animate-pulse text-yellow-500" />
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Conversation</h3>
        <ul>
          {chatMessages.map(({ id, message }, i) => (
            <li key={`${id}-${i}`}>
              <span>{userLookup[memberUserIdLookup[id]]?.displayName}:</span>
              <span>{message}</span>
            </li>
          ))}
          <TextArea
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()

                if (!p2pRoom) return

                const msg = e.currentTarget.value
                p2pRoom?.sendMessages(JSON.stringify({ type: 'text-message', data: msg }))
                setChatMessages((cms) => [...cms, { id: p2pRoom.myId, message: msg }])
                e.currentTarget.value = ''
              }
            }}
          />
        </ul>
      </div>
    </Main>
  )
}

const P2PConversation = ({ connection }: { connection: P2PConnection }) => {
  const [handshakeState, setHandshakeState] = useState(connection.handshakeState)
  const [chatMessages, setChatMessages] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const messageListener = (message: string) => {
      setChatMessages((cms) => [...cms, message])
    }
    const stateListener = (state: typeof connection.handshakeState) => setHandshakeState(state)
    const streamListener = (stream: MediaStream) => {
      console.log('stream', stream)
      if (!videoRef.current) return
      videoRef.current.srcObject = stream
      videoRef.current.play()
    }

    connection.on('message', messageListener)
    connection.on('handshake-state', stateListener)
    connection.on('stream', streamListener)

    return () => {
      connection.off('handshake-state', stateListener)
      connection.off('message', messageListener)
      connection.off('stream', streamListener)
    }
  }, [connection])

  return (
    <div className="p-2">
      <p>Member ID: {connection.memberId}</p>
      State: {handshakeState}
      <Button
        variant="primary"
        onClick={async () => {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })

          connection.addStream(mediaStream)
        }}
      >
        Connect Audio
      </Button>
      <video ref={videoRef} autoPlay />
      <ul>
        {chatMessages.map((msg) => (
          <li className="px-2 py-1 even:bg-gray-50" key={msg}>
            {msg}
          </li>
        ))}
      </ul>
    </div>
  )
}
