import type { ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
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
