import { describe, expect, it, vi } from 'vitest'

import type { LaguuniApi } from '../../lib/api/laguuni-api'
import { LocalDiagnosticsStore } from '../diagnostics/logs'
import { BookingExecutionError, DefaultBookingService } from './booking-service'

const selection = {
  cableId: 'pro' as const,
  date: '2026-05-14',
  endTime: '16:00',
  startTime: '15:00',
}

const profile = {
  email: 'test@example.com',
  name: 'Test User',
  phone: '+358401234567',
}

const fixtureMobilePayRedirectUrl =
  'https://pay.mobilepay.fi/?token=fixture-mobilepay-session'

function createApiStub(): LaguuniApi {
  return {
    addReservationToBasket: vi.fn(async () => ({
      itemId: 'fixture-item-id',
    })),
    applyCodeToBasket: vi.fn(async () => {}),
    createBasket: vi.fn(async () => 'created-basket-token'),
    deleteBasket: vi.fn(async () => {}),
    getAvailableDates: vi.fn(),
    getDailyAvailabilityWindow: vi.fn(),
    loadBasketPricingSummary: vi.fn(async () => ({
      totalDueCents: 0,
    })),
    lookupCode: vi.fn(async () => ({
      payload: {
        code: 'FIXTURE-DISCOUNT',
        amount: '26',
      },
      remainingBalanceCents: null,
      source: 'discount' as const,
      status: 'accepted' as const,
    })),
    submitCheckout: vi.fn(async () => ({
      orderIdentifier: 'fixture-order-id',
      status: 'success' as const,
    })),
  }
}

