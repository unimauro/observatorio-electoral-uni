import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export const ROLE_COLOR = ['var(--role-1)', 'var(--role-2)', 'var(--role-3)']

export interface Series {
  key: string
  label: string
  color: string
}

const axis = { fontSize: 11, fill: 'currentColor' }

/** Barras horizontales (una o varias series apiladas). Tooltip y leyenda siempre presentes. */
export function HBar({
  data,
  series,
  height,
  yWidth = 70,
}: {
  data: Record<string, string | number>[]
  series: Series[]
  height?: number
  yWidth?: number
}) {
  const h = height ?? Math.max(160, data.length * 34 + 60)
  return (
    <div className="text-muted" style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis type="number" allowDecimals={false} tick={axis} stroke="var(--chart-grid)" />
          <YAxis type="category" dataKey="name" width={yWidth} tick={axis} stroke="var(--chart-grid)" interval={0} />
          <Tooltip
            cursor={{ fill: 'rgb(var(--line) / 0.4)' }}
            contentStyle={{ background: 'rgb(var(--card))', border: '1px solid rgb(var(--ink))', borderRadius: 4, fontSize: 12, color: 'rgb(var(--ink))' }}
            labelStyle={{ fontWeight: 600, color: 'rgb(var(--ink))' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: 'rgb(var(--ink))' }} iconType="square" />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="a"
              fill={s.color}
              stroke="rgb(var(--card))"
              strokeWidth={2}
              radius={i === series.length - 1 ? [0, 4, 4, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Tabla equivalente al gráfico, para lectores de pantalla y verificación. */
export function DataTable({ data, series, caption }: { data: Record<string, string | number>[]; series: Series[]; caption: string }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-muted hover:text-ink">Ver como tabla</summary>
      <table className="mt-2 w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-left">
            <th className="py-1 pr-2 font-semibold">Categoría</th>
            {series.map((s) => (
              <th key={s.key} className="py-1 pr-2 text-right font-semibold">{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={String(d.name)} className="border-b border-line/60">
              <td className="py-1 pr-2">{d.name}</td>
              {series.map((s) => (
                <td key={s.key} className="py-1 pr-2 text-right font-mono">{d[s.key] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
