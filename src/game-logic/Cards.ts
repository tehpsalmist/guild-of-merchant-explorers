import { explorerCardDataMapping, getInitialExplorerList, getLaterExplorerList } from '../data/cards/explorer-cards'
import { investigateCardDataLookup, investigateCards } from '../data/cards/investigate-cards'
import { treasureCardDataLookup, treasureCards } from '../data/cards/treasure-cards'
import { Board, Terrain } from './Board'
import { Player } from './GameState'

export interface SerializedCard {
  id: string
}

export class Card {
  id: string

  constructor({ id }: SerializedCard) {
    this.id = id
  }

  toJSON(): SerializedCard {
    return {
      id: this.id,
    }
  }
}

export interface SerializedDeck {
  cards: SerializedCard[]
  discarded: SerializedCard[]
}

export class Deck<CardType extends Card> {
  cards: CardType[]
  discarded: CardType[] = []

  constructor(cardData: CardType[]) {
    this.cards = cardData
  }

  drawCards({ quantity = 1, recycle = false } = {}) {
    // if deck is empty, and recycling is requested, shuffle discarded cards into the deck
    if (recycle && this.cards.length - quantity < 0) {
      this.resetDeck()

      this.shuffle()
    }

    return this.cards.splice(0, quantity)
  }

  discard(card: CardType) {
    this.discarded.push(card)
  }

  addCard(card: CardType) {
    this.cards.push(card)
  }

  resetDeck() {
    this.cards = this.discarded
    this.discarded = []
  }

  shuffle() {
    const newList: CardType[] = []

    while (this.cards.length) {
      newList.push(...this.cards.splice(Math.floor(Math.random() * this.cards.length), 1))
    }

    this.cards = newList
  }

  toJSON(): SerializedDeck {
    return {
      cards: this.cards,
      discarded: this.discarded,
    }
  }
}

export interface CardPlacementRules {
  message: string
  limit: number
  connectionRequired: boolean
  connectionToPreviousRequired: boolean
  straight: boolean
  consecutive: boolean
  terrains: { terrain: Terrain; isTradingPost?: boolean; hasCoins?: boolean; count: number }[]
  regionBound: boolean
  // ad hoc rules for the special ones
  is2VillageSpecial?: boolean
}

export interface Bonus {
  type: 'treasure' | 'coin'
  multiplier: number
}

export interface ExplorerCardData {
  id: string
  imageUrl: URL
  isEraCard: boolean
  rules(p: Player): CardPlacementRules[] | null
  bonus?(p: Player): Bonus | null
  getInvestigateCard?(p: Player): InvestigateCard | null
}

export class ExplorerCard extends Card {
  imageUrl: URL
  isEraCard: boolean

  getRules: (p: Player) => CardPlacementRules[] | null
  getBonus: (p: Player) => Bonus | null
  getInvestigateCard: (p: Player) => InvestigateCard | null

  constructor(data: ExplorerCardData) {
    super(data)

    this.imageUrl = data.imageUrl
    this.isEraCard = data.isEraCard

    this.getRules = data.rules
    this.getBonus = data.bonus ?? (() => null)
    this.getInvestigateCard = data.getInvestigateCard ?? (() => null)
  }

  rules(p: Player): CardPlacementRules[] | null {
    return this.getRules(p)
  }

  bonus(p: Player): Bonus | null {
    return this.getBonus(p)
  }

  investigateCard?(p: Player): InvestigateCard | null {
    return this.getInvestigateCard(p)
  }
}

export interface SerializedExplorerDeck extends SerializedDeck {
  laterCards: SerializedCard[]
}

export class ExplorerDeck extends Deck<ExplorerCard> {
  laterCards = getLaterExplorerList().map((c) => new ExplorerCard(c))

  constructor(serializedData?: SerializedExplorerDeck) {
    const initialList = getInitialExplorerList()

    const cards = serializedData
      ? serializedData.cards.map((sc) => new ExplorerCard(explorerCardDataMapping[sc.id]))
      : initialList.map((c) => new ExplorerCard(c))

    super(cards)

    if (serializedData) {
      this.discarded = serializedData.discarded.map((sc) => new ExplorerCard(explorerCardDataMapping[sc.id]))
      this.laterCards = getLaterExplorerList()
        .filter((lcd) => serializedData.laterCards.some((sc) => sc.id === lcd.id))
        .map((lcd) => new ExplorerCard(lcd))
    }
  }

  prepareForNextEra() {
    if (this.cards.length) return

    const nextEraCard = this.laterCards.pop()

    if (nextEraCard) {
      this.resetDeck()
      this.addCard(nextEraCard)
    }

    this.shuffle()
  }

  toJSON(): SerializedExplorerDeck {
    return {
      ...super.toJSON(),
      laterCards: this.laterCards,
    }
  }
}

export interface InvestigateCardData {
  id: string
  imageUrl: URL
  rules: CardPlacementRules[]
  bonus?: Bonus
}

export class InvestigateCard extends Card {
  imageUrl: URL
  rules: CardPlacementRules[]
  bonus: Bonus | null = null

  constructor(data: InvestigateCardData) {
    super(data)

    this.imageUrl = data.imageUrl
    this.rules = data.rules

    if (data.bonus) {
      this.bonus = data.bonus
    }
  }
}

