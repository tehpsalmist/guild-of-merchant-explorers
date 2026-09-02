import { Hex, Land, Terrain } from './Board'
import { GameState, Player, SerializedPlayer } from './GameState'
import { audioTools, completeObjectiveSound } from '../audio'

type Operator = 'eq' | 'gte' | 'lte'
type Position = 'adjacent' | 'on'

type ExplorationRequirement = 'coin' | 'trading-post' | 'village' | 'ruin' | 'tower' | 'crystal'
type RelativeRequirement =
  | 'different-terrain'
  | 'same-terrain'
  | 'any-terrain'
  | 'different-land'
  | 'same-land'
  | 'border'
  | 'north-border'
  | 'ruin'
  | 'tower'
  | 'trading-post'
  | 'crystal'
  | 'ice'
  | 'mountain'
  | 'same-ruin-type'
  | 'different-ruin-type'

type Size = [Operator, number]

type SimpleAlgorithm = {
  quantity: number
  exploredSpace: {
    type: ExplorationRequirement
    size?: Size
  }
  position?: Position
  relativeTo?: {
    type: RelativeRequirement
    size?: Size
    values?: [string, string]
  }
}

type ComplexAlgorithm = {
  spec:
    | 'trade-route-ice'
    | 'trade-route-value'
    | '2-cities-2-ruins'
    | 'ruin-c-northeast-tower'
    | 'westernmost-land'
    | 'ruins-near-all-terrains'
  value?: number
}

export interface SerializedObjective {
  id: string
  turnAndEraOfFirstAward?: [number, number]
  isFirstBlocked: boolean
  isSecondBlocked: boolean
  firstPlayers: SerializedPlayer[]
  secondPlayers: SerializedPlayer[]
}

export interface ObjectiveData {
  id: string
  imageUrl: URL
  first?: number
  second?: number
  simpleAlgorithm?: SimpleAlgorithm
  complexAlgorithm?: ComplexAlgorithm
}

export class Objective {
  gameState: GameState

  id: string

  firstPlaceReward: number
  secondPlaceReward: number
  imageUrl: URL

  firstPlayers: Player[] = []
  secondPlayers: Player[] = []

  simpleAlgorithm?: SimpleAlgorithm
  complexAlgorithm?: ComplexAlgorithm

  matchingState = {
    regions: [] as string[],
    lands: [] as Land[],
    ruinTypes: [] as string[],
  }

  turnAndEraOfFirstAward?: [number, number]

  isFirstBlocked = false
  isSecondBlocked = false

  constructor(data: ObjectiveData, gameState: GameState, serializedData?: SerializedObjective) {
    this.id = data.id
    this.gameState = gameState

    this.firstPlaceReward = data.first ?? 10
    this.secondPlaceReward = data.second ?? 5
    this.imageUrl = data.imageUrl

    if (data.simpleAlgorithm) this.simpleAlgorithm = data.simpleAlgorithm
    if (data.complexAlgorithm) this.complexAlgorithm = data.complexAlgorithm

    if (serializedData) {
      this.turnAndEraOfFirstAward = serializedData.turnAndEraOfFirstAward

      this.isFirstBlocked = serializedData.isFirstBlocked
      this.isSecondBlocked = serializedData.isSecondBlocked

      this.firstPlayers = serializedData.firstPlayers
        .map((fp) => this.gameState.players.find((p) => p.id === fp.id)!)
        .filter(Boolean)
      this.secondPlayers = serializedData.secondPlayers
        .map((fp) => this.gameState.players.find((p) => p.id === fp.id)!)
        .filter(Boolean)
    }
  }

  isPlayerFirst() {
    return (
      !this.isFirstBlocked &&
      (!this.turnAndEraOfFirstAward ||
        (this.gameState.era === this.turnAndEraOfFirstAward[0] &&
          this.gameState.currentTurn === this.turnAndEraOfFirstAward[1]))
    )
  }

  clearMatchingState() {
    this.matchingState = {
      regions: [],
      lands: [],
      ruinTypes: [],
    }
  }

