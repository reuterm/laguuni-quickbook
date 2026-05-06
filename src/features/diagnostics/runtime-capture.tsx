import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react'
import { Component, useCallback, useEffect } from 'react'

import { useDiagnostics } from '@/app/providers'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

import { DiagnosticsCopyAction } from './DiagnosticsCopyAction'
import { exportDiagnosticsForTrace } from './export'
import type { Diagnostics } from './logs'

type AppDiagnosticsBoundaryProps = PropsWithChildren

type AppDiagnosticsBoundaryState = {
  traceId: string | null
}

export function AppDiagnosticsBoundary({
  children,
}: AppDiagnosticsBoundaryProps) {
  const diagnostics = useDiagnostics()
  const handleExportTrace = useCallback(
    async (traceId: string) => {
      await exportDiagnosticsForTrace(
        (options) => diagnostics.exportLogs(options),
        traceId,
      )
    },
    [diagnostics],
  )

  return (
    <AppDiagnosticsBoundaryInner
      diagnostics={diagnostics}
      onExportTrace={handleExportTrace}
    >
      {children}
    </AppDiagnosticsBoundaryInner>
  )
}

export function DiagnosticsRuntimeCapture() {
  const diagnostics = useDiagnostics()

  useEffect(() => {
    function handleWindowError(event: ErrorEvent) {
      const trace = diagnostics.beginTrace({ name: 'app.window_error' })

      trace.append({
        data: {
          errorMessage:
            readErrorMessage(event.error) ??
            (event.message.length > 0 ? event.message : null),
          errorName: readErrorName(event.error),
          filename: event.filename || null,
          lineno: event.lineno > 0 ? event.lineno : null,
        },
        event: 'app.window_error',
      })
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const trace = diagnostics.beginTrace({ name: 'app.unhandled_rejection' })

      trace.append({
        data: describeRejectionReason(event.reason),
        event: 'app.unhandled_rejection',
      })
    }

    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [diagnostics])

  return null
}

class AppDiagnosticsBoundaryInner extends Component<
  {
    children: ReactNode
    diagnostics: Diagnostics
    onExportTrace: (traceId: string) => Promise<void>
  },
  AppDiagnosticsBoundaryState
> {
  state: AppDiagnosticsBoundaryState = {
    traceId: null,
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    const trace = this.props.diagnostics.beginTrace({
      name: 'app.render_error',
    })

    trace.append({
      data: {
        componentStack:
          typeof errorInfo.componentStack === 'string' &&
          errorInfo.componentStack.length > 0
            ? normalizeComponentStack(errorInfo.componentStack)
            : null,
        errorMessage: readErrorMessage(error),
        errorName: readErrorName(error),
      },
      event: 'app.render_error',
    })

    this.setState({
      traceId: trace.traceId,
    })
  }

  render() {
    if (this.state.traceId !== null) {
      return (
        <AppCrashFallback
          onExportTrace={this.props.onExportTrace}
          traceId={this.state.traceId}
        />
      )
    }

    return this.props.children
  }
}

function AppCrashFallback({
  onExportTrace,
  traceId,
}: {
  onExportTrace: (traceId: string) => Promise<void>
  traceId: string
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col justify-center px-4 py-5 sm:px-6 sm:py-8">
      <Alert variant="destructive">
        <AlertTitle>Unexpected app error</AlertTitle>
        <AlertDescription>
          The app hit an unexpected error. Reload the page and, if it keeps
          happening, copy diagnostics and send them for debugging.
        </AlertDescription>
        <div className="mt-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                window.location.reload()
              }}
            >
              Reload page
            </Button>
            <DiagnosticsCopyAction onCopy={() => onExportTrace(traceId)} />
          </div>
        </div>
      </Alert>
    </div>
  )
}

function describeRejectionReason(reason: unknown): {
  errorMessage: string | null
  errorName: string | null
  reasonType: string
} {
  if (reason instanceof Error) {
    return {
      errorMessage: reason.message,
      errorName: reason.name,
      reasonType: 'error',
    }
  }

  if (typeof reason === 'string') {
    return {
      errorMessage: reason,
      errorName: null,
      reasonType: 'string',
    }
  }

  return {
    errorMessage: null,
    errorName: null,
    reasonType: reason === null ? 'null' : typeof reason,
  }
}

function normalizeComponentStack(componentStack: string): string | null {
  const normalized = componentStack.trim()

  return normalized.length > 0 ? normalized : null
}

function readErrorMessage(error: unknown): string | null {
  if (error instanceof Error) {
    return error.message
  }

  return typeof error === 'string' ? error : null
}

function readErrorName(error: unknown): string | null {
  return error instanceof Error ? error.name : null
}
