import { TextField } from '@/components/shared/Field'

type Props = {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

export function ReportPeriodFields({ from, to, onFromChange, onToChange }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="Dari tanggal" type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
      <TextField label="Sampai tanggal" type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
    </div>
  )
}
