import { CSSProperties } from 'react'
import { BoardName, GameState, Player } from './GameState'
import { CardPlacementRules } from './Cards'

export type Terrain = 'mountain' | 'sand' | 'grass' | 'water' | 'wild'

export interface BoardData {
  name: BoardName
  imageURL: URL
  dimensions: {
    height: number
    width: number
    innerWidth: number
    innerHeight: number
    paddingLeft: number
    paddingTop: number
  }
  hexData: (HexData | null)[][]
}

export class Board {
  name: BoardName

  // display properties
  imageURL: URL
  svgStyle: CSSProperties
  height: number
  width: number

  // game data
  hexes: (Hex | null)[][]
  regions: Region[] = []
  lands: Land[] = []
  gameState: GameState
  player: Player

  constructor(boardData: BoardData, player: Player, gameState: GameState) {
    this.name = boardData.name

    this.player = player
    this.gameState = gameState

    this.imageURL = boardData.imageURL
    this.height = boardData.dimensions.height
    this.width = boardData.dimensions.width
    this.svgStyle = {
      top: `${(boardData.dimensions.paddingTop / this.height) * 100}%`,
      left: `${(boardData.dimensions.paddingLeft / this.width) * 100}%`,
      width: `${(boardData.dimensions.innerWidth / this.width) * 100}%`,
    }

    this.hexes = boardData.hexData.map((columns, columnIndex) => {
      return columns.map((hexData, rowIndex) => {
        if (!hexData) return null

        return new Hex({
          ...hexData,
          row: rowIndex,
          column: columnIndex,
          board: this,
        })
      })
    })

    for (const hex of this.getFlatHexes()) {
      // make Lands
      if (hex.isInLand && !hex.land) {
        this.lands.push(new Land(hex))
      }

      // make regions
      if (hex.isInRegion && !hex.region) {
        this.regions.push(new Region(hex))
      }
    }
  }

  hexContactIterator(hex: Hex, keepEmpties: true): (Hex | null)[]
  hexContactIterator(hex: Hex): Hex[]
  hexContactIterator(hex: Hex, keepEmpties = false) {
    const list = [
      this.hexes[hex.column - 1]?.[hex.column % 2 === 0 ? hex.row + 1 : hex.row],
      this.hexes[hex.column - 1]?.[hex.column % 2 === 0 ? hex.row : hex.row - 1],
      this.hexes[hex.column]?.[hex.row - 1],
      this.hexes[hex.column + 1]?.[hex.column % 2 === 0 ? hex.row : hex.row - 1],
      this.hexes[hex.column + 1]?.[hex.column % 2 === 0 ? hex.row + 1 : hex.row],
      this.hexes[hex.column]?.[hex.row + 1],
    ]

    return keepEmpties ? list : list.filter<Hex>((h): h is Hex => !!h)
  }

  getFlatHexes() {
    return this.hexes.flat().filter<Hex>((h): h is Hex => !!h)
  }

  getHex(row: number, column: number) {
    return this.hexes[column]?.[row]
  }

  get dimensions() {
    return [this.hexes.length, this.hexes[0].length]
  }

  wipe() {
    this.getFlatHexes().forEach((hex) => {
      if (!hex.isVillage && !hex.isCity) {
        hex.isExplored = false
      }
    })
  }

  getXawskilCoins() {
    if (this.name === 'xawskil') {
      const numberReached = this.lands.filter((l) => l.hasBeenReached).length

      const coinsForLands =
        {
          6: 3,
          7: 6,
          8: 10,
          9: 14,
          10: 18,
          11: 24,
          12: 32,
          13: 40,
          14: 40,
          15: 40,
        }[numberReached] ?? 0

      return coinsForLands
    }

    return 0
  }
}

export interface SerializedHex {
  row: number
  column: number
}

export interface HexData {
  terrain: Terrain
  coins?: number
  tradingPostQuantity?: number
  isRuin?: boolean
  isTower?: boolean
  isCity?: boolean
  isIce?: boolean
  crystalValue?: number
  ruinSymbol?: string
}

