import { useCallback, useEffect, useRef } from 'react'

const LOAD_MORE_TRIGGER_ROOT_MARGIN_PX = 320

type AutoLoadSource = 'intersection' | 'no-scroll' | 'scroll'

type UseAvailabilityAutoLoadArgs = {
  canAutoLoadMore: boolean
  hasLoadedDayGroups: boolean
  isLoadingMore: boolean
  loadedDayGroupCount: number
  onLoadMore: () => Promise<void>
}

export function useAvailabilityAutoLoad({
  canAutoLoadMore,
  hasLoadedDayGroups,
  isLoadingMore,
  loadedDayGroupCount,
  onLoadMore,
}: UseAvailabilityAutoLoadArgs) {
  const hasUserScrolledRef = useRef(false)
  const lastAutoLoadScrollYRef = useRef(-1)
  const lastNoScrollAttemptKeyRef = useRef('')
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)
  const canAttemptAutoLoad =
    hasLoadedDayGroups && canAutoLoadMore && !isLoadingMore

  const attemptAutoLoad = useCallback(
    (source: AutoLoadSource) => {
      if (!canAttemptAutoLoad) {
        return
      }

      if (source === 'no-scroll') {
        if (hasScrolled(hasUserScrolledRef.current) || isPageScrollable()) {
          return
        }

        const autoLoadKey = `${loadedDayGroupCount}:${window.innerHeight}`

        if (lastNoScrollAttemptKeyRef.current === autoLoadKey) {
          return
        }

        lastNoScrollAttemptKeyRef.current = autoLoadKey
        void onLoadMore()
        return
      }

      if (
        !hasScrolled(hasUserScrolledRef.current) ||
        !isTriggerWithinLoadRange(loadMoreTriggerRef.current)
      ) {
        return
      }

      if (window.scrollY <= lastAutoLoadScrollYRef.current) {
        return
      }

      lastAutoLoadScrollYRef.current = window.scrollY
      void onLoadMore()
    },
    [canAttemptAutoLoad, loadedDayGroupCount, onLoadMore],
  )

  useEffect(() => {
    if (!hasLoadedDayGroups) {
      hasUserScrolledRef.current = false
      lastAutoLoadScrollYRef.current = -1
      lastNoScrollAttemptKeyRef.current = ''
      return undefined
    }

    if (!canAttemptAutoLoad) {
      return undefined
    }

    const handleScroll = () => {
      if (window.scrollY > 0) {
        hasUserScrolledRef.current = true
      }

      attemptAutoLoad('scroll')
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    if (typeof IntersectionObserver !== 'function') {
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }

    const loadMoreTrigger = loadMoreTriggerRef.current

    if (!(loadMoreTrigger instanceof HTMLDivElement)) {
      return () => {
        window.removeEventListener('scroll', handleScroll)
      }
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return
        }

        attemptAutoLoad('intersection')
      },
      {
        root: null,
        rootMargin: `0px 0px ${LOAD_MORE_TRIGGER_ROOT_MARGIN_PX}px 0px`,
      },
    )

    intersectionObserver.observe(loadMoreTrigger)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      intersectionObserver.disconnect()
    }
  }, [attemptAutoLoad, canAttemptAutoLoad, hasLoadedDayGroups])

  useEffect(() => {
    if (!hasLoadedDayGroups) {
      lastNoScrollAttemptKeyRef.current = ''
      return undefined
    }

    if (!canAttemptAutoLoad) {
      return undefined
    }

    if (hasScrolled(hasUserScrolledRef.current)) {
      return undefined
    }

    let timeoutId = 0

    const scheduleAutoLoadWithoutScroll = () => {
      window.clearTimeout(timeoutId)
      // Re-check after layout settles so tall viewports can bootstrap into a scrollable page.
      timeoutId = window.setTimeout(() => {
        attemptAutoLoad('no-scroll')
      }, 0)
    }

    scheduleAutoLoadWithoutScroll()
    window.addEventListener('resize', scheduleAutoLoadWithoutScroll)

    return () => {
      window.removeEventListener('resize', scheduleAutoLoadWithoutScroll)
      window.clearTimeout(timeoutId)
    }
  }, [attemptAutoLoad, canAttemptAutoLoad, hasLoadedDayGroups])

  return {
    loadMoreTriggerRef,
  }
}

function getPageScrollHeight() {
  return Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
  )
}

function hasScrolled(hasUserScrolled: boolean) {
  return hasUserScrolled || window.scrollY > 0
}

function isPageScrollable() {
  return getPageScrollHeight() > window.innerHeight
}

function isTriggerWithinLoadRange(loadMoreTrigger: HTMLDivElement | null) {
  if (!(loadMoreTrigger instanceof HTMLDivElement)) {
    return false
  }

  return (
    loadMoreTrigger.getBoundingClientRect().top <=
    window.innerHeight + LOAD_MORE_TRIGGER_ROOT_MARGIN_PX
  )
}

export type { UseAvailabilityAutoLoadArgs }
