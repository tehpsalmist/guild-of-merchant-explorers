import React from 'react'
import { MapIcon } from '@heroicons/react/24/outline'
import type { BoardName } from '../game-logic/GameState'
import { BoardSelectionCards, boards } from './BoardSelectionCards'

interface RoomBoardPickerProps {
  value: BoardName | ''
  isHost: boolean
  onChange(board: BoardName): void
}

export const RoomBoardPicker = ({ value, isHost, onChange }: RoomBoardPickerProps) => {
  const selectedBoard = boards.find((board) => board.name === value)

  return (
    <section
      className="rounded-2xl border border-amber-100/15 bg-black/25 p-4 shadow-xl backdrop-blur-sm sm:p-5"
      aria-labelledby="room-board-heading"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200">
          <MapIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="grow">
          <h2 className="font-serif text-2xl text-amber-50" id="room-board-heading">
            Your expedition
          </h2>
          <p className="text-xs text-amber-100/55">
            {isHost ? 'Choose a map for your table to explore.' : 'The host chooses the map for this expedition.'}
          </p>
        </div>
        {selectedBoard && <span className="text-sm font-bold text-amber-200">{selectedBoard.label}</span>}
      </div>
      <BoardSelectionCards
        value={value}
        onChange={onChange}
        canSelect={isHost}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
      />
    </section>
  )
}
