import { BoardData } from '../../game-logic/Board'
import { northProyliaBoard } from '../../images'

export const northProyliaData: BoardData = {
  name: 'northProylia',
  imageURL: northProyliaBoard,
  dimensions: {
    height: 990,
    width: 1178,
    innerWidth: 963,
    innerHeight: 690,
    paddingLeft: 111,
    paddingTop: 108,
  },
  hexData: [
    [
      null,
      null,
      { terrain: 'water', isRuin: true },
      { terrain: 'grass' },
      { terrain: 'grass', coins: 2 },
      { terrain: 'sand' },
      { terrain: 'sand', coins: 1 },
      { terrain: 'sand', coins: 1 },
      null,
      null,
      null,
      null,
    ],
    [
      null,
      { terrain: 'wild', isTower: true },
      { terrain: 'wild', isIce: true },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'wild', isIce: true, coins: 2 },
      { terrain: 'wild', isIce: true },
      { terrain: 'mountain', coins: 1 },
      { terrain: 'sand' },
      null,
      null,
      null,
    ],
    [
      null,
      { terrain: 'wild', isIce: true },
      { terrain: 'water', isRuin: true },
      { terrain: 'grass' },
      { terrain: 'grass', coins: 2 },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'mountain' },
      { terrain: 'mountain', coins: 1 },
      null,
      null,
      null,
    ],
    [
      null,
      { terrain: 'mountain' },
      { terrain: 'wild', isIce: true, coins: 2 },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'grass', coins: 2 },
      { terrain: 'grass' },
      null,
      null,
    ],
    [
      { terrain: 'mountain', coins: 2 },
      { terrain: 'mountain' },
      { terrain: 'wild', isIce: true, coins: 2 },
      { terrain: 'water' },
      { terrain: 'mountain' },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'grass', tradingPostQuantity: 3 },
      { terrain: 'mountain', coins: 2 },
      { terrain: 'wild', isIce: true, isRuin: true },
      null,
    ],
    [
      { terrain: 'sand' },
      { terrain: 'mountain', tradingPostQuantity: 4 },
      { terrain: 'grass' },
      { terrain: 'wild', isIce: true },
      { terrain: 'water' },
      { terrain: 'mountain', tradingPostQuantity: 4 },
      { terrain: 'wild', isIce: true, coins: 3 },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'sand' },
      { terrain: 'mountain' },
      { terrain: 'wild', isTower: true },
    ],
    [
      { terrain: 'sand' },
      { terrain: 'grass' },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'sand' },
      { terrain: 'sand' },
      { terrain: 'mountain' },
      null,
    ],
    [
      { terrain: 'grass', coins: 1 },
      { terrain: 'sand', coins: 1 },
      { terrain: 'wild', isIce: true, coins: 2 },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'wild', isIce: true, isRuin: true },
      { terrain: 'wild', isIce: true },
      { terrain: 'sand' },
      { terrain: 'water', isRuin: true },
      { terrain: 'sand', coins: 1 },
      { terrain: 'grass' },
      null,
    ],
    [
      { terrain: 'grass' },
      { terrain: 'wild', isIce: true },
      { terrain: 'mountain' },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'wild', isIce: true },
      { terrain: 'sand', tradingPostQuantity: 2 },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'grass' },
      null,
      null,
    ],
    [
      { terrain: 'grass', isRuin: true },
      { terrain: 'wild', isIce: true },
      { terrain: 'mountain', coins: 2 },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'wild', isIce: true },
      { terrain: 'grass' },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'grass', coins: 1 },
      null,
    ],
    [
      { terrain: 'wild', isIce: true },
      { terrain: 'mountain', coins: 2 },
      { terrain: 'sand' },
      { terrain: 'wild', isIce: true },
      { terrain: 'water' },
      { terrain: 'grass' },
      { terrain: 'grass', coins: 1 },
      { terrain: 'grass' },
      { terrain: 'water' },
      { terrain: 'water' },
      null,
      null,
    ],
    [
      { terrain: 'wild', isIce: true, coins: 1 },
      { terrain: 'wild', isIce: true },
      { terrain: 'mountain' },
      { terrain: 'sand', coins: 1 },
      { terrain: 'water', isRuin: true },
      { terrain: 'water' },
      { terrain: 'sand', coins: 1 },
      { terrain: 'wild', isCity: true },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'grass' },
      null,
    ],
    [
      { terrain: 'sand', coins: 2 },
      { terrain: 'wild', isIce: true },
      { terrain: 'grass' },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'sand' },
      { terrain: 'sand' },
      { terrain: 'mountain' },
      { terrain: 'water' },
      { terrain: 'grass', tradingPostQuantity: 3 },
      null,
      null,
    ],
    [
      { terrain: 'sand' },
      { terrain: 'sand', tradingPostQuantity: 5 },
      { terrain: 'wild', isIce: true },
      { terrain: 'grass' },
      { terrain: 'grass', coins: 1 },
      { terrain: 'water' },
      { terrain: 'sand' },
      { terrain: 'mountain' },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'grass' },
      null,
    ],
    [
      { terrain: 'sand' },
      { terrain: 'wild', isIce: true },
      { terrain: 'mountain', coins: 2 },
      { terrain: 'mountain', coins: 1 },
      { terrain: 'grass', coins: 1 },
      { terrain: 'water' },
      { terrain: 'mountain' },
      { terrain: 'water' },
      { terrain: 'wild', isIce: true, coins: 3 },
      { terrain: 'grass' },
      null,
      null,
    ],
    [
      null,
      { terrain: 'wild', isIce: true, isRuin: true },
      { terrain: 'grass' },
      { terrain: 'mountain' },
      { terrain: 'wild', isIce: true },
      { terrain: 'wild', isIce: true },
      { terrain: 'water' },
      { terrain: 'water' },
      { terrain: 'sand' },
      { terrain: 'sand' },
      { terrain: 'wild', isTower: true },
      null,
    ],
    [
      { terrain: 'wild', isIce: true },
      { terrain: 'wild', isIce: true, coins: 3 },
      { terrain: 'grass' },
      { terrain: 'grass', coins: 2 },
      { terrain: 'grass' },
      { terrain: 'sand' },
      { terrain: 'sand' },
      { terrain: 'water', isRuin: true },
      { terrain: 'sand' },
      null,
      null,
      null,
    ],
    [
      { terrain: 'wild', isTower: true },
      { terrain: 'wild', isIce: true },
      { terrain: 'grass' },
      { terrain: 'wild', isIce: true, coins: 2 },
      { terrain: 'wild', isIce: true },
      { terrain: 'sand', coins: 1 },
      { terrain: 'sand' },
      { terrain: 'water' },
      { terrain: 'sand', coins: 2 },
      null,
      null,
      null,
    ],
    [
      null,
      null,
      { terrain: 'wild', isIce: true, isRuin: true },
      { terrain: 'wild', isIce: true },
      { terrain: 'mountain' },
      { terrain: 'mountain' },
      { terrain: 'mountain', tradingPostQuantity: 3 },
      { terrain: 'water' },
      null,
      null,
      null,
      null,
    ],
  ],
}
