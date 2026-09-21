import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Fish,
  Plus,
  RefreshCw,
  Waves,
} from 'lucide-react'

import { fetchHealth } from '@/api/health'
import { getDashboardSummary, type WaterQualitySummary } from '@/api/water-quality'
import { PondStatusCard } from '@/components/dashboard/PondStatusCard'
import { StatCard } from '@/components/dashboard/StatCard'
import { MobileSectionHeader } from '@/components/mobile/MobileSectionHeader'
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
  }).format(now)

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-background p-4 shadow-sm md:rounded-3xl md:p-8">
        <div className="relative z-10 flex flex-col gap-4 md:grid md:grid-cols-[1.2fr_0.8fr] md:items-center md:gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-primary">{dateLabel}</p>
              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="touch-target inline-flex size-9 items-center justify-center rounded-xl border bg-background/80 text-muted-foreground md:hidden"
                aria-label="Refresh dashboard"
              >
                <RefreshCw className={refreshing ? 'size-4 animate-spin' : 'size-4'} />
              </button>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-4xl">{greeting}</h2>
            <p className="hidden max-w-xl text-sm text-muted-foreground sm:block md:text-base">
              Pantau ammonia, pH, dan catatan observasi kolam lele setiap hari.
            </p>

            <div className="hidden flex-wrap gap-3 md:flex">
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

          <div className="hidden justify-end md:flex">
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

      <section className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Kolam aktif" value={stats.total} icon={Fish} />
            <StatCard
              label="Sudah diukur hari ini"
              value={stats.measuredToday}
              hint={`dari ${stats.total} kolam`}
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
        <Link
          to="/water-quality/new"
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-4 text-sm text-amber-900 transition active:scale-[0.99] dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">{stats.pendingToday} kolam belum dicatat</p>
              <p className="mt-1 text-xs opacity-80">Ketuk untuk catat kualitas air sekarang</p>
            </div>
          </div>
          <ChevronRight className="size-5 shrink-0 opacity-60" />
        </Link>
      )}

      <section className="space-y-4">
        <MobileSectionHeader
          title="Status Kolam"
          description="Nilai terakhir dan indikator kesehatan air"
          action={
            <Button asChild variant="ghost" size="sm" className="hidden shrink-0 sm:inline-flex">
              <Link to="/water-quality">Semua catatan</Link>
            </Button>
          }
        />

        {loading ? (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl md:h-64" />
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
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
              <Button asChild className="w-full sm:w-auto">
                <Link to="/ponds">Kelola Kolam</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link to="/water-quality/new">Catat Kualitas Air</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {summaries.map((summary) => (
              <PondStatusCard key={summary.businessUnitId} summary={summary} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
