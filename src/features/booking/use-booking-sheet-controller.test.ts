import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDiagnostics } from '../../app/providers'
import type { BookingFlowResult } from '../../domain/booking'
import type { BookingSession } from './booking-service'
import { useBookingSheetController } from './use-booking-sheet-controller'

const fixtureTrace = {
  append: vi.fn(),
  traceId: 'fixture-trace',
}

const selection = {
  cableId: 'pro' as const,
  date: '2026-05-20',
  endTime: '16:00',
  startTime: '15:00',
}

function expectConfirmState(result: {
  current: { bookingSheetState: unknown }
}) {
  expect(result.current.bookingSheetState).toEqual({
    selection,
    status: 'confirm',
  })
}

function expectSubmittingState(result: {
  current: { bookingSheetState: unknown }
}) {
  expect(result.current.bookingSheetState).toEqual({
    selection,
    status: 'submitting',
  })
}

function expectCompletedState(
  result: { current: { bookingSheetState: unknown } },
  completed: {
    result: BookingFlowResult
    traceId: string
  },
) {
  expect(result.current.bookingSheetState).toEqual({
    result: completed.result,
    selection,
    status: 'completed',
    traceId: completed.traceId,
  })
}

function expectClosedState(result: {
  current: { bookingSheetState: unknown }
}) {
  expect(result.current.bookingSheetState).toEqual({ status: 'closed' })
}

const bookingFlowMocks = vi.hoisted(() => ({
  submitBooking: vi.fn(),
  useBookingFlow: vi.fn(),
}))

const sessionMocks = vi.hoisted(() => ({
  releaseReservation: vi.fn(),
}))

function createBookingSession(
  result: BookingFlowResult,
  options?: {
    releaseReservation?: () => Promise<void>
    trace?: typeof fixtureTrace
  },
) {
  return {
    releaseReservation:
      options?.releaseReservation ?? sessionMocks.releaseReservation,
    result,
    trace: options?.trace ?? fixtureTrace,
  }
}

vi.mock('./use-booking-flow', () => ({
  useBookingFlow: bookingFlowMocks.useBookingFlow,
}))

vi.mock('../../app/providers', async () => {
  const actual = await vi.importActual<typeof import('../../app/providers')>(
    '../../app/providers',
  )

  return {
    ...actual,
    useDiagnostics: vi.fn(),
  }
})

