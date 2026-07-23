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
    )
  })

  it('allows content padding to be overridden', () => {
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
