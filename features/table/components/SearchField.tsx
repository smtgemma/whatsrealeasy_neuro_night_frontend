"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LucideLoader, LucideSearch } from "lucide-react";

interface SearchFieldProps {
  initialValue?: string;
  debounceTime?: number;
}

export default function SearchField({
  initialValue,
  debounceTime = 500,
}: SearchFieldProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialValue || "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }, debounceTime);

    return () => clearTimeout(handler);
  }, [query, debounceTime, router]);

  return (
    <div className="inline-flex items-center border border-slate-500 gap-1 pr-3 rounded overflow-hidden focus-within:border-primary">
      <div className="size-7 inline-flex items-center justify-center bg-slate-500">
        {isPending ? (
          <LucideLoader size={14} className="animate-spin" />
        ) : (
          <LucideSearch size={14} />
        )}
      </div>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-none bg-transparent outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 w-52 text-gray-100"
      />
    </div>
  );
}