export class InvestigateDeck extends Deck<InvestigateCard> {
  constructor(serializedData?: SerializedDeck) {
    if (serializedData) {
      super(serializedData.cards.map((dc) => new InvestigateCard(investigateCardDataLookup[dc.id])))
      this.discarded = serializedData.discarded.map((dc) => new InvestigateCard(investigateCardDataLookup[dc.id]))
    } else {
      super(investigateCards.map((c) => new InvestigateCard(c)))
    }
  }
}

type TreasureType =
  | 'sandVillageBonus'
  | 'grassVillageBonus'
  | 'mountainVillageBonus'
  | 'landVillageHalfBonus'
  | 'towerBonus'
  | 'placeBlock'
  | 'twoCoins'
  | 'jarMultiplier'

export interface TreasureCardData {
  type: TreasureType
  imageUrl: URL
  count: number
  //We can assume that if it needs to be discarded, it will be played immediately.
  //We can also assume that if it doesn't need to be discarded, it doesn't need to be played immediately.
  discard: boolean
  value(board: Board): number
  jarValue?(index: number): { index: number; value: number }
}

export class TreasureCard extends Card {
  type: TreasureType
  imageUrl: URL
  //We can assume that if it needs to be discarded, it will be played immediately.
  //We can also assume that if it doesn't need to be discarded, it doesn't need to be played immediately.
  discard: boolean
  calculateValue: (board: Board) => number
  calculateJarValue?: (index: number) => { index: number; value: number }

  constructor(data: TreasureCardData & { id: string }) {
    super(data)

    this.type = data.type
    this.imageUrl = data.imageUrl
    this.discard = data.discard

    this.calculateValue = data.value

    if (data.jarValue) {
      this.calculateJarValue = data.jarValue
    }
  }

  value(board: Board) {
    return this.calculateValue(board)
  }

  jarValue(index: number) {
    return this.calculateJarValue?.(index) ?? { index: -1, value: 0 }
  }
}

export class TreasureDeck extends Deck<TreasureCard> {
  constructor(serializedData?: SerializedDeck) {
    if (serializedData) {
      super(serializedData.cards.map((dc) => new TreasureCard(treasureCardDataLookup[dc.id])))
      this.discarded = serializedData.discarded.map((dc) => new TreasureCard(treasureCardDataLookup[dc.id]))
    } else {
      super(
        treasureCards.flatMap((c) =>
          Array<number>(c.count)
            .fill(1)
            .map((n, i) => new TreasureCard({ ...c, id: `${c.type}-${i}` })),
        ),
      )
    }
  }
}

interface DrawnCard<CardType extends Card> {
  /**
   * this property answers the question:
   * did this card pass through the player's hand (true) or is it still in the hand (false)?
   */
  discarded: boolean
  card: CardType
}

export interface SerializedHand {
  cards: {
    discarded: boolean
    card: SerializedCard
  }[]
}

export class Hand<CardType extends Card> {
  player: Player
  cards: DrawnCard<CardType>[] = []

  constructor(player: Player) {
    this.player = player
  }

  get size() {
    return this.cards.length
  }

  get keptCards() {
    return this.cards.filter((c) => !c.discarded).map((c) => c.card)
  }

  addCard(card: CardType, discarded: boolean) {
    this.cards.push({ card, discarded })
  }

  toJSON(): SerializedHand {
    return {
      cards: this.cards,
    }
  }
}

export class InvestigateHand extends Hand<InvestigateCard> {
  constructor(p: Player, serializedData?: SerializedHand) {
    super(p)

    if (serializedData) {
      this.fromJSON(serializedData)
    }
  }

  get chosenCards() {
    return this.cards.filter((c) => !c.discarded)
  }

  undoCardSelection(): [InvestigateCard, InvestigateCard] {
    const card1 = this.cards.pop()?.card
    const card2 = this.cards.pop()?.card

    if (!card1 || !card2) {
      console.error(card1, card2, 'no cards selected???')
      throw new Error('Somehow there were not cards selected to be undone???')
    }
    // frankly, I don't care to assume this won't work. Not in the mood to write error handling
    return [card1, card2]
  }

  fromJSON(data: SerializedHand) {
    this.cards = data.cards.map((c) => ({
      discarded: c.discarded,
      card: new InvestigateCard(investigateCardDataLookup[c.card.id]),
    }))
  }
}

export class TreasureHand extends Hand<TreasureCard> {
  constructor(p: Player, serializedData?: SerializedHand) {
    super(p)

    if (serializedData) {
      this.fromJSON(serializedData)
    }
  }

  getCoinTotal() {
    let coins = 0
    for (const card of this.keptCards.filter((card) => card.type !== 'jarMultiplier' && card.type !== 'twoCoins')) {
      coins += card.value(this.player.board)
    }

    coins += this.getTreasureJarValue()

    return coins
  }

  getTreasureJarValue(): number {
    let value = 0
    let index = 0

    for (const card of this.keptCards.filter((c) => c.type === 'jarMultiplier')) {
      if (card.jarValue) {
        const data = card.jarValue(index)
        index = data.index
        value += data.value
      }
    }

    return value
  }

  fromJSON(data: SerializedHand) {
    this.cards = data.cards.map((c) => ({
      discarded: c.discarded,
      card: new TreasureCard(treasureCardDataLookup[c.card.id]),
    }))
  }
}
