import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadCalendarFile } from './calendar-download'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('calendar-download', () => {
  it('downloads the calendar file without invoking native sharing', async () => {
    vi.useFakeTimers()
    const file = new File(['BEGIN:VCALENDAR'], 'booking.ics', {
      type: 'text/calendar;charset=utf-8',
    })
    const share = vi.fn()
    const createObjectURL = vi.fn(() => 'blob:fixture')
    const revokeObjectURL = vi.fn()
    const anchor = {
      click: vi.fn(),
      download: '',
      href: '',
    } satisfies Pick<HTMLAnchorElement, 'click' | 'download' | 'href'>

    vi.stubGlobal('navigator', { canShare: vi.fn(() => true), share })
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.spyOn(document, 'createElement').mockReturnValue(
      anchor as unknown as HTMLAnchorElement,
    )

    await expect(downloadCalendarFile(file)).resolves.toBe('downloaded')
    expect(share).not.toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalledWith(file)
    expect(anchor).toMatchObject({
      download: 'booking.ics',
      href: 'blob:fixture',
    })
    expect(anchor.click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    await vi.runAllTimersAsync()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fixture')
  })

  it('schedules URL cleanup when the download click fails', async () => {
    vi.useFakeTimers()
    const file = new File(['BEGIN:VCALENDAR'], 'booking.ics')
    const revokeObjectURL = vi.fn()
    const anchor = {
      click: vi.fn(() => {
        throw new Error('download click failed')
      }),
      download: '',
      href: '',
    } satisfies Pick<HTMLAnchorElement, 'click' | 'download' | 'href'>

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fixture'),
      revokeObjectURL,
    })
    vi.spyOn(document, 'createElement').mockReturnValue(
      anchor as unknown as HTMLAnchorElement,
    )

    await expect(downloadCalendarFile(file)).resolves.toBe('failed')
    expect(revokeObjectURL).not.toHaveBeenCalled()
    await vi.runAllTimersAsync()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fixture')
  })

  it('reports failure when an object URL cannot be created', async () => {
    const file = new File(['BEGIN:VCALENDAR'], 'booking.ics')
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => {
        throw new Error('download failed')
      }),
      revokeObjectURL: vi.fn(),
    })

    await expect(downloadCalendarFile(file)).resolves.toBe('failed')
  })
})
