import { describe, expect, it } from 'vitest'
import { formatLocalDate } from '@/lib/date'
import { localDate } from '../../../tests/local-date'
import {
  groupAvailabilityWeeks,
  listCalendarSkeletonWeeks,
  listVisibleWeekdayIndices,
} from './availability-calendar'
import type { AvailabilityDayGroup } from './availability-service'

const FIXTURE_DAY_GROUPS: readonly AvailabilityDayGroup[] = [
  {
    date: localDate('2026-05-14'),
    displayDate: 'Thu 14 May',
    slots: [
      {
        endTime: '13:00',
        freeCapacity: 4,
        id: '2026-05-14-720',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-14'),
          endTime: '13:00',
          startTime: '12:00',
        },
        startTime: '12:00',
        totalCapacity: 4,
      },
    ],
  },
  {
    date: localDate('2026-05-15'),
    displayDate: 'Fri 15 May',
    slots: [
      {
        endTime: '14:00',
        freeCapacity: 1,
        id: '2026-05-15-780',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-15'),
          endTime: '14:00',
          startTime: '13:00',
        },
        startTime: '13:00',
        totalCapacity: 4,
      },
    ],
  },
  {
    date: localDate('2026-05-19'),
    displayDate: 'Tue 19 May',
    slots: [
      {
        endTime: '18:00',
        freeCapacity: 3,
        id: '2026-05-19-1020',
        selection: {
          cableId: 'pro',
          date: localDate('2026-05-19'),
          endTime: '18:00',
          startTime: '17:00',
        },
        startTime: '17:00',
        totalCapacity: 4,
      },
    ],
  },
]

const firstWeekBookableDay = FIXTURE_DAY_GROUPS[0] ?? null
const secondWeekBookableDay = FIXTURE_DAY_GROUPS[1] ?? null
const nextWeekBookableDay = FIXTURE_DAY_GROUPS[2] ?? null

describe('availability-calendar', () => {
  it('groups availability into monday-to-sunday weeks', () => {
    expect(groupAvailabilityWeeks(FIXTURE_DAY_GROUPS)).toMatchObject([
      {
        days: [
          null,
          null,
          null,
          FIXTURE_DAY_GROUPS[0],
          FIXTURE_DAY_GROUPS[1],
          null,
          null,
        ],
        id: '2026-05-11',
        label: '11 May - 17 May',
      },
      {
        days: [null, FIXTURE_DAY_GROUPS[2], null, null, null, null, null],
        id: '2026-05-18',
        label: '18 May - 24 May',
      },
    ])
  })

  it('shows only weekday columns that fall inside the loaded range', () => {
    expect(
      listVisibleWeekdayIndices(
        new Date('2026-05-11T00:00:00'),
        new Date('2026-05-14T12:00:00'),
        false,
        7,
      ),
    ).toEqual([3, 4, 5, 6])
    expect(
      listVisibleWeekdayIndices(
        new Date('2026-05-18T00:00:00'),
        new Date('2026-05-14T12:00:00'),
        false,
        7,
      ),
    ).toEqual([0, 1, 2])
  })

  it('shows full monday-to-sunday columns at wider breakpoints', () => {
    expect(
      listVisibleWeekdayIndices(
        new Date('2026-05-11T00:00:00'),
        new Date('2026-05-14T12:00:00'),
        true,
        7,
      ),
    ).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('trims leading visible days that have no bookable slots', () => {
    if (nextWeekBookableDay === null) {
      throw new Error('Expected next week fixture day')
    }

    expect(
      listVisibleWeekdayIndices(
        new Date('2026-05-18T00:00:00'),
        new Date('2026-05-18T12:00:00'),
        false,
        7,
        [
          null,
          null,
          {
            date: localDate('2026-05-20'),
            displayDate: 'Wed 20 May',
            slots: nextWeekBookableDay.slots,
          } satisfies AvailabilityDayGroup,
          null,
          null,
          null,
          null,
        ],
      ),
    ).toEqual([2, 3, 4, 5, 6])
  })

  it('keeps visible days intact when the first visible day is already bookable', () => {
    expect(
      listVisibleWeekdayIndices(
        new Date('2026-05-11T00:00:00'),
        new Date('2026-05-14T12:00:00'),
        false,
        7,
        [
          null,
          null,
          null,
          firstWeekBookableDay,
          secondWeekBookableDay,
          null,
          null,
        ],
      ),
    ).toEqual([3, 4, 5, 6])
  })

  it('lists the loading skeleton weeks from the same loaded range', () => {
    expect(
      listCalendarSkeletonWeeks(new Date('2026-05-14T12:00:00'), 7).map(
        formatLocalDate,
      ),
    ).toEqual(['2026-05-11', '2026-05-18'])
  })
})
