const eyebrowTypographyClassName = 'font-medium uppercase tracking-[0.2em]'
export const eyebrowClassName = `text-xs ${eyebrowTypographyClassName} text-muted-foreground`

const surfaceBorderClassName = 'border-border/70'
const emphasizedSurfaceBorderClassName = 'border-border/90'
const mutedSurfaceBackgroundClassName = 'bg-muted/45'
const subtleInteractiveSurfaceBackgroundClassName = 'bg-muted/35'
const subtleInteractiveSurfaceHoverBackgroundClassName = 'hover:bg-muted/55'
const ghostInteractiveSurfaceHoverBackgroundClassName = 'hover:bg-muted/45'
const elevatedShadowClassName = 'shadow-2xl shadow-black/35'

const controlBaseClassName = `h-11 w-full min-w-0 rounded-xl border ${emphasizedSurfaceBorderClassName} bg-muted/55 px-3 py-2 text-sm outline-none transition-[color,border-color,background-color,box-shadow] focus-visible:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50`

export const formControlClassName = `flex ${controlBaseClassName}`
export const nativeSelectControlClassName = controlBaseClassName

const surfaceChromeClassName = `rounded-2xl border ${surfaceBorderClassName}`

export const subtleSurfaceBackgroundClassName = 'bg-card/55'
const groupedSurfaceBackgroundClassName = 'bg-card/65'
export const mutedSurfaceClassName = `${surfaceBorderClassName} ${mutedSurfaceBackgroundClassName}`

export const panelSurfaceClassName = `${surfaceChromeClassName} ${subtleSurfaceBackgroundClassName}`

export const listSurfaceClassName = `overflow-hidden ${surfaceChromeClassName} ${groupedSurfaceBackgroundClassName}`

export const popoverSurfaceClassName = `rounded-2xl border ${emphasizedSurfaceBorderClassName} bg-popover/95 text-popover-foreground ${elevatedShadowClassName} backdrop-blur-xl`

export const sheetSurfaceClassName = `bg-background/95 ${elevatedShadowClassName} backdrop-blur-xl`

export const interactiveOutlineSurfaceClassName = `border ${emphasizedSurfaceBorderClassName} ${subtleInteractiveSurfaceBackgroundClassName} ${subtleInteractiveSurfaceHoverBackgroundClassName}`

export const interactiveGhostSurfaceClassName = `${ghostInteractiveSurfaceHoverBackgroundClassName} hover:text-foreground`

export const interactiveActiveSurfaceClassName =
  'data-[state=active]:border-border data-[state=active]:bg-card/95 data-[state=active]:text-foreground'

export const subtleHoverSurfaceClassName =
  'transition-colors hover:bg-white/[0.03]'

export const subtleDividerClassName = surfaceBorderClassName

export const statusToneClassNames = {
  destructive: {
    accent: 'text-rose-300',
    surface: 'border-red-400/20 bg-destructive/8',
  },
  success: {
    accent: 'text-emerald-300',
    surface: 'border-emerald-400/20 bg-emerald-500/[0.08]',
  },
  warning: {
    accent: 'text-amber-300',
    surface: 'border-amber-400/20 bg-amber-500/[0.08]',
  },
} as const
