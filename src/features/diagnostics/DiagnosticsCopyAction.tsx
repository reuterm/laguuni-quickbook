import type { ReactNode } from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

type DiagnosticsCopyActionProps = {
  buttonContent?: ReactNode
  buttonClassName?: string
  onCopy: () => Promise<void>
}

export function DiagnosticsCopyAction({
  buttonContent = 'Copy diagnostics',
  buttonClassName = 'w-full sm:w-auto',
  onCopy,
}: DiagnosticsCopyActionProps) {
  const [copyState, setCopyState] = useState<'idle' | 'failed' | 'succeeded'>(
    'idle',
  )

  async function handleCopyDiagnostics() {
    try {
      await onCopy()
      setCopyState('succeeded')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className={buttonClassName}
        onClick={() => {
          void handleCopyDiagnostics()
        }}
      >
        {buttonContent}
      </Button>
      {copyState === 'succeeded' ? (
        <p className="text-xs text-muted-foreground">
          Diagnostics copied to the clipboard.
        </p>
      ) : null}
      {copyState === 'failed' ? (
        <p className="text-xs text-muted-foreground">
          Diagnostics could not be copied on this device.
        </p>
      ) : null}
    </div>
  )
}
