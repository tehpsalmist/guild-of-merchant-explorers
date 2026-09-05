import React, { ComponentProps } from 'react'
import { ExplorerBlock } from './ExplorerBlock'
import { Option, Select } from './Select'
import clsx from 'clsx'
import { ButtonProps } from '@8thday/react'
import { EXPLORER_COLORS } from '../game-logic/room-setup'

export interface ColorPickerProps extends Omit<ButtonProps, 'onSelect'> {
  value: string
  onValueChange(newVal: string): void
  disabledColors?: string[]
}

export const ColorPicker = ({
  className = '',
  value,
  onValueChange,
  disabledColors = [],
  ...props
}: ColorPickerProps) => {
  return (
    <Select
      variant="dismissive"
      className={clsx(className, 'h-10')}
      value={value}
      onSelect={onValueChange}
      selectionDisplay={(label) => (
        <ExplorerBlock className={clsx('h-9', !label && 'opacity-50')} color={label ?? ''} />
      )}
      {...props}
    >
      {EXPLORER_COLORS.map(
        (color) =>
          !disabledColors.includes(color) && (
            <Option key={color} label={color}>
              <ExplorerBlock color={color} className="h-10" />
            </Option>
          ),
      )}
    </Select>
  )
}
