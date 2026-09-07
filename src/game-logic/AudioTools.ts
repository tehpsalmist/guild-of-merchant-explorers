export class AudioTools {
  private currentBackgroundTrack: HTMLAudioElement | null = null

  getCurrentTrack(): HTMLAudioElement | null {
    return this.currentBackgroundTrack
  }

  playBackgroundTrack(audio: HTMLAudioElement) {
    if (this.currentBackgroundTrack === audio) {
      return // Don't play the same track if it's already playing
    }

    if (this.currentBackgroundTrack) {
      this.stopTrack()
      const checkTrackStopped = setInterval(() => {
        if (!this.currentBackgroundTrack) {
          clearInterval(checkTrackStopped)
          this.currentBackgroundTrack = audio
          this.currentBackgroundTrack.play()
        }
      }, 100) // Check every 100ms if the track has stopped
    } else {
      this.currentBackgroundTrack = audio
      this.currentBackgroundTrack.loop = true
      this.currentBackgroundTrack.play()
    }
  }

  stopTrack(fadeSpeed: number = 100) {
    if (this.currentBackgroundTrack) {
      const fadeOutInterval = setInterval(() => {
        if (this.currentBackgroundTrack && this.currentBackgroundTrack.volume > 0.1) {
          this.currentBackgroundTrack.volume -= 0.1
        } else if (this.currentBackgroundTrack) {
          clearInterval(fadeOutInterval)
          this.currentBackgroundTrack.pause()
          this.currentBackgroundTrack.currentTime = 0
          this.currentBackgroundTrack.volume = 1 // Reset volume for next play
          this.currentBackgroundTrack = null
        } else {
          clearInterval(fadeOutInterval)
        }
      }, fadeSpeed) // Adjust the interval time as needed for a smoother fade out
    }
  }

  play(audio: HTMLAudioElement, volume = 1) {
    audio.currentTime = 0
    audio.volume = volume
    audio.play()
  }

  playAfterDelay(audio: HTMLAudioElement, delay: number, volume = 1) {
    setTimeout(() => {
      this.play(audio, volume)
    }, delay)
  }
}
