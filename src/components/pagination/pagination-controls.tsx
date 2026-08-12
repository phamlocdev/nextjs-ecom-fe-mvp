"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSize,
} from "@/lib/types";
import { getPaginationHref, isPageSize } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaginationControlsProps = {
  limit: PageSize;
  currentPage: number;
  previousCursor: string | null;
  nextCursor: string | null;
};

export function PaginationControls({
  limit,
  currentPage,
  previousCursor,
  nextCursor,
}: PaginationControlsProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLimitChange(value: string | null) {
    const nextLimit = Number(value ?? DEFAULT_PAGE_SIZE);
    if (isPageSize(nextLimit)) {
      router.push(getPaginationHref(pathname, { limit: nextLimit }));
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page</span>
        <Select value={String(limit)} onValueChange={handleLimitChange}>
          <SelectTrigger size="sm" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((pageSize) => (
              <SelectItem key={pageSize} value={String(pageSize)}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-2">
        {previousCursor ? (
          <Link
            href={getPaginationHref(pathname, { limit, cursor: previousCursor })}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ChevronLeft />
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50",
            )}
          >
            <ChevronLeft />
            Previous
          </span>
        )}

        <span className="flex h-7 min-w-20 items-center justify-center rounded-md border bg-background px-2.5 text-sm font-medium">
          Page {currentPage}
        </span>

        {nextCursor ? (
          <Link
            href={getPaginationHref(pathname, { limit, cursor: nextCursor })}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Next
            <ChevronRight />
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none opacity-50",
            )}
          >
            Next
            <ChevronRight />
          </span>
        )}
      </div>
    </div>
  );
}
