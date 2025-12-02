import Button from "@/components/Button";
import { env } from "@/env";
import Pagination from "@/features/table/components/Pagination";
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
import { SquarePen } from "lucide-react";
import Link from "next/link";

// -------------------- API response types --------------------
type CallType = "outbound" | "inbound";

type ServiceDetails = {
  id: string;
  serviceName: string;
  voiceId: string;
  voiceName: string;
  phoneNumber: string;
  requires_verification: boolean;
  createdAt: string;
  updatedAt: string;
  phone_number_id: string | null;
};

type AgentApiRow = {
  id: string;
  agentId: string;
  callType: CallType;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
  service: ServiceDetails;
  first_message: string;
};

type ApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AgentsApiResponse = {
  success: boolean;
  message: string;
  data: {
    meta: ApiMeta;
    data: AgentApiRow[];
  };
};

// -------------------- Table row type --------------------
type AgentTableRow = {
  id: string;
  agentId: string;
  serviceName: string;
  callType: CallType;
  phoneNumber: string;
  voiceName: string;
  createdAt: string;
  first_message: string;
  serviceId: string;
};

type TableHeader = {
  key: keyof AgentTableRow;
  label: string;
};

type SearchParams = {
  page?: string;
  limit?: string;
  sort?: string;
  q?: string;
};

type InboundCallLogsProps = {
  searchParams: Promise<SearchParams>;
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
    sortDirection: sortDirection as SortDirection,
    q: params.q,
  };
}

function normalizeAgentData(rows: AgentApiRow[]): AgentTableRow[] {
  return rows.map((row) => ({
    id: row.id,
    agentId: row.agentId,
    serviceName: row.service.serviceName,
    callType: row.callType,
    phoneNumber: row.service.phoneNumber,
    voiceName: row.service.voiceName,
    createdAt: new Date(row.createdAt).toLocaleString(),
    first_message: row.first_message,
    serviceId: row.service.id,
  }));
}

// -------------------- Component --------------------
export default async function InboundCallLogs({
  searchParams,
}: InboundCallLogsProps) {
  const token = await getAccessToken();
  const queryParams = await searchParams;

  const { page, limit, sortField, sortDirection, q } =
    parseSearchParams(queryParams);

  // Build query string
  const queryString = new URLSearchParams({
    callType: "inbound",
    page: page.toString(),
    limit: limit.toString(),
    ...(q && { q }),
  }).toString();

  // Fetch typed data
  const response = await fetchTableData<AgentsApiResponse>(
    `${env.API_BASE_URL}/ai-agents?${queryString}`,
    {
      headers: { Authorization: token || "" },
    }
  );

  // Handle array response from fetchTableData
  const apiResponse = Array.isArray(response) ? response[0] : response;

  // Type guard for response validation

  const tableDataRaw: AgentApiRow[] = apiResponse.data.data;
  const meta: ApiMeta = apiResponse.data.meta;

  // Normalize data
  const normalizedData: AgentTableRow[] = normalizeAgentData(tableDataRaw);

  // Table headers with explicit typing
  const tableHeader: readonly TableHeader[] = [
    { key: "agentId", label: "Agent ID" },
    { key: "serviceName", label: "Service Name" },
    { key: "callType", label: "Call Type" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "voiceName", label: "Voice" },
    { key: "createdAt", label: "Created At" },
  ] as const;

  // Apply sorting with type assertion
  const sorted: AgentTableRow[] = sortTableData(
    normalizedData,
    sortField as keyof AgentTableRow,
    sortDirection
  );

  // Pagination values
  const totalPages: number = meta.totalPages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button size="sm" asChild>
          <Link href="/dashboard/super-admin/inbound/agent-management/new">
            Create Agent
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {tableHeader.map(({ key }) => (
              <TableHeaderItem
                key={key}
                prop={key}
                currentSort={sortField}
                sortDirection={sortDirection}
              />
            ))}
            <th className="">Action</th>
          </TableRow>
        </TableHeader>

        <TableBody>
          {sorted.map((item: AgentTableRow) => {
            return (
              <TableRow key={item.id}>
                {tableHeader.map(({ key }) => (
                  <TableBodyItem key={key}>{item[key] ?? "N/A"}</TableBodyItem>
                ))}
                <td>
                  <div className="flex justify-center">
                    <Button size="sm" asChild variant="ghost">
                      <Link
                        href={`/dashboard/super-admin/inbound/agent-management/${item.id.trim()}?service=${encodeURIComponent(
                          item.serviceName.trim()
                        )}&phone=${encodeURIComponent(
                          formatPhoneNumber(item.phoneNumber)
                        )}&message=${encodeURIComponent(
                          item.first_message?.trim() ?? ""
                        )}&serviceId=${encodeURIComponent(
                          item.serviceId
                        )}&agentId=${encodeURIComponent(item.agentId)}`}
                      >
                        <SquarePen />
                      </Link>
                    </Button>
                  </div>
                </td>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Pagination totalPages={totalPages} currentPage={page} pageSize={limit} />
    </div>
  );
}

const formatPhoneNumber = (num: string) => {
  if (!num) return "";
  const cleaned = num.trim(); // remove trailing/leading spaces
  if (cleaned.startsWith("+")) return cleaned;
  return "+" + cleaned; // ensure + exists
};
