import { afterEach, describe, expect, it, vi } from 'vitest'

import { shareOrDownloadCalendarFile } from './calendar-share'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('calendar-share', () => {
  it('shares the calendar file through the native share sheet when file sharing is supported', async () => {
    const file = new File(['BEGIN:VCALENDAR'], 'booking.ics', {
      type: 'text/calendar;charset=utf-8',
    })
    const canShare = vi.fn(() => true)
    const share = vi.fn(async () => {})

    vi.stubGlobal('navigator', {
      canShare,
      share,
    })

    await expect(
      shareOrDownloadCalendarFile(file, {
        text: 'Add this booking to your calendar.',
        title: 'Add to calendar',
      }),
    ).resolves.toBe('shared')

    expect(canShare).toHaveBeenCalledWith({ files: [file] })
    expect(share).toHaveBeenCalledWith({
      files: [file],
      text: 'Add this booking to your calendar.',
      title: 'Add to calendar',
    })
  })

  it('falls back to downloading the calendar file when native file sharing is unavailable', async () => {
    const file = new File(['BEGIN:VCALENDAR'], 'booking.ics', {
      type: 'text/calendar;charset=utf-8',
    })
    const share = vi.fn(async () => {})
    const createObjectURL = vi.fn(() => 'blob:fixture')
    const revokeObjectURL = vi.fn()
    const anchor = {
      click: vi.fn(),
      download: '',
      href: '',
    } satisfies Pick<HTMLAnchorElement, 'click' | 'download' | 'href'>

    vi.stubGlobal('navigator', { share })
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })
    vi.spyOn(document, 'createElement').mockReturnValue(
      anchor as unknown as HTMLAnchorElement,
    )

    await expect(
      shareOrDownloadCalendarFile(file, {
        text: 'Add this booking to your calendar.',
        title: 'Add to calendar',
      }),
    ).resolves.toBe('downloaded')

    expect(share).not.toHaveBeenCalled()
    expect(createObjectURL).toHaveBeenCalledWith(file)
    expect(anchor.href).toBe('blob:fixture')
    expect(anchor.download).toBe('booking.ics')
    expect(anchor.click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fixture')
  })

  it('treats share sheet cancellation as a neutral outcome', async () => {
    const file = new File(['BEGIN:VCALENDAR'], 'booking.ics', {
      type: 'text/calendar;charset=utf-8',
    })
    const share = vi.fn(async () => {
      throw new DOMException('The share request was cancelled.', 'AbortError')
    })

    vi.stubGlobal('navigator', {
      canShare: vi.fn(() => true),
      share,
    })

    await expect(
      shareOrDownloadCalendarFile(file, {
        text: 'Add this booking to your calendar.',
        title: 'Add to calendar',
      }),
    ).resolves.toBe('cancelled')
  })

  it('treats unexpected share failures as a neutral outcome', async () => {
    const file = new File(['BEGIN:VCALENDAR'], 'booking.ics', {
      type: 'text/calendar;charset=utf-8',
    })
    const share = vi.fn(async () => {
      throw new Error('share failed')
    })

    vi.stubGlobal('navigator', {
      canShare: vi.fn(() => true),
      share,
    })

    await expect(
      shareOrDownloadCalendarFile(file, {
        text: 'Add this booking to your calendar.',
        title: 'Add to calendar',
      }),
    ).resolves.toBe('cancelled')
  })
})
