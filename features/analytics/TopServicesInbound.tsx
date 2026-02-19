import { env } from "@/env";
import Pagination from "@/features/table/components/Pagination";
import SearchField from "@/features/table/components/SearchField";
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderItem,
  TableRow,
  TableBodyItem,
} from "@/features/table/components/Table";
import fetchTableData from "@/features/table/lib/fetchTableData";
import sortTableData from "@/features/table/lib/sortTableData";
import { SortDirection } from "@/features/table/types/table.type";
import {
  DEFAULT_ITEMS_PER_PAGE,
  DEFAULT_PAGE,
} from "@/features/table/utils/constant";
import { getAccessToken } from "@/lib/getServerAuth";

// -------------------- API response types --------------------
type ServiceApiRow = {
  serviceName: string;
  voiceName: string;
  phoneNumber: string;
  totalCalls: number;
  completedCalls: number;
  conversations: number;
  totalBookings: number;
  callType: string;
};

type ApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filters?: Record<string, unknown>;
};

type ServiceApiResponse = {
  success: boolean;
  message: string;
  data: {
    meta: ApiMeta;
    data: ServiceApiRow[];
  };
};

// -------------------- Table row type --------------------
type ServiceRow = {
  serviceName: string;
  phoneNumber: string;
  totalCalls: number;
  totalBookings: number;
  conversations: number;
  callType: string;
};

type TableHeader = {
  key: keyof ServiceRow;
  label: string;
};

type SearchParams = {
  page?: string;
  limit?: string;
  sort?: string;
  q?: string;
};

type ServiceTableProps = {
  searchParams: SearchParams;
};

// -------------------- Helper Functions --------------------
function parseSearchParams(params: SearchParams): {
  page: number;
  limit: number;
  sortField: string;
  sortDirection: SortDirection;
  q?: string;
} {
  const page = Number(params.page) || DEFAULT_PAGE;
  const limit = Number(params.limit) || DEFAULT_ITEMS_PER_PAGE;
  const [sortField = "", sortDirection = ""] = (params.sort || "").split(":");

  return {
    page,
    limit,
    sortField,
    sortDirection: (sortDirection as SortDirection) || "asc",
    q: params.q,
  };
}

function normalizeServiceData(rows: ServiceApiRow[]): ServiceRow[] {
  return rows.map((row) => ({
    serviceName: row.serviceName || "N/A",
    phoneNumber: row.phoneNumber?.trim() || "N/A",
    totalCalls: row.totalCalls ?? 0,
    totalBookings: row.totalBookings ?? 0,
    conversations: row.conversations ?? 0,
    callType: row.callType || "N/A",
  }));
}

// -------------------- Component --------------------
export default async function TopServicesTableInbound({
  searchParams,
}: ServiceTableProps) {
  const token = await getAccessToken();
  const queryParams = await searchParams;

  const { page, limit, sortField, sortDirection, q } =
    parseSearchParams(queryParams);

  let apiResponse: ServiceApiResponse | null = null;

  try {
    const response = await fetchTableData<ServiceApiResponse>(
      `${
        env.API_BASE_URL
      }/analytics/services?callType=incoming&page=${page}&limit=${limit}${
        q ? `&q=${encodeURIComponent(q)}` : ""
      }`,
      {
        headers: { Authorization: token || "" },
      },
    );

    apiResponse = Array.isArray(response) ? response[0] : response;
  } catch (error) {
    console.error("Failed to fetch service data", error);
    return <div className="text-red-500">Failed to load service data</div>;
  }

  if (!apiResponse?.data?.data) {
    return <div className="text-gray-500">No data available</div>;
  }

  const tableDataRaw: ServiceApiRow[] = apiResponse.data.data;
  const meta: ApiMeta = apiResponse.data.meta;

  // Normalize
  const normalizedData: ServiceRow[] = normalizeServiceData(tableDataRaw);

  // Headers (you can rename freely)
  const tableHeader: readonly TableHeader[] = [
    { key: "serviceName", label: "Trending Service" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "totalBookings", label: "Top Booking" },
    { key: "conversations", label: "Appeared in Search" },
    { key: "totalCalls", label: "Total Calls" },
    { key: "callType", label: "Type" },
  ] as const;

  // Apply sorting
  const sorted: ServiceRow[] = sortTableData(
    normalizedData,
    sortField as keyof ServiceRow,
    sortDirection,
  );

  const totalPages: number = meta.totalPages;

  return (
    <div className="space-y-6">
      <div className="overflow-auto max-h-[calc(100vh-300px)] border border-gray-500/30 rounded-lg w-full">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="whitespace-nowrap">
              {tableHeader.map(({ key, label }) => (
                <TableHeaderItem
                  key={key}
                  prop={key}
                  currentSort={sortField}
                  sortDirection={sortDirection}
                />
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {sorted.map((item, idx) => (
              <TableRow key={idx}>
                {tableHeader.map(({ key }) => (
                  <TableBodyItem key={key}>{item[key] ?? "N/A"}</TableBodyItem>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination totalPages={totalPages} currentPage={page} pageSize={limit} />
    </div>
  );
}
