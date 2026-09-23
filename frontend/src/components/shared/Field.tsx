import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

export function TextField({
  label,
  id,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <Field label={label} htmlFor={id}>
      <Input id={id} {...props} />
    </Field>
  )
}

export function SelectField({
  label,
  id,
  children,
  className,
  ...props
}: React.ComponentProps<typeof Select> & { label: string; children: ReactNode; className?: string }) {
  return (
    <Field label={label} htmlFor={id} className={className}>
      <Select id={id} {...props}>{children}</Select>
    </Field>
  )
}

export function TextareaField({
  label,
  id,
  ...props
}: React.ComponentProps<typeof Textarea> & { label: string }) {
  return (
    <Field label={label} htmlFor={id}>
      <Textarea id={id} {...props} />
    </Field>
  )
}
