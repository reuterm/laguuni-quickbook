type ShareCalendarFileOptions = {
  text: string
  title: string
}

type ShareCalendarFileResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

export async function shareOrDownloadCalendarFile(
  file: File,
  options: ShareCalendarFileOptions,
): Promise<ShareCalendarFileResult> {
  try {
    if (canShareCalendarFile(file)) {
      await navigator.share({
        files: [file],
        text: options.text,
        title: options.title,
      })

      return 'shared'
    }

    return downloadCalendarFile(file)
  } catch (error) {
    if (isShareCancellation(error)) {
      return 'cancelled'
    }

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

  try {
    const anchor = document.createElement('a')

    anchor.href = objectUrl
    anchor.download = file.name
    anchor.click()

    return 'downloaded'
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function isShareCancellation(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
