import { BackLink } from '@/components/shared/BackLink'
import { PageHeader } from '@/components/shared/PageHeader'

type ReportPageIntroProps = {
  title: string
  description: string
}

/** Judul laporan detail + navigasi kembali ke hub (semua viewport). */
export function ReportPageIntro({ title, description }: ReportPageIntroProps) {
  return (
    <div className="space-y-2">
      <BackLink to="/finance/reports" label="Semua laporan" shortLabel="Laporan" />
      <PageHeader title={title} description={description} />
    </div>
  )
}
