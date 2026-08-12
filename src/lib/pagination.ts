import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSize,
  type PaginationParams,
} from "@/lib/types";

export type PageSearchParams = Record<string, string | string[] | undefined>;

export function parsePaginationSearchParams(searchParams: PageSearchParams): Required<Pick<PaginationParams, "limit">> &
  Pick<PaginationParams, "cursor"> {
  const parsedLimit = Number(readFirst(searchParams.limit));
  const limit = isPageSize(parsedLimit) ? parsedLimit : DEFAULT_PAGE_SIZE;
  const cursor = readFirst(searchParams.cursor);

  return {
    limit,
    ...(cursor ? { cursor } : {}),
  };
}

export function getPaginationHref(
  pathname: string,
  params: PaginationParams,
): string {
  const query = new URLSearchParams();
  query.set("limit", String(params.limit ?? DEFAULT_PAGE_SIZE));

  if (params.cursor) {
    query.set("cursor", params.cursor);
  }

  return `${pathname}?${query.toString()}`;
}

export function isPageSize(value: number): value is PageSize {
  return PAGE_SIZE_OPTIONS.includes(value as PageSize);
}

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
