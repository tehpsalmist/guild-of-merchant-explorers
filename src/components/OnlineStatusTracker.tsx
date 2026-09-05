import { useInterval } from '@8thday/react'
import { SignedIn, useNhostClient, useUserId } from '@nhost/react'
import React from 'react'
import { UPDATE_USER } from '../graphql/mutations'

export interface OnlineStatusTrackerProps {}

export const OnlineStatusTracker = (_: OnlineStatusTrackerProps) => {
  return (
    <SignedIn>
      <TrackStatus />
    </SignedIn>
  )
}

const TrackStatus = () => {
  const nhost = useNhostClient()

  const userId = useUserId()

  useInterval(() => {
    if (!userId) return
    nhost.graphql.request(UPDATE_USER, { userId, set: { lastSeen: 'now()' } })
  }, 30000)

  return null
}
