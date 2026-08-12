import { listAllCategories, listProducts } from "@/lib/api";
import { toErrorSummary } from "@/lib/format";
import { parsePaginationSearchParams, type PageSearchParams } from "@/lib/pagination";
import type { Category, PaginatedResponse, Product } from "@/lib/types";
import { PaginationControls } from "@/components/pagination/pagination-controls";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { ProductsTable } from "@/components/products/products-table";
import { ResourceError } from "@/components/resource-error";

async function safeLoad<T>(loader: () => Promise<T>) {
  try {
    return { data: await loader(), error: null };
  } catch (error) {
    return { data: null, error: toErrorSummary(error) };
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const pagination = parsePaginationSearchParams((await searchParams) ?? {});
  const [productsResult, categoriesResult] = await Promise.all([
    safeLoad<PaginatedResponse<Product>>(() => listProducts(pagination)),
    safeLoad<Category[]>(listAllCategories),
  ]);
  const productsPage = productsResult.data;
  const products = productsPage?.items ?? [];
  const categories = categoriesResult.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage product records through the backend `/products` API.</p>
        </div>
        <ProductFormDialog categories={categories} />
      </div>

      {productsResult.error ? (
        <ResourceError title="Products endpoint error" message={productsResult.error.message} details={productsResult.error.details} />
      ) : null}
      {categoriesResult.error ? (
        <ResourceError
          title="Categories endpoint error"
          message={categoriesResult.error.message}
          details={categoriesResult.error.details}
        />
      ) : null}

      {!productsResult.error ? (
        <>
          <ProductsTable products={products} categories={categories} />
          {productsPage ? (
            <PaginationControls
              limit={productsPage.limit}
              currentPage={productsPage.currentPage}
              previousCursor={productsPage.previousCursor}
              nextCursor={productsPage.nextCursor}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
