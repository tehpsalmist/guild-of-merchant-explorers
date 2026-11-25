type AudioSessionType = 'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record'

/**
 * Safari's Audio Session API (iOS 16.4+). 'ambient' mixes the game's sounds with music or podcasts that are
 * already playing, instead of interrupting them, and respects the silent switch.
 */
export const setAudioSessionType = (type: AudioSessionType) => {
  const { audioSession } = navigator as Navigator & { audioSession?: { type: AudioSessionType } }
  if (audioSession) audioSession.type = type
}

/** A short sound, decoded once and played through Web Audio. */
export class SoundEffect {
  buffer?: Promise<AudioBuffer | null>

  constructor(readonly url: string) {}
}

/**
 * Sound effects play through Web Audio rather than <audio> elements: phones treat media elements as media
 * playback, which pauses whatever else is playing, but let Web Audio mix in.
 */
export class AudioTools {
  private currentBackgroundTrack: HTMLAudioElement | null = null
  private context: AudioContext | null = null
  private readonly sounds: SoundEffect[] = []

  constructor() {
    setAudioSessionType('ambient')

    // Browsers only let audio start from a user gesture, so (re)start it on each one until it's running.
    const unlock = () => this.unlock()
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)
  }

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

  play(sound: SoundEffect, volume = 1) {
    const context = this.context
    // Nothing is audible before the first user gesture anyway.
    if (!context) return

    void this.load(context, sound).then((buffer) => {
      // Drop sounds while suspended (e.g. after iOS backgrounds the page), rather than bursting them all on resume.
      if (!buffer || context.state !== 'running') return

      const source = context.createBufferSource()
      const gain = context.createGain()
      source.buffer = buffer
      gain.gain.value = volume
      source.connect(gain).connect(context.destination)
      source.start()
    })
  }

  playAfterDelay(sound: SoundEffect, delay: number, volume = 1) {
    setTimeout(() => {
      this.play(sound, volume)
    }, delay)
  }

  createSound(url: URL) {
    const sound = new SoundEffect(url.href)
    this.sounds.push(sound)
    if (this.context) void this.load(this.context, sound)
    return sound
  }

  private unlock() {
    if (!this.context) {
      const context = new AudioContext()
      this.context = context
      // Decode everything up front, so no sound's first play is delayed.
      this.sounds.forEach((sound) => void this.load(context, sound))
    }

    if (this.context.state !== 'running') void this.context.resume()
  }

  private load(context: AudioContext, sound: SoundEffect) {
    sound.buffer ??= fetch(sound.url)
      .then((response) => response.arrayBuffer())
      .then((data) => context.decodeAudioData(data))
      .catch((error: unknown) => {
        console.warn('Sound effect could not load', sound.url, error)
        return null
      })

    return sound.buffer
  }
}
