"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface DonutChartProps {
  value: number
  total: number
}

export function DonutChart({ value, total }: DonutChartProps) {
  const data = [
    { name: "Completed", value: value },
    { name: "Remaining", value: total - value },
  ]

  const COLORS = ["hsl(var(--secondary))", "hsl(var(--muted))"]

  return (
    <div className="relative h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{value}</div>
        </div>
      </div>
    </div>
  )
}
