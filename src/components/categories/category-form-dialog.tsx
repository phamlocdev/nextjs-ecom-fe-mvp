"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCategoryAction, updateCategoryAction } from "@/app/actions";
import {
  categoryCreateSchema,
  type CategoryCreateInput,
  type CategoryCreateValues,
} from "@/lib/schemas";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const emptyCategory: CategoryCreateInput = {
  categoryId: "",
  name: "",
  description: undefined,
};

function actionErrorDescription(details?: string[]) {
  return details && details.length > 0 ? details.join("\n") : undefined;
}

export function CategoryFormDialog({ category }: { category?: Category }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = Boolean(category);

  const form = useForm<CategoryCreateInput, unknown, CategoryCreateValues>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: emptyCategory,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset(
      category
        ? {
            categoryId: category.categoryId,
            name: category.name,
            description: category.description,
          }
        : emptyCategory
    );
  }, [category, form, open]);

  function onSubmit(values: CategoryCreateValues) {
    startTransition(async () => {
      const result = category
        ? await updateCategoryAction(category.categoryId, values)
        : await createCategoryAction(values);

      if (!result.ok) {
        toast.error(result.message, { description: actionErrorDescription(result.details) });
        return;
      }

      toast.success(category ? "Category updated" : "Category created");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant={isEdit ? "ghost" : "default"} size={isEdit ? "icon-sm" : "default"} onClick={() => setOpen(true)}>
        {isEdit ? <Pencil /> : <Plus />}
        <span className={isEdit ? "sr-only" : ""}>{isEdit ? "Edit category" : "New category"}</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit category" : "Create category"}</DialogTitle>
            <DialogDescription>
              Category IDs are stable lowercase slugs and cannot be changed after creation.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {!isEdit ? (
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category ID</Label>
                <Input
                  id="categoryId"
                  placeholder="electronics"
                  aria-invalid={Boolean("categoryId" in form.formState.errors && form.formState.errors.categoryId)}
                  {...form.register("categoryId" as keyof CategoryCreateValues)}
                />
                {"categoryId" in form.formState.errors && form.formState.errors.categoryId ? (
                  <p className="text-xs text-destructive">{form.formState.errors.categoryId.message}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Category ID</Label>
                <Input value={category?.categoryId ?? ""} disabled />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...form.register("description")} />
              {form.formState.errors.description ? (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                <Save />
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
