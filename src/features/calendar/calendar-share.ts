type ShareCalendarFileOptions = {
  text: string
  title: string
}

type ShareCalendarFileResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

export type CalendarShareDiagnosticEvent =
  | {
      type: 'calendar-export-prepared'
      fileName: string
      fileSize: number
      fileType: string
      selectionCount: number
    }
  | {
      type: 'share-capability'
      phase: 'before-can-share'
      canShareAvailable: boolean
      shareAvailable: boolean
    }
  | {
      type: 'share-capability'
      phase: 'after-can-share'
      canShare: boolean
    }
  | {
      type: 'share-rejected'
      message: string
      name: string
    }
  | {
      type: 'share-result'
      result: ShareCalendarFileResult
    }

export type CalendarShareObserver = (
  event: CalendarShareDiagnosticEvent,
) => void

export function observeCalendarShare(
  observer: CalendarShareObserver | undefined,
  event: CalendarShareDiagnosticEvent,
): void {
  try {
    observer?.(event)
  } catch {
    // Diagnostics must never alter calendar share or download behavior.
  }
}

export async function shareOrDownloadCalendarFile(
  file: File,
  options: ShareCalendarFileOptions,
  observer?: CalendarShareObserver,
): Promise<ShareCalendarFileResult> {
  observeCalendarShare(observer, {
    type: 'share-capability',
    phase: 'before-can-share',
    canShareAvailable: typeof navigator.canShare === 'function',
    shareAvailable: typeof navigator.share === 'function',
  })

  const canShare = canShareCalendarFile(file)
  observeCalendarShare(observer, {
    type: 'share-capability',
    phase: 'after-can-share',
    canShare,
  })

  if (canShare) {
    try {
      await navigator.share({
        files: [file],
        text: options.text,
        title: options.title,
      })

      return finish('shared', observer)
    } catch (error) {
      observeCalendarShare(observer, {
        type: 'share-rejected',
        ...shareRejectionDetails(error),
      })

      if (isShareCancellation(error)) {
        return finish('cancelled', observer)
      }
    }
  }

  try {
    return finish(downloadCalendarFile(file), observer)
  } catch {
    return finish('failed', observer)
  }
}

function canShareCalendarFile(file: File): boolean {
  return (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  )
}

function downloadCalendarFile(file: File): ShareCalendarFileResult {
  const objectUrl = URL.createObjectURL(file)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = file.name

  try {
    anchor.click()

    return 'downloaded'
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  }
}

function isShareCancellation(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function finish(
  result: ShareCalendarFileResult,
  observer: CalendarShareObserver | undefined,
): ShareCalendarFileResult {
  observeCalendarShare(observer, { type: 'share-result', result })

  return result
}

function shareRejectionDetails(error: unknown): {
  message: string
  name: string
} {
  if (error instanceof Error) {
    return { message: error.message, name: error.name }
  }

  return { message: String(error), name: typeof error }
}