describe('useBookingSheetController', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('opens a confirmation state when a booking is requested', async () => {
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    expectConfirmState(result)
  })

  it('submits a confirmed booking only once while confirmation is already pending', async () => {
    let resolveBooking!: () => void

    bookingFlowMocks.submitBooking.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBooking = () => {
            resolve({
              ...createBookingSession(
                {
                  orderIdentifier: 'fixture-order-id',
                  status: 'success',
                },
                {
                  releaseReservation: vi.fn(),
                },
              ),
            })
          }
        }),
    )
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    let firstConfirmation: Promise<void>
    let secondConfirmation: Promise<void>

    await act(async () => {
      firstConfirmation = result.current.confirmBooking()
      secondConfirmation = result.current.confirmBooking()
    })

    expectSubmittingState(result)

    expect(bookingFlowMocks.submitBooking).toHaveBeenCalledTimes(1)
    expect(bookingFlowMocks.submitBooking).toHaveBeenCalledWith(selection)

    resolveBooking()

    await act(async () => {
      await firstConfirmation
      await secondConfirmation
    })
  })

  it('ignores booking requests while a submission is in progress', async () => {
    let resolveBooking!: () => void

    bookingFlowMocks.submitBooking.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBooking = () => {
            resolve({
              ...createBookingSession(
                {
                  orderIdentifier: 'fixture-order-id',
                  status: 'success',
                },
                {
                  releaseReservation: vi.fn(),
                },
              ),
            })
          }
        }),
    )
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      result.current.requestBooking(selection)
    })

    await act(async () => {
      void result.current.confirmBooking()
    })

    await act(async () => {
      result.current.requestBooking({
        cableId: 'easy',
        date: '2026-05-21',
        endTime: '17:00',
        startTime: '16:00',
      })
    })

    expectSubmittingState(result)

    resolveBooking()

    await act(async () => {
      await Promise.resolve()
    })
  })

  it('does not run dismiss side effects while a successful booking remains open', async () => {
    const onDismissCompleted = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession(
        {
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        },
        {
          releaseReservation: vi.fn(),
        },
      ),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onDismissCompleted).not.toHaveBeenCalled()
  })

  it('does not run basket cleanup or refresh while payment-required result remains open', async () => {
    const onDismissCompleted = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession({
        orderIdentifier: null,
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      }),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onDismissCompleted).not.toHaveBeenCalled()
    expect(sessionMocks.releaseReservation).not.toHaveBeenCalled()
  })

  it('does not run dismiss side effects while a failed booking remains open', async () => {
    const onDismissCompleted = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession(
        {
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        },
        {
          releaseReservation: vi.fn(),
        },
      ),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onDismissCompleted).not.toHaveBeenCalled()
  })

  it('closes the sheet when dismissed', async () => {
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expectClosedState(result)
  })

  it('runs dismiss side effects when dismissing a completed success state', async () => {
    const onDismissCompleted = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession(
        {
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        },
        {
          releaseReservation: vi.fn(),
        },
      ),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expectClosedState(result)

    await waitFor(() => {
      expect(onDismissCompleted).toHaveBeenCalledOnce()
    })
  })

  it('runs basket cleanup before running dismiss side effects', async () => {
    const onDismissCompleted = vi.fn(async () => {})
    const events: string[] = []

    sessionMocks.releaseReservation.mockImplementationOnce(async () => {
      events.push('release')
    })
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession({
        orderIdentifier: null,
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      }),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: async () => {
            events.push('refresh')
            await onDismissCompleted()
          },
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expectClosedState(result)

    await waitFor(() => {
      expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
      expect(onDismissCompleted).toHaveBeenCalledOnce()
    })

    expect(events).toEqual(['release', 'refresh'])
  })

  it('waits for basket cleanup before running dismiss side effects', async () => {
    let resolveCleanup!: () => void
    const onDismissCompleted = vi.fn(async () => {})

    sessionMocks.releaseReservation.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCleanup = resolve
        }),
    )
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession({
        orderIdentifier: null,
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      }),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expectClosedState(result)

    expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
    expect(onDismissCompleted).not.toHaveBeenCalled()

    resolveCleanup()

    await waitFor(() => {
      expect(onDismissCompleted).toHaveBeenCalledOnce()
    })
  })

  it('runs the dismiss side effect once when dismissed multiple times', async () => {
    const onDismissCompleted = vi.fn(async () => {})

    sessionMocks.releaseReservation.mockResolvedValueOnce(undefined)
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession({
        orderIdentifier: null,
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      }),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
      result.current.dismissBookingSheet()
    })

    await waitFor(() => {
      expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
      expect(onDismissCompleted).toHaveBeenCalledOnce()
    })
  })

  it('does not block a new booking while the previous dismiss cleanup is still running', async () => {
    let resolveFirstCleanup!: () => void

    sessionMocks.releaseReservation.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstCleanup = resolve
        }),
    )
    bookingFlowMocks.submitBooking
      .mockResolvedValueOnce({
        ...createBookingSession({
          orderIdentifier: null,
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        }),
      })
      .mockResolvedValueOnce({
        ...createBookingSession(
          {
            orderIdentifier: 'fixture-order-id',
            status: 'success',
          },
          {
            releaseReservation: vi.fn(),
          },
        ),
      })
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    await act(async () => {
      await result.current.requestBooking({
        cableId: 'easy',
        date: '2026-05-21',
        endTime: '17:00',
        startTime: '16:00',
      })
    })

    expect(result.current.bookingSheetState).toEqual({
      selection: {
        cableId: 'easy',
        date: '2026-05-21',
        endTime: '17:00',
        startTime: '16:00',
      },
      status: 'confirm',
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(bookingFlowMocks.submitBooking).toHaveBeenCalledTimes(2)

    resolveFirstCleanup()

    await waitFor(() => {
      expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
    })
  })

  it('runs failed booking cleanup when dismissing completed state', async () => {
    const onDismissCompleted = vi.fn(async () => {})

    sessionMocks.releaseReservation.mockResolvedValueOnce(undefined)
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession({
        errorCode: 'GENERAL_ERROR',
        message: 'Fixture checkout failed.',
        status: 'failed',
        step: 'checkout',
      }),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    await waitFor(() => {
      expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
      expect(onDismissCompleted).toHaveBeenCalledOnce()
    })
  })

  it('runs the dismiss side effect once when dismissing completed state', async () => {
    const refreshAvailability = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession(
        {
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        },
        {
          releaseReservation: vi.fn(),
        },
      ),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: refreshAvailability,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    await waitFor(() => {
      expect(refreshAvailability).toHaveBeenCalledOnce()
    })
  })

  it('runs completed booking cleanup when the controller unmounts', async () => {
    sessionMocks.releaseReservation.mockResolvedValueOnce(undefined)
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession({
        errorCode: 'GENERAL_ERROR',
        message: 'Fixture checkout failed.',
        status: 'failed',
        step: 'checkout',
      }),
    })
    mockBookingFlow()

    const { result, unmount } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    unmount()

    await waitFor(() => {
      expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
    })
  })

  it('runs completed payment-required cleanup when the controller unmounts', async () => {
    sessionMocks.releaseReservation.mockResolvedValueOnce(undefined)
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession({
        orderIdentifier: null,
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      }),
    })
    mockBookingFlow()

    const { result, unmount } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    unmount()

    await waitFor(() => {
      expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
    })
  })

  it('does not run dismiss side effects after unmount while cleanup is still resolving', async () => {
    let resolveCleanup!: () => void
    const onDismissCompleted = vi.fn(async () => {})

    sessionMocks.releaseReservation.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveCleanup = resolve
        }),
    )
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession({
        orderIdentifier: null,
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      }),
    })
    mockBookingFlow()

    const { result, unmount } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    unmount()
    resolveCleanup()

    await waitFor(() => {
      expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
    })

    expect(onDismissCompleted).not.toHaveBeenCalled()
  })

  it('runs late-arriving cleanup when the controller unmounts during submission', async () => {
    let resolveBooking!: (value: BookingSession) => void

    sessionMocks.releaseReservation.mockResolvedValueOnce(undefined)
    bookingFlowMocks.submitBooking.mockImplementation(
      () =>
        new Promise<BookingSession>((resolve) => {
          resolveBooking = resolve
        }),
    )
    mockBookingFlow()

    const { result, unmount } = renderHook(() => useBookingSheetController())

    await act(async () => {
      result.current.requestBooking(selection)
    })

    await act(async () => {
      void result.current.confirmBooking()
    })

    unmount()

    resolveBooking({
      ...createBookingSession({
        errorCode: 'GENERAL_ERROR',
        message: 'Fixture checkout failed.',
        status: 'failed',
        step: 'checkout',
      }),
    })

    await waitFor(() => {
      expect(sessionMocks.releaseReservation).toHaveBeenCalledOnce()
    })
  })

  it('records dismiss side effect failures as diagnostics', async () => {
    const append = vi.fn()
    const onDismissCompleted = vi.fn(async () => {
      throw new Error('refresh failed')
    })

    sessionMocks.releaseReservation.mockResolvedValueOnce(undefined)
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession(
        {
          orderIdentifier: null,
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        },
        {
          trace: {
            append,
            traceId: 'trace-payment',
          },
        },
      ),
    })
    mockBookingFlow({
      diagnostics: {
        beginTrace: vi.fn(() => ({
          append: vi.fn(),
          traceId: 'dismiss-trace',
        })),
      },
    })

    const { result } = renderHook(() =>
      useBookingSheetController({
        onDismissCompleted: {
          effect: 'refresh_availability',
          run: onDismissCompleted,
        },
      }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    await waitFor(() => {
      expect(onDismissCompleted).toHaveBeenCalledOnce()
      expect(append).toHaveBeenCalledWith({
        data: {
          bookingTraceId: 'trace-payment',
          effect: 'refresh_availability',
        },
        event: 'booking.sheet_dismiss_side_effect_failed',
      })
    })
  })

  it('does not close the sheet when dismissed during submission', async () => {
    let resolveBooking!: () => void

    bookingFlowMocks.submitBooking.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBooking = () => {
            resolve({
              ...createBookingSession(
                {
                  orderIdentifier: 'fixture-order-id',
                  status: 'success',
                },
                {
                  releaseReservation: vi.fn(),
                },
              ),
            })
          }
        }),
    )
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      result.current.requestBooking(selection)
    })

    await act(async () => {
      void result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expectSubmittingState(result)

    resolveBooking()

    await act(async () => {
      await Promise.resolve()
    })
  })

  it('does not dismiss while submission has started before the rerender catches up', async () => {
    let resolveBooking!: () => void

    bookingFlowMocks.submitBooking.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBooking = () => {
            resolve(
              createBookingSession(
                {
                  orderIdentifier: 'fixture-order-id',
                  status: 'success',
                },
                {
                  releaseReservation: vi.fn(),
                },
              ),
            )
          }
        }),
    )
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      result.current.requestBooking(selection)
    })

    let confirmation!: Promise<void>

    await act(async () => {
      confirmation = result.current.confirmBooking()
      result.current.dismissBookingSheet()
    })

    expectSubmittingState(result)

    resolveBooking()

    await act(async () => {
      await confirmation
    })
  })

  it('auto-dismisses a successful completed state after the configured delay', async () => {
    vi.useFakeTimers()
    bookingFlowMocks.submitBooking.mockResolvedValue({
      ...createBookingSession(
        {
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        },
        {
          releaseReservation: vi.fn(),
        },
      ),
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ successDismissDelayMs: 500 }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expectCompletedState(result, {
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      traceId: 'fixture-trace',
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.bookingSheetState).toEqual({ status: 'closed' })
  })
})

function mockBookingFlow(options?: {
  diagnostics?: Pick<ReturnType<typeof useDiagnostics>, 'beginTrace'>
}) {
  vi.mocked(useDiagnostics).mockReturnValue({
    beginTrace:
      options?.diagnostics?.beginTrace ??
      vi.fn(() => ({
        append: vi.fn(),
        traceId: 'diagnostics-trace',
      })),
    clear: vi.fn(),
    exportLogs: vi.fn(),
    listEntries: vi.fn(),
    loadState: vi.fn(),
    sessionId: 'session-id',
  })

  bookingFlowMocks.useBookingFlow.mockReturnValue({
    isBookingReady: true,
    submitBooking: bookingFlowMocks.submitBooking,
  })
}
