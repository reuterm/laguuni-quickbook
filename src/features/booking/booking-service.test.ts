import { describe, expect, it, vi } from 'vitest'

import { localDate } from '../../../tests/local-date'
import type { LaguuniApi } from '../../lib/api/laguuni-api'
import { createMemoryStorage } from '../../test/create-memory-storage'
import { LocalDiagnosticsStore } from '../diagnostics/logs'
import { DefaultBookingService } from './booking-service'

const selection = {
  cableId: 'pro' as const,
  date: localDate('2026-05-14'),
  endTime: '16:00',
  startTime: '15:00',
}

const secondSelection = {
  cableId: 'pro' as const,
  date: localDate('2026-05-15'),
  endTime: '17:00',
  startTime: '16:00',
}

const otherCableSelection = {
  ...secondSelection,
  cableId: 'easy' as const,
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
    cancelMobilePayCheckout: vi.fn(async () => {}),
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
          selections: [selection],
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

  it('adds each selection to one basket before applying the code and checking out', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    await service.book(
      {
        code: 'FIXTURE-DISCOUNT',
        profile,
        selections: [selection, secondSelection],
      },
      trace,
    )

    expect(api.createBasket).toHaveBeenCalledOnce()
    expect(api.addReservationToBasket).toHaveBeenNthCalledWith(1, {
      basketToken: 'created-basket-token',
      selection,
    })
    expect(api.addReservationToBasket).toHaveBeenNthCalledWith(2, {
      basketToken: 'created-basket-token',
      selection: secondSelection,
    })
    expect(api.applyCodeToBasket).toHaveBeenCalledOnce()
    expect(api.submitCheckout).toHaveBeenCalledOnce()
  })

  it('releases the basket immediately after an add failure and keeps later cleanup safe', async () => {
    const api = createApiStub()
    vi.mocked(api.addReservationToBasket).mockRejectedValueOnce(
      new Error('Slot unavailable'),
    )
    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    const submission = await service.book(
      {
        profile,
        selections: [selection, secondSelection],
      },
      trace,
    )

    expect(api.addReservationToBasket).toHaveBeenCalledOnce()
    expect(api.applyCodeToBasket).not.toHaveBeenCalled()
    expect(api.submitCheckout).not.toHaveBeenCalled()
    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')

    await submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledOnce()
  })

  it('treats basket creation failures as recoverable availability changes', async () => {
    const api = createApiStub()
    vi.mocked(api.createBasket).mockRejectedValueOnce(
      new Error('Fixture basket creation failed.'),
    )
    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    const submission = await service.book(
      {
        profile,
        selections: [selection],
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'reservation-unavailable',
      message: 'Fixture basket creation failed.',
      status: 'failed',
      step: 'reservation',
    })
    expect(api.addReservationToBasket).not.toHaveBeenCalled()
    expect(api.submitCheckout).not.toHaveBeenCalled()
  })

  it('rejects an empty selections collection before creating a basket', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    const submission = await service.book(
      {
        profile,
        selections: [],
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'missing-selections',
      message: 'At least one booking slot selection is required.',
      status: 'failed',
      step: 'unexpected',
    })
    expect(api.createBasket).not.toHaveBeenCalled()
  })

  it('rejects mixed-cable selections before creating a basket', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = createTrace()

    const submission = await service.book(
      {
        profile,
        selections: [selection, otherCableSelection],
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'mixed-cable-selections',
      message: 'Booking slot selections must use the same cable.',
      status: 'failed',
      step: 'unexpected',
    })
    expect(api.createBasket).not.toHaveBeenCalled()
  })

  it('rejects duplicate date selections before creating a basket', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const duplicateDateSelection = {
      ...selection,
      endTime: '17:00',
      startTime: '16:00',
    }

    await expect(
      service.book(
        {
          profile,
          selections: [selection, duplicateDateSelection],
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        errorCode: 'duplicate-date-selections',
        status: 'failed',
        step: 'unexpected',
      },
    })

    expect(api.createBasket).not.toHaveBeenCalled()
    expect(api.addReservationToBasket).not.toHaveBeenCalled()
    expect(api.applyCodeToBasket).not.toHaveBeenCalled()
    expect(api.submitCheckout).not.toHaveBeenCalled()
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
          selections: [selection],
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

  it('returns basket cleanup when the code is invalid after basket creation', async () => {
    const api = createApiStub()

    vi.mocked(api.lookupCode).mockResolvedValueOnce({
      errorCode: 'GENERAL_ERROR',
      errorMessage: 'Antamasi koodi on virheellinen.',
      status: 'invalid',
    })

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        code: 'INVALID',
        profile,
        selections: [selection],
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'GENERAL_ERROR',
      message: 'Antamasi koodi on virheellinen.',
      status: 'failed',
      step: 'code',
    })

    await submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
  })

  it('falls back to deleting the basket when payment-required results do not include a payment token', async () => {
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockResolvedValueOnce({
      orderIdentifier: null,
      paymentToken: null,
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selections: [selection],
      },
      trace,
    )

    await submission.releaseReservation()

    expect(api.cancelMobilePayCheckout).not.toHaveBeenCalled()
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
          selections: [selection],
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
          selections: [selection],
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
          selections: [selection],
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
          selections: [selection],
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

    expect(exportedLogs).toContain('booking.checkout_planned')
    expect(exportedLogs).toContain('"paymentMethod": "mobilepay"')
    expect(exportedLogs).toContain('"totalDueCents": 1200')
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
          selections: [selection],
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
      request.observeResponse?.({
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
        paymentToken: 'fixture-payment-token',
        redirectUrl: fixtureMobilePayRedirectUrl,
        status: 'payment_required',
      }
    })

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await expect(
      service.book(
        {
          profile,
          selections: [selection],
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        orderIdentifier: '12345',
        paymentToken: 'fixture-payment-token',
        redirectUrl: fixtureMobilePayRedirectUrl,
        status: 'payment_required',
      },
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
      request.observePaymentRedirect?.(fixtureMobilePayRedirectUrl)

      return {
        orderIdentifier: null,
        paymentToken: 'fixture-payment-token',
        redirectUrl: fixtureMobilePayRedirectUrl,
        status: 'payment_required',
      }
    })

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })

    await expect(
      service.book(
        {
          profile,
          selections: [selection],
        },
        trace,
      ),
    ).resolves.toMatchObject({
      result: {
        orderIdentifier: null,
        paymentToken: 'fixture-payment-token',
        redirectUrl: fixtureMobilePayRedirectUrl,
        status: 'payment_required',
      },
    })

    const exportedLogs = diagnostics.exportLogs()

    expect(exportedLogs).toContain('booking.checkout_redirect_observed')
    expect(exportedLogs).toContain('pay.mobilepay.fi')
    expect(exportedLogs).toContain('/')
    expect(exportedLogs).not.toContain('test@example.com')
  })

  it('returns basket cleanup for reservation errors after basket creation', async () => {
    const api = createApiStub()

    vi.mocked(api.addReservationToBasket).mockRejectedValueOnce(
      new Error('Fixture reservation failed.'),
    )

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selections: [selection],
      },
      trace,
    )

    expect(submission.result).toEqual({
      errorCode: 'reservation-unavailable',
      message: 'Fixture reservation failed.',
      status: 'failed',
      step: 'reservation',
    })

    await submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
  })

  it('records reservation cleanup failures in diagnostics', async () => {
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
      paymentToken: 'fixture-payment-token',
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })
    vi.mocked(api.deleteBasket).mockRejectedValueOnce(
      new Error('Fixture basket delete failed.'),
    )

    const service = new DefaultBookingService({ api })
    const trace = diagnostics.beginTrace({ name: 'booking' })
    const submission = await service.book(
      {
        profile,
        selections: [selection],
      },
      trace,
    )

    await submission.releaseReservation()

    expect(diagnostics.exportLogs()).toContain('booking.basket_release_failed')
  })

  it('returns basket cleanup for failed checkout results', async () => {
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
        selections: [selection],
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

  it('returns basket cleanup for payment-required results', async () => {
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockResolvedValueOnce({
      orderIdentifier: null,
      paymentToken: 'fixture-payment-token',
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selections: [selection],
      },
      trace,
    )

    await submission.releaseReservation()

    expect(api.deleteBasket).toHaveBeenCalledWith('created-basket-token')
  })

  it('does not delete baskets after successful booking completion', async () => {
    const api = createApiStub()
    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selections: [selection],
      },
      trace,
    )

    await submission.releaseReservation()

    expect(api.deleteBasket).not.toHaveBeenCalled()
  })

  it('deletes a basket at most once when cleanup is called repeatedly', async () => {
    const api = createApiStub()

    vi.mocked(api.submitCheckout).mockResolvedValueOnce({
      orderIdentifier: null,
      paymentToken: 'fixture-payment-token',
      redirectUrl: fixtureMobilePayRedirectUrl,
      status: 'payment_required',
    })

    const service = new DefaultBookingService({ api })
    const trace = createTrace()
    const submission = await service.book(
      {
        profile,
        selections: [selection],
      },
      trace,
    )

    await submission.releaseReservation()
    await submission.releaseReservation()

    expect(api.cancelMobilePayCheckout).toHaveBeenCalledTimes(1)
    expect(api.deleteBasket).toHaveBeenCalledTimes(1)
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
