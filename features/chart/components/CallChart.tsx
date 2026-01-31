"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Type definitions
type MonthName =
  | "Jan"
  | "Feb"
  | "Mar"
  | "Apr"
  | "May"
  | "Jun"
  | "Jul"
  | "Aug"
  | "Sep"
  | "Oct"
  | "Nov"
  | "Dec";

export interface RawMonthData {
  month: MonthName;
  bookings: number;
  topServices: string[];
}

interface TransformedMonthData {
  month: MonthName;
  service: string | null;
  bookings: number;
  displayValue: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: TransformedMonthData;
  }>;
}

interface CustomLabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
  payload?: TransformedMonthData;
  index?: number;
}

interface BookingTrendChartProps {
  data?: RawMonthData[];
}

// Transform data to show each service as a separate bar
const transformData = (data: RawMonthData[]): TransformedMonthData[] => {
  const transformed: TransformedMonthData[] = [];

  data.forEach((monthData) => {
    if (monthData.topServices.length === 0) {
      // If no services, show a placeholder bar
      transformed.push({
        month: monthData.month,
        service: null,
        bookings: 0,
        displayValue: 0,
      });
    } else {
      // Calculate bookings per service (assuming equal distribution)
      const bookingsPerService = Math.ceil(
        monthData.bookings / monthData.topServices.length
      );

      monthData.topServices.slice(0, 4).forEach((service) => {
        transformed.push({
          month: monthData.month,
          service: service,
          bookings: bookingsPerService,
          displayValue: bookingsPerService,
        });
      });
    }
  });

  return transformed;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-orange-500 font-semibold text-sm">{data.month}</p>
        {data.service ? (
          <>
            <p className="text-white text-sm">{data.service}</p>
            <p className="text-gray-300 text-xs">Bookings: {data.bookings}</p>
          </>
        ) : (
          <p className="text-gray-400 text-xs">No bookings</p>
        )}
      </div>
    );
  }
  return null;
};

const CustomLabel: React.FC<CustomLabelProps> = ({
  x,
  y,
  width,
  value,
  payload,
}) => {
  if (
    !payload ||
    !value ||
    value === 0 ||
    x === undefined ||
    y === undefined ||
    width === undefined
  ) {
    return null;
  }

  return (
    <g>
      {payload.service && (
        <text
          x={x + width / 2}
          y={y - 20}
          fill="#9ca3af"
          textAnchor="middle"
          fontSize="9"
        >
          {payload.service}
        </text>
      )}
      <text
        x={x + width / 2}
        y={y - 6}
        fill="#fff"
        textAnchor="middle"
        fontSize="10"
        fontWeight="500"
      >
        {value}
      </text>
    </g>
  );
};

// Default data for fallback
const defaultData: RawMonthData[] = [
  { month: "Jan", bookings: 0, topServices: [] },
  { month: "Feb", bookings: 0, topServices: [] },
  { month: "Mar", bookings: 0, topServices: [] },
  { month: "Apr", bookings: 0, topServices: [] },
  { month: "May", bookings: 0, topServices: [] },
  { month: "Jun", bookings: 0, topServices: [] },
  { month: "Jul", bookings: 0, topServices: [] },
  { month: "Aug", bookings: 0, topServices: [] },
  { month: "Sep", bookings: 0, topServices: [] },
  { month: "Oct", bookings: 0, topServices: [] },
  { month: "Nov", bookings: 0, topServices: [] },
  { month: "Dec", bookings: 0, topServices: [] },
];

export default function BookingTrendChart({
  data = defaultData,
}: BookingTrendChartProps) {
  const transformedData: TransformedMonthData[] = transformData(data);

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8 rounded-xl">
      <h2 className="text-3xl font-bold text-white mb-8">
        Booking Trend Chart
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={transformedData}
          margin={{ top: 40, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="15%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="month"
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 14 }}
            axisLine={{ stroke: "#4b5563" }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "#4b5563" }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
          />
          <Bar
            dataKey="displayValue"
            fill="#f97316"
            radius={[6, 6, 0, 0]}
            maxBarSize={60}
            label={(props: any) => <CustomLabel {...props} />}
          >
            {transformedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.bookings > 0 ? "#f97316" : "#4b5563"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
