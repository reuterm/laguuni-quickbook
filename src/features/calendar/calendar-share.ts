type ShareCalendarFileOptions = {
  text: string
  title: string
}

type ShareCalendarFileResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

export async function shareOrDownloadCalendarFile(
  file: File,
  options: ShareCalendarFileOptions,
): Promise<ShareCalendarFileResult> {
  if (canShareCalendarFile(file)) {
    try {
      await navigator.share({
        files: [file],
        text: options.text,
        title: options.title,
      })

      return 'shared'
    } catch (error) {
      if (isShareCancellation(error)) {
        return 'cancelled'
      }
    }
  }

  try {
    return downloadCalendarFile(file)
  } catch {
    return 'failed'
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
