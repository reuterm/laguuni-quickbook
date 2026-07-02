import type * as React from 'react'
import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { eyebrowClassName } from '@/components/ui/styles'
import type { BookingSelectionPresentation } from '../booking-selection-label'

type BookingSheetProps = {
  children: React.ReactNode
  dismissible?: boolean
  onDismiss: () => void
  open: boolean
  summary: BookingSelectionPresentation
}

export function BookingSheet({
  children,
  dismissible = true,
  onDismiss,
  open,
  summary,
}: BookingSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && dismissible) {
          onDismiss()
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-[2rem] px-5 pb-7 pt-6 sm:mx-auto sm:max-w-lg"
        forceMount
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (!dismissible) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (!dismissible) {
            event.preventDefault()
          }
        }}
        onPointerDownOutside={(event) => {
          if (!dismissible) {
            event.preventDefault()
          }
        }}
      >
        {dismissible ? <SheetCloseButton /> : null}
        <BookingSheetLayout summary={summary}>{children}</BookingSheetLayout>
      </SheetContent>
    </Sheet>
  )
}

function BookingSheetLayout({
  children,
  summary,
}: {
  children: React.ReactNode
  summary: BookingSelectionPresentation
}) {
  return (
    <div className="grid gap-6">
      <SheetHeader className="space-y-2 pr-10 text-left">
        <p className={eyebrowClassName}>Booking</p>
        <SheetTitle>Booking details</SheetTitle>
        <SheetDescription>{summary.label}</SheetDescription>
      </SheetHeader>

      <dl className="grid gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
        {summary.rows.map((row) => (
          <SummaryRow key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>

      {children}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[5rem_1fr] sm:items-center sm:gap-3">
      <dt className={eyebrowClassName}>{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}
