import { getIcon, dashboardStats } from "@/data/analyticsData";
import { env } from "@/env";
import AnalyticsChart from "@/features/analytics/Charts";
import TopServicesTableInbound from "@/features/analytics/TopServicesInbound";
import BookingTrendChart from "@/features/chart/components/CallChart";
import Stats from "@/features/chart/components/Stats";
import { getAccessToken } from "@/lib/getServerAuth";
import { safeAsync } from "@/lib/safeAsync";
import { cn } from "@/lib/utils";

// Main analytics data object
export interface AnalyticsData {
  analytics: {
    calls: {
      total: number;
      success: number;
      drop: number;
      waiting: number;
      successRate: number; // percentage
      callType: "incoming" | "outgoing"; // restrict to known values
    };
    appointments: {
      total: number;
      confirmed: number;
      upcoming: number;
      confirmationRate: number; // percentage
    };
    averageAppointmentTime: number; // in ms
  };
  monthlyTrends: MonthlyTrend[];
  chartConfig: {
    yAxis: {
      min: number;
      max: number;
      stepSize: number;
    };
  };
  filters: {
    timeRange: "all" | "day" | "week" | "month" | "year";
    callType: "incoming" | "outgoing";
  };
}

// Monthly trends (chart + services)
export interface MonthlyTrend {
  month:
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
  bookings: number;
  topServices: string[];
}

// Root API response - matches your actual API structure
export interface AnalyticsApiResponse {
  success: boolean;
  message: string;
  data: AnalyticsData;
}

// SafeAsync wrapper response
export interface SafeAsyncResponse {
  data: AnalyticsApiResponse | null;
  error: unknown | null;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page: string;
    limit: string;
    sort: string;
    q: string;
  }>;
}) {
  const queryParams = await searchParams;
  const token = await getAccessToken();
  const result = await safeAsync(async (): Promise<AnalyticsApiResponse> => {
    const response = await fetch(
      `${env.API_BASE_URL}/analytics?callType=incoming`,
      {
        headers: { Authorization: token || "" },
      }
    );
    if (!response.ok) return Promise.reject("Failed request");
    const data = await response.json();
    return data as AnalyticsApiResponse;
  });

  const data = (result.data?.success && result.data.data) as AnalyticsData;

  return (
    <>
      <Stats data={data.analytics} />
      <div className="mt-14">
        <BookingTrendChart data={data.monthlyTrends} />
      </div>
      <TopServicesTableInbound searchParams={queryParams} />
    </>
  );
}
