import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useBookingSheetController } from './use-booking-sheet-controller'

const selection = {
  cableId: 'pro' as const,
  date: '2026-05-20',
  endTime: '16:00',
  startTime: '15:00',
}

const bookingFlowMocks = vi.hoisted(() => ({
  submitBooking: vi.fn(),
  useBookingFlow: vi.fn(),
}))

vi.mock('./use-booking-flow', () => ({
  useBookingFlow: bookingFlowMocks.useBookingFlow,
}))

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

    expect(result.current.bookingSheetState).toEqual({
      selection,
      status: 'confirm',
    })
  })

  it('submits a confirmed booking only once while confirmation is already pending', async () => {
    let resolveBooking!: () => void

    bookingFlowMocks.submitBooking.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBooking = () => {
            resolve({
              result: {
                orderIdentifier: 'fixture-order-id',
                status: 'success',
              },
              traceId: 'trace-success',
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

    expect(result.current.bookingSheetState).toEqual({
      selection,
      status: 'submitting',
    })

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
              result: {
                orderIdentifier: 'fixture-order-id',
                status: 'success',
              },
              traceId: 'trace-success',
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

    expect(result.current.bookingSheetState).toEqual({
      selection,
      status: 'submitting',
    })

    resolveBooking()

    await act(async () => {
      await Promise.resolve()
    })
  })

  it('calls onBookingSubmitted for successful bookings', async () => {
    const onBookingSubmitted = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      traceId: 'trace-success',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingSubmitted }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onBookingSubmitted).toHaveBeenCalledOnce()
  })

  it('calls onBookingSubmitted for payment-required bookings', async () => {
    const onBookingSubmitted = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      result: {
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      },
      traceId: 'trace-payment',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingSubmitted }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onBookingSubmitted).toHaveBeenCalledOnce()
  })

  it('does not call onBookingSubmitted for failed bookings', async () => {
    const onBookingSubmitted = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      result: {
        errorCode: 'GENERAL_ERROR',
        message: 'Fixture checkout failed.',
        status: 'failed',
        step: 'checkout',
      },
      traceId: 'trace-failure',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingSubmitted }),
    )

    await act(async () => {
      await result.current.requestBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onBookingSubmitted).not.toHaveBeenCalled()
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

    expect(result.current.bookingSheetState).toEqual({ status: 'closed' })
  })

  it('does not close the sheet when dismissed during submission', async () => {
    let resolveBooking!: () => void

    bookingFlowMocks.submitBooking.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBooking = () => {
            resolve({
              result: {
                orderIdentifier: 'fixture-order-id',
                status: 'success',
              },
              traceId: 'trace-success',
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

    expect(result.current.bookingSheetState).toEqual({
      selection,
      status: 'submitting',
    })

    resolveBooking()

    await act(async () => {
      await Promise.resolve()
    })
  })

  it('auto-dismisses a successful completed state after the configured delay', async () => {
    vi.useFakeTimers()
    bookingFlowMocks.submitBooking.mockResolvedValue({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      traceId: 'trace-success',
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

    expect(result.current.bookingSheetState).toEqual({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      selection,
      status: 'completed',
      traceId: 'trace-success',
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.bookingSheetState).toEqual({ status: 'closed' })
  })
})

function mockBookingFlow() {
  bookingFlowMocks.useBookingFlow.mockReturnValue({
    isBookingReady: true,
    submitBooking: bookingFlowMocks.submitBooking,
  })
}