export class Hex {
  row: number
  column: number
  terrain: Terrain
  coins: number
  tradingPostValue: number
  crystalValue: number
  ruinSymbol: string
  isCity = false
  isRuin = false
  isTower = false
  isIce = false
  isExplored = false
  isVillage = false
  isVillageCandidate = false
  isInLand = false
  isInRegion = false
  isCovered = false
  region: Region | null = null
  land: Land | null = null
  board: Board

  constructor({
    terrain,
    coins = 0,
    tradingPostQuantity = 0,
    isCity = false,
    isRuin = false,
    isTower = false,
    isIce = false,
    crystalValue = 0,
    ruinSymbol = '',
    row,
    column,
    board,
  }: HexData & { row: number; column: number; board: Board }) {
    this.board = board
    this.row = row
    this.column = column
    this.terrain = terrain
    this.coins = coins
    this.isExplored = this.isCity = isCity
    this.isRuin = isRuin
    this.ruinSymbol = ruinSymbol
    this.isTower = isTower
    this.isIce = isIce
    this.crystalValue = crystalValue
    this.tradingPostValue = tradingPostQuantity

    const isLandTerrain = ['mountain', 'sand', 'grass'].includes(terrain)

    if (!this.coins && !this.isRuin && !this.tradingPostValue && isLandTerrain) {
      this.isVillageCandidate = true
    }

    if (isLandTerrain) {
      this.isInRegion = true
    }

    if (isLandTerrain || this.isTower || this.isIce) {
      this.isInLand = true
    }
  }

  get element() {
    return document.getElementById(`${this.row}-${this.column}`)
  }

  explore() {
    this.isExplored = true

    if (this.coins) {
      const bonus = this.board.player.currentExplorerCard?.bonus(this.board.player)
      const multiplier = bonus?.type === 'coin' ? bonus.multiplier : 1

      this.board.player.addCoins(this.coins * multiplier)
    }

    //Finds trading routes every time a hex is explored
    this.board.player.connectedTradePosts = this.getConnectedTradingPosts()

    if (this.region) {
      this.region.explore()
    }
  }

  /**
   * Invert all logic from explore in this method
   */
  unexplore() {
    this.isExplored = false

    if (this.coins) {
      const bonus = this.board.player.currentExplorerCard?.bonus(this.board.player)
      const multiplier = bonus?.type === 'coin' ? bonus.multiplier : 1

      this.board.player.removeCoins(this.coins * multiplier)
    }

    // clear any connected trading posts
    this.board.player.connectedTradePosts = []

    if (this.region) {
      this.region.unexplore()
    }
  }

