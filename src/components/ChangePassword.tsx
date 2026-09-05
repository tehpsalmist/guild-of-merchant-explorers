import { Button, TextInput, toast } from '@8thday/react'
import { useChangePassword } from '@nhost/react'
import React, { ComponentProps, useState } from 'react'
import clsx from 'clsx'
import { ExpeditionButton } from '../design-system/ExpeditionButton'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export interface ChangePasswordProps extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  onSuccess?(): void
  dark?: boolean
}

export const ChangePassword = ({ className = '', onSuccess, dark = false, ...props }: ChangePasswordProps) => {
  const { changePassword } = useChangePassword()

  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const passwordsMismatch = confirmNewPassword !== newPassword
  const disabled = newPassword.length < 9 || passwordsMismatch
  const darkInputClasses = dark
    ? '!rounded-xl !border-amber-100/25 !bg-amber-50/95 !text-slate-950 focus:!border-amber-300 focus:!ring-amber-200'
    : ''

  return (
    <form
      className={clsx(className, 'space-y-3')}
      onSubmit={async (e) => {
        e.preventDefault()

        if (disabled) return

        const changeResult = await changePassword(newPassword)

        if (changeResult.isError) {
          return toast.error({ message: 'Trouble Changing Password 🙁', description: changeResult.error?.message })
        }

        if (changeResult.isSuccess) {
          setNewPassword('')
          setConfirmNewPassword('')
          toast.success({ message: 'Password updated.', description: "Don't forget to save it somewhere safe." })
          onSuccess?.()
        }
      }}
      {...props}
    >
      <TextInput
        id="new-password"
        label="New password"
        labelClass={dark ? '!text-amber-50' : ''}
        inputClass={darkInputClasses}
        type="password"
        minLength={9}
        name="new_password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        description="Use at least nine characters."
        collapseDescriptionArea
        required
      />
      <TextInput
        id="confirm-new-password"
        label="Confirm new password"
        labelClass={dark ? '!text-amber-50' : ''}
        inputClass={darkInputClasses}
        type="password"
        minLength={9}
        name="confirm_password"
        autoComplete="new-password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        errorMessage={confirmNewPassword && passwordsMismatch ? 'Passwords do not match.' : ''}
        collapseDescriptionArea
        required
      />
      {dark ? (
        <ExpeditionButton tone="primary" type="submit" disabled={disabled} Icon={ShieldCheckIcon}>
          Update password
        </ExpeditionButton>
      ) : (
        <Button variant="primary" type="submit" disabled={disabled}>
          Update password
        </Button>
      )}
    </form>
  )
}
