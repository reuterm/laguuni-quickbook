import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from './sheet'

afterEach(() => {
  cleanup()
})

describe('Sheet', () => {
  it('bounds right-side sheets to the viewport and transitions only transforms', () => {
    render(
      <Sheet open>
        <SheetContent side="right">
          <SheetTitle>Test sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>,
    )

    expect(document.querySelector('[data-slot="sheet-content"]')).toHaveClass(
      'h-dvh',
      'transition-transform',
      'pt-[calc(env(safe-area-inset-top)+1.25rem)]',
    )
  })

  it('allows content padding to be overridden while preserving right-side safe-area top padding', () => {
    render(
      <Sheet open>
        <SheetContent className="p-0">
          <SheetTitle>Test sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>,
    )

    expect(document.querySelector('[data-slot="sheet-content"]')).toHaveClass(
      'p-0',
    )
    expect(
      document.querySelector('[data-slot="sheet-content"]'),
    ).not.toHaveClass('p-5')
    expect(document.querySelector('[data-slot="sheet-content"]')).toHaveClass(
      'pt-[calc(env(safe-area-inset-top)+1.25rem)]',
    )
  })

  it('renders the default close button', async () => {
    const user = userEvent.setup()

    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Test sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>,
    )

    await user.click(screen.getByRole('button', { name: 'Open' }))

    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute(
      'data-slot',
      'sheet-close',
    )
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass(
      'top-[calc(env(safe-area-inset-top)+1rem)]',
    )
  })

  it('keeps bottom-sheet close buttons at their sheet edge', () => {
    render(
      <Sheet open>
        <SheetContent side="bottom">
          <SheetTitle>Test sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>,
    )

    expect(screen.getByRole('button', { name: 'Close' })).not.toHaveClass(
      'top-[calc(env(safe-area-inset-top)+1rem)]',
    )
    expect(screen.getByRole('button', { name: 'Close' })).toHaveClass('top-4')
  })

  it('omits the close button when opted out', async () => {
    const user = userEvent.setup()

    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent showCloseButton={false}>
          <SheetTitle>Test sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>,
    )

    await user.click(screen.getByRole('button', { name: 'Open' }))

    expect(
      screen.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument()
  })

  it('closes when the default close button is pressed', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <Sheet onOpenChange={onOpenChange}>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Test sheet</SheetTitle>
          <SheetDescription>Test description</SheetDescription>
        </SheetContent>
      </Sheet>,
    )

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