  isExplorable() {
    if (
      !this.board.player.currentExplorerCard ||
      this.isExplored ||
      this.board.hexContactIterator(this).every((h) => !h.isExplored)
    ) {
      return false
    }

    // early exit for free exploring because we already know the hex is touching explored hexes from the first check
    if (this.board.player.mode === 'free-exploring') {
      return true
    }

    // only check for explorability in exploring mode
    if (this.board.player.mode !== 'exploring') {
      return false
    }

    const rules: CardPlacementRules[] | null =
      typeof this.board.player.currentExplorerCard.rules === 'function'
        ? this.board.player.currentExplorerCard.rules(this.board.player)
        : this.board.player.currentExplorerCard.rules as unknown as (CardPlacementRules[] | null)

    const placedHexes = this.board.player.moveHistory.getPlacedHexes()
    const touchingHexes = this.board.hexContactIterator(this, true)

    const phase = this.board.player.cardPhase
    const rule = rules?.[phase]

    if (!rule) {
      return false
    }

    // check for special infinite straight line cards that can't go on ice
    if (this.isIce && rule.limit === Infinity && rule.straight) {
      return false
    }

    // already run out of hexes to place
    if (rule.limit <= placedHexes[phase].size) {
      return false
    }

    // does the hex fit an allowable terrain type?
    const fitsAPermissibleTerrain = rule.terrains.some((t) => {
      // coins required
      if (t.hasCoins && !this.coins) {
        return false
      }

      // trading post required
      if (t.isTradingPost && !this.tradingPostValue) {
        return false
      }

      // all hexes match a wild, of course
      if (t.terrain === 'wild' || this.terrain === 'wild') {
        return true
      }

      // matches the terrain type directly and not all of this type have been placed
      if (
        t.terrain === this.terrain &&
        t.count > placedHexes[phase].hexes.filter((h) => h.terrain === t.terrain).length
      ) {
        return true
      }

      return false
    })

    // rule out hex that is an invalid terrain type
    if (!fitsAPermissibleTerrain) {
      return false
    }

    if (this.isIce && placedHexes[phase].affectedByIce && rule.limit - placedHexes[phase].size < 2) {
      return false
    }

    const flattenedPlacementHexess = placedHexes.flatMap((p) => p.hexes)

    // just has to connect to anything placed during this turn
    if (
      rule.connectionRequired &&
      flattenedPlacementHexess.length &&
      !flattenedPlacementHexess.some((h) => touchingHexes.includes(h))
    ) {
      return false
    }

    // must be consecutive (connected to the last hex placed)
    if (
      rule.consecutive &&
      flattenedPlacementHexess.length &&
      !touchingHexes.includes(flattenedPlacementHexess[flattenedPlacementHexess.length - 1])
    ) {
      return false
    }

    // must be in a straight line in either direction
    if (rule.straight && flattenedPlacementHexess.length > 1) {
      const firstHexContacts = this.board.hexContactIterator(flattenedPlacementHexess[0], true)
      const secondHexContacts = this.board.hexContactIterator(flattenedPlacementHexess[1], true)

      const firstIndex = secondHexContacts.findIndex((h) => h === flattenedPlacementHexess[0])
      const secondIndex = firstHexContacts.findIndex((h) => h === flattenedPlacementHexess[1])

      if (
        flattenedPlacementHexess.every((h) => {
          const contacts = this.board.hexContactIterator(h, true)
          return contacts[firstIndex] !== this && contacts[secondIndex] !== this
        })
      ) {
        return false
      }
    }

    // must be in the same region as the initial placement
    if (rule.regionBound && placedHexes[phase]?.hexes?.[0] && placedHexes[phase].hexes[0].region !== this.region) {
      return false
    }

    // must be connected to a hex from the previous phase
    if (
      rule.connectionToPreviousRequired &&
      placedHexes.length > 1 &&
      placedHexes[phase - 1].hexes.every((h) => !touchingHexes.includes(h))
    ) {
      return false
    }

    if (rule.is2VillageSpecial) {
      // if nothing placed yet, then just check that we're adjacent to a village
      if (!flattenedPlacementHexess.length) {
        return touchingHexes.some((h) => h?.isVillage)
      }

      const firstHex = flattenedPlacementHexess[0]
      const firstHexContacts = this.board.hexContactIterator(firstHex, true)
      const firstVillageCandidates = firstHexContacts.filter((h): h is Hex => !!h?.isVillage)

      if (flattenedPlacementHexess.length === 1) {
        const straightIndex = touchingHexes.findIndex((h) => h === firstHex)

        if (straightIndex !== -1 && firstHexContacts[straightIndex]?.isVillage) {
          return true
        }

        return touchingHexes.some(
          (h) => h?.isVillage && (firstVillageCandidates.length > 1 || h !== firstVillageCandidates[0]),
        )
      }

      for (const firstVillageCandidate of firstVillageCandidates) {
        const village1Contacts = this.board.hexContactIterator(firstVillageCandidate, true)
        const straightIndex = village1Contacts.findIndex((h) => h === firstHex)
        let lastHex = firstHex

        const firstLine = [firstHex]
        const others: Hex[] = []

        // append this hex to the list and then validate if it works or not
        for (const placed of flattenedPlacementHexess.slice(1).concat([this])) {
          if (firstLine.length === 3) {
            others.push(placed)
            continue
          }

          const lastHexContacts = this.board.hexContactIterator(lastHex, true)

          if (placed === lastHexContacts[straightIndex]) {
            firstLine.push(placed)
            lastHex = placed
          } else {
            others.push(placed)
          }
        }

        if (others.length === 0) {
          // placement fits perfectly into one valid line
          return true
        }

        if (others.length > 3) {
          // placement causes leftover (and therefore invalid) blocks
          continue
        }

        const lastOtherContacts = this.board.hexContactIterator(others[others.length - 1])

        if (others.length === 1) {
          // placement is good as long as this one other block is touching a different village
          if (lastOtherContacts.some((h) => h.isVillage && h !== firstVillageCandidate)) {
            return true
          } else {
            continue
          }
        }

        const secondToLastOther = others[others.length - 2]
        const otherStraightIndex = lastOtherContacts.findIndex((h) => h === secondToLastOther)

        if (otherStraightIndex === -1) {
          // leftover blocks aren't even connected
          continue
        }

        const secondToLastContacts = this.board.hexContactIterator(secondToLastOther)
        if (others.length === 2) {
          if (
            secondToLastContacts[otherStraightIndex]?.isVillage &&
            secondToLastContacts[otherStraightIndex] !== firstVillageCandidate
          ) {
            // placement fits perfectly
            return true
          } else {
            // other line doesn't terminate in a valid village
            continue
          }
        }

        const finalContacts = this.board.hexContactIterator(others[0])
        if (
          secondToLastContacts[otherStraightIndex] === others[0] &&
          finalContacts[otherStraightIndex]?.isVillage &&
          finalContacts[otherStraightIndex] !== firstVillageCandidate
        ) {
          // placement fits perfectly
          return true
        }
        // everything else falls out of the loop as an invalid attempt
      }

      // if we got here, it's a bad placement
      return false
    }

    return true
  }

