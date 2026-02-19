"use client";

import { cn } from "@/lib/utils";
import { LucideChevronDown, LucideLoader } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useTransition } from "react";

type SortDirection = "asc" | "desc" | null;

type TableHeaderItemProps = {
  prop: string;
  currentSort: string | null;
  sortDirection: SortDirection;
};

export function Table({
  children,
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <>
      <table
        className={cn(
          "table-auto border-collapse border border-gray-500 min-w-full text-gray-300",
          className,
        )}
        {...props}
      >
        {children}
      </table>
    </>
  );
}

export function TableHeader({ children }: React.ComponentProps<"thead">) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: React.ComponentProps<"tbody">) {
  return <tbody>{children}</tbody>;
}

export function TableHeaderItem({
  prop,
  currentSort,
  sortDirection,
}: TableHeaderItemProps) {
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isActive = currentSort === prop;

  let nextSort: "asc" | "desc" | null = "asc";
  if (isActive) {
    if (sortDirection === "asc") nextSort = "desc";
    else if (sortDirection === "desc") nextSort = null;
  }

  const handleSort = (e: React.MouseEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams?.toString() || "");
    if (nextSort) params.set("sort", `${prop}:${nextSort}`);
    else params.delete("sort");

    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <th
      className={cn(
        "text-left cursor-pointer bg-gray-800 group py-1",
        isActive ? "bg-gray-800" : "hover:bg-gray-800",
      )}
    >
      <button
        onClick={handleSort}
        className={cn(
          "truncate p-2 cursor-pointer inline-flex gap-1.5 items-center leading-0 font-semibold relative capitalize hover:text-white active:text-white after:absolute after:-inset-2",
          { "text-white": isActive },
        )}
      >
        <div className="flex-1 whitespace-nowrap text-gray-100">
          {formatHeaderLabel(prop)}
        </div>
        <span
          className={cn(
            "print:hidden text-gray-100 translate-y-px transition transition-200 group-hover:opacity-100 rounded size-4 flex flex-wrap items-center justify-center",
            { "opacity-100 group-hover:opacity-100 bg-slate-900/80": isActive },
          )}
        >
          {isPending ? (
            <LucideLoader className="animate-spin" size={14} />
          ) : (
            <LucideChevronDown
              size={14}
              className={cn(
                "transition-transform",
                sortDirection === "desc" ? "rotate-180" : "",
                isActive
                  ? "opacity-100 text-white"
                  : "opacity-0 group-hover:opacity-100",
              )}
            />
          )}
        </span>
      </button>
    </th>
  );
}

export function TableRow({ children, className }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-gray-400 hover:bg-gray-800/80", className)}
    >
      {children}
    </tr>
  );
}

export function TableBodyItem({
  children,
  ...props
}: React.ComponentProps<"td">) {
  return (
    <td className="px-2 py-1.5" {...props}>
      {children}
    </td>
  );
}

function formatHeaderLabel(key: string): string {
  return key
    .replace(/[-_]/g, " ") // convert kebab/snake → space
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // split camelCase
    .replace(/\s+/g, " ") // collapse extra spaces
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize words
}
