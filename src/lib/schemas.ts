import { z } from "zod";

const optionalUrl = z
  .union([z.string().trim().url("Image URL must be a valid URL").max(2048), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

const optionalDescription = z
  .union([z.string().trim().min(1, "Description cannot be empty").max(500), z.literal("")])
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const productStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const productFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(1, "Description is required").max(2000),
  categoryId: z.string().trim().min(1, "Category is required").max(64),
  price: z.coerce.number().int("Price must be an integer VND amount").min(1),
  imageUrl: optionalUrl,
  status: productStatusSchema.default("ACTIVE"),
});

export const categoryCreateSchema = z.object({
  categoryId: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase slug format, e.g. electronics or home-decor")
    .max(64),
  name: z.string().trim().min(2).max(80),
  description: optionalDescription,
});

export const categoryUpdateSchema = categoryCreateSchema.omit({ categoryId: true });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
export type CategoryCreateInput = z.input<typeof categoryCreateSchema>;
export type CategoryCreateValues = z.output<typeof categoryCreateSchema>;
export type CategoryUpdateValues = z.output<typeof categoryUpdateSchema>;
