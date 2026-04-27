import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const FIELD_BASE =
  'w-full bg-bg-elevated text-fg placeholder:text-fg-subtle border border-border rounded-lg ' +
  'transition-colors duration-150 ease-out-soft ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:border-accent ' +
  'disabled:bg-bg-subtle disabled:text-fg-subtle disabled:cursor-not-allowed'

interface FieldWrapProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  children: (id: string, hasError: boolean) => ReactNode
  /** 라벨 시각 표시 없이 aria-label 만 부여 */
  hideLabel?: boolean
}

function FieldWrap({ label, hint, error, required, hideLabel, children }: FieldWrapProps) {
  const id = useId()
  const hasError = Boolean(error)
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'block text-xs font-medium text-fg-muted',
            hideLabel && 'sr-only',
          )}
        >
          {label}
          {required && <span className="text-critical-fg ml-0.5">*</span>}
        </label>
      )}
      {children(id, hasError)}
      {hasError ? (
        <p className="text-xs text-critical-fg" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  hideLabel?: boolean
  leading?: ReactNode
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, hideLabel, leading, trailing, className, required, ...rest },
  ref,
) {
  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
    >
      {(id, hasError) => (
        <div className="relative">
          {leading && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none">
              {leading}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? `${id}-error` : undefined}
            required={required}
            className={cn(
              FIELD_BASE,
              'h-10 px-3 text-sm',
              leading && 'pl-9',
              trailing && 'pr-9',
              hasError && 'border-critical-fg focus-visible:outline-critical-fg',
              className,
            )}
            {...rest}
          />
          {trailing && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle">
              {trailing}
            </span>
          )}
        </div>
      )}
    </FieldWrap>
  )
})

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  hideLabel?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, hideLabel, className, required, rows = 3, ...rest },
  ref,
) {
  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
    >
      {(id, hasError) => (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={hasError || undefined}
          required={required}
          className={cn(
            FIELD_BASE,
            'px-3 py-2 text-sm leading-relaxed resize-y',
            hasError && 'border-critical-fg focus-visible:outline-critical-fg',
            className,
          )}
          {...rest}
        />
      )}
    </FieldWrap>
  )
})

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  hideLabel?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, hideLabel, className, required, children, ...rest },
  ref,
) {
  return (
    <FieldWrap
      label={label}
      hint={hint}
      error={error}
      required={required}
      hideLabel={hideLabel}
    >
      {(id, hasError) => (
        <select
          ref={ref}
          id={id}
          aria-invalid={hasError || undefined}
          required={required}
          className={cn(
            FIELD_BASE,
            'h-10 px-3 text-sm appearance-none bg-no-repeat bg-right pr-9',
            hasError && 'border-critical-fg focus-visible:outline-critical-fg',
            className,
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
            backgroundPosition: 'right 0.75rem center',
            backgroundSize: '0.75rem',
          }}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldWrap>
  )
})
