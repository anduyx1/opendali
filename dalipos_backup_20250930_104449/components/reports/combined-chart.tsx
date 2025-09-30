"use client"

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface CombinedChartProps {
  data: Array<{
    date: string
    revenue: number
    profit: number
  }>
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
  }>
  label?: string
}

export function CombinedChart({ data }: CombinedChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value)
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-primary">{`Doanh thu: ${formatCurrency(payload[0].value)}`}</p>
          <p className="text-secondary">{`Lợi nhuận: ${formatCurrency(payload[1].value)}`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs" />
          <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Doanh thu" />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="hsl(var(--secondary))"
            strokeWidth={3}
            dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
            name="Lợi nhuận"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
