import type * as React from 'react'
import { cloneElement, useId } from 'react'

import { cn } from '@/lib/utils'

import { Label } from './label'

type FormFieldChildProps = {
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  id?: string
}

type FormFieldProps = {
  className?: string
  description?: React.ReactNode
  descriptionClassName?: string
  error?: React.ReactNode
  errorClassName?: string
  htmlFor?: string
  label: React.ReactNode
} & (
  | {
      children: React.ReactElement<FormFieldChildProps>
      control?: never
    }
  | {
      children?: never
      control: (props: FormFieldChildProps) => React.ReactNode
    }
)

function FormField({
  children,
  className,
  control,
  description,
  descriptionClassName,
  error,
  errorClassName,
  htmlFor,
  label,
}: FormFieldProps) {
  const generatedId = useId()
  const child = getFormFieldChild(children)
  const controlId = child?.props.id ?? htmlFor ?? `field-${generatedId}`
  const descriptionId =
    description !== undefined ? `${controlId}-description` : undefined
  const errorId = error !== undefined ? `${controlId}-error` : undefined
  const describedBy = joinAriaIds(
    child?.props['aria-describedby'],
    descriptionId,
    errorId,
  )
  const controlProps: Partial<FormFieldChildProps> = {
    id: child?.props.id ?? controlId,
  }

  if (describedBy !== undefined) {
    controlProps['aria-describedby'] = describedBy
  }

  if (error !== undefined) {
    controlProps['aria-invalid'] = true
  } else if (child?.props['aria-invalid'] !== undefined) {
    controlProps['aria-invalid'] = child.props['aria-invalid']
  }

  const renderedControl =
    control !== undefined
      ? control(controlProps)
      : cloneElement(children, controlProps)

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={controlId}>{label}</Label>
      {renderedControl}
      {description !== undefined ? (
        <p
          id={descriptionId}
          className={cn('text-sm text-muted-foreground', descriptionClassName)}
        >
          {description}
        </p>
      ) : null}
      {error !== undefined ? (
        <p
          id={errorId}
          role="alert"
          className={cn('text-sm text-destructive', errorClassName)}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

function getFormFieldChild(
  child: FormFieldProps['children'],
): React.ReactElement<FormFieldChildProps> | undefined {
  return child
}

function joinAriaIds(...ids: Array<string | undefined>) {
  const joinedIds = [...new Set(ids.filter((id) => id !== undefined))]

  return joinedIds.length > 0 ? joinedIds.join(' ') : undefined
}

export { FormField }
