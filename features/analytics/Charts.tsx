"use client";
import React from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { date: "2000-01", uv: 4000, pv: 2400, amt: 2400 },
  { date: "2000-02", uv: 3000, pv: 1398, amt: 2210 },
  { date: "2000-03", uv: 2000, pv: 9800, amt: 2290 },
  { date: "2000-04", uv: 2780, pv: 3908, amt: 2000 },
  { date: "2000-05", uv: 1890, pv: 4800, amt: 2181 },
  { date: "2000-06", uv: 2390, pv: 3800, amt: 2500 },
  { date: "2000-07", uv: 3490, pv: 4300, amt: 2100 },
  { date: "2000-08", uv: 4000, pv: 2400, amt: 2400 },
  { date: "2000-09", uv: 3000, pv: 1398, amt: 2210 },
  { date: "2000-10", uv: 2000, pv: 9800, amt: 2290 },
  { date: "2000-11", uv: 2780, pv: 3908, amt: 2000 },
  { date: "2000-12", uv: 1890, pv: 4800, amt: 2181 },
];

const monthTickFormatter = (tick: string) => {
  const date = new Date(tick);
  return (date.getMonth() + 1).toString();
};

type TickProps = {
  x: number;
  y: number;
  payload: {
    value: string;
    offset: number;
  };
  width: number;
  visibleTicksCount: number;
};

const renderQuarterTick = (tickProps: TickProps) => {
  const { x, y, payload, width, visibleTicksCount } = tickProps;
  const { value, offset } = payload;
  const date = new Date(value);
  const month = date.getMonth();
  const quarterNo = Math.floor(month / 3) + 1;

  if (month % 3 === 1) {
    return (
      <text
        x={x + width / visibleTicksCount / 2 - offset}
        y={y - 4}
        textAnchor="middle"
        fill="#666"
        fontSize="12"
      >
        {`Q${quarterNo}`}
      </text>
    );
  }

  return <g />;
};

type TooltipEntry = {
  color: string;
  dataKey: string;
  value: number;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const date = new Date(label ?? "");
    const monthName = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{monthName}</p>
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 capitalize">
              {entry.dataKey === "pv"
                ? "Page Views"
                : entry.dataKey === "uv"
                  ? "Unique Visitors"
                  : entry.dataKey}
              :
            </span>
            <span className="text-sm font-medium text-gray-800">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default function AnalyticsChart() {
  return (
    <div style={{ width: "100%", height: "400px" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          {/* <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /> */}
          <XAxis
            dataKey="date"
            tickFormatter={monthTickFormatter}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#666" }}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={renderQuarterTick as any}
            height={1}
            scale="band"
            xAxisId="quarter"
          />
          {/* <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#f89121" }}
          /> */}
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="pv"
            fill="#f59121"
            radius={[4, 4, 0, 0]}
            name="Page Views"
          />
          <Bar
            dataKey="uv"
            fill="#f59121"
            radius={[4, 4, 0, 0]}
            name="Unique Visitors"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
