import { copyTextToClipboard } from '@/lib/clipboard'

export async function exportDiagnosticsForTrace(
  exportLogs: (options: { traceId?: string }) => string,
  traceId: string,
): Promise<void> {
  await copyTextToClipboard(exportLogs({ traceId }))
}
