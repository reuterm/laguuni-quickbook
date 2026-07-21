import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../tests/local-date'
import { useBookingSheetController } from './use-booking-sheet-controller'

const selection = {
  cableId: 'pro' as const,
  date: localDate('2026-05-20'),
  endTime: '16:00',
  startTime: '15:00',
}

const bookingFlowMocks = vi.hoisted(() => ({
  submitBooking: vi.fn(),
  useBookingFlow: vi.fn(),
}))

const releaseReservationMock = vi.hoisted(() => vi.fn(async () => {}))

vi.mock('./use-booking-flow', () => ({
  useBookingFlow: bookingFlowMocks.useBookingFlow,
}))

describe('useBookingSheetController', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('opens an initial confirmation and keeps its selection for continuation', async () => {
    mockBookingFlow()
    const onKeepBookingForMore = vi.fn()

    const { result } = renderHook(() =>
      useBookingSheetController({ onKeepBookingForMore }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    expect(result.current.bookingSheetState).toEqual({
      selections: [selection],
      kind: 'initial',
      status: 'confirm',
    })

    act(() => {
      result.current.keepBookingForMore()
    })

    expect(onKeepBookingForMore).toHaveBeenCalledWith(selection)
    expect(result.current.bookingSheetState).toEqual({ status: 'closed' })
  })

  it('opens a basket confirmation for multiple selections', async () => {
    const secondSelection = {
      cableId: 'easy' as const,
      date: localDate('2026-05-21'),
      endTime: '17:00',
      startTime: '16:00',
    }
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      result.current.requestBasketReview([selection, secondSelection])
    })

    expect(result.current.bookingSheetState).toEqual({
      selections: [selection, secondSelection],
      kind: 'basket',
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
              releaseReservation: vi.fn(async () => {}),
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
      await result.current.requestInitialBooking(selection)
    })

    let firstConfirmation: Promise<void>
    let secondConfirmation: Promise<void>

    await act(async () => {
      firstConfirmation = result.current.confirmBooking()
      secondConfirmation = result.current.confirmBooking()
    })

    expect(result.current.bookingSheetState).toEqual({
      selections: [selection],
      status: 'submitting',
    })

    expect(bookingFlowMocks.submitBooking).toHaveBeenCalledTimes(1)
    expect(bookingFlowMocks.submitBooking).toHaveBeenCalledWith([selection])

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
              releaseReservation: vi.fn(async () => {}),
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
      result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      void result.current.confirmBooking()
    })

    await act(async () => {
      result.current.requestInitialBooking({
        cableId: 'easy',
        date: localDate('2026-05-21'),
        endTime: '17:00',
        startTime: '16:00',
      })
    })

    expect(result.current.bookingSheetState).toEqual({
      selections: [selection],
      status: 'submitting',
    })

    resolveBooking()

    await act(async () => {
      await Promise.resolve()
    })
  })

  it('calls onBookingFinalized for successful bookings', async () => {
    const onBookingFinalized = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: vi.fn(async () => {}),
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      traceId: 'trace-success',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onBookingFinalized).toHaveBeenCalledOnce()
    expect(onBookingFinalized).toHaveBeenCalledWith({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      selections: [selection],
    })
  })

  it('passes every selected date to onBookingFinalized after a successful booking', async () => {
    const secondSelection = {
      cableId: 'easy' as const,
      date: localDate('2026-05-21'),
      endTime: '17:00',
      startTime: '16:00',
    }
    const onBookingFinalized = vi.fn(async () => {})

    bookingFlowMocks.useBookingFlow.mockReturnValue({
      isBookingReady: true,
      submitBooking: vi.fn(async () => ({
        releaseReservation: vi.fn(async () => {}),
        result: {
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        },
        selections: [selection, secondSelection],
        traceId: 'trace-success',
      })),
    })

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onBookingFinalized).toHaveBeenCalledWith({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      selections: [selection, secondSelection],
    })
  })

  it('does not reject successful bookings when post-booking finalization fails', async () => {
    const onBookingFinalized = vi.fn(async () => {
      throw new Error('Fixture refresh failed.')
    })

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: vi.fn(async () => {}),
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      traceId: 'trace-success',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await expect(
      act(async () => {
        await result.current.confirmBooking()
      }),
    ).resolves.toBeUndefined()

    expect(result.current.bookingSheetState).toEqual({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      selections: [selection],
      status: 'completed',
      traceId: 'trace-success',
    })
    expect(onBookingFinalized).toHaveBeenCalledOnce()
  })

  it('does not call onBookingFinalized for payment-required bookings before dismiss', async () => {
    const onBookingFinalized = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: releaseReservationMock,
      result: {
        paymentToken: 'fixture-payment-token',
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      },
      traceId: 'trace-payment',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onBookingFinalized).not.toHaveBeenCalled()
  })

  it('does not call onBookingFinalized for failed bookings before dismiss', async () => {
    const onBookingFinalized = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: releaseReservationMock,
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
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(onBookingFinalized).not.toHaveBeenCalled()
  })

  it('closes the sheet when dismissed', async () => {
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestInitialBooking(selection)
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
              releaseReservation: vi.fn(async () => {}),
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
      result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      void result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expect(result.current.bookingSheetState).toEqual({
      selections: [selection],
      status: 'submitting',
    })

    resolveBooking()

    await act(async () => {
      await Promise.resolve()
    })
  })

  it('keeps a successful completed state open until dismissed manually', async () => {
    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: vi.fn(async () => {}),
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      traceId: 'trace-success',
    })
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    expect(result.current.bookingSheetState).toEqual({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      selections: [selection],
      status: 'completed',
      traceId: 'trace-success',
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expect(result.current.bookingSheetState).toEqual({ status: 'closed' })
  })

  it('allows dismissing a successful completed state while success finalization is still pending', async () => {
    let resolveFinalization!: () => void
    const onBookingFinalized = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFinalization = resolve
        }),
    )

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: vi.fn(async () => {}),
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      traceId: 'trace-success',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    let confirmationPromise!: Promise<void>

    await act(async () => {
      confirmationPromise = result.current.confirmBooking()
    })

    await waitFor(() => {
      expect(result.current.bookingSheetState).toEqual({
        result: {
          orderIdentifier: 'fixture-order-id',
          status: 'success',
        },
        selections: [selection],
        status: 'completed',
        traceId: 'trace-success',
      })
    })

    expect(onBookingFinalized).toHaveBeenCalledOnce()

    act(() => {
      result.current.dismissBookingSheet()
    })

    expect(result.current.bookingSheetState).toEqual({ status: 'closed' })

    resolveFinalization()

    await act(async () => {
      await confirmationPromise
    })
  })

  it('cleans up failed bookings when dismissed', async () => {
    const onBookingFinalized = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: releaseReservationMock,
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
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expect(releaseReservationMock).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(onBookingFinalized).toHaveBeenCalledWith({
        result: {
          errorCode: 'GENERAL_ERROR',
          message: 'Fixture checkout failed.',
          status: 'failed',
          step: 'checkout',
        },
        selections: [selection],
      })
    })
  })

  it('waits for cleanup before finalizing dismissed bookings', async () => {
    let resolveCleanup!: () => void
    const onBookingFinalized = vi.fn(async () => {})
    const releaseReservation = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveCleanup = resolve
        }),
    )

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation,
      result: {
        paymentToken: 'fixture-payment-token',
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      },
      traceId: 'trace-payment',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expect(releaseReservation).toHaveBeenCalledTimes(1)
    expect(onBookingFinalized).not.toHaveBeenCalled()

    resolveCleanup()

    await waitFor(() => {
      expect(onBookingFinalized).toHaveBeenCalledWith({
        result: {
          paymentToken: 'fixture-payment-token',
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        },
        selections: [selection],
      })
    })
  })

  it('ignores rejected finalization callbacks after dismiss', async () => {
    const onBookingFinalized = vi.fn(async () => {
      throw new Error('Fixture refresh failed.')
    })

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: releaseReservationMock,
      result: {
        paymentToken: 'fixture-payment-token',
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      },
      traceId: 'trace-payment',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    await waitFor(() => {
      expect(releaseReservationMock).toHaveBeenCalledTimes(1)
      expect(onBookingFinalized).toHaveBeenCalledWith({
        result: {
          paymentToken: 'fixture-payment-token',
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        },
        selections: [selection],
      })
    })
    expect(result.current.bookingSheetState).toEqual({ status: 'closed' })
  })

  it('cleans up payment-required bookings when dismissed', async () => {
    const onBookingFinalized = vi.fn(async () => {})

    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: releaseReservationMock,
      result: {
        paymentToken: 'fixture-payment-token',
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      },
      traceId: 'trace-payment',
    })
    mockBookingFlow()

    const { result } = renderHook(() =>
      useBookingSheetController({ onBookingFinalized }),
    )

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expect(releaseReservationMock).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(onBookingFinalized).toHaveBeenCalledWith({
        result: {
          paymentToken: 'fixture-payment-token',
          redirectUrl: 'https://example.com/pay',
          status: 'payment_required',
        },
        selections: [selection],
      })
    })
  })

  it('does not clean up successful bookings when dismissed', async () => {
    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: releaseReservationMock,
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      traceId: 'trace-success',
    })
    mockBookingFlow()

    const { result } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    act(() => {
      result.current.dismissBookingSheet()
    })

    expect(releaseReservationMock).not.toHaveBeenCalled()
  })

  it('cleans up abandoned completed bookings on unmount', async () => {
    bookingFlowMocks.submitBooking.mockResolvedValue({
      releaseReservation: releaseReservationMock,
      result: {
        paymentToken: 'fixture-payment-token',
        redirectUrl: 'https://example.com/pay',
        status: 'payment_required',
      },
      traceId: 'trace-payment',
    })
    mockBookingFlow()

    const { result, unmount } = renderHook(() => useBookingSheetController())

    await act(async () => {
      await result.current.requestInitialBooking(selection)
    })

    await act(async () => {
      await result.current.confirmBooking()
    })

    unmount()

    expect(releaseReservationMock).toHaveBeenCalledTimes(1)
  })
})

function mockBookingFlow() {
  bookingFlowMocks.useBookingFlow.mockReturnValue({
    isBookingReady: true,
    submitBooking: vi.fn(async (selections) => ({
      ...(await bookingFlowMocks.submitBooking(selections)),
      selections,
    })),
  })
}
