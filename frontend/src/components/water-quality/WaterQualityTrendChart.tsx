type TrendPoint = {
  measuredAt: string
  ammoniaPpm?: number
  ph?: number
}

type Props = {
  points: TrendPoint[]
  metric: 'ammonia' | 'ph'
  height?: number
}

function valueFor(point: TrendPoint, metric: 'ammonia' | 'ph') {
  return metric === 'ammonia' ? point.ammoniaPpm : point.ph
}

export function WaterQualityTrendChart({ points, metric, height = 160 }: Props) {
  const sorted = [...points]
    .filter((point) => valueFor(point, metric) != null)
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())

  if (sorted.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed bg-muted/30 text-sm text-muted-foreground">
        Belum ada data untuk grafik {metric === 'ammonia' ? 'ammonia' : 'pH'}.
      </div>
    )
  }

  const values = sorted.map((point) => valueFor(point, metric) as number)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 320
  const padding = 12

  const coords = sorted.map((point, index) => {
    const x = padding + (index / Math.max(sorted.length - 1, 1)) * (width - padding * 2)
    const normalized = (valueFor(point, metric)! - min) / range
    const y = height - padding - normalized * (height - padding * 2)
    return { x, y, point }
  })

  const polyline = coords.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full min-w-[280px]" role="img" aria-label={`Grafik tren ${metric}`}>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          points={polyline}
        />
        {coords.map(({ x, y, point }) => (
          <circle key={point.measuredAt + String(valueFor(point, metric))} cx={x} cy={y} r="3" className="fill-primary" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>
          Min {min.toFixed(metric === 'ammonia' ? 3 : 2)} · Max {max.toFixed(metric === 'ammonia' ? 3 : 2)}
        </span>
        <span>{sorted.length} titik</span>
      </div>
    </div>
  )
}
