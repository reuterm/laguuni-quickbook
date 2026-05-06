import { copyTextToClipboard } from '@/lib/clipboard'

export async function exportDiagnostics(
  exportLogs: (options: { traceId?: string }) => string,
  options?: { traceId?: string },
): Promise<void> {
  await copyTextToClipboard(exportLogs(options ?? {}))
}

export async function exportDiagnosticsForTrace(
  exportLogs: (options: { traceId?: string }) => string,
  traceId: string,
): Promise<void> {
  await exportDiagnostics(exportLogs, { traceId })
}
