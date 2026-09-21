import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { listPonds, listWaterQualityLogs, type Pond, type WaterQualityLog } from '@/api/water-quality'
import { WaterQualityStatusBadge } from '@/components/water-quality/WaterQualityStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WaterQualityListPage() {
  const [ponds, setPonds] = useState<Pond[]>([])
  const [logs, setLogs] = useState<WaterQualityLog[]>([])
  const [businessUnitId, setBusinessUnitId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadLogs = () => {
    listWaterQualityLogs({ businessUnitId, from, to, limit: 100 })
      .then((response) => setLogs(response.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat catatan'))
  }

  useEffect(() => {
    listPonds('ACTIVE').then((response) => setPonds(response.data)).catch(() => undefined)
    loadLogs()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Kualitas Air</h2>
          <p className="text-sm text-muted-foreground">Pencatatan ammonia, pH, dan catatan observasi per kolam.</p>
        </div>
        <Button asChild>
          <Link to="/water-quality/new">
            <Plus className="size-4" />
            Tambah Catatan
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="filter-pond">Kolam</Label>
            <select
              id="filter-pond"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={businessUnitId}
              onChange={(e) => setBusinessUnitId(e.target.value)}
            >
              <option value="">Semua kolam</option>
              {ponds.map((pond) => (
                <option key={pond.id} value={pond.id}>
                  {pond.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-from">Dari</Label>
            <Input id="filter-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-to">Sampai</Label>
            <Input id="filter-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={loadLogs}>Terapkan</Button>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="space-y-3 pt-6">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada catatan.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{log.businessUnitName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.measuredAt))}
                  </p>
                  <p className="text-sm">
                    Ammonia {log.ammoniaPpm ?? '-'} ppm · pH {log.ph ?? '-'}
                  </p>
                  {log.notes && <p className="mt-1 text-sm text-muted-foreground">{log.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <WaterQualityStatusBadge status={log.status} />
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/water-quality/${log.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