  getConnectedHexes(connected: Hex[] = [], visited: Record<string, 1> = {}) {
    // mark this hex as visited
    visited[`${this.row}-${this.column}`] = 1

    // add this hex to the list of visited hexes
    connected.push(this)

    for (const nextHex of this.board.hexContactIterator(this)) {
      if (nextHex.isExplored && !visited[`${nextHex.row}-${nextHex.column}`]) {
        // abusing the crap out of the mutable references with this strange form of recursion,
        // but this totally works and is consistent with the mutable framework we've been leveraging so far.
        nextHex.getConnectedHexes(connected, visited)
      }
    }

    return connected
  }

  getConnectedTradingPosts() {
    return this.getConnectedHexes().filter((h) => !h.isCovered && h.tradingPostValue > 0)
  }

  toJSON(): SerializedHex {
    return {
      row: this.row,
      column: this.column,
    }
  }
}

export class Region {
  terrain: Terrain
  hexes: Hex[] = []
  land?: Land
  board: Board
  villageCandidates: Hex[]

  constructor(startingHex: Hex) {
    this.terrain = startingHex.terrain
    this.board = startingHex.board
    startingHex.land?.addRegion(this)

    this.buildRegionFromHex(startingHex)

    this.villageCandidates = this.hexes.filter((h) => h.isVillageCandidate)
  }

  buildRegionFromHex(hex: Hex) {
    hex.region = this
    this.hexes.push(hex)

    for (const nextHex of this.board.hexContactIterator(hex)) {
      if (nextHex.isInRegion && !nextHex.region && nextHex.terrain === this.terrain) {
        this.buildRegionFromHex(nextHex)
      }
    }
  }

  get size() {
    return this.hexes.length
  }

  get hasVillage() {
    return this.villageCandidates.some((h) => h.isVillage)
  }

  get log() {
    return this.hexes.map((h) => h.element)
  }

  explore() {
    if (!this.hasVillage && this.hexes.every((h) => h.isExplored) && this.villageCandidates.length) {
      this.board.player.regionForVillage = this
    }
  }

  unexplore() {
    //It's only possible to trigger one village placement at a time, so we don't need any fancy conditions to undo the village placement
    this.board.player.regionForVillage = undefined
  }
}

export class Land {
  hexes: Hex[] = []
  hasBeenReached = false
  board: Board
  regions: Region[] = []
  markableHex?: Hex

  constructor(startingHex: Hex) {
    this.board = startingHex.board
    this.buildLandFromHex(startingHex)
  }

  buildLandFromHex(hex: Hex) {
    hex.land = this
    this.hexes.push(hex)

    if (!this.markableHex && hex.isVillageCandidate) {
      this.markableHex = hex
    }

    for (const nextHex of this.board.hexContactIterator(hex)) {
      if (nextHex.isInLand && !nextHex.land) {
        this.buildLandFromHex(nextHex)
      }
    }
  }

  addRegion(r: Region) {
    r.land = this
    this.regions.push(r)
  }

  get log() {
    return this.hexes.map((h) => h.element)
  }
}
