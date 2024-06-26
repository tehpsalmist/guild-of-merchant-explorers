import { BoardData } from '../../game-logic/Board'
import { kazanBoard } from '../../images'

export const kazanData: BoardData = {
  name: 'kazan',
  imageURL: kazanBoard,
  dimensions: {
    height: 978,
    width: 1147,
    innerWidth: 933,
    innerHeight: 641,
    paddingLeft: 109,
    paddingTop: 114,
  },
  hexData: [
    [
      null,
      null,
      { terrain: 'mountain', coins: 4 },
      { terrain: 'mountain', coins: 2 },
      { terrain: 'mountain', coins: 1 },
      { terrain: 'water' },
      { terrain: 'water', isRuin: true, ruinSymbol: 'A' },
      { terrain: 'sand' },
      null,
      null,
      null,
    ],
    [
      null,
      null,
      { terrain: 'mountain', coins: 1 },
      { terrain: 'grass', coins: 2 },
      { terrain: 'grass' },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'sand', coins: 1 },
      { terrain: 'sand', coins: 1 },
      null,
      null,
    ],
    [
      { terrain: 'wild', isTower: true },
      { terrain: 'sand' },
      { terrain: 'grass' },
      { terrain: 'grass', tradingPostQuantity: 5 },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'grass', coins: 1 },
      { terrain: 'grass' },
      { terrain: 'sand' },
      null,
      null,
    ],
    [
      null,
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'sand', coins: 1 },
      { terrain: 'sand' },
      { terrain: 'mountain' },
      null,
    ],
    [
      { terrain: 'sand', coins: 1 },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'sand' },
      { terrain: 'grass' },
      { terrain: 'sand' },
      { terrain: 'mountain', coins: 1 },
      { terrain: 'mountain', coins: 2 },
      null,
    ],
    [
      { terrain: 'sand', coins: 2 },
      { terrain: 'sand' },
      { terrain: 'water' },
      null,
      null,
      { terrain: 'grass' },
      { terrain: 'sand', tradingPostQuantity: 2 },
      { terrain: 'mountain' },
      { terrain: 'water' },
      { terrain: 'water', isRuin: true, ruinSymbol: 'B' },
      { terrain: 'mountain' },
    ],
    [
      { terrain: 'sand', tradingPostQuantity: 3 },
      { terrain: 'water', isRuin: true, ruinSymbol: 'C' },
      null,
      null,
      null,
      { terrain: 'grass', coins: 1 },
      { terrain: 'sand', coins: 1 },
      { terrain: 'mountain', coins: 1 },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'wild', isTower: true },
    ],
    [
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'sand', tradingPostQuantity: 2 },
      { terrain: 'sand' },
      { terrain: 'grass', coins: 1 },
      { terrain: 'sand' },
      { terrain: 'mountain' },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'grass', coins: 2 },
    ],
    [
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'grass' },
      { terrain: 'sand', coins: 1 },
      { terrain: 'sand' },
      { terrain: 'grass' },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'grass', tradingPostQuantity: 2 },
      null,
    ],
    [
      { terrain: 'water', isRuin: true, ruinSymbol: 'D' },
      { terrain: 'grass', coins: 3 },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'wild', isCity: true },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water', isRuin: true, ruinSymbol: 'E' },
      { terrain: 'mountain' },
    ],
    [
      { terrain: 'water' },
      { terrain: 'water', isRuin: true, ruinSymbol: 'F' },
      { terrain: 'water' },
      { terrain: 'water', isRuin: true, ruinSymbol: 'G' },
      { terrain: 'mountain' },
      { terrain: 'mountain' },
      { terrain: 'sand', coins: 1 },
      { terrain: 'grass' },
      { terrain: 'grass' },
      { terrain: 'mountain', coins: 2 },
      null,
    ],
    [
      { terrain: 'mountain' },
      { terrain: 'mountain' },
      { terrain: 'water' },
      null,
      null,
      { terrain: 'mountain', coins: 1 },
      { terrain: 'sand' },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'mountain' },
      { terrain: 'grass' },
    ],
    [
      { terrain: 'mountain', tradingPostQuantity: 3 },
      { terrain: 'water' },
      { terrain: 'water' },
      null,
      null,
      null,
      { terrain: 'sand', coins: 1 },
      { terrain: 'grass', coins: 1 },
      { terrain: 'water' },
      { terrain: 'grass', tradingPostQuantity: 3 },
      null,
    ],
    [
      { terrain: 'mountain' },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'mountain', coins: 1 },
      null,
      null,
      null,
      { terrain: 'sand' },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'grass', coins: 2 },
    ],
    [
      { terrain: 'grass', isRuin: true, ruinSymbol: 'H' },
      { terrain: 'grass', coins: 1 },
      { terrain: 'water' },
      { terrain: 'mountain', coins: 3 },
      { terrain: 'mountain', coins: 3 },
      null,
      null,
      null,
      { terrain: 'water' },
      { terrain: 'grass' },
      null,
    ],
    [
      null,
      { terrain: 'sand', coins: 1 },
      { terrain: 'grass', coins: 1 },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'mountain', coins: 2 },
      { terrain: 'mountain', coins: 2 },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      null,
    ],
    [
      null,
      { terrain: 'sand' },
      { terrain: 'wild', isTower: true },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'grass', tradingPostQuantity: 2 },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'water' },
      null,
      null,
    ],
    [
      null,
      null,
      { terrain: 'sand', coins: 2 },
      { terrain: 'sand' },
      { terrain: 'water', isRuin: true, ruinSymbol: 'I' },
      { terrain: 'grass', coins: 2 },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'wild', isTower: true },
      null,
    ],
    [
      null,
      null,
      { terrain: 'sand' },
      { terrain: 'sand', tradingPostQuantity: 4 },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water', isRuin: true, ruinSymbol: 'J' },
      null,
      null,
      null,
    ],
  ],
}
