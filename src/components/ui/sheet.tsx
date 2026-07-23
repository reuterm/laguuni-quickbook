import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { forwardRef } from 'react'
import type * as React from 'react'

import { cn } from '@/lib/utils'

import {
  interactiveGhostSurfaceClassName,
  sheetSurfaceClassName,
} from './styles'

const sheetEdgeClassNames = {
  bottom: 'border-t border-white/6',
  left: 'border-r border-white/6',
  right: 'border-l border-white/6',
  top: 'border-b border-white/6',
} as const

function Sheet(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>,
) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

const SheetClose = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Close>,
  React.ComponentProps<typeof DialogPrimitive.Close>
>(function SheetClose(props, ref) {
  return (
    <DialogPrimitive.Close ref={ref} data-slot="sheet-close" {...props} />
  )
})

const SheetCloseButton = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Close>,
  React.ComponentProps<typeof DialogPrimitive.Close>
>(function SheetCloseButton({ className, ...props }, ref) {
  return (
    <SheetClose
      ref={ref}
      type="button"
      className={cn(
        'absolute top-4 right-4 rounded-full p-2 text-muted-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none sm:top-5 sm:right-5',
        interactiveGhostSurfaceClassName,
        className,
      )}
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </SheetClose>
  )
})

function SheetPortal(
  props: React.ComponentProps<typeof DialogPrimitive.Portal>,
) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/55 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      data-slot="sheet-overlay"
      {...props}
    />
  )
}

const sheetVariants = cva(
  `fixed z-50 flex flex-col gap-4 p-5 data-[state=closed]:animate-out data-[state=open]:animate-in sm:p-6 ${sheetSurfaceClassName}`,
  {
    variants: {
      side: {
        top: `inset-x-0 top-0 data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top ${sheetEdgeClassNames.top}`,
        bottom: `inset-x-0 bottom-0 rounded-t-3xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom ${sheetEdgeClassNames.bottom}`,
        left: `inset-y-0 left-0 h-full w-3/4 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm ${sheetEdgeClassNames.left}`,
        right: `inset-y-0 right-0 h-svh h-dvh w-full transition-transform data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-lg ${sheetEdgeClassNames.right}`,
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
)

function SheetContent({
  children,
  className,
  side = 'right',
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    showCloseButton?: boolean
  }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={sheetVariants({ className, side })}
        data-slot="sheet-content"
        data-testid="sheet-content"
        {...props}
      >
        {children}
        {showCloseButton ? <SheetCloseButton /> : null}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-2 text-center sm:text-left',
        className,
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-foreground', className)}
      data-slot="sheet-title"
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      data-slot="sheet-description"
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetCloseButton,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