  checkAndScoreForPlayer(p: Player) {
    if (this.isFirstBlocked && this.isSecondBlocked) return

    this.clearMatchingState()

    if (this.firstPlayers.includes(p) || this.secondPlayers.includes(p)) return

    let matchingHexes: Hex[] | null = null

    if (this.simpleAlgorithm) {
      matchingHexes = this.checkWithSimpleAlgorithm(p)
    }

    if (this.complexAlgorithm) {
      matchingHexes = this.checkWithComplexAlgorithm(p)
    }

    if (matchingHexes) {
      if (this.isPlayerFirst()) {
        p.addCoins(this.firstPlaceReward)

        this.firstPlayers.push(p)
        this.turnAndEraOfFirstAward = [this.gameState.era, this.gameState.currentTurn]
      } else {
        p.addCoins(this.secondPlaceReward)

        this.secondPlayers.push(p)
      }

      p.dispatchEvent(new CustomEvent('objective-achieved'))

      audioTools.play(completeObjectiveSound)
    }

    // emit event for UI display instead?
    return matchingHexes
  }

  checkWithSimpleAlgorithm(p: Player) {
    if (!this.simpleAlgorithm) return null

    const exploredHexes = p.board
      .getFlatHexes()
      .filter((h) => this.isHexCondition(h, this.simpleAlgorithm!.exploredSpace))

    if (exploredHexes.length < this.simpleAlgorithm.quantity) {
      // didn't even meet first requirement
      return null
    }

    if (!this.simpleAlgorithm.position || !this.simpleAlgorithm.relativeTo) {
      // no further checks required, we're good!
      return exploredHexes
    }

    switch (this.simpleAlgorithm.position) {
      case 'on': {
        // for checking same-something, need to populate state first to check against it for each item
        exploredHexes.forEach((h) => {
          switch (this.simpleAlgorithm!.relativeTo?.type) {
            case 'same-ruin-type':
              return h.isCovered && h.ruinSymbol && this.matchingState.ruinTypes.push(h.ruinSymbol)
            case 'same-terrain':
              return this.matchingState.regions.push(h.terrain)
            case 'same-land':
              return h.land && this.matchingState.lands.push(h.land)
          }
        })

        const matchingHexes = exploredHexes.filter((h) => this.isHexOn(h))
        return matchingHexes.length >= this.simpleAlgorithm.quantity ? matchingHexes : null
      }
      case 'adjacent': {
        const matchingHexes = exploredHexes.filter((h) => this.isHexAdjacent(h))
        return matchingHexes.length >= this.simpleAlgorithm.quantity ? matchingHexes : null
      }
    }
  }

  checkWithComplexAlgorithm(p: Player) {
    switch (this.complexAlgorithm?.spec) {
      case 'westernmost-land':
        const exploredHexes = p.board.getHex(6, 1)?.land?.hexes.filter((h) => h.isExplored)

        return exploredHexes?.length ? exploredHexes : null
      case 'ruin-c-northeast-tower':
        const ruinC = p.board.getHex(1, 6)
        const northeastTower = p.board.getHex(2, 16)

        if (ruinC?.isCovered && northeastTower?.isCovered) return [ruinC, northeastTower]

        return null
      case 'ruins-near-all-terrains':
        const ruins = new Set<Hex>()
        const terrains = new Set<Terrain>()

        for (const hex of p.board.getFlatHexes()) {
          if (hex.isRuin && hex.isCovered) {
            for (const adjHex of p.board.hexContactIterator(hex)) {
              // checking for region is shortcut for narrowing to 'sand' | 'grass' | 'mountain'
              if (adjHex.region) {
                ruins.add(hex)
                terrains.add(adjHex.terrain)
              }
            }

            if (terrains.size >= 3) {
              //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set#iterating_sets :)
              return [...ruins]
            }
          }
        }

        return null
      case 'trade-route-value':
        return (
          p.finalizedTradingRoutes.find(
            ([h1, h2]) =>
              this.complexAlgorithm!.value && h1.tradingPostValue * h2.tradingPostValue >= this.complexAlgorithm!.value,
          ) ?? null
        )
      case 'trade-route-ice':
        return p.finalizedTradingRoutes.find(([h1]) => h1.getConnectedHexes().some((h) => h.isIce)) ?? null
      case '2-cities-2-ruins':
        let connectedHexes: Hex[] = []
        if (
          p.board.getFlatHexes().some((h) => {
            if ((!h.tradingPostValue && !h.isRuin) || !h.isExplored) {
              return false
            }

            let ruins = 0
            let cities = 0

            connectedHexes = h.getConnectedHexes()
            for (const hex of connectedHexes) {
              if (hex.isRuin && hex.isExplored) {
                ruins++
              }

              if (hex.tradingPostValue && hex.isExplored) {
                cities++
              }

              if (ruins >= 2 && cities >= 2) {
                return true
              }
            }

            return false
          })
        ) {
          return connectedHexes
        }

        return null
    }

    return null
  }

