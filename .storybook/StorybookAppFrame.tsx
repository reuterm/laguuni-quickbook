import type { PropsWithChildren } from 'react'

export function StorybookAppFrame({ children }: PropsWithChildren) {
  return (
    <div className="min-h-svh w-full max-w-7xl px-4 py-6 sm:px-6">
      {children}
    </div>
  )
}
