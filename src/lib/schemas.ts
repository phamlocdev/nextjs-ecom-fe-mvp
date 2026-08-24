import { z } from 'zod'

const optionalUrl = z
  .union([z.string().trim().url('Image URL must be a valid URL').max(2048), z.literal('')])
  .optional()
  .transform((value) => (value === '' ? undefined : value))

const optionalDescription = z
  .union([z.string().trim().min(1, 'Description cannot be empty').max(500), z.literal('')])
  .optional()
  .transform((value) => (value === '' ? undefined : value))

export const productStatusSchema = z.enum(['ACTIVE', 'INACTIVE'])

export const productFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  categoryId: z.string().trim().min(1, 'Category is required').max(64),
  price: z.coerce.number().int('Price must be an integer VND amount').min(1),
  imageUrl: optionalUrl,
  status: productStatusSchema.default('ACTIVE'),
})

export const categoryCreateSchema = z.object({
  categoryId: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase slug format, e.g. electronics or home-decor',
    )
    .max(64),
  name: z.string().trim().min(2).max(80),
  description: optionalDescription,
})

export const categoryUpdateSchema = categoryCreateSchema.omit({ categoryId: true })

export const inventoryAdjustmentSchema = z.object({
  availableQuantity: z.coerce.number().int('Quantity must be an integer').min(0),
})

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(64, 'Username must be at most 64 characters')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dots, underscores, or hyphens')
  .refine((value) => !value.includes('@'), 'Username cannot be an email address')

const cognitoPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')

export const signInSchema = z.object({
  username: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const signUpSchema = z
  .object({
    username: usernameSchema,
    email: z.string().trim().email('Email must be valid').max(254),
    password: cognitoPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const confirmSignUpSchema = z.object({
  username: usernameSchema,
  confirmationCode: z.string().trim().min(1, 'Confirmation code is required'),
})

export const forgotPasswordSchema = z.object({
  username: z.string().trim().min(1, 'Email or username is required'),
})

export const confirmForgotPasswordSchema = z
  .object({
    confirmationCode: z.string().trim().min(1, 'Reset code is required'),
    newPassword: cognitoPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ProductFormInput = z.input<typeof productFormSchema>
export type ProductFormValues = z.output<typeof productFormSchema>
export type CategoryCreateInput = z.input<typeof categoryCreateSchema>
export type CategoryCreateValues = z.output<typeof categoryCreateSchema>
export type CategoryUpdateValues = z.output<typeof categoryUpdateSchema>
export type InventoryAdjustmentInput = z.input<typeof inventoryAdjustmentSchema>
export type InventoryAdjustmentValues = z.output<typeof inventoryAdjustmentSchema>
export type SignInValues = z.output<typeof signInSchema>
export type SignUpInput = z.input<typeof signUpSchema>
export type SignUpValues = z.output<typeof signUpSchema>
export type ConfirmSignUpValues = z.output<typeof confirmSignUpSchema>
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>
export type ConfirmForgotPasswordValues = z.output<typeof confirmForgotPasswordSchema>
