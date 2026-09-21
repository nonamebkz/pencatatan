import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Fish,
  Plus,
  RefreshCw,
  Waves,
} from 'lucide-react'

import { fetchHealth } from '@/api/health'
import { getDashboardSummary, type WaterQualitySummary } from '@/api/water-quality'
import { PondStatusCard } from '@/components/dashboard/PondStatusCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import heroImage from '@/assets/hero.png'

function greetingForHour(hour: number) {
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function DashboardPage() {
  const [summaries, setSummaries] = useState<WaterQualitySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [systemOk, setSystemOk] = useState<boolean | null>(null)

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [dashboardResponse, healthResponse] = await Promise.all([
        getDashboardSummary(),
        fetchHealth().catch(() => null),
      ])

      setSummaries(dashboardResponse.data.waterQualitySummary ?? [])
      setSystemOk(healthResponse?.success ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const stats = useMemo(() => {
    const total = summaries.length
    const pendingToday = summaries.filter((item) => item.notMeasuredToday).length
    const warnings = summaries.filter((item) => item.status !== 'NORMAL').length
    const measuredToday = total - pendingToday

    return { total, pendingToday, warnings, measuredToday }
  }, [summaries])

  const now = new Date()
  const greeting = greetingForHour(now.getHours())
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/30 p-6 shadow-sm md:p-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm font-medium text-primary">{dateLabel}</p>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{greeting}</h2>
              <p className="max-w-xl text-muted-foreground">
                Pantau kualitas air kolam lele harian — ammonia, pH, dan catatan observasi dalam satu dashboard.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/water-quality/new">
                  <Plus className="size-4" />
                  Catat Sekarang
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={() => void loadDashboard(true)} disabled={refreshing}>
                <RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} />
                Refresh
              </Button>
            </div>

            {systemOk !== null && (
              <p className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                <span className={systemOk ? 'size-2 rounded-full bg-emerald-500' : 'size-2 rounded-full bg-red-500'} />
                Sistem {systemOk ? 'online' : 'degraded'}
              </p>
            )}
          </div>

          <div className="hidden justify-end lg:flex">
            <img
              src={heroImage}
              alt="Ilustrasi budidaya lele"
              className="h-48 w-auto rounded-2xl object-cover shadow-lg ring-1 ring-border/60"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Kolam aktif" value={stats.total} icon={Fish} />
            <StatCard
              label="Sudah diukur hari ini"
              value={stats.measuredToday}
              hint={` dari ${stats.total} kolam`}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              label="Belum diukur hari ini"
              value={stats.pendingToday}
              icon={AlertTriangle}
              tone={stats.pendingToday > 0 ? 'warning' : 'default'}
            />
            <StatCard
              label="Perlu perhatian"
              value={stats.warnings}
              hint="Waspada / bahaya"
              icon={Waves}
              tone={stats.warnings > 0 ? 'danger' : 'default'}
            />
          </>
        )}
      </section>

      {!loading && stats.pendingToday > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          Ada {stats.pendingToday} kolam yang belum dicatat hari ini. Prioritaskan pengukuran pagi atau sore.
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">Status Kolam</h3>
            <p className="text-sm text-muted-foreground">Nilai terakhir dan indikator kesehatan air.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/water-quality">Semua catatan</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : summaries.length === 0 && !error ? (
          <Card className="rounded-2xl border-dashed">
            <CardHeader>
              <CardTitle>Belum ada kolam aktif</CardTitle>
              <CardDescription>
                Tambah kolam terlebih dulu, lalu mulai catat ammonia, pH, dan observasi harian.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/ponds">Kelola Kolam</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/water-quality/new">Catat Kualitas Air</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {summaries.map((summary) => (
              <PondStatusCard key={summary.businessUnitId} summary={summary} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
