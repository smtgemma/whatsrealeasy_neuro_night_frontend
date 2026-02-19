import Button from "@/components/Button";
import { DownloadExcelButton } from "@/components/DownloadExcel";
import { env } from "@/env";
import { CallTranscript } from "@/features/table/components/CallTranscriptViewer";
import { TableFilter } from "@/features/table/components/Filter";
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
import Link from "next/link";

// -------------------- API response types --------------------
type Service = {
  serviceName: string;
};

type CallType = "outgoing" | "inbound";
type CallStatus = "completed" | "initiated" | "failed" | "busy" | "no-answer";

type CallLogApiRow = {
  id: string;
  call_sid: string;
  agent_id: string;
  call_recording: string | null;
  from_number: string;
  to_number: string;
  callType: CallType;
  call_status: CallStatus;
  call_time: string;
  call_transcript: string | null;
  name: string | null;
  contact_number: string | null;
  company: string | null;
  area: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  service: Service;
  email: string | null;
  bookings: null | {
    meetLink: string;
    startTime?: string;
    endTime?: string;
    calendarLink?: string;
  };
  call_duration: number | null;
};

type ApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type CallLogsApiResponse = {
  success: boolean;
  message: string;
  data: {
    meta: ApiMeta;
    data: CallLogApiRow[];
  };
};

// -------------------- Table row type --------------------
type CallLogRow = {
  id: string;
  from_number: string;
  to_number: string;
  callType: CallType;
  call_status: CallStatus;
  call_time: string;
  company: string | null;
  serviceName: string | null;
  area: string | null;
  email: string | null;
  call_duration: number | null;
  call_transcript: string | null;
  meetLink: string | null;
  bookingStartTime: string | null;
  bookingEndTime: string | null;
};

type TableHeader = {
  key: keyof CallLogRow;
  label: string;
};

type SearchParams = {
  page?: string;
  limit?: string;
  sort?: string;
  q?: string;
  call_status?: string; // ✅ ADDED
};

type OutboundCallLogsProps = {
  searchParams: Promise<SearchParams>;
};

// -------------------- Helper Functions --------------------
function parseSearchParams(params: SearchParams): {
  page: number;
  limit: number;
  sortField: string;
  sortDirection: SortDirection;
  q?: string;
  filter?: string;
} {
  const page = Number(params.page) || DEFAULT_PAGE;
  const limit = Number(params.limit) || DEFAULT_ITEMS_PER_PAGE;
  const [sortField = "", sortDirection = ""] = (params.sort || "").split(":");

  return {
    page,
    limit,
    sortField,
    sortDirection: sortDirection as SortDirection,
    q: params.q, // ✅ FIXED: Now extracting from params
    filter: params.call_status, // ✅ FIXED: Now extracting from params
  };
}

function normalizeCallLogData(rows: CallLogApiRow[]): CallLogRow[] {
  return rows.map((row) => ({
    id: row.id,
    from_number: row.from_number,
    to_number: row.to_number,
    callType: row.callType,
    call_status: row.call_status,
    call_time: new Date(row.call_time).toLocaleString(),
    company: row.company,
    area: row.area,
    serviceName: row.service.serviceName,
    email: row?.email || null,
    call_duration: row.call_duration,
    call_transcript: row.call_transcript,
    meetLink: row.bookings?.meetLink || null,
    bookingStartTime: row.bookings?.startTime
      ? new Date(row.bookings.startTime).toLocaleString()
      : null,
    bookingEndTime: row.bookings?.endTime
      ? new Date(row.bookings.endTime).toLocaleString()
      : null,
  }));
}

// -------------------- Component --------------------
export default async function OutboundCallLogs({
  searchParams,
}: OutboundCallLogsProps) {
  const token = await getAccessToken();
  const queryParams = await searchParams;

  const { page, limit, sortField, sortDirection, q, filter } =
    parseSearchParams(queryParams);

  // Fetch typed data
  const response = await fetchTableData<CallLogsApiResponse>(
    `${
      env.API_BASE_URL
    }/call-logs?callType=outgoing&page=${page}&limit=${limit}${
      q ? `&searchTerm=${q}` : ""
    }${filter ? `&call_status=${filter}` : ""}`,
    {
      headers: { Authorization: token || "" },
      cache: "no-store",
    },
  );

  // Handle array response from fetchTableData
  const apiResponse = Array.isArray(response) ? response[0] : response;

  const tableData: CallLogApiRow[] = apiResponse.data.data;
  const meta: ApiMeta = apiResponse.data.meta;

  const tableDataRaw: CallLogApiRow[] = tableData.map((item) => ({
    ...item,
    meetLink: item.bookings ? item.bookings.meetLink : null,
  }));

  // Normalize data
  const normalizedData: CallLogRow[] = normalizeCallLogData(tableDataRaw);

  // Table headers with explicit typing
  const tableHeader: readonly TableHeader[] = [
    { key: "from_number", label: "From" },
    { key: "to_number", label: "To" },
    { key: "callType", label: "Type" },
    { key: "call_status", label: "Status" },
    { key: "call_time", label: "Time" },
    { key: "company", label: "Company" },
    { key: "serviceName", label: "Service Name" },
    { key: "area", label: "Area" },
    { key: "email", label: "Email" },
    { key: "call_duration", label: "Duration" },
    { key: "call_transcript", label: "Transcript" },
    { key: "meetLink", label: "Meet Link" },
    { key: "bookingStartTime", label: "Booking Start" },
    { key: "bookingEndTime", label: "Booking End" },
  ] as const;

  // Apply sorting with type assertion
  const sorted: CallLogRow[] = sortTableData(
    normalizedData,
    sortField as keyof CallLogRow,
    sortDirection,
  );

  // Pagination values
  const totalPages: number = meta.totalPages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <SearchField
          placeholder="By service name and area"
          initialValue={queryParams.q}
        />
        <div className="flex gap-2 items-center">
          <DownloadExcelButton<CallLogRow>
            data={sorted}
            headers={tableHeader}
            fileName="CallLogs"
          />
          <TableFilter /> {/* ✅ Pass initial value */}
        </div>
      </div>
      <div className="overflow-auto max-h-[calc(100vh-280px)] border border-gray-500/30 rounded-lg w-full">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="whitespace-nowrap">
              {tableHeader.map(({ key }) => (
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
            {sorted.map((item: CallLogRow) => (
              <TableRow key={item.id}>
                {tableHeader.map(({ key }) => {
                  const value = item[key] ?? "N/A";

                  // Check if value is a valid URL
                  let content: React.ReactNode = value;
                  if (typeof value === "string" && value.startsWith("http")) {
                    new URL(value);
                    content = (
                      <Button size="sm" asChild>
                        <Link href={value}>Meet Link</Link>
                      </Button>
                    );
                  }

                  if (key === "call_transcript") {
                    content = <CallTranscript content={item.call_transcript} />;
                  }

                  return <TableBodyItem key={key}>{content}</TableBodyItem>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination totalPages={totalPages} currentPage={page} pageSize={limit} />
    </div>
  );
}