  isHexCondition(h: Hex, condition: SimpleAlgorithm['exploredSpace']) {
    switch (condition.type) {
      case 'coin':
        if (!h.isExplored) return false
        if (condition.size) return this.compareSize(h.coins, condition.size)
        return false
      case 'crystal':
        return h.isCovered && h.crystalValue > 0
      case 'ruin':
        return h.isCovered && h.isRuin
      case 'tower':
        return h.isCovered && h.isTower
      case 'village':
        return h.isVillage
      case 'trading-post':
        if (!h.isCovered || !h.tradingPostValue) return false
        if (condition.size) return this.compareSize(h.tradingPostValue, condition.size)
        return true
    }
  }

  compareSize(value: number, [operator, threshold]: Size) {
    switch (operator) {
      case 'eq':
        return value === threshold
      case 'gte':
        return value >= threshold
      case 'lte':
        return value <= threshold
    }
  }

  // there might appear to be a lot of overlap between this and isHexCondition, but there is also enough difference
  // that it is wiser to keep the logic separate.
  isHexOn(h: Hex) {
    const condition = this.simpleAlgorithm?.relativeTo

    if (!condition || !this.simpleAlgorithm) return false

    switch (condition.type) {
      case 'any-terrain':
        return !!(h.region?.size && condition.size) && this.compareSize(h.region.size, condition.size)
      case 'ice':
        return h.isIce
      case 'mountain':
        return h.terrain === 'mountain'
      case 'ruin':
        if (!h.isCovered || !h.isRuin) return false

        if (condition.values) {
          return condition.values.includes(h.ruinSymbol)
        }

        return true
      case 'trading-post':
        if (h.tradingPostValue === 0 || !h.isCovered) return false

        if (condition.size) {
          return this.compareSize(h.tradingPostValue, condition.size)
        }

        return true
      case 'different-ruin-type':
        if (!h.isCovered || !h.ruinSymbol || this.matchingState.ruinTypes.includes(h.ruinSymbol)) return false

        this.matchingState.ruinTypes.push(h.ruinSymbol)

        return true
      case 'different-terrain':
        if (condition.size && h.region && !this.compareSize(h.region.size, condition.size)) {
          return false
        }

        if (this.matchingState.regions.includes(h.terrain)) return false

        this.matchingState.regions.push(h.terrain)

        return true
      case 'different-land':
        if (!h.land || this.matchingState.lands.includes(h.land)) return false

        this.matchingState.lands.push(h.land)

        return true
      case 'same-ruin-type':
        if (!h.isCovered || !h.ruinSymbol) return false

        return this.matchingState.ruinTypes.filter((t) => t === h.ruinSymbol).length >= this.simpleAlgorithm.quantity
      case 'same-terrain':
        return this.matchingState.regions.filter((t) => t === h.terrain).length >= this.simpleAlgorithm.quantity
      case 'same-land':
        return h.land && this.matchingState.lands.filter((t) => t === h.land).length >= this.simpleAlgorithm.quantity
      default:
        return false
    }
  }

  // keep in mind that this is used to check adjacent scenarios specifically, so it is not a 1:1 comparison with isHexOn
  isHexAdjacent(h: Hex) {
    const condition = this.simpleAlgorithm?.relativeTo

    if (!condition || !this.simpleAlgorithm) return false

    const adjacentHexes = h.board.hexContactIterator(h, true)

    return adjacentHexes.some((ah, index) => {
      switch (condition.type) {
        case 'tower':
          return ah?.isCovered && ah.isTower
        case 'trading-post':
          return ah?.isCovered && ah?.tradingPostValue
        case 'ice':
          return ah?.isIce
        case 'ruin':
          // does not need to be covered (kazan 3)
          return ah?.isRuin
        case 'crystal':
          // does not need to be covered (cnidaria 1)
          return ah?.crystalValue
        case 'border':
          // maps with this objective have no interior empty spaces, so this check is thorough to determine border (avenia 3)
          return !ah
        case 'north-border':
          // no interior empties on this map either (north proylia 5)
          // index 2 is the top hex
          return index === 2 && ah == null
        default:
          return false
      }
    })
  }

  toJSON(): SerializedObjective {
    return {
      id: this.id,
      turnAndEraOfFirstAward: this.turnAndEraOfFirstAward,
      isFirstBlocked: this.isFirstBlocked,
      isSecondBlocked: this.isSecondBlocked,
      firstPlayers: this.firstPlayers,
      secondPlayers: this.secondPlayers,
    }
  }
}