describe('DefaultBookingService', () => {
  it('runs the expected basket, code, and checkout sequence', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    await expect(
      service.book(
        {
          code: 'FIXTURE-DISCOUNT',
          profile,
          selection,
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
    })

    expect(api.createBasket).toHaveBeenCalledOnce()
    expect(api.addReservationToBasket).toHaveBeenCalledWith({
      basketToken: 'created-basket-token',
      selection,
    })
    expect(api.lookupCode).toHaveBeenCalledWith({
      code: 'FIXTURE-DISCOUNT',
    })
    expect(api.applyCodeToBasket).toHaveBeenCalledWith({
      basketToken: 'created-basket-token',
      code: 'FIXTURE-DISCOUNT',
    })
    expect(api.loadBasketPricingSummary).toHaveBeenCalledWith(
      'created-basket-token',
    )
    expect(api.submitCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        basketToken: 'created-basket-token',
        paymentMethod: 'cash',
        profile,
      }),
    )
  })

  it('stops before checkout when the code is invalid', async () => {
    const api = createApiStub()

    vi.mocked(api.lookupCode).mockResolvedValueOnce({
      errorCode: 'GENERAL_ERROR',
      errorMessage: 'Antamasi koodi on virheellinen.',
      status: 'invalid',
    })

    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    await expect(
      service.book(
        {
          code: 'INVALID',
          profile,
          selection,
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        errorCode: 'GENERAL_ERROR',
        message: 'Antamasi koodi on virheellinen.',
        status: 'failed',
        step: 'code',
      },
    })

    expect(api.submitCheckout).not.toHaveBeenCalled()
    expect(api.applyCodeToBasket).not.toHaveBeenCalled()
  })

  it('returns cleanup for failed checkout results after creating a basket', async () => {
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockResolvedValueOnce({
      errorCode: 'GENERAL_ERROR',
      message: 'Fixture checkout failed.',
      status: 'failed',
    })

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'GENERAL_ERROR',
      message: 'Fixture checkout failed.',
      status: 'failed',
      step: 'checkout',
    })

    await submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
  })

  it('returns cleanup when adding the reservation fails after basket creation', async () => {
    const api = createApiStub()

    vi.mocked(api.addReservationToBasket).mockRejectedValueOnce(
      new Error('Reservation add failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'unexpected-error',
      message: 'Reservation add failed',
      status: 'failed',
      step: 'unexpected',
    })

    await submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
  })

  it('records the add reservation phase for unexpected reservation add errors', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.addReservationToBasket).mockRejectedValueOnce(
      new Error('Reservation add failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.unexpected_error')
    expect(exportedLogs).toContain('"phase": "add_reservation"')
  })

  it('returns cleanup when applying the code fails after basket creation', async () => {
    const api = createApiStub()

    vi.mocked(api.applyCodeToBasket).mockRejectedValueOnce(
      new Error('Code apply failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        code: 'FIXTURE-DISCOUNT',
        profile,
        selection,
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'unexpected-error',
      message: 'Code apply failed',
      status: 'failed',
      step: 'unexpected',
    })

    await submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
  })

  it('records the apply code phase for unexpected code apply errors', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.applyCodeToBasket).mockRejectedValueOnce(
      new Error('Code apply failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await service.book(
      {
        code: 'FIXTURE-DISCOUNT',
        profile,
        selection,
      },
      trace,
    )

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.unexpected_error')
    expect(exportedLogs).toContain('"phase": "apply_code"')
  })

  it('returns cleanup when loading basket pricing fails after basket creation', async () => {
    const api = createApiStub()

    vi.mocked(api.loadBasketPricingSummary).mockRejectedValueOnce(
      new Error('Pricing load failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'unexpected-error',
      message: 'Pricing load failed',
      status: 'failed',
      step: 'unexpected',
    })

    await submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
  })

  it('fails early when required booking profile details are missing', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    await expect(
      service.book(
        {
          profile: {
            ...profile,
            email: ' ',
          },
          selection,
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        errorCode: 'missing-profile',
        message: 'Missing required profile fields: email',
        status: 'failed',
        step: 'profile',
      },
    })

    expect(api.createBasket).not.toHaveBeenCalled()
  })

  it('records the lookup code phase for unexpected code lookup errors', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.lookupCode).mockRejectedValueOnce(
      new Error('Code lookup failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await service.book(
      {
        code: 'FIXTURE-DISCOUNT',
        profile,
        selection,
      },
      trace,
    )

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.unexpected_error')
    expect(exportedLogs).toContain('"phase": "lookup_code"')
  })

  it('uses paid checkout when accepted code leaves a remaining balance', async () => {
    const api = createApiStub()

    vi.mocked(api.loadBasketPricingSummary).mockResolvedValueOnce({
      totalDueCents: 1200,
    })

    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    await expect(
      service.book(
        {
          code: 'FIXTURE-DISCOUNT',
          profile,
          selection,
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
    })

    expect(api.submitCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        basketToken: 'created-basket-token',
        paymentMethod: 'mobilepay',
      }),
    )
  })

  it('logs booking flow events without persisting raw code or profile data', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await expect(
      service.book(
        {
          code: 'FIXTURE-DISCOUNT',
          profile,
          selection,
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
    })

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('lqk-fixedtrace')
    expect(exportedLogs).toContain('booking.started')
    expect(exportedLogs).toContain('booking.code_applied')
    expect(exportedLogs).toContain('booking.checkout_planned')
    expect(exportedLogs).toContain('"paymentMethod": "cash"')
    expect(exportedLogs).toContain('"totalDueCents": 0')
    expect(exportedLogs).not.toContain('FIXTURE-DISCOUNT')
    expect(exportedLogs).not.toContain('test@example.com')
    expect(exportedLogs).not.toContain('+358401234567')
  })

  it('records checkout planning for paid bookings', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.loadBasketPricingSummary).mockResolvedValueOnce({
      totalDueCents: 1200,
    })

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await expect(
      service.book(
        {
          code: 'FIXTURE-DISCOUNT',
          profile,
          selection,
        },
        trace,
      ),
    ).resolves.toEqual({
      result: {
        orderIdentifier: 'fixture-order-id',
        status: 'success',
      },
      releaseReservation: expect.any(Function),
      trace: expect.objectContaining({
        traceId: expect.any(String),
      }),
    })

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.checkout_planned')
    expect(exportedLogs).toContain('"paymentMethod": "mobilepay"')
    expect(exportedLogs).toContain('"totalDueCents": 1200')
  })

  it('does not delete the basket when successful booking cleanup is finalized', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    await submission.releaseReservation()

    expect(submission.result).toEqual({
      orderIdentifier: 'fixture-order-id',
      status: 'success',
    })
    expect(api.deleteBasket).not.toHaveBeenCalled()
  })

  it('keeps checkout diagnostics on safe codes instead of raw error messages', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockResolvedValueOnce({
      errorCode: 'GENERAL_ERROR',
      message: 'Fixture checkout failed.',
      status: 'failed',
    })

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await expect(
      service.book(
        {
          profile,
          selection,
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        errorCode: 'GENERAL_ERROR',
        message: 'Fixture checkout failed.',
        status: 'failed',
        step: 'checkout',
      },
    })

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('GENERAL_ERROR')
    expect(exportedLogs).not.toContain('Fixture checkout failed.')
  })

  it('records a safe summary of the observed checkout response shape', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockImplementationOnce(async (request) => {
      request.observers?.response?.({
        hasErrorCode: false,
        hasErrorMessage: false,
        normalizedStatus: 'ok',
        orderFieldKind: 'number',
        paymentRequiredFieldKind: 'missing',
        rawStatus: 'pending',
        redirectUrlFieldKind: 'string',
        responseKeys: 'order,provider,redirectUrl,status',
      })

      return {
        orderIdentifier: '12345',
        redirectUrl: fixtureMobilePayRedirectUrl,
        status: 'payment_required',
      }
    })

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    expect(submission.result).toEqual({
      orderIdentifier: '12345',
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.checkout_response_observed')
    expect(exportedLogs).toContain('order,provider,redirectUrl,status')
    expect(exportedLogs).not.toContain('fixture-payment-token')
  })

  it('records sanitized payment redirect diagnostics without storing raw tokens', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockImplementationOnce(async (request) => {
      request.observers?.paymentRedirect?.(fixtureMobilePayRedirectUrl)

      return {
        orderIdentifier: null,
        redirectUrl: fixtureMobilePayRedirectUrl,
        status: 'payment_required',
      }
    })

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    expect(submission.result).toEqual({
      orderIdentifier: null,
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.checkout_redirect_observed')
    expect(exportedLogs).toContain('pay.mobilepay.fi')
    expect(exportedLogs).toContain('/')
    expect(exportedLogs).not.toContain('test@example.com')
  })

  it('records cleanup diagnostics when basket cleanup succeeds', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockResolvedValueOnce({
      orderIdentifier: null,
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    await submission.releaseReservation()

    const exportedLogs = diagnostics.exportLogs()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
    expect(exportedLogs).toContain('booking.basket_cleanup_requested')
    expect(exportedLogs).toContain('booking.basket_cleaned_up')
  })

  it('reuses the same cleanup operation when cleanup is requested multiple times', async () => {
    const api = createApiStub()
    let resolveDelete!: () => void

    vi.mocked(api.submitCheckout).mockResolvedValueOnce({
      orderIdentifier: null,
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })
    vi.mocked(api.deleteBasket).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        }),
    )

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    const firstCleanup = submission.releaseReservation()
    const secondCleanup = submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledOnce()

    resolveDelete()

    await Promise.all([firstCleanup, secondCleanup])
  })

  it('records failed cleanup diagnostics without persisting raw error messages', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockResolvedValueOnce({
      orderIdentifier: null,
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })
    vi.mocked(api.deleteBasket).mockRejectedValueOnce(
      new Error('Unable to clean up reservation'),
    )

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    await expect(submission.releaseReservation()).resolves.toBeUndefined()

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.basket_cleanup_requested')
    expect(exportedLogs).toContain('booking.basket_cleanup_failed')
    expect(exportedLogs).not.toContain('Unable to clean up reservation')
  })

  it('returns unexpected failures with cleanup when checkout throws after creating the basket', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockRejectedValueOnce(
      new Error('Checkout transport failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'unexpected-error',
      message: 'Checkout transport failed',
      status: 'failed',
      step: 'unexpected',
    })

    await submission.releaseReservation()

    const exportedLogs = diagnostics.exportLogs()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
    expect(exportedLogs).toContain('"phase": "submit_checkout"')
  })

  it('preserves the original error as cause when tagging booking phases', () => {
    const originalError = new Error('Checkout transport failed')
    const executionError = new BookingExecutionError(
      'submit_checkout',
      originalError,
    )

    expect(executionError).toMatchObject({
      cause: originalError,
      message: 'Checkout transport failed',
      name: 'BookingExecutionError',
      phase: 'submit_checkout',
    })
  })

  it('records the failing phase for unexpected basket setup errors', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.loadBasketPricingSummary).mockRejectedValueOnce(
      new Error('Pricing load failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.unexpected_error')
    expect(exportedLogs).toContain('"phase": "load_basket_pricing"')
  })

  it('records the create basket phase for unexpected basket creation errors', async () => {
    const diagnostics = new LocalDiagnosticsStore({
      appVersion: '0.1.0',
      createId: () => 'lqk-fixedtrace',
      platform: 'Vitest Browser',
      sessionId: 'session-fixed',
      storage: createMemoryStorage(),
    })
    const api = createApiStub()

    vi.mocked(api.createBasket).mockRejectedValueOnce(
      new Error('Basket create failed'),
    )

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })
    const submission = await service.book(
      {
        profile,
        selection,
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'unexpected-error',
      message: 'Basket create failed',
      status: 'failed',
      step: 'unexpected',
    })

    await submission.releaseReservation()

    const exportedLogs = diagnostics.exportLogs()

    expect(api.deleteBasket).not.toHaveBeenCalled()
    expect(exportedLogs).toContain('booking.unexpected_error')
    expect(exportedLogs).toContain('"phase": "create_basket"')
  })
})

function createTrace() {
  const diagnostics = new LocalDiagnosticsStore({
    appVersion: '0.1.0',
    createId: () => 'trace-fixed',
    platform: 'Vitest Browser',
    sessionId: 'session-fixed',
    storage: createMemoryStorage(),
  })

  return diagnostics.beginTrace({ name: 'booking' })
}

function createMemoryStorage() {
  const values = new Map<string, string>()

  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    removeItem(key: string) {
      values.delete(key)
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}
