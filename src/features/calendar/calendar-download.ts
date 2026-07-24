type DownloadCalendarFileResult = 'downloaded' | 'failed'

export async function downloadCalendarFile(
  file: File,
): Promise<DownloadCalendarFileResult> {
  try {
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
  } catch {
    return 'failed'
  }
}
