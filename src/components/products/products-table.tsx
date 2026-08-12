import { ExternalLink } from "lucide-react";
import { formatDateTime, formatVnd } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { ProductFormDialog } from "@/components/products/product-form-dialog";

export function ProductsTable({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const categoryNames = new Map(categories.map((category) => [category.categoryId, category.name]));

  if (products.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center">
        <p className="font-medium">No products yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Create the first product to populate the table.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.productId}>
              <TableCell>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{product.name}</p>
                    {product.imageUrl ? (
                      <a href={product.imageUrl} target="_blank" rel="noreferrer" title="Open image URL">
                        <ExternalLink className="size-3.5 text-muted-foreground" />
                      </a>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{product.productId}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="text-sm">{categoryNames.get(product.categoryId) ?? product.categoryId}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{product.categoryId}</p>
                </div>
              </TableCell>
              <TableCell>{formatVnd(product.price)}</TableCell>
              <TableCell>
                <Badge variant={product.status === "ACTIVE" ? "default" : "secondary"}>{product.status}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDateTime(product.updatedAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <ProductFormDialog product={product} categories={categories} />
                  <DeleteProductDialog product={product} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
