// Kreisdiagramm (Donut) mit Legende und Gesamtwert in der Mitte.
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Dot, Empty } from './ui';

export interface DonutSlice {
  id: string;
  name: string;
  color: string;
  value: number;
}

export function Donut({ data, format, center, emptyText = 'Noch keine Daten.' }: {
  data: DonutSlice[];
  format: (v: number) => string;
  center?: string;
  emptyText?: string;
}) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0);
  if (!total) return <Empty>{emptyText}</Empty>;
  const chartData = slices.map((d) => ({ ...d, fill: d.color }));
  return (
    <div>
      <div className="chart donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="95%" stroke="var(--surface)"
              strokeWidth={2} isAnimationActive={false} />
            <Tooltip formatter={(v) => format(Number(v))}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}
              itemStyle={{ color: 'var(--text)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">{center ?? format(total)}</div>
      </div>
      <ul className="legend">
        {slices.map((d) => (
          <li key={d.id}>
            <Dot color={d.color} />
            <span className="grow">{d.name}</span>
            <span className="val">{format(d.value)} · {Math.round((d.value / total) * 100)} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
