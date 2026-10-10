import React, { ReactNode, useEffect } from 'react'
import { Modal } from '@8thday/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { plankPanelHorizontal } from '../images'

export interface MetadataDialogProps {
  children: ReactNode
  eyebrow?: string
  title: string
  onClose(): void
  /** For dialogs with a "Continue" button: pressing Enter triggers it. */
  onContinue?(): void
}

export const MetadataDialog = ({
  children,
  eyebrow = 'Guild Records',
  title,
  onClose,
  onContinue,
}: MetadataDialogProps) => {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  useEffect(() => {
    if (!onContinue) return

    const continueOnEnter = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

      // Also stops Enter from activating whatever button still has focus behind the dialog.
      event.preventDefault()
      onContinue()
    }

    window.addEventListener('keydown', continueOnEnter)
    return () => window.removeEventListener('keydown', continueOnEnter)
  }, [onContinue])

  return (
    <Modal
      className="max-h-[94dvh]! max-w-[96dvw]! overflow-hidden! rounded-3xl! bg-transparent! p-0! shadow-2xl mobile:h-dvh! mobile:max-h-dvh! mobile:max-w-none! mobile:rounded-none! phone-landscape:h-dvh! phone-landscape:max-h-dvh! phone-landscape:max-w-none! phone-landscape:rounded-none!"
      bgClass="bg-slate-950/80 backdrop-blur-sm"
      overlayClasses="fixed inset-0 z-[80] flex items-center justify-center"
      onClose={onClose}
    >
      <section
        className="relative flex h-[min(94dvh,52rem)] w-[min(94dvw,72rem)] flex-col overflow-hidden text-white mobile:h-dvh mobile:w-screen phone-landscape:h-dvh phone-landscape:w-screen"
        style={{ backgroundImage: `url(${plankPanelHorizontal.href})` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="metadata-dialog-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-slate-950/50" />

        <button
          type="button"
          className="fixed z-90 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-900/75 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-white/80"
          style={{
            top: 'max(0.5rem, env(safe-area-inset-top))',
            right: 'max(0.5rem, env(safe-area-inset-right))',
          }}
          onClick={onClose}
          aria-label={`Close ${title}`}
          title="Close"
        >
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        </button>

        <header className="relative shrink-0 border-b border-white/15 px-16 py-3 text-center phone-landscape:py-1.5">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-amber-100/70 phone-landscape:hidden">
            {eyebrow}
          </p>
          <h1
            id="metadata-dialog-title"
            className="font-serif text-2xl text-amber-50 sm:text-3xl phone-landscape:text-xl"
          >
            {title}
          </h1>
        </header>

        <div className="relative min-h-0 flex-1">{children}</div>
      </section>
    </Modal>
  )
}
