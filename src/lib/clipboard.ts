export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || navigator.clipboard === undefined) {
    throw new Error('Clipboard access is unavailable in this browser.')
  }

  await navigator.clipboard.writeText(text)
}
