import { AudioTools } from '../game-logic/AudioTools'

export const audioTools = new AudioTools()

const placeBlock1URL = new URL('./place-block-1.wav', import.meta.url)
const placeBlock2URL = new URL('./place-block-2.wav', import.meta.url)
const villageURL = new URL('./village.wav', import.meta.url)

const coin1URL = new URL('./coin-1.wav', import.meta.url)
const coin2URL = new URL('./coin-2.wav', import.meta.url)

const completeObjectiveURL = new URL('./complete-objective.wav', import.meta.url)

const towerURL = new URL('./tower.wav', import.meta.url)
const treasureURL = new URL('./treasure.wav', import.meta.url)
const crystalURL = new URL('./crystal.wav', import.meta.url)
const tradeURL = new URL('./trade.wav', import.meta.url)

const uiCardCloseURL = new URL('./ui-card-close.wav', import.meta.url)
const uiCardOpenURL = new URL('./ui-card-open.wav', import.meta.url)
const uiWoodCloseURL = new URL('./ui-wood-close.wav', import.meta.url)
const uiWoodOpenURL = new URL('./ui-wood-open.wav', import.meta.url)

export const uiCardCloseSound = audioTools.createSound(uiCardCloseURL)
export const uiCardOpenSound = audioTools.createSound(uiCardOpenURL)
export const uiWoodCloseSound = audioTools.createSound(uiWoodCloseURL)
export const uiWoodOpenSound = audioTools.createSound(uiWoodOpenURL)

export const placeBlock1Sound = audioTools.createSound(placeBlock1URL)
export const placeBlock2Sound = audioTools.createSound(placeBlock2URL)
export const villageSound = audioTools.createSound(villageURL)
export const coin1Sound = audioTools.createSound(coin1URL)
export const coin2Sound = audioTools.createSound(coin2URL)
export const completeObjectiveSound = audioTools.createSound(completeObjectiveURL)
export const towerSound = audioTools.createSound(towerURL)
export const treasureSound = audioTools.createSound(treasureURL)
export const crystalSound = audioTools.createSound(crystalURL)
export const tradeSound = audioTools.createSound(tradeURL)

// usage: audioTools.play(placeBlock1Sound), or audioTools.play(placeBlock1Sound, 0.6) for a quieter one.
// Plays overlap, so the same sound can fire in quick succession.
