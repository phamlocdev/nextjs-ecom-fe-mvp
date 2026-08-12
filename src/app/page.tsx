import Link from "next/link";
import { Activity, AlertCircle, ArrowRight, Package, Tags } from "lucide-react";
import { listAllCategories, listAllProducts } from "@/lib/api";
import { formatVnd, toErrorSummary } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { ResourceError } from "@/components/resource-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function safeLoad<T>(loader: () => Promise<T>) {
  try {
    return { data: await loader(), error: null };
  } catch (error) {
    return { data: null, error: toErrorSummary(error) };
  }
}

export default async function DashboardPage() {
  const [productsResult, categoriesResult] = await Promise.all([safeLoad(listAllProducts), safeLoad(listAllCategories)]);

  const products = productsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const activeProducts = products.filter((product) => product.status === "ACTIVE").length;
  const inventoryValue = products.reduce((sum, product) => sum + product.price, 0);
  const orphanProducts = products.filter(
    (product) => !categories.some((category) => category.categoryId === product.categoryId)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview for products and categories stored through the NestJS API.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/categories" className={cn(buttonVariants({ variant: "outline" }))}>
            Categories
            <ArrowRight />
          </Link>
          <Link href="/products" className={cn(buttonVariants())}>
            Products
            <ArrowRight />
          </Link>
        </div>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Products" value={products.length.toString()} icon={Package} detail={`${activeProducts} active`} />
        <MetricCard title="Categories" value={categories.length.toString()} icon={Tags} detail="Stable categoryId slugs" />
        <MetricCard title="Catalog Value" value={formatVnd(inventoryValue)} icon={Activity} detail="Sum of product prices" />
        <MetricCard
          title="Unmatched Refs"
          value={orphanProducts.toString()}
          icon={AlertCircle}
          detail="Products with missing category"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RecentProducts products={products.slice(0, 5)} />
        <RecentCategories categories={categories.slice(0, 5)} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function RecentProducts({ products }: { products: Product[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Products</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products loaded.</p>
        ) : (
          products.map((product) => (
            <div key={product.productId} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">{formatVnd(product.price)}</p>
              </div>
              <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>{product.status}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function RecentCategories({ categories }: { categories: Category[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories loaded.</p>
        ) : (
          categories.map((category) => (
            <div key={category.categoryId} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{category.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{category.categoryId}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
